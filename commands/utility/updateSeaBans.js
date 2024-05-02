const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const PublicGoogleSheetsParser = require('public-google-sheets-parser')
const spreadsheetId = '11B49ixK9BM2H91rhYmSF4-5SqhQWfz_zPWIC_X5eGyQ'
const options = { useFormat: true }
const parser = new PublicGoogleSheetsParser(spreadsheetId, options)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateseabans')
        .setDescription('makes sure that all the SEA banned users are banned!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        const sheetData = await parser.parse()
        let replyString = ""
        let discordIDColum = Object.keys(sheetData["0"])[0] + ""
        discordIDColum = [...discordIDColum.split(" ")] //returns an object for no fucking reason
        let userIDs = []

        for (const key in discordIDColum) if (parseInt(discordIDColum[key])) userIDs.push(discordIDColum[key].split("ㅤ")[0])
        interaction.reply(`**banning ${userIDs.length} Perm SEA banned users!**`)
        userIDs.forEach(userID => {
            interaction.guild.members.ban(userID, {reason: `Perm banned from SEA`}) 
            if (replyString.length + `**banned <@${userID}>!**\n`.length >= 2000) {
                interaction.channel.send(replyString)
                replyString = ""
            } 
            replyString += `**banned <@${userID}>!**\n`
        })
        await interaction.channel.send(replyString)
    }
}
