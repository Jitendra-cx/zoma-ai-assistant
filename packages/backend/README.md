# Zoma AI Assistant Backend

A production-ready NestJS backend providing AI-powered text enhancement capabilities with comprehensive authentication, authorization, and session management.

## Overview

This backend serves as the core API for the Zoma AI Assistant feature, offering intelligent text processing across multiple contexts. It's built with enterprise-grade architecture, featuring JWT authentication, role-based access control, rate limiting, and real-time streaming capabilities.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Testing](#testing)
- [Documentation](#documentation)

## Features

### Core Capabilities

- **AI Text Enhancement**: Multiple LLM providers (OpenAI, Claude, Gemini) with automatic failover
- **Real-time Streaming**: Server-Sent Events (SSE) for live response streaming
- **Session Management**: Track and manage AI enhancement sessions
- **Rate Limiting**: Per-user token and cost-based limits
- **Context Assembly**: Gathers related data based on field type and entity relationships

### Security & Access Control

- **JWT Authentication**: Access and refresh token-based authentication
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **Token Management**: Redis-backed token storage and revocation
- **Permission Guards**: Route-level permission enforcement

### Infrastructure

- **Prisma ORM**: Type-safe database access with migrations
- **Redis Integration**: Session storage, caching, and rate limiting
- **PostgreSQL**: Relational database for users, roles, and permissions
- **Docker Support**: Containerized development and deployment

## Technology Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Cache**: Redis 7.x
- **Authentication**: JWT (via @nestjs/jwt)
- **Validation**: class-validator, class-transformer
- **Testing**: Jest

## Project Structure

```
src/
├── app.module.ts              # Root application module
├── main.ts                    # Application entry point
│
├── core/                      # Core/shared functionality
│   ├── auth/                  # JWT authentication module
│   ├── config/                # Configuration management
│   ├── database/              # Prisma service and migrations
│   ├── decorators/            # Custom decorators (@CurrentUser, @Permissions)
│   ├── filters/              # Exception filters
│   ├── guards/               # Authentication & authorization guards
│   ├── interceptors/         # Request/response interceptors
│   ├── redis/                # Redis service
│   ├── services/              # Shared services (rate limiting, permissions)
│   └── utils/                 # Helper functions (JWT, password, logger)
│
├── modules/                    # Feature modules
│   ├── auth/                  # Authentication module (login, logout, refresh)
│   └── ai/                    # AI Assistant module
│
└── shared/                     # Shared components
    ├── constants/             # App constants (permissions)
    ├── interfaces/            # Common interfaces
    └── dto/                   # Common DTOs
```

For detailed AI module documentation, see [AI Module README](./src/modules/ai/README.md).

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Yarn (recommended) or npm
- PostgreSQL 15+ (for database)
- Redis 7+ (for caching and rate limiting)
- LLM API keys (OpenAI, Claude, or Gemini), mock data will be used if failes thz

### Manual Installation

1. **Clone and navigate to the backend directory**
   ```bash
   cd packages/backend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env-sample .env
   ```
   Edit `.env` and configure your database, Redis, and LLM API keys.

4. **Set up the database**
   ```bash
   # Run migrations
   yarn db:migrate_all

   # Generate Prisma Client
   yarn db:generate   

   # Seed initial data (permissions, roles, users)
   yarn db:seed
   ```

5. **Start the development server**
   ```bash
   yarn dev
   ```

The server will start on `http://localhost:7700` (or the port specified in your `.env`).

### Docker Setup

For containerized development:

```bash
# From project root
docker compose up -d
```

This starts PostgreSQL, Redis, and the backend service. Migrations and seeds run automatically on container startup.

## Configuration

### Environment Variables

Key configuration options (see `.env-sample` for complete list):

**Application**
- `NODE_ENV`: Environment (development, production)
- `PORT`: Server port (default: 7700)
- `API_URL`: Base API URL

**Database (PostgreSQL)**
- `DATABASE_URL`: PostgreSQL connection string

**Redis**
- `REDIS_URL`: Redis connection string
- `REDIS_TTL_SESSIONS`: Session TTL in seconds
- `REDIS_TTL_CACHE`: Cache TTL in seconds

**JWT**
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_ACCESS_TOKEN_EXPIRY_IN_MINUTES`: Access token expiry
- `JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES`: Refresh token expiry

**LLM Providers**
- `OPENAI_API_KEY`: OpenAI API key
- `CLAUDE_API_KEY`: Claude API key
- `GEMINI_API_KEY`: Gemini API key
- `DEFAULT_LLM_PROVIDER`: Default provider (openai, claude, gemini)
- `LLM_FALLBACK_PROVIDERS`: Comma-separated fallback providers

**Rate Limiting**
- `AI_RATE_LIMIT_USER_REQUESTS`: Requests per window
- `AI_RATE_LIMIT_USER_TOKENS`: Tokens per window
- `AI_RATE_LIMIT_ORG_COST`: Cost limit per window
- `AI_RATE_LIMIT_WINDOW_HOURS`: Window duration in hours

## API Endpoints

### Authentication

```
POST   /api/auth/login          # Login with email/password
POST   /api/auth/refresh        # Refresh access token
POST   /api/auth/logout         # Logout (clears refresh token cookie)
GET    /api/auth/me             # Get current user (protected)
```

### AI Assistant

```
POST   /api/ai/enhance          # Create enhancement request
GET    /api/ai/stream/:sessionId    # SSE stream endpoint
GET    /api/ai/session/:sessionId   # Get session status
DELETE /api/ai/session/:sessionId   # Cancel session
GET    /api/ai/usage            # Get usage statistics
```

All AI endpoints require authentication and appropriate permissions. See [AI Module README](./src/modules/ai/README.md) for detailed documentation.

### Health Check

```
GET    /api/health              # Health check endpoint
```

## Authentication & Authorization

### Authentication Flow

1. **Login**: POST `/api/auth/login` with email and password
   - Returns access token in response body
   - Sets refresh token as HTTP-only cookie
   - Stores access token in Redis with TTL

2. **Access Protected Routes**: Include access token in Authorization header
   ```
   Authorization: Bearer <access-token>
   ```

3. **Refresh Token**: POST `/api/auth/refresh`
   - Automatically uses refresh token from cookie
   - Returns new access token
   - Validates token version to detect token invalidation

4. **Logout**: POST `/api/auth/logout`
   - Clears refresh token cookie
   - Removes access token from Redis (if token ID provided)

### Authorization

The application uses a role-based permission system:

- **Roles**: Collections of permissions (e.g., Admin, Editor, Viewer)
- **Permissions**: Granular actions (e.g., `ai.enhance.create`, `user.view`)
- **Special Flag**: Roles can have `all_permission=true` to bypass permission checks

### Test Structure

Tests are organized alongside source files with `.spec.ts` extension:
- Unit tests for services
- Integration tests for controllers
- E2E tests (when applicable)

## Documentation

- [AI Module Documentation](./src/modules/ai/README.md) - Detailed AI feature documentation
- [Prisma Schema](./prisma/schema.prisma) - Database schema definition
- [Permissions](./src/shared/constants/permissions.ts) - Available permissions

## Development

### Database Migrations

```bash
# Create a new migration
yarn db:migrate migration_name

```

### Code Style

The project uses ESLint and Prettier. Run linting:

```bash
yarn lint
yarn lint:fix
```
