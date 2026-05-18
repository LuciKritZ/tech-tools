import { PipelineService } from '@/services/pipeline.service';
import { HnItem } from '@/models/hn-item.model';
import { Job } from '@/models/job.model';
import { TechnicalPiece } from '@/models/technical-piece.model';
import { ScrapeRun } from '@/models/scrape-run.model';

describe('PipelineService', () => {
  let pipelineService: PipelineService;
  let mockHnClient: any;
  let mockFilterService: any;
  let mockJobManager: any;

  let hnItemUpdateSpy: jest.SpyInstance;
  let techPieceUpdateSpy: jest.SpyInstance;
  let jobUpdateSpy: jest.SpyInstance;
  let scrapeRunSaveSpy: jest.SpyInstance;
  let scrapeRunFindOneAndUpdateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockHnClient = {
      fetchStoryIds: jest.fn(),
      fetchItems: jest.fn(),
    };

    mockFilterService = {
      categorizeItem: jest.fn(),
    };

    mockJobManager = {
      parseJob: jest.fn(),
    };

    // Instantiate with manually created mock service instances
    pipelineService = new PipelineService(mockHnClient, mockFilterService, mockJobManager);

    // Setup Mongoose model spies
    hnItemUpdateSpy = jest.spyOn(HnItem, 'updateOne').mockResolvedValue({} as any);
    techPieceUpdateSpy = jest.spyOn(TechnicalPiece, 'updateOne').mockResolvedValue({} as any);
    jobUpdateSpy = jest.spyOn(Job, 'updateOne').mockResolvedValue({} as any);
    scrapeRunSaveSpy = jest.spyOn(ScrapeRun.prototype, 'save').mockResolvedValue({} as any);
    scrapeRunFindOneAndUpdateSpy = jest.spyOn(ScrapeRun, 'findOneAndUpdate').mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should run a successful scraping pipeline, saving and classifying documents correctly', async () => {
    // 1. Setup mock responses
    mockHnClient.fetchStoryIds.mockResolvedValue([10001, 10002]);
    mockHnClient.fetchItems.mockResolvedValue([
      {
        id: 10001,
        type: 'story',
        title: 'Building a compiler in Rust',
        by: 'rustguy',
        score: 100,
        time: 1716000000,
      },
      {
        id: 10002,
        type: 'job',
        title: 'Stripe | Software Engineer | Remote',
        by: 'stripe',
        score: 1,
        time: 1716000000,
      },
    ]);

    // Mock filters
    mockFilterService.categorizeItem.mockImplementation((item: any) => {
      if (item.id === 10001) return 'technical';
      if (item.id === 10002) return 'job';
      return 'skip';
    });

    // Mock Job parsing
    mockJobManager.parseJob.mockReturnValue({
      hnId: 10002,
      company: 'Stripe',
      role: 'Software Engineer',
      location: 'Remote',
      remote: true,
      techStack: ['React'],
      status: 'active',
      rawText: 'Stripe | Software Engineer | Remote',
    });

    // 2. Execute
    const summary = await pipelineService.runScrape();

    // 3. Asserts
    expect(summary.status).toBe('success');
    expect(summary.itemsFetched).toBe(2);
    expect(summary.itemsProcessed).toBe(2);

    // Verify HnItem was saved
    expect(hnItemUpdateSpy).toHaveBeenCalledTimes(2);

    // Verify TechnicalPiece was saved
    expect(techPieceUpdateSpy).toHaveBeenCalledTimes(1);

    // Verify Job was saved
    expect(jobUpdateSpy).toHaveBeenCalledTimes(1);

    // Verify ScrapeRun was initialized and finalized
    expect(scrapeRunSaveSpy).toHaveBeenCalled();
    expect(scrapeRunFindOneAndUpdateSpy).toHaveBeenCalled();
  });

  it('should capture errors and finalize ScrapeRun with status failed when an error occurs', async () => {
    // 1. Setup mock failure
    mockHnClient.fetchStoryIds.mockRejectedValue(new Error('Hacker News Offline'));

    // 2. Execute & Assert
    await expect(pipelineService.runScrape()).rejects.toThrow('Hacker News Offline');

    expect(scrapeRunSaveSpy).toHaveBeenCalled();
    expect(scrapeRunFindOneAndUpdateSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        status: 'failed',
        error: 'Hacker News Offline',
      }),
      expect.any(Object)
    );
  });
});
