import { Server } from 'http';
import mongoose from 'mongoose';
import applicationModule from '../../src/modules/app.module';
import { Job, TechnicalPiece, StartupNews, ScrapeRun } from '../../src/models/index.model';

const mockRunScrape = jest.fn();
jest.mock('@/services/pipeline.service', () => {
  return {
    PipelineService: jest.fn().mockImplementation(() => {
      return {
        runScrape: mockRunScrape,
      };
    }),
  };
});

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connection: {
      ...actual.connection,
      get readyState() {
        return 1; // Default to connected
      },
    },
  };
});

describe('Internal Diagnostics Routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll((done) => {
    const app = applicationModule();
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /internal/health', () => {
    it('should return health status indicating UP and database connection', async () => {
      const res = await fetch(`${baseUrl}/internal/health`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(
        expect.objectContaining({
          status: 'UP',
          database: 'connected',
          uptime: expect.any(Number),
          memoryUsage: expect.objectContaining({
            rss: expect.any(Number),
            heapTotal: expect.any(Number),
            heapUsed: expect.any(Number),
            external: expect.any(Number),
          }),
        })
      );
    });

    it('should return DOWN if database is not connected', async () => {
      const readyStateSpy = jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

      const res = await fetch(`${baseUrl}/internal/health`);
      expect(res.status).toBe(503);

      const body = await res.json();
      expect(body).toEqual(
        expect.objectContaining({
          status: 'DOWN',
          database: 'disconnected',
        })
      );

      readyStateSpy.mockRestore();
    });
  });

  describe('GET /internal/stats', () => {
    it('should return Mongoose collection document count stats', async () => {
      const countJobsSpy = jest.spyOn(Job, 'countDocuments').mockImplementation((query?: any) => {
        if (query && query.status === 'active') return Promise.resolve(10) as any;
        if (query && query.status === 'inactive') return Promise.resolve(5) as any;
        return Promise.resolve(15) as any;
      });
      const countTechSpy = jest.spyOn(TechnicalPiece, 'countDocuments').mockResolvedValue(25);
      const countStartupSpy = jest.spyOn(StartupNews, 'countDocuments').mockResolvedValue(8);
      const countScrapeSpy = jest.spyOn(ScrapeRun, 'countDocuments').mockImplementation((query?: any) => {
        if (query && query.status === 'success') return Promise.resolve(60) as any;
        if (query && query.status === 'failed') return Promise.resolve(5) as any;
        return Promise.resolve(65) as any;
      });

      const res = await fetch(`${baseUrl}/internal/stats`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({
        status: 'success',
        timestamp: expect.any(String),
        stats: {
          jobs: {
            total: 15,
            active: 10,
            inactive: 5,
          },
          technicalPieces: 25,
          startupNews: 8,
          scrapeRuns: {
            total: 65,
            successful: 60,
            failed: 5,
          },
        },
      });

      countJobsSpy.mockRestore();
      countTechSpy.mockRestore();
      countStartupSpy.mockRestore();
      countScrapeSpy.mockRestore();
    });

    it('should handle route errors gracefully', async () => {
      const countJobsSpy = jest.spyOn(Job, 'countDocuments').mockRejectedValue(new Error('DB Error'));

      const res = await fetch(`${baseUrl}/internal/stats`);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body).toEqual({
        status: 'error',
        message: 'Internal server error while fetching diagnostics',
      });

      countJobsSpy.mockRestore();
    });
  });

  describe('POST /internal/scrape', () => {
    beforeEach(() => {
      mockRunScrape.mockReset();
    });

    it('should trigger scraper pipeline run and return success metadata', async () => {
      mockRunScrape.mockResolvedValue({
        runId: 'test-run-123',
        status: 'success',
        itemsFetched: 10,
        itemsProcessed: 8,
        startTime: new Date('2026-05-18T00:00:00Z'),
        endTime: new Date('2026-05-18T00:01:00Z'),
      });

      const res = await fetch(`${baseUrl}/internal/scrape?limit=15`, {
        method: 'POST',
      });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({
        status: 'success',
        message: 'Scraping run completed successfully',
        data: expect.objectContaining({
          runId: 'test-run-123',
          status: 'success',
          itemsFetched: 10,
          itemsProcessed: 8,
        }),
      });

      expect(mockRunScrape).toHaveBeenCalledWith(15);
    });

    it('should return 400 bad request if limit parameter is invalid', async () => {
      const res = await fetch(`${baseUrl}/internal/scrape?limit=abc`, {
        method: 'POST',
      });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body).toEqual({
        status: 'error',
        message: 'Invalid limit parameter supplied. Must be a positive integer.',
      });
    });

    it('should return 500 error if pipeline fails', async () => {
      mockRunScrape.mockResolvedValue({
        runId: 'test-run-123',
        status: 'failed',
        itemsFetched: 0,
        itemsProcessed: 0,
        startTime: new Date(),
        endTime: new Date(),
      });

      const res = await fetch(`${baseUrl}/internal/scrape`, {
        method: 'POST',
      });
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body).toEqual({
        status: 'error',
        message: 'Pipeline run failed. Check server logs.',
        runId: 'test-run-123',
      });
    });
  });
});
