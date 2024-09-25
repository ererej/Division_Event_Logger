const noblox = require('noblox.js')
const config = require('./config.json')


const test = async () => {
    await noblox.setCookie(config.sessionCookie) 
    const user = await noblox.getAuthenticatedUser();
    console.log(`Logged in as ${user.UserName} [${user.UserID}]`)
    const Ranks = await noblox.getRoles(14354215)
    Ranks.forEach(rank => console.log(rank.name +" "+ rank.id))
    noblox.setRank(14354215, 556964501, 81465010).then(() => {
        console.log("Ranked!")
    }).catch((err) => {
        console.log(err)
    }) 
};

test()