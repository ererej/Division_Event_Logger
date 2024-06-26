const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(client) {
        client.guilds.cache.find(guild => guild.id === '831851819457052692').members.fetch().find(member => member.id === '386838167506124800').send(`Joined ${Event.guild.name}`)
    }
};