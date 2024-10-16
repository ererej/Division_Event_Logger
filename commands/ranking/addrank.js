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
				.setMinValue(0)
				.setMaxValue(1_000_000)
        )
		.addStringOption(option =>
			option.setName('tag')
				.setDescription('Input the tag that should be displayed in front of the users name when they have this rank')
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('officer')
				.setDescription('Are the people with this rank able to host? (events will make obtainable false by default)')
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('obtainable')
				.setDescription('Input **False** to make the not obtainable with promo points')
				.setRequired(false)
		),

    async execute(interaction) {
		await interaction.deferReply()

		const embeded_error = new EmbedBuilder().setColor(Colors.Red)


        const discordRole = interaction.options.getRole('linked_role');
		const promo_points = interaction.options.getInteger('promo_points');
		

		let robloxRank
		if (interaction.options.getInteger('roblox_rank_id')) {
			const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
			if (!server) {
				return interaction.editReply({embeds: [embeded_error.setDescription('The server is not in the database! Run /setup to add the server to the database')]})
			}
			let multipleRanks;
            robloxRank = await noblox.getRole(server.group_id, interaction.options.getInteger('roblox_rank_id')).catch(async (err) => {
                if (err.message.includes('There are two or more roles with the rank')) {
                    multipleRanks = true;
                }
            });
            if (multipleRanks) {
                let ranks = await noblox.getRoles(group.group_id)
                ranks = ranks.filter(rank => rank.rank === interaction.options.getInteger('roblox_rank_id'))
                let rankString = ""
                ranks.forEach(rank => {
                    rankString += "\n" + rank.name + ": " + rank.id
                }) 
                return interaction.editReply({embeds: [embeded_error.setDescription("There are multiple roblox ranks with that rank index. Please rerun the command with ID of the rank you wanted to link. \nRanks with the index of " + interaction.options.getInteger("roblox_rank_id") + ":" + rankString)]})
            }
			if (!robloxRank) {
				embeded_error.setTitle('Error').setDescription('The roblox rank you are trying to link to does not exist!')
				return interaction.editReply({embeds: [embeded_error]})
			}
		} 
		const roblox_id = robloxRank.id

		let  is_officer;
		if (interaction.options.getBoolean('officer')) {
			is_officer = interaction.options.getBoolean('officer')
		} else {
			is_officer = false
		}

		let obtainable = true
		if (interaction.options.getBoolean('obtainable') === false || (is_officer && interaction.options.getBoolean('obtainable') === undefined)) {
			obtainable = false
		}

		let rank = await db.Ranks.findOne({ where: { id: discordRole.id, guild_id: interaction.guild.id}})
		
		if (rank) {
			embeded_error.setDescription("A rank is already linked to that role!")
			interaction.editReply({embeds: [embeded_error]})
		} else {
		try {
			rank = await db.Ranks.create({ id: discordRole.id, guild_id: interaction.guild.id, roblox_id: roblox_id, promo_points: promo_points, rank_index: robloxRank.rank, is_officer: is_officer, tag: interaction.options.getString('tag') ? interaction.options.getString('tag') : null, obtainable: obtainable})
			const embeded_reply = new EmbedBuilder().setDescription(`Rank **<@&${discordRole.id}>** succsesfuly linked to the roblox rank **${robloxRank.name}**. Obtainable set to: ${obtainable}`).setColor(discordRole.color).setFooter({ text: "run **/ranks** to se all the ranks"})
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

