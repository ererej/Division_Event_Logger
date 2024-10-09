const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js")
const testers = require("../../tester_servers.json");

module.exports = {
	data: new SlashCommandBuilder()
        .setName('clearusers')
        .setDescription('deletes all the users from the database!'),

    testerLock: true,

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])
        
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
            await db.Users.sync({where: { guild_id: interaction.guild.id}, force: true })
            const embededReply = new EmbedBuilder().setColor([255, 255, 0]).setDescription(`Successfuly removed all users`)
            interaction.editReply({embeds: [embededReply]})
        }
    }
}