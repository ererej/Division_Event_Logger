const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, User } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('massban')
        .setDescription('ban multiple users at once!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('users')
                .setDescription('seperate the users with ","!')
                .setRequired(true)
            ),

    async execute(interaction) {
        await interaction.deferReply()
        const UserIDs = interaction.options.getString('users').split(',')
        let bancount = 0
        let failedBans = 0
        let replyString = ""
        UserIDs.forEach(userId => {
            try {
            interaction.guild.members.ban(userId, {reason: `massban by ${interaction.user.tag} (${interaction.user.id})!`})
            replyString += `**banned <@${userId}>!**\n`
            bancount++
            } catch(err)  {
                replyString += `**failed to ban <@${userId}>!**\n`
                failedBans++
            }
        })
        replyString += `**banned ${bancount} users!**\n`
        if (failedBans > 0) {
            replyString += `***failed to ban ${failedBans} users!***\n`
        } 
        interaction.editReply(replyString)
    }
}