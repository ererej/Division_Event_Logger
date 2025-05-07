const { SlashCommandBuilder, EmbedBuilder, } = require('discord.js');
const { Op } = require('sequelize')
const db = require("../../dbObjects.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eventinfo')
        .setDescription('shows all the saved information about an event')
        .addIntegerOption(option => option.setName('eventid').setDescription('The event id of the event you want to see').setRequired(true))
        ,


    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])
        
        const event = await db.Events.findOne({ where: { id: interaction.options.getInteger('eventid') } })
        if (!event) {
            embeded_error.setDescription("No event found with that id!")
            return await interaction.editReply({ embeds: [embeded_error] });
        } 
        if (event.guild_id != interaction.guild.id && interaction.member.id != "386838167506124800") {
            embeded_error.setDescription("This event is not in this server!")
            return await interaction.editReply({ embeds: [embeded_error] });
        }
        
        
        const attendeeIds = event.attendees.split(",").filter(id => id !== "");
        const attendees = attendeeIds.length > 0 ? 
            await db.Users.findAll({ where: { id: { [Op.in]: attendeeIds } } }) : 
            [];
        

        const embededReply = new EmbedBuilder()
            .setColor([255, 255, 0])
            .setTitle(`Event info for event id: ${event.event_id}`)
            .addFields(
                { name: 'Event id:', value: "" + event.id, inline: true },
                { name: 'Event type', value: event.type, inline: true },
                { name: 'Host', value: "<@" + event.host + ">", inline: true },
                { name: 'Cohost', value: event.cohost ? "<@" + event.cohost + ">" : "None", inline: true },
                { name: 'Attendees', value: "<@" + attendees.map(attendee => attendee.user_id).join("> <@") + ">", inline: true },
                { name: 'Officers that attended', value: "<@" + event.officers.split(",").join("> <@") + ">", inline: true },
                { name: 'Date', value: "<t:" +  Math.round(event.createdAt/1000) + ":f>", inline: true },
                { name: 'Game', value: event.game ?? "No Data", inline: true },
                { name: 'Event length', value: event.length ? event.length + " minutes" : "No Data", inline: true },
                { name: 'Amount of attendees', value: "" + event.amount_of_attendees, inline: true },
                { name: 'Amount of officers', value: "" + event.amount_of_officers, inline: true },
                { name: 'Sealog message link', value: "" + event.sealog_message_link, inline: true },
                { name: 'Promolog message link', value: "" + event.promolog_message_link, inline: true },
                { name: 'Promopoints rewarded', value: "" + event.promopoints_rewarded, inline: true },
            )
        await interaction.editReply({ embeds: [embededReply] })
        
    }
}