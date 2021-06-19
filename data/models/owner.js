/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('owner', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicle',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phone: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    street: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    suburb: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    state: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    postcode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    regoState: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    regoNo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    regoDt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'owner',
    timestamps: true
  });
};
