const Sequelize = require('sequelize');
const config = require('./config.json');
const { MembershipScreeningFieldType } = require('discord.js');
const { message } = require('noblox.js');
const dbcredentoiols = process.argv.includes("--productiondb") ? config.productionDb : config.db;

console.log("Connecting to database: " + dbcredentoiols.database)
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

Reflect.defineProperty(Users.prototype, 'addPromoPoints', {
	value: async function(noblox, groupId, MEMBER, ranks, promotions, robloxUser) {
		let rank = await this.getRank()
		if (!rank) {
			return { message: "Error: User's rank was not found in the database!", error: true}
		}
		ranks = ranks.sort((a, b) => a.rank_index - b.rank_index)

		const promo_points_before = this.promo_points
		let responce = "";
		let showPromoPoints = true;
		let nextRank;

		ranks.some(function(tempRank, i) {
			if (tempRank.id == rank.id) {
				rankIndexInRanks = i;
				return true;
			}
		});
		const RankIndexInRanksBefore = rankIndexInRanks

		this.promo_points += promotions

		while (true) {
			rank = await this.getRank()

			showPromoPoints = true
			
			nextRank = ranks[rankIndexInRanks + 1]
			if (nextRank) {
				if (nextRank.obtainable === false) {
					return { message: responce + "Can not be promoted with promo points!", error: true, robloxUser: robloxUser }
				}
				if (this.promo_points >=  nextRank.promo_points) {

					const setRankResult = await this.setRank(noblox, groupId, MEMBER, nextRank, robloxUser).catch((err) => {
						console.log(err)
						return { message: `Error: An error occured while trying to promote the user! The user ended up with ${this.promo_points} promo points and the rank <@&${rank.id}>!`, error: true, robloxUser: robloxUser }
					});
					robloxUser = setRankResult.robloxUser
					responce += setRankResult.message;
					this.promo_points -= nextRank.promo_points
					responce += "\n"
					showPromoPoints = false
				} else {
					showPromoPoints = true
					break
				}
			} else {
				responce += "Has reached the highest rank!\n"
				break
			}
		}
		this.save()
		if (showPromoPoints) {
			const rankAboveBefore = ranks[RankIndexInRanksBefore + 1] ?? {promo_points: "∞"}
			responce += `promo points went from ***${promo_points_before}**/${rankAboveBefore.promo_points != "∞" ? (!rankAboveBefore.is_officer ? nextRank.promo_points : "∞") : "∞"}* to ***${this.promo_points}**/${nextRank ? (!nextRank.is_officer ? nextRank.promo_points : "∞") : "∞"}*!`
		}
		return { message: responce, robloxUser: robloxUser }
	}
});

Reflect.defineProperty(Users.prototype, 'removePromoPoints', {
	value: async function(noblox, groupId, MEMBER, ranks, demotions) {
		let rank = await this.getRank()
		if (!rank) {
			return "Error: User's rank was not found in the database!"
		}
		ranks = ranks.sort((a, b) => a.rank_index - b.rank_index)

		const promo_points_before = this.promo_points
		let responce = "";
		let showPromoPoints = true;
		let nextRank;
		let rankIndexInRanks;
		
		ranks.some(function(tempRank, i) {
			if (tempRank.id == rank.id) {
				rankIndexInRanks = i;
				return true;
			}
		});
		const RankIndexInRanksBefore = rankIndexInRanks


		while (demotions > 0) {
			rank = await this.getRank()

			showPromoPoints = true
			if (demotions > this.promo_points) {
				demotions -= this.promo_points + 1
				nextRank = ranks[rankIndexInRanks - 1]
				if (nextRank) {
					if (nextRank.obtainable === false) {
						return { message: responce + "Can not be demoted with promo points!", error: true }
					}
					if (rank.promo_points > 0) {
						this.promo_points = rank.promo_points - 1
					} else {
						this.promo_points = 0
					}
					const setRankResult = await this.setRank(noblox, groupId, MEMBER, nextRank ).catch((err) => {
						console.log(err)
						return { message: `Error: An error occured while trying to demote the user!	The user ended up with ${this.promo_points} promo points and the rank <@&${rank.id}>!`, error: true }
					})
					robloxUser = setRankResult.robloxUser
					responce += setRankResult.message + (this.promo_points != 0 ? ` and (**${this.promo_points}**/${rank.promo_points}) promo points` : "")
					showPromoPoints = false
					rankIndexInRanks -= 1
					responce += "\n"
				} else {
					responce += "Has reached the lowest rank!"
					this.promo_points = 0
					demotions = 0
					break
				}
			} else {
				console.log(this.promo_points)
				this.promo_points -= demotions
				showPromoPoints = true
				demotions = 0
			}
		}
		this.save()
		if (showPromoPoints) {
			const rankAbove = ranks[rankIndexInRanks + 1]
			const rankAboveBefore = ranks[RankIndexInRanksBefore + 1] ?? {promo_points: "∞"}
			responce += (responce ? "\n" : "") + `promo points went from ***${promo_points_before}**/${rankAboveBefore != "∞" ? (!rankAboveBefore.is_officer ? rankAboveBefore.promo_points : "∞") : "∞"}* to ***${this.promo_points}**/${rankAbove != "∞" ? (!rankAbove.is_officer ? rankAbove.promo_points: "∞") : "∞"}*!`
		}
		return { message: responce, robloxUser: robloxUser }
	}
});


Reflect.defineProperty(Users.prototype, 'setRank', {
	value: async function(noblox, groupId, MEMBER, rank, robloxUser) {
		if (!robloxUser) {
			robloxUser = await fetch(`https://registry.rover.link/api/guilds/${MEMBER.guild.id}/discord-to-roblox/${MEMBER.user.id}`, {
				headers: {
				'Authorization': `Bearer ${config.roverkey}`
				}
			})
		
			if (!(robloxUser.status + "").startsWith("2")) {
				if (robloxUser.status === 404) {
					return { message: `<@${this.user_id}> needs to verify using rover!`, error: true}
				}
				console.log(robloxUser)
				return { message: `Error: An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`, error: true}
			}
			robloxUser = await robloxUser.json()
		}

		await noblox.setRank(groupId, robloxUser.robloxId, Number(rank.roblox_id)).catch((err) => {
			console.log(err)
			return { message: `Error: An error occured while trying to update the users's roblox rank! Error: ${err}`, error: true, robloxUser: robloxUser }
		})
		const oldRank = this.rank_id
		//add a check to see if the bot has perms to change the rank
		MEMBER.roles.remove(oldRank)
		MEMBER.roles.add(rank.id)
		if (rank.tag) {
			MEMBER.setNickname(rank.tag + " " + robloxUser.cachedUsername)
		}
		this.rank_id = rank.id
		this.save()
		return { message: `Promoted from <@&${oldRank}> to <@&${rank.id}>`, robloxUser: robloxUser }
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
	value: async function(noblox, groupId, MEMBER /* guildmember */, robloxUser ) {
		//find the users roblox account
		if (!robloxUser) {
			robloxUser = await fetch(`https://registry.rover.link/api/guilds/${MEMBER.guild.id}/discord-to-roblox/${MEMBER.user.id}`, {
				headers: {
				'Authorization': `Bearer ${config.roverkey}`
				}
			})
		}
		if (!(robloxUser.status + "").startsWith("2")) {
			if (robloxUser.status === 404) {
				return `Error: needs to verify using rover!`;
			}
			console.log(robloxUser)
			return { message: `Error: An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`, error: true}
		}
		robloxUser = await robloxUser.json()
		// find rank from database
		let dbRank = await Ranks.findOne({ where: { id: this.rank_id } })
		const ranks = await Ranks.findAll({ where: { guild_id: MEMBER.guild.id }})
		const robloxGroup = (await noblox.getGroups(robloxUser.robloxId)).find(group => group.Id === groupId)
		if (!robloxGroup) {
			return { message:`Error: is not in the group!`, error: true, robloxUser: robloxUser }
		}
		const rankFromRoblox = ranks.find(rank => rank.roblox_id == robloxGroup.RoleId)
		if (!rankFromRoblox) {
			return { message: `Error: The roblox rank ${robloxGroup.Role} is not linked! please get a admin to link it using /addrank!`, error: true, robloxUser: robloxUser }
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
				return { message: `added to the database with the rank <@&${this.rank_id}> (taken from roblox group rank)`, robloxUser: robloxUser }
			}
			this.rank_id = highestRank.id
			this.save()
			if (highestRank.roblox_id != rankFromRoblox.roblox_id) {
				await noblox.setRank(groupId, robloxUser.robloxId, Number(highestRank.roblox_id)).catch((err) => {
					console.log(err)
					return { message: `Error: An error occured while trying to update the users's roblox rank! try again later!`, error: true, robloxUser: robloxUser }
				})
			}
			return { message: `added to the database with the rank <@&${this.rank_id}> (taken from discord roles)>`, robloxUser: robloxUser }
		}
		//if the roblox rank is incorrect
		if (dbRank.roblox_id != rankFromRoblox.roblox_id) {
			if (!MEMBER.roles.cache.some(role => role.id === dbRank.id)) {
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
				this.rank_id = highestRank.id
				this.save()
				const rank = await this.getRank()
				if (rank.roblox_id != rankFromRoblox.roblox_id) {
					await noblox.setRank(groupId, robloxUser.robloxId, Number(rank.roblox_id)).catch((err) => {
						console.log(err)
						return { message: `Error: An error occured while trying to update the users's roblox rank! try again later!`, error: true, robloxUser: robloxUser }
					})
					return { message: `Updated roblox and database rank to <@&${rank.id}> (taken from discord roles)`, robloxUser: robloxUser }
				}
				return { message: `Updated database rank to <@&${rank.id}> (taken from discord roles)`, robloxUser: robloxUser }
			}
			
			return { message: `Updated roblox rank to <@&${dbRank.id}> (taken from database)`, robloxUser: robloxUser }
		} 

		if (!MEMBER.roles.cache.some(role => role.id === dbRank.id)) {
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
			if (highestRank) {
				this.rank_id = highestRank.id
				this.save()
				const rank = await this.getRank()
				await noblox.setRank(groupId, robloxUser.robloxId, Number(rank.roblox_id)).catch((err) => {
					console.log(err)
					return { message: `Error: An error occured while trying to update the users's roblox rank! try again later!`, error: true, robloxUser: robloxUser }
				})
				if (rank.tag) {
					MEMBER.setNickname(rank.tag + " " + robloxUser.cachedUsername)
				}
				return { message: `Updated database and roblox rank to <@&${highestRank.id}> (taken from discord roles)`, robloxUser: robloxUser }
			}
			if (dbRank.tag) {
				MEMBER.setNickname(dbRank.tag + " " + robloxUser.cachedUsername)
			}
			return { message: `Updated discord rank to <@&${this.rank_id}> (taken from database)`, robloxUser: robloxUser }
		}

		return { robloxUser: robloxUser }
	}
});


module.exports = { Users, Channels, Servers, Ranks, Settings};