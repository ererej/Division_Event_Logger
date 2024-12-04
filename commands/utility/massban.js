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
        let UserIDs = interaction.options.getString('users').split(',')
        if (UserIDs.length < 1) {
            UserIDs = interaction.options.getString('users').split('\n')
        } 
        if (UserIDs.length < 1) {
            UserIDs = interaction.options.getString('users').split(' ')
        }
        if (UserIDs.length < 1) {
            UserIDs = interaction.options.getString('users').split(' ')
        }
        UserIDs = UserIDs.map(id => id.trim())
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
                    const user = await interaction.guild.members.fetch(userId).catch(err => {
                        replyString += `**failed to find a user with the id: ${userId}!**\n`
                        failedBans++
                        return
                    })
                    if (user.bannable === false) {
                        replyString += `**unable to ban <@${userId}> due to missing permissions.\n`
                        failedBans++
                        return
                    }
                    user.ban({reason: `massban by ${interaction.user.tag} (${interaction.user.id})! reason: ` + interaction.options.getString('reason')})
                    replyString += `*banned <@${userId}>!!!!*\n`
                    bancount++
                    return
                    
                }
                replyString += `*<@${userId}> is already banned :D*\n`
            } catch(err)  {
                replyString += `**failed to ban <@${userId}>! Error recived: ${err.name}  ${err.message}**\n`
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