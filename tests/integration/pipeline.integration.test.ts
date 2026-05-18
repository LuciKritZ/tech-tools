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
    }, 30000);

    it('should correctly process mocked HN items through filtering heuristics and ignore mismatching ones', async () => {
      const mockHnClient = {
        fetchStoryIds: jest.fn().mockResolvedValue([101, 102, 103, 104]),
        fetchItems: jest.fn().mockResolvedValue([
          {
            id: 101,
            type: 'story',
            title: 'TypeScript Compiler Optimizations',
            text: 'Deep dive into standard compilation heuristics.',
            by: 'techguy',
            time: Math.floor(Date.now() / 1000),
            score: 85,
            url: 'https://example.com/tsc',
          },
          {
            id: 102,
            type: 'story',
            title: 'SaaS Startup Seed Funding Announcement',
            text: 'Our Y Combinator seed round raise was successful.',
            by: 'founder1',
            time: Math.floor(Date.now() / 1000),
            score: 120,
            url: 'https://example.com/saas',
          },
          {
            id: 103,
            type: 'job',
            title: 'TechCorp | Staff Engineer (TypeScript & Rust) | Remote',
            text: 'We are hiring a remote systems engineer.',
            by: 'techcorp',
            time: Math.floor(Date.now() / 1000),
            url: 'https://example.com/jobs/103',
          },
          {
            id: 104,
            type: 'story',
            title: 'Random non-matching post',
            text: 'Just sharing some random stories that have zero matching target keywords.',
            by: 'blogger',
            time: Math.floor(Date.now() / 1000),
            score: 5,
            url: 'https://example.com/random',
          },
        ]),
      } as any;

      const pipeline = new PipelineService(mockHnClient);
      const summary = await pipeline.runScrape(4);

      expect(summary.status).toBe('success');
      expect(summary.itemsFetched).toBe(4);
      expect(summary.itemsProcessed).toBe(3); // 101 (technical), 102 (startup), 103 (job) should be processed; 104 (skip) ignored

      // Verify all raw HN items are saved for audit trails
      const hnItemsCount = await HnItem.countDocuments({});
      expect(hnItemsCount).toBe(4);

      // Verify targeted classifications
      const techPiecesCount = await TechnicalPiece.countDocuments({});
      expect(techPiecesCount).toBe(1);
      const techDoc = await TechnicalPiece.findOne({ hnId: 101 });
      expect(techDoc?.title).toContain('TypeScript');

      const startupNewsCount = await StartupNews.countDocuments({});
      expect(startupNewsCount).toBe(1);
      const startupDoc = await StartupNews.findOne({ hnId: 102 });
      expect(startupDoc?.title).toContain('SaaS');

      const jobsCount = await Job.countDocuments({});
      expect(jobsCount).toBe(1);
      const jobDoc = await Job.findOne({ hnId: 103 });
      expect(jobDoc?.company).toBe('TechCorp');

      // Verify 104 was not saved to any filtered collection
      const skippedTech = await TechnicalPiece.findOne({ hnId: 104 });
      const skippedStartup = await StartupNews.findOne({ hnId: 104 });
      const skippedJob = await Job.findOne({ hnId: 104 });
      expect(skippedTech).toBeNull();
      expect(skippedStartup).toBeNull();
      expect(skippedJob).toBeNull();
    });
  });
}
