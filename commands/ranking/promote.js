const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const testers = require("../../tester_servers.json");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)

module.exports = {
	data: new SlashCommandBuilder()
        .setName('promote')
        .setDescription('Promotes a user to a higher rank! or adds ')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
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

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])

        let tester = false
        testers.servers.forEach(server => {
            if ( !tester && server.id === interaction.guild.id) {
                tester = true
            }
        });
        if (!tester) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription('This command is **only enabled** for testers!')] });
        }  

        let member = interaction.options.getUser('user')
        let user = await db.Users.findOne({ where: { user_id: member.id, guild_id: interaction.guild.id }})
        if (!user) {
            return interaction.editReply({embeds: [embeded_error.setDescription("User not found in the database!")]})
        }
        let promoter = await db.Users.findOne({ where: { user_id: interaction.member.id, guild_id: interaction.guild.id }})
        if (!promoter) {
            return interaction.editReply({embeds: [embeded_error.setDescription("You are not in the database!")]})
        } 
        const promoters_rank = db.Ranks.findOne({ where: { id: promoter.rank_id, guild_id: interaction.guild.id }})

        const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id }})
        const groupId = await db.Servers.findOne({ where: { guild_id: interaction.guild.id }}).group_id
        let promotions = interaction.options.getInteger('promotions')
        if (!promotions) {
            promotions = 1
        }
        let responce = "";
        if (interaction.options.getString('rank_or_promopoints') === 'rank') {
            let rank = await db.Ranks.findOne({ where: { id: user.rank_id, guild_id: interaction.guild.id }})
            if (rank.rank_index + promotions > promoters_rank.rank_index) {
                return interaction.editReply({embeds: [embeded_error.setDescription("You can't promote someone to a rank higher than yours!")]})
            }
            if (rank.rank_index + promotions >= ranks.length) {
                return interaction.editReply({embeds: [embeded_error.setDescription("You can't promote someone to a rank higher than the highest rank!")]})
            }
            responce = await user.setRank(noblox, groupId, member, rank ).catch((err) => {
                return interaction.editReply({embeds: [embeded_error.setDescription("An error occured while trying to promote the user!")]})
            })
            console.log(responce)
            return interaction.editReply({content: responce})
        } else {
            console.log(user.rank_id)
            //let rank = await db.Ranks.findOne({ where: { id: user.rank_id, guild_id: interaction.guild.id }})
            let rank = await user.getRank(db.Ranks)
            console.log(rank)
            while (promotions > 0) {
                console.log("a")
                user.promo_points += 1
                promotions -= 1
                console.log(ranks.find( tempRank =>  tempRank.rank_index === rank.rank_index))
                if (ranks.find( tempRank =>  tempRank.rank_index === rank.rank_index + 1)) {
                    if (user.promo_points >= ranks.findOne({ where: { rank_index: rank.rank_index + 1, guild_id: interaction.guild.id }}).promo_points) {
                        responce += await user.setRank(noblox, groupId, member, rank ).catch((err) => {
                            return interaction.editReply({embeds: [embeded_error.setDescription(`An error occured while trying to promote the user!\nThe user ended up with ${user.promo_points} promo points and the rank <&${rank.id}>!`)]})
                        })
                        console.log("awidjoawjsdzx")
                        console.log(responce)
                        responce += "\n"
                    } else {
                        break
                    }
                } else {
                    responce += "UndefinedThe user has reached the highest rank!"
                    break
                }
            }
            console.log("test")
            return interaction.editReply({content: responce})
        }
    }
}