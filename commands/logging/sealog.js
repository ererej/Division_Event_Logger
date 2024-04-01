const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sealog')
		.setDescription('create the sea logging format only!')
        .addAttachmentOption(option => 
            option.setName('wedge_picture')
                .setDescription('Paste in the wedge picture!')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('announcemnt_link')
                .setDescription('Add the link to the event announcemnt message here!')
                .setRequired(true)
        ),

	async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!interaction.member.roles.cache.some(role => role.id === '1212084406282358846') && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
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
        await interaction.guild.channels.cache.find(i => i.id === '1212085346464964659').send({content: `Division: ${interaction.guild.name}\nLink: ${announcmentMessageLink} \nDate: ${date}\nScreenshot: `, files: [{ attachment: wedge_picture, name: 'wedge.png'}]});
        const embedReply = new EmbedBuilder()
        .setColor([0,255,0])
        .setDescription("format succesfully logged!")
        interaction.editReply({ embeds: [embedReply]})
        } catch (error) {
            const embededError = new EmbedBuilder()
            .setColor([255,0,0])
            .setDescription("logging failed make sure the announcment message is in the same guild as where you started this interaction!")
            await interaction.editReply({ embeds: [embededError]})
        }
}}}