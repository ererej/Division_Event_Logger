const Ranks = require("./Ranks");

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
		},
		guild_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		promo_points: {
			type: DataTypes.INTEGER,
		},
		rank_id: {
			type: DataTypes.STRING
		},
		total_events_attended: {
			type: DataTypes.INTEGER
		},
		recruted_by: {
			type: DataTypes.STRING
		}
	});
	/*
	User.prototype.setRank = async function(noblox, groupId, MEMBER, rank, ) {
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

	User.prototype.getRank = async function() {
		const rank = Ranks.findOne({ where: { id: this.rank_id } })
		return rank
	}
*/
	return User
};