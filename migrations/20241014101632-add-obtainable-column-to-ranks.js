'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     // Add the new 'obtainable' column
     await queryInterface.addColumn('ranks', 'obtainable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true, // Temporary default value
    });

    // Update the 'obtainable' value based on 'is_officer'
    await queryInterface.sequelize.query(
      `UPDATE ranks SET obtainable = CASE WHEN is_officer = true THEN false ELSE true END`
    );
  },

  async down (queryInterface, Sequelize) {
    // Remove the 'obtainable' column if rolling back
    await queryInterface.removeColumn('ranks', 'obtainable');
  }
};
