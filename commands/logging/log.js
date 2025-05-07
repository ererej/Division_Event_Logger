const { SlashCommandBuilder, EmbedBuilder, UserSelectMenuBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ActionRowBuilder,  PermissionsBitField, Attachment, Embed, Colors, ButtonBuilder } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')


const sealog = require('../../utils/sealog.js')
const validateMessageLink = require('../../utils/validateMessageLink.js')
const getNameOfPromoPoints = require("../../utils/getNameOfPromoPoints.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('log')
		.setDescription('Logs the event!')
        .addAttachmentOption(option => 
            option.setName('wedge_picture')
                .setDescription('Paste in the wedge picture!')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('announcemnt_link')
                .setDescription('Add the link to the event announcemnt message here!')
                .setRequired(true)
        )
        .addUserOption(option => 
            option.setName('cohost')
                .setDescription('select your cohost if you had any otherwise just leave it')
        )
        .addStringOption(option =>
            option.setName('event_type')
                .setDescription('Select the event type')
                .addChoices(
                    { name: 'training', value: 'training'},
                    { name: 'patrol', value: 'patrol'},
                    { name: 'gamenight', value: 'gamenight'},
                    { name: 'tryout', value: 'tryout'},
                    { name: 'rallybeforeraid', value: 'rallybeforeraid'},
                    { name: 'rallyafterraid', value: 'rallyafterraid'},
                )
        )
        .addBooleanOption(option =>
            option.setName('manual_attendence')
            .setDescription('If you want to manually select the attendees')
        )
        .addUserOption(option =>
            option.setName('host')
            .setDescription('If you are logging for someone else then you can select them here')
            .setRequired(false)   
        ),
    premiumLock: true,

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */
	async execute(interaction) {
        await interaction.deferReply()
        const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id)

        const embeded_error = new EmbedBuilder().setColor([255,0,0])

        const server = await db.Servers.findOne({ where: {guild_id: interaction.guild.id}})
        if (!server) { //!!!!!!!! make the reply link to the /setup command. no!
            return await interaction.editReply({ Embeds: [embeded_error.setDescription("Server not found in the database! Please contact an admin to link the server with /setup!")]})
        }
        
        const host = interaction.options.getUser('host') ? await interaction.guild.members.fetch(interaction.options.getUser('host')) : interaction.member
        let dbHost = await db.Users.findOne({ where: { user_id: host.id, guild_id: interaction.guild.id }})
        if (!dbHost) {
            dbHost = await db.Users.create({ user_id: host.user.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
        }

        const voice_channel = await interaction.guild.channels.fetch(host.voice.channelId)
        let attendees = []
        if (voice_channel.members) {
            for (const member of voice_channel.members.values()) {
                attendees.push(member)
            }
        }

        const updateResponce = await dbHost.updateRank(noblox, server.group_id, host) ?? ""
        if (dbHost.rank_id === null) {
            return interaction.editReply({embeds: [embeded_error.setDescription("Couldn't verify your permissions due to not being able to verify your rank! Error given: " + updateResponce.message)]})
        }
        
        if (updateResponce.message) {
            interaction.followUp({embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription("Your rank was updated: " + updateResponce)]})
        }

        let cohost;
        if (interaction.options.getUser('cohost')) {
            cohost = await interaction.guild.members.fetch(interaction.options.getUser('cohost').id).catch(() => {
                return interaction.editReply({embeds: [embeded_error.setDescription('The cohost you have inputed does not exist???')]})
            })
            const dbCohost = await db.Users.findOne({ where: { user_id: cohost.id, guild_id: interaction.guild.id }})
        }
        
        let dbLogger;
        if (interaction.options.getUser('host')) {
            dbLogger = await db.Users.findOne({ where: { user_id: interaction.options.getUser('host').id, guild_id: interaction.guild.id }})
            //! add logic for updating dbloggers rank and then verifying that they are an officer
        }

        //check if the user has permission to host events
        if ( !(await dbHost.getRank()).is_officer ) {
            embeded_error.setDescription("Insuficent permissions!")
            return await interaction.editReply({ embeds: [embeded_error]});
        } else if (voice_channel.id === undefined || interaction.options.getBoolean('manual_attendence')) { //check if the host is in a voice channel
            const selectAttendees = new UserSelectMenuBuilder()
            .setCustomId('select_attendees')
            .setPlaceholder('Select the attendees')
            .setMinValues(1)
            .setMaxValues(25)
            const confirmSelection = new ButtonBuilder().setCustomId('confirmSelection').setLabel('Confirm').setStyle(3)
            const selectRow = new ActionRowBuilder().addComponents(selectAttendees)
            const confirmRow = new ActionRowBuilder().addComponents(confirmSelection)

            const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.LuminousVividPink).setDescription(`Please enter the attendees of your event. \nNext time run /log before everyone leaves and you wont have to manualy do it`)], components: [selectRow, confirmRow]})

            const collectorFilter = i => i.user.id === interaction.user.id
            try {
                while (true) {
                    const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 300_000 })
                    confirmation.deferUpdate()
                    if (confirmation.customId === 'select_attendees') {
                        attendees = []
                        confirmation.values.forEach(async value => {
                            const member = await interaction.guild.members.fetch(value)
                            attendees.push(member)
                            
                        })
                    } else if (confirmation.customId === 'confirmSelection') {
                        break;
                    }
                }

            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 300 secounds, cancelling!")], components: []})
                } else {
                        throw error
                }
            }
        } else if (cohost != null && host.id === cohost.id) { //check that the cohost is not the host
            embeded_error.setDescription("No uh! you are not both the host and the cohost!!!")
            return await interaction.editReply({ embeds: [embeded_error], components: []})
        }

        

        const wedge_picture = interaction.options.getAttachment('wedge_picture')
        

        let announcmentMessage = await validateMessageLink(interaction, interaction.options.getString('announcemnt_link'))
        if (announcmentMessage.error) return interaction.editReply({ embeds: [embeded_error.setDescription(announcmentMessage.error)] })
        announcmentMessage = announcmentMessage.message



        //fetching the promologs channel and validating it
        dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "promologs" } })
        if (!dbChannel) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription('There is no promolog channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>')], components: [] });
        }
        const promologsChannel = await interaction.guild.channels.fetch(dbChannel.channel_id)


        const time = announcmentMessage.createdAt
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`

        let eventType = "event"


        if (interaction.options.getString('event_type')) {
            eventType = interaction.options.getString('event_type')
        } else { 
            if (voice_channel.id !== undefined ) {
                const VCdbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, channel_id: voice_channel.id}})
                if (VCdbChannel) {
                eventType = VCdbChannel.type
                }
            }
        }
        
        if (eventType === "event") {
            const selectEventType = new StringSelectMenuBuilder()
            .setCustomId('select_event_type')
            .setPlaceholder('Select the event type')
            .addOptions([
                { label: 'Training', value: 'training'},
                { label: 'Patrol', value: 'patrol'},
                { label: 'Gamenight', value: 'gamenight'},
                { label: 'tryout', value: 'tryout'},
                { label: 'Rallybeforeraid', value: 'rallybeforeraid'},
                { label: 'Rallyafterraid', value: 'rallyafterraid'},
                { label: 'Other', value: 'other'}
            ])
            const row = new ActionRowBuilder().addComponents(selectEventType)
            const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.LuminousVividPink).setDescription(`Please select the event type`)], components: [row]})
            const collectorFilter = i => i.customId === 'select_event_type' && i.user.id === interaction.user.id
            try {
                const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 300_000 })
                confirmation.deferUpdate()
                eventType = confirmation.values[0]
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 300 secounds, cancelling!")], components: []})
                } else {
                    throw error
                }
            }
        }



        const event_log_embed = new EmbedBuilder().setColor([254, 1, 177])
        event_log_embed.setTitle(eventType.charAt(0).toUpperCase() + eventType.slice(1)).setThumbnail(wedge_picture.url)
        let description = `**Host:** <@${host.id}>\n`
        if (cohost) {
            description+=`*Cohost:* <@${cohost.id}>\n`
        }
        description+=`**Attendees:** `
        let officers = []
        let total_attendes = 0, total_officers = 0

        let guild_ranks = await db.Ranks.findAll({ where: {guild_id: interaction.guild.id}})
        guild_ranks = guild_ranks.sort((a, b) => {a.rank_index - b.rank_index})
        let mentions = `<@${host.id}> `

        let dbAttendees = []

        for (const member of attendees) {
            if (member.user.bot || host.id === member.user.id ) continue;
            total_attendes++
            mentions += `<@${member.id}> `
            interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Processing " + member.displayName)], components: []})
            description += `\n\n <@${member.id}>: `;
            
            let dbUser = await db.Users.findOne({ where: {guild_id: interaction.guild.id, user_id: member.id}});
            if (!dbUser) {
                dbUser = await db.Users.create({user_id: member.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null});
            }
    

            const updateRankResponse = await dbUser.updateRank(noblox, server.group_id, member);
            if (dbUser.rank_id === null) {
                description += updateRankResponse.message
                continue;
            }

            dbAttendees.push(dbUser)

            const rank = await dbUser.getRank()
            if (rank.is_officer) {
                officers.push(member.id)
                total_officers++
            }
            if (updateRankResponse.message) {
                if (updateRankResponse.message.includes("highest rank")) {
                    description += "Thanks for attending (can not get promoted by attending events!)";
                } else if (updateRankResponse.message.includes("Can not be demoted with " + nameOfPromoPoints + "!")) { 
                    description += "Thanks for attending (can not be demoted with " + nameOfPromoPoints + "!)";
                }else {
                    description += updateRankResponse.message
                }
                if (updateRankResponse.error) {
                continue;
                }
            }
            dbUser.total_events_attended += 1
            const robloxUser = updateRankResponse.robloxUser
            const addPromoPointResponce = (eventType !== 'gamenight') ? await dbUser.addPromoPoints(noblox, server.group_id, member, guild_ranks, 1, robloxUser) : {message: `Thanks for attending! Gamenights do not give ${nameOfPromoPoints} sorry!`}
            if (addPromoPointResponce && updateRankResponse.message) { description += "\n" }
            description += addPromoPointResponce.message
            dbUser.save()
            
        }

        if (total_attendes === 0) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription("No attendees === no quota point!")], components: []})
        }

        let attendeesIds = ""
        dbAttendees.forEach(dbUser => {
            attendeesIds += dbUser.id + ","
        })

        const dbEvent = await db.Events.create({guild_id: interaction.guild.id, host: host.id, cohost: cohost ? cohost.id : null, type: eventType, attendees: attendeesIds, amount_of_attendees: total_attendes, officers: officers.toString(), amount_of_officers: total_officers})

        dbAttendees.forEach(async dbUser => {
            dbUser.events = dbUser.events ? dbUser.events + "," + dbEvent.id : "" + dbEvent.id
            dbUser.save()
        })

        const officer = await db.Officers.findOne({ where: {user_id: host.id, guild_id: interaction.guild.id, retired: null}})
        if (officer) {
            officer.total_events_hosted += 1
            officer.total_attendees += total_attendes
            officer.save()
        }
        interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Event has been logged to database").setColor([255, 255, 0])], components: []})



        event_log_embed.setDescription(description)
        event_log_embed.setFooter({ text: `Total attendees: ${total_attendes} ID: ` + dbEvent.id})

        /* might be reworked and reintroduced later
        const promoter_role_id = "1109546594535211168" 
        string += `\nPing: <@&${promoter_role_id}>`
        */
        //place rank up function here!
        
        //event/promo logs
        const promologs_message = await promologsChannel.send({content: mentions, embeds: [event_log_embed]})
        dbEvent.promolog_message_link = promologs_message.url
        
        //SEA Format
        if (["training", "patrol", "tryout"].includes(eventType)) {
            const sealogMessage = await sealog(interaction, db, wedge_picture, announcmentMessage, eventType, total_attendes)
            if (!sealogMessage) {
                return
            } 
            dbEvent.sealog_message_link = sealogMessage.url
        }
        dbEvent.save()
        
        
        const success_embed = new EmbedBuilder().setColor([0,255,0]).setDescription("Event succesfully logged and saved to the database!")
        await interaction.editReply({embeds: [success_embed], components: []});

        
	},
};