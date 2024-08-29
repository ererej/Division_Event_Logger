module.exports = (sequelize, DataTypes) => {
    return sequelize.define('settings', {
        guild_id: {
            type: DataTypes.STRING,
            PrimaryKey: false,
        },
        type: {
            type: DataTypes.STRING,
        },
        config: {
            type: DataTypes.STRING,
        },
    });
}