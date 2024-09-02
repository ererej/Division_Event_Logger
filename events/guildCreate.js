const { Events, ActivityType, ChannelType } = require('discord.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(client) {
        console.log(typeof client)
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
        client.user.setPresence({ activities: [{ name: client.guilds.cache.size + " divisions", type: ActivityType.Watching}], status: 'online' });
    }
};