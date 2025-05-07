const { Events } = require('discord.js');
const db = require('../dbObjects.js');
const noblox = require("noblox.js")
const updateGroupMemberCount = require('../utils/updateGroupMemberCount.js')
const updateGuildMemberCount = require('../utils/updateGuildMemberCount.js')


module.exports = {
    name: Events.GuildMemberAdd,


    /**
     *  @param {import('discord.js').GuildMember} member
     */
    async execute(member, type, invite) {
        updateGroupMemberCount({noblox, guild: member.guild, db})
        updateGuildMemberCount({guild: member.guild, db})

        
        let user = await db.Users.findOne({ where: { user_id: member.user.id, guild_id: member.guild.id } });
        if (!user) {
            user = await db.Users.create({ user_id: member.user.id, guild_id: member.guild.id, join_date: new Date(), promo_points: 0, rank_id: null, total_events_attended: 0, recruted_by: null })
        }
        user.join_date = new Date()
        let server;
        if (user.rank_id === null) {
            server = await db.Servers.findOne({ where: { guild_id: member.guild.id } })
            if (!server) {
                return console.log("No server found for guild: " + member.guild.id)
            }
            await user.updateRank(noblox, server.group_id, member)
        }
        
        if (!user.invite_code) {    
            if (type === 'normal') {
                user.invite_code = invite.code
                user.invite_code_owner = invite.inviter.id
                user.recruted_by = invite.inviter.id

                const inviter = await db.Users.findOne({ where: { user_id: invite.inviter.id, guild_id: member.guild.id } });
                if (inviter) {
                    if (!server) {
                        server = await db.Servers.findOne({ where: { guild_id: member.guild.id } })
                    }
                    const responce = await inviter.updateRank(noblox, server.group_id, member.guild.members.cache.get(inviter.user_id))
                    const promopointsPerRecruit = ((await db.Settings.findOne({ where: { guild_id: member.guild.id, type: "promopoints_per_recruit" } })) ?? {config: 1}).config
                    if (responce.error) {
                        inviter.send({ content: `Thanks for recruiting <@${member.user.id}> you would have gotten ${promopointsPerRecruit} promo points as a reward but I was unable to verify your rank sorry! \n ${responce.message}` })
                    }
                    const addPromoPointsResponce = inviter.addPromoPoints(noblox, server.group_id, member.guild.members.cache.get(inviter.user_id), promopointsPerRecruit, responce.robloxUser)
                    if (server) {
                        // TODO make this use the utility function for fetching linked channels
                        const recruitmentLogs = await db.Channels.findOne({ where: { guild_id: member.guild.id, type: "recruitmentlogs" } });
                        let logs = recruitmentLogs
                        if (!logs) {
                            const promoLogs = await db.Channels.findOne({ where: { guild_id: member.guild.id, type: "promologs" } });
                            if (promoLogs) {
                                logs = promoLogs
                            }
                        }
                        
                        if (logs) {
                            const channel = member.guild.channels.cache.get(promoLogs.channel_id)
                            if (channel) {
                                channel.send({ content: `<@${invite.inviter.id}> has recruited <@${member.user.id}> using the invite code ${invite.code} and got ${promopointsPerRecruit} promo points for it! \n ${responce ?? ""} \n ${addPromoPointsResponce.message ?? ""}` })
                            } else {
                                console.log(`Unable to find channel with id ${promoLogs.channel_id} in guild ${member.guild.name} id: ${member.guild.id}`)
                            }
                        } else {
                            inviter.send({ content: `Thanks for recruiting <@${member.user.id}> as a reward you have been given ${promopointsPerRecruit} promo points! \n ${responce.message ?? ""} \n ${addPromoPointsResponce.message ?? ""}` })
                        }
                    }
                }
            } else if (type === "vanity") {
                user.invite_code = invite.code
            } else if (type === "permissions") {
                console.log(`missing permissins to figure out how ${member} joined in ${member.guild.name} id: ${member.guild.id}`)
            } else if (type === "unknown") {
                console.log(`unable to figure out how ${member} joined in ${member.guild.name} id: ${member.guild.id}`)
            } else {
                console.log("emmmmmmmmmm what is this type: " + type)
            }
        } else {
            console.log(`User ${member.user.username} already has an invite code in ${member.guild.name} id: ${member.guild.id}`)
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

