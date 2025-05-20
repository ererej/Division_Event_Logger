const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js");

const getExp = require('../../utils/getExp.js');
const updateExp = require('../../utils/updateExp.js');
const updateGroupMemberCount = require('../../utils/updateGroupMemberCount.js');
const updateGuildMemberCount = require('../../utils/updateGuildMemberCount.js');


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
                    { name: 'vcexpdisplay', value: "vcexpdisplay" },
                    { name: 'vcsmallexpdisplay', value: "vcsmallexpdisplay" },
                    { name: 'vcleveldisplay', value: "vcleveldisplay" },
                    { name: 'robloxGroupCountDisplay', value: "robloxGroupCount" },
                    { name: 'guildMemberCountDisplay', value: "guildMemberCount" },
                    { name: 'logs (short hand for all the logging types)', value: "logs"},
                    { name: 'sealogs', value: "sealogs" },
                    { name: 'raidlogs', value: "raidlogs"},
                    { name: 'promologs', value: "promologs" },
                    { name: 'banlogs', value: "banlogs" },
                    { name: 'none', value: "none"}
                )
        ),
    botPermissions: [PermissionsBitField.Flags.ManageChannels],
    async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,50])
        const linkType = interaction.options.getString('linktype')

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator || PermissionsBitField.Flags.ManageChannels || PermissionsBitField.Flags.ManageGuild)) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`You do not have the required permissions to use this command!`)] })
        }
        if (linkType === "none") {
            const channel = await db.Channels.findAll({ where: { guild_id: interaction.guild.id, channel_id: interaction.options.getChannel('channel').id } })
            channel.forEach(channel => {
                channel.destroy()
            })
            return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(`Successfully removed all links <#${interaction.options.getChannel('channel').id}> had!`)] })
        }

        

        const channel = interaction.options.getChannel('channel')
        const vcChannels = ["training", "patrol", "raid", "gamenight", "tryout"]
        const textChannels = ["logs", "expdisplay", "sealogs", "promologs", "raidlogs", "banlogs"]
        const logChannels = ["sealogs", "promologs", "raidlogs", "banlogs"]
        const VcDisplays = ["robloxGroupCount", "guildMemberCount", "vcexpdisplay", "vcleveldisplay", "vcsmallexpdisplay"]
        
        if (channel.type === ChannelType.GuildVoice && !(vcChannels.includes(linkType) || VcDisplays.includes(linkType))) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`Please select a Text Channel to link **${linkType}** to!`)] })
        } else if (channel.type === ChannelType.GuildText && !textChannels.includes(linkType) && linkType != "logs") {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`Please select a Voice Channel to **${linkType}** to!`)] })
        }
        let replyString = ""

        // removes all the outdated db entrys

        const duplicateLinks = await db.Channels.findAll({ where: {guild_id: interaction.guild.id, type: linkType, channel_id: channel.id}})
        if (duplicateLinks.length === 1) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`This channelLink already exists!`)] })
        } else if (duplicateLinks.length > 1) {
            const duplicateCount = duplicateLinks.length
            for (let i = 1; i < duplicateLinks.length - 1; i++) {
                duplicateLinks[i].destroy()
            }
            return await interaction.editReply({ embeds: [embeded_error.setDescription(`This channelLink already exists! (removed ${duplicateCount - 1 } extra links)`)] })
        }

        if (textChannels.includes(linkType)) {
            const oldLinks = await db.Channels.findAll({ where: {guild_id: interaction.guild.id, type: linkType}})
            oldLinks.forEach(link => {
                replyString += `Successfully unlinked <#${link.channel_id}> from being the **${link.type}** channel! \nAnd `
                link.destroy()
            })
        } 

        if (linkType == "logs") {
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
        } else if (["expdisplay", "vcexpdisplay", "vcsmallexpdisplay", "vcleveldisplay"].includes(linkType)) {
            const dbChannel = await db.Channels.create({ channel_id: channel.id, guild_id: interaction.guild.id, type: linkType })
            const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
            if (!server) {
                dbChannel.destroy()
                return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("The server was not found in the database! please run /setup!").setColor([255, 0, 0])] })
            }
            const exp = (server.exp ? server.exp : await getExp(interaction, server))
            if (typeof exp === "string") {
                dbChannel.destroy()
                return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("The Channel linking failed please try again or contact Ererej. the exp was saved to:  " +  exp + "EXP!").setColor([255, 0, 0])] })
            }
            server.exp = exp
            const responce = await updateExp(db, server, interaction)
            if (typeof responce === "string") return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("The Channel Link was created and saved to the database but: " +  responce).setColor([255, 0, 0])]})

                
            return await interaction.editReply(replyString + "**" + linkType + `** successfully created in <#${dbChannel.channel_id}>!`) 
        } else if (linkType == "guildMemberCount") {
            await updateGuildMemberCount({guild: interaction.guild, db: db, channel: channel})


        } else if (linkType == "robloxGroupCount") {
            await updateGroupMemberCount({noblox: noblox, guild: interaction.guild, db: db, channel: channel}).then((success) => {
                if (success === false) return interaction.editReply({ embeds: [embeded_error.setDescription("Failed to make the roblox group count display!")] })
            }).catch(err => {
                console.error(err)
                return interaction.editReply({ embeds: [embeded_error.setDescription("Failed to make the roblox group count display!")] })
            })
        }
        db.Channels.create({ channel_id: channel.id, guild_id: interaction.guild.id, type: linkType })
        return await interaction.editReply({ embeds: [new EmbedBuilder().setColor([0,255,0]).setDescription(replyString + `Successfully made <#${channel.id}> the **${linkType}** channel!`)] })
    }
}