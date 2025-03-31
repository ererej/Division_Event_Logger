const { Events } = require('discord.js');
const db = require('../dbObjects.js');
const noblox = require("noblox.js")
const updateGroupMemberCount = require('../utils/updateGroupMemberCount.js')
const updateGuildMemberCount = require('../utils/updateGuildMemberCount.js')


module.exports = {
    name: Events.GuildMemberAdd,
    /**
     * 
     * @param {import('discord.js').GuildMember} member 
     */
    async execute(member) {
        if (member.id == "1059872684881747978") {
            const testingServer = member.client.guilds.cache.get("831851819457052692")
            const channel = testingServer.channels.cache.get("1313126303775457320")
            channel.send({content: `Akant joined a server called: ${member.guild.name}! <@386838167506124800>`})
        }
        updateGroupMemberCount({noblox, guild: member.guild, db})
        updateGuildMemberCount({guild: member.guild, db})
    }
}

