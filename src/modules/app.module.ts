import express, { type Application, json, NextFunction, Response, Request } from 'express';
import { BaseError, ErrorHandler, logger } from '@/shared/index.shared';
import { internalRouter } from '@/routes/internal.routes';

const applicationModule = (): Application => {
  const app = express();

  // Pino HTTP request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    logger.info({ method: req.method, url: req.url }, `Incoming request: ${req.method} ${req.url}`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
        },
        `Request completed: ${req.method} ${req.url} ${res.statusCode} in ${duration}ms`
      );
    });

    next();
  });

  // Enable JSON body parsing
  app.use(json());

  // Health/Testing check route (diagnostic API endpoint)
  app.get('/test', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'API is working',
    });
  });

  // Mount diagnostics and telemetry internal endpoints
  app.use('/internal', internalRouter);

  // Error Handling Setup
  const errorHandler = new ErrorHandler(logger);

  app.use(errorMiddleware);

  process.on('uncaughtException', async (error: Error) => {
    await errorHandler.handleError(error);
    if (!errorHandler.isTrustedError(error)) process.exit(1);
  });

  process.on('unhandledRejection', async (reason: Error) => {
    throw reason;
  });

  async function errorMiddleware(error: BaseError, req: Request, response: Response, next: NextFunction) {
    if (!errorHandler.isTrustedError(error)) {
      next(error);
      return;
    }

    await errorHandler.handleError(error);
    response.status(error.httpCode || 500).json({
      success: false,
      message: error.message,
    });
  }

  return app;
};

export default applicationModule;
