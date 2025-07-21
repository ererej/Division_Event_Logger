'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'events', {
      type: Sequelize.STRING(1000),
      allowNull: false,
      defaultValue: '',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'events', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });
  }
};
