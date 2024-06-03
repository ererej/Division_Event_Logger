const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require("../../dbObjects.js")

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
                    { name: 'sealogs', value: "sealogs" },
                    { name: 'promologs', value: "promologs" },
                    { name: 'none', value: "none"}
                )
        ),

    async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,50])
        if (interaction.options.getString('linktype') === "none") {
            const channel = await db.Channels.findAll({ where: { guild_id: interaction.guild.id, id: interaction.options.getChannel('channel').id } })
            channel.forEach(channel => {
                channel.destroy()
            })
            return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(`Successfully removed all links <#${interaction.options.getChannel('channel').id}> had!`)] })
        }
        if (!interaction.options.getChannel('channel').type === ChannelType.GuildVoice && (interaction.options.getString('linktype') === "training" || interaction.options.getString('linktype') === "patrol" || interaction.options.getString('linktype') === "raid") ) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription('Please select a voice to link to this type of event!')] })
        } else if (!interaction.options.getChannel('channel').type === ChannelType.GuildText && (interaction.options.getString('linktype') === "expdisplay" || interaction.options.getString('linktype') === "sealogs" || interaction.options.getString('linktype') === "promologs")) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription('Please select a text channel to link to this type of event!')] })
        }
        let replyString = ""
        const expdisplay = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplay" } })
        if (expdisplay && interaction.options.getString('linktype') === "expdisplay") {
            expdisplay.destroy()
            replyString = `Successfully unlinked <#${expdisplay.id}> from the **expdisplay** channel! \nAnd `
        }
        const sealogs = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: 'sealogs' } })
        if (sealogs && interaction.options.getString('linktype') === "sealogs") {
            sealogs.destroy()
            replyString = `Successfully unlinked <#${sealogs.id}> from the **sealogs** channel! \nAnd `
        }
        const promologs = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: 'promologs' } })
        if (promologs && interaction.options.getString('linktype') === "promologs") {
            promologs.destroy()
            replyString = `Successfully unlinked <#${promologs}> from the **promologs** channel! \nAnd `
        }
        db.Channels.create({ id: interaction.options.getChannel('channel').id, guild_id: interaction.guild.id, type: interaction.options.getString('linktype') })
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString + `Successfully made <#${interaction.options.getChannel('channel').id}> the **${interaction.options.getString('linktype')}** channel!`)] })
    }
}