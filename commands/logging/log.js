const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Attachment } = require('discord.js');
const db = require("../../dbObjects")

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
                .setRequired(false)
        ),
	async execute(interaction) {
        await interaction.deferReply()
        
        const embeded_error = new EmbedBuilder().setColor([255,0,0])

        const host = await interaction.guild.members.fetch(interaction.member.user.id)
        let cohost = null
        if (interaction.options.getUser('cohost')) {
            cohost = await interaction.guild.members.fetch(interaction.options.getUser('cohost').id)
        }

        const officer_ranks = await db.Ranks.findAll({ where: {guild_id: interaction.guild.id, is_officer: true}})
        let is_officer = false
		for (let i=0; i<officer_ranks.length;i++) {
			if (interaction.member.roles.cache.some(role => role.id === officer_ranks[i].id)) {
                is_officer = true
                break
            } else {
                is_officer = false
            }
		}

        const voice_channel = await interaction.guild.channels.fetch(host.voice.channelId)
        if (!is_officer && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
        } else if (voice_channel.id === undefined) {
            embeded_error.setDescription("Unable to automaticly promote attendees as you are not in a Voice Chat with them! \nHave fun manualy promoting :D")
            await interaction.editReply({ embeds: [embeded_error]});
        } else if (cohost != null && cohost.voice.channelId != voice_channel.id) {
            embeded_error.setDescription("Invalid cohost make sure the cohost you specified is in your VC!")
            await interaction.editReply({ embeds: [embeded_error]})
        } else if (cohost != null && host.id === cohost.id) {
            embeded_error.setDescription("No uh! you are not both the host and the cohost!!!")
            await interaction.editReply({ embeds: [embeded_error]})
        } else {

        

        const wedge_picture = interaction.options.getAttachment('wedge_picture')
        const division_name = interaction.guild.name
        const announcmentMessageLink = interaction.options.getString('announcemnt_link')
        const announcmentChannel = await interaction.guild.channels.cache.find(i => i.id === announcmentMessageLink.split("/")[5])
        const announcmentMessage = await announcmentChannel.messages.fetch(announcmentMessageLink.split("/")[6])
        const time = announcmentMessage.createdAt
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`

        let event_type = ""
        let log_channel_link = ""
        const event_log_embed = new EmbedBuilder().setColor([255,128,0])
        switch (voice_channel.id) {
            case "1074270354245173318" :
                event_log_embed.setTitle("**Training**")
                log_channel_link = "<#1085337363359731782>"
                break;
            case "1149806680037675053" :
                event_log_embed.setTitle("**Gamenight**")
                break;
            case "1203731373563838496" :
                event_log_embed.setTitle("**Patrol**")
                log_channel_link = "<#1219980705967374359>"
                break;
            default:
                event_log_embed.setTitle("**Event**")
        }
        let string = `**${event_type}** \nHost: <@${host.id}>\n`
        event_log_embed.addFields({ name: "Host", value: `<@${host.id}>` }).setThumbnail(wedge_picture.url)
        if (cohost) {
            string+=`Cohost: ${cohost.displayName}\n`
            event_log_embed.addFields({ name: "Cohost", value: `<@${cohost.id}>`})
        }
        string+=`Attendees: `
        let attendees_fields = event_log_embed.addFields({name: 'Attendeees', value: "\u200b"})
        let total_event_attendes = 0
        let guild_ranks = await db.Ranks.findAll({ where: {guild_id: interaction.guild.id}})
        guild_ranks = guild_ranks.sort((a, b) => {a.rank_index - b.rank_index})
        const attendees_collection = await voice_channel.members
        let attendees = []
        attendees_collection.forEach((attende) => {
            attendees.push(attende)
        })
        for (let i in attendees) {
            member = attendees[i]
            if (/*!member.user.bot &&*/ host != member.user.id && (cohost === null || cohost.id != member.user.id)) {
                total_event_attendes++
                let promotion_string = ""
                let attende = await db.Users.findOne({ where: {guild_id: interaction.guild.id, user_id: member.id}, include: db.Users.rank})
                
                if (!attende) {
                    for (const rank of guild_ranks) {
                        if (member.roles.cache.some(role => role.id === rank.id)) {
                            attende = await db.Users.create({user_id: member.id, guild_id: interaction.guild.id, promo_points: 1, rank_id: rank.id, total_events_attended: 0, recruted_by: null})
                            if (attende.promo_points >= guild_ranks[rank.rank_index + 1].promo_points) {
                                const old_role_id = attende.rank_id;
                                attende.rank_id = guild_ranks[rank.rank_index + 1].id;
                                attende.promo_points = 0;
                                attende.save();
                                member.roles.add(attende.rank_id);
                                member.roles.remove(old_role_id);
                                promotion_string = `has been added to the data base and been promoted to <@&${attende.rank_id}> (0/${guild_ranks[rank.rank_index + 1].promo_points})`;
                                
                            } else {
                                promotion_string = `has been added to the data base with the rank <@&${rank.id}> with (1/${rank.promo_points})`;
                            }
                            break
                        } else {
                            promotion_string = "needs to verify using rover!";
                        }
                    }
                } else {
                    if (!member.roles.cache.some(role => role.id === attende.rank_id)) {
                        let rankFound = false
                        for (const rank in guild_ranks) {
                            if (interaction.guild.roles.cache.find(role => role.id === rank.id + "")) {
                                for (const role of member.roles) {
                                    if (role.id === rank.id) {
                                        attende.rank_id = rank.id
                                        attende.promo_points = 0
                                        attende.save()
                                        rankFound = true
                                        break
                                    }
                                }
                            }
                            if (!rankFound) {
                                console.log(rank.rank_index)
                                attende.rank_id = guild_ranks[rank.rank_index].id
                            }
                        }
                        attende.save()
                        member.roles.add(attende.rank_id)
                    }
                    let attendeesRank = guild_ranks.find(role => role.id === attende.rank_id + "");
                    if (attendeesRank.is_officer == false && attendeesRank.rank_index + 1 < guild_ranks.length && guild_ranks[attendeesRank.rank_index + 1].is_officer == false) {
                        if (attende.promo_points + 1 >= guild_ranks[attendeesRank.rank_index + 1].promo_points) {
                            const old_rank_id = attende.rank_id
                            attende.rank_id = guild_ranks[attendeesRank.rank_index + 1].id
                            attende.promo_points = 0
                            attende.save()
                            member.roles.remove(old_rank_id)
                            member.roles.add(attende.rank_id)
                            promotion_string += ` <@&${old_rank_id}> -> <@&${attende.rank_id}> (0/${guild_ranks[attendeesRank.rank_index + 1].promo_points})`
                            
                        } else {
                            attende.promo_points += 1
                            attende.save()
                            promotion_string += `${attende.promo_points}/${guild_ranks[attendeesRank.rank_index + 1].promo_points} promo points`
                        }
                    } else {
                        promotion_string += "Thanks for attending (can not get promoted by attending events!)"
                    }

                }
                if (!promotion_string === "needs to verify using rover!") {
                    attende.total_events_attended += 1
                    attende.save()
                }
                string +=`\n${member.displayName}`
                event_log_embed.addFields({name: '\u200b', value: `<@${member.id}>: `+ promotion_string})
            }
            };
        attendees_fields.value = "Total attendees: " + total_event_attendes
        const promoter_role_id = "1109546594535211168" 
        string += `\nPing: <@&${promoter_role_id}>`
        //place rank up function here!
        //SEA Format
        const sea_format_channel = await interaction.guild.channels.cache.find(i => i.id === '1212085346464964659')
        if (log_channel_link) {
            sea_format_channel.send(`VVV${log_channel_link}VVV`)
        }
        sea_format_channel.send({content: `Division: ${division_name}\nLink: ${announcmentMessageLink} \nDate: ${date}\nScreenshot: \n`, files: [{attachment: wedge_picture.url}] });
        //event logs
        await interaction.guild.channels.cache.find(i => i.id === '1212085346464964659').send({content: `<@&${promoter_role_id}>`,embeds: [event_log_embed]})
        
        const success_embed = new EmbedBuilder().setColor([0,255,0]).setDescription("Event succesfully logged")
        await interaction.editReply({embeds: [success_embed]});

        }  
	},
};