const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
noblox.setCookie(db.sessionCookie)

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
        let member = interaction.options.getUser('user')
        let user = await db.Users.findOne({ where: { user_id: member.id, guild_id: interaction.guild.id }}).catch((err) => {
            interaction.editReply({embeds: [embeded_error.setDescription("User not found in the database!")]}) 
            return
        })
        const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id }})
        const groupId = await db.Servers.findOne({ where: { guild_id: interaction.guild.id }}).group_id
        if (interaction.getStringOption('rank_or_promopoints') === 'rank') {
            let rank = ranks.findOne({ where: { id: user.rank_id, guild_id: interaction.guild.id }})
            let promotions = interaction.getIntegerOption('promotions')
            while (promotions > 0) {
                if (promotions.promo_points + promotions >= ranks[rank.rank_index + 1].promo_points) {
                    const responce = user.promote(noblox, groupId, member, ranks ).catch((err) => {
                    interaction.editReply({embeds: [embeded_error.setDescription("An error occured while trying to promote the user in the roblox group!")]})
                    return
                })
                promotions -= promotions.promo_points + promotions - ranks[rank.rank_index + 1].promo_points
                }
            }
            interaction.editReply({content: responce})
        }
    }
}