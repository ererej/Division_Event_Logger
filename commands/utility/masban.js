const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, User } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('masban')
        .setDescription('ban multiple users at once!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('Users')
                .setDescription('seperate the users with ","!')
                .setRequired(true)
            ),

    async execute(interaction) {
        await interaction.deferReply()
        const UserIDs = interaction.options.getString('Users').split(',')
        let bancount = 0
        let replyString = ""
        UserIDs.forEach(userId => {
            interaction.guild.members.fetch(userId).then(user => {
                if (!user) {
                    replyString += `could not find user with id: ${userId}\n`
                } else if (user.bannable) {
                    user.ban({reason: "mass ban!"})
                    bancount++
                    replyString += `${user.user.tag} has been banned!\n`
                } else {
                    replyString += `${user.user.tag} could not be banned!\n`
                }

            }).catch(error => {
                replyString += `could not find user with id: ${userId}\n`
        });
        })
        interaction.editReply({ content: replyString + `**banned ${UserIDs.length} users!**`})
    }
}