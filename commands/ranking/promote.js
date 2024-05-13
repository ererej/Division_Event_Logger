const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")


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
        if (interaction.getStringOption('rank_or_promopoints') === 'rank') {
            let rank = ranks.findOne({ where: { id: user.rank_id, guild_id: interaction.guild.id }})
            let promotions = interaction.getIntegerOption('promotions')
            if (!interaction.getIntegerOption('promotions')) {
                promotions = 1
            }
            let new_rank = await db.Ranks.findOne({ where: { rank_index: rank.rank_index+promotions, guild_id: interaction.guild.id }})
            if (!new_rank) {
                interaction.editReply({embeds: [embeded_error.setDescription("The rank you are trying to promote to does not exist!")]})
                return
            }
            user.rank_id = new_rank.id
            user.save()
            member.roles.add(new_rank.id)
            member.roles.remove(rank.id)
            const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id }})
            const nobloxResponce = noblox.setRank({ group: server.group_id, target: user.roblox_id, name: new_rank.roblox_id })
            nobloxResponce.then((res) => {
                interaction.editReply({content: `Promoted ${member.username} to ${new_rank.name}`})
            }).catch((err) => {
                interaction.editReply({embeds: [embeded_error.setDescription("An error occured while trying to promote the user in the roblox group!")]})
                return
            })
            interaction.editReply({content: `Promoted ${member.username} to ${new_rank.name}`})
        }
    }
}