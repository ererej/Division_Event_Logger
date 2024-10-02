const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)

module.exports = {
	data: new SlashCommandBuilder()
        .setName('deleterank')
        .setDescription('edit an existing rank!')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addRoleOption(option => 
            option.setName('rank')
                .setDescription('Please input the role liked to the rank you want to edit!')
                .setRequired(true)
        ),

    async execute(interaction) {
		await interaction.deferReply()

		const embeded_error = new EmbedBuilder().setColor(Colors.Red)
        const dbRank = await db.Ranks.findOne({ where: { id: interaction.options.getRole('rank').id } })
        if (!dbRank) {
            embeded_error.setTitle('Error').setDescription('The rank you are trying to delete does not exist! to see all ranks run /ranks')
            return interaction.editReply({embeds: [embeded_error]})
        }

        const deleteButton = new ButtonBuilder()
            .setCustomId('delete_rank')
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        const row = new ActionRowBuilder().addComponents(deleteButton, cancel)

        const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Are you sure you want to delete the rank linked to <@&${dbRank.id}>?`)], components: [row]})

        const collectorFilter = i => i.customId === 'delete_rank' && i.user.id === interaction.user.id
        try {
            const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 60_000 })

            if (confirmation.customId === 'delete_rank') {
                await dbRank.destroy()
                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The rank linked to <@&${dbRank.id}> has been deleted!`)], components: []})
            } else if (confirmation.customId === 'cancel') {
                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The deletion has been cancelled!`)], components: []})
            }
        } catch (error) {
            console.error(error)
            return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 60 secounds, cancelling!")]})
        }
    }
};