const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, Colors, UserSelectMenuBuilder, StringSelectMenuBuilder } = require("discord.js");
const validateMessageLink = require("../../utils/validateMessageLink");
const db = require("../../dbObjects");
const { Op, and } = require("sequelize");
const generateSeaLogFormat = require("../../utils/generateSealogFormat");
const noblox = require("noblox.js");
const getLinkedChannel = require("../../utils/getLinkedChannel");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('editevent')
    .setDescription('Lets you edit some parts of an event')
    .addIntegerOption(option => 
        option.setName('event_id')
        .setDescription('Please enter the Id of the event that you want to delete from the database!')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('announcement_message')
        .setDescription('The message that announced the event')
        .setRequired(false)
    )
    .addUserOption(option =>
        option.setName('host')
        .setDescription('The correct host of the event')
        .setRequired(false)
    )
    .addUserOption(option =>
        option.setName('cohost')
        .setDescription('The correct cohost of the event')
        .setRequired(false)
    )
    .addBooleanOption(option =>
        option.setName('edit_attendees')
        .setDescription('Whether or not you want to edit the attendees of the event')
        .setRequired(false)
    )
    //! add when you feel like it
    // .addIntegerOption(option =>
    //     option.setName('promopoints_rewarded')
    //     .setDescription('The amount of promopoints rewarded for the event')
    //     .setRequired(false)
    // )
    .addStringOption(option =>
        option.setName('game_name')
        .setDescription('The name of the game that the event was played on')
        .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('date')
        .setDescription('The date of the event')
        .setRequired(false)
    )
    .addIntegerOption(option =>
        option.setName('length')
        .setDescription('The length of the event in minutes')
        .setRequired(false)
        .setMinValue(1)
    )
    ,
    
    /**
    * @param {import('discord.js').CommandInteraction} interaction
    */

    async execute(interaction) { //! it should let you edit the host, cohost, attendees, the game it happened on, the date, the time
        await interaction.deferReply();
        const event_id = interaction.options.getInteger('event_id');

        const event = await db.Events.findOne({ where: { id: event_id } });
        const embeded_error = new EmbedBuilder().setColor(Colors.Red);
        // Permission checks
        if (!event) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`No event found with the id of ${event_id}`)]});
        }
        if (event.guild_id !== interaction.guild.id) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`Nice try buddy but that event was not hosted in this server!`)]});
        }
        if (event.host !== interaction.user.id && !(interaction.member.permissions.has('ADMINISTRATOR') || interaction.member.permissions.has('MANAGE_GUILD'))) {
            return interaction.editReply({ embeds: [embeded_error.setDescription(`Access denied! You are not the host of the event nor are you an administator!`)]});
        }

        let dbHostOfficer = await db.Officers.findOne({ where: { user_id: event.host, guild_id: interaction.guild.id } });
        if (interaction.options.getUser('host')) {
            dbHostOfficer.total_events_hosted -= 1;
            dbHostOfficer.total_attendees -= event.amount_of_attendees;
            dbHostOfficer.save();
            event.host = interaction.options.getUser('host').id;
            //! make it get the dbUser and run updateRank on it and update officer
            dbHostOfficer = await db.Officers.findOne({ where: { user_id: event.host, guild_id: interaction.guild.id } });
            if (!dbHostOfficer) {
                return interaction.editReply({ embeds: [embeded_error.setDescription(`From what I can tell the host is not an officer(if they are then run /updateuser on them)! Aborting!`)]});
            }
            dbHostOfficer.total_events_hosted += 1;
            dbHostOfficer.total_attendees += event.amount_of_attendees;
            dbHostOfficer.save();
        }

        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } });

        event.announcment_message = interaction.options.getString('announcement_message') ?? event.announcment_message ?? "announcement message not found";


        const announcement = await validateMessageLink(interaction, event.announcment_message);
        let date
        if (interaction.options.getString('date')) {
            date = interaction.options.getString('date');
        } else {
            if (announcement.message) {
                const eventStartTime = new Date(announcement.message.createdTimestamp);
                date = "DD/MM/YYYY".replace("DD", eventStartTime.getDate()).replace("MM", eventStartTime.getMonth()+1).replace("YYYY", eventStartTime.getFullYear())
            }
        }

        

        let promoLogs = "# changes made to event id " + event.id + ":\n";
        if (interaction.options.getBoolean('edit_attendees')) {
            let attendees = [];
            let eventAttendees = event.attendees.split(",");
            eventAttendees = await db.Users.findAll({ where: { id: { [Op.in]: eventAttendees }, guild_id: interaction.guild.id } });
            for (let i = 0; i < eventAttendees.length; i++) {
                const member = await interaction.guild.members.fetch(eventAttendees[i]);
                eventAttendees[i].member = member;
            }
           

           
            const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } });


            const addButton = new ButtonBuilder().setCustomId('add_attendees').setLabel('Add Attendees').setStyle('Primary');
            const removeButton = new ButtonBuilder().setCustomId('remove_attendees').setLabel('Remove Attendees').setStyle('Danger');
            const bothButton = new ButtonBuilder().setCustomId('both').setLabel('Both').setStyle('Secondary');
            const row = new ActionRowBuilder().addComponents(addButton, removeButton, bothButton);
            const responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Would you like to *add*, *remove* or *both* add and remove attendees?`).setColor(Colors.Blue)], components: [row] });
            
            const collectorFilter = i => i.user.id === interaction.user.id && (i.customId === 'add_attendees' || i.customId === 'remove_attendees' || i.customId === 'both') ;
            try {
                const selection = await responce.awaitMessageComponent({ filter: collectorFilter, time: 300_000 });
                selection.deferUpdate();
                const editMethod = selection.customId;
                
                let memberSelectMenu = new UserSelectMenuBuilder()
                memberSelectMenu.setMinValues(1);
                memberSelectMenu.setMaxValues(25);
                    
                if (editMethod === 'remove_attendees' && eventAttendees.length < 26) {
                    memberSelectMenu = new StringSelectMenuBuilder()
                    memberSelectMenu.setMinValues(1);
                    memberSelectMenu.setMaxValues(eventAttendees.length);
                    
                    for (let attendee of eventAttendees) {
                        attendee = await interaction.guild.members.fetch(attendee.user_id);
                        memberSelectMenu.addOptions([
                            {
                                label: attendee.displayName,
                                value: attendee.id
                            }
                        ]);
                    };
                }

                memberSelectMenu.setCustomId('member_select')
                switch (editMethod) {
                    case 'add_attendees':
                        memberSelectMenu.setPlaceholder('Select the members you want to add to the event')
                        break;
                    case 'remove_attendees':
                        memberSelectMenu.setPlaceholder('Select the members you want to remove from the event')
                        break;
                    case 'both':
                        memberSelectMenu.setPlaceholder('Select ALL the members that attended the event')
                        break;
                }
                const confirmButton = new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle('Success');
                const cancelButton = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle('Danger');
                const confirmRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);  
                const memberSelectRow = new ActionRowBuilder().addComponents(memberSelectMenu);  

                const memberSelectResponce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(editMethod == "add_attendees" ? `Please select the members you want to **add** to the event` : editMethod == "remove_attendees" ? "Please select the members you want to **remove** from the event!" : "Please select **all** the events attendees!").setColor(Colors.Blue)], components: [memberSelectRow, confirmRow] });
                
                let selectedMembers = [];
                const memberSelectCollectorFilter = i => i.user.id === interaction.user.id && (i.customId === 'member_select' || i.customId === 'confirm' || i.customId === 'cancel');
                try {
                    while (true) {
                        const responce = await memberSelectResponce.awaitMessageComponent({ filter: memberSelectCollectorFilter, time: 300_000 });
                        responce.deferUpdate();

                        if (responce.customId === 'member_select') {
                            selectedMembers = []
                            responce.values.forEach(memberId => {
                                if (!selectedMembers.includes(memberId)) {
                                    selectedMembers.push(memberId);
                                }
                            });
                        }

                        if (responce.customId === 'confirm') {
                            if (selectedMembers.length < 1) {
                                continue;
                            }
                            interaction.editReply({embeds: [new EmbedBuilder().setDescription(`Processing!`).setColor(Colors.Blue)], components: []});
                            break;
                        }

                        if (responce.customId === 'cancel') {
                            return interaction.editReply({embeds: [embeded_error.setDescription("Cancelling!")], components: []});
                        }
                    }
                } catch (error) {
                    if (error.message === "Collector received no interactions before ending with reason: time") {
                        return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 300 secounds, cancelling!")], components: []})
                    } else {
                            throw error
                    }
                }

                const promopointsRewarded = event.promopoints_rewarded ?? 1


                const addAttendee = async (attendeeId) => {
                    if (eventAttendees.map(a => a.user_id).includes(attendeeId)) {
                        promoLogs += `\n<@${attendeeId}> was already attending the event`
                    } else {
                        promoLogs += `\n<@${attendeeId}> was added to the event! `
                        let dbAttendee = await db.Users.findOne({ where: { user_id: attendeeId, guild_id: interaction.guild.id } });
                        if (!dbAttendee) {
                            dbAttendee = await db.Users.create({ user_id: attendeeId, guild_id: interaction.guild.id, promo_points: promopointsRewarded });
                        }
                        event.attendees = event.attendees.split(",").push(dbAttendee.id).join(","); // uses attendee.id for some stupid reason
                        event.amount_of_attendees += 1;
                        if (promopointsRewarded > 0) {
                            
                            const guildMember = await interaction.guild.members.fetch(attendeeId);
                            const updateRankResponse = await dbAttendee.updateRank(server.group_id, guildMember, undefined, ranks);
                            if (updateRankResponse.message) {
                                promoLogs += "Updated rank:\n" + updateRankResponse.message + "\n";
                            }
                                
                            if (updateRankResponse.error) {
                                promoLogs += "\n";
                                return; 
                            }
                            const addPromoPointsResponce = await dbAttendee.addPromoPoints(server.group_id, guildMember, ranks, promopointsRewarded);
                            
                            dbAttendee.total_events_attended += 1;
                            dbAttendee.events += `,${event_id}`;
                            await dbAttendee.save();
                            if ((await dbAttendee.getRank()).is_officer) {
                                event.amount_of_officers += 1;
                                event.officers += event.officers.split(",").push(dbAttendee.user_id).join(","); // add the officer to the list
                            }
                            promoLogs += "Added promo points: \n" + addPromoPointsResponce.message + "\n";
                        }
                    }
                }

                const removeAttendee = async (attendeeId) => {
                    if (!eventAttendees.map(a => a.user_id).includes(attendeeId)) {
                        promoLogs += `\n<@${attendeeId}> was already not logged as attending the event!`
                    } else {
                        promoLogs += `\n<@${attendeeId}> was removed from the event! `
                        let dbAttendee = await db.Users.findOne({ where: { user_id: attendeeId, guild_id: interaction.guild.id } });
                        if (!dbAttendee) {
                            dbAttendee = await db.Users.create({ user_id: attendeeId, guild_id: interaction.guild.id, promo_points: promopointsRewarded });
                        }
                        event.amount_of_attendees -= 1;
                        event.attendees = event.attendees.split(",").filter(id => id !== dbAttendee.id).join(","); // remove the attendee from the list
                        if (promopointsRewarded > 0) {
                            
                            const guildMember = await interaction.guild.members.fetch(attendeeId);
                            if (!guildMember) {
                                promoLogs += `\nI was unable to fetch the guild member for <@${attendeeId}>, they might have left the server? Aborting removing promo points and rank update!`;
                                return;
                            }
                            const updateRankResponse = await dbAttendee.updateRank(server.group_id, guildMember, undefined, ranks);
                            if (updateRankResponse.message) {
                                promoLogs += "Updated rank:\n" + updateRankResponse.message + "\n";
                            }
                            if (updateRankResponse.error) {
                                promoLogs += "\n";
                                return;
                            }
                            const removePromoPointsResponce = await dbAttendee.removePromoPoints(server.group_id, guildMember, ranks, promopointsRewarded);
                            
                            dbAttendee.total_events_attended -= 1;
                            dbAttendee.events = dbAttendee.events.replace(`,${event_id}`, "");
                            dbAttendee.save();
                            if (event.officers.split(",").includes(dbAttendee.user_id)) {
                                event.amount_of_officers -= 1;

                                event.officers = event.officers.split(",").filter(officerId => officerId !== dbAttendee.user_id).join(","); // remove the officer from the list
                            }
                            promoLogs += "removed promo points: \n" + removePromoPointsResponce.message + "\n";
                        }
                    }
                }      

                if (editMethod === 'add_attendees') {
                    for (const attendee of selectedMembers) {
                        await addAttendee(attendee);
                    }

                }
                if (editMethod === 'remove_attendees') {
                    for (const attendee of selectedMembers) {
                        await removeAttendee(attendee);
                    }
                }
                if (editMethod === 'both') {
                    for (const attendee of eventAttendees) {
                        if (!selectedMembers.filter(selectedMember => selectedMember.id === attendee.user_id).length > 0) {
                            await removeAttendee(attendee);
                        }
                    }
                    for (const attendee of selectedMembers) {
                        await addAttendee(attendee);
                    }
                }
            
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 300 secounds, cancelling!")], components: []})
                }
                throw error;
            }        
    
        }
            

        event.length = interaction.options.getInteger('length') ?? event.length;
        event.game = interaction.options.getString('game_name') ?? event.game;
        event.save();

        const promologsChannel = await getLinkedChannel({interaction, db, query: {type: "promologs", guild_id: interaction.guild.id } });
        if (promologsChannel.channel) {
            promologsChannel.channel.send({ embeds: [new EmbedBuilder().setDescription(promoLogs).setColor(Colors.Blue)] });
        } else {
            interaction.followUp({ embeds: [new EmbedBuilder().setDescription(promoLogs).setColor(Colors.Blue)] });
        }


        //! make it edit the seaLog and send a new promoLog with the changes | done!
        
        const sealog = await validateMessageLink(interaction, event.sealog_message_link);
        
        // TODO rework utils/sealog.js to use utils/generateSeaLogFormat.js 
        //TODO check if its possible to edit the picture. some people say that you can if you clear the messages attachments and then add the picture
        interaction.editReply({ components: [], embeds: [new EmbedBuilder().setDescription(generateSeaLogFormat({
            eventType: event.type,
            DivisionName: server.name ?? interaction.guild.name,
            announcmentLink: event.announcment_message,
            Date: date,
            lenth: event.length,
            attendeeCount: event.amount_of_attendees,
            mapName: event.game,
            codeblock: (await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "makesealogcodeblock"}})) ? "```" : "",
            
            })
        )]});
        if (sealog) {
            try {
                await sealog.message.edit({ embeds: [new EmbedBuilder().setDescription(generateSeaLogFormat({
                    eventType: event.type,
                    DivisionName: server.name ?? interaction.guild.name,
                    announcmentLink: event.announcment_message,
                    Date: date,
                    lenth: event.length,
                    attendeeCount: event.amount_of_attendees,
                    mapName: event.game,
                    codeblock: (await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "makesealogcodeblock"}})) ? "```" : "",
                    
                }))]});
            } catch (error) {
                console.error("Failed to edit the sealog message:", error);
            }
        }
    }
}