const crypto = require('crypto');

const jwtSecretKey = crypto.randomBytes(64).toString('hex');

console.log('Your JWT Secret Key:', jwtSecretKey);

const key = crypto.randomBytes(32).toString('hex').slice(0, 32);

console.log(`Your 32-character encryption key: ${key}`);