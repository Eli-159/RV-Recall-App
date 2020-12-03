/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('vehicle', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true
    },
    buildNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true
    },
    vin: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true
    },
    modelDesc: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    addSpec: {
      type: DataTypes.TEXT,
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
    tableName: 'vehicle',
    timestamps: true,
    indexes: [
      {
        name: "idxVin",
        unique: true,
        fields: [
          { name: "vin" },
        ]
      },
      {
        name: "idxBuildNo",
        unique: true,
        fields: [
          { name: "buildNo" },
        ]
      },
    ]
  });
};
