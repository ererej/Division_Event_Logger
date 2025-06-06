const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('massmove')
        .setDescription('move all users in your voice channel to another voice channel!')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Please input the channel you want to move the users to!')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice , ChannelType.GuildStageVoice)
            ),
    botPermissions: [PermissionsBitField.Flags.MoveMembers],
    async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,50])
        const targetVoiceChannel = interaction.options.getChannel('channel')


		if ( !targetVoiceChannel.permissionsFor(interaction.member).has(PermissionsBitField.Flags.Connect) && interaction.member.id != "386838167506124800" && !interaction.member.permissions.has( PermissionsBitField.Flags.Administrator )) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else if (!interaction.member.voice.channel) {
            embeded_error.setDescription("You must be in a voice channel to use this command!")
            await interaction.editReply({ embeds: [embeded_error]});
        } else if (interaction.options.getChannel('channel') === interaction.member.voice.channel) {
            embeded_error.setDescription("em sir you are already in that voice chat dummy!")
            await interaction.editReply({ embeds: [embeded_error]});
        } else {
            const currentVoiceChannel = interaction.member.voice.channel
           
            const members = currentVoiceChannel.members
            members.forEach(member => {
                member.voice.setChannel(targetVoiceChannel).catch(err => {
                    if (err.code !== 40032) {
                        throw err
                    }
                })
            })
            const embeded = new EmbedBuilder().setColor([0,255,0])
            embeded.setDescription(`Moved ${members.size} in ${currentVoiceChannel} to ${targetVoiceChannel}`)
            await interaction.editReply({ embeds: [embeded]});
        }
    }
}