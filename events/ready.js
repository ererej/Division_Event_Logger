const { Events, ActivityType, ChannelType } = require('discord.js');
const config = require("../config.json")
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		if (config.host === "Laptop") {
			console.log(`Ready! Logged in as ${client.user.tag}`);
			const objectGuilds = Array.from(client.guilds.cache.values()).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
			for (let i = 0; i < objectGuilds.length; i++) {
				let guild = objectGuilds[i];
				let channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
				const invite = await guild.invites.create(channels.first().id)
				console.log(i + ` [READY] ${guild.name} has ${guild.memberCount} members! Invite:  https://discord.gg/` + invite.code);
			}
			//This modified code uses `Array.from()` to convert the `client.guilds.cache` Map into an array. Then, it iterates over the array using a `for` loop and performs the desired operations on each guild.
		} else {
			client.guilds.cache.forEach(guild => {
				console.log(`Ready! Logged in as ${client.user.tag}`);
					console.log(`[READY] ${guild.name} has ${guild.memberCount} members!`)
			});
		}
		client.user.setPresence({ activities: [{ name: client.guilds.cache.size + " divisions", type: ActivityType.Watching}], status: 'online' });
	},
};