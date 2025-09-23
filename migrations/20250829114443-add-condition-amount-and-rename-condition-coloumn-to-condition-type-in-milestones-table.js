'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.addColumn('Milestones', 'condition_config', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ""
    });
    queryInterface.renameColumn('Milestones', 'condition', 'condition_type');
  },

  async down (queryInterface, Sequelize) {
    queryInterface.removeColumn('Milestones', 'condition_config');
    queryInterface.renameColumn('Milestones', 'condition_type', 'condition');
  }
};
