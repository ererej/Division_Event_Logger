const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require("../../dbObjects.js");
const log = require('../logging/log.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('linkchannel')
        .setDescription('link a voice channel to an event type or function, like logs or expdisplay.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels || PermissionsBitField.Flags.ManageGuild || PermissionsBitField.Flags.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('the channel that will be linked to something.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('linktype')
                .setDescription('Please input the event type / funktion you want to link this channel to (select "none" to remove)!')
                .setRequired(true)
                .addChoices(
                    { name: 'training', value: "training" },
                    { name: 'patrol', value: "patrol" },
                    { name: "gamenight", value: "gamenight" },
                    { name: 'raid', value: "raid" },
                    { name: 'expdisplay', value: "expdisplay" },
                    { name: 'logs', value: "logs"},
                    { name: 'sealogs', value: "sealogs" },
                    { name: 'raidlogs', value: "raidlogs"},
                    { name: 'promologs', value: "promologs" },
                    { name: 'none', value: "none"}
                )
        ),

    async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,50])
        if (interaction.options.getString('linktype') === "none") {
            const channel = await db.Channels.findAll({ where: { guild_id: interaction.guild.id, channel_id: interaction.options.getChannel('channel').id } })
            channel.forEach(channel => {
                channel.destroy()
            })
            return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(`Successfully removed all links <#${interaction.options.getChannel('channel').id}> had!`)] })
        } 
        const vcChannels = ["training", "patrol", "raid", "gamenight"]
        const textChannels = [, "expdisplay", "sealogs", "promologs", "raidlogs", "logs"]
        const logChannels = ["sealogs", "promologs", "raidlogs"]
        if (interaction.options.getChannel('channel').type === ChannelType.GuildVoice && !vcChannels.includes(interaction.options.getString('linktype')) ){
            return await interaction.editReply({ embeds: [embeded_error.setDescription('Please select a voice to link to this type of event!')] })
        } else if (interaction.options.getChannel('channel').type === ChannelType.GuildText && !textChannels.includes(interaction.options.getString('linktype'))) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription('Please select a text channel to link to this type of event!')] })
        }
        let replyString = ""
        if (interaction.options.getString('linktype') === "logs") {
            logChannels.forEach(async (channelType) => {
                const channel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: channelType } })
                if (channel) {
                    channel.destroy()
                    replyString = `Successfully unlinked <#${channel.id}> from the **${interaction.options.getString('linktype')}** channel! \nAnd `
                }
                db.Channels.create({ channel_id: interaction.options.getChannel('channel').id, guild_id: interaction.guild.id, type: channelType })
                replyString += `Successfully made <#${interaction.options.getChannel('channel').id}> the **${channelType}** channel!`
            })
            return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString + `Successfully made <#${interaction.options.getChannel('channel').id}> the **${interaction.options.getString('linktype')}** channel!`)] })
        }
        db.Channels.create({ channel_id: interaction.options.getChannel('channel').id, guild_id: interaction.guild.id, type: interaction.options.getString('linktype') })
        return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString + `Successfully made <#${interaction.options.getChannel('channel').id}> the **${interaction.options.getString('linktype')}** channel!`)] })
    }
}