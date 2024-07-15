const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects")

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
		const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!is_officer && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions! You need to have an officer rank to use this command! Tip for admins: link a role that all the officers have with </addrank:1255492216202461256> and put officer to true!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
        const announcmentMessageLink = interaction.options.getString('announcemnt_link')
        let regex = /https:\/\/discord\.com\/channels\/([0-9]+(\/[0-9]+)+)/i
        if (!regex.test(announcmentMessageLink)) return await interaction.editReply({ content: 'The link you provided is not a valid discord message link!' });
        let announcmentChannel = await interaction.guild.channels.cache.find(i => i.id === announcmentMessageLink.split("/")[5])
        if (!announcmentChannel) return await interaction.editReply({ content: 'The link you provided looks to refer to a message in anouther discord server and will there for not work.' });
        
        const announcmentMessage = await announcmentChannel.messages.fetch(announcmentMessageLink.split("/")[6])
        if (!announcmentMessage) return await interaction.editReply({ content: 'could not locate the message please dubble check your message link!' });
        
        const time = announcmentMessage.createdAt
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`
        const wedge_picture = interaction.options.getAttachment('wedge_picture').url
        const dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "sealogs" } })
        if (!dbChannel) {
            return await interaction.editReply({ content: 'There is no sealog channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>', ephemeral: true });
        }
        const sea_format_channel = await interaction.guild.channels.fetch(dbChannel.channel_id)
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        const division_name = server ? server.name : interaction.guild.name
        await sea_format_channel.send({content: `Division: ${division_name}\nLink: ${announcmentMessageLink} \nDate: ${date}\nScreenshot: `, files: [{ attachment: wedge_picture, name: 'wedge.png'}]});
        const embedReply = new EmbedBuilder()
        .setColor([0,255,0])
        .setDescription("format succesfully logged!")
        interaction.editReply({ embeds: [embedReply]})
            .then(() => { setTimeout(() => { interaction.deleteReply() }, 5000)})
}}}