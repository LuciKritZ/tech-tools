describe('Environment Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should export validated environment variables when all required vars are present', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.MONGO_DB_URI = 'mongodb://localhost:27017';
    process.env.GH_TOKEN = 'ghp_fake_token';
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/test';
    process.env.LOCAL_MONGO_URI = 'mongodb://localhost:27017/archive';

    const { env: reloadedEnv } = require('../../src/env/index.env');
    
    expect(reloadedEnv.NODE_ENV).toBe('development');
    expect(reloadedEnv.PORT).toBe(3000); // parsed to number
    expect(reloadedEnv.MONGO_DB_URI).toBe('mongodb://localhost:27017');
    expect(reloadedEnv.GH_TOKEN).toBe('ghp_fake_token');
  });

  it('should throw an error if required environment variables are missing', () => {
    delete process.env.MONGO_DB_URI;
    
    expect(() => {
      require('../../src/env/index.env');
    }).toThrow();
  });
});
