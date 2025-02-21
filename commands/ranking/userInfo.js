const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const getNameOfPromoPoints = require("../../utils/getNameOfPromoPoints.js");

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
        const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id)
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
            
            const embeded = new EmbedBuilder().setColor([0,255,0])
            let description = ""
            description += `${user}'s information\n`
            description += `**User id**\n${user.id}\n`
            description += `**User rank**\n<@&${user_info.rank_id}>\n`
            description += `**${nameOfPromoPoints}**\n${user_info.promo_points}\n`
            description += `**Total events attended**\n${user_info.total_events_attended}\n`
            if (user_info.recruted_by) {
                description += "**Recruited by**\n" +`<@${user_info.recruted_by}>\n`
            } else {
                description += "**Recruited by**\n" + "<@386838167506124800> trust me bro!\n"
            }
            description += "**Officer**\n" + `${(await user_info.getRank()).is_officer}\n`
            //when the officer table is added make it dispay info about officers if the user is an officer

            embeded.setDescription(description)
            interaction.editReply({ embeds: [embeded]})
        } catch (error) {
            console.error(error)
            const embeded_error = new EmbedBuilder().setColor([255,0,0])
            embeded_error.setDescription("An error occured! the user might not be in the database!")
            interaction.editReply({ embeds: [embeded_error]});
        }   
    }
}