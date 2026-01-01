const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json');
noblox.setCookie(config.sessionCookie)
const { Op } = require("sequelize");
const generateGraph = require('../../utils/generateGraph.js')
const fs = require('fs');
const { type } = require('os');


module.exports = {
	data: new SlashCommandBuilder()
        .setName('quota')
        .setDescription('quota test')
        .addStringOption(option => 
            option.setName('timerange')
                .setDescription('The time range to check the quota for')
                .addChoices(
                    { name: 'week', value: JSON.stringify([0, 7 * 24 * 60 * 60 * 1000]) },
                    { name: 'month', value: JSON.stringify([0, 30 * 24 * 60 * 60 * 1000]) },
                    { name: 'last whole week', value: JSON.stringify(["last whole week", 7 * 24 * 60 * 60 * 1000]) },
                    { name: 'last whole month', value: JSON.stringify(["last whole month", 30 * 24 * 60 * 60 * 1000]) },
                    { name: 'current week', value: JSON.stringify(["current week", 0]) },
                    { name: 'current month', value: JSON.stringify(["current month", 0]) },
                    { name: 'last week', value: JSON.stringify([7 * 24 * 60 * 60 * 1000, 2 * 7 * 24 * 60 * 60 * 1000]) },
                    { name: 'last month', value: JSON.stringify([30 * 24 * 60 * 60 * 1000, 2 * 30 * 24 * 60 * 60 * 1000]) },
                    { name: 'previous whole week', value: JSON.stringify(["previous whole week", 7 * 24 * 60 * 60 * 1000]) },
                    { name: 'previous whole month', value: JSON.stringify(["previous whole month", 30 * 24 * 60 * 60 * 1000]) },
                    { name: 'last whole year', value: JSON.stringify(["last whole year", 365 * 24 * 60 * 60 * 1000]) },
                    { name: 'all time', value: JSON.stringify([0, Date.now()]) }
                )
        )
        .addBooleanOption(option =>
            option.setName('show_officer_data')
                .setDescription('Should the officer data be shown?')
        )
        .addUserOption(option =>
            option.setName('officer')
                .setDescription('The officer to check the quota for')
                .setRequired(false)
        )
        ,
    
    premiumLock: true,

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */

    async execute(interaction) {
        await interaction.reply("fetching data")
        const embeded_error = new EmbedBuilder().setColor([255,0,0]) 

        let selectedOfficer = interaction.options.getUser('officer')
        let showServerWideData = true       
        

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            if (selectedOfficer && selectedOfficer.id !== interaction.user.id) {
                embeded_error.setDescription("You can only check other peoples quota as you are not an admin!")
                return await interaction.editReply({ embeds: [embeded_error] });
            }
            selectedOfficer = interaction.user
            showServerWideData = false
        }

        const showOfficerData = selectedOfficer ? false : interaction.options.getBoolean('show_officer_data')


        const timerange = interaction.options.getString('timerange')
        let [start, end] = [0, 7 * 24 * 60 * 60 * 1000]
        let startTime;
        let endTime;
        if (timerange ) {
            
            start = JSON.parse(timerange)[0]
            end = JSON.parse(timerange)[1]
            const today = new Date()
            if (start === "last whole week") {
                startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1 - 7)
                endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1)
            }
            if (start === "last whole month") {
                startTime = new Date(today.getFullYear(), today.getMonth() - 1)
                endTime = new Date(today.getFullYear(), today.getMonth(), 0)
                end = 30 * 24 * 60 * 60 * 1000
            }
            if (start === "current week") {
                startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1)
                endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1 + 7)
            }
            if (start === "current month") {
                startTime = new Date(today.getFullYear(), today.getMonth())
                endTime = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            }
            if (start === "previous whole week") {
                startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1 - 14)
                endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1 - 7)
            }
            if (start === "previous whole month") {
                startTime = new Date(today.getFullYear(), today.getMonth() - 2)
                endTime = new Date(today.getFullYear(), today.getMonth() - 1, 0)
            }
            if (start === "last whole year") {
                startTime = new Date(today.getFullYear() - 1, 0, 1)
                endTime = new Date(today.getFullYear() - 1, 11, 31)
            }
            if (start === "all time") {
                startTime = new Date(0)
                endTime = new Date()
            }
        }
        
        
        

        if (!startTime) {
            startTime =  new Date(new Date() - end)
        }
        if (!endTime) {
            endTime = new Date(new Date() - start)
        }
        
        
        let officers = await db.Officers.findAll({
            where: {
            guild_id: interaction.guild.id,
            [Op.or]: [
                { retired: null },
                { retired: { [Op.gt]: startTime }, createdAt: { [Op.lt]: endTime } }
            ]
            },
            include: [{
            model: db.Users,
            as: 'user',
            required: true,
            on: db.sequelize.literal('`officers`.`user_id` = `user`.`user_id` AND `officers`.`guild_id` = `user`.`guild_id`'),
            }],
        });

        // make sure duplicate officers are removed
        const uniqueOfficers = [];
        const uniqueOfficersIds = new Set();
        for (const officer of officers) {
            if (!uniqueOfficersIds.has(officer.user_id)) {
                uniqueOfficers.push(officer);
                uniqueOfficersIds.add(officer.user_id);
            }
        }
        officers = uniqueOfficers;

        officers.forEach(officer => {
            Object.setPrototypeOf(officer.user, db.Users.prototype);
        });

        async function sortOfficersByRank(officers) {
            // Retrieve ranks for all officers
            const officersWithRanks = await Promise.all(officers.map(async officer => {
                const rank = await officer.user.getRank();
                return { officer, rank_index: rank.rank_index };
            }));
        
            // Sort officers based on rank_index
            officersWithRanks.sort((a, b) => b.rank_index - a.rank_index);
        
            // Extract sorted officers
            return officersWithRanks.map(item => item.officer);
        }

        if (!selectedOfficer) {
            officers = await sortOfficersByRank(officers);
        }

        

        let totalAttendes = 0
        let totalTrainingAttendes = 0
        let totalPatrolAttendes = 0



        // per day data
        let totalAttendesHistoryPerDay = [0,0,0,0,0,0]
        let averageAttendesHistoryPerDay = [0,0,0,0,0,0]
        let amountOfEventsHistoryPerDay = [0,0,0,0,0,0]
        let dataRangeIndexesPerDay = []

        if (showServerWideData) {
        for (let i = (endTime - startTime)/(24 * 60 * 60 * 1000); i > 0; i--) {
            dataRangeIndexesPerDay.push(i)
        }

        dataRangeIndexesPerDay.forEach(async (index) => {
            
            const events = await db.Events.findAll({
                where: {
                    guild_id: interaction.guild.id,
                    createdAt: {
                        [Op.lt]: new Date(endTime - (24*60*60*1000 * (index - 1))),
                        [Op.gt]: new Date(endTime - (24*60*60*1000 * (index)))
                    },
                    [Op.not]: { [Op.or]: [
                        { type: "rallybeforeraid" },
                        { type: "rallyafterraid" }
                    ] },
                }
            })
            totalAttendesHistoryPerDay[dataRangeIndexesPerDay.indexOf(index)] = events.reduce((acc, event) => acc + event.amount_of_attendees, 0) ?? 0;
            averageAttendesHistoryPerDay[dataRangeIndexesPerDay.indexOf(index)] = events.length ? Math.round((totalAttendesHistoryPerDay[dataRangeIndexesPerDay.indexOf(index)] / events.length)*10) /10 : 0;
            amountOfEventsHistoryPerDay[dataRangeIndexesPerDay.indexOf(index)] = events.length;
        })
        }
        
    



        // per week data
        let totalAttendesHistoryPerWeek = [0,0,0,0,0,0]
        let averageAttendesHistoryPerWeek = [0,0,0,0,0,0]
        let amountOfEventsHistoryPerWeek = [0,0,0,0,0,0]
        let amountAtRallysHistoryPerWeek = [0,0,0,0,0,0]
        const dataRangeIndexesPerWeek = [5, 4, 3, 2, 1, 0]
        if (showServerWideData) {
        dataRangeIndexesPerWeek.forEach(async (index) => {
            const events = await db.Events.findAll({
                where: {
                    guild_id: interaction.guild.id,
                    createdAt: {
                        [Op.lt]: new Date(endTime - ((endTime - startTime) * (index))),
                        [Op.gt]: new Date(endTime - ((endTime - startTime) * (index + 1)))
                    },
                    // [Op.not]: { [Op.or]: [
                    //     { type: "rallybeforeraid" },
                    //     { type: "rallyafterraid" }
                    // ] },

                }
            });

            const rallys = events.filter(e => e.type === "rallybeforeraid")
            const eventsWithoutRallys = events.filter(e => e.type !== "rallybeforeraid" && e.type !== "rallyafterraid")
            const totalAttendesAtRallys = rallys.reduce((acc, event) => acc + event.amount_of_attendees, 0)
            amountAtRallysHistoryPerWeek[dataRangeIndexesPerWeek.indexOf(index)] = rallys.length ? Math.round(totalAttendesAtRallys*10/rallys.length)/10 : 0
            totalAttendesHistoryPerWeek[dataRangeIndexesPerWeek.indexOf(index)] = eventsWithoutRallys.reduce((acc, event) => acc + event.amount_of_attendees, 0) ?? 0;
            averageAttendesHistoryPerWeek[dataRangeIndexesPerWeek.indexOf(index)] = eventsWithoutRallys.length ? Math.round((totalAttendesHistoryPerWeek[dataRangeIndexesPerWeek.indexOf(index)] / events.length)*10) /10 : 0;
            amountOfEventsHistoryPerWeek[dataRangeIndexesPerWeek.indexOf(index)] = eventsWithoutRallys.length;
        });
        }




        const divsEvents = await db.Events.findAll({ where: { guild_id: interaction.guild.id, createdAt: { [Op.gt]: startTime, [Op.lt]: endTime } } } )
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


        //whole time frame data:
        let trainingMaps = {}
        divsTrainings.forEach(training => {
            if (!trainingMaps[training.game]) {
                trainingMaps[training.game] = 1
            } else {
                trainingMaps[training.game]++
            }
        })

        // console.log(Object.getOwnPropertyNames(officers[0].user).filter(function (p) {
        //     return typeof officers[0].user[p] === 'function';
        // }));
        // //-> ["random", "abs", "acos", "asin", "atan", "ceil", "cos", "exp", ...etc

        if (showOfficerData === false) {
            interaction.editReply("Done processing server wide data! Processing neccesary officer data...")
        } else {
            interaction.editReply("Done processing server wide data! processing officer data...")
        }
        
        let topTraningHost = {host: null, events: 0, score: 0}
        let topPatrolHost = {host: null, events: 0, score: 0}
        let officerFields = []
        let totalRecruits = 0   

        for (const officer of  officers) {
            if (!officer.retired) {
                const updateOfficerResponce = await officer.user.updateOfficer()
                
                if (!updateOfficerResponce && officer.retired > endTime) {
                    console.log("retiring officer " + officer.user_id + " in guild " + interaction.guild.id + " because they are not an officer anymore")
                }
            }
            
            let description = ""
            const title = '\u200b'

            const events = divsEvents.filter(e => e.host === officer.user_id)
            const trainings = divsTrainings.filter(e => e.host === officer.user_id)
            const patrols = divsPatrols.filter(e => e.host === officer.user_id)
            
            if (trainings.reduce((acc, event) => acc + 1 + Math.floor(event.amount_of_attendees / 5), 0) > topTraningHost.score) {
                topTraningHost.host = officer.user_id
                topTraningHost.events = trainings.length
                topTraningHost.score = trainings.reduce((acc, event) => acc + 1 + Math.floor(event.amount_of_attendees / 5), 0)
            }
            if (patrols.reduce((acc, event) => acc + 1 + Math.floor(event.amount_of_attendees / 5), 0) > topPatrolHost.score) {
                topPatrolHost.host = officer.user_id
                topPatrolHost.events = patrols.length
                topPatrolHost.score = patrols.reduce((acc, event) => acc + 1 + Math.floor(event.amount_of_attendees / 5), 0)
            }
            

            const officersTotalAttendes = events.reduce((acc, event) => acc + event.amount_of_attendees, 0)
            totalAttendes += officersTotalAttendes

            const trainingAttendes = trainings.reduce((acc, event) => acc + event.amount_of_attendees, 0)
            totalTrainingAttendes += trainingAttendes
            const patrolAttendes = patrols.reduce((acc, event) => acc + event.amount_of_attendees, 0)
            totalPatrolAttendes += patrolAttendes

            const lifeTimeRecruits = await db.Users.findAll({ where : { guild_id: interaction.guild.id, recruted_by: officer.user_id } })
            const recruits = lifeTimeRecruits.filter(e => e.join_date ? e.join_date > startTime  && e.join_date < endTime : e.createdAt > startTime && e.createdAt < endTime)
            totalRecruits += recruits.length
            const officersTotalTrainingLength = trainings.reduce((acc, event) => acc + (event.length ?? 0), 0)
            const officersTotalPatrolLength = patrols.reduce((acc, event) => acc + (event.length ?? 0), 0)

            if (showOfficerData === false && (!selectedOfficer || officer.user_id != selectedOfficer.id)) continue

            const amountOfEventsAttended = divsEvents.filter(e => officer.user.events.split(",").map(Number).includes(e.id))
            const eventsCohosted = divsEvents.filter(e => e.cohost === officer.user_id)

            const rallysBeforeRaidAttended = rallysbeforeraid.filter(e => e.attendees.split(",").includes(officer.user_id) || e.host === officer.user_id)
            const rallysAfterRaidAttended = rallyafterraid.filter(e => e.attendees.split(",").includes(officer.user_id) || e.host === officer.user_id)

            description += `<@&${officer.user.rank_id}> \n`
            description += `**${events.length}** events hosted (${divsEvents.length ? Math.round(events.length * 100 / divsEvents.length) : 0}%). Average attendees **${events.length != 0 ? Math.round(officersTotalAttendes/events.length * 10)/10 : 0}**\n`
            description += `   - *${trainings.length}* trainings (${events.length != 0 ? Math.round(trainings.length * 100/events.length) : 0}%) Average attendance *${trainings.length != 0 ? Math.round(trainingAttendes/trainings.length * 10)/10 : 0}* Average training length **${trainings.length ? officersTotalTrainingLength/trainings.length : 0}** Min\n\n` 
            description += `   - *${patrols.length}* patrols (${events.length != 0 ? Math.round(patrols.length/events.length*100) : 0}%) Average attendance *${patrols.length != 0 ? Math.round(patrolAttendes/patrols.length*10)/10 : 0}* \n\n`
            description += `   - *${events.length - trainings.length - patrols.length}* other events (${events.length ? Math.round((events.length - trainings.length - patrols.length)*100/events.length) : 0}%) Average attendance *${events.length - trainings.length - patrols.length != 0 ? Math.round(((officersTotalAttendes - trainingAttendes - patrolAttendes) * 10 / (events.length - trainings.length - patrols.length)) )/10 : 0}*\n\n`
            description += `   - *${rallysbeforeraid.filter(e => e.host === officer.user_id).length}* rallys hosted\n\n`
            description += `${officersTotalAttendes} total attendees\n`
            description += `${recruits.length} recruits (${lifeTimeRecruits.length} life time recruits)\n`
            description += `${amountOfEventsAttended.length} events attended\n`
            description += `${eventsCohosted.length} events cohosted\n`
            description += `${rallysBeforeRaidAttended.length} rallys before raid attended \n`
            description += `${rallysAfterRaidAttended.length} rallys after raid attended\n`

            officerFields.push({ name: title, value: '<@' + officer.user_id + ">\n" + description, inline: true })
        }
            
        interaction.editReply("Done processing officer data done! generating graphs...")
            

        let graphs = []
        if (showServerWideData) {
            const now = new Date()
            const christmas = now.getMonth() === 11

            const curvedLinesSetting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "curved_lines_in_graphs" } })
            const curvedLines = curvedLinesSetting ? curvedLinesSetting.config === "curved" : false

            graphs.push(await generateGraph({ data: { labels: ['trainings', 'patrols', 'other'], values: [divsTrainings.length, divsPatrols.length, divsEvents.length - divsTrainings.length - divsPatrols.length] }, type: 'doughnut', height: 600, width: 600, fontSize: 26 }))
            graphs.push(await generateGraph({ data: { title: "training maps", labels: [... Object.keys(trainingMaps)], values: [... Object.values(trainingMaps)] }, type: 'doughnut', height: 600, width: 600, fontSize: 26 }))
            graphs.push(await generateGraph({ data: { title: "average attendees per day", colors: [christmas ? "rgb(200, 0, 0)" : "rgb(0, 217, 255)"], labels: dataRangeIndexesPerDay.map(index => {
                const date = new Date(endTime - (24*60*60*1000 * index));
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }), values: averageAttendesHistoryPerDay }, type: 'line', height: 600, width: 1000, fontSize: 26, lineWidth: 5, pointRadius: 7, curvedLines }))
            graphs.push(await generateGraph({ data: { title: "amount of Events per day", colors: [christmas ? "rgb(0, 128, 0)" : "rgb(0,255,0)"], labels: dataRangeIndexesPerDay.map(index => {
                const date = new Date(endTime - (24*60*60*1000 * index));
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }), values: amountOfEventsHistoryPerDay }, type: 'line', colors: [christmas ? "rgb(200, 0, 0)" : "rgb(255,251,0)"], height: 600, width: 1000, fontSize: 26, lineWidth: 5, pointRadius: 7, curvedLines }))
            graphs.push(await generateGraph({ data: { title: "rally attendees per week", colors: [christmas ?"rgb(200, 0, 0)" : "rgb(192, 0, 0)"], labels: ['-6', '-5', '-4', 'before last', 'last', 'current'], values: amountAtRallysHistoryPerWeek }, type: 'line', height: 600, width: 1000, fontSize: 26, lineWidth: 5, pointRadius: 7, curvedLines }))

            graphs.push(await generateGraph({ data: { title: "attendees over time", colors: [christmas ? "rgb(0, 128, 0)" :"rgb(143, 5, 255)"], labels: ['-6', '-5', '-4', 'before last', 'last', 'current'], values: totalAttendesHistoryPerWeek }, type: 'line', height: 600, width: 1000, fontSize: 26, lineWidth: 5, pointRadius: 7, curvedLines }))
            graphs.push(await generateGraph({ data: { title: "average attendees over time", colors: [christmas ? "rgb(200, 0, 0)" :"rgba(0, 68, 255, 1)"], labels: ['-6', '-5', '-4', 'before last', 'last', 'current'], values: averageAttendesHistoryPerWeek }, type: 'line', height: 600, width: 1000, fontSize: 26, lineWidth: 5, pointRadius: 7, curvedLines }))
            graphs.push(await generateGraph({ data: { title: "amount of events over time", colors: [christmas ? "rgb(0, 128, 0)" :"rgb(255, 1, 255)"], labels: ['-6', '-5', '-4', 'before last', 'last', 'current'], values: amountOfEventsHistoryPerWeek }, type: 'line', height: 600, width: 1000, fontSize: 26, lineWidth: 5, pointRadius: 7, curvedLines }))
        }

        const divsTotalTrainingLength = divsTrainings.reduce((acc, event) => acc + (event.length ?? 0), 0)


        interaction.editReply("Done generating graphs! sending data...")

        let description = `*<t:${Math.round(startTime.getTime()/1000)}:D> - <t:${Math.round(endTime.getTime()/1000)}:D>*\n\n`
        if (showServerWideData) {
        description += `Total events: ${divsEvents.length} \nTotal attendees: ${totalAttendes} average attendees: ${divsEvents && totalAttendes ? Math.round((totalAttendes-totalAttendesAtRallys)*10 / (divsEvents.length - rallyafterraid.length - rallysbeforeraid.length))/10 : 0} \n`
        description += `Total trainings: ${divsTrainings.length} (${divsEvents.length != 0 ? Math.round(divsTrainings.length * 100 / divsEvents.length) : 0}%) Trainings with 5+ attending: *${divsTrainingsWith5PlusAttendees.length}* Biggest training: **${divsTrainingWithHighestAttendance ? (divsTrainingWithHighestAttendance.sealog_message_link ? "[" : "") + (divsTrainingWithHighestAttendance.amount_of_attendees + 1) + (divsTrainingWithHighestAttendance.sealog_message_link ? `](${divsTrainingWithHighestAttendance.sealog_message_link})` : "")/*+ the host*/ : 0}** Total attendees: ${totalTrainingAttendes} *Top training host:* ${topTraningHost.host ? `<@${topTraningHost.host}>(${topTraningHost.score}, ${topTraningHost.events})` : "N/A"} Average training length **${divsTrainings.length ? divsTotalTrainingLength/divsTrainings.length : 0}** Min\n`
        description += `Total patrols: ${divsPatrols.length} (${divsEvents.length != 0 ? Math.round(divsPatrols.length * 100 / divsEvents.length) : 0}%) Patrols with 5+ attending: *${divsPatrolWith5PlusAttendees.length}* Biggest patrol: **${divsPatrolWithHighestAttendance ? (divsPatrolWithHighestAttendance.sealog_message_link ? "[":"") + (divsPatrolWithHighestAttendance.amount_of_attendees + 1) + (divsPatrolWithHighestAttendance.sealog_message_link ? `](${divsPatrolWithHighestAttendance.sealog_message_link})` : "") /*+ the host*/ : 0}** Total attendees: ${totalPatrolAttendes} *Top patrol host:* ${topPatrolHost.host ? `<@${topPatrolHost.host}>(${topPatrolHost.score}, ${topPatrolHost.events})` : "N/A"}\n`
        description += `Biggest rally: **${rallyWithHighestAttendance ? rallyWithHighestAttendance.amount_of_attendees + 1/*+ the host */ : 0} **Average rally attendees: ${rallysbeforeraid.length ? totalAttendesAtRallys / rallysbeforeraid.length : 0} \nAverage amount of officers at rallys: ${rallysbeforeraid.length ? totalOfficersAtRallys / rallysbeforeraid.length : 0}\n`
        description += `Total recruits recruited by officers: ${totalRecruits}`
        }

        let embed = new EmbedBuilder()
            .setTitle("Quota")
            .setDescription(description)
            .setColor([0, 255, 0])
            
        let length = embed.data.title.length + embed.data.description.length

        for (let field of officerFields) {
            if (length + field.name.length + field.value.length > 6000) {
                await interaction.followUp({ embeds: [embed], files: graphs.map(g => g.attachment) })
                for (let graph of graphs) {
                    fs.unlinkSync(graph.filePath)
                }
                graphs = []
                embed = new EmbedBuilder()
                .setColor([0, 255, 0])
                length = 0
            }
            length += field.name.length + field.value.length
            embed.addFields(field)
        };


        await interaction.followUp({ embeds: [embed], files: graphs.map(g => g.attachment) })

        //remove the graph files
        for (let graph of graphs) {
            fs.unlinkSync(graph.filePath)
        }

    }
}