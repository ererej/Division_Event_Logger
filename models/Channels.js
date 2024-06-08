module.exports = (sequelize, DataTypes) => {
    const Channel = sequelize.define('Channels', {
        id: {
            type: DataTypes.INTEGER,
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
    });  
    return Channel
}