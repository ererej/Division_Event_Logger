const noblox = require('noblox.js');
const getGoogleSheet = require('./utils/getGoogleSheet');
const config = require('./config.json');
noblox.setAPIKey(config['roblox-api-key']);

const stealOfficers = async () => {
    const spreadsheetId = '1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I';
    const departmentSheet = await getGoogleSheet(spreadsheetId, '[SEA] Department Tracker!A1:f100');
    const divisionSheet = await getGoogleSheet(spreadsheetId, '[SEA] Division Tracker!A1:E2000');
    const departmentSheetData = departmentSheet.data.values;

    const checkedUsers = [];
    const foundUsers = [];
    
    const claimedButLowRank = {};

    const claimedUsers = {};
    for (let i = 1; i < divisionSheet.data.values.length; i++) {
        if (divisionSheet.data.values[i][1] === undefined) {
            continue;
        }
        
        claimedUsers[divisionSheet.data.values[i][1].trim()] = divisionSheet.data.values[i][0];
        const rank = divisionSheet.data.values[i][0];
        if (rank.toLowerCase().includes("hr")) {
            claimedButLowRank[divisionSheet.data.values[i][1].trim()] = divisionSheet.data.values[i][0];
        }

    }
    

    const departmentMemebers = {};
    const departmentRanks = await noblox.getRoles(33445332);
    for (let i = 1; i < departmentRanks.length; i++) {
        departmentMemebers[departmentRanks[i].name] = [...await noblox.getPlayers(33445332, departmentRanks[i].id)];
    }

    // console.log(claimedButLowRank);
    

    Object.keys(departmentMemebers).forEach(async (rank) => {
        for (let i = 0; i < departmentMemebers[rank].length; i++) {
            const user = departmentMemebers[rank][i];
            if (checkedUsers.includes(user.username)) {
                continue
            }
            
            if (claimedUsers[user.username]) {
                if (!claimedButLowRank[user.username]) {
                    continue
                }
                // console.log(`Checking user: ${user.username} is ${rank} but is claimed in a div with the rank ${claimedButLowRank[user.username]}`);
            }

            checkedUsers.push(user.username);
            
            const usersGroups = await noblox.getGroups(user.userId);


            if (!usersGroups.find(group => group.Id == 16992878)) { // check if user is in FAF
                // console.log(`User: ${user.username} is not in FAF`);
                continue;
            }
            // console.log(`User: ${user.username} is in FAF`);
            if (usersGroups.find(group => group.Id == 35403813)) {
                if (usersGroups.find(group => group.Id == 35403813).rank < 50) { // check if user is in OA
                    continue;
                }
            } else {
                continue;
            }

            
            await new Promise(resolve => setTimeout(resolve, 1000));

            
            
            foundUsers.push(user.username);
            // console.log(`Found user: ${user.username} is ${rank}`);
            if (claimedUsers[user.username]) {
                console.log(`Found user: ${user.username} is ${rank} but is claimed in a div with the rank ${claimedButLowRank[user.username]}`);
            } else {
                console.log(`Found user: ${user.username} is ${rank}`);
            }
            
        }
    })


    return foundUsers;
};

 stealOfficers()


