const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects")
const noblox = require("noblox.js")
const config = require('../../config.json')


const sealog = require('../../functions/sealog.js')
const validateMessageLink = require('../../functions/validateMessageLink.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sealog')
		.setDescription('create the sea logging format only!')
        .addStringOption(option => 
            option.setName('announcemnt_link')
                .setDescription('Add the link to the event announcemnt message here!')
                .setRequired(true)
        )
        .addAttachmentOption(option => 
            option.setName('wedge_picture')
                .setDescription('Paste in the wedge picture!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('event_type')
                .setDescription('What type of event was this?')
                .setRequired(true)
                .addChoices(
                    { name: 'training', value: 'training'},
                    { name: 'patrol', value: 'patrol'},
                    { name: 'tryout', value: 'tryout'},
                )
        ),

    /**
     *  @param {import('discord.js').CommandInteraction} interaction
     */

	async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])

        /* //temporarly disabled until offical launch of automatic promotions
        let user = await db.Users.findOne({ where: { user_id: interaction.member.id, guild_id: interaction.guild.id }})
        if (!user) {
            user = await db.Users.create({ user_id: interaction.member.id, guild_id: interaction.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
        }
        const updateRankResponce = await user.updateRank(noblox, (await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })).group_id, interaction.member)
        if (updateRankResponce && user.rank_id != null) {
            interaction.member.send({ content: "your rank was verifed and this was the responce: \n" + updateRankResponce })
        }
        if (user.rank_id === null) {
            user.destroy()
            return await interaction.editReply({ embeds: [embeded_error.setDescription("failed to verify your rank! due to: \n" + updateRankResponce)] })
        } */
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

		
		if (!is_officer/*!(await user.getRank()).is_officer*/ && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions! You need to have an officer rank to use this command! Tip for admins: link a role that all the officers have with </addrank:1255492216202461256> and put officer to true!")
            return await interaction.editReply({ embeds: [embeded_error]});
		}
        
        const announcmentmessage = await validateMessageLink(interaction, interaction.options.getString('announcemnt_link'))
        if (!announcmentmessage) return 

        let numberOfAttendees;
        if (interaction.options.getString('event_type') != 'patrol' ) {
            const collectorFilter = response => { return response.author.id === interaction.member.id && !isNaN(response.content)};
            await interaction.followUp({ content: "How many attendees did you get? DONT COUNT YOURSELF. awnser below.", fetchReply: true })
            
            try {
                const collected = await interaction.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300_000, errors: ['time'] });
                numberOfAttendees = parseInt(collected.first().content);
                collected.first().delete()
                interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Attendees successfully set to ${numberOfAttendees}!`).setColor([0,0,255])], content: ""})
            } catch (error) {
                return interaction.followUp('The number of attendees was not provided, aborting!');
            }
        }

        const responce = await sealog(interaction, db, interaction.options.getAttachment('wedge_picture'), announcmentmessage, interaction.options.getString('event_type'), numberOfAttendees)

        if (!responce) {
            return interaction.editReply({ embeds:  [embeded_error.setDescription('failed to generate the sea logging format!')] });
        }
        const embedReply = new EmbedBuilder()
        .setColor([0,255,0])
        .setDescription("format succesfully logged!")
        return interaction.editReply({ embeds: [embedReply], content: ""})
}}