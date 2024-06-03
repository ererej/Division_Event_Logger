module.exports = (sequelize, DataTypes) => {
    const Channel = sequelize.define('Channels', {
        id: { //the discord channel id
            type: DataTypes.STRING,
            primaryKey: true,
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