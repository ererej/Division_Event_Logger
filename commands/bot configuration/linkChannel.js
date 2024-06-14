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
                    { name: 'logs (short hand for all the logging types)', value: "logs"},
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
        const textChannels = ["logs", "expdisplay", "sealogs", "promologs", "raidlogs"]
        const logChannels = ["sealogs", "promologs", "raidlogs"]
        if (interaction.options.getChannel('channel').type === ChannelType.GuildVoice && !vcChannels.includes(interaction.options.getString('linktype')) ){
            return await interaction.editReply({ embeds: [embeded_error.setDescription('Please select a voice to link to this type of event!')] })
        } else if (interaction.options.getChannel('channel').type === ChannelType.GuildText && !textChannels.includes(interaction.options.getString('linktype')) && interaction.options.getString('linktype') != "logs") {
            return await interaction.editReply({ embeds: [embeded_error.setDescription('Please select a text channel to link to this type of event!')] })
        }
        let replyString = ""
        if (interaction.options.getString('linktype') == "logs") {
            for (let i = 0; i < logChannels.length; i++) {
                const channels = await db.Channels.findAll({ where: { guild_id: interaction.guild.id, type: logChannels[i] } }) //just in case there are some how multiple channels linked to the same type
                if (channels.length > 0) {
                    for (let j = 0; j < channels.length; j++) { //fuck foreach async!!!!!
                        await channels[j].destroy()
                        if (channels[j].channel_id != interaction.options.getChannel("channel").id) {
                            replyString += `Successfully unlinked <#${channels[j].channel_id}> from the **${logChannels[i]}** channel! \nAnd `
                        }
                    }
                }
                
                db.Channels.create({ channel_id: interaction.options.getChannel('channel').id, guild_id: interaction.guild.id, type: logChannels[i] })
                replyString += `Successfully made <#${interaction.options.getChannel('channel').id}> the **${logChannels[i]}** channel! \n`
            }
            return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString)] })
        }
        db.Channels.create({ channel_id: interaction.options.getChannel('channel').id, guild_id: interaction.guild.id, type: interaction.options.getString('linktype') })
        return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString + `Successfully made <#${interaction.options.getChannel('channel').id}> the **${interaction.options.getString('linktype')}** channel!`)] })
    }
}