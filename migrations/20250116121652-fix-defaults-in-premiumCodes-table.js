'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('premiumCodes', 'createdAt', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false
    })

    await queryInterface.changeColumn('premiumCodes', 'updatedAt', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('premiumCodes', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false
    })

    await queryInterface.changeColumn('premiumCodes', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false
    })
  }
};
