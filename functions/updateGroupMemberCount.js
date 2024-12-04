module.exports = async ({ noblox, guild, db, interaction, channel, dbChannel, group, groupId, rounding }) => {
    if (!guild) {
        if (!interaction) {
            return console.error("No interaction or guild object provided in updateGroupMemberCount.js")
            
        }
        guild = interaction.guild
    }
    
    if (!channel) {
        if (!dbChannel) {
            if (!db) return console.error("No db or dbChannel object provided in updateGroupMemberCount.js") 
            dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "robloxGroupCount" } })
        }
        if (!dbChannel) return
        
        channel = await guild.channels.fetch(dbChannel.channel_id)
        if (!channel) {
            console.log("Channel not found, deleting from database. guild: " + guild.id)
            return dbChannel.destroy()
        }
    }

    if (!noblox) {
        console.error("No noblox object provided in updateGroupMemberCount.js")
    }
    

    if (!rounding) {
        if (!db) return console.error("No db or rounding object provided in updateGroupMemberCount.js") 
        rounding = await db.Settings.findOne({ where: { guild_id: guild.id, type: "membercountrounding" } }) ?? "1"
    }

    if (!group) {
        if (!groupId) {
            const server = await db.Servers.findOne({ where: { guild_id: guild.id } })
            if (!server) {
                channel.setName(`🎅Group not linked. please link a group with /setup`)
                return false
            }
            groupId = server.group_id 
        } 
        group = await noblox.getGroup(groupId).catch(err => {
            console.error(err)
            channel.setName(`🎅Could not locate the roblox group with the id: ${groupId}`)
            return false
        })
    }

    

    channel.setName(`🎅Group Members: ${Math.floor(group.memberCount / parseInt(rounding)) * parseInt(rounding)}`)
}