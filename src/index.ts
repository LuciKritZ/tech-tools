import http from 'http';
import { applicationModule, databaseModule } from '@/modules/index.module';
import { env } from '@/env/index.env';
import { logger } from '@/shared/index.shared';

export const startServer = async () => {
  const app = applicationModule();
  const server = http.createServer(app);

  // DB connection with robust retry logic
  await databaseModule(env.MONGO_DB_URI);

  // Initialize cron scheduler (placeholder for Phase 3)
  logger.info('Initializing cron scheduler (8h scrape & midnight publish)...');

  // Bind strictly to 127.0.0.1 to avoid exposing the diagnostic endpoint publicly
  server.listen(env.PORT, '127.0.0.1', () => {
    logger.info(`Server running on http://127.0.0.1:${env.PORT}/`);
  });

  return server;
};

// Prevent auto-starting the server during Jest unit tests
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    logger.error({ error }, 'Fatal error during startup');
    process.exit(1);
  });
}
