module.exports = (sequelize, DataTypes) => {
    const Officers = sequelize.define('officers', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        guild_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        total_events_hosted: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        total_attendees: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        retired: {
            type: DataTypes.DATE,
            allowNull: true, // Nullable in case the officer is not retired
        },
    });

    Officers.associate = (models) => {
        // Each officer belongs to a single user
        Officers.belongsTo(models.Users, {
            foreignKey: 'user_id', // Key in `Officers` table linking to `Users`
            targetKey: 'user_id',
            as: 'user', // Alias to access the related user
        });
    };

    return Officers;
};
