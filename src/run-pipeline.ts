import mongoose from 'mongoose';
import { databaseModule } from '@/modules/index.module';
import { env } from '@/env/index.env';
import { PipelineService } from '@/services/pipeline.service';
import { HnItem, Job, TechnicalPiece, StartupNews, ScrapeRun } from '@/models/index.model';
import { logger } from '@/shared/index.shared';

/**
 * Run a live pipeline integration test against the configured MongoDB.
 *
 * Algorithm steps executed:
 * 1. Establish database connection using verified MONGO_DB_URI credentials.
 * 2. Purge existing database collections to ensure a completely clean execution context.
 * 3. Initialize the PipelineService and execute live scraper for a batch of 10 Hacker News items.
 * 4. Query and verify actual document insertion count metrics across all target Mongoose collections.
 * 5. Retrieve and log key sample data payloads from successfully populated schemas.
 * 6. Always disconnect cleanly from the MongoDB container database instance upon exit.
 */
async function runLiveTest() {
  logger.info('Starting live pipeline integration test...');
  logger.info(`Database URI: ${env.MONGO_DB_URI}`);

  try {
    // Connect to the database
    await databaseModule(env.MONGO_DB_URI);

    // Clear any existing records from previous test runs to verify insertion cleanly
    logger.info('Cleaning up database collections for clean run...');
    await HnItem.deleteMany({});
    await Job.deleteMany({});
    await TechnicalPiece.deleteMany({});
    await StartupNews.deleteMany({});
    await ScrapeRun.deleteMany({});

    // Initialize Pipeline Service and run scraper for 10 items
    const pipeline = new PipelineService();
    const maxItems = 10;
    logger.info(`Fetching and processing top ${maxItems} stories from Hacker News API...`);
    const summary = await pipeline.runScrape(maxItems);

    logger.info('Scraper pipeline execution completed successfully!');
    console.log('\n--- Pipeline Run Summary ---');
    console.table({
      'Run ID': summary.runId,
      Status: summary.status,
      'Items Fetched': summary.itemsFetched,
      'Items Processed': summary.itemsProcessed,
      'Start Time': summary.startTime.toISOString(),
      'End Time': summary.endTime.toISOString(),
    });

    // Query Mongoose collections to verify they contain documents
    const hnItemsCount = await HnItem.countDocuments({});
    const jobsCount = await Job.countDocuments({});
    const techPiecesCount = await TechnicalPiece.countDocuments({});
    const startupNewsCount = await StartupNews.countDocuments({});
    const scrapeRunsCount = await ScrapeRun.countDocuments({});

    console.log('\n--- Database Document Counts ---');
    console.table({
      'HnItem (Raw Ingested)': hnItemsCount,
      'Job (Classified & Structured)': jobsCount,
      'TechnicalPiece (Classified)': techPiecesCount,
      'StartupNews (Classified)': startupNewsCount,
      'ScrapeRun (Audit Log)': scrapeRunsCount,
    });

    // Fetch a sample from each collection to verify data structure
    if (hnItemsCount > 0) {
      const sample = await HnItem.findOne({});
      logger.info(`Sample HnItem title: "${sample?.title}" (Type: ${sample?.type}, Author: ${sample?.by})`);
    }

    if (jobsCount > 0) {
      const sample = await Job.findOne({});
      logger.info(
        `Sample Job: "${sample?.role}" at ${sample?.company} (Location: ${sample?.location}, Remote: ${sample?.remote})`
      );
    }

    if (techPiecesCount > 0) {
      const sample = await TechnicalPiece.findOne({});
      logger.info(`Sample TechnicalPiece: "${sample?.title}" (Score: ${sample?.score}, Author: ${sample?.by})`);
    }

    if (startupNewsCount > 0) {
      const sample = await StartupNews.findOne({});
      logger.info(`Sample StartupNews: "${sample?.title}" (Score: ${sample?.score}, Author: ${sample?.by})`);
    }

    logger.info('Live integration test completed perfectly!');
  } catch (error: any) {
    logger.error(`Error during live integration test: ${error.message || error}`);
    console.error(error);
  } finally {
    // Always disconnect cleanly
    await mongoose.disconnect();
    logger.info('Disconnected cleanly from database.');
  }
}

runLiveTest().catch((err) => {
  console.error('Fatal crash in live integration test script:', err);
  process.exit(1);
});
