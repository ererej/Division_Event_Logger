const getGoogleSheet = require('./getGoogleSheet')
const spreadsheetId = '1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I'

module.exports = async (interaction, server, interactionIsAMessage/* not happy either! */) => {
    if (!server) return 'please run the /setup command so that the server gets added to the data base'
    const division_name = server.name ?? interaction.guild.name

    const sheet = await getGoogleSheet(spreadsheetId, '[SEA] Division Tracker!A1:E2000')
    const sheetData = sheet.data.values

    
    
    const row = sheetData.find(row => row[0] !== undefined && row[0].toLowerCase() === division_name.toLowerCase())
    if (!row) {
        return `could not locate the division: ${division_name} in the officer tracker!`
        /*else { //like this too much to delete it
            return await interaction.editReply({ content: `could not locate a column named "Divisions" in the officer tracker! This means that the DAs has made an opsie again! Please contact Ererej <@386838167506124800> so that he can scream at them!`})
        }*/
    }
    if(row[3] === undefined) {
        return 'something is very very wrong with the officer tracker!!!'
    }

    const exp = parseInt(row[3].slice(10).trim())
    if (!exp || isNaN(exp)) { 
        return 'There was an error while fetching the exp! This is mostlikely due to your divisions name not being the same as your discord servers name(you can run /setup and give it your divisions name). But it can also be due to your division needing to be in the officer tracker for this to work!'
    }
    
    server.exp = exp
    server.save()
    return exp
}