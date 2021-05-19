const DB_CONNECTION_URL = process.env.DB_URL;
const DB_NAME = process.env.IS_DEV ? 'thoob-dev' : 'thoob-prod';

const DB_CONFIG = {
    DB_CONNECTION_URL,
    DB_NAME
};

module.exports = {
    DB_CONFIG
};