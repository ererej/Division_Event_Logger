const noblox = require('noblox.js')
const config = require('./config.json')


const testtest = new Date()
console.log(testtest - 7*24*60*60*1000)

const test = async () => {

    const seamilitaryId = 2648601

    const bilGroupId = 34309406

    const rankNames = ["[HR1]", "[HR2]", "[HR3]", "[HC1]", "[HC2]", "[HC3]", "[M]"]

    const bilRanks = await noblox.getRoles(bilGroupId)

    const bilMembers = await noblox.getPlayers(bilGroupId, bilRanks.map(rank => rank.id))

    const bilMemberIds = bilMembers.map(member => member.userId)    
    
    for (const rankName of rankNames) {
        let ranks = await noblox.getRoles(seamilitaryId)
        ranks = ranks.filter(rank=> rank.name.includes(rankName))
        console.log(`\nOfficers with rank ${rankName}:`)
        const officers = await noblox.getPlayers(seamilitaryId, ranks.map(rank => rank.id))

        for (const officer of officers) {
            if (bilMemberIds.includes(officer.userId)) {
                console.log(`${officer.username} (${officer.userId})`)
            }
        }
    }

    
     
};

// test()




const test2 = async () => {

    const officerAccademyId = 35403813

    const bilGroupId = 34309406

    const officerAccademyRanks = await noblox.getRoles(officerAccademyId)

    const bilRanks = await noblox.getRoles(bilGroupId)

    const bilMembers = await noblox.getPlayers(bilGroupId, bilRanks.map(rank => rank.id))

    const bilMemberIds = bilMembers.map(member => member.userId)    
    
    for (const rankName of officerAccademyRanks.map(rank => rank.name)) {

        ranks = officerAccademyRanks.filter(rank=> rank.name.includes(rankName))
        console.log(`\n${rankName} that are in BIL:`)
        const officers = await noblox.getPlayers(officerAccademyId, ranks.map(rank => rank.id))

        for (const officer of officers) {
            if (bilMemberIds.includes(officer.userId)) {
                console.log(`${officer.username} (${officer.userId})`)
            }
        }
    }
     
};
test2()