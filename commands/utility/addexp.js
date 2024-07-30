const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionFlagsBits } = require('discord.js');
const db = require('../../dbObjects.js')
const updateExp = require('../../updateExp.js');
const { col } = require('sequelize');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addexp')
		.setDescription('create the sea logging format only!')
        //.setDefaultMemberPermissions(PermissionFlagsBits.ManageServer || PermissionFlagsBits.Administrator)
        .addIntegerOption(option => 
            option.setName('exp_to_add')
                .setDescription('the exp that the division has earned!')
                .setRequired(true)
        ),

	async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor(Colors.Red)
		if (!interaction.member.permissions.has(PermissionFlagsBits.ManageServer || PermissionFlagsBits.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            return await interaction.editReply({ embeds: [embeded_error]});
		} 
        const server = await db.Servers.findOne({where: {guild_id: interaction.guild.id}})
        if (!server) return await interaction.editReply({ embeds: [embeded_error.setDescription("please run the /setup command so that the server gets added to the data base")]})
        
        server.exp += interaction.options.getInteger('exp_to_add')
        server.save()
        updateExp(db, server, interaction)
        interaction.editReply({ embeds: [ new EmbedBuilder().setColor(Colors.GREEN).setDescription(`Successfully added ${interaction.options.getInteger('exp_to_add')} to the exp!`)]})
    }
}