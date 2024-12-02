const fs = require('node:fs');
const path = require('node:path');
const { Op } = require('sequelize');
const { Client, codeBlock, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const config = require('./config.json');
const token = config.token;
const noblox = require('noblox.js');

async function setCookieWithTimeout(cookie, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('ETIMEDOUT'));
        }, timeout);

        noblox.setCookie(cookie)
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

async function initializeNoblox() {
    try {
        await setCookieWithTimeout(config.sessionCookie, 30000); // Set timeout to 30 seconds
        console.log('Successfully set cookie');
    } catch (error) {
        console.error('Failed to set cookie:', error);
        process.exit(1); // Exit the process if setting the cookie fails
    }
}

initializeNoblox().then(() => {


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages ] });
 


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
            if (testServer && event.name != "interactionCreate") {
                const logsChannel = testServer.channels.cache.get("1313126303775457320");
                if (logsChannel) {
                    let time = new Date();
                    time = new Date(time.getTime() + (config.host === "Laptop" ? 0 : 1) * 3600000)
                    const timestamp = "# [" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] "; 

                    await logsChannel.send(timestamp + `${event.name} got triggered. Args:\n${args.join(", ")}`);
                }
            }
            event.execute(...args);
        });
	}
}

client.login(token);
})