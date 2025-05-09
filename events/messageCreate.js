const { Events } = require('discord.js');
const db = require('../dbObjects.js');
const getLinkedChannel = require('../utils/getLinkedChannel.js')
const { Op } = require('sequelize')
const updateExp = require('../utils/updateExp.js')

module.exports = {
    name: Events.MessageCreate,
    /**
     * 
     * @param {import('discord.js').Message} message 
     */
    async execute(message) {
        if (message.channel.id == "1092831083130785903") { //exp-logs: 1092831083130785903
            if (message.author.id == "1093933445484384297") {  // jarvis bot id: 1093933445484384297
                console.log("message found in exp-logs channel")
                

                let divisions = []
                if (message.content.startsWith("Division Admin")) {
                    const divisionName = message.content.split("**")[5].trim()
                    const exp = message.content.split("(").pop().split(" ")[2] 
                    divisions.push({ name: divisionName, exp: exp})

                } else if (message.content.startsWith("AUTOMATED EXP FROM HOLO:")) {
                    const divisionName = message.content.split("**")[1].trim()
                    const exp = message.content.split("(").pop().split(" ")[2] 
                    divisions.push({ name: divisionName, exp: exp})

                } else if (message.content.startsWith("**WINNERS**")) {
                    const divisionRegex = /([A-Za-z0-9\s]+)\s+\((\d+)\s+win\s+streak,\s+(\d+)\s+to\s+(\d+)\s+ELO\s+\(\+\d+\),\s+(\d+)\s+to\s+(\d+)\s+EXP\s+\(\+\d+\)\)/g;
                    let match;
                    while ((match = divisionRegex.exec(message.content)) !== null) {
                        const divisionName = match[1].trim();
                        const exp = parseInt(match[6]);
                        divisions.push({ name: divisionName, exp: exp });
                    }
                } else {
                    console.log("I dont understand this exp log message!".toUpperCase(), message.content)
                }

                if (divisions.length > 0) {
                    let servers = await db.Servers.findAll();
                    servers = servers.filter(server => divisions.some(division => server.name.includes(division.name)))

                    if (!servers || servers.length === 0) {
                        console.log("No servers found for the given divisions.");
                        return;
                    }

                    for (const server of servers) {
                        const division = divisions.find(div => server.name.includes(div.name));
                        const guild = message.client.guilds.cache.get(server.guild_id);
                        server.exp = division.exp
                        server.save()

                        if (division) {
                            await updateExp(db, server, undefined, guild, true, message.client)
                        }
                                
                    }
                }
            
            }
        }
    }
}

/*

Division Admin **Blg_Bruh** added **100** EXP to **First Air Force**. (42590 to 42690 total EXP) 
**Reason:** EXP From Community Event
- - -


<@&663104524956860449> **Naval Vanguard** has **leveled up** to **level 2**!
- - -


**WINNERS**
First Air Force (1 win streak, 550 to 600 ELO (+50), 41725 to 41810 EXP (+85))
Royal Dutch Air Force (1 win streak, 850 to 900 ELO (+50), 5795 to 5835 EXP (+40))
NightHawk Squadrons (1 win streak, 950 to 1000 ELO (+50), 6515 to 6540 EXP (+25))
Barefoot Battalion (2 win streak, 1350 to 1450 ELO (+100), 5265 to 5290 EXP (+25))
Blazing Legion (1 win streak, 1000 to 1050 ELO (+50), 4700 to 4735 EXP (+35))
Somalian Cove (4 win streak, 5600 to 5800 ELO (+200), 32607 to 32647 EXP (+40))
North Atlantic Squadron (1 win streak, 600 to 650 ELO (+50), 4085 to 4125 EXP (+40))
Phantom Corps (1 win streak, 1000 to 1050 ELO (+50), 420 to 505 EXP (+85))
Delta Force One (2 win streak, 1000 to 1100 ELO (+100), 805 to 855 EXP (+50))
Imperial Kazes (3 win streak, 1150 to 1300 ELO (+150), 16780 to 16805 EXP (+25))

*/