
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sign = (payload, secret, expiresIn) => jwt.sign(payload, secret, { expiresIn });
const verify = promisify(jwt.verify);
module.exports = { sign, verify };
