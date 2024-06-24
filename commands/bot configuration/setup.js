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
                .addStringOption(option =>
                        option.setName('division_name')
                                .setDescription('Please input the name of your division!(this is only needed if its the servers name)')
                                .setRequired(false)
                )
                .addIntegerOption(option => 
                        option.setName('current_exp')
                                .setDescription('please input the current total exp of your division!')
                                .setRequired(false)
                ),

        async execute(interaction) {
                await interaction.deferReply()
                const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member.user.id === "386838167506124800") {
                        embeded_error.setDescription("Insuficent permissions!")
                        await interaction.editReply({ embeds: [embeded_error]});
		} else {
                        let guild = await db.Servers.findOne({ where: {guild_id: interaction.guild.id}})
                        
                        if (guild) {
                                guild.group_id = interaction.options.getInteger("roblox_group_id")
                                guild.exp = interaction.options.getInteger("current_exp") ? interaction.options.getInteger("current_exp") : guild.exp
                                guild.name = interaction.options.getString("division_name") ? interaction.options.getString("division_name") : guild.name ? guild.name : interaction.guild.name
                                await guild.save();
                                const embeded_reply = new EmbedBuilder().setDescription("successfuly updated the linked group and the total exp").setColor([0,255,0])
                                await interaction.editReply({ embeds: [embeded_reply]});
                        } else {
                                await db.Servers.create({ guild_id: interaction.guild.id, group_id: interaction.options.getInteger("roblox_group_id"), name: interaction.options.getString("division_name") ? interaction.options.getString("division_name") : interaction.guild.name, exp: interaction.options.getInteger("current_exp") ? interaction.options.getInteger("current_exp") : 0})
                                const embeded_reply = new EmbedBuilder().setDescription("server successfuly saved to the database and linked to the roblox group.").setColor([0,255,0])
                                await interaction.editReply({ embeds: [embeded_reply]});
                        }
                }
        }
}