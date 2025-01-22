module.exports = (sequelize, DataTypes) => {
    return sequelize.define('servers', {
        guild_id: {
            type: DataTypes.STRING,
            PrimaryKey: true,
        },
        group_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            default: null,
        },
        exp: {
            type: DataTypes.INTEGER,
            default: 0,
        },
        premium_end_date: {
            type: DataTypes.DATE,
            default: null,
        },
    });
}