const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const PublicGoogleSheetsParser = require('public-google-sheets-parser')
const spreadsheetId = '1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I'
const options = { useFormat: true }
const parser = new PublicGoogleSheetsParser(spreadsheetId, options)
const db = require("../../dbObjects.js")
const updateExp = require('../../updateExp.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateexp')
        .setDescription('Updates the Exp display!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageServer || PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        await interaction.deferReply()
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        if (!server) return await interaction.editReply({ content: 'This server is not registered in the database! Please ask an admin to register it using </setup:1217778156300275772>', ephemeral: true });
        const division_name = server.name ?? interaction.guild.name
        const sheetData = await parser.parse()

        const firstColumnName = Object.keys(sheetData[0])[0]
        const row = sheetData.find(row => row[firstColumnName] === division_name)
        if (!row) {
            if (sheetData[0][firstColumnName]) {
                return await interaction.editReply({ content: `could not locate the division: ${division_name} in the officer tracker!`, ephemeral: true})
            } /*else { //like this too much to delete it
                return await interaction.editReply({ content: `could not locate a column named "Divisions" in the officer tracker! This means that the DAs has made an opsie again! Please contact Ererej <@386838167506124800> so that he can scream at them!`})
            }*/
        }
        const exp = row.EXP.slice(10).trim()
        if (!exp) return await interaction.editReply({ content: 'There was an error while fetching the exp! This is mostlikely due to your divisions name not being the same as your discord servers name. But it can also be due to your division needing to be in the officer tracker for this to work.', ephemeral: true })

        
        server.exp = exp
        server.save()
        updateExp(db, server, interaction)
        interaction.editReply({ content: `**Updated the exp to: ${exp}!**` })
    }
};