const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName('massupdate')
        .setDescription('Massupdate is like /updateuser but for multiple users at once!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Select a role and everyone with that role will be updated!')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor(Colors.Red)
  


        let  role = interaction.options.getRole('role')
        await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Updating everyone with the role <@&${role.id}> please wait!`)] })
        const members = await interaction.guild.members.fetch()
        const membersWithRole = members.filter(member => member.roles.cache.has(role.id))

        if (membersWithRole.size === 0) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`No members found with the role <@&${role.id}>`)] })
        }
        

        let replyMessage = ""
        let amountUpdated = 0
        for (const member of membersWithRole.values()) {
            const groupId = ( await db.Servers.findOne({ where: { guild_id: interaction.guild.id }}) ).group_id
            let user = await db.Users.findOne({ where: { user_id: member.user.id, guild_id: interaction.guild.id }})
            if (!user) {
                user = await db.Users.create({ user_id: member.user.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
            }
            const responce = ( await user.updateRank(groupId, member) ).message
            
            if (!responce) {
                replyMessage += `${member}: ` + "was already up to date\n"
            }else if (responce.startsWith("Error")) {
                replyMessage += `${member}: ` + responce + "\n"
            } else if(responce) {
                replyMessage += `${member}: ` + responce + "\n"
            } 
            interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Updating everyone with the role <@&${role.id}> please wait!\n\n` + ["❤️", "💙", "💚", "💛", "💜", "🩷"][Math.floor(Math.random() * 6)].repeat(amountUpdated) + "🖤".repeat(membersWithRole.size - amountUpdated))] })
            amountUpdated++  
        }     
        interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Finished updating everyone with the role <@&${role.id}>!\n\n` + replyMessage).setColor(Colors.Green)] })
    }
};