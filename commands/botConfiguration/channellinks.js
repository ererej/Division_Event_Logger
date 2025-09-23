const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require("../../dbObjects.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channellinks')
        .setDescription('Lists all the linked channels'),

    async execute(interaction) {
        await interaction.deferReply();
        
        // Get all channel links for the guild
        const channelLinks = await db.Channels.findAll({
            where: { guild_id: interaction.guild.id },
        });

        // Create embed
        const channelLinksEmbed = new EmbedBuilder()
            .setTitle('Linked Channels:')
            .setColor('Green')
            .setFooter({ 
                text: 'To link a channel to an event type or function, use the /linkchannel command!'
            });

        // Define channel types and their display names
        const singleChannelTypes = [
            { type: "sealogs", displayName: "Sealog Channel" },
            { type: "raidlogs", displayName: "RaidLog Channel" },
            { type: "promologs", displayName: "PromoLog Channel" },
            { type: "recruitmentlogs", displayName: "RecruitmentLog Channel" },
            { type: "milestonelogs", displayName: "MilestoneLog Channel" },
            { type: "banlogs", displayName: "BanLog Channel" },
            { type: "expdisplay", displayName: "ExpDisplay Channel" },
            { type: "vcexpdisplay", displayName: "VcExpDisplay Channel" },
            { type: "vcsmallexpdisplay", displayName: "VcSmallExpDisplay Channel" },
            { type: "vcleveldisplay", displayName: "VcLevelDisplay Channel" },
            { type: "vcexpandleveldisplay", displayName: "VcExpAndLevelDisplay Channel" },
            { type: "robloxGroupCount", displayName: "RobloxGroupCount Channel" },
            { type: "guildMemberCount", displayName: "GuildMemberCount Channel" },
        ];

        const multipleChannelTypes = [
            { type: "training", displayName: "Training Channels" },
            { type: "patrol", displayName: "Patrol Channels" },
            { type: "tryout", displayName: "Tryout Channels" },
            { type: "raid", displayName: "Raid Channels" },
            { type: "gamenight", displayName: "Gamenight Channels" },
        ];

        // Add single channel fields
        for (const { type, displayName } of singleChannelTypes) {
            const channel = channelLinks.find(channel => channel.type === type);
            channelLinksEmbed.addFields({
                name: displayName + ":",
                value: channel ? `<#${channel.channel_id}>` : "not linked"
            });
        }

        // Add multiple channel fields
        for (const { type, displayName } of multipleChannelTypes) {
            const channels = channelLinks.filter(channel => channel.type === type);
            channelLinksEmbed.addFields({
                name: displayName + ":",
                value: channels.length > 0 
                    ? channels.map(channel => `<#${channel.channel_id}>`).join("\n") 
                    : "none linked"
            });
        }

        // Send the embed
        interaction.editReply({ embeds: [channelLinksEmbed] });
    }
};