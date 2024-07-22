module.exports = async (sequelize, DataTypes) => {

    const setRank = async function(user, noblox, groupId, MEMBER, rank, ) {
        const robloxUser = await fetch(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${member.id}`, {
			headers: {
			'Authorization': `Bearer ${roverkey}`
			}
		})
		if (!(robloxUser.status + "").startsWith("2")) {
			return promotion_string = `<@${this.user_id}> needs to verify using rover!`;
		}

		noblox.setRank(groupId, robloxUser.robloxId, rank.id)
		this.rank_id = new_rank.id
		this.save()
		MEMBER.roles.remove(rank.id)
		MEMBER.roles.add(new_rank.id)
		return `Promoted <@${this.user_id}> from <@${rank.id}> to <@${new_rank.id}>`
    }

}