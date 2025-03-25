const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const getNameOfPromoPoints = require("../../utils/getNameOfPromoPoints.js");
const generateGraph = require("../../utils/generateGraph.js");
const { Op } = require("sequelize");
const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user from the database!')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Please input the user you want to get information about!')
                .setRequired(true)
        ),


    async execute(interaction) {
        const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id)
        try {
            await interaction.deferReply()
            const user = interaction.options.getUser('user')
            const dbUser = await db.Users.findOne({
                where: { user_id: user.id, guild_id: interaction.guild.id }
            })
            if (!dbUser) {
                const embeded_error = new EmbedBuilder().setColor([255,0,0])
                embeded_error.setDescription("The user is not in the database!")
                return interaction.editReply({ embeds: [embeded_error]});
            }
            
            const embeded = new EmbedBuilder().setColor([0,255,0])
            let description = ""
            description += `${user}'s information\n`
            description += `**User id**\n${user.id}\n`
            description += `**User rank**\n<@&${dbUser.rank_id}>\n`
            description += `**${nameOfPromoPoints}**\n${dbUser.promo_points}\n`
            description += `**Total events attended**\n${dbUser.total_events_attended}\n`
            if (dbUser.recruted_by) {
                description += "**Recruited by**\n" +`<@${dbUser.recruted_by}>\n`
            } else {
                description += "**Recruited by**\n" + "<@386838167506124800> trust me bro!\n"
            }
            const officer = await db.Officers.findOne({
                where: { user_id: user.id, guild_id: interaction.guild.id, retired: null }
            })
            description += "**Officer**\n" + `${officer ? "True" : "False"}\n`
            if (officer) {
                description += "**Total events hosted**\n" + `${officer.total_events_hosted}\n`
                description += "**Total attendees**\n" + `${officer.total_attendees}\n`
                description += "**Average attendees per event**\n" + `${officer.total_events_hosted === 0 ? 0 : Math.round(officer.total_attendees / officer.total_events_hosted)}\n`
                const coHostedEvents = await db.Events.findAll({ where: { cohost: user.id, guild_id: interaction.guild.id } })
                description += "**Total events co-hosted**\n" + `${coHostedEvents.length}\n`
            }


            const events = await db.Events.findAll({
                where: { guild_id: interaction.guild.id, attendees: { [Op.like]: `%${dbUser.id}%` } }
            })
            const eventTypes = {}
            const maps = {}
            events.forEach(event => {
                if (!eventTypes[event.type]) {
                    eventTypes[event.type] = 1
                } else {
                    eventTypes[event.type]++
                }
                if (!maps[event.game] && event.game != undefined) {
                    maps[event.game] = 1
                } else {
                    if (event.map != undefined) {
                        maps[event.map]++
                    }
                }
            })
            const eventTypesArray = Object.entries(eventTypes)
            

            let graphs = []
            if (eventTypesArray.length > 0) {
                graphs.push(await generateGraph({ labels: [... Object.keys(eventTypes)], colors: ["rgb(255,0,0)", "rgb(0,0,255)", "rgb(0,255,0)", "rgb(234, 1, 255)", "rgb(255, 251, 0)", "rgb(1, 255, 242)"], values: [... Object.values(eventTypes)] }, 'doughnut', 300, 300))
                graphs.push(await generateGraph({ labels: [... Object.keys(maps)], colors: ["rgb(255,0,0)", "rgb(0,0,255)", "rgb(0,255,0)", "rgb(234, 1, 255)", "rgb(255, 251, 0)", "rgb(1, 255, 242)"], values: [... Object.values(maps)] }, 'doughnut', 300, 300))
            }

            embeded.setDescription(description)
            await interaction.editReply({ embeds: [embeded], files: graphs.map(graph => graph.attachment) })
            for (let graph of graphs) {
                fs.unlinkSync(graph.filePath)
            }
        } catch (error) {
            console.error(error)
            const embeded_error = new EmbedBuilder().setColor([255,0,0])
            embeded_error.setDescription("An error occured! the user might not be in the database!")
            interaction.editReply({ embeds: [embeded_error]});
        }   
    }
}


// pie of event type attended
// pie of maps attended
