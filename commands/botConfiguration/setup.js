const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)
const testers = require('../tester_servers.json');


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
                ),

        async execute(interaction) {
                await interaction.deferReply()
                const embeded_error = new EmbedBuilder().setColor([255,0,0])
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member.user.id === "386838167506124800") {
                        embeded_error.setDescription("Insuficent permissions!")
                        return await interaction.editReply({ embeds: [embeded_error]});
                } 
                const response = await fetch(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.member.user.id}`, {
                        headers: {
                        'Authorization': `Bearer ${config.roverkey}`
                        }
                })
                if (!(response.status + "").startsWith("2") && interaction.member.user.id !== "386838167506124800") {
                        console.log(response.status)
                        return interaction.editReply( `You need to verify using rover! So that we can verify that you have the correct permissions in the provided group!`);
                }
                 
                const robloxUser = await response.json()
                const group = await noblox.getGroup(interaction.options.getInteger("roblox_group_id")).catch((err) => {
                        embeded_error.setDescription("The group id is invalid!")
                        return interaction.editReply({ embeds: [embeded_error]});
                }) 

                //athenticate the user
                if (group.owner.userId !== robloxUser.robloxId && !interaction.member.user.id === "386838167506124800") {//by pass the check if the user is the owner of the bot. only so that Ererej can help divisions setup their server.
                        embeded_error.setDescription("You are not the owner of the group! please have the owner run this command!")
                        return interaction.editReply({ embeds: [embeded_error]});
                }
                

                
                let server = await db.Servers.findOne({ where: {guild_id: interaction.guild.id}})
                const groupName = interaction.options.getString("division_name") ?? (await noblox.getGroup(interaction.options.getInteger("roblox_group_id"))).name
                if (server) {
                        server.group_id = interaction.options.getInteger("roblox_group_id")
                        server.exp = interaction.options.getInteger("current_exp") ?? server.exp
                        server.name = groupName
                        server.save();
                        const embeded_reply = new EmbedBuilder().setDescription(`Successfully updated the server in the database! \nThe server is linked to the roblox group **${groupName}** \n The divisions name is set to **${server.name}**\nThe division has **${server.exp}**EXP`).setColor([0,255,0])
                        await interaction.editReply({ embeds: [embeded_reply]});
                } else {
                        await db.Servers.create({ guild_id: interaction.guild.id, group_id: interaction.options.getInteger("roblox_group_id"), name: groupName, exp: interaction.options.getInteger("current_exp") ?? 0})
                        const embeded_reply = new EmbedBuilder().setDescription(`Server successfully saved to the database and linked to the roblox group **${groupName}**.`).setColor([0,255,0])
                        await interaction.editReply({ embeds: [embeded_reply]});
                }


                if (!testers.servers.some(server => server.id == interaction.guild.id)) {
                        return
                }

                if (!db.Ranks.findOne({ where: { guild_id: interaction.guild.id }})) {
                        const confirmButton = new ButtonBuilder()
                                .setCustomId('run_auto_setup')
                                .setLabel('Run auto setup')
                                .setStyle(ButtonStyle.Primary)
                        const cancelButton = new ButtonBuilder()
                                .setCustomId('no')
                                .setLabel('No')
                                .setStyle(ButtonStyle.Secondary)

                        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton)

                        const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Do you want to run auto rank setup? Depending on how your ranks are struktured this might fail :(`)], components: [row]})

                        const collectorFilter = i => i.customId === 'run_auto_setup' && i.user.id === interaction.user.id
                        try {
                                const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 60_000 })

                                if (confirmation.customId === 'run_auto_setup') {
                                        let responceString = ""
                                        let sussesful = 0
                                        let failed = 0
                                        const group_ranks = await noblox.getRoles(interaction.options.getInteger("roblox_group_id"))
                                        for (const rank of group_ranks) {
                                                const role = await interaction.guild.roles.find(role => role.name === rank.name)
                                                if (role) {
                                                        if (role.indexOf("[") > -1 && role.indexOf("]") > -1) {
                                                                const tag = role.name.substring(0, role.name.indexOf("]"))
                                                        }
                                                        await db.Ranks.create({ id: role.id, guild_id: interaction.guild.id, roblox_id: rank.id, promo_points: 1, rank_index: rank.rank, is_officer: false, tag: tag ? tag : null, obtainable: true})
                                                        responceString += `\n\n${role.name} was linked to the roblox rank **${rank.name}**` + (tag ? ` with the tag **${tag}**` : "")
                                                        sussesful++
                                                } else {
                                                        responceString += `\n\n**${rank.name}** no role found! (the roles are found by looking for the roblox ranks name)`
                                                        failed++
                                                }
                                        }

                                        if (sussesful === 0) {
                                                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Auto rank setup failed, no ranks where linked`)], components: []})
                                        } else if (failed != 0) {
                                                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The auto rank setup was successful! ${responceString}`)], components: []})
                                        } else {
                                                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The auto rank setup was not 100% successful ${} ${responceString}`)], components: []})
                                        }


                                } else if (confirmation.customId === 'no') {
                                        return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The auto rank setup has been cancelled!`)], components: []})
                                }
                        } catch (error) {
                                return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 60 secounds, cancelling!")], components: []})
                        }
                }
        }

}