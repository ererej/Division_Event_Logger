'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'invite_code', {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn('Users', 'invite_code_owner', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'invite_code')
    await queryInterface.removeColumn('Users', 'invite_code_owner')
  }
};
