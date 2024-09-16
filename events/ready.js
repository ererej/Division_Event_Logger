const { Events, ActivityType, ChannelType } = require('discord.js');
const config = require("../config.json")
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		let totalMembers = 0
		if (config.host === "Laptop") {
			console.log(`Ready! Logged in as ${client.user.tag}`);
			const objectGuilds = Array.from(client.guilds.cache.values()).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
			for (let i = 0; i < objectGuilds.length; i++) {
				let guild = objectGuilds[i];
				let channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
				const invite = await guild.invites.create(channels.first().id)
				console.log(i + ` ${guild.name} has ${guild.memberCount} members!	Leaders id: ${guild.ownerId} 	Invite:  https://discord.gg/` + invite.code);
				totalMembers += guild.memberCount
			}
			//This modified code uses `Array.from()` to convert the `client.guilds.cache` Map into an array. Then, it iterates over the array using a `for` loop and performs the desired operations on each guild.
		} else {
			console.log(`Ready! Logged in as ${client.user.tag}`);
			client.guilds.cache.forEach(guild => {
				console.log(`[READY] ${guild.name} has ${guild.memberCount} members!`)
				totalMembers += guild.memberCount
			});
			const testServer = await client.guilds.cache.find(guild => guild.id == "831851819457052692")
			if (testServer) {
                const channel = await testServer.channels.fetch("1285158576448344064");
				channel.send("bot started <@386838167506124800>")
			}
		}
		client.user.setPresence({ activities: [{ name: "in Ace Of Aces against " + client.guilds.cache.size + " divisions and " + totalMembers + " players", type: ActivityType.Competing}], status: 'online' });
	},
};