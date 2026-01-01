const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors } = require('discord.js');
const db = require('../../dbObjects.js');
const { premiumLock } = require('./addMilestone.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('deletemilestone')
        .setDescription('Delete a milestone!')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('milestone')
                .setDescription('Please input the name of the milestone you want to delete!')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused(true);
        const choices = await db.Milestones.findAll({ where: { guild_id: interaction.guild.id } });
        const filtered = choices.filter(choice => choice.custom_name.toLowerCase().includes(focusedValue.value.toLowerCase()));
        await interaction.respond(filtered.slice(0, 25).map(choice => choice = { name: choice.custom_name, value: choice.id + "" }).slice(0, 25));

    },    

    premiumLock: true,

    async execute(interaction) {
		await interaction.deferReply()

		const embeded_error = new EmbedBuilder().setColor(Colors.Red)
        const dbMilestone = await db.Milestones.findOne({ where: { id: interaction.options.getString('milestone') } })
        if (!dbMilestone) {
            embeded_error.setTitle('Error').setDescription('The milestone you are trying to delete does not exist! to see all milestones run /listMilestones\n\n-# id?? ' + interaction.options.getString('milestone'))
            return interaction.editReply({embeds: [embeded_error]})
        }

        const deleteButton = new ButtonBuilder()
            .setCustomId('delete_milestone')
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        const row = new ActionRowBuilder().addComponents(deleteButton, cancel)

        const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Are you sure you want to delete the milestone called ${dbMilestone.custom_name}?`)], components: [row]})

        const collectorFilter = i => i.customId === 'delete_milestone' && i.user.id === interaction.user.id
        try {
            const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 60_000 })
            confirmation.deferUpdate()
            if (confirmation.customId === 'delete_milestone') {
                await dbMilestone.destroy()
                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The milestone called ${dbMilestone.custom_name} has been deleted!`)], components: []})
            } else if (confirmation.customId === 'cancel') {
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
};