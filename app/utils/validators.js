
const Joi = require('joi');
const register = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin','coach','user').required()
});
const login = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
module.exports = { register, login };
