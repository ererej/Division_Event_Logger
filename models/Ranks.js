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
        },
        tag: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        obtainable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        linked_roles: {
            type: DataTypes.STRING,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('linked_roles');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('linked_roles', JSON.stringify(value));
            },
        },
    });
}