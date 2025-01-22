const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Colors } = require('discord.js');
const db = require("../../dbObjects.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('lists some info about this server!'),

    async execute(interaction) {
        //interaction.client.emit('guildCreate', interaction.guild)
        await interaction.deferReply() 
        
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })

        const premiumButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Premium)
            .setSKUId('1298023132027944980')

        const row = new ActionRowBuilder().addComponents(premiumButton)

        const embeded_error = new EmbedBuilder().setColor(Colors.Red)

        if (server === null) {
            return interaction.editReply("This server has no data in the database. Please run the </setup:1217778156300275772> command!")
        } else if (server.premium_end_date === null) {
            return interaction.editReply({ embeds: [embeded_error.setDescription("This server has no premium subscription. \nVVV You can buy some here VVV")], components: [row] })
        } else if (server.premium_end_date < Date.now()) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`This server's premium subscription has expired since ${Date.now() - premium_end_date / 1000 / 60 / 60 / 24} days ago. \nVVV You can buy more here VVV`)], components: [row] })
        } else {
            return interaction.editReply(`This server has premium until <t:${Math.floor(server.premium_end_date/1000)}:d>`)
        }
    }
}