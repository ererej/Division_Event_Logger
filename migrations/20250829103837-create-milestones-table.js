'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('milestones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      guild_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      milestone_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      condition: {
        type: Sequelize.STRING,
        allowNull: false
      },
      repeating: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      reward_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reward: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ping: {
        type: Sequelize.STRING,
        allowNull: true
      },
      max_rank: {
        type: Sequelize.STRING,
        allowNull: true
      },
      min_rank: {
        type: Sequelize.STRING,
        allowNull: true
      },
      applies_to_officers: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('milestones');
  }
};
/*
    # table structure:
    guild_id: string
    milestone_type: string //? done
    condition: string //? done
    repeating: boolean //? almost done
    reward_type: string (promopoints | promotions | custom) //? done //! Add support for custom rewards
    reward: string //? done
    ping: string (optional) //!add support for pinging users to give custom rewards!
    max_rank: string
    min_rank: string
    applies_to_officers: boolean
*/