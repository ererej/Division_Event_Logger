const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName('ranks')
        .setDescription('lists all the linked ranks!'),

    async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,50])
		if (!interaction.member.roles.cache.some(role => role.id === '1212084406282358846') && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
        
        const rankList = new EmbedBuilder()
        .setTitle('Linked ranks:')
        .setColor('Green')
        const division_ranks = await db.Ranks.findAll({
            where: { guild_id: interaction.guild.id },
        })
        division_ranks.forEach(division_rank => {
            const rank_name = interaction.guild.roles.cache.get(division_rank.discord_rank_id).name
            rankList.addFields({name: `${rank_name}` ,value: `promo points required:  ${division_rank.promo_points} \nindex:  ${division_rank.rank_index}\nis officer: ${division_rank.is_officer}`})
        });
        interaction.editReply({embeds: [rankList]})
}}};