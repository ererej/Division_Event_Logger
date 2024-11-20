module.exports = async (interaction, messageLink) => {
    const regex = /^https:\/\/(discord|discordapp)\.com\/channels\/\d+\/\d+\/\d+$/;
    if (!regex.test(messageLink)) {
        interaction.editReply({ content: 'The link you provided is not a valid discord message link!' });
        return false;
    }
    let announcmentChannel;
    try {
        announcmentChannel = await interaction.guild.channels.cache.find(i => i.id === messageLink.split("/")[5])
    } catch (error) {
        interaction.editReply({ content: 'The link you provided looks to refer to a message in anouther discord server and will there for not work.' });
        return false;
    }

    try {
        const message = await announcmentChannel.messages.fetch(messageLink.split("/")[6])
        return message
    } catch (error) {
        interaction.editReply({ content: 'could not locate the message please dubble check your message link!' });
        return false;
    }
}