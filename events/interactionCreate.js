const { Events } = require('discord.js');

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
				let logMessage = interaction.commandName + " was ran interaction: \n"
				interaction.options._hoistedOptions.forEach(option => {
					logMessage += "**" + option.name + "** = " + option.value + " \n" 
				});
                await channel.send(logMessage);
				console.log(interaction.options)
            }
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};