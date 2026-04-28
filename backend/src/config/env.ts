import Joi from 'joi';

// Simple date validation helper
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const envSchema = Joi.object({
  // Server
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow(''),

  // Flash Sale
  SALE_START_TIME: Joi.string().required(),
  SALE_END_TIME: Joi.string().required(),
  PRODUCT_ID: Joi.string().default('prod_001'),
  INITIAL_STOCK: Joi.number().integer().min(1).default(100),
  MAX_PURCHASE_PER_USER: Joi.number().integer().min(1).default(1),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(10),
});

export const validateEnv = (): void => {
  const { error, value } = envSchema.validate(process.env, { allowUnknown: false });

  if (error) {
    throw new Error(`Configuration error: ${error.message}`);
  }

  // Validate date strings manually
  if (value.SALE_START_TIME && !isValidDate(value.SALE_START_TIME)) {
    throw new Error('SALE_START_TIME must be a valid ISO date string');
  }

  if (value.SALE_END_TIME && !isValidDate(value.SALE_END_TIME)) {
    throw new Error('SALE_END_TIME must be a valid ISO date string');
  }

  // Set validated values back to process.env
  Object.assign(process.env, value);
};

export const getConfig = () => ({
  port: process.env.PORT,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  flashSale: {
    startTime: new Date(process.env.SALE_START_TIME!),
    endTime: new Date(process.env.SALE_END_TIME!),
    productId: process.env.PRODUCT_ID!,
    initialStock: parseInt(process.env.INITIAL_STOCK!),
    maxPurchasePerUser: parseInt(process.env.MAX_PURCHASE_PER_USER!),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!),
  },
});
