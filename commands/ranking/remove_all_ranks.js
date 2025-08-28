const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require("../../dbObjects.js")


module.exports = {
	data: new SlashCommandBuilder()
        .setName('remove_ranks')
        .setDescription('removes all the ranks!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator),


    async execute(interaction) {
        await interaction.deferReply()
        embeded_error = new EmbedBuilder().setColor(Colors.Red)

        const deleteButton = new ButtonBuilder()
            .setCustomId('delete_all_ranks')
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)

        const cancel = new ButtonBuilder()
            .setCustomId('cancel_deleting_all_ranks')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        const row = new ActionRowBuilder().addComponents(deleteButton, cancel)

        const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Are you sure you want to **delete all** the Rank links?`)], components: [row]})

        const collectorFilter = i => (i.customId === 'delete_all_ranks' || i.customId === 'cancel_deleting_all_ranks') && i.user.id === interaction.user.id
        try {
            const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 60_000 })
            confirmation.deferUpdate()
            if (confirmation.customId === 'delete_all_ranks') {
                const removeCount = await db.Ranks.destroy({where: { guild_id: interaction.guild.id}})
                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`successfuly removed all ${removeCount} ranks`)], components: []})
            
            } else if (confirmation.customId === 'cancel_deleting_all_ranks') {
                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The deletion has been cancelled!`)], components: []})
            }
        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 60 secounds, cancelling!")], components: []})
        } else {
                throw error
        }
        }
    }
}