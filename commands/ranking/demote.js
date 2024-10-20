const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json');
noblox.setCookie(config.sessionCookie)

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
        }

        
        let demotions = interaction.options.getInteger('demotions')
        if (!demotions) {
            demotions = 1
        }
        let responce = "";
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
                return interaction.editReply({embeds: [embeded_error.setDescription(updateResponce + "\nYou can't demote someone to a lower rank then what exists!")]})
            }
            const botHighestRole = interaction.guild.members.cache.get("1201941514520117280").roles.highest;
            const membersRole = interaction.guild.roles.cache.get(ranks[membersRankIndexInRanks].id);

            if (botHighestRole.comparePositionTo(membersRole) <= 0) {
                return interaction.editReply({ embeds: [embeded_error.setDescription(updateResponce + "\nI can't demote someone that is a higher rank than or equal to my highest role!")] });
            }
            if (membersRankIndexInRanks > promotersRankIndexInRanks) {
                return interaction.editReply({embeds: [embeded_error.setDescription(updateResponce + "\nYou can't demote someone that is a higher rank than yours!")]})
            }
            responce = await user.setRank(noblox, groupId, member, ranks[membersRankIndexInRanks - demotions] ).catch((err) => {
                return interaction.editReply({embeds: [embeded_error.setDescription(updateResponce + "\nAn error occured while trying to demote the user!")]})
            })
            user.promo_points = 0
            user.save()
            return interaction.editReply({embeds: [new EmbedBuilder().setDescription(updateResponce + "\n" + responce)]})
        } else {
                //!!!!! add removePromoPoints function to the user model
            // const responce = await user.addPromoPoints(noblox, groupId, member, ranks, demotions)
            return interaction.editReply({embeds: [embeded_error.setDescription(updateResponce + "\nErerej has not had the time to implement this part of the command yet!")]})
            user.save()
            return interaction.editReply({embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(updateResponce + "\n" + responce)]})
        }
    }
}