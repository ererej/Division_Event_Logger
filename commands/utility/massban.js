const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageMentions } = require('discord.js');
const db = require("../../dbObjects.js")
const getLinkedChannel = require('../../utils/getLinkedChannel');
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

        const banlogsChannel = await getLinkedChannel(interaction, db, { guild_id: interaction.guild.id, type: "banlogs" })

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
        let index = 0
        for (const userId of UserIDs) {
            try {
                replyString += `[${index + 1}/${UserIDs.length}]`
                index++
                if (!bannedUsers.includes(userId)) {
                    let failed = false
                    interaction.guild.bans.create(userId, {reason: `SEA bans updated by ${interaction.user.tag} (${interaction.user.id})!`}).catch(err => {
                        replyString += ` ❌ **failed to ban <@${userId}>! Error recived: ${err.name}  ${err.message}**\n`
                        failedBans++
                        failed = true
                    })
                    if (failed) continue
                    replyString += ` ✅ **banned <@${userId}>!!!!**\n`
                    if (banlogsChannel.channel) banlogsChannel.channel.send({content: `:ballot_box_with_check: <@${userId}> has been banned by <@${interaction.user.id}>!`, allowedMentions: {parse: [MessageMentions.NONE]}})
                    bancount++
                    continue
                }
                replyString += ` :ballot_box_with_check: *<@${userId}> is already banned :D*\n`
            } catch(err)  {
                replyString += `❌**failed to ban <@${userId}>! Error recived: ${err.name}  ${err.message}**\n`
                failedBans++
            }
        }
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