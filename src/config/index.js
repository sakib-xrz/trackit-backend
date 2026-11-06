const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key_track_it',
    expires_in: process.env.JWT_EXPIRES_IN || '30d',
  },
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  exchange_rate_api_url: process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest',
};
