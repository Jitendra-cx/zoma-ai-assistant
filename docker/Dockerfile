FROM node:22.10.0-alpine

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Layer cache
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/yarn.lock ./packages/backend/

# Install dependencies
RUN cd packages/backend && \
    yarn install --production --frozen-lockfile && \
    yarn cache clean

# Copy the backend code
COPY packages/backend ./packages/backend

# Build
RUN cd packages/backend && yarn build

ENV NODE_ENV=production
EXPOSE 8000

WORKDIR /app/packages/backend
# Copy the entrypoint
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]