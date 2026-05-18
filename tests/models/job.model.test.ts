import { Job } from '@/models/job.model';

describe('Job Model Validation', () => {
  it('should validate a correct Job payload successfully', () => {
    const validJob = new Job({
      hnId: 12345,
      company: 'Acme Corp',
      role: 'Software Engineer',
      location: 'San Francisco, CA',
      remote: true,
      salary: '$150k - $200k',
      techStack: ['Node.js', 'TypeScript', 'MongoDB'],
      status: 'active',
      rawText: 'Acme Corp is hiring a Software Engineer...',
    });

    const validationError = validJob.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should set default status to active and remote to false if not provided', () => {
    const job = new Job({
      hnId: 12345,
      company: 'Acme Corp',
      role: 'Software Engineer',
      location: 'San Francisco, CA',
      rawText: 'Acme Corp is hiring...',
    });

    expect(job.status).toBe('active');
    expect(job.remote).toBe(false);
  });

  it('should fail validation when required fields are missing', () => {
    const invalidJob = new Job({});
    const validationError = invalidJob.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError?.errors['hnId']).toBeDefined();
    expect(validationError?.errors['company']).toBeDefined();
    expect(validationError?.errors['role']).toBeDefined();
    expect(validationError?.errors['location']).toBeDefined();
    expect(validationError?.errors['rawText']).toBeDefined();
  });

  it('should enforce unique index constraint on hnId in the schema', () => {
    const hnIdPath = Job.schema.path('hnId');
    expect(hnIdPath).toBeDefined();
    expect((hnIdPath as any).options.unique).toBe(true);
  });

  it('should fail validation if status is invalid', () => {
    const invalidJob = new Job({
      hnId: 12345,
      company: 'Acme Corp',
      role: 'Software Engineer',
      location: 'San Francisco, CA',
      rawText: 'Acme Corp is hiring...',
      status: 'invalid-status',
    });

    const validationError = invalidJob.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors['status']).toBeDefined();
  });
});
