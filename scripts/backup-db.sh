#!/usr/bin/env bash

# standard defensive shell settings
set -euo pipefail

echo "========================================="
echo "Starting Database Backup Utility Run"
echo "Time: $(date -u)"
echo "========================================="

# Check for mongodump CLI dependency
if ! command -v mongodump &> /dev/null; then
  echo "❌ Error: 'mongodump' command line tool was not found on your system."
  echo "Please install MongoDB Database Tools (https://www.mongodb.com/try/download/database-tools)"
  exit 1
fi

# Source environment variables if file exists
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [[ -z "${MONGO_DB_URI:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    echo "Sourcing database variables from .env file..."
    # Extract only lines that match variable assignments, ignoring comments
    while IFS= read -r line || [[ -n "$line" ]]; do
      # Ignore empty lines and comments
      if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ "$line" =~ ^[A-Za-z0-9_]+= ]]; then
        export "$line"
      fi
    done < "$ENV_FILE"
  fi
fi

# Validate that MONGO_DB_URI is defined
if [[ -z "${MONGO_DB_URI:-}" ]]; then
  echo "❌ Error: MONGO_DB_URI is not set in environment or .env file."
  exit 1
fi

# Create backups directory if missing
BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"

# Perform database backup dump
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tech-tools-$TIMESTAMP.gz"

echo "Creating compressed MongoDB backup archive..."
if mongodump --uri="$MONGO_DB_URI" --archive="$BACKUP_FILE" --gzip; then
  echo "✅ Backup successfully exported to: $BACKUP_FILE"
else
  echo "❌ Error: Database backup dump failed."
  exit 1
fi

# Clean up backups older than 7 days to preserve disk space
echo "Pruning backup archives older than 7 days..."
if [[ -d "$BACKUP_DIR" ]]; then
  find "$BACKUP_DIR" -type f -name "tech-tools-*.gz" -mtime +7 -exec rm -f {} \;
  echo "✅ Backup cleanup completed."
fi

echo "========================================="
echo "Database Backup Cycle Finished Successfully"
echo "========================================="
