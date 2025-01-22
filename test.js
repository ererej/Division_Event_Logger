const noblox = require('noblox.js')
const config = require('./config.json')


const test = async () => {

    const groupID = 16992878
    const rankID = 94739437
    const targetUserID = 676685810 


    await noblox.setCookie(config.sessionCookie) 
    const user = await noblox.getAuthenticatedUser();
    console.log(user)
    console.log(`Logged in as ${user.UserName} [${user.UserID}]`)
    const Ranks = await noblox.getRoles(33030189)
    Ranks.forEach(rank => console.log(rank.name +" "+ rank.id + " " + rank.rank))
    noblox.setRank(groupID, targetUserID, rankID).then(() => {
        console.log("Ranked!")
    }).catch((err) => {
        console.log("a  " + err)
    }) 
};

test()
