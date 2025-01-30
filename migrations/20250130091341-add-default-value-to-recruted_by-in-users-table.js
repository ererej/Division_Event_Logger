'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'recruted_by', {
      type: Sequelize.STRING,
      defaultValue: null,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'recruted_by', {
      type: Sequelize.STRING,
    });
  }
};
