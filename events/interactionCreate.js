const { Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			const testServer = await interaction.client.guilds.cache.find(guild => guild.id == "831851819457052692")
			if (testServer) {
                const channel = await testServer.channels.fetch("1285158576448344064");
				const host = config.host
				const time = new Date(interaction.createdTimestamp + (host === "Laptop" ? 0 : 2) * 3600000)
				let subcommand = "";
				try {
					subcommand = interaction.options.getSubcommand()
				} catch (error) {}
				let logMessage = "[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] */" + interaction.commandName + " " + subcommand + "* was ran. guild ID: " + interaction.guild.id + " inputs: \n"
				interaction.options._hoistedOptions.forEach(option => {
					logMessage += "**" + option.name + "** = " + option.value + " \n" 
				});
                await channel.send(logMessage);
            }
			if (config.host != "server" && interaction.guild.id !== "831851819457052692") {
				interaction.user.send("# WARNING \nThe bot is currently running experimental code! Any changes made to the database wont be saved. Commands that wont work properly includes but is not limited to /linkChannel, /setup, /settings, /sealog, /addExp, /setExp and /updateExp. If you encounter any issues its most likely due to the bot running on a test database or that Ererej is currently changing the code for the command you ran. If you really need to use the command please contact Ererej(You can find his profile by searching for his name in the main SEA discord) and he will make the bot run on the normal database so that you can run the command.")
			}
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
			const testServer = await interaction.client.guilds.cache.find(guild => guild.id == "831851819457052692")
			if (testServer) {
                const channel = await testServer.channels.fetch("1285158576448344064");
				const host = config.host
				const time = new Date(interaction.createdTimestamp + (host === "Laptop" ? 0 : 2) * 3600000)

				let errorLogs = "the interaction that was created at [" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] failed!"
				errorLogs += "\n**Error type:** " + error.name
				if (error.message) {
					errorLogs += "\n*Error message:* " + error.message
				}
				if (error.cause) {
					errorLogs += "\n*cause:* " + error.cause	
				}
				if (error.lineNumber) {
					errorLogs += "\n*line number:* " + error.lineNumber
				}
				channel.send(errorLogs)
			}
		}
	},
};