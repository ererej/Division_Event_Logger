const Sequelize = require('sequelize');
const config = require('./config.json');
const dbcredentoiols = config.db;

const sequelize = new Sequelize(dbcredentoiols.database, dbcredentoiols.username, dbcredentoiols.password, {
	host: dbcredentoiols.host,
	dialect: 'mysql',
	logging: false,
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const Servers = require('./models/Servers.js')(sequelize, Sequelize.DataTypes);
const Ranks = require('./models/Ranks.js')(sequelize, Sequelize.DataTypes);
const Channels = require('./models/Channels.js')(sequelize, Sequelize.DataTypes);

Users.hasOne(Ranks, {
	foreignKey: 'id'
});
Ranks.belongsTo(Users, { foreignKey: "id", as: "rank" })


//Ranks.belongsTo(Servers, {foreignKey: 'guild_id', as: 'ranks'});
//Users.belongsTo(Ranks, {as: 'rank', foreignkey: 'id'})
//Ranks.belongsTo(Users , {foreignKey: 'rank', as: 'rank'})

Reflect.defineProperty(Users.prototype, 'addItem', {
	value: async item => {
		const userItem = await UserItems.findOne({
			where: { user_id: this.user_id, item_id: item.id },
		});

		if (userItem) {
			userItem.amount += 1;
			return userItem.save();
		}

		return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: 1 });
	},
});

Reflect.defineProperty(Ranks.prototype, 'addRank', {// ?!?!? aint this suposed to be on the server object??
	value: async (discord_rank, roblox_id, promo_points, rank_index, is_officer) => {
		const division_rank = await Ranks.findOne({
			where: {discord_rank_id: this.discord_rank_id},
		});
		
		if (!division_rank) {
			return Ranks.create({ id: this.discord_rank.id, guild_id: discord_rank.guild.id, roblox_id: roblox_id, promo_points: promo_points, rank_index: rank_index, is_officer: is_officer/*send help idk what i'm doing plz fix. this is a fucntion to add a rank. becouse it dident know what .crate() is in add_ranks.js*/ })
		}
	}
});

Reflect.defineProperty(Servers.prototype, "getRanks", {
	value: () => {
		return Ranks.findAll({
			where: {guild_id: this.guild_id},
			include: ["rank"]
		}) 
		
	}
})

Reflect.defineProperty(Users.prototype, 'getItems', {
	value: () => {
		return UserItems.findAll({
			where: { user_id: this.user_id },
			include: ['item'],
		});
	},
});

Reflect.defineProperty(Users.prototype, 'getRank', {
	value: async function() {
		return await Ranks.findOne({ where: { id: this.rank_id } })
		
	}
});

Reflect.defineProperty(Users.prototype, 'setRank', {
	value: async function(noblox, groupId, MEMBER, rank ) {
		let robloxUser = await fetch(`https://registry.rover.link/api/guilds/${MEMBER.guild.id}/discord-to-roblox/${MEMBER.user.id}`, {
			headers: {
			'Authorization': `Bearer ${config.roverkey}`
			}
		})
		if (!(robloxUser.status + "").startsWith("2")) {
			if (robloxUser.status === 404) {
				return `<@${this.user_id}> needs to verify using rover!`;
			}
			console.log(robloxUser)
			return `An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`;
		}
		robloxUser = await robloxUser.json()
		console.log(rank.roblox_id)
		await noblox.setRank(groupId, robloxUser.robloxId, Number(rank.roblox_id))
		const oldRank = this.rank_id
		//add a check to see if the bot has perms to change the rank
		MEMBER.roles.remove(oldRank)
		MEMBER.roles.add(rank.id)
		this.rank_id = rank.id
		this.promo_points = 0
		this.save()
		console.log(`Promoted <@${this.user_id}> from <@&${oldRank}> to <@&${rank.id}>`)
		return `Promoted <@${this.user_id}> from <@&${oldRank}> to <@&${rank.id}>`
	}
});

Reflect.defineProperty(Users.prototype, 'updateRank', {
	value: async function(noblox, groupId, MEMBER /* guildmember */ ) {
		//find the users roblox account
		let robloxUser = await fetch(`https://registry.rover.link/api/guilds/${MEMBER.guild.id}/discord-to-roblox/${MEMBER.user.id}`, {
			headers: {
			'Authorization': `Bearer ${config.roverkey}`
			}
		})
		if (!(robloxUser.status + "").startsWith("2")) {
			if (robloxUser.status === 404) {
				return `<@${this.user_id}> needs to verify using rover!`;
			}
			console.log(robloxUser)
			return `An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`;
		}
		robloxUser = await robloxUser.json()
		// find rank from database
		const rank = await Ranks.findOne({ where: { id: this.rank_id } })
		const ranks = await Ranks.findAll({ where: { guild_id: MEMBER.guild.id }})
		const roles = await MEMBER.guild.roles.fetch()
		const robloxRankId = await noblox.getRankInGroup(groupId, robloxUser.robloxId)
		console.log(robloxRankId)
		if (!robloxRankId) {
			return `<@${this.user_id}> is not in the group!`
		}
		const rankFromRoblox = ranks.find(rank => rank.roblox_id == robloxRankId)
		if (!rankFromRoblox) {
			let robloxRank = await noblox.getRole(groupId, robloxRankId)
			return `The roblox rank ${robloxRank.name} is not linked! please get a admin to link it using /linkrank!`
		}

		if (!rank) {
			
			let highestRank;
			ranks.forEach(async rank => {
				if (roles.find(role => role.id === rank.id)) {
					if (rank.rank_index > highestRank.rank_index) {
						highestRank = rank
					} else { //removes extra rank roles 
						MEMBER.roles.remove(rank.id)
					}
				}
			})
			if (!highestRank) { //if no rank roles are found
				//take the roblox rank
				this.rank_id = rankFromRoblox.id
				this.promo_points = 0
				this.save()
				MEMBER.roles.add(foundRank.id)
				return `Updated <@${this.user_id}> to <@&${foundRank.id} (taken from roblox group rank)>`
			}
			this.rank_id = highestRank.id
			this.save()
			noblox.setRank(groupId, robloxUser.robloxId, Number(highestRank.roblox_id)).catch((err) => {
				console.log(err)
				return `An error occured while trying to update <@${MEMBER.user.id}'s roblox rank! try again later!`
			})
		}
		if (rank.roblox_id != rankFromRoblox.roblox_id) {
			noblox.setRank(groupId, robloxUser.robloxId, Number(rank.roblox_id)).catch((err) => {
				console.log(err)
				return `An error occured while trying to update <@${MEMBER.user.id}'s roblox rank! try again later!`
			})
			return `Updated <@${this.user_id}>'s roblox rank to <@&${rank.id}>`
		} 

		if (!roles.find(role => role.id === rank.id)) {
			ranks.forEach(rank => {
				if (roles.find(role => role.id === rank.id)) {
					MEMBER.roles.remove(rank.id)
				}
			})
			MEMBER.roles.add(rank.id)
			return `Updated <@${this.user_id}>'s discord rank to <@&${rank.id}>`
		}

		return 
	}
});

module.exports = { Users, Channels, Servers, Ranks};