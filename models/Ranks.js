module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ranks', {
        discord_rank_id: {
            type: DataTypes.STRING,
            PrimaryKey: true,
        },
        guild_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        roblox_id: {
            type: DataTypes.INTEGER,
            allowNull: true /*change to false when implomenting roblox group link*/
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