const Sequelize = require('sequelize');
const config = require('./config.json');
const { MembershipScreeningFieldType } = require('discord.js');
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
const Settings = require('./models/Settings.js')(sequelize, Sequelize.DataTypes);

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
	/**
	 * 
	 * @param {object} noblox 
	 * @param {string} groupId 
	 * @param {object} MEMBER 
	 * @returns 
	 */
	value: async function(noblox, groupId, MEMBER /* guildmember */ ) {
		//find the users roblox account
		let robloxUser = await fetch(`https://registry.rover.link/api/guilds/${MEMBER.guild.id}/discord-to-roblox/${MEMBER.user.id}`, {
			headers: {
			'Authorization': `Bearer ${config.roverkey}`
			}
		})
		if (!(robloxUser.status + "").startsWith("2")) {
			if (robloxUser.status === 404) {
				return `Error: <@${this.user_id}> needs to verify using rover!`;
			}
			console.log(robloxUser)
			return `Error: An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`;
		}
		robloxUser = await robloxUser.json()
		// find rank from database
		let dbRank = await Ranks.findOne({ where: { id: this.rank_id } })
		const ranks = await Ranks.findAll({ where: { guild_id: MEMBER.guild.id }})
		const robloxGroup = (await noblox.getGroups(robloxUser.robloxId)).find(group => group.Id === groupId)
		if (!robloxGroup) {
			return `Error: <@${this.user_id}> is not in the group!`
		}
		const rankFromRoblox = ranks.find(rank => rank.roblox_id == robloxGroup.RoleId)
		if (!rankFromRoblox) {
			return `Error: The roblox rank ${robloxGroup.Role} is not linked! please get a admin to link it using /linkrank!`
		}

		if (!dbRank) {
			
			let highestRank;
			ranks.forEach(async rank => {
				if (MEMBER.roles.cache.some(role => role.id === rank.id)) {
					if (rank.rank_index > (highestRank ? highestRank.rank_index : 0)) {
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
				MEMBER.roles.add(this.rank_id)
				return `added <@${this.user_id}> to the databse with the rank <@&${this.rank_id}> (taken from roblox group rank)>`
			}
			this.rank_id = highestRank.id
			this.save()
			if (highestRank.roblox_id != rankFromRoblox.roblox_id) {
				await noblox.setRank(groupId, robloxUser.robloxId, Number(highestRank.roblox_id)).catch((err) => {
					console.log(err)
					return `Error: An error occured while trying to update <@${MEMBER.user.id}'s roblox rank! try again later!`
				})
			}
			return `added <@${this.user_id}> to the databse with the rank <@&${this.rank_id}> (taken from discord roles)>`
		}
		//if the roblox rank is incorrect
		if (dbRank.roblox_id != rankFromRoblox.roblox_id) {
			noblox.setRank(groupId, robloxUser.robloxId, Number(dbRank.roblox_id)).catch((err) => {
				console.log(err)
				return `Error: An error occured while trying to update <@${MEMBER.user.id}'s roblox rank! try again later!`
			})
			return `Updated <@${this.user_id}>'s roblox rank to <@&${dbRank.id}>`
		} 

		if (!MEMBER.roles.cache.some(role => role.id === dbRank.id)) {
			ranks.forEach(rank => {
				if (MEMBER.roles.cache.some(role => role.id === rank.id)) {
					MEMBER.roles.remove(rank.id)
				}
			})
			MEMBER.roles.add(this.rank_id)
			return `Updated <@${this.user_id}>'s discord rank to <@&${this.rank_id}>`
		}

		return 
	}
});


module.exports = { Users, Channels, Servers, Ranks, Settings};