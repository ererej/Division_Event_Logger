const { Events, ActivityType, ChannelType } = require('discord.js');
const config = require("../config.json")
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		if (config.host === "Laptop") {
			client.guilds.cache.forEach(guild => {
				let channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
				guild.invites.create(channels.first().id).then(invite => console.log(`[READY] ${guild.name} has ${guild.memberCount} members! Invite:  https://discord.gg/` + invite.code))
			
			});
		} else {
			client.guilds.cache.forEach(guild => {
					console.log(`[READY] ${guild.name} has ${guild.memberCount} members!`)
			});
		}
		client.user.setPresence({ activities: [{ name: client.guilds.cache.size + " divisions", type: ActivityType.Watching}], status: 'online' });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};