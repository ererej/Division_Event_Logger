const { SlashCommandBuilder, EmbedBuilder, } = require('discord.js');
const validateMessageLink = require('../../utils/validateMessageLink.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletemessage')
        .setDescription('A command locked to Ererej used to delete accidental messages sent by the bot')
        .addStringOption(option => 
            option.setName('message_link')
            .setDescription('The message to delete!').setRequired(true))
        ,

    guildLock: ["831851819457052692"],

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])

        if (interaction.user.id !== "386838167506124800") {
            embeded_error.setDescription("Wait a minute you are not Ererej! You do not have permission to use this command!")
            return await interaction.editReply({ embeds: [embeded_error], content: "https://tenor.com/view/bomb-pipe-bomb-gif-11987700991386067050" });
        }

        const message = await validateMessageLink(interaction, interaction.options.getString('message_Link'), true)
        if (message.error) {
            embeded_error.setDescription(message.error)
            return await interaction.editReply({ embeds: [embeded_error]});
        }
        await message.message.delete().catch(err => {
            embeded_error.setDescription("Failed to delete the message! Error: " + err.message)
            return interaction.editReply({ embeds: [embeded_error]});
        })
        await interaction.editReply({ content: "Message deleted successfully!" });
    }
}
