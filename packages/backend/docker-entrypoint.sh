#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, skipping database operations"
  exec "$@"
  exit 0
fi

# Wait for database to be ready
echo "⏳ Waiting for database..."
until pg_isready -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-zoma_dev}" >/dev/null 2>&1; do
  echo "   Database is unavailable - sleeping"
  sleep 1
done

# Run migrations based on environment
if [ "$NODE_ENV" = "development" ]; then  
  yarn db:migrate_all || {
    echo "❌ Migration failed"
    exit 1
  }
fi

echo "📦 Generating Prisma Client..."
yarn db:generate

# Run seeds only in development or if RUN_SEED is true
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Running seeds..."
  yarn db:seed || {
    echo "⚠️  Seed failed (non-critical)"
  }
fi

exec "$@"

