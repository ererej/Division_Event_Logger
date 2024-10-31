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
        const guildBans = await interaction.guild.bans.fetch()
        let bannedUsers = []
        guildBans.forEach(ban => {
            bannedUsers.push(ban.user.id)
        })
        UserIDs.forEach(async userId => {
            try {
                if (!bannedUsers.includes(userId)) {
                    await interaction.guild.members.ban(userId, {reason: `massban by ${interaction.user.tag} (${interaction.user.id})! reason: ` + interaction.options.getString('reason')})
                    replyString += `*banned <@${userId}>!!!!*\n`
                    bancount++
                    return
                }
                replyString += `*<@${userId}> is already banned :D*\n`
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
        if (replyString.length <= 2000) {
            interaction.editReply(replyString)
        } else {
            interaction.editReply('# ***banning users:***')
            let subStrings = replyString.split("\n")
            let tempstring = ""
            for (i=0; i < subStrings.length; i++){
                if ((tempstring + subStrings[i]).length >= 2000) {
                    interaction.channel.send(tempstring)
                    tempstring = subStrings[i] + "\n"
                } else {
                    tempstring += subStrings[i] + "\n"
                }
            }

            interaction.channel.send(tempstring)
        }

    }
}