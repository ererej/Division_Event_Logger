const { Events, ChannelType } = require('discord.js');
const db = require('../dbObjects.js');
const noblox = require("noblox.js")

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(client) {
        const guild = arguments[0].guild
        db.Channels.findOne({where: {guild_id: guild.id, type: 'guildMemberCount'}}).then(channel => {
            if (channel) {
                guild.channels.cache.get(channel.channel_id).setName(`Member Count: ${guild.memberCount}`)
            } else {
                return
            }
        })
        
        db.Channels.findOne({where: {guild_id: guild.id, type: 'robloxGroupCount'}}).then(channel => {
            if (channel) {
                db.Servers.findOne({where: {guild_id: guild.id}}).then(server => {
                    if (server) {
                        noblox.getGroup(server.group_id).then(group => {
                            guild.channels.cache.get(channel.channel_id).setName(`Members in group: ${group.memberCount}`)
                        })
                    } else {
                        guild.channels.cache.get(channel.channel_id).setName(`group not linked. please link a group with /setup`)
                    }
                })
            } else {
                return
            }
        })
    }
};