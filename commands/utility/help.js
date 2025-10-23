const { SlashCommandBuilder, UserEntitlements, EmbedBuilder, PermissionsBitField, Client, User  } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('explains how to use the bot and lists some useful links!'),
    /**
     *  @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply();

        interaction.editReply({content: `**Important links:** \nTerms Of Service: https://ererej.github.io/divition_event_logger_info/termsOfService.html \nPrivacy Policy: https://ererej.github.io/divition_event_logger_info/PrivacyPolicy.html \n**Getting started with the bot**\n\nTo get started with the bot you will need to run the /setup command this will guide you through setting up the bot for your server. \n\nAfter running /setup you can run /link to link your roblox group to the bot this will allow the bot to fetch information about your group and its members. \n\nYou can view all commands by typing / and scrolling through the list of commands \n\nIf you need any help or have any questions feel free to join the support server: https://discord.gg/nPrvefJxdF \n\n The bot has some commands that are locked to paying servers, these are locked commands: \n\n# Premium commands: \n/log \n/promote \n/updateUser \n/editEvent \n/deleteEvent \n/eventInfo \n/addMilestone \n/addRank \n/demote \n/editrank`}) 
    }
}