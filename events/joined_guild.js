const { Events } = require('discord.js');
const db = require("../dbObjects")

module.exports = {
	name: Events.guildCreate,
	once: true,
	async execute(client) {
		console.log(`joined a new guild: ${Event.guild.id}`);
        const guild = await db.Servers.findOne({ where: { guild_id: }})
    },

};