module.exports = (sequelize, Datatypes ) => {

    const Milestones = sequelize.define('Milestones', {
        guild_id: {
            type: Datatypes.STRING,
            allowNull: false
        },
        custom_name: {
            type: Datatypes.STRING,
            allowNull: false
        },
        milestone_type: {
            type: Datatypes.STRING,
            allowNull: false
        },
        condition_type: {
            type: Datatypes.STRING,
            allowNull: false
        },
        condition_config: {
            type: Datatypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        repeating: {
            type: Datatypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        reward_type: {
            type: Datatypes.STRING,
            allowNull: false
        },
        reward: {
            type: Datatypes.STRING,
            allowNull: false
        },
        ping: {
            type: Datatypes.STRING,
            allowNull: true
        },
        max_rank: {
            type: Datatypes.STRING,
            allowNull: true
        },
        min_rank: {
            type: Datatypes.STRING,
            allowNull: true
        },
        applies_to_officers: {
            type: Datatypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    });

    return Milestones;
}