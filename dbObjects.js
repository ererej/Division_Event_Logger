const Sequelize = require('sequelize');
const config = require('./config.json');
const dbcredentoiols = process.argv.includes("--prod") || process.env.DATABASE === 'productiondb' ? config.productionDb : config.db;
const getNameOfPromoPoints = require("./utils/getNameOfPromoPoints.js")
const noblox = require("noblox.js")
const getRobloxUser = require("./utils/getRobloxUser.js")
const checkMilestone = require("./utils/checkMilestone.js")

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
const Events = require('./models/Events.js')(sequelize, Sequelize.DataTypes);
const Officers = require('./models/Officers.js')(sequelize, Sequelize.DataTypes);
const PremiumCodes = require('./models/PremiumCodes.js')(sequelize, Sequelize.DataTypes);
const SeaBans = require('./models/SeaBans.js')(sequelize, Sequelize.DataTypes);
const Milestones = require('./models/Milestones.js')(sequelize, Sequelize.DataTypes);

// Assign models to sequelize.models
const models = { sequelize, Users, Officers, Servers, Ranks, Channels, Settings, Events, PremiumCodes, SeaBans, Milestones };

// Manually call associate for each model (in case of circular dependencies)
Object.values(models).forEach((model) => {
    if (typeof model.associate === 'function') {
        model.associate(models);
    }
});

// Users.hasMany(Officers, { foreignKey: 'user_id', sourceKey: 'user_id', as: 'officers' });
// Officers.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'user_id', as: 'user', include: [{ model: Users, where: { guild_id: Sequelize.col('Officers.guild_id') } }] });


//Ranks.belongsTo(Servers, {foreignKey: 'guild_id', as: 'ranks'});
//Users.belongsTo(Ranks, {as: 'rank', foreignkey: 'id'})
//Ranks.belongsTo(Users , {foreignKey: 'rank', as: 'rank'})
/*
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
*/

Users.belongsTo(Ranks, { foreignKey: 'rank_id', as: 'rank' });
Ranks.hasMany(Users, { foreignKey: 'rank_id', as: 'users' });

Users.getUser = async function ({member, user_id, guild_id, groupId, robloxUser}) {
	if (!member && !user_id) {
		throw new Error("Missing member or user_id parameter in getUser")
	}
	if (!member && !guild_id) {
		throw new Error("Missing guild_id or member parameter in getUser")
	}
	let user = await Users.findOne({ where: { user_id: user_id ?? member.id, guild_id: guild_id ?? member.guild.id } });
	if (user) return user;
	user = await Users.create({ user_id: user_id ?? member.id, guild_id: guild_id ?? member.guild.id, promo_points: 0, rank_id: null, total_events_attended: 0, recruits: 0, recruted_by: null, events: "", CoHosts: 0, officer: false });
	
	if (!groupId) {
		const server = await Servers.findOne({ where: { guild_id: guild_id ?? member.guild.id } });
		groupId = server.group_id;
	}
	if (!member) {
		return null
	}
	await user.updateRank(groupId, member, robloxUser)
	if (user.rank_id == null) {
		user = null
	}
	return user;
}

Reflect.defineProperty(Users.prototype, 'updateOfficer', {
	value: async function(rank) {
		rank = rank ? rank : await this.getRank()
		let officer = await Officers.findOne({ where: { user_id: this.user_id, guild_id: this.guild_id, retired: null } })
		this.officer = rank.is_officer
		if (rank.is_officer ) {
			if (!officer) {
				officer = await Officers.create({ user_id: this.user_id, guild_id: this.guild_id, retired: null })
			}
		} else {
			if (officer) {
				officer.retired = new Date()
				await officer.save()
				officer = null
			}
		}
		await this.save()
		if((rank.is_officer && !officer )|| (!rank.is_officer && officer)) console.log("Error: officer was not updated correctly!")
		return officer ? (officer.retired === null ? officer : null) : null
	}
});

Reflect.defineProperty(Users.prototype, 'updateLinkedRoles', {
	value: async function(member, rank, oldRank) {
		if (!rank) {
			rank = await this.getRank()
			if (!rank) {
				return { message: "Error: User's rank was not found in the database!", error: true}
			}
		}
		if (!member) {
			throw new Error("Missing member parameter in updateLinkedRoles")
		}
		let removedRoles = []
		let addedRoles = []
		let smallErrors = []

		if (rank.linked_roles) {
			const roles = member.roles.cache
			rank.linked_roles.forEach(role => {
				if (!roles.some(r => r.id == role)) {
					member.roles.add(role).catch(err => {
						if (err.message === "Unknown Role") {
							smallErrors.push(`Error: Missing role. ${member} got promoted to rank whos linked role seems to have been deleted! The missing role might lead to a lot of problems(the roblox rank and database was still updated), please contact Ererej(The developer of this bot) for help!`)
						} else if (err.message === "Missing Permissions") {
							smallErrors.push(`Error: Missing permissions. failed to add the role <@&${rank.id}> to ${member}! I dont have permissions to add the role!`)
						} else {
							console.log(err)
						return { message: `Error: An error occured while trying to update the users's discord rank! (The Roblox rank was still updated) Error: ${err}`, error: true, robloxUser: robloxUser }
						}
					})
					addedRoles.push(role)
				}
			})
			
		}
		if (oldRank) {
			if (oldRank.linked_roles) {
				oldRank.linked_roles.forEach(role => {
					if (!rank.linked_roles.includes(role)) {
						member.roles.remove(role)
						removedRoles.push(role)
					}
				})
			}
		} else {
			const allRanks = await Ranks.findAll({ where: { guild_id: this.guild_id } })
			
			allRanks.forEach(otherRank => {
				if (!otherRank.linked_roles) return
				otherRank.linked_roles.forEach(role => {
					if (!rank.linked_roles.includes(role) && !removedRoles.includes(role)) {
						if (member.roles.cache.some(tempRole => tempRole.id == role) ) {
							removedRoles.push(role)
							member.roles.remove(role)
						}
					}
					
				})
			})
		}
		return { addedRoles: addedRoles, removedRoles: removedRoles, smallErrors: smallErrors}
	}
});


Reflect.defineProperty(Users.prototype, 'updateTag', {
	value: async function(member, rank, robloxUser) {
		if (!rank) {
			rank = await this.getRank()
			if (!rank) {
				return { message: "Error: User's rank was not found in the database!", error: true}
			}
		}
		if (!member) {
			throw new Error("Missing member parameter in updateTag")
		}
		if (rank.tag) {
			if( member.nickname && member.nickname.startsWith(rank.tag[0]) && member.nickname.includes(rank.tag[rank.tag.length - 1])) {
				// Find where the tag ends in the nickname
				const tagEndIndex = member.nickname.indexOf(rank.tag[rank.tag.length - 1]) + 1;
				
				// Get everything after the tag
				const nameAfterTag = member.nickname.substring(tagEndIndex).trim();
				
				member.setNickname(rank.tag + " " + nameAfterTag).catch(err => {
					return { message: `Error: An error occured while trying to update the users's tag! Error: ${err}`, error: true }
				})
				console.log("smart tag update: updated tag to: " + rank.tag + " " + nameAfterTag)
			} else if (robloxUser) {
				const startTime = Date.now()
				const robloxPlayer = await noblox.getUserInfo(robloxUser.robloxId + "").catch(err => {
					console.log(err)
					return { message: `Error: An error occured while trying to get the roblox player! Error: ${err}`, error: true}
				})
				console.log("Time taken to get roblox player: " + (Date.now() - startTime) + "ms")
				
				await member.setNickname(rank.tag + " " + robloxPlayer.name).catch(err => {
					return { message: `Error: An error occured while trying to update the users's tag! Error: ${err}`, error: true }
				})
			
			} else {
				await member.setNickname(rank.tag + " discord name! " + member.user.displayName).catch(err => {
					return { message: `Error: An error occured while trying to update the users's tag! Error: ${err}`, error: true }
				})
			}
			return rank.tag
		} 
	}
});

Reflect.defineProperty(Users.prototype, 'getRobloxUser', {
	value: async function() {
		const robloxUser = await getRobloxUser({memberId: this.user_id, guildId: this.guild_id})
			if (robloxUser.error) {
				return { message: robloxUser.error, error: true}
			}
	
		if (!(robloxUser.status + "").startsWith("2")) {
			if (robloxUser.status === 404) {
				return { error: `<@${this.user_id}> needs to verify using rover!`}
			}
			console.log(robloxUser)
			return { Error: `Error: An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`}
		}
		return { robloxUser: await robloxUser.json()}
	}
})

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

Reflect.defineProperty(Users.prototype, 'promote', {
	value: async function(groupId, MEMBER, ranks, promotions, robloxUser, milestoneData) {
		const rank = await this.getRank();
		if (!ranks) {
			ranks = await Ranks.findAll({ where: { guild_id: MEMBER.guild.id }})
		}
		ranks = ranks.sort((a, b) => a.rank_index - b.rank_index)
		let membersRankIndexInRanks;
		ranks.some(function(tempRank, i) {
			if (tempRank.id == rank.id) {
				membersRankIndexInRanks = i;
				return true;
			}
		});

		if (membersRankIndexInRanks + promotions >= ranks.length) {
            return {message: "\nYou can't promote someone to a rank higher than the highest rank!", error: true};
		}
		const botHighestRole = interaction.guild.members.cache.get("1201941514520117280").roles.highest;
		const targetRole = interaction.guild.roles.cache.get(ranks[membersRankIndexInRanks + promotions].id);

		if (botHighestRole.comparePositionTo(targetRole) <= 0) {
			return {message: "\nI can't promote someone to a role higher than or equal to my highest role!", error: true};
		}

		const setRankResult = await this.setRank(groupId, MEMBER, ranks[membersRankIndexInRanks + promotions], robloxUser, milestoneData).catch((err) => {
			return {message: "\nAn error occured while trying to promote the user!", error: true};
		})
		return { message: setRankResult.message, robloxUser: robloxUser, milestoneResponces: setRankResult.milestoneResponces ?? []}
	}
});

Reflect.defineProperty(Users.prototype, 'addPromoPoints', { //! make the it return errors with retrun { error: "error message"}
	//todo make the input be an object 
	value: async function(groupId, MEMBER, ranks, promotions, robloxUser, milestoneData = {ranks: []}) {
		milestoneData.ranks = ranks
		const nameOfPromoPoints = await getNameOfPromoPoints(undefined, MEMBER.guild.id, Settings)
		let rank = await this.getRank()
		if (!rank) {
			return { message: "Error: User's rank was not found in the database!", error: true}
		}
		if (!ranks) {
			ranks = await Ranks.findAll({ where: { guild_id: MEMBER.guild.id }})
		}
		ranks = ranks.sort((a, b) => a.rank_index - b.rank_index)

		const promo_points_before = this.promo_points
		let responce = "";
		let showPromoPoints = true;
		let milestoneResponces = []
		
		let rankIndexInRanks;
		ranks.some(function(tempRank, i) {
			if (tempRank.id == rank.id) {
				rankIndexInRanks = i;
				return true;
			}
		});
		const RankIndexInRanksBefore = rankIndexInRanks

		if (typeof promotions !== "number" ){
			promotions = parseInt(promotions)
			if (isNaN(promotions)) {
				console.log("promotions was not a number?!?!?")
				return { message: "Error: promotions was not a number!", error: true, robloxUser: robloxUser }
			}
		}

		this.promo_points += promotions
		let nextRank = ranks[rankIndexInRanks + 1]
		while (true) {
			rank = await this.getRank()

			showPromoPoints = true
			
			rankIndexInRanks += 1
			if (nextRank) {
				if (nextRank.obtainable === false) {
					const rankAboveBefore = ranks[RankIndexInRanksBefore + 1] ?? {promo_points: "∞"}
					this.save()
					return { message: responce + "Can not be promoted with " + nameOfPromoPoints + "!" + `\n${nameOfPromoPoints} went from ***${promo_points_before}**/${rankAboveBefore.promo_points != "∞" ? (!rankAboveBefore.is_officer ? rankAboveBefore.promo_points : "∞") : "∞"}* to ***${this.promo_points}**/∞*!`, error: true, robloxUser: robloxUser }
				}
				if (this.promo_points >=  nextRank.promo_points) {
					//todo could be better to only do this.setRank at the end when we know its the final rank to speed up the process
					const setRankResult = await this.setRank(groupId, MEMBER, nextRank, robloxUser, milestoneData).catch((err) => {
						console.log(err)
						this.save()
						return { message: `An error occured while trying to promote the user! The user ended up with ${this.promo_points} ${nameOfPromoPoints} and the rank <@&${rank.id}>!`, error: true, robloxUser: robloxUser }
					});
					robloxUser = setRankResult.robloxUser
					responce += setRankResult.message;
					milestoneResponces.push(...setRankResult.milestoneResponces ?? [])
					this.promo_points -= nextRank.promo_points
					nextRank = ranks[rankIndexInRanks + 1]
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
			responce += `${nameOfPromoPoints} went from ***${promo_points_before}**/${rankAboveBefore.promo_points != "∞" ? (!rankAboveBefore.is_officer ? rankAboveBefore.promo_points : "∞") : "∞"}* to ***${this.promo_points}**/${nextRank ? (!nextRank.is_officer ? nextRank.promo_points : "∞") : "∞"}*!`
		}
		return { message: responce, robloxUser: robloxUser, milestoneResponces: milestoneResponces }
	}
});

Reflect.defineProperty(Users.prototype, 'removePromoPoints', {
	value: async function(groupId, MEMBER, ranks, demotions, robloxUser, milestoneData = {ranks: []}) {
		milestoneData.ranks = ranks

		const nameOfPromoPoints = await getNameOfPromoPoints(undefined, MEMBER.guild.id, Settings)
		let rank = await this.getRank()
		if (!rank) {
			return "Error: User's rank was not found in the database!"
		}
		ranks = ranks.sort((a, b) => a.rank_index - b.rank_index)

		const promo_points_before = this.promo_points
		let responce = "";
		let milestoneResponces = []
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

		
		if (typeof demotions !== "number" ){
			demotions = parseInt(demotions)
			if (isNaN(demotions)) {
				console.log("demotions was not a number?!?!?")
				return { message: "Error: demotions was not a number!", error: true, robloxUser: robloxUser }
			}
		}

		while (demotions > 0) {
			rank = await this.getRank()

			showPromoPoints = true
			if (demotions > this.promo_points) {
				demotions -= this.promo_points + 1
				nextRank = ranks[rankIndexInRanks - 1]
				if (nextRank) {
					if (nextRank.obtainable === false) {
						return { message: responce + "Can not be demoted with " + nameOfPromoPoints + "!", error: true }
					}
					if (rank.promo_points > 0) {
						this.promo_points = rank.promo_points - 1
					} else {
						this.promo_points = 0
					}
					const setRankResult = await this.setRank(groupId, MEMBER, nextRank, robloxUser, milestoneData).catch((err) => {
						console.log(err)
						return { message: `Error: An error occured while trying to demote the user!	The user ended up with ${this.promo_points} ${nameOfPromoPoints} and the rank <@&${rank.id}>!`, error: true }
					})
					robloxUser = setRankResult.robloxUser
					responce += setRankResult.message + (this.promo_points != 0 ? ` and (**${this.promo_points}**/${rank.promo_points}) ${nameOfPromoPoints}` : "")
					milestoneResponces.push(...setRankResult.milestoneResponces ?? [])
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
				this.promo_points -= demotions
				showPromoPoints = true
				demotions = 0
			}
		}
		this.save()
		if (showPromoPoints) {
			const rankAbove = ranks[rankIndexInRanks + 1]
			const rankAboveBefore = ranks[RankIndexInRanksBefore + 1] ?? {promo_points: "∞"}
			responce += (responce ? "\n" : "") + `${nameOfPromoPoints} went from ***${promo_points_before}**/${rankAboveBefore ? (rankAboveBefore.promo_points != "∞" ? (!rankAboveBefore.is_officer ? rankAboveBefore.promo_points : "∞") : "∞") : "∞"}* to ***${this.promo_points}**/${rankAbove ? (rankAbove.promo_points != "∞" ? (!rankAbove.is_officer ? rankAbove.promo_points: "∞") : "∞") : "∞"}*!`
		}
		return { message: responce, robloxUser: robloxUser, milestoneResponces: milestoneResponces}
	}
});


Reflect.defineProperty(Users.prototype, 'setRank', { //! make the it return errors with retrun { error: "error message"}
	value: async function(groupId, MEMBER, rank, robloxUser, milestoneData) {
		if (!robloxUser) {
			robloxUser = await getRobloxUser({MEMBER: MEMBER})
			if (robloxUser.error) {
				return { message: robloxUser.error, error: true}
			}
		
			if (!(robloxUser.status + "").startsWith("2")) {
				if (robloxUser.status === 404) {
					return { message: `<@${this.user_id}> needs to verify using rover!`, error: true}
				}
				console.log(robloxUser)
				return { message: `Error: An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`, error: true}
			}
			robloxUser = await robloxUser.json()
		}
		let smallErrors = []

		await noblox.setRank(groupId, robloxUser.robloxId, Number(rank.roblox_id)).catch((err) => {
			switch (err.code) {
				case 400: //the user already had the target rank in the roblox group
					console.log("invalid roblox rank")
					break
				case 403:	//the bot does not have permissions to change the rank
					console.log("missing permissions in roblox group")
					smallErrors.push(`Error: The bot does not have permissions to change the roblox rank! Please give *Division_helper* permissions to change members ranks and make sure its rank is high up in the higharky! The rank was changed on discord and the bots database but not on roblox! When you have given the bot the perms simply run /updateuser <@${member.id}> and the roblox rank will be fixed!`)
					break;
				default:
					console.log(err)
					return { message: `Error: An error occured while trying to update the users's roblox rank! Error: ${err}`, error: true, robloxUser: robloxUser }
			}
		})
		
		let oldRank = this.rank_id
		//add a check to see if the bot has perms to change the rank
		if (MEMBER.roles.cache.some(role => role.id === oldRank)) {
			await MEMBER.roles.remove(oldRank).catch(err => {
				if (err.message === "Unknown Role") {
					smallErrors.push(`Error: Missing role. ${MEMBER} got promoted from a rank whos role seems to have been deleted! The missing role might lead to a lot of problems, please contact Ererej(The developer of this bot) for help!`)
				} else if (err.message === "Missing Permissions") {
					smallErrors.push(`Error: Missing permissions. Failed to remove the role <@&${oldRank}> from ${MEMBER}! Please give the bot permissions to change roles!(the changes will still be made to the database and roblox group)`)
				} else {
				console.log(err)
				return { message: `Error: An error occured while trying to update the users's discord rank! (The Roblox rank was still updated) Error: ${err}`, error: true, robloxUser: robloxUser }
				}
			})
		}
		
		if (!MEMBER.roles.cache.some(role => role.id === rank.id)) {
			await MEMBER.roles.add(rank.id).catch(err => {
				if (err.message === "Unknown Role") {
					smallErrors += `Error: Missing role. ${MEMBER} got promoted to a rank whos role seems to have been deleted! The missing role might lead to a lot of problems(the roblox rank and database was still updated), please contact Ererej(The developer of this bot) for help!`
				} else if (err.message === "Missing Permissions") {
					smallErrors += `Error: Missing permissions. failed to add the role <@&${rank.id}> to ${MEMBER}! I dont have permissions to add the role! The roblox rank and database was still updated!`
				} else {
				console.log(err)
				return { message: `Error: An error occured while trying to update the users's discord rank! (The Roblox rank was still updated) Error: ${err}`, error: true, robloxUser: robloxUser }
				}
			})
		}
		const updateTagResponce = await this.updateTag(MEMBER, rank, robloxUser)
		this.rank_id = rank.id
		await this.updateOfficer(rank)
		await this.save()
	
		const checkMemberRankReachedMilestoneResponce = await checkMilestone({db: models, type: "member_rank_reached", member: MEMBER, dbUser: this, milestones: milestoneData.milestones, guildsMilestones: milestoneData.guildsMilestones, ranks: milestoneData.ranks, robloxUser: robloxUser, milestoneLogs: milestoneData.milestoneLogs})
		const checkRecruitRankReachedMilestoneResponce = await checkMilestone({db: models, type: "recruit_rank_reached", member: MEMBER, dbUser: this, milestones: milestoneData.milestones, guildsMilestones: milestoneData.guildsMilestones, ranks: milestoneData.ranks, robloxUser: robloxUser, milestoneLogs: milestoneData.milestoneLogs})
		const milestoneResponces = [...checkMemberRankReachedMilestoneResponce.milestones, ...checkRecruitRankReachedMilestoneResponce.milestones].filter(r => r != null)
		oldRank = await Ranks.findOne({ where: { id: oldRank } })
		const updateLinkedRolesResponce = await this.updateLinkedRoles(MEMBER, rank, oldRank)
		return { milestoneResponces: milestoneResponces, oldRank: oldRank, newRank: rank, smallError: smallErrors, addedLinkedRoles: updateLinkedRolesResponce.addedRoles, removedLinkedRoles: updateLinkedRolesResponce.removedRoles, robloxUser: robloxUser, message: `Promoted from <@&${oldRank.id}> to <@&${rank.id}> ` + (smallErrors ? smallErrors.join("\n") : "") + (updateLinkedRolesResponce.addedRoles.length ? `Added linked role(s): <@&` + updateLinkedRolesResponce.addedRoles.join("> <@&") + ">" : "") + (updateLinkedRolesResponce.removedRoles.length ? `Removed linked role(s): <@&` + updateLinkedRolesResponce.removedRoles.join("> <@&") + ">" : "") + (updateTagResponce ? " Tag got updated to: **" + updateTagResponce + "**" : "") }
	}
});

Reflect.defineProperty(Users.prototype, 'updateRank', {
	/**
	 * 
	 * @param {string} groupId 
	 * @param {object} MEMBER 
	 * @returns 
	 */
	value: async function(groupId, MEMBER /* guildmember */, robloxUser, ranks ) {
		//find the users roblox account
		if (!robloxUser) {
			robloxUser = await getRobloxUser({MEMBER: MEMBER, memberId: this.user_id})
			if (robloxUser.error) {
				return { message: robloxUser.error, error: true}
			}
		}
		if (!(robloxUser.status + "").startsWith("2")) {
			if (robloxUser.status === 404) {
				return `Error: needs to verify using rover!`;
			}
			console.log(robloxUser)
			return { message: `Error: An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`, error: true}
		}
		robloxUser = await robloxUser.json()
		if (!robloxUser.robloxId) {
			return { message: `Error: could not find roblox user linked to <@${this.user_id}>!`, error: true}
		}
		// find rank from database
		let dbRank;
		if (this.rank_id) {
			dbRank = await Ranks.findOne({ where: { id: this.rank_id } })
		}
		if (!ranks) {
			ranks = await Ranks.findAll({ where: { guild_id: MEMBER.guild.id }})
		}
		const usersGroups = await noblox.getUserGroups(robloxUser.robloxId)
		const robloxGroup = usersGroups.find(group => group.group.id === groupId)
		if (!robloxGroup) {
			return { message:`Error: is not in the group!`, notInGroup: true,  error: true, robloxUser: robloxUser }
		}
		const rankFromRoblox = ranks.find(rank => rank.roblox_id == robloxGroup.role.id)
		if (!rankFromRoblox) {
			return { message: `Error: The roblox rank ${robloxGroup.role.name} is not linked! please get a admin to link it using /addrank!`, error: true, robloxUser: robloxUser }
		}

		if (!dbRank) {
			
			let highestRank;
			ranks.forEach(rank => {
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
				await this.updateOfficer(rankFromRoblox)
				await this.updateTag(MEMBER, rankFromRoblox, robloxUser)
				await this.updateLinkedRoles(MEMBER, rankFromRoblox)
				return { rank: rankFromRoblox, message: `added to the database with the rank <@&${this.rank_id}> (taken from roblox group rank)`, robloxUser: robloxUser }
			}
			this.rank_id = highestRank.id
			this.save()
			await this.updateOfficer(highestRank)
			await this.updateTag(MEMBER, highestRank, robloxUser)
			await this.updateLinkedRoles(MEMBER, highestRank)
			if (highestRank.roblox_id != rankFromRoblox.roblox_id) {
				await noblox.setRank(groupId, robloxUser.robloxId, Number(highestRank.roblox_id)).catch((err) => {
					if (err.message === "You do not have permission to manage this user.") {
						return { message: `Error: The bot does not have permissions to change the roblox rank! Please give *Division_helper* permissions to change members ranks and make sure its rank is high up in the higharky! The rank was changed on discord and the bots database but not on roblox! When you have given the bot the perms simply run /updateuser <@${member.id}> and the roblox rank will be fixed!`, error: true, robloxUser: robloxUser }
					}
					console.log(err)
					return { message: `Error: An error occured while trying to update the users's roblox rank! try again later!`, error: true, robloxUser: robloxUser }
				})
			}
			return { rank: highestRank, message: `added to the database with the rank <@&${this.rank_id}> (taken from discord roles)`, robloxUser: robloxUser }
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
				if (!highestRank) {
					return { message: `Error: help! something went very wrong!`, error: true, robloxUser: robloxUser }
				}
				this.rank_id = highestRank.id
				this.save()
				await this.updateOfficer(highestRank)
				await this.updateTag(MEMBER, highestRank, robloxUser)
				await this.updateLinkedRoles(MEMBER, highestRank)
				const rank = await this.getRank()
				if (rank.roblox_id != rankFromRoblox.roblox_id) {
					await noblox.setRank(groupId, robloxUser.robloxId, Number(rank.roblox_id)).catch((err) => {
						if (err.message === "You do not have permission to manage this user.") {
							return { message: `Error: The bot does not have permissions to change the roblox rank! Please give *Division_helper* permissions to change members ranks and make sure its rank is high up in the higharky! The rank was changed on discord and the bots database but not on roblox! When you have given the bot the perms simply run /updateuser <@${member.id}> and the roblox rank will be fixed!`, error: true, robloxUser: robloxUser }
							}
						console.log(err)
						return { message: `Error: An error occured while trying to update the users's roblox rank! try again later!`, error: true, robloxUser: robloxUser }
					})
					return { rank: highestRank, message: `Updated roblox and database rank to <@&${rank.id}> (taken from discord roles)`, robloxUser: robloxUser }
				}
				return { rank: highestRank, message: `Updated database rank to <@&${rank.id}> (taken from discord roles)`, robloxUser: robloxUser }
			} else {
				await this.updateOfficer(dbRank)
				await this.updateTag(MEMBER, dbRank, robloxUser)
				await this.updateLinkedRoles(MEMBER, dbRank)
				
				await noblox.setRank(groupId, robloxUser.robloxId, Number(dbRank.roblox_id)).catch((err) => {
					if (err.message === "You do not have permission to manage this user.") {
						return { message: `Error: The bot does not have permissions to change the roblox rank! Please give *Division_helper* permissions to change members ranks and make sure its rank is high up in the higharky! The rank was changed on discord and the bots database but not on roblox! When you have given the bot the perms simply run /updateuser <@${member.id}> and the roblox rank will be fixed!`, error: true, robloxUser: robloxUser }
					}
					console.log(err)
					return { message: `Error: An error occured while trying to update the users's roblox rank! try again later!`, error: true, robloxUser: robloxUser }
				})
				return { rank: dbRank, message: `Updated roblox rank to <@&${dbRank.id}> (taken from database)`, robloxUser: robloxUser }
			}
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
					if (err.message === "You do not have permission to manage this user.") {
						return { message: `Error: The bot does not have permissions to change the roblox rank! Please give *Division_helper* permissions to change members ranks and make sure its rank is high up in the higharky! The rank was changed on discord and the bots database but not on roblox! When you have given the bot the perms simply run /updateuser <@${MEMBER.id}> and the roblox rank will be fixed!`, error: true, robloxUser: robloxUser }
					}
					console.log(err)
					return { message: `Error: An error occured while trying to update the users's roblox rank! try again later!`, error: true, robloxUser: robloxUser }
				})
				await this.updateTag(MEMBER, rank, robloxUser)
				await this.updateOfficer(rank)
				await this.updateLinkedRoles(MEMBER, rank, dbRank)
				return { rank: highestRank, message: `Updated database and roblox rank to <@&${highestRank.id}> (taken from discord roles)`, robloxUser: robloxUser }
			}
			await this.updateTag(MEMBER, dbRank, robloxUser)
			await this.updateOfficer(dbRank)
			await this.updateLinkedRoles(MEMBER, dbRank)
			MEMBER.roles.add(dbRank.id)
			return { rank: dbRank, message: `Updated discord rank to <@&${this.rank_id}> (taken from database)`, robloxUser: robloxUser }
		}

		//TEMPORARY REMOVE WHEN function uses User.prototype.setRank()
		await this.updateOfficer(dbRank)
		await this.updateTag(MEMBER, dbRank, robloxUser)
		const updateLinkedRolesResponce = await this.updateLinkedRoles(MEMBER, dbRank)
		if (updateLinkedRolesResponce.addedRoles.length || updateLinkedRolesResponce.removedRoles.length) {
			return { rank: dbRank, message: (updateLinkedRolesResponce.addedRoles.length >= 1 ? `Added linked role(s): <@&` + updateLinkedRolesResponce.addedRoles.join("> <@&") + ">" : "") + (updateLinkedRolesResponce.removedRoles.length ? `Removed linked role(s): <@&` + updateLinkedRolesResponce.removedRoles.join("> <@&") + ">" : ""), robloxUser: robloxUser }
		}

		return { rank: dbRank, robloxUser: robloxUser }
	}
});


module.exports = models;