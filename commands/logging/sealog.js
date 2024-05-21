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
		if (!is_officer && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles && !PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
        const announcmentMessageLink = interaction.options.getString('announcemnt_link')
        let announcmentChannel;
        try {
            announcmentChannel = await interaction.guild.channels.cache.find(i => i.id === announcmentMessageLink.split("/")[5])
        const announcmentMessage = await announcmentChannel.messages.fetch(announcmentMessageLink.split("/")[6])
        
        const time = announcmentMessage.createdAt
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`
        const wedge_picture = interaction.options.getAttachment('wedge_picture').url
        let sea_format_channel;
        switch (interaction.guild.id) {
            case '1073682080380243998': //FAF
                sea_format_channel = await interaction.guild.channels.cache.find(i => i.id === '1241499412853817446')
                break;
            case '1104945580142231673':
                sea_format_channel = await interaction.guild.channels.cache.find(i => i.id === '1119307508457144464')
                break;
        }
        await sea_format_channel.send({content: `Division: ${interaction.guild.name}\nLink: ${announcmentMessageLink} \nDate: ${date}\nScreenshot: `, files: [{ attachment: wedge_picture, name: 'wedge.png'}]});
        const embedReply = new EmbedBuilder()
        .setColor([0,255,0])
        .setDescription("format succesfully logged!")
        interaction.editReply({ embeds: [embedReply]})
            .then(() => { setTimeout(() => { interaction.deleteReply() }, 5000)})
        } catch (error) {
            const embededError = new EmbedBuilder()
            .setColor([255,0,0])
            .setDescription("logging failed make sure the announcment message is in the same guild as where you started this interaction!")
            await interaction.editReply({ embeds: [embededError]})
        }
}}}