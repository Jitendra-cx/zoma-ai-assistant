# Project Structure

## Directory Organization

```
src/
├── app.module.ts              # Root application module
├── app.controller.ts         # Root controller
├── main.ts                   # Application entry point
│
├── core/                     # Core/shared functionality
│   ├── auth/                 # Authentication module
│   │   └── jwt-auth.module.ts
│   ├── config/              # Configuration management
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── llm.config.ts
│   │   ├── redis.config.ts
│   │   ├── rate-limit.config.ts
│   │   └── config.module.ts
│   ├── database/            # Database layer
│   │   ├── database.module.ts
│   │   ├── prisma.service.ts
│   │   ├── models/          # (Empty - Prisma models in prisma/)
│   │   └── repositories/    # (Empty - Prisma handles queries)
│   ├── redis/               # Redis integration
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   ├── filters/             # Exception filters
│   │   └── http-exception.filter.ts
│   ├── interceptors/        # Request/response interceptors
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── decorators/          # Custom decorators
│   │   ├── current-user.decorator.ts
│   │   └── permissions.decorator.ts
│   ├── guards/              # Authentication/authorization guards
│   │   ├── jwt-auth.guard.ts
│   │   ├── permissions.guard.ts
│   │   └── rate-limit.guard.ts
│   ├── services/            # Shared services
│   │   ├── logger.service.ts
│   │   ├── permission.service.ts
│   │   ├── services.module.ts
│   │   └── rate-limit/      # Rate limiting service
│   │       ├── rate-limit.module.ts
│   │       └── rate-limit.service.ts
│   └── utils/               # Helper functions
│       ├── jwt.ts
│       ├── password.ts
│       └── logger.ts
│
├── modules/                  # Feature modules
│   ├── auth/                 # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── dto/
│   │       └── index.ts      # LoginDto, RefreshTokenDto
│   │
│   └── ai/                   # AI Assistant module
│       ├── ai.module.ts
│       ├── ai.controller.ts
│       ├── ai.service.ts
│       ├── README.md         # AI module documentation
│       ├── dto/              # Data Transfer Objects
│       │   └── enhance.dto.ts
│       ├── context/          # Context assembly
│       │   ├── context.module.ts
│       │   ├── context-assembler.service.ts
│       │   └── data-sanitizer.service.ts
│       ├── llm/              # LLM provider abstraction
│       │   ├── llm.module.ts
│       │   ├── llm-provider.factory.ts
│       │   └── providers/
│       │       ├── openai.provider.ts
│       │       ├── claude.provider.ts
│       │       ├── gemini.provider.ts
│       │       └── mock.provider.ts    # Development/testing provider
│       ├── prompt/           # Prompt engineering
│       │   ├── prompt.module.ts
│       │   └── prompt-engineer.service.ts
│       ├── sse/              # Server-Sent Events
│       │   ├── sse.module.ts
│       │   └── sse.service.ts
│       └── session/          # Session management
│           ├── session.module.ts
│           ├── session-manager.service.ts
│           └── interfaces/
│               └── session.interface.ts
│
└── shared/                   # Shared components
    ├── interfaces/          # Common interfaces
    │   ├── llm-provider.interface.ts
    │   ├── context.interface.ts
    │   └── session.interface.ts
    ├── constants/           # App constants
    │   ├── permissions.ts
    │   ├── role-permissions.ts
    │   └── roles.ts
    ├── dto/                 # Common DTOs
    └── enums/               # Enums
```

## Key Principles

1. **core/** - Shared infrastructure code (configs, filters, guards, interceptors, utils, services)
2. **modules/** - Feature modules (each module is self-contained)
3. **shared/** - Shared types, interfaces, DTOs, constants, enums

## Core Directory Structure

### `core/auth/`
JWT authentication module that provides global authentication guards and utilities.

### `core/config/`
Configuration organized by domain:
- `app.config.ts` - Application settings (port, CORS, environment)
- `database.config.ts` - PostgreSQL database configuration
- `llm.config.ts` - LLM provider configuration
- `redis.config.ts` - Redis connection and TTL settings
- `rate-limit.config.ts` - Rate limiting thresholds and windows

### `core/database/`
Prisma integration layer:
- `prisma.service.ts` - Prisma Client service
- Database models are defined in `prisma/schema.prisma`

### `core/redis/`
Redis service for caching, session storage, and rate limiting.

### `core/services/`
Shared services used across modules:
- `permission.service.ts` - Permission checking with Redis caching
- `rate-limit.service.ts` - Rate limiting logic
- `services.module.ts` - Global services module

### `core/guards/`
Route protection:
- `jwt-auth.guard.ts` - Validates JWT access tokens
- `permissions.guard.ts` - Checks user permissions
- `rate-limit.guard.ts` - Enforces rate limits

### `core/decorators/`
Custom decorators for route handlers:
- `@CurrentUser()` - Extracts authenticated user from request
- `@Permissions()` - Marks required permissions for routes

## Module Organization

### Auth Module (`modules/auth/`)
Handles user authentication:
- Login with email/password
- JWT token generation (access + refresh)
- Token refresh mechanism
- Logout with token revocation
- User profile endpoint

### AI Module (`modules/ai/`)
AI-powered text enhancement:
- **Controller**: REST endpoints for AI operations
- **Service**: Business logic orchestration
- **Context**: Gathers related data based on field type
- **LLM**: Provider abstraction with factory pattern
- **Prompt**: Builds prompts for different AI actions
- **SSE**: Server-Sent Events for real-time streaming
- **Session**: Redis-based session management

Each sub-module (context, llm, prompt, sse, session) is self-contained with its own module definition.

## Shared Components

### `shared/interfaces/`
Type definitions for:
- `llm-provider.interface.ts` - LLM provider contract
- `context.interface.ts` - Context types (FieldType, ContextOption)
- `session.interface.ts` - Session data structure

### `shared/constants/`
Application constants:
- `permissions.ts` - All permission constants
- `role-permissions.ts` - Role-permission mappings
- `roles.ts` - Role definitions

## Configuration

Configuration follows NestJS ConfigModule pattern:
- Each domain has its own config file in `core/config/`
- Environment variables loaded from `.env`
- Type-safe configuration with validation

## Database

- **ORM**: Prisma
- **Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`
- **Seeders**: `prisma/seeders/`

## Documentation

- **Main README**: `README.md` - Project overview and setup
- **AI Module README**: `src/modules/ai/README.md` - Detailed AI module documentation
- **Structure**: This file - Project organization guide
