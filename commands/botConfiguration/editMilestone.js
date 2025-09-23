const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField, ButtonBuilder, ActionRowBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require("../../dbObjects.js")

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
                .setDescription('Put to true if you want to change the milestone to be repeatable')
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
        const focusedValue = interaction.options.getFocused();
        const choices = await db.Milestones.findAll({ where: { guild_id: interaction.guild.id } });
        const filtered = choices.filter(choice => choice.name.startsWith(focusedValue));
        await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.id })));
    },

    async execute(interaction) {
        await interaction.deferReply();
        const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id);

    }
}