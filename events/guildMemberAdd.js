const { Events } = require('discord.js');
const db = require('../dbObjects.js');
const noblox = require("noblox.js")

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(client) {
        const testServer = await client.guilds.cache.find(guild => guild.id == "831851819457052692")
        if (testServer) {
            const channel = await testServer.channels.fetch("1285158576448344064");
            channel.send("[guildMemberAdd]")
        }
        const guild = arguments[0].guild
        const rounding = await db.Settings.findOne({ where: { guild_id: guild.id, type: "membercountrounding" } }) ? parseInt( await db.Settings.findOne({ where: { guild_id: guild.id, type: "membercountrounding" } }).config) : 1
        let channel = await db.Channels.findOne({where: {guild_id: guild.id, type: 'guildMemberCount'}})
        if (channel) {
            guild.channels.cache.get(channel.channel_id).setName(`Member Count: ${math.floor(guild.memberCount / rounding) * rounding}`)
        } else {
            return
        }

        
        channel = await db.Channels.findOne({where: {guild_id: guild.id, type: 'robloxGroupCount'}})
        if (channel) {
            db.Servers.findOne({where: {guild_id: guild.id}}).then(server => {
                if (server) {
                    noblox.getGroup(server.group_id).then(group => {
                        guild.channels.cache.get(channel.channel_id).setName(`Members in group: ${Math.floor(group.memberCount / rounding) * rounding}`)
                    })
                } else {
                    guild.channels.cache.get(channel.channel_id).setName(`group not linked. please link a group with /setup`)
                }
            })
        } else {
            return
        }
    }
};