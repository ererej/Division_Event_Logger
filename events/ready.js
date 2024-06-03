const { Events, ActivityType  } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		client.user.setPresence({ activities: [{ name: 'Playing Bermuda Air Base', type: ActivityType.Playing}], status: 'online' });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};