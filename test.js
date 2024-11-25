const noblox = require('noblox.js')
const config = require('./config.json')


const test = async () => {
    await noblox.setCookie(config.sessionCookie) 
    const user = await noblox.getAuthenticatedUser();
    console.log(user)
    console.log(`Logged in as ${user.UserName} [${user.UserID}]`)
    const Ranks = await noblox.getRoles(33030189)
    Ranks.forEach(rank => console.log(rank.name +" "+ rank.id + " " + rank.rank))
    noblox.setRank(33030189, 4238010058, 98558383).then(() => {
        console.log("Ranked!")
    }).catch((err) => {
        console.log(err)
    }) 
};

test()