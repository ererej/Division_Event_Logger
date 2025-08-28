const { EmbedBuilder } = require("@discordjs/builders");

/**
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {string} messageLink
 * @returns {Promise<{message: import('discord.js').Message, channel: import('discord.js').TextChannel} | {error: string}>}
 */
module.exports = async (interaction, messageLink) => {
    const regex = /^https:\/\/(discord|discordapp|ptb\.discord|canary\.discord)\.com\/channels\/\d+\/\d+\/\d+$/;
    if (!regex.test(messageLink)) {
        return { error: "The link you provided is not a valid discord message link!" };
    }
    let messages_channel;
    try {
        messages_channel = interaction.guild.channels.cache.find(i => i.id === messageLink.split("/")[5])
    } catch (error) {
        return { error: "The link you provided looks to refer to a message in anouther discord server and will there for not work." };
    }

    try {
        const message = await messages_channel.messages.fetch(messageLink.split("/")[6])
        return {message: message, channel: messages_channel}; 
    } catch (error) {
        return { error: "Could not locate the message please double check your message link!" };
    }
}