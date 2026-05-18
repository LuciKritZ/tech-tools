import crypto from 'crypto';
import { HnClientService } from './hn-client.service';
import { FilterService } from './filter.service';
import { JobManagerService } from './job-manager.service';
import { HnItem } from '@/models/hn-item.model';
import { Job } from '@/models/job.model';
import { TechnicalPiece } from '@/models/technical-piece.model';
import { StartupNews } from '@/models/startup-news.model';
import { ScrapeRun } from '@/models/scrape-run.model';
import { logger } from '@/shared/logger.shared';

export interface IPipelineSummary {
  runId: string;
  status: 'success' | 'failed';
  itemsFetched: number;
  itemsProcessed: number;
  startTime: Date;
  endTime: Date;
}

export class PipelineService {
  constructor(
    private hnClient: HnClientService = new HnClientService(),
    private filterService: FilterService = new FilterService(),
    private jobManager: JobManagerService = new JobManagerService()
  ) {}

  /**
   * Runs the scraping pipeline.
   * Processes the top N stories and categorizes them.
   */
  async runScrape(maxItems = 30): Promise<IPipelineSummary> {
    const runId = `run-${crypto.randomUUID()}`;
    const startTime = new Date();

    logger.info({ runId }, 'Starting scraping pipeline run');

    // Create the initial scrape run log
    const scrapeRunLog = new ScrapeRun({
      runId,
      startTime,
      endTime: startTime, // placeholder
      status: 'success',
      itemsFetched: 0,
      itemsProcessed: 0,
    });

    await scrapeRunLog.save();

    try {
      // 1. Fetch top story IDs
      const storyIds = await this.hnClient.fetchStoryIds('top');
      const targetIds = storyIds.slice(0, maxItems);

      logger.info({ runId, count: targetIds.length }, 'Fetched top story list');

      // 2. Fetch full item details politely using dynamic concurrency
      const items = await this.hnClient.fetchItems(targetIds);
      const itemsFetched = items.length;
      let itemsProcessed = 0;

      logger.info({ runId, count: itemsFetched }, 'Fetched story items');

      // 3. Process each item
      for (const item of items) {
        try {
          const itemDate = new Date(item.time * 1000); // HN timestamp is in Unix seconds

          // Upsert raw HN Item first to keep complete audit trails
          await HnItem.updateOne(
            { hnId: item.id },
            {
              $set: {
                hnId: item.id,
                deleted: item.deleted || false,
                type: item.type,
                by: item.by || 'unknown',
                time: itemDate,
                text: item.text,
                dead: item.dead || false,
                parent: item.parent,
                poll: item.poll,
                kids: item.kids || [],
                url: item.url,
                score: item.score || 0,
                title: item.title,
                parts: item.parts || [],
                descendants: item.descendants || 0,
              },
            },
            { upsert: true }
          );

          // Categorize and route
          const category = this.filterService.categorizeItem(item);

          if (category === 'technical') {
            await TechnicalPiece.updateOne(
              { hnId: item.id },
              {
                $set: {
                  hnId: item.id,
                  title: item.title || '',
                  url: item.url,
                  by: item.by || 'unknown',
                  score: item.score || 0,
                  time: itemDate,
                  summary: item.text,
                },
              },
              { upsert: true }
            );
            itemsProcessed++;
          } else if (category === 'startup') {
            await StartupNews.updateOne(
              { hnId: item.id },
              {
                $set: {
                  hnId: item.id,
                  title: item.title || '',
                  url: item.url,
                  by: item.by || 'unknown',
                  score: item.score || 0,
                  time: itemDate,
                  summary: item.text,
                },
              },
              { upsert: true }
            );
            itemsProcessed++;
          } else if (category === 'job') {
            const parsed = this.jobManager.parseJob(item);
            await Job.updateOne(
              { hnId: item.id },
              {
                $set: {
                  hnId: parsed.hnId,
                  company: parsed.company,
                  role: parsed.role,
                  location: parsed.location,
                  remote: parsed.remote,
                  salary: parsed.salary,
                  techStack: parsed.techStack,
                  status: parsed.status,
                  rawText: parsed.rawText,
                },
              },
              { upsert: true }
            );
            itemsProcessed++;
          }
        } catch (itemError: any) {
          logger.error({ runId, itemId: item.id, err: itemError.message }, 'Failed to process individual HN item');
        }
      }

      const endTime = new Date();

      // Update scrape run logs with metrics
      await ScrapeRun.findOneAndUpdate(
        { runId },
        {
          endTime,
          status: 'success',
          itemsFetched,
          itemsProcessed,
        },
        { new: true }
      );

      logger.info({ runId, itemsFetched, itemsProcessed }, 'Pipeline run completed successfully');

      return {
        runId,
        status: 'success',
        itemsFetched,
        itemsProcessed,
        startTime,
        endTime,
      };
    } catch (pipelineError: any) {
      const endTime = new Date();
      logger.error({ runId, err: pipelineError.message }, 'Pipeline run failed');

      await ScrapeRun.findOneAndUpdate(
        { runId },
        {
          endTime,
          status: 'failed',
          error: pipelineError.message || 'Unknown pipeline failure',
        },
        { new: true }
      );

      throw pipelineError;
    }
  }
}
