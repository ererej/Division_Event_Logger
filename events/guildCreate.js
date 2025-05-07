const { Events, ActivityType, ChannelType } = require('discord.js');

module.exports = {
	name: Events.GuildCreate,

    /**
     * @param {import('discord.js').Guild} guild
     * 
    **/

	async execute(guild) {

        
        if (guild.ownerId == "1059872684881747978") {
            await guild.leave()
            console.log("got added to a server owned by akant, leaving")
            return
        }

        if (guild.memberCount < 50) {
            const akant = await guild.members.fetch("1059872684881747978").catch(err => {
                
                return false
            })
            if (akant) {
                guild.leave()
                console.log("got added to a server with akant in it, leaving")
                return
            }
        }

        const owner = await guild.members.fetch(guild.ownerId)
        owner.send("Thank you for adding me to your server! To get started run /setup in your server! This will take you thru basic setup of the bot.\n\nIf you need any help with the bot, feel free to join the support server: https://discord.gg/5Wj4ujSpzb")
    
        console.log("[JOIN] server join happend")
        //client.user.setPresence({ activities: [{ name: client.guilds.cache.size + " divisions", type: ActivityType.Watching}], status: 'online' });
    }
};