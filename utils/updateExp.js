const getLinkedChannel = require('./getLinkedChannel.js')
module.exports = async (db, server, interaction, guild, automatic, client ) => {

    if (!guild) {
        if (interaction) {
            guild = interaction.guild
        }
    }
    if (!guild) {
        return "No guild found"
    }
    if (!client) {
        if (interaction) {
            client = interaction.client
        }
    }
    if (!client) {
        return "No client found"
    }
    
    const errorMessage = ""
    let vcExpDisplayChannel = await getLinkedChannel({interaction, db, query:{ guild_id: guild.id, type: "vcexpdisplay" }, guild})
    if (vcExpDisplayChannel.error) {
        errorMessage += vcExpDisplayChannel.message + "\n"
    } else { 
        vcExpDisplayChannel = vcExpDisplayChannel.channel
    }

    let expDisplayChannel = await getLinkedChannel({interaction, db, query:{ guild_id: guild.id, type: "expdisplay" }, guild})
    if (expDisplayChannel.error) {
        errorMessage += expDisplayChannel.message + "\n"
    } else {
        expDisplayChannel = expDisplayChannel.channel
    }

    let levelDisplayChannel = await getLinkedChannel({interaction, db, query:{ guild_id: guild.id, type: "vcleveldisplay" }, guild})
    if (levelDisplayChannel && levelDisplayChannel.error) {
        errorMessage += levelDisplayChannel.message + "\n"
    } else {
        levelDisplayChannel = levelDisplayChannel.channel
    }

    let vcSmallExpDisplayChannel = await getLinkedChannel({interaction, db, query:{ guild_id: guild.id, type: "vcsmallexpdisplay" }, guild})
    if (vcSmallExpDisplayChannel && vcSmallExpDisplayChannel.error) {
        errorMessage += vcSmallExpDisplayChannel.message + "\n"
    } else {
        vcSmallExpDisplayChannel = vcSmallExpDisplayChannel.channel
    }

    let vcexpandleveldisplayChannel = await getLinkedChannel({interaction, db, query:{ guild_id: guild.id, type: "vcexpandleveldisplay" }, guild})
    if (vcexpandleveldisplayChannel && vcexpandleveldisplayChannel.error) {
        errorMessage += vcexpandleveldisplayChannel.message + "\n"
    } else {
        vcexpandleveldisplayChannel = vcexpandleveldisplayChannel.channel
    }

    if (!expDisplayChannel && !vcExpDisplayChannel && !levelDisplayChannel && !vcSmallExpDisplayChannel && !vcexpandleveldisplayChannel) {
        if (automatic) return

        return errorMessage + 'There is no expdisplay channel linked! Please ask an admin to link one using </linkchannel:1246002135204626454>'
    }

    if (errorMessage) {
        return errorMessage
    }


    
    
    let divisions = await db.Servers.findAll();
    divisions = divisions.filter(d => d.guild_id !== "831851819457052692") // remove the test server form the list
    divisions = divisions.sort((a, b) => b.exp - a.exp)
    const guildsPosission = divisions.findIndex(g => g.guild_id === guild.id)

    const levels = [0, 500, 2000, 5500, 10000, 20000, 37500, 55000, 75000]

    let level = 0
    let i = 0
    while (levels[i]<server.exp) {
        i++
        level = i
    }
    const exp_needed = levels[level]
    const past_level_exp = levels[level-1]

    if (expDisplayChannel) {
        const procentage = Math.floor(((server.exp-past_level_exp)/(exp_needed-past_level_exp))*100)
        let new_message = `# __Level ${level}__\n`
        new_message += `**Position compared to other divs:** #${guildsPosission + 1}\n`
        const showOrHideOtherDivs = await db.Settings.findOne({ where: { guild_id: guild.id, type: "expdisplayshowotherdivs" } }) ? (await db.Settings.findOne({ where: { guild_id: guild.id, type: "expdisplayshowotherdivs" }})).config : "show"
        
        if (showOrHideOtherDivs != "hide") {
            new_message += `${divisions[guildsPosission - 1] ? `Division at #${guildsPosission}: ${divisions[guildsPosission - 1].name} with ${divisions[guildsPosission - 1].exp}EXP. ${divisions[guildsPosission -1].exp - server.exp}EXP needed to pass\n` : "" }${divisions[guildsPosission + 1] ?  `Division at #${guildsPosission + 2}: ${divisions[guildsPosission + 1].name} with ${divisions[guildsPosission + 1].exp}EXP\n` : "" }`
        }
        new_message += `**Total exp:** ${server.exp} / ${exp_needed} (${Math.floor((server.exp/exp_needed)*1000)/10}%)\n**Exp needed to level up:** ${exp_needed-server.exp}\n`
        new_message += "```ansi\nLevel [2;36m" + level + "[0m [[2;36m"
        for (let i=0;i<procentage/5;i++) {
            new_message += "▮"
        }
        new_message += "[0m[2;31m"
        for (let i=0;i<20-(procentage/5);i++) {
            new_message += "▯"
        }
        new_message += "[0m[2;30m[0m"
        new_message += `] level [2;31m${level + 1}[0m (${Math.floor(((server.exp-past_level_exp)/(exp_needed-past_level_exp))*1000)/10}%)`
        new_message += "\n```"

        // new_message += `\nLevel progress: [${"⭕".repeat(procentage/5-1 ? procentage/5-1 : 0)}${procentage/5-1 ? ":polar_bear:" : ""}${"❌".repeat(20-(procentage/5))}] (${Math.floor(((server.exp-past_level_exp)/(exp_needed-past_level_exp))*1000)/10}%)\n`

        const config = require('../config.json')
        let timezonefix = 0
        if (config.host === "Laptop") timezonefix = -2
        let time = new Date()
        const timezoneOfset = await db.Settings.findOne({ where: { guild_id: guild.id, type: "timezone" } }) ? (await db.Settings.findOne({ where: { guild_id: guild.id, type: "timezone" } })).config : 0
        time = new Date(time - time.getTimezoneOffset() * 60000 + (parseInt(timezoneOfset) + timezonefix) * 3600000)
        const dateFormat = await db.Settings.findOne({ where: { guild_id: guild.id, type: "dateformat" } }) ? (await db.Settings.findOne({ where: { guild_id: guild.id, type: "dateformat" } })).config : "DD/MM/YYYY"
        const date = dateFormat.replace("DD", time.getDate()).replace("MM", time.getMonth()+1).replace("YYYY", time.getFullYear()) + " " + time.getHours() + ":" + time.getMinutes()
        new_message += `\n-# Last ${automatic ? "***automaticly***" : ""} updated: ${date}`
         
        const messages = await expDisplayChannel.messages.fetch({ limit: 10, })
        let message = messages.find(m => m.author.id === client.user.id && m.embeds.length === 0)
        if (!message) {
            message = await expDisplayChannel.send("setting up exp display...")
        }
        message.edit({ content: new_message, embeds: [] }) 
    }


    if (vcExpDisplayChannel) {
        if (vcExpDisplayChannel.error) {
            interaction.followUp({ content: vcExpDisplayChannel.message, })
        } else {
            vcExpDisplayChannel.setName(`Exp: ${server.exp}/${exp_needed}`)
        }
    }

    if (levelDisplayChannel) {
        if (levelDisplayChannel.error) {
            interaction.followUp({ content: levelDisplayChannel.message, })
        } else {
            levelDisplayChannel.setName(`Level: ${level}`)
        }
    }

    if (vcSmallExpDisplayChannel) {
        if (vcSmallExpDisplayChannel.error) {
            interaction.followUp({ content: vcSmallExpDisplayChannel.message, })
        } else {
            vcSmallExpDisplayChannel.setName(`Current Exp: ${server.exp}`)
        }
    }

    if (vcexpandleveldisplayChannel) {
        if (vcexpandleveldisplayChannel.error) { 
            interaction.followUp({ content: vcexpandleveldisplayChannel.message, })
        } else {
            vcexpandleveldisplayChannel.setName(`Exp: ${server.exp} (lvl ${level})`)
        }
    }
}
