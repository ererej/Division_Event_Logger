const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const testers = require("../../tester_servers.json");
const noblox = require("noblox.js")
const config = require('../../config.json');
noblox.setCookie(config.sessionCookie)

module.exports = {
	data: new SlashCommandBuilder()
        .setName('promote')
        .setDescription('Promotes a user to a higher rank! or adds ')
        // .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Please input the user that will be promoted!')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('rank_or_promopoints')
                .setDescription('Please input whether to promote the user a whole rank or just some promopoints!')
                .setRequired(false)
                .addChoices(
                    { name: 'rank', value: 'rank'},
                    { name: 'promopoints', value: 'promopoints'}
                )
        )
        .addIntegerOption(option => 
            option.setName('promotions')
                .setDescription('How many promotions/promopoints to give')
                .setRequired(false)
        ),
        
    testerLock: true,
    botPermissions: [PermissionsBitField.Flags.ManageRoles],
    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0]) 

        let promoter = await db.Users.findOne({ where: { user_id: interaction.member.id, guild_id: interaction.guild.id }})
        if (!promoter) {
            return interaction.editReply({embeds: [embeded_error.setDescription("You are not in the database!")]})
        } 
        const promoters_rank = db.Ranks.findOne({ where: { id: promoter.rank_id, guild_id: interaction.guild.id }})

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator) && !promoters_rank.is_officer) {
            embeded_error.setDescription("Insuficent permissions!")
            return interaction.editReply({ embeds: [embeded_error]});
		}

        let member = interaction.options.getUser('user')
        member = await interaction.guild.members.fetch(member.id)
        let user = await db.Users.findOne({ where: { user_id: member.user.id, guild_id: interaction.guild.id }})
        if (!user) {
            return interaction.editReply({embeds: [embeded_error.setDescription("User not found in the database!")]})
        }

        const ranks = (await db.Ranks.findAll({ where: { guild_id: interaction.guild.id }})).sort((a, b) => a.rank_index - b.rank_index)
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id }})
        const groupId = server.group_id
        let promotions = interaction.options.getInteger('promotions')
        if (!promotions) {
            promotions = 1
        }
        let responce = "";
        if (interaction.options.getString('rank_or_promopoints') === 'rank') {
            let rank = await user.getRank()
            if (ranks.indexOf(tRank => tRank === rank) + promotions > ranks.indexOf(promoters_rank)) {
                return interaction.editReply({embeds: [embeded_error.setDescription("You can't promote someone to a rank higher than yours!")]})
            }
            if (ranks.indexOf(rank) + promotions >= ranks.length) {
                return interaction.editReply({embeds: [embeded_error.setDescription("You can't promote someone to a rank higher than the highest rank!")]})
            }
            responce = await user.setRank(noblox, groupId, member, ranks[ranks.indexOf(rank) + promotions] ).catch((err) => {
                return interaction.editReply({embeds: [embeded_error.setDescription("An error occured while trying to promote the user!")]})
            })
            user.promo_points = 0
            user.save()
            return interaction.editReply({content: responce})
        } else {
            const responce = await user.addPromoPoints(noblox, groupId, member, ranks, promotions)
            user.save()
            return interaction.editReply({embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(responce)]})
        }
    }
}