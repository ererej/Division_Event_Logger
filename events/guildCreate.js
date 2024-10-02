const { Events, ActivityType, ChannelType } = require('discord.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(client) {

        const guild = await client.guilds.cache.find(guild => guild.id === arguments[0].id)
        const owner = await guild.members.cache.find(member => member.id === guild.ownerId)
        owner.send("Thank you for adding me to your server! If you need any help with the bot, feel free to join the support server: https://discord.gg/5Wj4ujSpzb")

        //console.log(typeof client)
        //const guild = client.guilds.cache.find(guild => guild.id === arguments[0].id)
        //console.log(arguments[0])
        //console.log(guild.channels)

        //console.log(arguments)
        //let channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
        //console.log("test")
		//const invite = await guild.invites.create(channels.first().id)
        //console.log(`[GUILD JOIN] ${guild.name} which has  ${guild.memberCount} members!` /*Invite:  https://discord.gg/` + invite.code*/)
        //console.log("hi")
        /*
        const testServer = client.guilds.cache.find(guild => guild.id == "831851819457052692")
        testServer.members.cache.find(ererej => ererej.id = "386838167506124800")
        */
        console.log("[JOIN] server join happend")
        //client.user.setPresence({ activities: [{ name: client.guilds.cache.size + " divisions", type: ActivityType.Watching}], status: 'online' });
    }
};