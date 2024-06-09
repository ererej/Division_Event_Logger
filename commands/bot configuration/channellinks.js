const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require("../../dbObjects.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName('channellinks')
        .setDescription('lists all the linked channels'),

    async execute(interaction) {
        await interaction.deferReply()  
        const channelLinksEmbed = new EmbedBuilder()
        .setTitle('Linked Channels:')
        .setColor('Green')
        const channelLinks = await db.Channels.findAll({
            where: { guild_id: interaction.guild.id },
        })
        const sealogChannel = channelLinks.find(channel => channel.type === "sealogs")
        const promologChannel = channelLinks.find(channel => channel.type === "promologs")
        const expdisplayChannel = channelLinks.find(channel => channel.type === "expdisplay")
        const trainingChannels = channelLinks.filter(channel => channel.type === "training")
        const patrolChannels = channelLinks.filter(channel => channel.type === "patrol")
        const gamenightChannels = channelLinks.filter(channel => channel.type === "gamenight")
        channelLinksEmbed.addFields({name: 'Sealog Channel:', value: sealogChannel ? `<#${sealogChannel.channel_id}>` : "not linked"})
        channelLinksEmbed.addFields({name: 'PromoLog Channel:', value: `${promologChannel ? `<#${promologChannel.channel_id}>` : "not linked"}`})
        channelLinksEmbed.addFields({name: 'ExpDisplay Channel:', value: `${expdisplayChannel ? `<#${expdisplayChannel.channel_id}>` : "not linked"}`})
        channelLinksEmbed.addFields({name: 'Training Channels:', value: `${trainingChannels.length > 0 ? trainingChannels.map(channel => `<#${channel.channel_id}>`).join("\n") : "none linked"}`})
        channelLinksEmbed.addFields({name: 'Patrol Channels:', value: `${patrolChannels.length > 0 ? patrolChannels.map(channel => `<#${channel.channel_id}>`).join("\n") : "none linked"}`})
        channelLinksEmbed.addFields({name: 'Gamenight Channels:', value: `${gamenightChannels.length > 0 ? gamenightChannels.map(channel => `<#${channel.channel_id}>`).join("\n") : "none linked"}`})
        .setFooter({ text: `if you want to link a channel to an event type or function, like logs or expdisplay. use the /linkchannel command!`})
        interaction.editReply({embeds: [channelLinksEmbed]})
}};