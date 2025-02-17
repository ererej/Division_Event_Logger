const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require('discord.js');
const db = require("../../dbObjects.js");


module.exports = {
	data: new SlashCommandBuilder()
        .setName('unlinkrole')
        .setDescription('unlink a role from one or more ranks!')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Please input the role that you want to unlink from one or more ranks')
                .setRequired(true)
        )
		.addBooleanOption(option =>
            option.setName('remove_from_all')
                .setDescription('Unlink this role from all ranks?')
                .setRequired(false)
        ),

    premiumLock : true,

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */

    async execute(interaction) {
		await interaction.deferReply()

		const embeded_error = new EmbedBuilder().setColor(Colors.Red)

        const discordRole = interaction.options.getRole('role');
        const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } })

        if (ranks.length === 0) {
            return interaction.editReply({embeds: [embeded_error.setDescription("There are no ranks linked in this server! Please run /addrank or use /setup and run automatic ranksetup")]})
        }

        if (interaction.options.getBoolean('remove_from_all')) {
            for (const rank of ranks) {
                if (rank.linked_roles) {
                    const linkedRoles = rank.linked_roles
                    if (linkedRoles.includes(discordRole.id)) {
                        linkedRoles.splice(linkedRoles.indexOf(discordRole.id), 1)
                        await rank.update({ linked_roles: linkedRoles })
                    }
                }
            }
            return interaction.editReply({content: `Removed ${discordRole.name} from all ranks!`})
        }

        const ranksLinkedToRole = ranks.filter(rank => rank.linked_roles && rank.linked_roles.includes(discordRole.id))

        if (ranksLinkedToRole.length === 0) {
            return interaction.editReply({content: `Role ${discordRole.name} is not linked to any ranks!`})
        }

        const rankSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('rank_select')
            .setPlaceholder('Select the rank you want to link the role to')
            .setMinValues(1)
            .setMaxValues(ranksLinkedToRole.length)

        let options = ranksLinkedToRole.sort((a,b) => a.rank_index - b.rank_index)
        options = await Promise.all(
            options.map( async option => {
                const name = (await interaction.guild.roles.fetch(option.id)).name 
                return new StringSelectMenuOptionBuilder().setLabel(name).setValue(option.id)
            })
        )

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm')
            .setStyle(1)

        rankSelectMenu.addOptions(options)
        const actionRow = new ActionRowBuilder().addComponents(rankSelectMenu)

        const buttonActionRow = new ActionRowBuilder().addComponents(confirmButton)

        const responce = await interaction.editReply({content: `Select the rank you want to unlink ${discordRole.name} from!`, components: [actionRow, buttonActionRow]})

        selectedRanks = []
        const filter = i => i.user.id === interaction.user.id
        try {
            while (true) {
                const confirmation = await responce.awaitMessageComponent({ filter, time: 60000 })
                confirmation.deferUpdate()
                if (confirmation.customId === 'rank_select') {
                    selectedRanks = confirmation.values
                } else {
                    if (selectedRanks) {
                        break
                    } else {
                        interaction.followUp({content: "Please select a rank!", flags: MessageFlags.Ephemeral })
                        continue
                    }
                }
            }
        } catch (error) {
            return interaction.editReply({content: "You took too long to respond!", components: []})
        }
        let removedRanks = []
        for (const rank of ranksLinkedToRole) {
            if (selectedRanks.includes(rank.id)) {
                const linkedRoles = rank.linked_roles
                linkedRoles.splice(linkedRoles.indexOf(discordRole.id), 1)
                await rank.update({ linked_roles: linkedRoles })
                removedRanks.push(rank)
            }
        }
        return interaction.editReply({content: `Removed ${discordRole.name} from ${removedRanks.length} ranks!`, components: []})
    }
};