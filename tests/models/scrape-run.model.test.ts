import { ScrapeRun } from '@/models/scrape-run.model';

describe('ScrapeRun Model Validation', () => {
  it('should validate a correct ScrapeRun payload successfully', () => {
    const validRun = new ScrapeRun({
      runId: 'run-123456',
      startTime: new Date(),
      endTime: new Date(),
      status: 'success',
      itemsFetched: 50,
      itemsProcessed: 5,
    });

    const validationError = validRun.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should fail validation when required fields are missing', () => {
    const invalidRun = new ScrapeRun({});
    const validationError = invalidRun.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError?.errors['runId']).toBeDefined();
    expect(validationError?.errors['startTime']).toBeDefined();
    expect(validationError?.errors['endTime']).toBeDefined();
    expect(validationError?.errors['status']).toBeDefined();
    expect(validationError?.errors['itemsFetched']).toBeDefined();
    expect(validationError?.errors['itemsProcessed']).toBeDefined();
  });

  it('should enforce unique index constraint on runId in the schema', () => {
    const runIdPath = ScrapeRun.schema.path('runId');
    expect(runIdPath).toBeDefined();
    expect((runIdPath as any).options.unique).toBe(true);
  });

  it('should set default createdAt timestamp', () => {
    const run = new ScrapeRun({
      runId: 'run-123456',
      startTime: new Date(),
      endTime: new Date(),
      status: 'success',
      itemsFetched: 50,
      itemsProcessed: 5,
    });

    expect(run.createdAt).toBeDefined();
    expect(run.createdAt instanceof Date).toBe(true);
  });

  it('should define a TTL index on the createdAt field to automatically expire records after 90 days', () => {
    const createdAtPath = ScrapeRun.schema.path('createdAt');
    expect(createdAtPath).toBeDefined();
    expect((createdAtPath as any).options.expires).toBe(7776000); // 90 days in seconds
  });
});
