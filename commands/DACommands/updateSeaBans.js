const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ConnectionService } = require('discord.js');
const spreadsheetId = '11B49ixK9BM2H91rhYmSF4-5SqhQWfz_zPWIC_X5eGyQ'
const readSheetData = require('../../utils/getGoogleSheet.js')
const db = require("../../dbObjects.js")
const getLinkedChannel = require('../../utils/getLinkedChannel.js');

const { google } = require('googleapis');

const { readFile } = require('fs').promises;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateseabans')
        .setDescription('makes sure that all the people on the offical blacklist are banned!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.Administrator),

    botPermissions: [PermissionsBitField.Flags.BanMembers],
    async execute(interaction) {
        await interaction.deferReply()

        const banlogsChannel = await getLinkedChannel({interaction, db, query:{ guild_id: interaction.guild.id, type: "banlogs" }, guild: interaction.guild})

        const responce = await readSheetData(spreadsheetId, 'Individuals List!A1:c300')
        const rows = responce.data.values;
        let UserIDs = []
        rows.forEach(row => {
            if (row[1] != "Discord ID" && row[1] != undefined && row[1] != "") {
                UserIDs.push(row[1].replace(/\s/g, '').replace(/ㅤ/g, ''))
            }
        });
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
            return interaction.editReply(replyString)
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


