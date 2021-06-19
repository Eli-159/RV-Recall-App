const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('recallFeedback', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true
    },
    recallContactId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'recallContact',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tag: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    feedback: {
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
    tableName: 'recallFeedback',
    timestamps: true
  });
};
