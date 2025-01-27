module.exports = async (interaction, db, query) => {
    const channelLink = await db.Channels.findOne({ where: query })
    if (!channelLink) {
        return {channel: null}
    }
    
    const channel = await interaction.guild.channels.fetch(channelLink.channel_id).catch(async (error) => {
        if (error.code === 10003) {
            await channelLink.destroy() 
            channelLink.save()
            console.log(`channelLink removed: ${channelLink.type} in ${interaction.guild.id} primary detection found that the channel was deleted`);
            return {error: true, code: "unknown channel", message: 'the channel the channelink was linked to seems to have been deleted! So ive gone ahead and deleted the link from the database!'}
        } else {
            console.log(error)
            return {error: true, message: error.message}
        }
    })
    if (!channel) {
        await channelLink.destroy()
        console.log(`channelLink removed: ${channelLink.channel_id} in ${interaction.guild.id} due to the channel not being found!`);
        return {error: true, message: 'the channel the channelink was linked to seems to have been deleted! So ive gone ahead and deleted the link from the database!'}
    }
    return { channel: channel }
}