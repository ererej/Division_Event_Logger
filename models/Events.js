

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('events', {
        id: { 
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        guild_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
        },
        host : {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cohost: {
            type: DataTypes.STRING,
        },
        attendees: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount_of_attendees: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        officers: {
            type: DataTypes.STRING,
        },
        amount_of_officers: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }

    });
}