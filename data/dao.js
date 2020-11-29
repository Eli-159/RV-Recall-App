// To Generate Models:
// node_modules/.bin/sequelize-auto -o "./data/models" -d myrv.db -h localhost -e sqlite

process.env.DBPATH = "myrv.db";

const Sequelize = require('sequelize');
const sequelize = new Sequelize({dialect: 'sqlite', storage: process.env.DBPATH});
const models = require('./models/init-models')(sequelize);

function dao() {
    
    var getOwner = function (id) {
        return models.owner.findByPk(id)
    }

    var newOwner = function (owner) {
        return models.owner.create(owner);
    }

    var getVehicleByVin = function(vin) {
        return models.vehicle.findOne(
            {
                attributes: {exclude: ['createdBy', 'updatedBy','createdAt', 'updatedAt']},
                include:
                [
                    {
                        model: models.owner,
                        attributes: {exclude: ['createdBy', 'updatedBy','createdAt', 'updatedAt']},
                        order: ['id', 'DESC']
                    },
                    {
                        model: models.recallItem,
                        attributes: {exclude: ['createdBy', 'updatedBy','createdAt', 'updatedAt']},
                        order: ['id', 'ASC'],
                    }
            ],
                where: {vin: vin}
            })
    }

    var getWorkshopByCode = function(code) {
        return models.workshop.findOne(
            {
                attributes: {exclude: ['createdBy', 'updatedBy','createdAt', 'updatedAt']},
                where: {code: code}
            }
        )
    }
    
    return {
        getOwner,
        newOwner,
        getVehicleByVin,
        getWorkshopByCode,

    }
}


module.exports = dao();
module.exports.dao = dao();
module.exports.default = dao();
