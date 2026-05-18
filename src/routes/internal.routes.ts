import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Job, TechnicalPiece, StartupNews, ScrapeRun } from '@/models/index.model';
import { PipelineService } from '@/services/pipeline.service';
import { logger } from '@/shared/index.shared';

/**
 * Express router for secure internal server diagnostics and telemetry endpoints.
 * This router is bound exclusively to the loopback interface (127.0.0.1).
 */
export const internalRouter = Router();

/**
 * GET /internal/health
 * Health check endpoint.
 * Returns database connection status, server uptime, and Node memory usage.
 */
internalRouter.get('/health', (req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    return res.status(503).json({
      status: 'DOWN',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    status: 'UP',
    database: 'connected',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /internal/stats
 * Telemetry statistics endpoint.
 * Aggregates and returns document counts across all database collections.
 */
internalRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalJobs,
      activeJobs,
      inactiveJobs,
      totalTechPieces,
      totalStartupNews,
      totalScrapeRuns,
      successScrapeRuns,
      failedScrapeRuns,
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Job.countDocuments({ status: 'inactive' }),
      TechnicalPiece.countDocuments(),
      StartupNews.countDocuments(),
      ScrapeRun.countDocuments(),
      ScrapeRun.countDocuments({ status: 'success' }),
      ScrapeRun.countDocuments({ status: 'failed' }),
    ]);

    res.status(200).json({
      status: 'success',
      timestamp: new Date().toISOString(),
      stats: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
          inactive: inactiveJobs,
        },
        technicalPieces: totalTechPieces,
        startupNews: totalStartupNews,
        scrapeRuns: {
          total: totalScrapeRuns,
          successful: successScrapeRuns,
          failed: failedScrapeRuns,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error compiling server telemetry statistics');
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching diagnostics',
    });
  }
});

/**
 * POST /internal/scrape
 * Manual scraping trigger endpoint.
 * Accepts an optional "limit" query parameter (defaults to 10).
 */
internalRouter.post('/scrape', async (req: Request, res: Response) => {
  try {
    const limitQuery = req.query.limit;
    const limit = limitQuery ? parseInt(limitQuery as string, 10) : 10;

    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid limit parameter supplied. Must be a positive integer.',
      });
    }

    logger.info(`Manual scraping triggered via /internal/scrape with limit ${limit}`);

    const pipeline = new PipelineService();
    const summary = await pipeline.runScrape(limit);

    if (summary.status === 'failed') {
      return res.status(500).json({
        status: 'error',
        message: 'Pipeline run failed. Check server logs.',
        runId: summary.runId,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Scraping run completed successfully',
      data: {
        runId: summary.runId,
        status: summary.status,
        itemsFetched: summary.itemsFetched,
        itemsProcessed: summary.itemsProcessed,
        startTime: summary.startTime,
        endTime: summary.endTime,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error during manual scraping trigger');
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while triggering manual scraping',
    });
  }
});

export default internalRouter;
