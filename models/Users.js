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
	User.prototype.setRank = async function(noblox, groupId, MEMBER, rank, ) {
		const robloxUser = await fetch(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${member.id}`, {
			headers: {
			'Authorization': `Bearer ${roverkey}`
			}
		})
		if (!(robloxUser.status + "").startsWith("2")) {
			return promotion_string = "needs to verify using rover!";
		}

		noblox.setRank(groupId, robloxUser.robloxId, rank.id)
		this.rank_id = new_rank.id
		this.save()
		MEMBER.roles.remove(rank.id)
		MEMBER.roles.add(new_rank.id)
		return `Promoted ${this.username} from <@${rank.id}> to <@${new_rank.id}>`
	}

	return User
};