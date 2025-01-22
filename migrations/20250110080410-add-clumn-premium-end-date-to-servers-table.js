'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('servers', 'premium_end_date', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('servers', 'premium_end_date')
  }
};
