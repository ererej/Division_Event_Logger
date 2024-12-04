const PublicGoogleSheetsParser = require('public-google-sheets-parser')
const spreadsheetId = '1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I'
const options = { useFormat: true }
const parser = new PublicGoogleSheetsParser(spreadsheetId, options)

module.exports = async (interaction, server, interactionIsAMessage/* not happy either! */) => {
    if (!server) return 'please run the /setup command so that the server gets added to the data base'
    const division_name = server.name ?? interaction.guild.name
    const sheetData = await parser.parse()

    const firstColumnName = Object.keys(sheetData[0])[0]
    const row = sheetData.find(row => row[firstColumnName] === division_name)
    if (!row) {
        if (sheetData[0][firstColumnName]) {
            return `could not locate the division: ${division_name} in the officer tracker!`
        } /*else { //like this too much to delete it
            return await interaction.editReply({ content: `could not locate a column named "Divisions" in the officer tracker! This means that the DAs has made an opsie again! Please contact Ererej <@386838167506124800> so that he can scream at them!`})
        }*/
    }
    const exp = row.EXP.slice(10).trim()
    if (!exp)  {
        return 'There was an error while fetching the exp! This is mostlikely due to your divisions name not being the same as your discord servers name. But it can also be due to your division needing to be in the officer tracker for this to work!'
    }
    
    server.exp = exp
    server.save()
    return exp
}