const fs = require('node:fs');
const path = require('node:path');
const { Op } = require('sequelize');
const { Client, codeBlock, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const config = require('./config.json');
const token = config.token;
const noblox = require('noblox.js');
const countFiles = require('./utils/countFiles');


const InvitesTracker = require('@ssmidge/discord-invites-tracker');

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
const tracker = InvitesTracker.init(client, {
    fetchGuilds: true,
    fetchVanity: false,
    fetchAuditLogs: true
});

const dirPath = path.join(__dirname);
countFiles(dirPath, /node_modules|\.git/).then(count => {
    console.log(`Total files (excluding node_modules): ${count}`);
});

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
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js')).filter(file => file != "guildMemberAdd.js" && file != "guildMemberRemove.js");

tracker.on('guildMemberAdd', async (member, type, invite) => {
    filePath = path.join(eventsPath, "guildMemberAdd.js")
    guildMemberAdd = require(filePath)
    try {
    guildMemberAdd.execute(member, type, invite)
    } catch (error) {
        console.error('Error executing guildMemberAdd:', error)
    }
})    


for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, async (...args) => {
            const testServer = client.guilds.cache.find(guild => guild.id === "831851819457052692");
            if (testServer && event.name != "interactionCreate" && event.name != "messageCreate") {
                const logsChannel = testServer.channels.cache.get("1313126303775457320");
                if (logsChannel) {
                    let time = new Date();
                    const timestamp = "[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] "; 

                    await logsChannel.send(timestamp + `${event.name} got triggered. Args:\n${args.join(", ")}`);
                }
            }
            event.execute(...args).catch((error) => {
                console.error(`Error executing ${event.name}:`, error);
                if (testServer) {
                    const logsChannel = testServer.channels.cache.get("1313126303775457320");
                    if (logsChannel) {
                        let errorLogs = "Error executing event: " + event.name + ": " 
                        errorLogs += "\n**Error type:** " + error.name
                        
                        // More detailed error information
                        if (error.message) {
                            errorLogs += "\n**Error message:** " + error.message
                        }
                        
                        // Add stack trace information (the most important part)
                        if (error.stack) {
                            // Limit the stack trace to a reasonable length to avoid Discord's message limits
                            const stackTrace = error.stack.substring(0, 1500);
                            errorLogs += "\n**Stack trace:**\n```\n" + stackTrace + "\n```"
                        }
                        
                        if (error.cause) {
                            errorLogs += "\n**Cause:** " + error.cause	
                        }
                        
                        if (error.lineNumber) {
                            errorLogs += "\n**Line number:** " + error.lineNumber
                        }
                        
                        
                        // Handle message length limits
                        if (errorLogs.length > 1900) {
                            // Split into multiple messages if too long
                            const chunks = [];
                            for (let i = 0; i < errorLogs.length; i += 1900) {
                                chunks.push(errorLogs.substring(i, i + 1900));
                            }
                            
                            chunks.forEach(chunk => {
                                logsChannel.send(chunk).catch(err => {
                                    console.error("Failed to send error log to channel:", err);
                                });
                            });
                        } else {
                            logsChannel.send(errorLogs).catch(err => {
                                console.error("Failed to send error log to channel:", err);
                            });
                        }
                    }
                }
            });
        });
	}
}

client.login(token);
})