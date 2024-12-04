'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'cohosts', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      }
    )
    await queryInterface.addColumn('users', 'recruits', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      }
    )
    await queryInterface.addColumn('users', 'officer', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      }
    )
    await queryInterface.removeColumn('users', 'became_officer')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'cohosts');
    await queryInterface.removeColumn('users', 'recruits');
    await queryInterface.addColumn('users', 'became_officer', {
      type: Sequelize.DATE,
      allowNull: true
    })

  }
};
