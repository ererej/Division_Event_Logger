const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageMentions } = require('discord.js');
const db = require("../../dbObjects.js")
const getLinkedChannel = require('../../utils/getLinkedChannel.js');
module.exports = {
	data: new SlashCommandBuilder()
        .setName('unmassban')
        .setDescription('unban multiple users at once!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('users')
                .setDescription('Separate the users with anything you want! Yes anything! new lines, spaces, commas, a poem etc!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('why are these users getting unbanned?')
        ),
    botPermissions: [PermissionsBitField.Flags.BanMembers],
    async execute(interaction) {
        await interaction.deferReply()

        const banlogsChannel = await getLinkedChannel({interaction, db, query:{ guild_id: interaction.guild.id, type: "banlogs" }, guild: interaction.guild})
        
        // let userIds = interaction.options.getString('users').replace('\n', ',').replace(" ", ',').replace('    ', ',').replace(' ', ",").replace('\t', ',').split(',')

        let userIds = []
        let tempstring = ""
        for (let i = 0; i < interaction.options.getString('users').length; i++) {
            const char = interaction.options.getString('users')[i]
            if (char.match(/[0-9]/)) {
                tempstring += char
            } else {
                if (tempstring.length > 0) {
                    userIds.push(tempstring)
                    tempstring = ""
                }
            }
        }
        if (tempstring.length > 0) {
            userIds.push(tempstring)
        }

        
        userIds = userIds.map(id => id.trim())
        let bancount = 0
        let failedBans = 0
        let replyString = ""
        const guildBans = await interaction.guild.bans.fetch()
        let bannedUsers = []
        guildBans.forEach(ban => {
            bannedUsers.push(ban.user.id)
        })
        let index = 0
        for (const userId of userIds) {
            try {
                replyString += `[${index + 1}/${userIds.length}]`
                index++
                if (bannedUsers.includes(userId)) {
                    try {
                    
                        await interaction.guild.bans.remove(userId, {
                            reason: `No longer banned by ${interaction.user.tag} (${interaction.user.id})!`
                        })
                        
                        replyString += ` ✅ **unbanned <@${userId}>!!!!**\n`
                        if (banlogsChannel.channel) { 
                            banlogsChannel.channel.send({
                                content: `:ballot_box_with_check: <@${userId}> has been unbanned by <@${interaction.user.id}>!`, 
                                allowedMentions: {parse: [MessageMentions.NONE]}
                            })
                        }
                        bancount++
                    } catch(err) {
                        replyString += ` ❌ **Failed to unban <@${userId}>! Error received: ${err.name}  ${err.message}**\n`
                        failedBans++
                    }
                } else {
                    
                    replyString += ` :ballot_box_with_check: *<@${userId}> is already unbanned :D*\n`
                }
            } catch(err)  {
                replyString += `❌**Failed to unban <@${userId}>! Error received: ${err.name}  ${err.message}**\n`
                failedBans++
            }
        } 
        replyString += `**unbanned ${bancount} users!**\n`
        const insults = ["The purge has begun...", ` ✅ *Banned <@${interaction.user.id}>!!!! Na jk!*`, "Dont you think I have better stuff to do then this?", "Dont you have anything better to do?", "The purge is upon us!", "They are dropping like flies!", "What did they do to deserve this!??!", "Why dont you just do this yourself next time?", "Aint it your job to ban these guys?", "Youre lucky I did this for you!", "I hope you appreciate this!", "I could have just ignored your request...", "Im watching you...", "This is why I drink", "Im not paid enough for this...", "Is that it? You could have just done it yourself...", "I bet you feel powerful now, dont you?", "You do realise I have feelings too, right?", "This is why bots are better then humans", "You know I could just ban you instead, right?", "I hope you know what youre doing...", "I really hope they deserved it..."];
        const selectedInsult = `\n\n# *${insults[Math.floor(Math.random() * insults.length)]}*`;
        if (failedBans > 0) {
            replyString += `***failed to unban ${failedBans} users!***\n`
        } 
        if (replyString.length + selectedInsult.length <= 2000) {
            interaction.editReply(replyString + selectedInsult)
        } else {
            interaction.editReply('# ***unbanning users:***')
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

            tempstring += `\n\n# *${selectedInsult}*`
            interaction.channel.send(tempstring)
        }

    }
}