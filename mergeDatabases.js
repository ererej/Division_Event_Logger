const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config.json');

// Connect to the current database
const currentDb = new Sequelize(config.productionDb.database, config.productionDb.username, config.productionDb.password, {
    host: config.productionDb.host,
    dialect: 'mysql',
    logging: false,
});

// Connect to the temporary old database
const oldDb = new Sequelize('old_division_event_logger_db', "root", "", {
    host: "localhost",
    dialect: 'mysql',
    logging: false,
});

// Define your models for both databases
const Officer = currentDb.define('Channels', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    channel_id: {
        type: DataTypes.STRING,
    },
    guild_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
    },
    updatedAt: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'Channels',
    timestamps: false,
});

const OldOfficer = oldDb.define('Channels', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    channel_id: {
        type: DataTypes.STRING,
    },
    guild_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
    },
    updatedAt: {
        type: DataTypes.DATE,
    },

}, {
    tableName: 'Channels',
    timestamps: false,
});

async function mergeDatabases() {
    try {
        await currentDb.authenticate();
        await oldDb.authenticate();
        console.log('Connection has been established successfully.');

        // Fetch all officers from the old database
        const oldOfficers = await OldOfficer.findAll();

        for (const oldOfficer of oldOfficers) {
            // Check if the officer already exists in the current database
            const existingOfficer = await Officer.findOne({ where: { id: oldOfficer.id } });

            if (existingOfficer) {
                

                // Log the old and new dates for debugging
                console.log(`Updating officer ID ${oldOfficer.id}`);
                console.log(`Old createdAt: ${oldOfficer.createdAt}, New createdAt: ${existingOfficer.createdAt}`);

                // Convert dates to MySQL format
                //const createdAt = existingOfficer.createdAt ? existingOfficer.createdAt : new Date(oldOfficer.createdAt).toISOString().slice(0, 19).replace('T', ' ');
                const updatedAt = new Date(oldOfficer.updatedAt).toISOString().slice(0, 19).replace('T', ' ');

                const createdAt =  new Date(oldOfficer.createdAt).toISOString().slice(0, 19).replace('T', ' ');
                    
                existingOfficer.createdAt = createdAt;

                await existingOfficer.save();

                // Update the existing officer with data from the old officer
                await existingOfficer.update({
                    id: oldOfficer.id,
                    channel_id: oldOfficer.channel_id,
                    guild_id: oldOfficer.guild_id,
                    type: oldOfficer.type,

                    createdAt: createdAt,
                    updatedAt: updatedAt,
                });
                console.log(`Updated officer ID ${oldOfficer.id} createdAt to ${createdAt}`);
            } else {
                // Create a new officer in the current database with data from the old officer
                await Officer.create({
                    id: oldOfficer.id,
                    channel_id: oldOfficer.channel_id,
                    guild_id: oldOfficer.guild_id,
                    type: oldOfficer.type,
                    createdAt: oldOfficer.createdAt,
                    updatedAt: oldOfficer.updatedAt,
                });
                console.log(`Created new officer ID ${oldOfficer.id}`);
            }
        }

        console.log('Database merge completed.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await currentDb.close();
        await oldDb.close();
    }
}

mergeDatabases();