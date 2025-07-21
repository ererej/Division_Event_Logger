module.exports = (sequelize, DataTypes) => {
	const Users = sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
		},
		guild_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		promo_points: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		rank_id: {
			type: DataTypes.STRING
		},
		total_events_attended: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		recruted_by: {
			type: DataTypes.STRING,
			defaultValue: null,
		},
		events: {
			type: DataTypes.STRING(1000),
			defaultValue: '',
		},
		Cohosts: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		recruits: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		officer: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	});
	Users.associate = (models) => {
        // Define one-to-many relationship (a user can have multiple officers)
        Users.hasMany(models.Officers, {
            foreignKey: 'user_id', // Key in `Officers` table that references `Users`
            sourceKey: 'user_id',
            as: 'officers', // Alias to access related officers
        });
    };
	

	return Users
};