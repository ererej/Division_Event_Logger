'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('milestones', 'condition', 'condition_type');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('milestones', 'condition_type', 'condition');
  }
};
