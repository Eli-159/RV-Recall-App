var DataTypes = require("sequelize").DataTypes;
var _accessLog = require("./accessLog");
var _owner = require("./owner");
var _recallItem = require("./recallItem");
var _vehicle = require("./vehicle");
var _vehicleRecallItem = require("./vehicleRecallItem");
var _workshop = require("./workshop");

function initModels(sequelize) {
  var accessLog = _accessLog(sequelize, DataTypes);
  var owner = _owner(sequelize, DataTypes);
  var recallItem = _recallItem(sequelize, DataTypes);
  var vehicle = _vehicle(sequelize, DataTypes);
  var vehicleRecallItem = _vehicleRecallItem(sequelize, DataTypes);
  var workshop = _workshop(sequelize, DataTypes);

  owner.belongsTo(vehicle, { foreignKey: "vehicleId"});
  vehicle.hasMany(owner, { foreignKey: "vehicleId"});
  vehicleRecallItem.belongsTo(vehicle, { foreignKey: "vehicleId"});
  vehicle.hasMany(vehicleRecallItem, { foreignKey: "vehicleId"});
  vehicleRecallItem.belongsTo(recallItem, { foreignKey: "recallItemId"});
  recallItem.hasMany(vehicleRecallItem, { foreignKey: "recallItemId"});
  recallItem.belongsToMany(vehicle, { through: "vehicleRecallItem", foreignKey: "recallItemId", as: "recallItems"});
  vehicle.belongsToMany(recallItem, {through: "vehicleRecallItem"});

  return {
    accessLog,
    owner,
    recallItem,
    vehicle,
    vehicleRecallItem,
    workshop,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
