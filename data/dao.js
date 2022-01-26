// To Generate Models:
// npm install sequelize-auto
// ./node_modules/.bin/sequelize-auto -o "./data/models" -d myrv.db -h localhost -e sqlite

const { response } = require('express');
const Sequelize = require('sequelize');
const sequelize = new Sequelize({dialect: 'sqlite', storage: process.env.DBPATH, logging: false});
const models = require('./models/init-models')(sequelize);

//const sqlite3 = require('sqlite3');

function dao() {
    
    var newAccessLog = function(accessLog) {
        return models.accessLog.create(accessLog);
    }

    var getOwner = function (id) {
        return models.owner.findByPk(id)
        .then(data => {
            if (data != null) {
                return data.get({ plain: true })
            } else {
                return data
            }
        })

    }

    var listOwnerCurrent = function() {
        return models.owner.findAll({
            attributes: ['vehicleId', [sequelize.fn('MAX', sequelize.col('owner.id')), 'currentOwnerId'], 'name', 'email', 'phone'],
            include: [
                {
                    model: models.vehicle,
                    attributes: ['vin']
                }
            ],
            group: ['vehicleId']
        })
        .then(data => {
            if (data != null) {
                return data.map((node) => node.get({ plain: true }))
            } else {
                return data
            }
        });
    }

    var newOwner = function (owner) {
        if (owner.regoDt == "") {delete owner.regoDt}
        return models.owner.create(owner)
    }

    var updateOwner = function (owner) {
        if (owner.regoDt == "") {delete owner.regoDt}
        return models.owner.update(owner,
            {where: {id: owner.id}}
        )
    }

    var listRecallContactByVehicle = function (vehicleId) {
        return models.recallContact.findAll({
            where: {vehicleId: vehicleId}
        })
        .then(data => {
            if (data != null) {
                return data.map((node) => node.get({ plain: true }))
            } else {
                return data
            }
        });
    }

    var newRecallContact = function(recallContact) {
        return models.recallContact.create(recallContact);
    }

    var newRecallFeedback = function(recallFeedback){
        return models.recallFeedback.create(recallFeedback);
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
                        order: [['id', 'DESC']],
                        separate: true,
                        limit: 1,
                        required: false,
                    },
                    {
                        model: models.recallItem,
                        attributes: {exclude: ['createdBy', 'updatedBy','createdAt', 'updatedAt']},
                        order: [['id', 'ASC']],
                        required: false,
                    },
                    {
                        model: models.recallContact,
                        order: [['id', 'DESC']],
                        required: false,
                        separate: true,
                        include: [{model: models.recallFeedback,  required: false}]
                    }
                ],
                where: {vin: vin}
            })
            .then(data => {
                if (data != null) {
                    return data.get({ plain: true })
                } else {
                    return data
                }
            })
    }

    var getVehicleByBuildNo = function(buildNo) {
        return models.vehicle.findOne(
            {
                attributes: {exclude: ['createdBy', 'updatedBy','createdAt', 'updatedAt']},
                include:
                [
                    {
                        model: models.owner,
                        attributes: {exclude: ['createdBy', 'updatedBy','createdAt', 'updatedAt']},
                        order: [['id', 'DESC']],
                        separate: true,
                        limit: 1,
                        required: false,
                    },
                    {
                        model: models.recallItem,
                        attributes: {exclude: ['createdBy', 'updatedBy','createdAt', 'updatedAt']},
                        order: [['id', 'ASC']],
                        required: false,
                    },
                    {
                        model: models.recallContact,
                        order: [['id', 'DESC']],
                        required: false,
                        separate: true,
                        include: [{model: models.recallFeedback,  required: false}]
                    },
            ],
                where: {buildNo: buildNo}
        })
        .then(data => {
            if (data != null) {
                return data.get({ plain: true })
            } else {
                return data
            }
        })

    }

    var updateVehicle = function (vehicle, user) {
        vehicle['updatedBy'] = user ? user : '';
        return models.vehicle.update(
            vehicle,
            {
                where: {
                    id: vehicle.id
                }
            }
        )
    }

    var updateVehicleRecallItem = function(vehicleRecallItem, authPayload) {
        return models.vehicleRecallItem.update(
            vehicleRecallItem,
            {
                where: {
                    id: vehicleRecallItem.id,
                    status: 'new',
                    vehicleId: authPayload.vehicleId
                }
            });
    }

    var getWorkshopByCode = function(code) {
        return models.workshop.findOne(
            {
                attributes: {exclude: ['code', 'createdBy', 'updatedBy','createdAt', 'updatedAt']},
                where: {code: code}
            }
        )
        .then(data => {
            if (data != null) {
                return data.get({ plain: true })
            } else {
                return data
            }
        })
}

    var reportVehicleRecallItemStatus = function() {
        return sequelize.query(`SELECT v.id, v.buildNo, v.vin, ri.description AS 'recallItem', vri.status, vri.updatedBy AS 'vriUpdatedBy', vri.updatedAt AS 'vriUpdatedAt'
                                FROM vehicle v 
                                LEFT JOIN 
                                    (recallItem ri 
                                        INNER JOIN vehicleRecallItem vri 
                                        ON ri.id = vri.recallItemId
                                    ) ON v.id = vri.vehicleId;`,
                                {           
                                    type: Sequelize.QueryTypes.SELECT,
                                    raw: true                
                                });
    }

    var loadVehicle = function(vehicle, user) {
        vehicle['user'] = user;
        return sequelize.query("INSERT INTO vehicle (id, ipa, buildNo, vin, engineNo, modelDesc, addSpec, variantCode, createdBy, updatedBy, createdAt, updatedAt) VALUES (:id, :ipa, :buildNo, :vin, :engineNo, :modelDesc, :addSpec, :variantCode, :user, :user, datetime('now'), datetime('now'))",
            { replacements: vehicle,
              type: sequelize.QueryTypes.INSERT,
              raw: true
            }
        )
    }

    var listChecklistItemByIpa = function (ipa) {
        return models.checklistItem.findAll({
            where: {
                ipa: ipa,
                isActive: 1
            },
            order: [['order', 'ASC']]
        })
        .then(data => {
            if (data != null) {
                return data.map((node) => node.get({ plain: true }))
            } else {
                return data
            }
        });
    }

    return {
        newAccessLog,
        getOwner,
        newOwner,
        listOwnerCurrent,
        updateOwner,
        listRecallContactByVehicle,
        newRecallContact,
        newRecallFeedback,
        getVehicleByVin,
        getVehicleByBuildNo,
        updateVehicle,
        updateVehicleRecallItem,
        getWorkshopByCode,
        reportVehicleRecallItemStatus,
        loadVehicle,
        listChecklistItemByIpa
    }
}


module.exports = dao();
module.exports.dao = dao();
module.exports.default = dao();
