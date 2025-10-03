'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.addColumn('milestones', 'condition_config', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ""
    });
    queryInterface.renameColumn('milestones', 'condition', 'condition_type');
  },

  async down (queryInterface, Sequelize) {
    queryInterface.removeColumn('milestones', 'condition_config');
    queryInterface.renameColumn('milestones', 'condition_type', 'condition');
  }
};
