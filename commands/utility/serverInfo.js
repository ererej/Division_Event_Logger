const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Colors } = require('discord.js');
const db = require("../../dbObjects.js")
const noblox = require("noblox.js")

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
        let premiumSatus;
        if (server === null) {
            return interaction.editReply("This server has no data in the database. Please run the </setup:1217778156300275772> command!")
        } else if (server.premium_end_date === null) {
            premiumSatus = "This server has no premium subscription. \n You can buy some by going to the bots store on my profile or by pressing the button below and buying a premium ticket!\n\n"
        } else if (server.premium_end_date < Date.now()) {
            premiumSatus = `This server's premium subscription has expired since ${Date.now() - premium_end_date / 1000 / 60 / 60 / 24} days ago. \nYou can buy more buy going to the bots store on my profile or pressing the button below and buying a premium ticket!\n\n`
        } else {
            premiumSatus = `This server has premium until <t:${Math.floor(server.premium_end_date/1000)}:d>`
        }

        const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } })
        const users = await db.Users.findAll({ where: { guild_id: interaction.guild.id } })
        const channelLinks = await db.Channels.findAll({ where: { guild_id: interaction.guild.id } })
        const officers = await db.Officers.findAll({ where: { guild_id: interaction.guild.id } })
        const events = await db.Events.findAll({ where: { guild_id: interaction.guild.id } })
        const settings = await db.Settings.findAll({ where: { guild_id: interaction.guild.id } })

        let description = premiumSatus
        + `\n\nThis server has **${ranks.length}** linked ranks \n - You can see them all with */ranks* or link more with the */addRank* command! \n\n`
        + `This server has **${users.length}** saved users \n - Users get saved when they attend their first event that is logged with */log* or when */updateUser* is ran on them! \n\n`
        + `This server has **${channelLinks.length}** linked channels \n - You can see them all with */channelLinks* or link more with the */linkChannel* command! \n\n`
        + `This server has **${officers.filter(officer => officer.retired === null).length}** active officers and **${officers.filter(officer => officer.retired !== null).length}** retired officers \n - A user is considerd an officer if they have an rank with officer set to true and they have attended/hosted an event or ran */updateuser* \n\n`
        + `This server has **${events.length}** events logged \n - Events are only saved when they are logged with */log* \n\n`
        + `This server has **${settings.length}** settings saved \n - run */settings listsetttings* to view them all or set more with /settings!`
        return interaction.editReply({embeds: [new EmbedBuilder().setDescription(description).setColor(Colors.Green)], components: [row]})
    }
}