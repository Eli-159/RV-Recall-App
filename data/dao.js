// To Generate Models:
// node_modules/.bin/sequelize-auto -o "./data/models" -d myrv.db -h localhost -e sqlite

process.env.DBPATH = "myrv.db";

const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DBPATH);
const models = require('data/models/init-models')(sequelize);
const dao = () => {
    var getOwner: async (id) => {
        data = await models.owner.findAll({where: {id: id}})
        return data;
    }
}


module.exports = dao;
module.exports.dao = dao;
module.exports.default = dao;