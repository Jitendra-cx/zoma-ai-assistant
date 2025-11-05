#!/bin/sh

set -e

echo "Starting Zoma AI Backend..."

# yarn seed
yarn start

# exec "$@"
# echo "Holding container for debugging..."
# tail -f /dev/null
