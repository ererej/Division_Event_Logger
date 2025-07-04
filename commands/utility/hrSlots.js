const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const noblox = require("noblox.js")
const config = require('../../config.json')
const getGoogleSheet = require('../../utils/getGoogleSheet.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hrslots')
        .setDescription('lets you easily check the hr slots of a division or user!')
        .addUserOption(option => 
            option.setName('user')
            .setDescription('The user you want to check!')
            .setRequired(false)),


    async execute(interaction) {
        await interaction.deferReply()
        const officerTracker = await getGoogleSheet(config.officerTrackerSpreadsheetId, '[SEA] Division Tracker!A1:E2000')
        const officerTrackerData = sheet.data.values

        const divisionInfoRow = sheetData.find(row => row[0] !== undefined && row[0].toLowerCase() === division_name.toLowerCase())
        
    }
}
