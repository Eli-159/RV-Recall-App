// To Generate Models:
// node_modules/.bin/sequelize-auto -o "./data/models" -d myrv.db -h localhost -e sqlite

process.env.DBPATH = "myrv.db";

const Sequelize = require('sequelize');
const sequelize = new Sequelize({dialect: 'sqlite', storage: process.env.DBPATH});
const models = require('./models/init-models')(sequelize);

function dao() {
    var getOwner = function (id) {
        return models.owner.findAll({where: {id: id}})
    }

    var getVehicle = function(vin) {
        return models.vehicle.findAll(
            {
                include:
                [
                    {model: models.owner},
                    {model: models.vehicleRecallItem}
            ],
                where: {vin: vin}
            })
    }

    return {
        getOwner,
        getVehicle
    }
}


module.exports = dao();
module.exports.dao = dao();
module.exports.default = dao();
