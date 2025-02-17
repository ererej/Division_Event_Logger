'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [results] = await queryInterface.sequelize.query(
      'SELECT id, linked_roles FROM ranks',
      { transaction }
      );

      for (const row of results) {
      const linkedRolesArray = row.linked_roles ? row.linked_roles.split(',') : null;
      await queryInterface.sequelize.query(
        'UPDATE ranks SET linked_roles = :linkedRoles WHERE id = :id',
        {
        replacements: { linkedRoles: linkedRolesArray ? JSON.stringify(linkedRolesArray) : null, id: row.id },
        transaction
        }
      );
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [results] = await queryInterface.sequelize.query(
      'SELECT id, linked_roles FROM ranks',
      { transaction }
      );

      for (const row of results) {
      const linkedRolesArray = row.linked_roles ? JSON.parse(row.linked_roles) : null;
      await queryInterface.sequelize.query(
        'UPDATE ranks SET linked_roles = :linkedRoles WHERE id = :id',
        {
        replacements: { linkedRoles: linkedRolesArray ? linkedRolesArray.join(',') : null, id: row.id },
        transaction
        }
      );
      }
    });
  }
};
