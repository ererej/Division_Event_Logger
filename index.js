const fs = require('node:fs');
const path = require('node:path');
const { Op } = require('sequelize');
const { Client, codeBlock, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config.json');
const { Users, CurrencyShop } = require('./dbObjects.js');


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates ] });
 



client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

//loads the commands
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, async (...args) => {
		    const testServer = client.guilds.cache.find(guild => guild.id === "831851819457052692");
		    if (testServer) {
		        const logsChannel = testServer.channels.cache.get("1285158576448344064");
		        if (logsChannel) {
		            await logsChannel.send(`${event.name} got triggered. This was the first arg:\n${args[0]}`);
		        }
		    }
		    event.execute(...args);
		});
	}
}

client.login(token);
