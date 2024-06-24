const { Events, ActivityType  } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		client.guilds.cache.forEach(guild => {
			console.log(`[READY] ${guild.name} has ${guild.memberCount} members!`);
		});
		client.user.setPresence({ activities: [{ name: `Bermuda Air Base`, type: ActivityType.Playing}], status: 'online' });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};