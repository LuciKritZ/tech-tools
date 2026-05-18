# tech-tools

tech-tools is a robust, high-performance backend application designed to gracefully ingest, filter, and structure job postings, technical articles, and startup news from Hacker News. It is built using Node.js, TypeScript, Express.js, and MongoDB.

The architecture emphasizes strict data integrity, telemetry monitoring via loopback endpoints, and reliable daemon execution under process supervisors.

---

## System Requirements

- Node.js v20.0.0 or higher
- MongoDB v6.0 or higher
- PM2 (Optional, for production daemon monitoring)

---

## Environment Configuration

To run this project, clone the environment template into a `.env` file at the root:

```bash
cp .env.example .env
```

Review the configurable options inside `.env`:

- **PORT**: Port that the local loopback Express server listens on (Default: 3000).
- **MONGO_DB_URI**: Mongoose connection string for local MongoDB instances (Default: mongodb://127.0.0.1:27017/tech-tools).
- **NODE_ENV**: Target node execution environment ("production" or "development").
- **LOG_LEVEL**: Logging granularity ("trace", "debug", "info", "warn", "error").

---

## Local Development Setup

1. Install project dependencies:

   ```bash
   npm install
   ```

2. Spin up the development server with hot-reload monitoring:

   ```bash
   npm run start:nodemon
   ```

3. Alternatively, start the dev server directly via ts-node:
   ```bash
   npm run dev
   ```

---

## Production Build & Run

### 1. Compile & Resolve Path Aliases

To compile the TypeScript project into standard, alias-resolved JavaScript, execute:

```bash
npm run build
```

This routine does two critical actions:

- Compiles the modules into flat, optimized files inside `./dist/` using the `"rootDir": "./src"` parameter.
- Automatically resolves custom `@/*` path alias mappings into compliant relative path references using `tsc-alias`.

### 2. Launch Production Server

To run the production bundle locally using a single Node process:

```bash
npm run start:prod
```

---

## PM2 Process Supervision

The project includes pre-configured integration with PM2 for production management (single instance daemon tracking, crash auto-recovery, and memory leaks protection).

Manage the daemon process using the following registered NPM scripts:

- **Start Daemon**:
  ```bash
  npm run pm2:start
  ```
- **Check Process Status**:
  ```bash
  npm run pm2:status
  ```
- **Stream Supervisor Logs**:
  ```bash
  npm run pm2:logs
  ```
- **Restart Daemon Instance**:
  ```bash
  npm run pm2:restart
  ```
- **Suspend/Stop Daemon**:
  ```bash
  npm run pm2:stop
  ```

---

## Telemetry & Health Monitoring

The Express application exposes dedicated diagnostic endpoints private to the loopback interface (`127.0.0.1`) to monitor database connectivity, resource usage, collection statistics, and manually trigger ingestion:

- **System Health Checks**:

  ```bash
  curl -s http://127.0.0.1:3000/internal/health
  ```

  Returns connection state, uptime, and system heap memory statistics.

- **Collection Statistics**:

  ```bash
  curl -s http://127.0.0.1:3000/internal/stats
  ```

  Returns count aggregates for `Job` (active/inactive), `TechnicalPiece`, `StartupNews`, and successful/failed `ScrapeRun` logs.

- **Manual Scraper Ingestion Trigger**:
  ```bash
  curl -X POST -s "http://127.0.0.1:3000/internal/scrape?limit=10"
  ```
  Triggers a manual scraping run of up to `limit` items, returning ingestion metrics.

## Local Database Backups

A clean, safe backup script is provided in `./scripts/backup-db.sh` to extract and compress database exports:

- **Run Backup**:
  ```bash
  bash scripts/backup-db.sh
  ```
  This creates a gzipped archive under `./backups/tech-tools-[timestamp].gz` and automatically cleans up archives older than 7 days to preserve disk space.

---

## Quality Assurance & Testing

### 1. Run Test Suite

To execute all unit, integration, and E2E pipeline tests, run:

```bash
npm test
```

### 2. Linting & Formatting Checks

Verify code style rules and parser safety by executing:

```bash
npm run lint:check
npm run format:check
```

---

## License

MIT
