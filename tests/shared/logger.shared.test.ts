import { logger } from '../../src/shared/logger.shared';

describe('Logger', () => {
  it('should export a logger instance with info, error, and warn methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });
});
