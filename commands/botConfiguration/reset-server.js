const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require("../../dbObjects.js")


module.exports = {
	data: new SlashCommandBuilder()
        .setName('reset-server')
        .setDescription('DELETES ALL THE DATA FOR THE SERVER!!!!!!!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),


    async execute(interaction) {
        await interaction.deferReply()
        embeded_error = new EmbedBuilder().setColor(Colors.Red)

        if (interaction.member.id !== interaction.guild.ownerId) {
            return interaction.editReply({embeds: [embeded_error.setDescription("Only the server owner can use this command!")]})
        }


        const deleteButton = new ButtonBuilder()
            .setCustomId('reset_server')
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)

        const cancel = new ButtonBuilder()
            .setCustomId('cancel_reset_server')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        const row = new ActionRowBuilder().addComponents(deleteButton, cancel)

        const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Are you sure you want to **delete all** the Server Data? this includes all ranks, users, channel links, event data and more!!!`)], components: [row]})

        const collectorFilter = i => (i.customId === 'reset_server' || i.customId === 'cancel_reset_server') && i.user.id === interaction.user.id
        try {
            const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 60_000 })
            confirmation.deferUpdate()
            if (confirmation.customId === 'reset_server') {

                const confirm_server_reset = new ButtonBuilder()
                    .setCustomId('confirm_reset_server')
                    .setLabel('Confirm Reset')
                    .setStyle(ButtonStyle.Danger)
                const cancel_reset = new ButtonBuilder()
                    .setCustomId('cancel_reset_server_final')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
                const final_row = new ActionRowBuilder().addComponents(confirm_server_reset, cancel_reset)

                const final_response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`# This action is irreversible! Are you absolutely sure you want to reset the server data????`)], components: [final_row]})

                const final_collectorFilter = i => (i.customId === 'confirm_reset_server' || i.customId === 'cancel_reset_server_final') && i.user.id === interaction.user.id
                try {
                    const final_confirmation = await final_response.awaitMessageComponent({ Filter: final_collectorFilter, time: 60_000 })
                    final_confirmation.deferUpdate()
                    if (final_confirmation.customId === 'confirm_reset_server') {
                        const tables = [db.Ranks, db.Users, db.Channels, db.Events, db.Settings, db.Milestones, db.Officers]
                            for (const table of tables) {
                                await table.destroy({where: { guild_id: interaction.guild.id}})
                            }
                            return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`successfuly reset all server data!`)], components: []})
                    } else if (final_confirmation.customId === 'cancel_reset_server_final') {
                        return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The server reset has been cancelled!`)], components: []})
                    }
                } catch (error) {
                    if (error.message === "Collector received no interactions before ending with reason: time") {
                        return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 60 secounds, cancelling!")], components: []})
                } 

                const removeCount = await db.Ranks.destroy({where: { guild_id: interaction.guild.id}})
                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`successfuly removed all ${removeCount} ranks`)], components: []})
            }
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