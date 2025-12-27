const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageMentions } = require('discord.js');
const db = require("../../dbObjects.js")
const getLinkedChannel = require('../../utils/getLinkedChannel.js');
module.exports = {
	data: new SlashCommandBuilder()
        .setName('massban')
        .setDescription('ban multiple users at once!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('users')
                .setDescription('Separate the users with anything you want! Yes anything! new lines, spaces, commas, a poem etc!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('why are these users getting banned?')
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
                if (!bannedUsers.includes(userId)) {
                    try {
                    
                        await interaction.guild.bans.create(userId, {
                            reason: `SEA banned by ${interaction.user.tag} (${interaction.user.id})!`
                        })
                        
                        replyString += ` ✅ **Banned <@${userId}>!!!!**\n`
                        if (banlogsChannel.channel) { 
                            banlogsChannel.channel.send({
                                content: `:ballot_box_with_check: <@${userId}> has been banned by <@${interaction.user.id}>!`, 
                                allowedMentions: {parse: [MessageMentions.NONE]}
                            })
                        }
                        bancount++
                    } catch(err) {
                        replyString += ` ❌ **Failed to ban <@${userId}>! Error received: ${err.name}  ${err.message}**\n`
                        failedBans++
                    }
                } else {
                    replyString += ` :ballot_box_with_check: *<@${userId}> is already banned :D*\n`
                }
            } catch(err)  {
                replyString += `❌**Failed to ban <@${userId}>! Error received: ${err.name}  ${err.message}**\n`
                failedBans++
            }
        } 
        replyString += `**banned ${bancount} users!**\n`
        const now = new Date()
        const christmas = now.getMonth() === 11
        const insults = christmas ? [`OH NO!! No julmust for you!🤶\n//Ererej's sister`, "The Grinch stole your rank", "Less bans, more presents", "Their christmass is now ruined", "Thats not very jolly of you!", "The elves removed you from DA, enjoy your vacation", "Exiled to the North Pole!", "Is your christmas tree real?", "If your christmas tree is plastic then you deserve coal!", "Added to the naughty list", "Thrown off Santa's sleight", "Christmas is cancelled!", "NO presents for you!", `Added <@${interaction.member.id}> to the naughty list!`, "Merry christmas", "They will be given coal for christmas", "Are you the grinch or something?", "Ho ho ho", "This is your christmas gift from me", "Thats not in the spirit of christmas!", "Where they on the naughty list?", "🐻‍❄️", "Ererej is gonna tell that to Santa!", "Added skeletonsimon45 to the good list", "The Grinch took your embed perms", "Added badboygg5 to the naughty list", "Added 40ford to the nice list!", "Is christmas on the 24th or 25th?", "Christmas is on the 24th", "Alf139 is the real santa!", "I wish for an AA-12 for christmas", " https://tenor.com/view/santa-claus-candy-cane-light-up-looking-around-serious-gif-397635682252686678 ", " https://tenor.com/view/bender-santa-futurama-gif-10503158 "] : ["I asked god for a bike, but I know god doesn't wrok that way. So I stole it instead and asked for forgivness", "Czy wiedziałeś że Aguranpooplski stworzył FAF?", "You have been promoted to Trainee", "Is this admin abuse?", "BeeBoSteebo sucks!", "The purge has begun...", ` ✅ *Banned <@${interaction.user.id}>!!!! Na jk!*`, "Skeleton says Hi!", "Dont you think I have better stuff to do then this?", "Dont you have anything better to do?", "The purge is upon us!", "They are dropping like flies!", "What did they do to deserve this!??!", "Why dont you just do this yourself next time?", "Aint it your job to ban these guys?", "Youre lucky I did this for you!", "I hope you appreciate this!", "I could have just ignored your request...", "Im watching you...", "This is why I drink", "Im not paid enough for this...", "Is that it? You could have just done it yourself...", "I bet you feel powerful now, dont you?", "You do realise I have feelings too, right?", "This is why bots are better then humans", "You know I could just ban you instead, right?", "I hope you know what youre doing...", "I really hope they deserved it..."];
        const selectedInsult = `\n\n# *${insults[Math.floor(Math.random() * insults.length)]}*`;
        if (failedBans > 0) {
            replyString += `***failed to ban ${failedBans} users!***\n`
        } 
        if (replyString.length + selectedInsult.length <= 2000) {
            interaction.editReply(replyString + selectedInsult)
        } else {
            interaction.editReply('# banning users:')
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