const noblox = require('noblox.js')
const config = require('./config.json')


const test = async () => {

    const groupID = 34016362
     

    const Ranks = await noblox.getRoles(groupID)
    Ranks.forEach(rank => console.log(rank.name +" "+ rank.id + " " + rank.rank))
     
};

test()
