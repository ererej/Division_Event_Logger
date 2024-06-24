const { Events, ActivityType  } = require('discord.js');
const fs = require('fs');
const fileName = '../eventCount.json';
const file = require(fileName);

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		client.guilds.cache.forEach(guild => {
			console.log(`[READY] ${guild.name} has ${guild.memberCount} members!`);
		});
		client.user.setPresence({ activities: [{ name: `helping ${file.totalEvents}`, type: ActivityType.Streaming}], status: 'online' });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};