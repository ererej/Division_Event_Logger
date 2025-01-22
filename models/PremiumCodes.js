module.exports = (sequelize, DataTypes) => {
    return sequelize.define('premiumCodes', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        uses: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        expires: {
            type: DataTypes.DATE,
            defaultValue: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            default: new Date(),
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            default: new Date(),
            allowNull: false
        }
        
    });
}