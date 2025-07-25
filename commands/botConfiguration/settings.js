const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const db = require("../../dbObjects.js")
const updateExp = require('../../utils/updateExp.js');
const noblox = require("noblox.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription("Used to configure the bot's settings")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('listsettings')
                .setDescription('Lists all the saved settings for the server')
        )
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
                        .setMaxValue(24)
                        .setMinValue(-24)
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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('orderoftheranksinranks')
                .setDescription('when set to reversed the ranks will be displayed from highest to lowest in /ranks')
                .addStringOption(option =>
                    option.setName('order')
                        .setDescription('determens the order of the ranks in /ranks')
                        .setRequired(true)
                        .addChoices(
                            { name: 'high_to_low', value: "reversed"},
                            { name: 'low_to_high', value: "normal"}
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('makesealogcodeblock')
                .setDescription('puts the sea log in a code block to make it easier to copy')
                .addStringOption(option =>
                    option.setName('configuration')
                        .setDescription('do you want the sealogs to be in a code block?')
                        .setRequired(true)
                        .addChoices(
                            { name: 'codeblock', value: 'codeblock'},
                            { name: 'normal', value: 'normal'}
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('nameofpromopoints')
                .setDescription('[Premium] determens the name of promo points so that you can name them stuff like "exp" or "points"')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('enter what you want the promo points to be called')
                        .setRequired(true)
                        .setMaxLength(50)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
            .setName('promopointsperevent')
            .setDescription('Determens how many promo points you get for attending a specific event')
            .addStringOption(option =>
                option.setName('event_type')
                    .setDescription('Enter the type of event you want to set the promo points for')
                    .setRequired(true)
                    .addChoices(
                        { name: 'training', value: 'training' },
                        { name: 'patrol', value: 'patrol' },
                        { name: 'gamenight', value: 'gamenight' },
                        { name: 'tryout', value: 'tryout' },
                        { name: 'raid', value: 'raid' },
                        { name: 'rallybeforeraid', value: 'rallybeforeraid' },
                        { name: 'rallyafterraid', value: 'rallyafterraid' },
                        { name: 'other', value: 'other' }
                    )
            )
            .addIntegerOption(option =>
                option.setName('promopoints')
                    .setDescription('Enter how many promo points you get for attending the event')
                    .setRequired(true)
                    .setMinValue(0)
            )
        ),
        botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels],
        async execute(interaction) {
            await interaction.deferReply()
            const embeded_error = new EmbedBuilder().setColor([255,0,0])

            const premiumSettings = ["nameofpromopoints"]

            const server = await db.Servers.findOne({where: {guild_id: interaction.guild.id}})

            if (premiumSettings.includes(interaction.options.getSubcommand())) {
                if (!server || !server.premium_end_date || server.premium_end_date < new Date()) {
                    const premiumButton = new ButtonBuilder()
                        .setStyle(6)
                        .setSKUId('1298023132027944980')
                    const row = new ActionRowBuilder().addComponents(premiumButton)
                    return await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription("This Setting is locked to **premium servers only!** You can get premium by visiting the bots store! Most of the profits goes twords fuling Ererejs candy and pastery addiction :D")], components: [row] })
                }
            }

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member.user.id === "386838167506124800") {
                embeded_error.setDescription("Insuficent permissions!")
                return await interaction.editReply({ embeds: [embeded_error]});
            } 
            let setting
            switch (interaction.options.getSubcommand()) {
                case 'listsettings':
                    const settings = await db.Settings.findAll({ where: { guild_id: interaction.guild.id } })
                    let description = ""
                    settings.forEach(setting => {
                        description += `**${setting.type}**: ${setting.config}\n`
                    })
                    if (description === "") {
                        description = "No settings have been set for this server!"
                    }
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Blurple).setDescription(description)] })
                case 'dateformat':
                    const format = interaction.options.getString('format')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "dateformat" } })
                    if (setting) {
                        setting.update({ config: format })
                    } else {
                        db.Settings.create({ guild_id: interaction.guild.id, type: "dateformat", config: format })
                    }
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
                    if (server) {
                        updateExp(db, server, interaction)
                    }
                    if (hours > 0) {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the timezone to GMT+${hours}`) ] })
                    } else if (hours < 0) {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the timezone to GMT${hours}`) ] })
                    } else {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the timezone to GMT`) ] })
                    }
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
                        if (server) {
                            const group = await noblox.getGroup(server.group_id)
                            const guildChannel = await interaction.guild.channels.fetch(channel.channel_id)
                            guildChannel.setName(`Members in group: ${Math.floor(group.memberCount / rounding) * rounding}`)
                        } else {
                            guild.channels.cache.get(channel.id).setName(`group not linked. please link a group with /setup`)
                        }
                    }
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the member count rounding to ${(rounding + "").length-1} digets`) ]})
                
                case 'expdisplayshowotherdivs':
                    const showOrHide = interaction.options.getString('showorhide')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplayshowotherdivs" } })
                    if (setting) {
                        await setting.update({ config: showOrHide })
                    } else {
                        await db.Settings.create({ guild_id: interaction.guild.id, type: "expdisplayshowotherdivs", config: showOrHide })
                    }
                    if (server) {
                        updateExp(db, server, interaction)
                    } 
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Orange).setDescription(`Successfully set the exp display to *${showOrHide}* other divs`) ] })

                case 'orderoftheranksinranks':
                    const order = interaction.options.getString('order')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "orderoftheranksinranks" } })
                    if (setting) {
                        await setting.update({ config: order })
                    } else {
                        await db.Settings.create({ guild_id: interaction.guild.id, type: "orderoftheranksinranks", config: order })
                    }
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the order of the ranks in /ranks to ${order ? "high to low" : "low to high"}`) ] })
                case 'makesealogcodeblock':
                    const configuration = interaction.options.getString('configuration')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "makesealogcodeblock" } })
                    if (setting) {
                        await setting.update({ config: configuration })
                    } else {
                        await db.Settings.create({ guild_id: interaction.guild.id, type: "makesealogcodeblock", config: configuration })
                    }
                    if (configuration === "codeblock") {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the sea log to be in a code block`) ] })
                    } else {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the sea log to be normal`) ] })
                    }
                case 'nameofpromopoints':
                    const name = interaction.options.getString('name')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "nameofpromopoints" } })
                    if (setting) {
                        await setting.update({ config: name })
                    } else {
                        await db.Settings.create({ guild_id: interaction.guild.id, type: "nameofpromopoints", config: name })
                    }
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the name of the promo points to **${name}**`) ] })
                case 'promopointsperevent':
                    const event_type = interaction.options.getString('event_type')
                    const promopoints = interaction.options.getInteger('promopoints')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: `promopointsfor${event_type}` } })
                    if (setting) {
                        await setting.update({ config: promopoints })
                    } else {
                        await db.Settings.create({ guild_id: interaction.guild.id, type: `${event_type}promopoints`, config: promopoints })
                    }
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`Successfully set the promo points for ***${event_type}*** to **${promopoints}**`) ] })
            }
        }

}