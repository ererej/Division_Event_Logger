const Sequelize = require('sequelize');
const config = require('./config.json');
const dbcredentoiols = config.host == "server" ? config.productionDb : config.db;

const sequelize = new Sequelize(dbcredentoiols.database, dbcredentoiols.username, dbcredentoiols.password, {
	host: dbcredentoiols.host,
	dialect: 'mysql',
	logging: false,
});


require('./models/Channels.js')(sequelize, Sequelize.DataTypes);
require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/Servers.js')(sequelize, Sequelize.DataTypes);
require('./models/Ranks.js')(sequelize, Sequelize.DataTypes);
require('./models/Settings.js')(sequelize, Sequelize.DataTypes);
require('./models/Events.js')(sequelize, Sequelize.DataTypes);
require('./models/Officers.js')(sequelize, Sequelize.DataTypes);
require('./models/PremiumCodes.js')(sequelize, Sequelize.DataTypes);
require('./models/SeaBans.js')(sequelize, Sequelize.DataTypes);
require('./models/Milestones.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	// const shop = [
	// 	CurrencyShop.upsert({ name: 'Tea', cost: 1 }),
	// 	CurrencyShop.upsert({ name: 'Coffee', cost: 2 }),
	// 	CurrencyShop.upsert({ name: 'Cake', cost: 5 }),
	// ];

	// await Promise.all(shop); 
	sequelize.getQueryInterface().showAllSchemas().then((tableObj) => {
		console.log('// Tables in database','==========================');
		console.log(tableObj);
	})
	console.log('Database synced');

	
}).catch(console.error);

const alter = process.argv.includes('--alter') || process.argv.includes('-a');

sequelize.sync({ alter }).then(async () => {
	sequelize.getQueryInterface().showAllSchemas().then((tableObj) => {
		console.log('// Tables in database','==========================');
		console.log(tableObj);
	})
	console.log('Database synced');
}).catch(console.error);