const { Events } = require('discord.js');
const db = require('../dbObjects.js');
const noblox = require("noblox.js")
const updateGroupMemberCount = require('../utils/updateGroupMemberCount.js')
const updateGuildMemberCount = require('../utils/updateGuildMemberCount.js')


module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        updateGroupMemberCount({noblox, guild: member.guild, db})
        updateGuildMemberCount({guild: member.guild, db})
    }
}

