import { HnItem } from '@/models/hn-item.model';

describe('HnItem Model Validation', () => {
  it('should validate a correct HN item payload successfully', () => {
    const validItem = new HnItem({
      hnId: 12345,
      type: 'story',
      by: 'author',
      time: new Date(),
      title: 'Valid Story',
      url: 'https://google.com',
    });

    const validationError = validItem.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should fail validation when required fields are missing', () => {
    const invalidItem = new HnItem({});
    const validationError = invalidItem.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError?.errors['hnId']).toBeDefined();
    expect(validationError?.errors['type']).toBeDefined();
    expect(validationError?.errors['by']).toBeDefined();
    expect(validationError?.errors['time']).toBeDefined();
  });

  it('should enforce unique index constraint on hnId in the schema', () => {
    const hnIdPath = HnItem.schema.path('hnId');
    expect(hnIdPath).toBeDefined();
    expect((hnIdPath as any).options.unique).toBe(true);
  });

  it('should fail validation if type is invalid', () => {
    const invalidItem = new HnItem({
      hnId: 12345,
      type: 'invalid-type',
      by: 'author',
      time: new Date(),
    });

    const validationError = invalidItem.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['type']).toBeDefined();
  });
});
