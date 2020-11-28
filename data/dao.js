// To Generate Models:
// node_modules/.bin/sequelize-auto -o "./data/models" -d myrv.db -h localhost -e sqlite

const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DBPATH)

