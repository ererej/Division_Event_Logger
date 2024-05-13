module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
		},
		roblox_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		guild_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		promo_points: {
			type: DataTypes.INTEGER,
		},
		rank_id: {
			type: DataTypes.STRING
		},
		total_events_attended: {
			type: DataTypes.INTEGER
		},
		recruted_by: {
			type: DataTypes.STRING
		}
	}, {});
	/*User.associate = function(models) {

	}*/

	return User
};