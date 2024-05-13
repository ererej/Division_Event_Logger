const noblox = require('noblox.js')
const config = require('./config.json')
noblox.setCookie(config.sessionCookie) 
noblox.getRoles(14354215).then(roles => {
    console.log(roles)
})