const { Sequelize } = require('sequelize');


const sequelize = new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,
    {
        host: process.env.DB_HOST,
        dialect: 'mssql',
        port: Number(process.env.DB_PORT),
        dialectOptions: {
            options: {
                encrypt: false,
                trustServerCertificate: true,
            }
        }
    }
);

async function connect() {
    try {
        await sequelize.authenticate();
        console.log('Connection successfully!!!');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
export { connect, sequelize };



