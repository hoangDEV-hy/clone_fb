const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('cloneFB', 'sa', '19072005', {
    host: 'localhost',
    dialect: 'mssql',
    dialectOptions: {
        options: {
            encrypt: false,
            trustServerCertificate: true,
        }
    },
    port: 1433
});

async function connect() {
    try {
        await sequelize.authenticate();
        console.log('Connection successfully!!!');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
export { connect, sequelize };



