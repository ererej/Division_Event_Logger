const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require("../../dbObjects.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName('ranks')
        .setDescription('lists all the linked ranks!'),

    async execute(interaction) {
        await interaction.deferReply()  
        const rankList = new EmbedBuilder()
        .setTitle('Linked ranks:')
        .setColor('Green')
        const division_ranks = await db.Ranks.findAll({
            where: { guild_id: interaction.guild.id },
        })
        division_ranks.forEach(division_rank => {
            const rank_name = interaction.guild.roles.cache.get(division_rank.id).name
            rankList.addFields({name: `${rank_name}` ,value: `promo points required:  ${division_rank.promo_points} \nindex:  ${division_rank.rank_index}\nofficer: ${division_rank.is_officer}`})
        });
        interaction.editReply({embeds: [rankList]})
}};