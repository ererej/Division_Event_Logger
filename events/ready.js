const { Events, ActivityType, ChannelType } = require('discord.js');
const config = require("../config.json")
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		let totalMembers = 0
		const testServer = await client.guilds.cache.find(guild => guild.id == "831851819457052692")
		if (config.host === "Laptop") {
			console.log(`Ready! Logged in as ${client.user.tag}`);
			if (testServer) {
				const time = new Date()
                const commandLogs = await testServer.channels.fetch("1285158576448344064");
				commandLogs.send("**[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "]" + " Testing session started**")
				const eventLogs = await testServer.channels.fetch("1313126303775457320");
				eventLogs.send("# [" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "]" + " Testing session started")
			}

			if (!process.argv.includes("--test")) {
				const objectGuilds = Array.from(client.guilds.cache.values()).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
				for (let i = 0; i < objectGuilds.length; i++) {
					let guild = objectGuilds[i];
					let channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
					const invite = await guild.invites.create(channels.first().id)
					console.log(i + ` ${guild.name} has ${guild.memberCount} members!	ID: ${guild.id}	Leaders id: ${guild.ownerId} 	Invite:  https://discord.gg/` + invite.code);
					totalMembers += guild.memberCount
				}
			}
			if (process.argv.includes("--test2")) {
				const objectGuilds = Array.from(client.guilds.cache.values()).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
				for (let i = 0; i < objectGuilds.length; i++) {
					let guild = objectGuilds[i];
					console.log("Checking: " + guild.name)
					if (await guild.members.cache.get("1109099038915186718")) {
						let channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
						const invite = await guild.invites.create(channels.first().id)
						console.log( "TARGET FOUND IN: " + guild.name + " ID: " + guild.id + "	Leaders id: " + guild.ownerId + " 	Invite:  https://discord.gg/" + invite.code);
					}
				}
			}
		} else {
			console.log(`Ready! Logged in as ${client.user.tag}`);
			if (testServer) {
				let time = new Date()
				time = new Date( time +  2 * 3600000)
                const commandLogs = await testServer.channels.fetch("1285158576448344064");
				commandLogs.send("[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "]" + " Bot started <@386838167506124800>")
				const eventLogs = await testServer.channels.fetch("1313126303775457320");
				eventLogs.send("# [" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "]" + " Bot started ")
			}
			client.guilds.cache.forEach(guild => {
				console.log(`[READY] ${guild.name} has ${guild.memberCount} members!`)
				totalMembers += guild.memberCount
			});
		}
		client.user.setPresence({ activities: [{ name: "in Ace Of Aces against " + client.guilds.cache.size + " divisions and " + totalMembers + " players", type: ActivityType.Competing}], status: 'online' });
	},
};