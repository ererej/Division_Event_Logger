const { Events } = require('discord.js');
const db = require('../dbObjects.js');
const noblox = require("noblox.js")
const updateGroupMemberCount = require('../functions/updateGroupMemberCount.js')
const updateGuildMemberCount = require('../functions/updateGuildMemberCount.js')


module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member) {
        updateGroupMemberCount({noblox, guild: member.guild, db})
        updateGuildMemberCount({guild: member.guild, db})
        
        const dbUser = await db.Users.findOne({where: {user_id: member.id, guild_id: member.guild.id}})
        if (dbUser && dbUser.officer) {
            console.log("retiring officer " + member.id + " in guild " + member.guild.id + " because they left the server")
            await dbUser.update({officer: false})
            const officer = await db.Officers.findOne({where: {discordId: member.id, guild_id: member.guild.id}})
            if (officer) {
                await officer.update({retired: new Date()})
            }
        }
        
    }
}

