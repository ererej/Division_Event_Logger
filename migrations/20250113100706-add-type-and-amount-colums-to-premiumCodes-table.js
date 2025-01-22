'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('premiumCodes', 'type', {
      type: Sequelize.STRING,
      allowNull: false
    })
    await queryInterface.addColumn('premiumCodes', 'amount', {
      type: Sequelize.INTEGER,
      allowNull: false
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('premiumCodes', 'type')
    await queryInterface.removeColumn('premiumCodes', 'amount')
  }
};
