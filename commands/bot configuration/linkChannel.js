const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require("../../dbObjects.js");
const PublicGoogleSheetsParser = require('public-google-sheets-parser')
const spreadsheetId = '1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I'
const options = { useFormat: true }
const parser = new PublicGoogleSheetsParser(spreadsheetId, options)
const updateExp = require('../../updateExp.js')
const noblox = require("noblox.js")

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
                    { name: 'robloxGroupCountDisplay', value: "robloxGroupCount" },
                    { name: 'guildMemberCountDisplay', value: "guildMemberCount" },
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
        const channel = interaction.options.getChannel('channel')
        const vcChannels = ["training", "patrol", "raid", "gamenight"]
        const textChannels = ["logs", "expdisplay", "sealogs", "promologs", "raidlogs"]
        const logChannels = ["sealogs", "promologs", "raidlogs"]
        const VcDisplays = ["robloxGroupCount", "guildMemberCount"]
        if (channel.type === ChannelType.GuildVoice && !(vcChannels.includes(interaction.options.getString('linktype')) || VcDisplays.includes(interaction.options.getString('linktype')))) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`Please select a voice to link **${interaction.options.getString('linktype')}** to!`)] })
        } else if (channel.type === ChannelType.GuildText && !textChannels.includes(interaction.options.getString('linktype')) && interaction.options.getString('linktype') != "logs") {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`Please select a text channel to *${interaction.options.getString('linktype')}** to!`)] })
        }
        let replyString = ""
        if (interaction.options.getString('linktype') == "logs") {
            for (let i = 0; i < logChannels.length; i++) {
                const channels = await db.Channels.findAll({ where: { guild_id: interaction.guild.id, type: logChannels[i] } }) //just in case there are some how multiple channels linked to the same type
                if (channels.length > 0) {
                    for (let j = 0; j < channels.length; j++) { //fuck foreach async!!!!!
                        await channels[j].destroy()
                        if (channels[j].channel_id != channel.id) {
                            replyString += `Successfully unlinked <#${channels[j].channel_id}> from the **${logChannels[i]}** channel! \nAnd `
                        }
                    }
                }
                
                db.Channels.create({ channel_id: channel.id, guild_id: interaction.guild.id, type: logChannels[i] })
                replyString += `Successfully made <#${channel.id}> the **${logChannels[i]}** channel! \n`
            }
            return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString)] })
        } else if (interaction.options.getString('linktype') == "expdisplay") {
            const dbChannel = db.Channels.create({ channel_id: interaction.options.getChannel('channel').id, guild_id: interaction.guild.id, type: 'expdisplay' })
            const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
            const division_name = server ? server.name : interaction.guild.name
            const sheetData = await parser.parse()
            const row = sheetData.find(row => row.Divisions === division_name)
            if (!row) return await interaction.editReply({ content: `could not locate the division: ${division_name} in the officer tracker!`, ephemeral: true})
            const exp = row.EXP.slice(10).trim()
            if (!exp) return await interaction.editReply({ content: `<#${dbChannel.channel_id}> was made the EXP DISPLAY channel but there was an error while fetching the exp! This is mostlikely due to your divisions name not being the same as your discord servers name. But it can also be due to your division needing to be in the officer tracker for this to work.`, ephemeral: true })
            if (!server) return await interaction.editReply({ content: 'This server is not registered in the database! Please ask an admin to register it using </setup:1217778156300275772>', ephemeral: true });
            server.exp = exp
            server.save()
            updateExp(db, server, interaction)
            return await interaction.editReply(`EXP DISPLAY successfully created in <#${dbChannel.channel_id}>!`) 
        } else if (interaction.options.getString('linktype') == "guildMemberCount") {
            interaction.guild.channels.cache.get(channel.id).setName(`Member Count: ${interaction.guild.memberCount}`)
        } else if (interaction.options.getString('linktype') == "robloxGroupCount") {
            const guild = interaction.guild
            db.Servers.findOne({where: {guild_id: guild.id}}).then(server => {
                if (server) {
                    noblox.getGroup(server.group_id).then(group => {
                        guild.channels.cache.get(channel.id).setName(`Members in group: ${group.memberCount}`)
                    })
                } else {
                    guild.channels.cache.get(channel.id).setName(`group not linked. please link a group with /setup`)
                }
            })
        }
        db.Channels.create({ channel_id: channel.id, guild_id: interaction.guild.id, type: interaction.options.getString('linktype') })
        return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString + `Successfully made <#${channel.id}> the **${interaction.options.getString('linktype')}** channel!`)] })
    }
}