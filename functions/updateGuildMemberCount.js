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
            dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "guildMemberCount" } })
        }
        if (!dbChannel) return

        channel = await guild.channels.fetch(dbChannel.channel_id)
        if (!channel) {
            console.log("Channel not found, deleting from database. guild: " + guild.id)
            return dbChannel.destroy()
        }
    }

    if (!rounding) {
        if (!db) console.error("No db or rounding object provided in updateGuildMemberCount.js") 
        rounding = await db.Settings.findOne({ where: { guild_id: guild.id, type: "membercountrounding" } }) ?? "1"
    }

    channel.setName(`⛄Member Count: ${Math.floor(guild.memberCount / parseInt(rounding)) * parseInt(rounding)}`)

}