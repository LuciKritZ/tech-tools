import { logger } from '@/shared/index.shared';
import { HnItemPayload } from '@/types/index.types';

export class HnClientService {
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';
  private maxRetries = 3;

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetches a single HN item by its numeric ID with exponential backoff retries.
   */
  async fetchItem(id: number): Promise<HnItemPayload> {
    const url = `${this.baseUrl}/item/${id}.json`;
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data as HnItemPayload;
      } catch (error) {
        attempt++;
        const backoffDelay = 100 * Math.pow(2, attempt);
        logger.warn(
          { id, attempt, error: error instanceof Error ? error.message : String(error) },
          `Failed to fetch item ${id}. Retrying in ${backoffDelay}ms...`
        );
        if (attempt >= this.maxRetries) {
          logger.error({ id, error }, `Failed to fetch item ${id} after ${this.maxRetries} attempts`);
          throw new Error(`Failed to fetch item ${id} after ${this.maxRetries} attempts`);
        }
        await this.delay(backoffDelay);
      }
    }

    throw new Error(`Failed to fetch item ${id} after ${this.maxRetries} attempts`);
  }

  /**
   * Fetches a list of story IDs based on type: 'top' | 'new' | 'show' | 'job'
   */
  async fetchStoryIds(type: 'top' | 'new' | 'show' | 'job'): Promise<number[]> {
    const endpointMap = {
      top: 'topstories.json',
      new: 'newstories.json',
      show: 'showstories.json',
      job: 'jobstories.json',
    };

    const url = `${this.baseUrl}/${endpointMap[type]}`;
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data as number[];
      } catch (error) {
        attempt++;
        const backoffDelay = 100 * Math.pow(2, attempt);
        logger.warn(
          { type, attempt, error: error instanceof Error ? error.message : String(error) },
          `Failed to fetch ${type} story IDs. Retrying in ${backoffDelay}ms...`
        );
        if (attempt >= this.maxRetries) {
          logger.error({ type, error }, `Failed to fetch ${type} story IDs after ${this.maxRetries} attempts`);
          throw new Error(`Failed to fetch ${type} story IDs after ${this.maxRetries} attempts`);
        }
        await this.delay(backoffDelay);
      }
    }

    throw new Error(`Failed to fetch ${type} story IDs after ${this.maxRetries} attempts`);
  }

  /**
   * Fetches multiple items concurrently with a strict limit of 10 concurrent requests to respect the HN API.
   */
  async fetchItems(ids: number[]): Promise<HnItemPayload[]> {
    const { default: pLimit } = await import('p-limit');
    const limit = pLimit(10);
    const tasks = ids.map((id) => limit(() => this.fetchItem(id)));
    return Promise.all(tasks);
  }
}
