const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");


module.exports = {
	data: new SlashCommandBuilder()
                .setName('setup')
                .setDescription('links the server to the roblox group and configures the divisions exp!')
                .addIntegerOption(option =>
                        option.setName('roblox_group_id')
                                .setDescription('Please input the roblox group id of your roblox group')
                                .setRequired(true)
                )
                .addIntegerOption(option => 
                        option.setName('current_exp')
                                .setDescription('please input the current total exp of your division!')
                                .setRequired(true)
                ),

        async execute(interaction) {
                await interaction.deferReply()
                const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!interaction.member.roles.cache.some(role => role.id === '1212084406282358846') && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        embeded_error.setDescription("Insuficent permissions!")
                        await interaction.editReply({ embeds: [embeded_error]});
		} else {
                        let guild = await db.Servers.findOne({ where: {guild_id: interaction.guild.id}})
                        
                        if (guild) {
                                guild.group_id = interaction.options.getInteger("roblox_group_id")
                                guild.exp = interaction.options.getInteger("current_exp")
                                await guild.save();
                                const embeded_reply = new EmbedBuilder().setDescription("successfuly update the linked group and the total exp").setColor([0,255,0])
                                await interaction.editReply({ embeds: [embeded_reply]});
                        } else {
                                await db.Servers.create({ guild_id: interaction.guild.id, group_id: interaction.options.getInteger("roblox_group_id"), exp: interaction.options.getInteger("current_exp")})
                                const embeded_reply = new EmbedBuilder().setDescription("server successfuly saved to the database and linked to the roblox group.").setColor([0,255,0])
                                await interaction.editReply({ embeds: [embeded_reply]});
                        }
                }
        }
}