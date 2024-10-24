const noblox = require('noblox.js')
const config = require('./config.json')


const test = async () => {
    await noblox.setCookie(config.sessionCookie) 
    const user = await noblox.getAuthenticatedUser();
    console.log(`Logged in as ${user.name} [${user.id}]`)
    const Ranks = await noblox.getRoles(32552173)
    Ranks.forEach(rank => console.log(rank.name +" "+ rank.id + " " + rank.rank))
    noblox.setRank(14354215, 4238010058, 98558383).then(() => {
        console.log("Ranked!")
    }).catch((err) => {
        console.log(err)
    }) 
};

test()