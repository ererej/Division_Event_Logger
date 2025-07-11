const { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');
const testers = require('../tester_servers.json');
const db = require("../dbObjects.js")

module.exports = {
	name: Events.InteractionCreate,

	/**
	 * @param {import('discord.js').Interaction} interaction
	 * @returns {Promise<void>}
	 */
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild) return interaction.reply({ content: "Commands in DMs are disabled thanks to RY782 sorry!", MessageFlags: MessageFlags.Ephemeral });
		//check if the bot has critical permissions
		if (!interaction.guild.members.cache.get("1201941514520117280").permissions.has(PermissionsBitField.Flags.SendMessages) || !interaction.guild.members.cache.get("1201941514520117280").permissions.has(PermissionsBitField.Flags.ViewChannel)) {
			return interaction.user.send({ embeds: [new EmbedBuilder().setTitle("I'm missing permissions!").setDescription(`I'm need the following permissions to respond to commands: \`Send Messages\` and \`View Channel\``).setColor([255, 0, 0])] });
		}
		if (!interaction.guild) { return interaction.reply("Commands in DMs are disabled sorry!")}

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		if (command.disabled) {
			return interaction.reply("sorry this command has been disabled and is pending removal!")
		}

		try {
			//logs 
			const testServer = interaction.client.guilds.cache.get("831851819457052692")
			if (testServer) {
				const channel = testServer.channels.cache.get("1285158576448344064")
				const time = new Date(interaction.createdTimestamp)
				let subcommand = "";
				try {
					subcommand = interaction.options.getSubcommand()
				} catch (error) {}
				
				let logMessage = "[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] **/" + interaction.commandName + " " + subcommand + "** was ran. guild ID: " + interaction.guild.id + " guild name: " + interaction.guild.name +  " inputs: \n"
				interaction.options._hoistedOptions.forEach(option => {
					if ((logMessage + "**" + option.name + "** = " + option.value + " \n").length > 1900) {
						if (logMessage.length > 1950) {
							channel.send(logMessage.substring(0, 1950));
							logMessage = logMessage.substring(1950)
							channel.send(logMessage);
							
						}
						
						logMessage = ""
					}
					logMessage += "**" + option.name + "** = " + option.value + " \n" 
					channel.send(logMessage);
				})
            }
			//warning message
			if (config.host != "server" && interaction.guild.id !== "831851819457052692" && interaction.user.id != "386838167506124800") {
				interaction.user.send("# WARNING \nThe bot is currently running experimental code! Any changes made to the database might not be saved. Commands that wont work properly includes but is not limited to /linkChannel, /setup, /settings, /sealog, /addExp, /setExp and /updateExp. If you encounter any issues its most likely due to the bot running on a test database or that Ererej is currently changing the code for the command you ran. If you really need to use the command please contact Ererej(You can find his profile by searching for his name in the main SEA discord) and he will make the bot run on the normal database so that you can run the command.")
			}
			//tester lock
			if (command.testerLock && interaction.user.id != "386838167506124800" && !testers.servers.some(server => server.id == interaction.guild.id)) {
				return interaction.reply({ embeds: [new EmbedBuilder().setTitle("This command is locked to **testers only!**").setColor([255, 0, 0])] });
			} 

			if (command.premiumLock) {
				const server = await db.Servers.findOne({where: {guild_id: interaction.guild.id}})
				if (!server || !server.premium_end_date || server.premium_end_date < new Date()) {
					const premiumButton = new ButtonBuilder()
								.setStyle(6)
								.setSKUId('1298023132027944980')
					
					const row = new ActionRowBuilder().addComponents(premiumButton)
					return interaction.reply({ components: [row], embeds: [new EmbedBuilder().setTitle("This command is locked to **premium servers only!** You can get premium by pressing the button below and then running </useticket:1329067836886351953>! Most of the profits goes twords fuling Ererejs candy and pastery addiction :D").setColor([255, 0, 0])] });
				}
			}

			if (command.botPermissions) {
				const requiredPermissions = new PermissionsBitField(command.botPermissions);
				if (!interaction.guild.members.cache.get("1201941514520117280").permissions.has(requiredPermissions)) {
					interaction.reply({ embeds: [new EmbedBuilder().setTitle("I'm missing permissions!").setDescription(`I'm need the following permissions to run this command: \`${requiredPermissions.toArray().join(', ')}\``).setColor([255, 0, 0])] });
				} else {
					await command.execute(interaction);
				}
			} else {
				await command.execute(interaction);
			}
			
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
			const testServer = interaction.client.guilds.cache.get("831851819457052692")
            if (testServer) {
                const channel = testServer.channels.cache.get("1285158576448344064");
                if (channel) {
                    const time = new Date(interaction.createdTimestamp)

                    let errorLogs = "the interaction that was created at [" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] failed!"
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
                    
                    // Add command information for better context
                    errorLogs += "\n\n**Command:** /" + interaction.commandName;
                    
                    // Handle message length limits
                    if (errorLogs.length > 1900) {
                        // Split into multiple messages if too long
                        const chunks = [];
                        for (let i = 0; i < errorLogs.length; i += 1900) {
                            chunks.push(errorLogs.substring(i, i + 1900));
                        }
                        
                        chunks.forEach(chunk => {
                            channel.send(chunk).catch(err => {
                                console.error("Failed to send error log to channel:", err);
                            });
                        });
                    } else {
                        channel.send(errorLogs).catch(err => {
                            console.error("Failed to send error log to channel:", err);
                        });
                    }
                }
            }
		}
	},
};