const { Events, EmbedBuilder } = require('discord.js');
const db = require('../dbObjects.js');
const noblox = require("noblox.js")
const updateGroupMemberCount = require('../utils/updateGroupMemberCount.js')
const updateGuildMemberCount = require('../utils/updateGuildMemberCount.js')
const getLinkedChannel = require('../utils/getLinkedChannel.js')
const checkMilestone = require('../utils/checkMilestone.js');
const getNameOfPromoPoints = require('../utils/getNameOfPromoPoints.js');

module.exports = {
    name: Events.GuildMemberAdd,


    /**
     *  @param {import('discord.js').GuildMember} member
     */
    async execute(member, type, invite) {
        updateGroupMemberCount({guild: member.guild, db})
        updateGuildMemberCount({guild: member.guild, db})

        
        const server = await db.Servers.findOne({ where: { guild_id: member.guild.id } })
        if (!server || server.premium_end_date < new Date()) {
            return
        }

        let user = await db.Users.findOne({ where: { user_id: member.user.id, guild_id: member.guild.id } });
        if (!user) {
            user = await db.Users.create({ user_id: member.user.id, guild_id: member.guild.id, join_date: new Date(), promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
        }
        user.join_date = new Date()

        if (user.rank_id === null) {
            if (!server) {
                return console.log("[guildMemberAdd] No server found for guild: " + member.guild.id)
            }
            await user.updateRank(server.group_id, member)
        }

        if (!user.recruted_by) {
            if (type === 'normal') {
                user.invite_code = invite.code
                user.invite_code_owner = invite.inviter.id
                user.recruted_by = invite.inviter.id

                const nameOfPromoPoints = await getNameOfPromoPoints({db: db, guildId: member.guild.id})

                const inviter = await db.Users.findOne({ where: { user_id: invite.inviter.id, guild_id: member.guild.id } });
                if (inviter) {
                    

                    const inviterMember = await member.guild.members.fetch(invite.inviter.id);
                    
                    const responce = await inviter.updateRank(server.group_id, inviterMember)
                    const promopointsPerRecruit = ((await db. .findOne({ where: { guild_id: member.guild.id, type: "promopoints_per_recruit" } })) ?? {config: 0}).config
                    if (responce.error) {
                        inviter.send({ content: `Thanks for recruiting <@${member.user.id}> you would have gotten ${promopointsPerRecruit} ${nameOfPromoPoints} as a reward but I was unable to verify your rank sorry! \n ${responce.message}` })
                    }
                    const addPromoPointsResponce = await inviter.addPromoPoints(server.group_id, inviterMember, undefined, promopointsPerRecruit, responce.robloxUser)
                    const ranks = await db.Ranks.findAll({ where: { guild_id: member.guild.id } })
                    const checkMemberMilestoneResponce = await checkMilestone({db, type: "member_recruits_recruited", member: inviterMember, dbUser: inviter, ranks: ranks, robloxUser: responce.robloxUser})
                    const checkRecruitMilestoneResponce = await checkMilestone({db, type: "recruit_recruits_recruited", member: inviterMember, dbUser: inviter, ranks: ranks, robloxUser: user.robloxUser})
                    console.log("checkMemberMilestoneResponce", checkMemberMilestoneResponce)
                    console.log("checkRecruitMilestoneResponce", checkRecruitMilestoneResponce)
                    if (server) {
                        const recruitmentLogs = await getLinkedChannel({interaction: undefined, db, query: { guild_id: member.guild.id, type: "recruitmentlogs" }, guild: member.guild})
                        const promoLogs = await getLinkedChannel({interaction: undefined, db, query: { guild_id: member.guild.id, type: "promologs" }, guild: member.guild})

                        if (recruitmentLogs.channel) {
                            recruitmentLogs.channel.send({ embeds: [new EmbedBuilder().setDescription(`<@${invite.inviter.id}> has recruited <@${member.user.id}> using the invite code ${invite.code} and got ${promopointsPerRecruit} ${nameOfPromoPoints} for it! \n\n ${responce.message ?? ""} \n <@${inviter.user_id}> ${addPromoPointsResponce.message ?? ""}`).setColor([0,0,255])] })
                        }

                        if (promoLogs.channel /*&& promoLogs.channel.id !== recruitmentLogs.channel.id*/) {
                            promoLogs.channel.send({ embeds: [new EmbedBuilder().setDescription(`<@${invite.inviter.id}> has recruited <@${member.user.id}> \n ${"<@" + inviter.user_id + "> " + addPromoPointsResponce.message ?? ""}`).setColor([0,0,255])] })
                        }

                        if (!recruitmentLogs.channel && !promoLogs.channel) {
                            inviter.inviter.send({ content: `Thanks for recruiting <@${member.user.id}> as a reward you have been given ${promopointsPerRecruit} ${nameOfPromoPoints}! \n ${responce.message ?? ""} \n ${addPromoPointsResponce.message ?? ""}` })
                        }

                        // TODO make this use the utility function for fetching linked channels. DONE!
                        
                    }
                }
            } else if (type === "vanity") {
                user.invite_code = invite.code
            } else if (type === "permissions") {
                console.log(`Missing permissions to figure out how ${member.user.username} joined ${member.guild.name} (ID: ${member.guild.id}). Bot may need MANAGE_GUILD permission.`)
                // Set a default invite code to indicate permission issues
                user.invite_code = "PERMISSION_ERROR"
            } else if (type === "unknown") {
                console.log(`Unable to figure out how ${member.user.username} joined ${member.guild.name} (ID: ${member.guild.id})`)
                user.invite_code = "UNKNOWN_SOURCE"
            } else {
                console.log(`Unknown join type "${type}" for ${member.user.username} in ${member.guild.name} (ID: ${member.guild.id})`)
                user.invite_code = `UNKNOWN_TYPE_${type}`
            }
        } else {
            console.log(`User ${member.user.username} already has already been recruited in ${member.guild.name} id: ${member.guild.id}`)
        }
        await user.save()    
        
    
        // // credit to TheShadowGamer for this code snippet, it was taken from his bot inviteManager
        // const cachedInvites = this.client.guildInvites.get(member.guild.id);
        // const newInvites = await member.guild.fetchInvites();
        // if(member.guild.vanityURLCode) newInvites.set(member.guild.vanityURLCode, await member.guild.fetchVanityData());
        // this.client.guildInvites.set(member.guild.id, newInvites);
        // const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code).uses < inv.uses);
        // if(!usedInvite) return console.log('No invite used');
        // console.log(`Invite used: ${usedInvite.code} by ${member.user.username} in ${member.guild.name} id: ${member.guild.id}`);        
    }
}

