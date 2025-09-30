const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const validateMessageLink = require("../../utils/validateMessageLink");
const db = require("../../dbObjects");
const { Op, and } = require("sequelize");
const noblox = require("noblox.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('deleteevent')
    .setDescription('Deletes an event from the database(does not revert promotions)')
    .addIntegerOption(option => 
        option.setName('event_id')
        .setDescription('Please enter the Id of the event that you want to delete from the database!')
        .setRequired(true)
    )
    .addBooleanOption(option => 
        option.setName('delete_logs')
        .setDescription('This will make the bot remove the Sea log and promo log')
    )
    .addBooleanOption(option =>
        option.setName('revert_promotions')
        .setDescription('This will revert the promotions of the attendees')
    )
    ,
    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */
    async execute(interaction) {
        await interaction.deferReply();
        const event_id = interaction.options.getInteger('event_id');
        const deleteLogs = interaction.options.getBoolean('delete_logs');
        const revertPromotions = interaction.options.getBoolean('revert_promotions');

        const embeded_error = new EmbedBuilder().setColor(Colors.Red).setTitle('Error!');

        const event = await db.Events.findOne({ where: { id: event_id } });
        if (!event) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`No event found with the id of ${event_id}`)]});
        }

        if (event.guild_id !== interaction.guild.id) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`Nice try buddy but that event was not hosted in this server!`)]});
        }

        if (event.host !== interaction.user.id && !(interaction.member.permissions.has('ADMINISTRATOR') || interaction.member.permissions.has('MANAGE_GUILD'))) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`Access denied! You are not the host of the event nor are you an administator!`).setColor(Colors.Red)]});
        }

        if (deleteLogs !== false) {
            let seaLog = await validateMessageLink(interaction, event.sealog_message_link);
            const promo_log = await validateMessageLink(interaction, event.promolog_message_link);
            if (seaLog.message) {
                // Delete the message that contains the link to where to log the event
                const channel_messages = await seaLog.channel.messages.fetch({ around: seaLog.message.id, limit: 2 });
                // find and delete any VVV <#channel_id> VVV messages
                const lastMessage = channel_messages.last();
                const regex = /^VVV <#\d+> VVV$/
                if (lastMessage && regex.test(lastMessage.content)) {
                    await lastMessage.delete().catch(console.error());
                }
                await seaLog.message.delete().catch(console.error());
            }
            if (promo_log.message) {
                await promo_log.message.delete().catch(console.error());
            }
        }

        const hostOfficer = await db.Officers.findOne({ where: { user_id: event.host, guild_id: event.guild_id, createdAt: {[Op.lt]: event.createdAt},  retired: { [Op.or]: [null, { [Op.gt]: event.createdAt }]} } });
        if (!hostOfficer) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`Some thing is very wrong and no officer found for the host of the event!`)]});
        }
        await hostOfficer.update({ total_events_hosted: hostOfficer.total_events_hosted - 1, total_attendees: hostOfficer.total_attendees - event.amount_of_attendees });

        if ( revertPromotions !== false ) {
            const attendees = await db.Users.findAll({ where: { id: { [Op.in]: event.attendees.split(",") } } });
            const ranks = await db.Ranks.findAll({ where: { guild_id: event.guild_id } });
            const server = await db.Servers.findOne({ where: { guild_id: event.guild_id } })
            const groupId = server.group_id;

            for (const attendee of attendees) {
                await attendee.removePromoPoints(noblox, groupId, await interaction.guild.members.fetch(attendee.user_id), ranks, 1);
                await attendee.update({ total_events_attended: attendee.total_events_attended - 1 });
            };
        }

        // Delete the event
        event.destroy();
        interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Event with the id of ${event_id} has been deleted!` + (deleteLogs !== false ? ' and the logs have been removed!' : '' + (revertPromotions !== false ? ' and the promotions have been reverted!' : '')))]});
    }
}