const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const validateMessageLink = require("../../utils/validateMessageLink");
const db = require("../../dbObjects");

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
    ),
    
    async execute(interaction) {
        await interaction.deferReply();
        const event_id = interaction.options.getInteger('event_id');
        const deleteLogs = interaction.options.getBoolean('delete_logs');

        const embeded_error = new EmbedBuilder().setColor(Colors.Red).setTitle('Error!');

        const event = await db.Events.findOne({ where: { id: event_id } });
        if (!event) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`No event found with the id of ${event_id}`)]});
        }

        if (event.guild_id !== interaction.guild.id) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`Nice try buddy but that event was not hosted in this server!`)]});
        }

        if (event.host !== interaction.user.id && !(interaction.member.permissions.has('ADMINISTRATOR') || interaction.member.permissions.has('MANAGE_GUILD'))) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`Access denied! You are not the host of the event!`)]});
        }

        if (deleteLogs) {
            console.log(event.sealog_message_link, event.promo_log_message_link);
            const sea_log = await validateMessageLink(interaction, event.sealog_message_link);
            const promo_log = await validateMessageLink(interaction, event.promo_log_message_link);
            console.log(sea_log, promo_log);
            if (sea_log.message) {
                // Delete the message that contains the link to where to log the event
                const channel_messages = await sea_log.channel.messages.fetch({ around: sea_log.id, limit: 2 });
                const regex = /^VVV https:\/\/(discord|discordapp)\.com\/channels\/\d+\/\d+\/\d+$ VVV/
                const loggingChannelPointer = channel_messages.findOne(message => message.position < sea_log.position && regex.test(message.content));
                if (loggingChannelPointer) {
                    loggingChannelPointer.delete();
                    console.log('deleted logging channel pointer');
                }
                sea_log.message.delete
                console.log('deleted sea log message');
            }
            if (promo_log.message) {
                promo_log.message.delete();
                console.log('deleted promo log message');
            }
        }

        const hostOfficer = await db.Officers.findAll({ where: { user_id: event.host, guild_id: event.guild_id } });
        if (hostOfficer) {
            hostOfficer.forEach(officer => {
                if ( officer.createdAt > event.createdAt || (officer.retired && officer.retired < event.createdAt )) return;
                officer.update({ total_events_hosted: officer.total_events_hosted - 1, total_attendees: officer.total_attendees - event.amount_of_attendees });
            });
        }

        

        // Delete the event
        event.destroy();
        interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Event with the id of ${event_id} has been deleted!` + (deleteLogs ? ' and the logs have been removed!' : ''))]});
    }
}