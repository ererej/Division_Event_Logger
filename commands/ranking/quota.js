const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const { sequelize, Officers, Users, Events } = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json');
noblox.setCookie(config.sessionCookie)
const { Op } = require("sequelize");
const generateGraph = require('../../functions/generateGraph.js')
const fs = require('fs');
const { premiumLock } = require('../logging/log.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('quota')
        .setDescription('quota test')
        .addStringOption(option => 
            option.setName('timerange')
                .setDescription('The time range to check the quota for')
                .addChoices(
                    { name: 'week', value: "0, 7 * 24 * 60 * 60 * 1000" },
                    { name: 'month', value: "0, 30 * 24 * 60 * 60 * 1000" },
                    { name: 'last week', value: "7 * 24 * 60 * 60 * 1000, 2 * 7 * 24 * 60 * 60 * 1000" },
                    { name: 'last month', value: "30 * 24 * 60 * 60 * 1000, 2 * 30 * 24 * 60 * 60 * 1000" }
                )
        )
        ,
    
    testerLock: true,
    premiumLock: true,

    async execute(interaction) {
        await interaction.reply("Processing...")
        const embeded_error = new EmbedBuilder().setColor([255,0,0]) 

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            return interaction.editReply({ embeds: [embeded_error]});
        }

        const timerange = interaction.options.getString('timerange')
        let [start, end] = [0, 7 * 24 * 60 * 60 * 1000]
        if (timerange ) {
            [start, end] = timerange.split(", ").map(Number)
        }

        const officers = await Officers.findAll({
            where: { guild_id: interaction.guild.id },
            include: [{
                model: Users,
                as: 'user',
                required: true,
                on: sequelize.literal('`officers`.`user_id` = `user`.`user_id` AND `officers`.`guild_id` = `user`.`guild_id`'),
            }],
        });


        let fields = []

        let totalAttendes = 0
        let totalTrainingAttendes = 0
        let totalPatrolAttendes = 0


        let totalAttendesHistory = [5, 4, 3, 2, 1, 0]
        totalAttendesHistory = await Promise.all(totalAttendesHistory.map(async (index) => {
            const events = await db.Events.findAll({ 
                where: { 
                    guild_id: interaction.guild.id, 
                    createdAt: { 
                        [Op.lt]: new Date(new Date() - (start * index)), 
                        [Op.gt]: new Date(new Date() - (start * (index-1))) 
                    } 
                } 
            });
            return events.reduce((acc, event) => acc + event.amount_of_attendees, 0) ?? 0;
        }));

        

        const divsEvents = await db.Events.findAll({ where: { guild_id: interaction.guild.id, createdAt: { [Op.lt]: new Date(new Date() - start), [Op.gt]: new Date(new Date() - end) } } } )
        const divsTrainings = divsEvents.filter(e => e.type === "training")
        const divsTrainingsWith5PlusAttendees = divsTrainings.filter(e => e.amount_of_attendees >= 4) //the host is not included in amount_of_attendees but is counted twords competitions
        const divsTrainingWithHighestAttendance = divsTrainings.reduce((max, event) => event.amount_of_attendees > max.amount_of_attendees ? event : max, divsTrainings[0]);
        
        const divsPatrols = divsEvents.filter(e => e.type === "patrol")
        const divsPatrolWith5PlusAttendees = divsPatrols.filter(e => e.amount_of_attendees >= 4 ) //the host is not included in amount_of_attendees but is counted twords competitions
        const divsPatrolWithHighestAttendance = divsPatrols.reduce((max, event) => event.amount_of_attendees > max.amount_of_attendees ? event : max, divsPatrols[0]);
        
        const rallysbeforeraid = divsEvents.filter(e => e.type === "rallybeforeraid")
        const rallyWithHighestAttendance = rallysbeforeraid.reduce((max, event) => event.amount_of_attendees > max.amount_of_attendees ? event : max, rallysbeforeraid[0]);
        const rallyafterraid = divsEvents.filter(e => e.type === "rallyafterraid")
        const totalAttendesAtRallys = rallysbeforeraid.reduce((acc, event) => acc + event.amount_of_attendees, 0)
        const totalOfficersAtRallys = rallysbeforeraid.reduce((acc, event) => acc + event.amount_of_officers, 0)


        for (let i = 0; i < officers.length; i++) {
            
            const officer = officers[i]
            let description = ""
            const title = '\u200b'

            const events = divsEvents.filter(e => e.host === officer.user_id)
            const trainings = divsTrainings.filter(e => e.host === officer.user_id)
            const patrols = divsPatrols.filter(e => e.host === officer.user_id)
            

            const officersTotalAttendes = events.reduce((acc, event) => acc + event.amount_of_attendees, 0)
            totalAttendes += officersTotalAttendes

            const trainingAttendes = trainings.reduce((acc, event) => acc + event.amount_of_attendees, 0)
            totalTrainingAttendes += trainingAttendes
            const patrolAttendes = patrols.reduce((acc, event) => acc + event.amount_of_attendees, 0)
            totalPatrolAttendes += patrolAttendes


            const eventsAttended = divsEvents.filter(e => officer.user.events.split(",").map(Number).includes(e.id))
            const eventsCohosted = divsEvents.filter(e => e.cohost === officer.user_id)

            const rallysBeforeRaidAttended = rallysbeforeraid.filter(e => e.attendees.split(",").includes(officer.user_id) || e.host === officer.user_id)
            const rallysAfterRaidAttended = rallyafterraid.filter(e => e.attendees.split(",").includes(officer.user_id) || e.host === officer.user_id)


            description += `**${events.length}** events hosted (${divsEvents.length ? Math.round(events.length * 100 / divsEvents.length) : 0}%). Average attendees *${events.length != 0 ? Math.round(officersTotalAttendes/events.length) : 0}*\n`
            description += `   - *${trainings.length}* trainings (${events.length != 0 ? Math.round(trainings.length * 100/events.length) : 0}%) Average attendance *${trainings.length != 0 ? Math.round(trainingAttendes/trainings.length * 10)/10 : 0}*\n\n` 
            description += `   - *${patrols.length}* patrols (${events.length != 0 ? Math.round(patrols.length/events.length*100) : 0}%) Average attendance *${patrols.length != 0 ? Math.round(patrolAttendes/patrols.length*10)/10 : 0}*\n\n`
            description += `   - *${events.length - trainings.length - patrols.length}* other events (${events.length ? Math.round((events.length - trainings.length - patrols.length)*100/events.length) : 0}%) Average attendance *${events.length - trainings.length - patrols.length != 0 ? Math.round(((officersTotalAttendes - trainingAttendes - patrolAttendes) * 10 / (events.length - trainings.length - patrols.length)) )/10 : 0}*\n\n`
            description += `   - *${rallysbeforeraid.filter(e => e.host === officer.user_id).length}* rallys hosted\n\n`
            description += `${officersTotalAttendes} total attendees\n`
            description += `**${events.length != 0 ? Math.round(officersTotalAttendes/events.length) : "0"}** average attendees per event\n`
            description += `${eventsAttended.length} events attended\n`
            description += `${eventsCohosted.length} events cohosted\n`
            description += `rallys before raid attended: ${rallysBeforeRaidAttended.length}\n`
            description += `rallys after raid attended: ${rallysAfterRaidAttended.length}\n`

            fields.push({ name: title, value: '<@' + officer.user_id + ">\n" + description, inline: true })

        };
        
        interaction.editReply("Done processing!")


        let embed = new EmbedBuilder()
            .setTitle("Quota")
            .setDescription(`Total events: ${divsEvents.length} \nTotal attendees: ${totalAttendes} average attendees: ${divsEvents && totalAttendes ? Math.round(totalAttendes*10 / divsEvents.length)/10 : 0} \nTotal trainings: ${divsTrainings.length} (${divsEvents.length != 0 ? Math.round(divsTrainings.length * 100 / divsEvents.length) : 0}%) Trainings with 5+ attending: *${divsTrainingsWith5PlusAttendees.length}* Biggest training: **${divsTrainingWithHighestAttendance ? divsTrainingWithHighestAttendance.amount_of_attendees + 1/*+ the host*/ : 0}** Total attendees: ${totalTrainingAttendes} \nTotal patrols: ${divsPatrols.length} (${divsEvents.length != 0 ? Math.round(divsTrainings.length * 100 / divsEvents.length) : 0}%) Patrols with 5+ attending: *${divsPatrolWith5PlusAttendees.length}* Biggest patrol: **${divsPatrolWithHighestAttendance ? divsPatrolWithHighestAttendance.amount_of_attendees + 1 /*+ the host*/ : 0}** Total attendees: ${totalPatrolAttendes} \nBiggest rally: **${rallyWithHighestAttendance ? rallyWithHighestAttendance.amount_of_attendees + 1/*+ the host */ : 0} **Average rally attendees: ${rallysbeforeraid.length ? totalAttendesAtRallys / rallysbeforeraid.length : 0} \nAverage amount of officers at rallys: ${rallysbeforeraid.length ? totalOfficersAtRallys / rallysbeforeraid.length : 0}`)
            .setColor([0, 255, 0])
            

        let length = 5 + 115

        for (let field of fields) {
            if (length + field.name.length + field.value.length > 6000) {
                interaction.followUp({ embeds: [embed] })
                embed = new EmbedBuilder()
                .setColor([0, 255, 0])
                length = 0
            }
            length += field.name.length + field.value.length
            embed.addFields(field)
        };

        let graphs = []
        graphs.push(await generateGraph({ labels: ['trainings', 'patrols', 'other'], colors: ["rgb(255,0,0)", "rgb(0,0,255)", "rgb(0,255,0)"], values: [divsTrainings.length, divsPatrols.length, divsEvents.length - divsTrainings.length - divsPatrols.length] }, 'doughnut', 300, 300))
        graphs.push(await generateGraph({ title: "attendees over time", labels: ['before last', 'last', 'current'], values: totalAttendesHistory}, 'line', 300, 500 ))

        await interaction.followUp({ embeds: [embed], files: graphs.map(g => g.attachment) })

        //remove the graph files
        for (let graph of graphs) {
            fs.unlinkSync(graph.filePath)
        }

    }
}