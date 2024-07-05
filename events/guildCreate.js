const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(client) {
        const guild = arguments[0].guild
        let channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
		guild.invites.create(channels.first().id).then(invite => console.log(`[GUILD JOIN] ${guild.name} which has  ${guild.memberCount} members! Invite:  https://discord.gg/` + invite.code))
        client.user.setPresence({ activities: [{ name: client.guilds.cache.size + " divisions", type: ActivityType.Watching}], status: 'online' });
    }
};