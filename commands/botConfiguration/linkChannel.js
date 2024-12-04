const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require("../../dbObjects.js");
const PublicGoogleSheetsParser = require('public-google-sheets-parser')
const spreadsheetId = '1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I'
const options = { useFormat: true }
const parser = new PublicGoogleSheetsParser(spreadsheetId, options)
const noblox = require("noblox.js");

const getExp = require('../../functions/getExp.js');
const updateExp = require('../../functions/updateExp.js');
const updateGroupMemberCount = require('../../functions/updateGroupMemberCount.js');
const updateGuildMemberCount = require('../../functions/updateGuildMemberCount.js');


module.exports = {
	data: new SlashCommandBuilder()
        .setName('linkchannel')
        .setDescription('link a voice channel to an event type or function, like logs or expdisplay.')
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
                    { name: 'training vc', value: "training" },
                    { name: 'patrol vc', value: "patrol" },
                    { name: 'tryout vc', value: "tryout" },
                    { name: "gamenight vc", value: "gamenight" },
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
    botPermissions: [PermissionsBitField.Flags.ManageChannels],
    async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,50])

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator || PermissionsBitField.Flags.ManageChannels || PermissionsBitField.Flags.ManageGuild)) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`You do not have the required permissions to use this command!`)] })
        }
        if (interaction.options.getString('linktype') === "none") {
            const channel = await db.Channels.findAll({ where: { guild_id: interaction.guild.id, channel_id: interaction.options.getChannel('channel').id } })
            channel.forEach(channel => {
                channel.destroy()
            })
            return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(`Successfully removed all links <#${interaction.options.getChannel('channel').id}> had!`)] })
        }
        const channel = interaction.options.getChannel('channel')
        const vcChannels = ["training", "patrol", "raid", "gamenight", "tryout"]
        const textChannels = ["logs", "expdisplay", "sealogs", "promologs", "raidlogs"]
        const logChannels = ["sealogs", "promologs", "raidlogs"]
        const VcDisplays = ["robloxGroupCount", "guildMemberCount"]
        if (channel.type === ChannelType.GuildVoice && !(vcChannels.includes(interaction.options.getString('linktype')) || VcDisplays.includes(interaction.options.getString('linktype')))) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`Please select a Text Channel to link **${interaction.options.getString('linktype')}** to!`)] })
        } else if (channel.type === ChannelType.GuildText && !textChannels.includes(interaction.options.getString('linktype')) && interaction.options.getString('linktype') != "logs") {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`Please select a Voice Channel to *${interaction.options.getString('linktype')}** to!`)] })
        }
        let replyString = ""

        // removes all the outdated db entrys

        const duplicateLinks = await db.Channels.findAll({ where: {guild_id: interaction.guild.id, type: interaction.options.getString('linktype'), channel_id: channel.id}})
        if (duplicateLinks.length === 1) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`This channelLink already exists!`)] })
        } else if (duplicateLinks.length > 1) {
            const duplicateCount = duplicateLinks.length
            for (let i = 1; i < duplicateLinks.length - 1; i++) {
                duplicateLinks[i].destroy()
            }
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`This channelLink already exists! (removed ${duplicateCount - 1 } extra links)`)] })
        }

        if (textChannels.includes(interaction.options.getString('linktype'))) {
            const oldLinks = await db.Channels.findAll({ where: {guild_id: interaction.guild.id, type: interaction.options.getString('linktype')}})
            oldLinks.forEach(link => {
                replyString += `Successfully unlinked <#${link.channel_id}> from being the **${link.type}** channel! \nAnd `
                link.destroy()
            })
        } else {

            
        }

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
            const dbChannel = await db.Channels.create({ channel_id: channel.id, guild_id: interaction.guild.id, type: 'expdisplay' })
            const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
            const exp = await getExp(interaction, server)
            if (typeof exp === "string") return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("The Channel Link was created and saved to the database but: " +  exp).setColor([255, 0, 0])] })
            server.exp = exp
            const responce = await updateExp(db, server, interaction)
            if (typeof responce === "string") return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("The Channel Link was created and saved to the database but: " +  responce).setColor([255, 0, 0])]})

                
            return await interaction.editReply(replyString + `EXP DISPLAY successfully created in <#${dbChannel.channel_id}>!`) 
        } else if (interaction.options.getString('linktype') == "guildMemberCount") {
            await updateGuildMemberCount({guild: interaction.guild, db: db, channel: channel})


        } else if (interaction.options.getString('linktype') == "robloxGroupCount") {
            await updateGroupMemberCount({noblox: noblox, guild: interaction.guild, db: db, channel: channel}).then((success) => {
                if (success === false) return interaction.editReply({ embeds: [embeded_error.setDescription("Failed to make the roblox group count display!")] })
            }).catch(err => {
                console.error(err)
                return interaction.editReply({ embeds: [embeded_error.setDescription("Failed to make the roblox group count display!")] })
            })
        }
        db.Channels.create({ channel_id: channel.id, guild_id: interaction.guild.id, type: interaction.options.getString('linktype') })
        return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString + `Successfully made <#${channel.id}> the **${interaction.options.getString('linktype')}** channel!`)] })
    }
}