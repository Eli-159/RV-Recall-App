/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('accessLog', {
    url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'accessLog',
    timestamps: true
  });
};
