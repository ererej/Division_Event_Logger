const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user from the database!')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Please input the user you want to get information about!')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply()
            const user = interaction.options.getUser('user')
            const user_info = await db.Users.findOne({
                where: { user_id: user.id, guild_id: interaction.guild.id }
            })
            if (!user_info) {
                const embeded_error = new EmbedBuilder().setColor([255,0,0])
                embeded_error.setDescription("The user is not in the database!")
                return interaction.editReply({ embeds: [embeded_error]});
            }
            const rank = await db.Ranks.findOne({where: { rank_id: user_info.rank_id}})
            const embeded = new EmbedBuilder().setColor([0,255,0])
            embeded.setTitle(`${user.username}'s information`)
            embeded.addFields({name: "User id", value: `${user.id}`})
            embeded.addFields({name: "User rank", value: `<@&${user_info.rank_id}>`})
            embeded.addFields({name: "Promotion points", value: `${user_info.promo_points}`})
            embeded.addFields({name: "Total events attended", value: `${user_info.total_events_attended}`})
            if (user_info.recruted_by) {
                embeded.addFields({name: "Recruited by", value: `<@${user_info.recruted_by}>`})
            } else {
                embeded.addFields({name: "Recruited by", value: "<@386838167506124800> trust me bro!"})
            }
            embeded.addFields({name: "Officer", value: `${user_info.is_officer}`})
            //when the officer table is added make it dispay info about officers if the user is an officer

            interaction.editReply({ embeds: [embeded]})
        } catch (error) {
            console.error(error)
            const embeded_error = new EmbedBuilder().setColor([255,0,0])
            embeded_error.setDescription("An error occured! the user might not be in the database!")
            interaction.editReply({ embeds: [embeded_error]});
        }   
    }
}