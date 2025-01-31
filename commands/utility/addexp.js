const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const db = require('../../dbObjects.js')
const updateExp = require('../../functions/updateExp.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addexp')
		.setDescription('adds exp to the exp in the database and updates any expdisplay!')
        //.setDefaultMemberPermissions(PermissionFlagsBits.ManageServer || PermissionFlagsBits.Administrator)
        .addIntegerOption(option => 
            option.setName('exp_to_add')
                .setDescription('the exp that the division has earned!')
                .setRequired(true)
                .setMaxValue(100000)
        ),
    botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages],
	async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor(Colors.Red)
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            return await interaction.editReply({ embeds: [embeded_error]});
		} 
        const server = await db.Servers.findOne({where: {guild_id: interaction.guild.id}})
        if (!server) return await interaction.editReply({ embeds: [embeded_error.setDescription("please run the /setup command so that the server gets added to the data base")]})
        
        server.exp += interaction.options.getInteger('exp_to_add')
        server.save()
        const responce = await updateExp(db, server, interaction)
        if (typeof responce === "string") return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(responce).setColor([255, 0, 0])] })

        
        interaction.editReply({ embeds: [ new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully added ${interaction.options.getInteger('exp_to_add')} to the exp!`)]})
    }
}