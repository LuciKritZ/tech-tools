import { Server } from 'http';
import applicationModule from '../../src/modules/app.module';
import { logger } from '../../src/shared/logger.shared';

describe('App Module', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll((done) => {
    const app = applicationModule();
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should export an Express application that returns 200 for /test', async () => {
    const res = await fetch(`${baseUrl}/test`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      success: true,
      message: 'API is working',
    });
  });

  it('should parse JSON request bodies', async () => {
    const app = applicationModule();
    // Register a temporary route to echo post body
    app.post('/echo', (req, res) => {
      res.status(200).json(req.body);
    });

    const testServer = app.listen(0, '127.0.0.1', async () => {
      const address = testServer.address();
      if (address && typeof address !== 'string') {
        const url = `http://127.0.0.1:${address.port}`;
        const res = await fetch(`${url}/echo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hello: 'world' }),
        });
        const body = await res.json();
        expect(body).toEqual({ hello: 'world' });
        testServer.close();
      }
    });
  });

  it('should log HTTP requests via Pino logger', async () => {
    const loggerSpy = jest.spyOn(logger, 'info');

    await fetch(`${baseUrl}/test`);

    // Verify logger.info was called with request/response metadata
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/test',
      }),
      expect.any(String)
    );

    loggerSpy.mockRestore();
  });
});
