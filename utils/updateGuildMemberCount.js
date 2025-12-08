module.exports = async ({ guild, db, interaction, channel, dbChannel, rounding }) => {
    if (!guild) {
        if (!interaction) {
            console.error("No interaction or guild object provided in updateGuildMemberCount.js")
            return
        }
        guild = interaction.guild
    }

    if (!channel) {
        if (!dbChannel) {
            if (!db) return console.error("No channel, db or dbChannel object provided in updateGuildMemberCount.js") 
            dbChannel = await db.Channels.findOne({ where: { guild_id: guild.id, type: "guildMemberCount" } })
        }
        if (!dbChannel) return

        channel = await guild.channels.fetch(dbChannel.channel_id).catch(err => {
            if (err.code == 10003) {
                dbChannel.destroy()
                return console.log("Channel not found, deleting from database. guild: " + guild.id)
            }
            console.error("Error fetching channel in updateGuildMemberCount.js: " + err + "\nGuild: " + guild.id + "\nChannel: " + dbChannel.channel_id)
            return
        })
    }

    if (!rounding) {
        if (!db) console.error("No db or rounding object provided in updateGuildMemberCount.js") 
        rounding = await db.Settings.findOne({ where: { guild_id: guild.id, type: "membercountrounding" } }) ?? {config: "1"}
    }
    const now = new Date()
    const christmas = now.getMonth() === 11
    channel.setName(`${christmas ? "🎅" : ""} Member Count: ${Math.floor(guild.memberCount / parseInt(rounding.config)) * parseInt(rounding.config)}`)
    return
}