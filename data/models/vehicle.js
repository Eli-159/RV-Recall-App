const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('vehicle', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true
    },
    ipa: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    buildNo: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true
    },
    vin: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true
    },
    engineNo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    modelDesc: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    addSpec: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    variantCode: {
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
    },
    isOnRav: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
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
