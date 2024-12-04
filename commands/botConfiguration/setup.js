const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')
const testers = require('../../tester_servers.json');
const updateGuildMemberCount = require('../../functions/updateGuildMemberCount.js');
const updateGroupMemberCount = require('../../functions/updateGroupMemberCount.js');
const updateExp = require('../../functions/updateExp.js');
const getExp = require('../../functions/getExp.js');

module.exports = {
	data: new SlashCommandBuilder()
                .setName('setup')
                .setDescription('links the server to the roblox group and configures the divisions exp!')
                .addIntegerOption(option =>
                        option.setName('roblox_group_id')
                                .setDescription('Please input the roblox group id of your roblox group')
                                .setRequired(true)
                )
                .addStringOption(option =>
                        option.setName('division_name')
                                .setDescription('This is a manual overwrite if the DAs has misstyped the division name in the officer tracker!')
                                .setRequired(false)
                )
                .addIntegerOption(option => 
                        option.setName('current_exp')
                                .setDescription('please input the current total exp of your division!')
                                .setRequired(false)
                                .setMinValue(0)
                                .setMaxValue(1000000)
                ),

    botPermissions: [PermissionsBitField.Flags.ManageChannels],

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255, 0, 0])
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member.user.id === "386838167506124800") {
            embeded_error.setDescription("Insuficent permissions!")
            return await interaction.editReply({ embeds: [embeded_error] });
        }
        const response = await fetch(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.member.user.id}`, {
            headers: {
                'Authorization': `Bearer ${config.roverkey}`
            }
        })
        if (!(response.status + "").startsWith("2") && interaction.member.user.id !== "386838167506124800") {
            console.log(response.status)
            return interaction.editReply(`You need to verify using rover! So that we can verify that you have the correct permissions in the provided group!`);
        }

        const robloxUser = await response.json()
        const group = await noblox.getGroup(interaction.options.getInteger("roblox_group_id")).catch((err) => {
            embeded_error.setDescription("The group id is invalid!")
            return interaction.editReply({ embeds: [embeded_error] });
        })

        //athenticate the user
        if (group.owner.userId !== robloxUser.robloxId && !interaction.member.user.id === "386838167506124800") {//by pass the check if the user is the owner of the bot. only so that Ererej can help divisions setup their server.
            embeded_error.setDescription("You are not the owner of the group! please have the owner run this command!")
            return interaction.editReply({ embeds: [embeded_error] });
        }

        let server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        const groupName = interaction.options.getString("division_name") ?? (await noblox.getGroup(interaction.options.getInteger("roblox_group_id"))).name
        let reply;
        if (server) {
            server.group_id = interaction.options.getInteger("roblox_group_id")
            server.exp = interaction.options.getInteger("current_exp") ?? server.exp
            server.name = groupName
            server.save();
            reply = `Successfully updated the server in the database! \nThe server is linked to the roblox group **${groupName}** \n The divisions name is set to **${server.name}**\nThe division has **${server.exp}**EXP`
            embeded_reply = new EmbedBuilder().setDescription(reply).setColor([0, 255, 0])
            await interaction.editReply({ embeds: [embeded_reply] });
        } else {
            await db.Servers.create({ guild_id: interaction.guild.id, group_id: interaction.options.getInteger("roblox_group_id"), name: groupName, exp: interaction.options.getInteger("current_exp") ?? 0 })
            reply = `Server successfully saved to the database and linked to the roblox group **${groupName}**.`
            embeded_reply = new EmbedBuilder().setDescription(reply).setColor([0, 255, 0])
            await interaction.editReply({ embeds: [embeded_reply] });
        }

        if (!testers.servers.some(server => server.id == interaction.guild.id) && !interaction.member.user.id === "386838167506124800") {
            return
        }

        //auto Display setup
        if (!(await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplay" } })) && !(await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "guildMemberCount" } })) && !(await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "robloxGroupCount" } }))) {
            const confirmButton = new ButtonBuilder()
                .setCustomId('run_auto_display_setup')
                .setLabel('Run auto display setup')
                .setStyle(ButtonStyle.Primary)
            const cancelButton = new ButtonBuilder()
                .setCustomId('no')
                .setLabel('No')
                .setStyle(ButtonStyle.Secondary)

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton)

            const response = await interaction.followUp({ embeds: [new EmbedBuilder().setColor(Colors.LuminousVividPink).setDescription(reply + `\nDo you want to run auto display setup? this will let you pick what displays you want and then it will add them`)], components: [row] })

            const collectorFilter = i => i.customId === 'run_auto_display_setup' && i.user.id === interaction.user.id
            try {
                const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 600_000 })

                if (confirmation.customId === 'run_auto_display_setup') {
                    
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('auto_display_setup')
                        .setPlaceholder('Select the displays you want to add')
                        .addOption('Exp display', 'expdisplay')
                        .addOption('Guild member count', 'guildMemberCount')
                        .addOption('Roblox group member count', 'robloxGroupCount')
                        .setMinValues(1)
                    
                    const selectDisplaysRow = new ActionRowBuilder().addComponents(selectMenu)
                    const selectDisplaysResponce = await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.LuminousVividPink).setDescription("Please select the displays you want to add!")], components: [selectDisplaysRow] })

                    const collectorFilter = i => i.customId === 'auto_display_setup' && i.user.id === interaction.user.id

                    try {
                        const displays = await selectDisplaysResponce.awaitMessageComponent({ Filter: collectorFilter, time: 600_000 })

                        const VcDisplays = ["guildMemberCount", "robloxGroupCount"]
                        const TextDisplays = ["expdisplay"]

                        const selectedDisplays = displays.values

                        for (const display of selectedDisplays) { // fix everthing make it create teh channels if they dont exist
                            let dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: display } })
                            let channel;
                            if (dbChannel) {
                                if (await interaction.guild.channels.fetch(dbChannel.channel_id)) {
                                    reply += `\n\n*${display}* display already exists!`
                                    continue
                                } else {
                                    if (VcDisplays.includes(display)) {
                                        channel = await interaction.guild.channels.create(display, { type: "GUILD_VOICE" }) // add the permission to the channel
                                    } else if (TextDisplays.includes(display)) {
                                        channel = await interaction.guild.channels.create(display, { type: "GUILD_TEXT" } ) // add the permission to the channel
                                    } else {
                                        throw new Error(display + " is not configured to be an VC or text display!!!!")
                                    }
                                    dbChannel.channel_id = channel.id
                                    dbChannel.save()
                                    reply += `\n\n*${display}* had a link but the channel had been removed so a new channel was created!`
                                }
                            } else {
                                dbChannel = await db.Channels.create({ guild_id: interaction.guild.id, channel_id: null, type: display })
                            }


                            if (!channel) {
                                if (VcDisplays.includes(display)) {
                                    channel = await interaction.guild.channels.create(display, { type: "GUILD_VOICE", name: display + "!", reason: `${interaction.user} ran automatic display setup in /setup` }) // add the permission to the channel
                                } else if (TextDisplays.includes(display)) {
                                    channel = await interaction.guild.channels.create(display, { type: "GUILD_TEXT", name: "Exp Display 😎", reason: `${interaction.user} ran automatic display setup in /setup` }) // add the permission to the channel
                                } else {
                                    throw new Error(display + " is not configured to be an VC or text display!!!!")
                                }
                                dbChannel.channel_id = channel.id
                                dbChannel.save()
                            }


                            switch (display) {
                                case "guildMemberCount":
                                    updateGuildMemberCount({ guild: interaction.guild, channel: channel, dbChannel: dbChannel}).then(() => {
                                        reply += `\n\nGuild member count display added!`
                                    }).catch((err) => {
                                        reply += `\n\nGuild member count display failed to add!`
                                        console.error(err)
                                    })
                                    break;
                                case "robloxGroupCount":
                                    updateGroupMemberCount({ guild: interaction.guild, channel: channel, dbChannel: dbChannel, group: group, noblox: noblox}).then((success) => {
                                        if (success !== false) {
                                            reply += `\n\nRoblox group member count display added!`
                                        } else {
                                            reply += `\n\nRoblox group member count display failed to add look at the channel name for the reason!`
                                        }
                                    }).catch((err) => {
                                        reply += `\n\nRoblox group member count display failed to add!`
                                        console.error(err)
                                    })
                                    break;
                                case "expdisplay":
                                    if (server.exp === 0) {
                                        const exp = await getExp(interaction, server)
                                        if (typeof exp === "string") {
                                            reply += `\n\nEXP display failed due to: ${exp}`
                                            break;
                                        }
                                        server.exp = exp
                                        server.save()
                                        const responce = await updateExp(db, server, interaction)
                                        if (typeof responce === "string") {
                                            reply += `\n\nEXP display failed due to: ${responce}`
                                            break;
                                        }
                                        reply += `\n\nEXP display added in <#${channel.id}>!`
                                    }
                                    break;
                                default:
                                    throw new Error(display + " is not configured to be an VC or text display!!!!")
                            }
                            
                        }

                        return response.edit({ embeds: [new EmbedBuilder().setColor(Colors.DarkPurple).setDescription(`# auto dispaly setup: \n\n` + reply)], components: [] })
                    } catch (error) {
                        if (error.message === "Collector received no interactions before ending with reason: time") {
                            return interaction.editReply({ embeds: [embeded_error.setDescription("No responce was given in within 10 minutes, cancelling!")], components: [] })
                        } else {
                            throw error
                        }
                    }
                }
            } catch(error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    return interaction.editReply({ embeds: [embeded_error.setDescription("No responce was given in within 10 minutes, cancelling!")], components: [] })
                } else {
                    throw error
                }
            }
        }

        //auto rank setup
        if (!(await db.Ranks.findOne({ where: { guild_id: interaction.guild.id } }))) {
            const confirmButton = new ButtonBuilder()
                .setCustomId('run_auto_setup')
                .setLabel('Run auto rank setup')
                .setStyle(ButtonStyle.Primary)
            const cancelButton = new ButtonBuilder()
                .setCustomId('no')
                .setLabel('No')
                .setStyle(ButtonStyle.Secondary)

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton)

            const response = await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.LuminousVividPink).setDescription(reply + `\nDo you want to run auto rank setup? Depending on how your ranks are struktured this might fail :(`)], components: [row] })

            const collectorFilter = i => i.customId === 'run_auto_setup' && i.user.id === interaction.user.id
            try {
                const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 60_000 })

                if (confirmation.customId === 'run_auto_setup') {
                    let responceString = ""
                    let sussesful = 0
                    let failed = 0
                    const group_ranks = await noblox.getRoles(interaction.options.getInteger("roblox_group_id"))
                    for (const rank of group_ranks) {
                        if (rank.name === "Guest") {
                            continue
                        }
                        const role = await interaction.guild.roles.cache.find(role => role.name === rank.name)
                        if (role) {
                            let tag;
                            if (role.name.indexOf("[") > -1 && role.name.indexOf("]") > -1) {
                                tag = role.name.substring(0, role.name.indexOf("]") + 1)
                            } else if (role.name.indexOf("(") > -1 && role.name.indexOf(")") > -1) {
                                tag = role.name.substring(0, role.name.indexOf(")") + 1)
                            } else if (role.name.indexOf("{") > -1 && role.name.indexOf("}") > -1) {
                                tag = role.name.substring(0, role.name.indexOf("}") + 1)
                            }

                            await db.Ranks.create({ id: role.id, guild_id: interaction.guild.id, roblox_id: rank.id, promo_points: 1, rank_index: rank.rank, is_officer: false, tag: tag ? tag : null, obtainable: true })
                            responceString += `\n\n<@&${role.id}> was linked to the roblox rank **${rank.name}**` + (tag ? ` with the tag **${tag}**` : "")
                            sussesful++
                        } else {
                            responceString += `\n\n**${rank.name}** no role found! (the roles are found by looking for the roblox ranks name)`
                            failed++
                        }
                    }

                    if (sussesful === 0) {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Auto rank setup failed, no ranks where linked`)], components: [] })
                    } else if (failed != 0) {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The auto rank setup was successful! ${responceString} \n# The rank links where created now you need to use /editrank to configure how many promopoints are required to reach each rank, and if the rank is an officer rank and if you are able to reach it with promopoints`)], components: [] })
                    } else {
                        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The auto rank setup was not 100% successful ${failed} roblox ranks where not linked ${responceString} \n# The rank links where created now you need to use /editrank to configure how many promopoints are required to reach each rank, and if the rank is an officer rank and if you are able to reach it with promopoints`)], components: [] })
                    }

                } else if (confirmation.customId === 'no') {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The auto rank setup has been cancelled!`)], components: [] })
                }
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    return interaction.editReply({ embeds: [embeded_error.setDescription("No responce was given in within 60 secounds, cancelling!")], components: [] })
                } else {
                    throw error
                }
            }
        }
    }
}
