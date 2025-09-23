module.exports = async ({interaction, db, query, guild}) => {
    const channelLink = await db.Channels.findOne({ where: query })
    if (!channelLink) {
        return {channel: null}
    }

    guild = guild || interaction.guild
    if (!guild) {
        return {error: true, message: 'no guild found! please provide a guild!'}
    }
    
    const channel = await guild.channels.fetch(channelLink.channel_id).catch(async (error) => {
        if (error.code === 10003) {
            await channelLink.destroy() 
            channelLink.save()
            console.log(`channelLink removed: ${channelLink.type} in ${guild.id} primary detection found that the channel was deleted`);
            return {error: true, code: "unknown channel", message: 'the channel the channelink was linked to seems to have been deleted! So ive gone ahead and deleted the link from the database!'}
        } else {
            console.log(error)
            return {error: true, message: error.message}
        }
    })
    if (!channel) {
        await channelLink.destroy()
        console.log(`channelLink removed: ${channelLink.channel_id} in ${guild.id} due to the channel not being found!`);
        return {error: true, message: 'the channel the channelink was linked to seems to have been deleted! So ive gone ahead and deleted the link from the database!'}
    }
    return { channel: channel }
}