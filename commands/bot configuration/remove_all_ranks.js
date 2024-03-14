const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js")


module.exports = {
	data: new SlashCommandBuilder()
        .setName('remove_ranks')
        .setDescription('removes all the ranks!'),


    async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
            const removeCount = await db.Ranks.destroy({where: { guild_id: interaction.guild.id}})
            const embededReply = new EmbedBuilder().setColor([255, 255, 0]).setDescription(`successfuly removed all ${removeCount} ranks`)
            interaction.editReply({embeds: [embededReply]})
        }
    }
}