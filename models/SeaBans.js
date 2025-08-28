module.exports = (sequelize, DataTypes) => {
    return sequelize.define('seaBans', {
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: true
        },
        banned_by: {
            type: DataTypes.STRING,
            allowNull: false
        },
        last_updated: {
            type: DataTypes.DATE,
            defaultValue: new Date(),
        },
        expires: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: new Date(),
        }
    });
}