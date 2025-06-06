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
        },
        sealog_message_link: {
            type: DataTypes.STRING,
            defaultValue: null,
        },
        promolog_message_link: {
            type: DataTypes.STRING,
            defaultValue: null,
        },
        length: {
            type: DataTypes.INTEGER,
            defaultValue: null,
        },
        game: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        promopoints_rewarded: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        announcment_message: {
            type: DataTypes.STRING,
            defaultValue: null,
        },
    });
}