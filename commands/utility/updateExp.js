const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js")
const getExp = require('../../functions/getExp.js');
const updateExp = require('../../functions/updateExp.js');
const getLinkedChannel = require('../../functions/getLinkedChannel.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateexp')
        .setDescription('Updates the Exp display!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageServer || PermissionsBitField.Flags.Administrator),

    botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages],

    async execute(interaction) {
        await interaction.deferReply()
        let server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        const exp = await getExp(interaction, server)
        if (typeof exp === "string") return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(exp).setColor([255, 0, 0])] })
        server.exp = exp
        const responce = await updateExp(db, server, interaction)
        if (typeof responce === "string") return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(responce).setColor([255, 0, 0])] })

            
        const reply = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`**Updated the exp to: ${server.exp}!**`).setColor([0,255,0])] })
        const expdisplayChannel = getLinkedChannel(interaction, db, { guild_id: interaction.guild.id, type: "expdisplay" })
        if (interaction.channel.id === expdisplayChannel.channel_id) {
            setTimeout(() => {
                reply.delete()
            }, 15_000);
        }
    }
};