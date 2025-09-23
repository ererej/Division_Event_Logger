'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Milestones', 'condition', 'condition_type');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Milestones', 'condition_type', 'condition');
  }
};
