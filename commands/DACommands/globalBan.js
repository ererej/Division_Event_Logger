const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageMentions } = require('discord.js');
const db = require("../../dbObjects.js")
const getLinkedChannel = require('../../utils/getLinkedChannel.js');
const { Op } = require("sequelize");

module.exports = {
	data: new SlashCommandBuilder()
        .setName('globalban')
        .setDescription('Ban user(s) from all offical SEA divs that has this bot!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('users')
                .setDescription('seperate the users with ","!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('why are these users getting banned?')
        ),
    botPermissions: [PermissionsBitField.Flags.BanMembers],
    async execute(interaction) {
        await interaction.deferReply()

        if (interaction.user.id != "386838167506124800") {
            return interaction.editReply("this command is disabled for now!")
        }

        const banReason = interaction.options.getString('reason') || "SEA banned by " + interaction.user.tag + " (" + interaction.user.id + ")!"

        const banlogsChannel = await getLinkedChannel(interaction, db, { guild_id: interaction.guild.id, type: "banlogs" })

        let UserIDs = interaction.options.getString('users').split(',')
        if (UserIDs.length < 1) {
            UserIDs = interaction.options.getString('users').split('\n')
        } 
        if (UserIDs.length < 1) {
            UserIDs = interaction.options.getString('users').split(' ')
        }
        if (UserIDs.length < 1) {
            UserIDs = interaction.options.getString('users').split(' ')
        }
        UserIDs = UserIDs.map(id => id.trim())

        UserIDs = UserIDs.filter(id => id.length > 0)

        let bancount = 0
        let failedBans = 0
        let replyString = ""
        

        let banData = {}

        const groupId = 2648601
        const allysFetch = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/relationships/${"Allies"}?` + new URLSearchParams({MaxRows: 1000, StartRowIndex: 0}), {
            method: 'GET',
            

        })
        const allysJson = await allysFetch.json()
        
        const enemysFetch = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/relationships/${"enemies"}?` + new URLSearchParams({MaxRows: 1000, StartRowIndex: 0}), {
            method: 'GET',
        })
        const enemysJson = await enemysFetch.json()
        const enemys = enemysJson.relatedGroups
        const allys = allysJson.relatedGroups

        let officalDivisions = allys.concat(enemys)

        let officalDivisionServers = await db.Servers.findAll()
        
        const officalDivisionsIds = officalDivisions.map(division => division.id)
        

        officalDivisionServers = officalDivisionServers.filter(server => {
            return officalDivisionsIds.includes(server.group_id)
        })

        const officalDivisionsWithoutBot = officalDivisions.filter(division => {
            return !officalDivisionServers.some(server => server.group_id == division.id)
        })


        // const servers = (await db.Servers.findAll()).filter(server => {
        //     return ["1073682080380243998", "1104945580142231673"].includes(server.guild_id)
        // })

        const servers = officalDivisionServers


        let serversProcessed = 0
        for (const server of servers) {
            const guild = interaction.client.guilds.cache.get(server.guild_id)
            if (!guild) {
                continue
            }
            const guildBans = await guild.bans.fetch()
            let bannedUsers = []
            guildBans.forEach(ban => {
                bannedUsers.push(ban.user.id)
            })

            let everyOther = 0

            const serversBanlogsChannel = await getLinkedChannel(interaction, db, { guild_id: server.guild_id, type: "banlogs" }, guild)
            banData[server.name] = {}
            let i = 0;
            for (const userId of UserIDs) {
                const usersBanData = {alreadyBanned: false, banned: false, failed: false, failReason: "", notInServer: false}
                try {
                    if (everyOther % 4 == 0) {  
                        interaction.editReply(`[${server.name}]\n[${"💙".repeat(serversProcessed) + "🖤".repeat(officalDivisionServers.length - serversProcessed)}]\n\n[${"💙".repeat(i + 1)}${"🖤".repeat(UserIDs.length - (i + 1))}]`)
                    }
                    everyOther++
                    i++
                    if (!bannedUsers.includes(userId)) {
                        try {
                        
                            await guild.bans.create(userId, {
                                reason: banReason,
                            })
                            
                            usersBanData.banned = true
                            bancount++
                            if (banlogsChannel.channel) { 
                                await serversBanlogsChannel.channel.send({
                                    content: `:ballot_box_with_check: <@${userId}> has been banned by <@${interaction.user.id}>!`, 
                                    allowedMentions: {parse: [MessageMentions.NONE]}
                                })
                            }
                        } catch(err) {
                            usersBanData.failed = true
                            usersBanData.failReason = ` ❌ **failed to ban <@${userId}> (${userId}) in ${server.name}! Error received: ${err.name}  ${err.message}**\n`
                            failedBans++
                        }
                    } else {
                        usersBanData.alreadyBanned = true
                    }
                } catch(err)  {
                    // usersBanData.failed = true
                    // usersBanData.failReason = `❌**failed to ban <@${userId}> (${userId}) in ${server.name}! Error received: ${err.name}  ${err.message}**\n`
                    // failedBans++
                }
                banData[server.name][userId] = usersBanData
            }
            serversProcessed++
        }

        await interaction.editReply("done processing all servers!")
        // console.log(banData)


        // Log all the fail reasons for all the users where it fails
        for (const [server, users] of Object.entries(banData)) {
            for (const [userId, user] of Object.entries(users)) {
            if (user.failed) {
                console.error(`Failed to ban user ${userId} in server ${server}: ${user.failReason}`);
            }
            }
        }

        replyString += `**${bancount} bans served!**\n`
        if (failedBans > 0) {
            replyString += `***failed to ban ${failedBans} users!***\n`
        }
        

        const fullyAlreadyBanned = Object.fromEntries(
            Object.entries(banData).filter(([server, users]) => {
                return Object.values(users).every(user => {
                return user.alreadyBanned
                })
            })
        )


        if (Object.keys(fullyAlreadyBanned).length > 0) {
            replyString += `\n\n# ***Already Banned in:***\n`
            replyString += "```" + Object.keys(fullyAlreadyBanned).join(", ") + "```"
        }

        const fullyBanned = Object.fromEntries(
            Object.entries(banData).filter(([server, users]) => {
                return (!fullyAlreadyBanned || !fullyAlreadyBanned[server]) && Object.values(users).every(user => {
                    return user.banned || user.alreadyBanned
                })
            })
        )
        console.log(fullyBanned)

        if (Object.keys(fullyBanned).length > 0) {
            replyString += `\n\n# ***Banned in:***\n`
            replyString += "```" + Object.keys(fullyBanned).join(", ") + "```"
        }

        const fullyFailed = Object.fromEntries(
            Object.entries(banData).filter(([server, users]) => {
                return (!fullyAlreadyBanned || !fullyAlreadyBanned[server]) && Object.values(users).every(user => {
                    return user.failed
                })
            })
        )

        if (Object.keys(fullyFailed).length > 0) {
            replyString += `\n\n# ***Failed to ban in:***\n`
            replyString += "```" + Object.keys(fullyFailed).map(failed => fullyFailed.name + " (" + failed.failReason + ")").join(", ") + "```"
        }

        const partiallyBanned = Object.fromEntries(
            Object.entries(banData).filter(([server, users]) => {
                return !fullyAlreadyBanned[server] && !fullyBanned[server] && !fullyFailed[server]
            })
        )


        if (Object.keys(partiallyBanned).length > 0) {
            replyString += `\n\n# ***Partially Banned in:***\n`
            for (const server in banData) {
                const users = Object.fromEntries(
                    Object.entries(banData[server]).filter(([userId, user]) => user.failed === true) 
                )
                if (Object.keys(users).length > 0) {
                    replyString += `\nFailed in **${server}**:\n`
                    replyString += "```" + Object.entries(users).map(([userId, user]) => `<@${userId}>(${userId}) (error: ${user.failReason || "No error reason provided"})`).join(",\n ") + "```"
                }
            }
        }

        replyString += `\n\n# ***Divisions without the bot:***\n`
        replyString += "```" + officalDivisionsWithoutBot.map(division => division.name).join(", ") + "```"


        if (replyString.length <= 2000) {
            await interaction.editReply(replyString)
        } else {
            interaction.editReply('# ***banning users:***')
            let subStrings = replyString.split("\n")
            let tempstring = ""
            for (i=0; i < subStrings.length; i++){
                if ((tempstring + subStrings[i]).length >= 2000) {
                    interaction.channel.send(tempstring)
                    tempstring = subStrings[i] + "\n"
                } else {
                    tempstring += subStrings[i] + "\n"
                }
            }

            interaction.channel.send(tempstring)
        }

    }
}