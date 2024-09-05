const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js")
const updateExp = require('../../updateExp.js')
const noblox = require("noblox.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription("Used to configure the bot's settings")
        .addSubcommand(subcommand =>
            subcommand
                .setName('dateformat')
                .setDescription('determines the date format the bot will display dates in!')
                .addStringOption(option =>
                    option.setName('format')
                        .setDescription('Please input the format you would like the bot to display dates in!')
                        .setRequired(true)
                        .addChoices(
                            { name: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                            { name: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                            { name: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timezone')
                .setDescription('determines the timezone the bot will display dates in!')
                .addIntegerOption(option =>
                    option.setName('hours')
                        .setDescription('Please input the hours diffirence between GMT and your timezone!')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('membercountrounding')
                .setDescription('determens how much the bot rounds the number in the member count VC displays')
                .addIntegerOption(option =>
                    option.setName('rounding')
                        .setDescription('determens how many digets will be rounded')
                        .setRequired(true)
                        .addChoices(
                            { name: '0 digets', value: 1},
                            { name: '1 digets', value: 10},
                            { name: '2 digets', value: 100},
                            { name: '3 digets', value: 1000}
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('expdisplayshowotherdivs')
                .setDescription('determens how the exp display will look like')
                .addStringOption(option =>
                    option.setName('showorhide')
                        .setDescription('determens if the exp display will show the div that is above and below your div!')
                        .setRequired(true)
                        .addChoices(
                            { name: 'show', value: 'show'},
                            { name: 'hide', value: 'hide'}
                        )
                )
        ),

        async execute(interaction) {
            await interaction.deferReply()
            let setting
            let server
            switch (interaction.options.getSubcommand()) {
                case 'dateformat':
                    const format = interaction.options.getString('format')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "dateformat" } })
                    if (setting) {
                        setting.update({ config: format })
                    } else {
                        db.Settings.create({ guild_id: interaction.guild.id, type: "dateformat", config: format })
                    }
                    server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
                    if (server) {
                        updateExp(db, server, interaction)
                    }
                    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the date format to ${format}`) ] })
                    break;
                case 'timezone':
                    const hours = interaction.options.getInteger('hours')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "timezone" } })
                    if (setting) {
                        setting.update({ config: hours })
                    } else {
                        db.Settings.create({ guild_id: interaction.guild.id, type: "timezone", config: hours })
                    }
                    server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
                    if (server) {
                        updateExp(db, server, interaction)
                    }
                    if (hours > 0) {
                        await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the timezone to GMT+${hours}`) ] })
                    } else if (hours < 0) {
                        await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the timezone to GMT${hours}`) ] })
                    } else {
                        await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the timezone to GMT`) ] })
                    }
                    
                    break;
                case 'membercountrounding':
                    const rounding = interaction.options.getInteger('rounding')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "membercountrounding" } })
                    if (setting) {
                        setting.update({ config: rounding })
                    } else {
                        db.Settings.create({ guild_id: interaction.guild.id, type: "membercountrounding", config: rounding })
                    }
                    let channel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "guildMemberCount" } })
                    if (channel) {
                        const guildChannel = await interaction.guild.channels.fetch(channel.channel_id)
                        guildChannel.setName(`Member count: ${Math.floor(interaction.guild.memberCount/rounding)*rounding}`)
                    }
                    channel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "robloxGroupCount" } })
                    if (channel) {
                        server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
                        if (server) {
                            const group = await noblox.getGroup(server.group_id)
                            const guildChannel = await interaction.guild.channels.fetch(channel.channel_id)
                            guildChannel.setName(`Members in group: ${Math.floor(group.memberCount / rounding) * rounding}`)
                        } else {
                            guild.channels.cache.get(channel.id).setName(`group not linked. please link a group with /setup`)
                        }
                    }
                    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the member count rounding to ${(rounding + "").length-1} digets`) ]})
                    break;
                case 'expdisplayshowotherdivs':
                    const showOrHide = interaction.options.getString('showorhide')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplayshowotherdivs" } })
                    if (setting) {
                        await setting.update({ config: showOrHide })
                    } else {
                        await db.Settings.create({ guild_id: interaction.guild.id, type: "expdisplayshowotherdivs", config: showOrHide })
                    }
                    server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
                    if (server) {
                        updateExp(db, server, interaction)
                    }
                    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the exp display to *${showOrHide}* other divs`) ] })
                    break;
            }
        }

}