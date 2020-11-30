var DataTypes = require("sequelize").DataTypes;
var _vehicle = require("./vehicle");

function initModels(sequelize) {
  var vehicle = _vehicle(sequelize, DataTypes);


  return {
    vehicle,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
