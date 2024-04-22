const Sequelize = require('sequelize');

const sequelize = new Sequelize('s53_production_db', 'u53_jcAhI5EQK8', 'XHvZ8@uZ^WxqJ0jSKI4Kybxb', {
	host: '172.8.0.1',
	port: "3306",
	dialect: 'mysql',
	logging: false,
});


/*const CurrencyShop = require('./models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);  */
require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
require('./models/Servers.js')(sequelize, Sequelize.DataTypes);
require('./models/Ranks.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	/*const shop = [
		CurrencyShop.upsert({ name: 'Tea', cost: 1 }),
		CurrencyShop.upsert({ name: 'Coffee', cost: 2 }),
		CurrencyShop.upsert({ name: 'Cake', cost: 5 }),
	];

	await Promise.all(shop); */
	sequelize.getQueryInterface().showAllSchemas().then((tableObj) => {
		console.log('// Tables in database','==========================');
		console.log(tableObj);
	})
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);