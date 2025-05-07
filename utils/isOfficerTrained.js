const getGoogleSheet = require('./getGoogleSheet.js')
const noblox = require('noblox.js')
const makeRoverApiRequest = require('./makeRoverApiRequest.js')
const config = require('../config.json')

module.exports = async ({userId, username, trainedSheet, exemptSheet, guildId, robloxUserId}) => {
    if (!userId && !username) {
        throw new Error('Either userId or username must be provided');
    }

    // trained people
    if (!trainedSheet) {
        trainedSheet = await getGoogleSheet('1X19gac3PGDyQpMKFxTTZIMjvj4ooeWFVm8ExQUui9-4', 'Trained!A1:B1000')
    } 
    if (trainedSheet.status != 200) {
        return { error: `Error: An error occured with the google sheet api! error code: ${trainedSheet.status} ${trainedSheet.statusText}`}
    }
    if (trainedSheet.data.values.filter(row => row[1] == userId || row[0].trim() == username).length > 0) {
        return { trained: true, trainedSheet: trainedSheet }
    }

    // exempt people
    if (!exemptSheet) {
        exemptSheet = await getGoogleSheet('1X19gac3PGDyQpMKFxTTZIMjvj4ooeWFVm8ExQUui9-4', 'Exempt!A1:B1000')
    }
    if (exemptSheet.status != 200) {
        return { error: `Error: An error occured with the google sheet api! error code: ${exemptSheet.status} ${exemptSheet.statusText}`, trainedSheet: trainedSheet}
    }
    if (exemptSheet.data.values.filter(row => row[1] == userId || row[0].trim() == username).length > 0) {
        return { exempt: true, exemptSheet: exemptSheet, trainedSheet: trainedSheet }
    }

    let robloxUser = null
    if (username) {
        robloxUser = await fetch(`https://Users.roblox.com/v1/usernames/users`, {
            body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
            method: 'POST',

        })
        robloxUser = await robloxUser.json()
        robloxUserId = robloxUser.data[0].id
        if (robloxUserId == undefined) {
            return { error: `Error: An error occured with the roblox api! error code: ${robloxUser.status} ${robloxUser.statusText}`, trainedSheet: trainedSheet, exemptSheet: exemptSheet}
        }
    } else {
        if (!guildId) {
            guildId = '1073682080380243998'
        }
        robloxUser = await makeRoverApiRequest(() => fetch(`https://registry.rover.link/api/guilds/${guildId}/discord-to-roblox/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + config.roverkey }
        }))
        if (!(robloxUser.status + "").startsWith("2")) {
            if (guildId == '1073682080380243998') {
                return { error: `<@${userId}> needs to verify using rover!`, trainedSheet: trainedSheet, exemptSheet: exemptSheet }
            }
            guildId = '1073682080380243998'
            robloxUser = await makeRoverApiRequest(() => fetch(`https://registry.rover.link/api/guilds/${guildId}/discord-to-roblox/${userId}`, {
                headers: { 'Authorization': 'Bearer ' + config.roverkey }
            }))
            if (!(robloxUser.status + "").startsWith("2")) {
                return { error: `failed to get the user using rovers api as the user and or Rover is not in this guild! Reverted to testing with FAFs server but it still failed!`, trainedSheet: trainedSheet, exemptSheet: exemptSheet }
            }
        }
        robloxUser = await robloxUser.json()
        robloxUserId = robloxUser.robloxId
        if (robloxUserId == undefined) {
            return { error: `Error: An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`, trainedSheet: trainedSheet, exemptSheet: exemptSheet }
        }      
    }

    return noblox.getRankInGroup(35403813, robloxUserId).then(async rank => {
    if (rank === 0) {
        return { trained: false, exempt: false, trainedSheet: trainedSheet, exemptSheet: exemptSheet }
    } else if (rank === 50) {
        return { trained: true, exempt: false, trainedSheet: trainedSheet, exemptSheet: exemptSheet }
    } else if (rank === 20) {
        return { enrolled: true, trained: false, exempt: false, trainedSheet: trainedSheet, exemptSheet: exemptSheet }
    } else if (rank === 255) {
        return { exempt: true, trained: false, trainedSheet: trainedSheet, exemptSheet: exemptSheet }
    } else {
        return { special: true, trained: false, exempt: false, trainedSheet: trainedSheet, exemptSheet: exemptSheet }
    }
    }).catch(err => {
        console.log(err)
        return {error: `An error occured while trying to get the rank of the user!`}
    })
    return {error: `HEEELP!`}
}
