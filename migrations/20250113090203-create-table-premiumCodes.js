'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('premiumCodes', {
      id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
      },
      code: {
      type: Sequelize.STRING,
      allowNull: false
      },
      uses: {
      type: Sequelize.INTEGER,
      defaultValue: 1
      },
      expires: {
      type: Sequelize.DATE,
      },
      createdAt: {
      type: Sequelize.DATE,
      allowNull: false
      },
      updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('premiumCodes');
  }
};
