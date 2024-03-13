const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const CurrencyShop = require('./models/CurrencyShop.js')(sequelize, Sequelize.DataTypes); /*pending deliteion*/ 
const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes); /*pending deliteion*/ 
const Servers = require('./models/Servers.js')(sequelize, Sequelize.DataTypes);
const Ranks = require('./models/Ranks.js')(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });
//Ranks.belongsTo(Servers, {foreignKey: 'guild_id', as: 'ranks'});

Ranks.belongsTo(() => server, {
	foreignKey: "guild_id",
	inverse: {
		as: rank,
		type: "hasOne"
	},
})

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

Reflect.defineProperty(Ranks.prototype, 'addRank', {
	value: async (discord_rank, roblox_id, promo_points, rank_index, is_officer) => {
		const division_rank = await Ranks.findOne({
			where: {discord_rank_id: this.discord_rank_id},
		});
		
		if (!division_rank) {
			return Ranks.create({ discord_rank_id: this.discord_rank.id, guild_id: this.discord_rank.guild, roblox_id: roblox_id, promo_points: promo_points, rank_index: rank_index, is_officer: is_officer/*send help idk what i'm doing plz fix. this is a fucntion to add a rank. becouse it dident know what .crate() is in add_ranks.js*/ })
		}
	}
});

Reflect.defineProperty(Users.prototype, 'getItems', {
	value: () => {
		return UserItems.findAll({
			where: { user_id: this.user_id },
			include: ['item'],
		});
	},
});

module.exports = { Users, CurrencyShop, UserItems, Servers, Ranks};