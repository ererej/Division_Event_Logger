const mysql = require('mysql2/promise');
const config = require('./config.json');

async function checkPermissions() {
    const connection = await mysql.createConnection({
        host: config.productionDb.host,
        user: config.productionDb.username,
        password: config.productionDb.password,
        database: config.productionDb.database,
    });

    try {
        const [rows] = await connection.query('SHOW GRANTS FOR CURRENT_USER()');
        console.log('Permissions:', rows);
    } catch (error) {
        console.error('Error checking permissions:', error);
    } finally {
        await connection.end();
    }
}

checkPermissions();