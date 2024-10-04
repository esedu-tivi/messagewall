require('dotenv').config();

const config = {
  development: {
    clientUrl: process.env.DEVELOPMENT_CLIENT_URL,
  },
  production: {
    clientUrl: process.env.PRODUCTION_CLIENT_URL,
  }
};

const env = process.env.NODE_ENV || 'development';

module.exports = config[env];
