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
    }
}

