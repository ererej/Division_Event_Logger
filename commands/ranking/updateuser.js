const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const testers = require("../../tester_servers.json");
const noblox = require("noblox.js")
const config = require('../../config.json')

module.exports = {
	data: new SlashCommandBuilder()
        .setName('updateuser')
        .setDescription('updates a user in the database and makes sure the user is the correct rank on roblox and discord!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Please input the user that you want to be updated!')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor(Colors.Red)

        let tester = false
        testers.servers.forEach(server => {
            if ( !tester && server.id === interaction.guild.id) {
                tester = true
            }
        });
        if (!tester) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription('This command is **only enabled** for testers!')] });
        }  

        let  member = interaction.options.getUser('user')
        await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Updating <@${member.id}> please wait!`)] })
        member = await interaction.guild.members.fetch(member.id)
        const groupId = ( await db.Servers.findOne({ where: { guild_id: interaction.guild.id }}) ).group_id
        let user = await db.Users.findOne({ where: { user_id: member.user.id, guild_id: interaction.guild.id }})
        if (!user) {
            user = await db.Users.create({ user_id: member.user.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
        }
        const responce = ( await user.updateRank(noblox, groupId, member) ).message
        if (user.rank_id === null) {
            user.destroy()
        }
        if (!responce) {
            return await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`${member}: ` + "was already up to date").setColor(Colors.Green)] })
        }else if (responce.startsWith("Error")) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`${member}: ` + responce)] })
        } else if(responce) {
            return await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`${member}: ` + responce).setColor(Colors.Yellow)] })
        }        
    }
};