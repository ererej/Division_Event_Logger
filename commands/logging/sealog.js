const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects")
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)

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
        ),

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
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
        const announcmentMessageLink = interaction.options.getString('announcemnt_link')
        const regex = /^https:\/\/(discord|discordapp)\.com\/channels\/\d+\/\d+\/\d+$/;
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
            return await interaction.editReply({ content: 'could not locate the message please dubble check your message link!' });
        }
        
        const time = announcmentMessage.createdAt
        const dateFormat = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "dateformat" } }) ? (await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "dateformat" } })).config : "DD/MM/YYYY"
        const date = dateFormat.replace("DD", time.getDate()).replace("MM", time.getMonth()+1).replace("YYYY", time.getFullYear())
        
        
        const wedge_picture = interaction.options.getAttachment('wedge_picture').url
        const dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "sealogs" } })

        const sea_format_channel = dbChannel ? await interaction.guild.channels.fetch(dbChannel.channel_id) : interaction.channel
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        const division_name = server ? server.name : interaction.guild.name


        const codeblockSetting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "makesealogcodeblock" } })

        const codeblock =  codeblockSetting ? ( codeblockSetting.config === "codeblock" ? "```" : "" ) : "" 

        await sea_format_channel.send({content: codeblock + `Division: ${division_name}\nLink: ${announcmentMessageLink} \nDate: ${date}\nScreenshot:` + codeblock, files: [{ attachment: wedge_picture, name: 'wedge.png'}]});
        if (!dbChannel) {
            return await interaction.editReply({ content: 'you can make the format always get posted in a specific channel with </linkchannel:1246002135204626454>', ephemeral: true });
        }
        const embedReply = new EmbedBuilder()
        .setColor([0,255,0])
        .setDescription("format succesfully logged!")
        interaction.editReply({ embeds: [embedReply]})
            .then(() => { setTimeout(() => { interaction.deleteReply() }, 5000)})
}}}