const { Events } = require('discord.js');
const db = require('../dbObjects.js');
const noblox = require("noblox.js")

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
        /*const testServer = await client.guilds.cache.find(guild => guild.id == "831851819457052692")
        if (testServer) {
            const channel = await testServer.channels.fetch("1285158576448344064");
            channel.send("[guildMemberAdd]")
        }*/
        const guild = member.guild
        const rounding = await db.Settings.findOne({ where: { guild_id: guild.id, type: "membercountrounding" } }) ? parseInt( (await db.Settings.findOne({ where: { guild_id: guild.id, type: "membercountrounding" } })).config) : 1
        let channel = await db.Channels.findOne({where: {guild_id: guild.id, type: 'guildMemberCount'}})
        if (channel) {
            const discordChannel = guild.channels.cache.get(channel.channel_id)
            if (!discordChannel) {
                console.log("Channel not found, deleting from database. guild: " + guild.id)
                return await db.Channels.destroy({where: {guild_id: guild.id, type: 'robloxGroupCount'}})
            }
            guild.channels.cache.get(channel.channel_id).setName(`Member Count: ${Math.floor(guild.memberCount / rounding) * rounding}`)
        }
        

        
        channel = await db.Channels.findOne({where: {guild_id: guild.id, type: 'robloxGroupCount'}})
        if (channel) {
            const discordChannel = guild.channels.cache.get(channel.channel_id)
            if (!discordChannel) {
                console.log("Channel not found, deleting from database. guild: " + guild.id)
                return await db.Channels.destroy({where: {guild_id: guild.id, type: 'robloxGroupCount'}})
            }
            const server = await db.Servers.findOne({where: {guild_id: guild.id}})
                if (server) {
                    const group = noblox.getGroup(server.group_id) // make check that group is group :P
                    if (!group || !group.memberCount) discordChannel.setName(`could not fetch group! please run /setup again!`)
                    else discordChannel.setName(`Members in group: ${Math.floor(group.memberCount / rounding) * rounding}`)
                    
                } else {
                    discordChannel.setName(`group not linked. please link a group with /setup`)
                }
        }
    }
};
