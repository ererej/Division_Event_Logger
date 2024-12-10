module.exports = async (interaction, db, query) => {
    const channelLink = await db.Channels.findOne({ where: query })
    if (!channelLink) {
        return null
    }
    const channel = await interaction.guild.channels.fetch(channelLink.channel_id)
    if (!channel) {
        await channelLink.destroy()
        console.log(`channelLink removed: ${channelLink.type} in ${interaction.guild.id}`)
        return {error: true, message: 'the channel the channelink was linked to seems to have been deleted! So ive gone ahead and deleted the link from the database!'}
    }
    return channel
}