import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    port: parseInt(process.env.APP_PORT ?? '3000', 10),
    globalPrefix: process.env.APP_GLOBAL_PREFIX ?? 'api/v1',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
  }));