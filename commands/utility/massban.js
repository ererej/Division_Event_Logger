const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('massban')
        .setDescription('ban multiple users at once!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('users')
                .setDescription('seperate the users with ","!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('why are these users getting banned?')
        ),
    botPermissions: [PermissionsBitField.Flags.BanMembers],
    async execute(interaction) {
        await interaction.deferReply()
        const UserIDs = interaction.options.getString('users').split(',')
        let bancount = 0
        let failedBans = 0
        let replyString = ""
        UserIDs.forEach(userId => {
            try {
                interaction.guild.members.ban(userId, {reason: `massban by ${interaction.user.tag} (${interaction.user.id})! reason: ` + interaction.options.getString('reason')})
                replyString += `*banned <@${userId}>!*\n`
                bancount++
            } catch(err)  {
                if (interaction.guild.members.fetch(userId) && interaction.guild.members.fetch(userId).bannable === false) {
                    replyString += `**unable to ban <@${userId}> due to missing permissions.\n`
                }
                replyString += `**failed to ban <@${userId}>!**\n`
                failedBans++
            }
        })
        replyString += `**banned ${bancount} users!**\n`
        if (failedBans > 0) {
            replyString += `***failed to ban ${failedBans} users!***\n`
        } 
        if (replyString.length() <= 2000) {
            interaction.editReply(replyString)
        } else {
            interaction.editReply('# ***banning users:***')
            let subStrings = replyString.split("\n")
            let tempstring = ""
            for (i=0; i < replyString.length(); i++){
                if ((tempstring + subStrings[i]).length() >= 2000) {
                    interaction.channel.send(tempstring)
                    tempstring = subStrings[i]
                } else {
                    tempstring += subStrings[i]
                }
            }
            interaction.channel.send(tempstring)
        }

    }
}