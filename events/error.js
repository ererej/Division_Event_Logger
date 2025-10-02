const { Events, ActivityType, ChannelType } = require('discord.js');

module.exports = {
    name: Events.Error,

    /**
     * @param {import('discord.js').error} error
     * 
    **/

    async execute(error) {
        console.error("An error occurred:", error);
    }
}