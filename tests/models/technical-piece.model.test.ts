import { TechnicalPiece } from '@/models/technical-piece.model';

describe('TechnicalPiece Model Validation', () => {
  it('should validate a correct TechnicalPiece payload successfully', () => {
    const validPiece = new TechnicalPiece({
      hnId: 12345,
      title: 'Building a compiler in Rust',
      url: 'https://rust-lang.org',
      by: 'rustguy',
      score: 150,
      time: new Date(),
      summary: 'A detailed walkthrough of building a custom compiler.',
    });

    const validationError = validPiece.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should fail validation when required fields are missing', () => {
    const invalidPiece = new TechnicalPiece({});
    const validationError = invalidPiece.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError?.errors['hnId']).toBeDefined();
    expect(validationError?.errors['title']).toBeDefined();
    expect(validationError?.errors['by']).toBeDefined();
    expect(validationError?.errors['score']).toBeDefined();
    expect(validationError?.errors['time']).toBeDefined();
  });

  it('should enforce unique index constraint on hnId in the schema', () => {
    const hnIdPath = TechnicalPiece.schema.path('hnId');
    expect(hnIdPath).toBeDefined();
    expect((hnIdPath as any).options.unique).toBe(true);
  });
});
