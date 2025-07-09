const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL.replace('brecho', 'brecho_db'), {
  dialect: 'postgres',
});

module.exports = sequelize;