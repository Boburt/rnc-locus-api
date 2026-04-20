import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  APP_PORT: Joi.number().port().default(3000),
  APP_GLOBAL_PREFIX: Joi.string().default('api/v1'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),

  // Swagger
  SWAGGER_PATH: Joi.string().default('docs'),
});