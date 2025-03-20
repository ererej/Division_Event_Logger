const mysql = require('mysql2/promise');
const config = require('./config.json');

async function checkConstraints() {
    const connection = await mysql.createConnection({
        host: config.productionDb.host,
        user: config.productionDb.username,
        password: config.productionDb.password,
        database: config.productionDb.database,
    });

    try {
        // Check for foreign key constraints
        const [foreignKeys] = await connection.query(`
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME 
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE 
                TABLE_SCHEMA = ? 
                AND REFERENCED_TABLE_NAME IS NOT NULL;
        `, [config.productionDb.database]);

        console.log('Foreign Key Constraints:', foreignKeys);

        // Check for check constraints
        const [checkConstraints] = await connection.query(`
            SELECT 
                TABLE_NAME, 
                CONSTRAINT_NAME, 
                CHECK_CLAUSE 
            FROM 
                INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
            WHERE 
                CONSTRAINT_SCHEMA = ?;
        `, [config.productionDb.database]);

        console.log('Check Constraints:', checkConstraints);

        // Check for triggers
        const [triggers] = await connection.query(`
            SELECT 
                TRIGGER_NAME, 
                EVENT_MANIPULATION, 
                EVENT_OBJECT_TABLE, 
                ACTION_STATEMENT 
            FROM 
                INFORMATION_SCHEMA.TRIGGERS 
            WHERE 
                TRIGGER_SCHEMA = ?;
        `, [config.productionDb.database]);

        console.log('Triggers:', triggers);
    } catch (error) {
        console.error('Error checking constraints:', error);
    } finally {
        await connection.end();
    }
}

checkConstraints();