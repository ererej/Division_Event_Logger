const noblox = require("noblox.js")
module.exports = async ({guild, db, interaction, channel, dbChannel, group, groupId, rounding }) => {
    if (!guild) {
        if (!interaction) {
            console.error("No interaction or guild object provided in updateGroupMemberCount.js")
            return
        }
        guild = interaction.guild
    }
    
    if (!channel) {
        if (!dbChannel) {
            if (!db) { console.error("No db or dbChannel object provided in updateGroupMemberCount.js"); return; }
            dbChannel = await db.Channels.findOne({ where: { guild_id: guild.id, type: "robloxGroupCount" } })
        }
        if (!dbChannel) return
        channel = await guild.channels.fetch(dbChannel.channel_id).catch(err => {
            if (err.code == 10003) {
                dbChannel.destroy()
                return console.log("groupMemberCount Channel not found, deleting from database. guild: " + guild.id)
            }
            console.error("Error fetching channel in updateGroupMemberCount.js: " + err + "\nGuild: " + guild.id + "\nChannel: " + dbChannel.channel_id)
            return
        })
        if (!channel) {
            return false
        }
    }

    

    if (!rounding) {
        if (!db) { console.error("No db or rounding object provided in updateGroupMemberCount.js"); return; }
        rounding = await db.Settings.findOne({ where: { guild_id: guild.id, type: "membercountrounding" } }) ?? {config: "1"}
    }

    if (!group) {
        if (!groupId) {
            const server = await db.Servers.findOne({ where: { guild_id: guild.id } })
            if (!server) {
                channel.setName(`⚠Group not linked. please link a group with /setup`)
                return false
            }
            groupId = server.group_id 
        } 
        group = await noblox.getGroup(groupId).catch(err => {
            console.error(err)
            channel.setName(`⚠Could not locate the roblox group with the id: ${groupId}`)
            return false
        })
    }
    const now = new Date()
    const christmas = now.getMonth() === 11

    channel.setName(`${christmas ? "🤶" : ""} Group Members: ${Math.floor(group.memberCount / parseInt(rounding.config)) * parseInt(rounding.config)}`)
    return true
}