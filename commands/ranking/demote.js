const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json');
const getNameOfPromoPoints = require("../../functions/getNameOfPromoPoints.js");
const { premiumLock } = require('./quota.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('demote')
        .setDescription('Demotes a user to a lower rank! or removes promopoints')
        // .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Please input the user that will be demoted!')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('rank_or_promopoints')
                .setDescription('Please input whether to demote the user a whole rank or just some promopoints!')
                .setRequired(false)
                .addChoices(
                    { name: 'rank', value: 'rank'},
                    { name: 'promopoints', value: 'promopoints'}
                )
        )
        .addIntegerOption(option => 
            option.setName('demotions')
                .setDescription('How many promotions/promopoints to remove')
                .setRequired(false)
                .setMinValue(1)
        ),
        
    premiumLock: true,
    botPermissions: [PermissionsBitField.Flags.ManageRoles],
    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0]) 

        let promoter = await db.Users.findOne({ where: { user_id: interaction.member.id, guild_id: interaction.guild.id }})
        let promoterUpdateResponce = ""
        if (!promoter) {
            promoter = await db.Users.create({ user_id: interaction.member.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
            promoterUpdateResponce = await promoter.updateRank(noblox, groupId, interaction.member)
            if (promoter.rank_id === null) {
                promoter.destroy()
                return interaction.editReply({embeds: [embeded_error.setDescription("Couldn't verify your permissions due to not being able to verify your rank!")]})
            }
        } 
        const promoters_rank = db.Ranks.findOne({ where: { id: promoter.rank_id, guild_id: interaction.guild.id }})

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator) && !promoters_rank.is_officer) {
            embeded_error.setDescription("Insuficent permissions!")
            return interaction.editReply({ embeds: [embeded_error]});
		}

        let member = interaction.options.getUser('user')
        const ranks = (await db.Ranks.findAll({ where: { guild_id: interaction.guild.id }})).sort((a, b) => a.rank_index - b.rank_index)
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id }})
        const groupId = server.group_id
        member = await interaction.guild.members.fetch(member.id)
        let user = await db.Users.findOne({ where: { user_id: member.user.id, guild_id: interaction.guild.id }})
        if (!user) {
            user = await db.Users.create({ user_id: member.user.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
        }
        const updateResponce = await user.updateRank(noblox, groupId, member) ?? ""
        if (user.rank_id === null) {
            user.destroy()
            return interaction.editReply({embeds: [embeded_error.setDescription(updateResponce.message)]} )
        }

        const promologs = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "promologs" }})
        
        let demotions = interaction.options.getInteger('demotions')
        if (!demotions) {
            demotions = 1
        }
        let reply = (promoterUpdateResponce ? "Verified your rank: " + promoterUpdateResponce.message + "\n" : "") + `<@${member.id}>: ` + (updateResponce.message ? updateResponce.message + "\n" : "");
        if (interaction.options.getString('rank_or_promopoints') === 'rank') {
            let rank = await user.getRank()
            let membersRankIndexInRanks;
			ranks.some(function(tempRank, i) {
				if (tempRank.id == rank.id) {
					membersRankIndexInRanks = i;
					return true;
				}
			});
            let promotersRankIndexInRanks;
            ranks.some(function(tempRank, i) {
                if (tempRank.id == promoters_rank.id) {
                    promotersRankIndexInRanks = i;
                    return true;
                }
            });
            if (membersRankIndexInRanks - demotions >= ranks.length) {
                return interaction.editReply({embeds: [embeded_error.setDescription(reply + "\nYou can't demote someone to a lower rank then what exists!")]})
            }
            const botHighestRole = interaction.guild.members.cache.get("1201941514520117280").roles.highest;
            const membersRole = interaction.guild.roles.cache.get(ranks[membersRankIndexInRanks].id);

            if (botHighestRole.comparePositionTo(membersRole) <= 0) {
                return interaction.editReply({ embeds: [embeded_error.setDescription(reply + "\nI can't demote someone that is a higher rank than or equal to my highest role!")] });
            }
            if (membersRankIndexInRanks > promotersRankIndexInRanks) {
                return interaction.editReply({embeds: [embeded_error.setDescription(reply + "\nYou can't demote someone that is a higher rank than yours!")]})
            }
            const setRankResult = await user.setRank(noblox, groupId, member, ranks[membersRankIndexInRanks - demotions], updateResponce.robloxUser ).catch((err) => {
                return interaction.editReply({embeds: [embeded_error.setDescription(reply + "\nAn error occured while trying to demote the user!")]})
            })
            reply += setRankResult.message
            user.promo_points = 0
            user.save()

            if (promologs && !setRankResult.error) {
                const promolog = await interaction.guild.channels.fetch(promologs.channel_id)
                promolog.send({embeds: [new EmbedBuilder().setDescription(`<@${interaction.member.id}> demoted <@${member.id}> ${demotions}times!\n${reply}`)], content: `<@${member.id}>`})
            }

            return interaction.editReply({embeds: [new EmbedBuilder().setDescription(reply)]})
        } else {

            const removePromoPointsResponce = await user.removePromoPoints(noblox, groupId, member, ranks, demotions, updateResponce.robloxUser)
            reply += removePromoPointsResponce.message
            user.save()

            const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id)

            if (promologs && !removePromoPointsResponce.error ) {
                const promolog = await interaction.guild.channels.fetch(promologs.channel_id)
                promolog.send({embeds: [new EmbedBuilder().setDescription(`<@${interaction.member.id}> has demoted <@${member.id}> by ${demotions} ${nameOfPromoPoints}! \n${reply}`)], content: `<@${member.id}>`})
            }

            return interaction.editReply({embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(reply)]})
        }
    }
}