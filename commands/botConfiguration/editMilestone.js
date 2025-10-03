const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField, ButtonBuilder, ActionRowBuilder, UserSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const db = require("../../dbObjects.js")
const getNameOfPromoPoints = require('../../utils/getNameOfPromoPoints.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editmilestone')
        .setDescription("Allows you to edit milestones")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('milestone')
                .setDescription('Please input the name of the milestone you want to edit!')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('new_name')
                .setDescription('The new name of the milestone')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('edit_reward')
                .setDescription('The new reward for the milestone')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('edit_condition')
                .setDescription('Put to true if you want to change the milestone condition amount/rank')
                .setRequired(false),
        )
        .addBooleanOption(option =>
            option.setName('repeatable')
                .setDescription('Determines if the milestone is repeatable or not')
                .setRequired(false),
        )
        .addRoleOption(option =>
            option.setName('minimum_rank')
                .setDescription('The new minimum rank required to achieve the milestone')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('maximum_rank')
                .setDescription('The new maximum rank required to achieve the milestone')
                .setRequired(false)
        ),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused(true);
        const choices = await db.Milestones.findAll({ where: { guild_id: interaction.guild.id } });
        const filtered = choices.filter(choice => choice.custom_name.toLowerCase().includes(focusedValue.value.toLowerCase()));
        await interaction.respond(filtered.slice(0, 25).map(choice => choice = { name: choice.custom_name, value: choice.id + "" }).slice(0, 25));

    },

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    **/  
    async execute(interaction) {
        await interaction.deferReply();
        const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id);

        const milestone = await db.Milestones.findOne({ where: { id: interaction.options.getString('milestone'), guild_id: interaction.guild.id } })
        let reply = ""

        if (interaction.options.getString('new_name')) {
            milestone.custom_name = interaction.options.getString('new_name')
            reply += `Updated milestone name to: ${interaction.options.getString('new_name')}\n`
        }

        if (interaction.options.getBoolean('edit_reward')) {
            const editRewardTypeButton = new ButtonBuilder()
                .setCustomId('edit_reward_type')
                .setLabel('Edit reward type')
                .setStyle(ButtonStyle.Primary)
            const editRewardAmountButton = new ButtonBuilder()
                .setCustomId('edit_reward_amount')
                .setLabel('Edit reward amount')
                .setStyle(ButtonStyle.Primary)
            const row = new ActionRowBuilder().addComponents(editRewardTypeButton, editRewardAmountButton)
            const response = await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription('What about the reward do you want to edit?')], components: [row] })
            const collectorFilter = i => (i.customId === 'edit_reward_type' || i.customId === 'edit_reward_amount' || i.customId === 'cancel') && i.user.id === interaction.user.id
            try {
                const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 120_000 })
                confirmation.deferUpdate()
                if (confirmation.customId === 'edit_reward_type') {
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('select_reward_type')
                        .setPlaceholder('Select the new reward type')
                        .addOptions(
                            { label: 'Promo Points', value: 'promo_points' },
                            { label: 'Promotions', value: 'promotions' },
                            { label: 'Role', value: 'role' },
                        )
                    const row = new ActionRowBuilder().addComponents(selectMenu)
                    const response = await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription('Select the new reward type')], components: [row] })
                    const collectorFilter = i => i.customId === 'select_reward_type' && i.user.id === interaction.user.id
                    try {
                        const selection = await response.awaitMessageComponent({ filter: collectorFilter, time: 120_000 })
                        selection.deferUpdate()
                        milestone.reward_type = selection.values[0]
                        milestone.reward = null
                        if (selection.values[0] === 'role' && milestone.reward_type !== 'role') {
                            reply += `Updated reward type to: Role\n`
                        } else {
                            reply += `Updated reward type to: ${selection.values[0] === 'promo_points' ? nameOfPromoPoints : 'Role'}\n`
                        }
                    } catch (error) {
                        console.error('Error selecting reward type:', error)
                    }
                } 

                if (milestone.reward_type === 'promo_points' || milestone.reward_type === 'promotions') {
                    const collectorFilter = response => {
                        return response.author.id === interaction.member.id && !isNaN(response.content);
                    };

                    const response = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Please provide the amount of *${milestone.reward_type}* to give for the milestone! \n**Please type the amount below.**`)], fetchReply: true, components: [] })

                    try {
                        const collected = await response.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300_000, errors: ['time'] });
                        reward.value = condition.value = Math.round(parseInt(collected.first().content) < 0 ? 0 : collected.first().content);
                        collected.first().delete()
                    } catch (error) {
                        if (error.message === "Collector received no interactions before ending with reason: time") {
                            interaction.followUp({ embeds: [new EmbedBuilder().setDescription('No reward amount provided Aborting!').setColor([255,0,0])] });
                            return;
                        }
                        console.error(error);
                        return;
                    }

                } else {
                    const roleSelectMenu = new RoleSelectMenuBuilder()
                        .setCustomId('select_role_reward')
                        .setPlaceholder('Select the role you want to give as a reward')
                    const row = new ActionRowBuilder().addComponents(roleSelectMenu)
                    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription('Please select the new role reward')], components: [row] })
                    const collectorFilter = i => i.customId === 'select_role_reward' && i.user.id === interaction.user.id
                    try {
                        const selection = await response.awaitMessageComponent({ filter: collectorFilter, time: 300_000 })
                        selection.deferUpdate()
                        milestone.reward = selection.values[0]
                        reply += `Updated reward role to: <@&${selection.values[0]}>\n`
                    } catch (error) {
                        if (error.message === "Collector received no interactions before ending with reason: time") {
                            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("No responce was given in within 300 seconds, cancelling!").setColor(Colors.Red)], components: [] })
                        } else {
                            console.error('Error selecting role reward:', error)
                        }
                    }
                } 
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("No responce was given in within 300 seconds, cancelling!").setColor(Colors.Red)], components: [] })
                } else {
                    throw error
                }
            }
        }

        if (interaction.options.getBoolean('edit_condition')) {
            if (milestone.condition_type === 'integer' ) {
                const collectorFilter = response => {
                    return response.author.id === interaction.member.id && !isNaN(response.content);
                }

                const response = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Please provide the new amount required to reach this milestone! \n**Please type the amount below.**`)], fetchReply: true, components: [] })
                try {
                    const collected = await response.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300_000, errors: ['time'] });
                    milestone.condition_config = Math.round(parseInt(collected.first().content) < 0 ? 0 : collected.first().content);
                    collected.first().delete()
                    reply += `Updated condition amount to: ${milestone.condition_config}\n`
                } catch (error) {
                    if (error.message === "Collector received no interactions before ending with reason: time") {
                        interaction.followUp({ embeds: [new EmbedBuilder().setDescription('No condition amount provided Aborting!').setColor([255,0,0])] });
                        return;
                    }
                    console.error(error);
                    return;
                }
            } else if (milestone.condition_type === 'role') {
                const rankSelectMenu = new UserSelectMenuBuilder()
                    .setCustomId('select_condition_rank')
                    .setPlaceholder('Select the new rank required for the milestone')
                const row = new ActionRowBuilder().addComponents(rankSelectMenu)
                const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } })
                if (ranks.length === 0) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('There are no ranks registered in the bot! You cannot have a rank condition without having ranks registered!')], components: [] })
                
                const response = await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription('Please select the new rank condition')], components: [row] })
                const collectorFilter = i => i.customId === 'select_condition_rank' && i.user.id === interaction.user.id
                try {
                    const selection = await response.awaitMessageComponent({ filter: collectorFilter, time: 300_000 })
                    selection.deferUpdate()
                    if (!ranks.map(r => r.id).includes(selection.values[0])) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('The rank you selected is not registered as a rank in the bot!')], components: [] })
                    milestone.condition = selection.values[0]
                    reply += `Updated condition rank to: <@&${selection.values[0]}>\n`
                } catch (error) {
                    if (error.message === "Collector received no interactions before ending with reason: time") {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("No responce was given in within 300 seconds, cancelling!").setColor(Colors.Red)], components: [] })
                    } else {
                        console.error('Error selecting condition rank:', error)
                    }
                }
                
            } else {
                interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('Ererej has forgoten to add support for editing milestones of this condition type! Please report this issue!')], components: [] })
                throw new Error('Unknown condition type')
            }
        
        }

        if (interaction.options.getBoolean('repeatable') !== null) {
            milestone.repeatable = interaction.options.getBoolean('repeatable');
            reply += `Updated repeatable to: ${interaction.options.getBoolean('repeatable') ? 'True' : 'False'}\n`
        }

        let ranks;
        if (interaction.options.getRole('minimum_rank')) {
            ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } })
            if (!ranks.map(r => r.id).includes(interaction.options.getRole('minimum_rank').id)) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('The minimum rank you provided is not registered as a rank in the bot!')], components: [] })
            if (interaction.options.getRole('maximum_rank') && interaction.options.getRole('maximum_rank').position <= interaction.options.getRole('minimum_rank').position) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('The maximum rank must be higher than the minimum rank!')], components: [] })
            milestone.minimum_rank = interaction.options.getRole('minimum_rank').id
            reply += `Updated minimum rank to: <@&${interaction.options.getRole('minimum_rank').id}>\n`
        }

        if (interaction.options.getRole('maximum_rank')) {
            if (!ranks) ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } })
            if (!ranks.map(r => r.id).includes(interaction.options.getRole('maximum_rank').id)) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('The maximum rank you provided is not registered as a rank in the bot!')], components: [] })
            if (interaction.options.getRole('minimum_rank') && interaction.options.getRole('maximum_rank').position <= interaction.options.getRole('minimum_rank').position) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('The maximum rank must be higher than the minimum rank!')], components: [] })
            milestone.maximum_rank = interaction.options.getRole('maximum_rank').id
            reply += `Updated maximum rank to: <@&${interaction.options.getRole('maximum_rank').id}>\n`
        }


        interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(reply || "No changes made to the milestone")], components: [] })
        
        await milestone.save()
    }

}
