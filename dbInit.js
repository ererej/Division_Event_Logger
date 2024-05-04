const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'mysql',
	logging: false,
});


/*const CurrencyShop = require('./models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);  */
require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
require('./models/Servers.js')(sequelize, Sequelize.DataTypes);
require('./models/Ranks.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');
//sequelize.sync()
/*
sequelize.sync({ force }).then(async () => {
	/*const shop = [
		CurrencyShop.upsert({ name: 'Tea', cost: 1 }),
		CurrencyShop.upsert({ name: 'Coffee', cost: 2 }),
		CurrencyShop.upsert({ name: 'Cake', cost: 5 }),
	];

	await Promise.all(shop); 
	sequelize.getQueryInterface().showAllSchemas().then((tableObj) => {
		console.log('// Tables in database','==========================');
		console.log(tableObj);
	})
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);*/