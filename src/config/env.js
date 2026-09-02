const dotenv = require('dotenv');
const joi = require('joi');

// Load environment variables from .env file
dotenv.config();

// Define schema for required environment variables
const envVarsSchema = joi.object({
  PORT: joi.number().default(5000),
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  MONGO_URI: joi.string().required().messages({
    'any.required': 'MONGO_URI environment variable is required',
    'string.empty': 'MONGO_URI cannot be an empty string',
  }),
  JWT_SECRET: joi.string().required().messages({
    'any.required': 'JWT_SECRET environment variable is required',
    'string.empty': 'JWT_SECRET cannot be an empty string',
  }),
  JWT_EXPIRES_IN: joi.string().required().messages({
    'any.required': 'JWT_EXPIRES_IN environment variable is required',
    'string.empty': 'JWT_EXPIRES_IN cannot be an empty string',
  }),
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  const errorDetails = error.details.map((detail) => detail.message).join('; ');
  throw new Error(`[Config Error] Missing or invalid environment variables: ${errorDetails}`);
}

module.exports = {
  port: envVars.PORT,
  env: envVars.NODE_ENV,
  mongoUri: envVars.MONGO_URI,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,
};
