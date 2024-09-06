module.exports = async (db, server, interaction) => {
    const dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplay" } })
    if (!dbChannel) {
        return await interaction.editReply({ content: 'There is no expdisplay channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>', ephemeral: true });
    }
    const channel = await interaction.guild.channels.fetch(dbChannel.channel_id)
    const messages = await channel.messages.fetch({ limit: 10, })
    let message = messages.find(m => m.author.id === interaction.client.user.id && m.embeds.length === 0)
    if (!message) {
        message = await channel.send("setting up exp display...")
    }
    
    let divisions = await db.Servers.findAll();
    divisions = divisions.sort((a, b) => b.exp - a.exp)
    const guildsPosission = divisions.findIndex(g => g.guild_id === interaction.guild.id)

    const levels = [0, 500, 2000, 5500, 10000, 20000, 37500, 55000, 75000]

    let level = 0
    let i = 0
    while (levels[i]<server.exp) {
        i++
        level = i
    }
    const exp_needed = levels[level]
    const past_level_exp = levels[level-1]


    const procentage = Math.floor(((server.exp-past_level_exp)/(exp_needed-past_level_exp))*100)
    let new_message = `# __Level ${level}__\n`
    new_message += `**Possition compared to other divs:** #${guildsPosission + 1}\n`
    const showOrHideOtherDivs = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplayshowotherdivs" } }) ? (await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplayshowotherdivs" }})).config : "show"
    
    if (showOrHideOtherDivs != "hide") {
        new_message += `${divisions[guildsPosission - 1] ? `Division at #${guildsPosission}: ${divisions[guildsPosission - 1].name} with ${divisions[guildsPosission - 1].exp}EXP. ${divisions[guildsPosission -1].exp - server.exp}EXP needed to pass\n` : "" }${divisions[guildsPosission + 1] ?  `Division at #${guildsPosission + 2}: ${divisions[guildsPosission + 1].name} with ${divisions[guildsPosission + 1].exp}EXP\n` : "" }`
    }
    new_message += `**Total exp:** ${server.exp} / ${exp_needed} (${Math.floor((server.exp/exp_needed)*1000)/10}%)\n**Exp needed to level up:** ${exp_needed-server.exp}\n`
    new_message += "```ansi\nLevel [2;36m" + level + "[0m [[2;36m"
    for (let i=0;i<procentage/5;i++) {
        new_message += "▮"
    }
    console.log("works this far")
    new_message += "[0m[2;31m"
    for (let i=0;i<20-(procentage/5);i++) {
        new_message += "▯"
    }
    new_message += "[0m[2;30m[0m"
    new_message += `] level [2;31m${level + 1}[0m (${Math.floor(((server.exp-past_level_exp)/(exp_needed-past_level_exp))*1000)/10}%)`
    new_message += "\n```"
    const config = require('./config.json')
    let timezonefix = 0
    if (config.host === "Laptop") timezonefix = -2
    let time = new Date()
    const timezoneOfset = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "timezone" } }) ? await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "timezone" } }) : 0
    time = new Date(time - time.getTimezoneOffset() * 60000 + (parseInt(timezoneOfset.config) + timezonefix) * 3600000)
    const dateFormat = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "dateformat" } }) ? await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "dateformat" } }) : "dd/mm/yyyy"
    const date = dateFormat.config.replace("DD", time.getDate()).replace("MM", time.getMonth()+1).replace("YYYY", time.getFullYear()) + " " + time.getHours() + ":" + time.getMinutes()
    console.log("time to edit message")
    new_message += `\n-# Last updated: ${date}`
    message.edit(new_message) 
}
