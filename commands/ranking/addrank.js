const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)

module.exports = {
	data: new SlashCommandBuilder()
        .setName('addrank')
        .setDescription('add a rank!')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addRoleOption(option => 
            option.setName('linked_role')
                .setDescription('Please input the role that will be linked to the rank')
                .setRequired(true)
        )
		.addIntegerOption(option =>
			option.setName('roblox_rank_id')
				.setDescription('Add the id/index of the roblox rank!')
				.setRequired(true)//set to true when adding roblox group binding
		)
        .addIntegerOption(option => 
            option.setName('promo_points')
                .setDescription('Input how many points are required to rank up to this rank!')
                .setRequired(true)
        )
		.addBooleanOption(option =>
			option.setName('officer')
				.setDescription('Input **True** if the members with this rank are able to host events')
				.setRequired(false)
		),

    async execute(interaction) {
		await interaction.deferReply()

		const embeded_error = new EmbedBuilder().setColor(Colors.Red)


        const discordRole = interaction.options.getRole('linked_role');
		const promo_points = interaction.options.getInteger('promo_points');
		let rank_index = 0
		const highest_rank_index = await db.Ranks.max("rank_index", { where: {guild_id: interaction.guild.id}})
		if (highest_rank_index || highest_rank_index === 0) {
			rank_index = highest_rank_index + 1
		}
		let roblox_id = 404
		let robloxRank
		if (interaction.options.getInteger('roblox_rank_id')) {
			const group = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
			robloxRank = await noblox.getRole(group.group_id, interaction.options.getInteger('roblox_rank_id'))
			if (robloxRank) {
				roblox_id = robloxRank.id
			} 
		} 

		let  is_officer;
		if (interaction.options.getBoolean('officer')) {
			is_officer = interaction.options.getBoolean('officer')
		} else {
			is_officer = false
		}

		let rank = await db.Ranks.findOne({ where: { id: discordRole.id, guild_id: interaction.guild.id}})
		
		if (rank) {
			embeded_error.setDescription("A rank is already linked to that role!")
			interaction.editReply({embeds: [embeded_error]})
		} else {
		try {
			rank = await db.Ranks.create({ id: discordRole.id, guild_id: interaction.guild.id, roblox_id: roblox_id, promo_points: promo_points, rank_index: rank_index, is_officer: is_officer })
			const embeded_reply = new EmbedBuilder().setDescription(`Rank **<@&${discordRole.id}>** succsesfuly linked to the roblox rank **${robloxRank ? robloxRank.name : "no rank found."}**.`).setColor(discordRole.color).setFooter({ text: "run **/ranks** to se all the ranks"})
			interaction.editReply({embeds: [embeded_reply]});
		}
		catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				interaction.editReply({ embeds: [embeded_error.setDescription('A rank is already linked to this role!')]});
			}
            console.log(error)
			interaction.editReply({ embeds: [ embeded_error.setDescription('Something went wrong with adding the rank.')]});
		}
		}
	}
};

