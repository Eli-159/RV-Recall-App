var DataTypes = require("sequelize").DataTypes;
var _accessLog = require("./accessLog");
var _owner = require("./owner");
var _recallItem = require("./recallItem");
var _vehicle = require("./vehicle");
var _vehicleRecallItem = require("./vehicleRecallItem");
var _workshop = require("./workshop");
var _recallContact = require("./recallContact")
var _recallFeedback = require("./recallFeedback");

function initModels(sequelize) {
  var accessLog = _accessLog(sequelize, DataTypes);
  var owner = _owner(sequelize, DataTypes);
  var recallItem = _recallItem(sequelize, DataTypes);
  var vehicle = _vehicle(sequelize, DataTypes);
  var vehicleRecallItem = _vehicleRecallItem(sequelize, DataTypes);
  var workshop = _workshop(sequelize, DataTypes);
  var recallContact = _recallContact(sequelize, DataTypes);
  var recallFeedback = _recallFeedback(sequelize, DataTypes);

  owner.belongsTo(vehicle, { foreignKey: "vehicleId"});
  vehicle.hasMany(owner, { foreignKey: "vehicleId"});
  vehicleRecallItem.belongsTo(vehicle, { foreignKey: "vehicleId"});
  vehicle.hasMany(vehicleRecallItem, { foreignKey: "vehicleId"});
  vehicleRecallItem.belongsTo(recallItem, { foreignKey: "recallItemId"});
  recallItem.hasMany(vehicleRecallItem, { foreignKey: "recallItemId"});
  recallItem.belongsToMany(vehicle, { through: "vehicleRecallItem", foreignKey: "recallItemId", as: "recallItems"});
  vehicle.belongsToMany(recallItem, {through: "vehicleRecallItem"});
  vehicle.hasMany(recallContact, { foreignKey: "vehicleId"});
  recallContact.belongsTo(vehicle, { foreignKey: "vehicleId"});
  recallFeedback.belongsTo(recallContact, { foreignKey: "recallContactId"});
  recallContact.hasMany(recallFeedback, { foreignKey: "recallContactId"});

  return {
    accessLog,
    owner,
    recallItem,
    vehicle,
    vehicleRecallItem,
    workshop,
    recallContact,
    recallFeedback,
  };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;