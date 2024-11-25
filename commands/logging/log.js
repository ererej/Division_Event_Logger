const { SlashCommandBuilder, EmbedBuilder, UserSelectMenuBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ActionRowBuilder,  PermissionsBitField, Attachment, Embed, Colors } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)

const sealog = require('../../functions/sealog.js')
const validateMessageLink = require('../../functions/validateMessageLink.js')

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
        ),
    testerLock: true,

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */
	async execute(interaction) {
        await interaction.deferReply()

        const embeded_error = new EmbedBuilder().setColor([255,0,0])

        const server = await db.Servers.findOne({ where: {guild_id: interaction.guild.id}})
        if (!server) { //!!!!!!!! make the reply link to the /setup command.
            return await interaction.editReply({ Embeds: [embeded_error.setDescription("Server not found in the database! Please contact an admin to link the server!")]})
        }

        const host = await interaction.guild.members.fetch(interaction.member.user.id)
        let dbHost = await db.Users.findOne({ where: { user_id: host.id, guild_id: interaction.guild.id }})
        if (!dbHost) {
            dbHost = await db.Users.create({ user_id: host.user.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
        }
        const updateResponce = await dbHost.updateRank(noblox, server.group_id, host) ?? ""
        if (dbHost.rank_id === null) {
            dbHost.destroy()
            return interaction.editReply({embeds: [embeded_error.setDescription("Couldn't verify your permissions due to not being able to verify your rank!")]})
        }
        
        if (updateResponce.message) {
            interaction.followUp({embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription("Your rank was updated: " + updateResponce)]})
        }

        let cohost;
        if (interaction.options.getUser('cohost')) {
            cohost = await interaction.guild.members.fetch(interaction.options.getUser('cohost').id).catch(() => {
                return interaction.editReply({embeds: [embeded_error.setDescription('The cohost you are trying to link to does not exist!')]})
            })
            const dbCohost = await db.Users.findOne({ where: { user_id: cohost.id, guild_id: interaction.guild.id }})
        }
        const voice_channel = await interaction.guild.channels.fetch(host.voice.channelId)
        let attendees = []
        if (voice_channel.members) {
            attendees = voice_channel.members.values()
        }
        

        //check if the user has permission to host events
        if ( !(await dbHost.getRank()).is_officer ) {
            embeded_error.setDescription("Insuficent permissions!")
            return await interaction.editReply({ embeds: [embeded_error]});
        } else if (voice_channel.id === undefined) { //check if the host is in a voice channel
            const selectAttendees = new UserSelectMenuBuilder()
            .setCustomId('select_attendees')
            .setPlaceholder('Select the attendees')
            .setMinValues(1)
            .setMaxValues(25)
            const row = new ActionRowBuilder().addComponents(selectAttendees)

            const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.LuminousVividPink).setDescription(`Please enter the attendees of your event. \nNext time run /log before everyone leaves and you wont have to manualy do it`)], components: [row]})

            const collectorFilter = i => i.customId === 'select_attendees' && i.user.id === interaction.user.id
            try {
                const confirmation = await response.awaitMessageComponent({ Filter: collectorFilter, time: 300_000 })
                confirmation.values.forEach(async value => {
                    const member = await interaction.guild.members.fetch(value)
                    attendees.push(member)
                })
                

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
        

        const announcmentMessage = await validateMessageLink(interaction, interaction.options.getString('announcemnt_link'))
        if (!announcmentMessage) return



        //fetching the promologs channel and validating it
        dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "promologs" } })
        if (!dbChannel) {
            return await interaction.editReply({ embeds: embeded_error.setDescription('There is no promolog channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>'), components: [] });
        }
        const promologsChannel = await interaction.guild.channels.fetch(dbChannel.channel_id)


        const time = announcmentMessage.createdAt
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`


        let eventType = ""

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
        
        if (!eventType) {
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
                eventType = confirmation.values[0]
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 300 secounds, cancelling!")], components: []})
                } else {
                    throw error
                }
            }
        }


        if (interaction.options.getString('event_type')) {
            eventType = interaction.options.getString('event_type')
        } else if (voice_channel.id !== undefined) {    
            dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, id: voice_channel.id}})
            if (dbChannel) {
                eventType = dbChannel.type
            }
        } 

        const event_log_embed = new EmbedBuilder().setColor([254, 1, 177])
        event_log_embed.setTitle(eventType ? eventType : "Event").setThumbnail(wedge_picture.url)
        let description = `**Host:** <@${host.id}>\n`
        if (cohost) {
            description+=`*Cohost:* <@${cohost.id}>\n`
        }
        description+=`**Attendees:** `
        let total_event_attendes = 0
        let guild_ranks = await db.Ranks.findAll({ where: {guild_id: interaction.guild.id}})
        guild_ranks = guild_ranks.sort((a, b) => {a.rank_index - b.rank_index})
        let mentions = `<@${host.id}> `


        for (const member of attendees) {
            if (!member.user.bot && host.id != member.user.id ) {
            mentions += `<@${member.id}> `
            interaction.editReply({ embeds: [new EmbedBuilder().setDescription("prossesing " + member.displayName)], components: []})
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
                description += updateRankResponse.message
                }
                if (updateRankResponse.error) {
                continue;
                }
            }
            dbUser.total_events_attended += 1
            const robloxUser = updateRankResponse.robloxUser
            const addPromoPointResponce = (eventType !== 'gamenight') ? await dbUser.addPromoPoints(noblox, server.group_id, member, guild_ranks, 1, robloxUser) : {message: "Thanks for attending! Gamenights do not give promo points sorry!"}
            if (addPromoPointResponce && updateRankResponse.message) { description += "\n" }
            description += addPromoPointResponce.message
            dbUser.save()
            }
        }

        interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Event has been logged to database").setColor([255, 255, 0])], components: []})

        if (total_event_attendes === 0) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription("No attendees === no quota point!")], components: []})
        }

        event_log_embed.setDescription(description)
        event_log_embed.setFooter({ text: `Total attendees: ${total_event_attendes}`})

        /* might be reworked and reintroduced later
        const promoter_role_id = "1109546594535211168" 
        string += `\nPing: <@&${promoter_role_id}>`
        */
        //place rank up function here!
        
        //event/promo logs
        await promologsChannel.send({content: mentions, embeds: [event_log_embed]})
    
        
        //SEA Format
        let responce;
        if (["training", "patrol", "tryout"].includes(eventType)) {
            responce = await sealog(interaction, db, wedge_picture, announcmentMessage, eventType, total_event_attendes)
        }
        if (!responce) {
            return 
        }
        
        
        const success_embed = new EmbedBuilder().setColor([0,255,0]).setDescription("Event succesfully logged")
        await interaction.editReply({embeds: [success_embed], components: []});

        
	},
};