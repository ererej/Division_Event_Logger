const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const testers = require("../../tester_servers.json");


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
        
    testerLock: true,

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
            let rank = await db.Ranks.findOne({ where: { id: user.rank_id, guild_id: interaction.guild.id }})
            let new_rank = await db.Ranks.findOne({ where: { rank_index: rank.rank_index+interaction.getIntegerOption('promotions'), guild_id: interaction.guild.id }})
            if (!new_rank) {
                interaction.editReply({embeds: [embeded_error.setDescription("The rank you are trying to promote to does not exist!")]})
                return
            }
            user.rank_id = new_rank.id
            user.save()
            interaction.editReply({content: `Promoted ${member.username} to ${new_rank.name}`})
        }

    }
}