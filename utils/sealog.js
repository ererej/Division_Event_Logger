const { EmbedBuilder } = require('@discordjs/builders');
const cheerio = require('cheerio');
const { MessageFlags } = require('discord.js');
module.exports = async ( interaction, db, wedge_picture, announcemntMessage, eventType, numberOfAttendees) => {
    const codeblock = (await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "makesealogcodeblock"}})) ? "```" : ""
    

    const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })


    let format = codeblock + `Division: ${server ? server.name : interaction.guild.name} \n`
    format += `Link to Event: https://discord.com/channels/${interaction.guild.id}/${announcemntMessage.channelId}/${announcemntMessage.id} \n`
    //time of event
    
    let eventStartTime 
    if (announcemntMessage.content.toLowerCase().includes("minutes ") || announcemntMessage.content.toLowerCase().includes("minutes\n") || announcemntMessage.content.toLowerCase().includes("minutes") || announcemntMessage.content.toLowerCase().includes("min ") || announcemntMessage.content.toLowerCase().includes("min\n") || announcemntMessage.content.toLowerCase().includes("min")) {
        let words = announcemntMessage.content.toLowerCase().replace("\n", " ").split(" ")

        const indexOfTime = words.findIndex(word => /\b(min|minutes)\b/.test(word)) - 1
        if (indexOfTime >= 0) {
            const timeofset = parseInt(words[indexOfTime])
            if (!isNaN(timeofset)) {
                eventStartTime = new Date(announcemntMessage.createdTimestamp + parseInt(words[indexOfTime], 10) * 60 * 1000)
            } else {
                eventStartTime = new Date(announcemntMessage.createdTimestamp)
            }
            if (timeofset < 0) {
                interaction.followUp("<@386838167506124800> Time traveler detected!")
            }
        } else if (words.filter(word => /\b\d+(min|minutes)/.test(word)).length > 0) {
            const timeSubString = words.filter(word => /\b\d+(min|minutes)/.test(word))[0]
            const time = parseInt(timeSubString.match(/\d+/)[0], 10)
            eventStartTime = new Date(announcemntMessage.createdTimestamp + time * 60 * 1000)

        } else {
            eventStartTime = new Date(announcemntMessage.createdTimestamp)
        }
    } else if (/^.*<t:\d+:(t|T|d|D|f|F|R)>.*$/.test(announcemntMessage.content)) { // adds support for time stamps
        console.log("time stammmmmmp")
        const timeString = announcemntMessage.content.match(/^.*<t:\d+:(t|T|d|D|f|F|R)>.*$/)[0]
        const time = timeString.match(/<t:\d+:(t|T|d|D|f|F|R)>$/)[0]
        eventStartTime = new Date(parseInt(time.slice(3, -3)) * 1000)
    } else {
        eventStartTime = new Date(announcemntMessage.createdTimestamp)
    } 

    format += "Date: DD/MM/YYYY \n".replace("DD", eventStartTime.getDate()).replace("MM", eventStartTime.getMonth()+1).replace("YYYY", eventStartTime.getFullYear())
    
    if (eventType === "training" || eventType === "tryout") {
        let mapName;
        const gamelink = announcemntMessage.content.split(/( |\n)/).find(substring => substring.startsWith("https://www.roblox.com/share?code=") || substring.startsWith("https://www.roblox.com/games/"))
        if (gamelink) {
                
            
            //get the map name
            async function fetchMetadata(url) {
                try {
                    const fetch = (await import('node-fetch')).default;
                    const response = await fetch(url);
                    const body = await response.text();
                    const $ = cheerio.load(body);

                    const metadata = {
                    title: $('meta[property="og:title"]').attr('content') || $('title').text(),
                    description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
                    image: $('meta[property="og:image"]').attr('content'),
                    url: $('meta[property="og:url"]').attr('content') || url
                    };
                    return metadata;
                } catch (error) {
                    console.error('Error fetching metadata:', error);
                    return null;
                }
            }

            
            const metadata = await fetchMetadata(gamelink)
            if (metadata) {
                mapName = metadata.description.split('Check out ')[1];
                mapName = mapName.split('.')[0]
            } 
        }

        if (!mapName || mapName.trim() === "Battle Universe") {
            const collectorFilter = response => {
                return response.author.id === interaction.member.id;
            };
            
            const followUpAskingForMapName = await interaction.followUp({ content: "Failed to figure out what map the event was on. Please send the name of the map below.", fetchReply: true })
            
            try {
                const collected = await interaction.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300_000, errors: ['time'] });
                mapName = collected.first().content;
                switch (mapName.toLowerCase()) {
                    case "holo":
                        mapName = "Holographic Training Facility"
                        break;
                    case "tb3":
                        mapName = "Trident Battlegrounds III"
                        break;
                    case "bermuda":
                        mapName = "Bermuda Air Base"
                        break;
                    case "tb2":
                        mapName = "Trident Battlegrounds 2"
                        break;
                }
                collected.first().delete()
                followUpAskingForMapName.delete()
            } catch (error) {
                interaction.followUp('The map name was not provided, aborting the SEA log!');
                return false
            }
        }

        // add in when bases are added
        //const base = await db.bases.findOne({ where: { guild_id: announcemntMessage.guild.id, name: mapName } })
        
        const now = new Date()
        let durationInMinutes = Math.ceil((now.getTime() - eventStartTime.getTime()) / 1000 / 60)
        if (durationInMinutes > 120) {
            const collectorFilter = response => {
                return response.author.id === interaction.member.id && !isNaN(response.content.replace(/(minutes|min)/, "")) && parseInt(response.content.replace(/(minutes|min)/, "")) > 0;
            };
            
            const followUpAskingForTime = await interaction.followUp({ embeds: [new EmbedBuilder().setDescription("I suspect that this event was not logged right as the event ended. Please type an estimation of how long the event was in minutes below.").setColor([255,255,0])], fetchReply: true })
            
            try {
                const collected = await interaction.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300_000, errors: ['time'] });
                durationInMinutes = collected.first().content.replace(/(minutes|min)/, "");
                collected.first().delete()
                followUpAskingForTime.delete()
            } catch (error) {
                interaction.followUp( { embeds: [new EmbedBuilder().setDescription('The duration of the event was not provided, aborting the SEA log!').setColor([255,0,0])] });
                return false
            }
        }

        format += `Duration: ${durationInMinutes} Minutes \n`
        if (eventType === "tryout") {
            format += `Attendee Count: ${numberOfAttendees} \n`
        } else {
            format += `5+ Attendees?: ${numberOfAttendees >= 5 ? "5+" : "No"} \n`
        }
        format += `Map Name: ${mapName} \n`
        format += `Base: ${/*base ? "Yes" :*/ "No"} \n`
    } else {
        format += `5+ Attendees?: ${numberOfAttendees >= 5 ? "5+" : "No"} \n`
    }


    format += "Screenshot of Event: " + codeblock

    const dbLogChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "sealogs" } })
    if (dbLogChannel) {
        const logChannel = interaction.guild.channels.cache.get(dbLogChannel.channel_id)
        if (logChannel) {
            let logChannelLink;
            switch (eventType) {
                case "training":
                    logChannelLink = "<#1085337363359731782>"
                    break;
                case "patrol":
                    logChannelLink = "<#1085337383618236457>"
                    break;
                case "tryout":
                    logChannelLink = "<#1085337402329022574>"
                    break;
            }
            if (logChannelLink) {
                logChannel.send(`VVV ${logChannelLink} VVV`)
            }
            return logChannel.send({ content: format, files: [{ attachment: wedge_picture.url, name: 'wedge.png'}] })
        }
    }
    
    const log = interaction.channel.send({ content: format, files: [{ attachment: wedge_picture.url, name: 'wedge.png'}] })
    interaction.channel.send({ content: "You can make the format be sent to a specific channel by running the /linkchannel command and setting the type to sealog!", flags: MessageFlags.Ephemeral })
    return log
    
}



// https://www.roblox.com/games/9559929713/Trident-Battlegrounds-III?privateServerLinkCode=99137534053693667377594524231257

// https://www.roblox.com/games/12983079028/Bermuda-Air-Base?privateServerLinkCode=91212968187759310878090593628036

// https://www.roblox.com/share?code=754a157211a0eb44aaabc329e55dc8c0&type=Server


/* TRAINING LOGGING TEMPLATE

Division: (Name)
Link to Event: (Message link leading to the host message in the division)
Date: (MM/DD/YY)
Duration: (Estimate)
5+ Attendees?: ("5+" or "No" - Exclude host(s))
Map Name: (HOLO, Division Map Name, etc.)
Base: (Is it on one of your division's maps? Yes/No)
Screenshot of Event: (In-Game with all attendees visible)


// OLD TRAINING LOGGING TEMPLATE
Division: (Name)
Link to Event: (Message link leading to the host message in the division)
Date: (MM/DD/YY)
Duration: (Estimate)
Attendee Count: (Exclude host(s))
Map Name: (HOLO, Division Map Name, etc.)
Base: (Is it on one of your division's maps? Yes/No)
Screenshot of Event: (In-Game with all attendees visible)

*/



/* PATROL
Division: (Name)
Link to Event: (Message link leading to the host message in the division)
Date: (MM/DD/YY)
5+ Attendees?: ("5+" or "No" - Exclude host(s))
Screenshot of Event: (In-Game with all attendees visible)



// OLD PATROL LOGGING TEMPLATE
Division: (Name)
Link to Event: (Message link leading to the host message in the division)
Date: (MM/DD/YY)
Attendee Count: (Exclude Host)
Screenshot of Event: (In-Game with all attendees visible)
*/

/* TRYOUT
Division: (Name)
Link to Event: (Message link leading to the host message in the division)
Date: (MM/DD/YY)
Duration: (Estimate)
Attendee Count: (Exclude host(s))
Map Name: (HOLO, Division Map Name, etc.)
Base: (Is it on one of your division's maps? Yes/No)
Screenshot of Event: (In-Game with all attendees visible)


// OLD TRYOUT LOGGING TEMPLATE
Division: (Name)
Link to Event: (Message link leading to the host message in the division)
Date: (MM/DD/YY)
Duration: (Estimate)
Attendee Count: (Exclude host(s))
Map Name: (HOLO, Division Map Name, etc.)
Base: (Is it on one of your division's maps? Yes/No)
Screenshot of Event: (In-Game with all attendees visible)
*/