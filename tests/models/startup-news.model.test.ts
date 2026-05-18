import { StartupNews } from '@/models/startup-news.model';

describe('StartupNews Model Validation', () => {
  it('should validate a correct StartupNews payload successfully', () => {
    const validNews = new StartupNews({
      hnId: 12345,
      title: 'Acme raises $50M Series A',
      url: 'https://techcrunch.com/acme',
      by: 'founder1',
      score: 300,
      time: new Date(),
      summary: 'Acme announces massive growth and funding.',
    });

    const validationError = validNews.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should fail validation when required fields are missing', () => {
    const invalidNews = new StartupNews({});
    const validationError = invalidNews.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError?.errors['hnId']).toBeDefined();
    expect(validationError?.errors['title']).toBeDefined();
    expect(validationError?.errors['by']).toBeDefined();
    expect(validationError?.errors['score']).toBeDefined();
    expect(validationError?.errors['time']).toBeDefined();
  });

  it('should enforce unique index constraint on hnId in the schema', () => {
    const hnIdPath = StartupNews.schema.path('hnId');
    expect(hnIdPath).toBeDefined();
    expect((hnIdPath as any).options.unique).toBe(true);
  });
});
