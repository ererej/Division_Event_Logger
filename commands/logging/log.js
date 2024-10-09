const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Attachment, Embed, Colors } = require('discord.js');
const db = require("../../dbObjects.js");
const testers = require("../../tester_servers.json");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)

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
                    { name: 'gamenight', value: 'gamenight'}
                )
        ),
    testerLock: true,
	async execute(interaction) {
        await interaction.deferReply()
        
        const embeded_error = new EmbedBuilder().setColor([255,0,0])


        const host = await interaction.guild.members.fetch(interaction.member.user.id)
        const dbHost = await db.Users.findOne({ where: { user_id: host.id, guild_id: interaction.guild.id }})

        let cohost;
        if (interaction.options.getUser('cohost')) {
            cohost = await interaction.guild.members.fetch(interaction.options.getUser('cohost').id)
            const dbCohost = await db.Users.findOne({ where: { user_id: cohost.id, guild_id: interaction.guild.id }})
        }
        const voice_channel = await interaction.guild.channels.fetch(host.voice.channelId)


        //check if the user has permission to host events. 
        if (/*!(await dbHost.getRank()).is_officer &&*/ !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            return await interaction.editReply({ embeds: [embeded_error]});
        } else if (voice_channel.id === undefined) { //check if the host is in a voice channel
            embeded_error.setDescription("Unable to automaticly promote attendees as you are not in a Voice Chat with them! \nHave fun manualy promoting :D")
            return await interaction.editReply({ embeds: [embeded_error]});
        } else if (cohost != null && cohost.voice.channelId != voice_channel.id) { //check that the cohost is a valid cohost
            embeded_error.setDescription("Invalid cohost make sure the cohost you specified is in your VC!")
            return await interaction.editReply({ embeds: [embeded_error]})
        } else if (cohost != null && host.id === cohost.id) { //check that the cohost is not the host
            embeded_error.setDescription("No uh! you are not both the host and the cohost!!!")
            return await interaction.editReply({ embeds: [embeded_error]})
        } else {

        

        const wedge_picture = interaction.options.getAttachment('wedge_picture')
        const server = await db.Servers.findOne({ where: {guild_id: interaction.guild.id}})
        if (!server) { //!!!!!!!! make the reply link to the /setup command.
            return await interaction.editReply({ Embeds: [embeded_error.setDescription("Server not found in the database! Please contact an admin to link the server!")]})
        }
        const division_name = server ? server.name : interaction.guild.name
        const announcmentMessageLink = interaction.options.getString('announcemnt_link')
        const regex = /^https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+$/;
        if (!regex.test(announcmentMessageLink)) return await interaction.editReply({ content: 'The link you provided is not a valid discord message link!' });
        let announcmentChannel;
        try {
            announcmentChannel = await interaction.guild.channels.cache.find(i => i.id === announcmentMessageLink.split("/")[5])
        } catch (error) {
            return await interaction.editReply({ content: 'The link you provided looks to refer to a message in anouther discord server and will there for not work.' });
        }
        let announcmentMessage;
        try {
            announcmentMessage = await announcmentChannel.messages.fetch(announcmentMessageLink.split("/")[6])
        } catch (error) {
            return await interaction.editReply({ content: 'could not locate the announcment message please dubble check your message link!' });
        }

        //fetching the sea logs channel and validating it
        let dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "sealogs" } })
        if (!dbChannel) {
            return await interaction.editReply({ embeds: embeded_error.setDescription('There is no sealog channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>') });
        }
        const sea_format_channel = await interaction.guild.channels.fetch(dbChannel.channel_id)

        //fetching the promologs channel and validating it
        dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "promologs" } })
        if (!dbChannel) {
            return await interaction.editReply({ embeds: embeded_error.setDescription('There is no promolog channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>') });
        }
        const promologsChannel = await interaction.guild.channels.fetch(dbChannel.channel_id)


        const time = announcmentMessage.createdAt
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`

        let event_type = ""
        let logChannelLink = ""
        let eventType = ""
        const event_log_embed = new EmbedBuilder().setColor([254, 1, 177])
        if (interaction.options.getString('event_type')) {
            eventType = interaction.options.getString('event_type')
        } else {
            dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, id: voice_channel.id}})
            if (dbChannel) {
                eventType = dbChannel.type
            }
        }
        switch (eventType) {
            case "training":
                logChannelLink = "<#1085337363359731782>"
                break;
            case "patrol":
                logChannelLink = "<#1219980705967374359>"
                break;
        }
        event_log_embed.setTitle(eventType ?? "Event").setThumbnail(wedge_picture.url)
        let description = `**Host:** <@${host.id}>\n`
        if (cohost) {
            description+=`*Cohost:* ${cohost.displayName}\n`
        }
        description+=`**Attendees:** `
        let total_event_attendes = 0
        let guild_ranks = await db.Ranks.findAll({ where: {guild_id: interaction.guild.id}})
        guild_ranks = guild_ranks.sort((a, b) => {a.rank_index - b.rank_index})


        for (const member of voice_channel.members.values()) {
            if (!member.user.bot && host.id != member.user.id && (cohost === null || cohost.id != member.user.id)) {
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
            if (updateRankResponse) {
                if (updateRankResponse.includes("highest rank")) {
                description += "Thanks for attending (can not get promoted by attending events!)";
                } else {
                description += updateRankResponse
                }
                if (updateRankResponse.includes("Error")) {
                continue;
                }
            }
            dbUser.total_events_attended += 1
            const addPromoPointResponce = await dbUser.addPromoPoints(noblox, server.group_id, member, guild_ranks, 1)
            if (addPromoPointResponce && updateRankResponse) { description += "\n" }
            description += addPromoPointResponce
            dbUser.save()
            }
        }
        event_log_embed.setDescription(description)
        event_log_embed.setFooter({ text: `Total attendees: ${total_event_attendes}`})

        /* might be reworked and reintroduced later
        const promoter_role_id = "1109546594535211168" 
        string += `\nPing: <@&${promoter_role_id}>`
        */
        //place rank up function here!
        //SEA Format

        //send the sea format to the sea logs channel
        if (logChannelLink) {
            sea_format_channel.send(`VVV${logChannelLink}VVV`)
        }
        sea_format_channel.send({content: `Division: ${division_name}\nLink: ${announcmentMessageLink} \nDate: ${date}\nScreenshot: \n`, files: [{attachment: wedge_picture.url}] });
        
        //event/promo logs
        await promologsChannel.send({embeds: [event_log_embed]})
        
        const success_embed = new EmbedBuilder().setColor([0,255,0]).setDescription("Event succesfully logged")
        await interaction.editReply({embeds: [success_embed]});

        }  
	},
};