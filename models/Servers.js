module.exports = (sequelize, DataTypes) => {
    return sequelize.define('servers', {
        guild_id: {
            type: DataTypes.INTEGER,
            PrimaryKey: true,
        },
        group_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        exp: {
            type: DataTypes.INTEGER,
            default: 0,
        },
    });
}