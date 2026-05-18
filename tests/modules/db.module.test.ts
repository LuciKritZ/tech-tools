import mongoose from 'mongoose';
import { logger } from '../../src/shared/logger.shared';
import databaseService from '../../src/modules/db.module';

jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: { host: 'localhost' },
}));

jest.mock('../../src/shared/logger.shared', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => cb() as any);
  });

  afterEach(() => {
    (global.setTimeout as unknown as jest.Mock).mockRestore();
  });

  it('should connect to MongoDB successfully and log info', async () => {
    (mongoose.connect as jest.Mock).mockResolvedValueOnce({
      connection: { host: 'localhost' },
    });

    await databaseService('mongodb://localhost:27017');

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017', expect.any(Object));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Connecting to database'));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('database connected'));
  });

  it('should retry connecting to MongoDB on failure with exponential backoff up to 3 times', async () => {
    (mongoose.connect as jest.Mock)
      .mockRejectedValueOnce(new Error('Connection failed 1'))
      .mockRejectedValueOnce(new Error('Connection failed 2'))
      .mockRejectedValueOnce(new Error('Connection failed 3'))
      .mockRejectedValueOnce(new Error('Connection failed 4'));

    await expect(databaseService('mongodb://localhost:27017')).rejects.toThrow('Failed to connect to database after 3 retries');

    expect(mongoose.connect).toHaveBeenCalledTimes(4);
    expect(logger.error).toHaveBeenCalledTimes(5);
  });
});
