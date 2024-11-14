const { Colors, ActionRowBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)
const testers = require("../../tester_servers.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('raidlog')
		.setDescription('create the format for logging raids!')
        .addStringOption(option => 
            option.setName('enemy_division')
                .setDescription('Give the name of the enemy division(s) here!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('map')
                .setDescription('Give the name of the map the raid was played on!')
                .setRequired(true)
        )
        .addAttachmentOption(option => 
            option.setName('resoult')
                .setDescription('Paste in the picture of the resoult!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('win')
                .setDescription('Did you win?')
                .setRequired(true)
                .addChoices(
                    { name: 'win', value: 'win'},
                    { name: 'loss', value: 'loss'}
                )
        )
        .addStringOption(option =>
            option.setName('allys_name')
                .setDescription('Give the name of the ally divisions here!')
                .setRequired(false)
        )
        .addAttachmentOption(option => 
            option.setName('raid_discutions')
                .setDescription('The raid will be logged as an outside raid if you fill out this feild!')
                .setRequired(false)
        ),

	async execute(interaction) {
        await interaction.deferReply()

        //make sure to pull the attendees as soon as possible
        const voice_channel = await interaction.guild.channels.fetch(interaction.member.voice.channelId)
        let attendees = []
        if (voice_channel.members) {
            attendees = voice_channel.members.values()
        }

        let dbLogger = await db.Users.findOne({ where: { guild_id: interaction.guild.id } })
        const groupId = (await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })).group_id
        const updateResponce = await dbLogger.updateRank(noblox, groupId, interaction.member) ?? ""
        if (dbLogger.rank_id === null) {
            dbLogger.destroy()
            return interaction.editReply({embeds: [embeded_error.setDescription("Couldn't verify your permissions due to not being able to verify your rank!")]})
        }
        
        if (updateResponce.message) {
            interaction.followUp({embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription(`Your rank was updated: ` + updateResponce.message)]})
        }

		const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!(await dbLogger.getRank()).is_officer && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            return await interaction.editReply({ embeds: [embeded_error]});
		} 
        const enemy_division = interaction.options.getString('enemy_division')
        let map = interaction.options.getString('map')
        switch (map.toLowerCase()) {
            case "tb3":
                map = "Trident Battlegrounds III"
                break;
            case "tb2":
                map = "Trident Battlegrounds 2"
                break;
            case "bermuda":
                map = "Bermuda Air Base"
                break;
        }
        const resoult = interaction.options.getAttachment('resoult')
        const win = interaction.options.getString('win')
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        const division_name = server ? server.name : interaction.guild.name
        let allys_name = ""
        if (interaction.options.getString('allys_name')) {
            allys_name = ", " + interaction.options.getString('allys_name')
        }
        const raid_discutions = interaction.options.getAttachment('raid_discutions')
        const time = new Date()
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`
        if (!allys_name) {
            allys_name = " "
        }
        let winner = ""
        if (win === "win") {
            winner = division_name + allys_name
        } else {    
            winner = enemy_division
        }
        const dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "raidlogs" } })

        const sea_format_channel = dbChannel ? await interaction.guild.channels.fetch(dbChannel.channel_id) : interaction.channel
        
        sea_format_channel.send(`VVV <#980566115187048499> VVV`)
        let logMessage;
        if (raid_discutions === null) {
            logMessage = await sea_format_channel.send({ content: `Division(s): ${division_name}${allys_name} VS  ${enemy_division} \nVictory: ${winner}\nMap: ${map}\nDate: ${date}\nScreenshot: `, files: [{attachment: resoult.url}]});
        
        } else {
            logMessage = await sea_format_channel.send({ content: ` <@624633098583408661> \nDivision(s): ${division_name + allys_name}\nEnemy Group: ${enemy_division} \nResoult: ${winner} \nMap: ${map}\nDate: ${date}\nProof: `, files: [{attachment: resoult.url}, {attachment: raid_discutions.url}]});
        }
        if (!dbChannel) {
            return await interaction.editReply({ content: 'If you want the raidlogs to always go to a spesific channel then use this command </linkchannel:1246002135204626454>', ephemeral: true });
        }

        const embedReply = new EmbedBuilder()
        .setColor([0,255,0])
        
        if ( !testers.servers.some(server => server.id == interaction.guild.id)) {
            embedReply.setDescription(`format succesfully logged! https://discord.com/channels/${logMessage.guild.id}/${logMessage.channel.id}/${logMessage.id}`)
            return interaction.editReply({embeds: [embedReply]})
        }

        embedReply.setDescription(`format succesfully logged! https://discord.com/channels/${logMessage.guild.id}/${logMessage.channel.id}/${logMessage.id} \n\n do you want to give the attendees promo points?`)
        

        const promoteAttendeesButton = new ButtonBuilder()
            .setCustomId('promote_attendees')
            .setLabel('Promote')
            .setStyle(ButtonStyle.Primary)

        const noButton = new ButtonBuilder()
            .setCustomId('no')
            .setLabel('no')
            .setStyle(ButtonStyle.Secondary)
        const row = new ActionRowBuilder().addComponents(promoteAttendeesButton, noButton)

        const response = await interaction.editReply({embeds: [embedReply], components: [row]})
        let followUp;

        const collectorFilter = i => i.customId === 'promote_attendees' && i.user.id === interaction.user.id
        try {
            const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 300_000 })

            if (confirmation.customId === 'promote_attendees') {
                
                

                //check if the user has permission to host events
                if (voice_channel.id === undefined) { //check if the host is in a voice channel
                    const selectAttendees = new UserSelectMenuBuilder()
                    .setCustomId('select_attendees')
                    .setPlaceholder('Select the attendees')
                    .setMinValues(1)
                    .setMaxValues(25)
                    const row = new ActionRowBuilder().addComponents(selectAttendees)

                    followUp = await interaction.followUp({embeds: [new EmbedBuilder().setColor(Colors.LuminousVividPink).setDescription(`Please enter the attendees of your event. \nNext time run /log before everyone leaves and you wont have to manualy do it`)], components: [row]})

                    const collectorFilter = i => i.customId === 'select_attendees' && i.user.id === interaction.user.id
                    try {
                        const confirmation = await followUp.awaitMessageComponent({ Filter: collectorFilter, time: 600_000 })
                        confirmation.values.forEach(async value => {
                            const member = await interaction.guild.members.fetch(value)
                            attendees.push(member)
                        })
                    } catch(error) {
                        if (error.message === "Collector received no interactions before ending with reason: time") {
                            return followUp.edit({embeds: [embeded_error.setDescription("No responce was given in within 10 min, cancelling!")], components: []})
                        } else {
                            throw error
                        }
                    }
                }
                
            } else if (confirmation.customId === 'no') {
                return interaction.followUp({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`As requested the attendees wont be paid for this raid :D`)], components: []})
                
            }
        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                return interaction.followUp({embeds: [embeded_error.setDescription("No responce was given in within 5 minutes, no promos!")], components: []})
            } else {
                    throw error
            }
        }

        const promologChannelLink = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "promologs" } })

        const promologsChannel = promologChannelLink ? await interaction.guild.channels.fetch(promologChannelLink.channel_id) : undefined

        const guild_ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } })
        
        let total_event_attendes = 0
        const event_log_embed = new EmbedBuilder().setTitle("Raid").setColor([255,0,0]).setThumbnail(resoult.url)
        let mentions = ""
        let description = "**Raid Leader:** <@" + interaction.member.id + ">\n**Division(s):** " + division_name + allys_name + "\n**Enemy Division:** " + enemy_division + "\n**Victory:** " + winner + "\n**Map:** " + map + "\n**Date:** " + date + "\n\n**Attendees:**"
        //promote attendees
        for (const member of attendees) {
            if (!member.user.bot && member.id !== interaction.member.id) {
            mentions += `<@${member.id}> `
            followUp.edit({ embeds: [new EmbedBuilder().setDescription("prossesing " + member.displayName)], components: []})
            description += `\n\n <@${member.id}>: `;
            total_event_attendes++;
            let dbUser = await db.Users.findOne({ where: {guild_id: interaction.guild.id, user_id: member.id}});
            if (!dbUser) {
                dbUser = await db.Users.create({user_id: member.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null});
            }
            const updateRankResponse = await dbUser.updateRank(noblox, server.group_id, member);
            if (dbUser.rank_id === null) {
                dbUser.destroy()
            }
            if (updateRankResponse.message) {
                if (updateRankResponse.message.includes("highest rank")) {
                description += "Thanks for attending (can not get promoted by attending events!)";
                } else {
                description += updateRankResponse.message;
                }
                if (updateRankResponse.error) {
                continue;
                }
            }
            dbUser.total_events_attended += 1
            const robloxUser = updateRankResponse.robloxUser
            const addPromoPointResponce = await dbUser.addPromoPoints(noblox, groupId, member, guild_ranks, 1, robloxUser)
            if (addPromoPointResponce && updateRankResponse.message) { description += "\n" }
            description += addPromoPointResponce.message
            dbUser.save()
            }
        }
        if (total_event_attendes === 0) {
            return await followUp({ embeds: [embeded_error.setDescription("No attendees === no quota point!")], components: []})
        }

        event_log_embed.setDescription(description)
        event_log_embed.setFooter({ text: `Total attendees: ${total_event_attendes}`})
        if (promologsChannel) {
            await promologsChannel.send({content: mentions, embeds: [event_log_embed]})
            followUp.edit({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`All attendees have been rewarded their promo points!`)], })
        } else {
            followUp.edit({content: mentions, embeds: [event_log_embed]})
        }

    }
}