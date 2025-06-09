const { REST, Routes } = require('discord.js');
const { clientId, testingServers, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { default: test } = require('node:test');

const commands = [];
const guildLockedCommands = []
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			if ('guildLock' in command) {
				guildLockedCommands.push({data: command.data.toJSON(), guilds: command.guildLock})
			} else {
				commands.push(command.data.toJSON());
			}
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		let lockedGuilds = []

		let lockedCommandGuilds = guildLockedCommands.map(command => command.guilds) 
		lockedCommandGuilds.forEach((guilds) => {
			guilds.forEach((guild) => {
				if (!lockedGuilds.includes(guild)) {
				lockedGuilds.push(guild)
			}
			})
		})
		console.log(lockedGuilds)
		lockedGuilds.forEach(async (guild) => {
			let guildsCommands = commands
			guildsCommands = guildsCommands.concat(guildLockedCommands.filter((c => c.guilds.includes(guild))).map(c => c.data))
			console.log(guildLockedCommands.filter((c => c.guilds.includes(guild))).map(c => c.data.name))
			// console.log(guildsCommands.map(c => c.name).includes("givedj"))
			await rest.put(
				Routes.applicationGuildCommands(clientId, guild),
				{ body: guildsCommands},
			)
		})

		if (process.argv.includes('-t')) {
			testingServers.forEach(async (guildId) => {
				await rest.put(
					Routes.applicationGuildCommands(clientId, guildId),
					{ body: commands },
				);
				console.log(`Successfully reloaded ${commands.length} application (/) commands for guild ${guildId}.`);
			});
		} else if (process.argv.includes('-rt')) {
			rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
				.then(() => {
					console.log(`Successfully removed all application (/) commands for guild ${guildId}.`);
				})
				.catch(console.error);
		} else {
			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			);

			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		}	
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();