const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json');
noblox.setCookie(config.sessionCookie)
const { Op } = require("sequelize");


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

        const officerRanks = (await db.Ranks.findAll({ where: { guild_id: interaction.guild.id, is_officer: true }})).sort((a, b) => a.rank_index - b.rank_index)
        let officers = await db.Users.findAll({ where: { guild_id: interaction.guild.id, rank_id: officerRanks.map(r => r.id) }})

        let fields = []

        let totalAttendes = 0
        let totalTrainingAttendes = 0
        let totalPatrolAttendes = 0

        const divsEvents = await db.Events.findAll({ where: { guild_id: interaction.guild.id, createdAt: { [Op.lt]: new Date(new Date() - start), [Op.gt]: new Date(new Date() - end) } } } )
        const divsTrainings = divsEvents.filter(e => e.type === "training")
        const divsPatrols = divsEvents.filter(e => e.type === "patrol")


        for (let i = 0; i < officers.length; i++) {
            
            const officer = officers[i]
            let description = ""
            const title = '\u200b'

            const events = divsEvents.filter(e => e.host === officer.user_id)
            const trainings = divsTrainings.filter(e => e.host === officer.user_id)
            const patrols = divsPatrols.filter(e => e.host === officer.user_id)
            

            const officersTotalAttendes = events.reduce((acc, event) => acc + event.amount_of_attendees + (event.cohost ? 1 : 0), 0)
            totalAttendes += officersTotalAttendes

            const trainingAttendes = trainings.reduce((acc, event) => acc + event.amount_of_attendees + (event.cohost ? 1 : 0), 0)
            totalTrainingAttendes += trainingAttendes
            const patrolAttendes = patrols.reduce((acc, event) => acc + event.amount_of_attendees + (event.cohost ? 1 : 0), 0)
            totalPatrolAttendes += patrolAttendes


            const eventsAttended = divsEvents.filter(e => officer.events.split(",").map(Number).includes(e.id))
            const eventsCohosted = divsEvents.filter(e => e.cohost === officer.user_id)

            description += `**${events.length}** events hosted. Avrage attendees *${events.length != 0 ? Math.round(officersTotalAttendes/events.length) : "0"}*\n`
            description += `   - *${trainings.length}* trainings (${events.length != 0 ? Math.round(trainings.length/events.length*100) : "0"}%) Avrage attendance *${trainings.length != 0 ? Math.round(trainingAttendes/trainings.length * 10)/10 : "0"}*\n` 
            description += `   - *${patrols.length}* patrols (${events.length != 0 ? Math.round(patrols.length/events.length*100) : "0"}%) Avrage attendance *${patrols.length != 0 ? Math.round(patrolAttendes/patrols.length*10)/10 : "0"}*\n`
            description += `   - *${events.length - trainings.length - patrols.length}* other events (${events.length ? Math.round((events.length - trainings.length - patrols.length)/events.length*100) : "0"}%) Avrage attendance *${events.length - trainings.length - patrols.length != 0 ? Math.round(((officersTotalAttendes - trainingAttendes - patrolAttendes) / (events.length - trainings.length - patrols.length)) * 10)/10 : "0"}*\n\n`
            description += `${officersTotalAttendes} total attendees\n`
            description += `**${events.length != 0 ? Math.round(officersTotalAttendes/events.length) : "0"}** average attendees per event\n`
            description += `${eventsAttended.length} events attended\n`
            description += `${eventsCohosted.length} events cohosted\n`

            fields.push({ name: title, value: '<@' + officer.user_id + ">\n" + description, inline: true })

        };
        
        interaction.editReply("Done processing!")

        let embed = new EmbedBuilder()
            .setTitle("Quota")
            .setDescription(`Total attendees: ${totalAttendes}\nTotal trainings: ${totalTrainingAttendes}\nTotal patrols: ${totalPatrolAttendes}`)
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

        return interaction.followUp({ embeds: [embed] })
    }
}