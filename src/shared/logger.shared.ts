import pino from 'pino';

export const logger = pino({
  name: 'tech-tools',
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

logger.info('tech-tools logger started');
