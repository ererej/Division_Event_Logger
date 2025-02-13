const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const db = require("../../dbObjects.js");
const config = require('../../config.json')

module.exports = {
	data: new SlashCommandBuilder()
        .setName('linkrole')
        .setDescription('add a rank!')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Please input the role that you want to link to one or more ranks')
                .setRequired(true)
        )
		.addBooleanOption(option =>
            option.setName('link_to_all')
                .setDescription('Link this role to all ranks?')
                .setRequired(false)
        ),

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */

    async execute(interaction) {
		await interaction.deferReply()

		const embeded_error = new EmbedBuilder().setColor(Colors.Red)

        const discordRole = interaction.options.getRole('role');
        const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } })
        
        if (interaction.options.getBoolean('link_to_all')) {
            for (const rank of ranks) {
                if (rank.linked_roles) {
                    const linkedRoles = rank.linked_roles.split(',')
                    if (!linkedRoles.includes(discordRole.id)) {
                        linkedRoles.push(discordRole.id)
                        await rank.update({ linked_roles: linkedRoles.join(',') })
                    }
                } else {
                    await rank.update({ linked_roles: discordRole.id })
                }
            }
            return interaction.editReply({content: `Linked ${discordRole.name} to all ranks!`})
        }
        
        console.log(ranks.map(rank => rank = rank.id))

        const rankSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('rank_select')
            .setPlaceholder('Select the rank you want to link the role to')
            .setMinValues(1)
            .setMaxValues(ranks.length)
        //  rankSelectMenu.addOptions([{label: (await interaction.guild.roles.fetch("1073985742063292488")).name, value: "1073985742063292488"}])
        //  rankSelectMenu.addOptions([{label: (await interaction.guild.roles.fetch("1074271151683014686")).name, value: "1074271151683014686"}])
        //  rankSelectMenu.addOptions([{label: (await interaction.guild.roles.fetch("1074273406696042598")).name, value: "1074273406696042598"}])

        let options = await ranks.sort((a,b) => a.rank_index - b.rank_index)
        options = await Promise.all(
            options.map( async option => {
                const name = (await interaction.guild.roles.fetch(option.id)).name 
                return {
                    label: name, 
                    value: option.id
                }
            })
        )
        console.log(options)

        rankSelectMenu.addOptions(options)

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_selection')
            .setLabel('Confirm')
            .setStyle('Success')
        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_selection')
            .setLabel('Cancel')
            .setStyle('Danger')
        
        const rankSelectActionRow = new ActionRowBuilder().addComponents(rankSelectMenu)
        const buttonActionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton)

        
        const response = await interaction.editReply({content: 'Select the rank(s) you want to link the role to!', components: [rankSelectActionRow, buttonActionRow]})
        const collectorFilter = i => i.user.id === interaction.user.id
        let selectedRanks;
        try {
            while (true) {
                const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 300_000 })
                confirmation.deferUpdate()
                if (confirmation.customId === 'rank_select') {
                    selectedRanks = confirmation.values.map(value => ranks.find(rank => rank.id === value))
                } else if (confirmation.customId === 'confirm_selection') {
                    break;
                } else if (confirmation.customId === 'cancel_selection') {
                    return interaction.editReply({content: 'Why you canceling on me?!?!', components: []})
                }
            }

        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 300 secounds, cancelling!")], components: []})
            } else {
                    throw error
            }
        }

        for (const rank of selectedRanks) {
            if (rank.linked_roles) {
                const linkedRoles = rank.linked_roles.split(',')
                if (!linkedRoles.includes(discordRole.id)) {
                    linkedRoles.push(discordRole.id)
                    await rank.update({ linked_roles: linkedRoles.join(',') })
                }
            } else {
                await rank.update({ linked_roles: discordRole.id })
            }
        }
        return interaction.editReply({embeds:  [new EmbedBuilder().setDescription(`Linked the role: <@&` + discordRole + "> to the following ranks: \n<@&" + selectedRanks.join("> <@&") + ">").setColor(Colors.Green) ], components: [] })


    }
};
