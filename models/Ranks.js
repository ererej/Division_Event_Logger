module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ranks', {
        id: { //the discord rank id
            type: DataTypes.STRING,
            primaryKey: true,
        },
        guild_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        roblox_id: {
            type: DataTypes.STRING,
            allowNull: false /*change to false when implomenting roblox group link*/
        },
        promo_points: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        rank_index: {
            type: DataTypes.INTEGER,
        },
        is_officer: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        } 
    });
}