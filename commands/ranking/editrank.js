const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)

module.exports = {
	data: new SlashCommandBuilder()
        .setName('editrank')
        .setDescription('edit an existing rank!')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addRoleOption(option => 
            option.setName('rank')
                .setDescription('Please input the role liked to the rank you want to edit!')
                .setRequired(true)
        )
		.addIntegerOption(option =>
			option.setName('roblox_rank_id')
				.setDescription('Add the id/index of the roblox rank!')
		)
        .addIntegerOption(option => 
            option.setName('promo_points')
                .setDescription('Input how many points are required to rank up to this rank!')
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
				.setDescription('Input **True** if the members with this rank are able to host events')
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
        const dbRank = await db.Ranks.findOne({ where: { id: interaction.options.getRole('rank').id } })
        if (!dbRank) {
            embeded_error.setTitle('Error').setDescription('The rank you are trying to edit does not exist! to see all ranks run /ranks')
            return interaction.editReply({embeds: [embeded_error]})
        }
        
        let robloxRank;
        if (interaction.options.getInteger('roblox_rank_id')) {
            const group = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
            let multipleRanks;
            robloxRank = await noblox.getRole(group.group_id, interaction.options.getInteger('roblox_rank_id')).catch(async (err) => {
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
            dbRank.roblox_id = robloxRank.id
            dbRank.rank_index = robloxRank.rank
        }

        if (interaction.options.getInteger('promo_points')) {
            dbRank.promo_points = interaction.options.getInteger('promo_points')
        }

        if (interaction.options.getBoolean('officer')) {
            dbRank.is_officer = interaction.options.getBoolean('officer')
        }
        if (interaction.options.getString('tag')) {
            dbRank.tag = interaction.options.getString('tag')
        }
        if (interaction.options.getBoolean('obtainable') !== null) {
            dbRank.obtainable = interaction.options.getBoolean('obtainable')
        }
        dbRank.save()

        return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription(`The rank <@&${dbRank.id}> has been updated! ${robloxRank ? `\nThe rank was linked to the roblox rank: ${robloxRank.name}` : ''} ${interaction.options.getInteger('promo_points') ? `\nThe promo points required got updated to: ${dbRank.promo_points}` : ''} ${interaction.options.getBoolean('officer') != undefined ? `\nIf the rank is an officer rank was updated to: ${dbRank.is_officer}` : ''} ${interaction.options.getBoolean("obtainable") != undefined ? `\nObtainable was updated to: ${interaction.options.getBoolean("obtainable")}` : ""} ${interaction.options.getString("tag") ? "The tag was updated to: " + interaction.options.getString("tag") : ""}`)] } )
    }
};