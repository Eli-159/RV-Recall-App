var DataTypes = require("sequelize").DataTypes;
var _checklistItem = require("./checklistItem");

function initModels(sequelize) {
  var checklistItem = _checklistItem(sequelize, DataTypes);


  return {
    checklistItem,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
