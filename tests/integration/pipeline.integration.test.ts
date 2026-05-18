import mongoose from 'mongoose';
import { config as dotEnvConfig } from 'dotenv';
import { PipelineService } from '@/services/pipeline.service';
import { HnItem, Job, TechnicalPiece, StartupNews, ScrapeRun } from '@/models/index.model';
import { databaseModule } from '@/modules/index.module';

// Load .env variables before execution
dotEnvConfig();

const dbUri = process.env.MONGO_DB_URI;

if (!dbUri) {
  describe('Pipeline Integration Test (Skipped)', () => {
    it('should skip integration tests when MONGO_DB_URI is not configured', () => {
      expect(true).toBe(true);
    });
  });
} else {
  describe('Pipeline Integration Test', () => {
    beforeAll(async () => {
      // Connect to the real database
      await databaseModule(dbUri);
    });

    afterAll(async () => {
      // Clean disconnect
      await mongoose.disconnect();
    });

    beforeEach(async () => {
      // Purge collections for clean, isolated test runs
      await HnItem.deleteMany({});
      await Job.deleteMany({});
      await TechnicalPiece.deleteMany({});
      await StartupNews.deleteMany({});
      await ScrapeRun.deleteMany({});
    });

    it('should ingest Hacker News items and successfully persist them in MongoDB', async () => {
      const pipeline = new PipelineService();
      const maxItemsToScrape = 2;

      // Execute scraping pipeline
      const summary = await pipeline.runScrape(maxItemsToScrape);

      // Verify the returned scraping summary is correct
      expect(summary.status).toBe('success');
      expect(summary.itemsFetched).toBe(maxItemsToScrape);

      // Check the database has the entries successfully persisted
      const hnItemsCount = await HnItem.countDocuments({});
      const scrapeRunsCount = await ScrapeRun.countDocuments({});
      const jobsCount = await Job.countDocuments({});
      const techPiecesCount = await TechnicalPiece.countDocuments({});
      const startupNewsCount = await StartupNews.countDocuments({});

      // Assert database entries exist
      expect(hnItemsCount).toBe(maxItemsToScrape);
      expect(scrapeRunsCount).toBe(1);

      // Verify that the processed items match the total count of classified items
      const totalClassified = jobsCount + techPiecesCount + startupNewsCount;
      expect(summary.itemsProcessed).toBe(totalClassified);

      // Ensure the audit run document contains correct metrics matching the database counts
      const runDocument = await ScrapeRun.findOne({ runId: summary.runId });
      expect(runDocument).toBeDefined();
      expect(runDocument?.itemsFetched).toBe(summary.itemsFetched);
      expect(runDocument?.itemsProcessed).toBe(summary.itemsProcessed);
      expect(runDocument?.status).toBe('success');
    });
  });
}
