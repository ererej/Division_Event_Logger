'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('events', 'message_link')

    await queryInterface.addColumn('events', 'promolog_message_link', {
      type: Sequelize.STRING,
      defaultValue: null,
    })

    await queryInterface.addColumn('events', 'sealog_message_link', {
      type: Sequelize.STRING,
      defaultValue: null,
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('events', 'message_link', {
      type: Sequelize.STRING,
      defaultValue: null,
    })

    await queryInterface.removeColumn('events', 'promolog_message_link')
    await queryInterface.removeColumn('events', 'sealog_message_link')
  }
};
