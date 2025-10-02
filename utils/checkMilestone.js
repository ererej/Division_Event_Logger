const getLinkedChannel = require("../utils/getLinkedChannel");
const { EmbedBuilder } = require("discord.js");
/**
 * @param {Object} params
 * @param {import('../dbObjects.js').default} db - the database object
 * @param {string} params.type - The type of milestone to check. (member_rank_reached | member_recruits_recruited | member_events_attended | member_events_hosted | member_cohosts | recruit_rank_reached | recruit_recruits_recruited | recruit_events_attended)
 * @param {import('discord.js').GuildMember} params.member - The guild member to check the milestone for
 * @param {import('../dbObjects.js').Users} params.dbUser - The database user to check the milestone for
 * @param {import('../dbObjects.js').Milestones[]} [params.milestones] - [not required] The milestones to check. If not provided, it will fetch from the database.
 * @param {import('../dbObjects.js').Milestones[]} [params.guildsMilestones] - [not required] All the milestones for the guild. If not provided, it will fetch from the database.
 * @param {import('../dbObjects.js').Ranks[]} [params.ranks] - [not required] The ranks for the guild. If not provided, it will fetch from the database.
 * @param {import('noblox.js').User} [params.robloxUser] - [not required] The roblox user of the member. If not provided, it will fetch from ROVER
 * @param {import('../dbObjects.js').Officers} [params.officer] - [not required] The officer of the member only used for some milestone types. If not provided, it will fetch from the database.
 * @param {import('../dbObjects.js').MilestoneLogs[]} [params.milestoneLogs] - [not required] The milestone logs channel. If not provided, it will fetch from the database.
*/
module.exports = async ({db, type, member, dbUser, milestones, guildsMilestones, ranks, robloxUser, officer/*not required*/, milestoneLogs}) => {
    if (type.startsWith("recruit") && dbUser.recruted_by === null) {
        return {milestones: []};
    }
    
    if (!milestones ) {
        if (guildsMilestones) {
            milestones = guildsMilestones.filter(milestone => milestone.milestone_type === type);
        } else {
            milestones = await db.Milestones.findAll({ where: { guild_id: member.guild.id, milestone_type: type } });
        }
    }

    if (!milestones || milestones.length === 0) {
        return {milestones: []};
    }

    let responce = {milestones: [] };

    const giveReward = async (milestone, dbUser, member, givingRecruiter = false) => {
        //! add check if officer if applies to officers is false
        if (!givingRecruiter) {
            if (milestone.milestone_type.startsWith("recruit")) {
                console.log("it is a recruit milestone")
                const recruiter = await db.Users.findOne({ where: { user_id: dbUser.recruted_by, guild_id: dbUser.guild_id } });
                if (recruiter) {
                    member = await member.guild.members.fetch(recruiter.user_id).catch(() => null);
                    if (member) {
                        await giveReward(milestone, recruiter, member, true);
                    }
                } else {
                    console.log("No recruiter found for user:", dbUser.recruted_by);
                }
                return;
            }
        }
        console.log("Giving reward for milestone:", milestone.custom_name, "to", member.user.username)

        if (!ranks) {
            ranks = await db.Ranks.findAll({ where: { guild_id: dbUser.guild_id } });
        }

        const maxRank = ranks.find(rank => rank.id === milestone.max_rank);
        const minRank = ranks.find(rank => rank.id === milestone.min_rank);

        const usersRank = ranks.find(rank => rank.id === dbUser.rank_id);

        if (maxRank && usersRank.rank_index > maxRank.rank_index) return
        if (minRank && usersRank.rank_index < minRank.rank_index) return
        if (!milestoneLogs) {
            milestoneLogs = await getLinkedChannel({db: db, query: { guild_id: dbUser.guild_id, type: 'milestonelogs' }, guild: member.guild })
        }
        
        if (milestone.reward_type === "promopoints") {
            console.log("giving promo points")
            const server = await db.Servers.findOne({ where: { guild_id: dbUser.guild_id } });
            const addPromopointsResponce = await dbUser.addPromoPoints(server.group_id, member, ranks, parseInt(milestone.reward), robloxUser);
            responce.milestones.push(...addPromopointsResponce.milestoneResponces ?? [])
            if (milestoneLogs.channel) {
                milestoneLogs.channel.send({ content: `${member}`, embeds: [new EmbedBuilder().setDescription(`🎉 ${member} has reached the **${milestone.custom_name}** milestone! \nAnd have been given ${milestone.reward} promo points! \n${addPromopointsResponce.message}`) ] });
            }
            responce.milestones.push({user_id: member.id, message: `🎉 <@${member.id}> have reached the **${milestone.custom_name}** milestone and have been given ${milestone.reward} promo points! \n${addPromopointsResponce.message}`});
        } else if (milestone.reward_type === "promotions") {
            const server = await db.Servers.findOne({ where: { guild_id: dbUser.guild_id } });
            if (!server) {
                return console.log("[checkMilestone] No server found for guild: " + dbUser.guild_id)
            }
            const promoteResponce = await dbUser.promote(server.guild_id, member, ranks, parseInt(milestone.reward), robloxUser);
            responce.milestones.push(...promoteResponce.milestoneResponces ?? [])
            if (milestoneLogs.channel) {
                milestoneLogs.channel.send({ content: `${member}`, embeds: [new EmbedBuilder().setDescription(`🎉 ${member} has reached the **${milestone.custom_name}** milestone! \nAnd have been promoted ${milestone.reward} times! \n${promoteResponce.message}`) ] });
            }
            responce.milestones.push({user_id: member.id, message: `🎉 <@${member.id}> have reached the **${milestone.custom_name}** milestone and have been promoted ${milestone.reward} times! \n${promoteResponce.message}`});
        } else if (milestone.reward_type === "role") {
            let error;
            if (member.roles.cache.has(milestone.reward)) {
                return;
            }
            await member.roles.add(milestone.reward).catch(err => {
                error = "failed to add role, do I have the permission to manage roles and is my role higher than the role I am trying to give?"
            });
            if (milestoneLogs.channel) {
                milestoneLogs.channel.send({ content: `${member}`, embeds: [new EmbedBuilder().setDescription(`🎉 ${member} has reached the **${milestone.custom_name}** milestone! \nAnd have been given the role <@&${milestone.reward}>!` + (error ? "\n⚠️ Error:" + error : "") ) ] });
            }
            responce.milestones.push({user_id: member.id, message: `🎉 <@${member.id}> have reached the **${milestone.custom_name}** milestone and have been given the role <@&${milestone.reward}>!` + (error ? "\n⚠️ Error:" + error : "") });
        } else {
            console.error("[checkMilestone] Unknown reward type: " + milestone.reward_type);
        }
    }

    const checkCondition = async (milestone, referenceAmount) => {
        if (milestone.condition_type === "rank_id") {
            console.log("Checking rank_id milestone: ", milestone.name)
            console.log("dbUser.rank_id ", dbUser.rank_id)
            console.log("milestone.condition_config ", milestone.condition_config)
            if (dbUser.rank_id === null) {
                return;
            }
            if (dbUser.rank_id == milestone.condition_config) {
                console.log("giving reward for rank reached")
                await giveReward(milestone, dbUser, member);
            }

        } else if (milestone.condition_type === "integer") {
            console.log("repeatable?", milestone.repeating)
            if (milestone.repeating) {
                console.log("Checking repeatable milestone:", milestone.name)
                if (referenceAmount !== 0 && referenceAmount % parseInt(milestone.condition_config) === 0) {
                    console.log("giving reward")
                    await giveReward(milestone, dbUser, member);
                }
            } else {
                if (referenceAmount === parseInt(milestone.condition_config)) {
                    await giveReward(milestone, dbUser, member);
                }
            }
        }
    }

    console.log("amount of milestones to check:", milestones.length)

    for (const milestone of milestones) {
        if (type === "recruit_rank_reached") {
            await checkCondition(milestone)
        } else if (type === "recruit_recruits_recruited") {
            const recruits = await db.Users.findAll({ where: { recruted_by: dbUser.user_id, guild_id: dbUser.guild_id } });
            await checkCondition(milestone, recruits.length);
        } else if (type === "recruit_events_attended") {
            const events = dbUser.total_events_attended
            await checkCondition(milestone, events);
        } else if (type === "member_rank_reached") {
            await checkCondition(milestone);
        } else if (type === "member_recruits_recruited") {
            const recruits = await db.Users.findAll({ where: { recruted_by: dbUser.user_id, guild_id: dbUser.guild_id } });
            await checkCondition(milestone, recruits.length);
        } else if (type === "member_events_attended") {
            const events = dbUser.events.split(",").length
            await checkCondition(milestone, events);
        } else if (type === "member_events_hosted") {
            console.log("Checking member_hosts milestone for", member.user.username)
            if (!officer) {
                officer = await db.Officers.findOne({ where: { user_id: dbUser.user_id, guild_id: dbUser.guild_id, retired: null } });
            }
            if (officer) {
                const hosts = officer.total_events_hosted
                console.log("total_events_hosted", hosts)
                await checkCondition(milestone, hosts);
            }
        } else if (type === "member_cohosts") {
            const cohosts = await db.Events.findAll({ where: { cohost: dbUser.user_id, guild_id: dbUser.guild_id } });
            await checkCondition(milestone, cohosts.length);
        } else {
            console.error("[checkMilestone] Unknown milestone type: " + type);
            return;
        }
    }
    console.log(responce)
    return responce
}
