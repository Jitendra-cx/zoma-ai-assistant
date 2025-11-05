# AI Assistant Module

The AI Assistant module provides intelligent text enhancement capabilities using multiple Large Language Model (LLM) providers. It supports real-time streaming, context-aware processing, and comprehensive session management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [LLM Providers](#llm-providers)
- [Session Management](#session-management)
- [Rate Limiting](#rate-limiting)
- [Context Assembly](#context-assembly)

## Overview

The AI module enables users to enhance text through various actions like improving quality, summarizing, fixing grammar, and more. It supports multiple LLM providers (OpenAI, Claude, Gemini) with automatic failover and includes a mock provider for development.

## Features

- **Multiple LLM Providers**: OpenAI, Claude, Gemini with automatic failover
- **Real-time Streaming**: Server-Sent Events (SSE) for word-by-word streaming
- **Context Assembly**: Gathers related data based on field type and entity relationships
- **Session Management**: Track enhancement sessions with status (pending, processing, completed, cancelled)
- **Rate Limiting**: Per-user limits for requests, tokens, and cost
- **Permission-Based Access**: Granular permissions for different AI operations
- **Cost Tracking**: Monitor token usage and costs per user

## Architecture

```
ai/
├── ai.controller.ts           # REST endpoints
├── ai.service.ts              # Business logic orchestration
├── ai.module.ts               # Module configuration
│
├── context/                   # Context assembly
│   ├── context-assembler.service.ts  # Gathers related data
│   └── data-sanitizer.service.ts     # Sanitizes data for LLM
│
├── llm/                       # LLM provider abstraction
│   ├── llm-provider.factory.ts       # Provider factory
│   └── providers/
│       ├── openai.provider.ts
│       ├── claude.provider.ts
│       ├── gemini.provider.ts
│       └── mock.provider.ts   # Development/testing provider
│
├── prompt/                    # Prompt engineering
│   └── prompt-engineer.service.ts    # Builds prompts for actions
│
├── sse/                       # Server-Sent Events
│   └── sse.service.ts         # SSE connection management
│
└── session/                   # Session management
    ├── session-manager.service.ts    # Redis-based session storage
    └── interfaces/
        └── session.interface.ts
```

## API Endpoints

All endpoints require JWT authentication and appropriate permissions.

### Create Enhancement Request

```
POST /api/ai/enhance
```

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "text": "The text to enhance",
  "action": "improve",
  "context": {
    "fieldType": "opportunity_description",
    "entityId": "opp_123",
    "fieldId": "desc_456",
    "metadata": {}
  },
  "includeContext": ["opportunity_details", "current_tab"],
  "customPrompt": "Make it more professional",
  "tone": "formal"
}
```

**Available Actions:**
- `improve` - Enhance overall quality
- `make_shorter` - Condense text
- `summarize` - Create summary
- `fix_grammar` - Fix grammatical errors
- `change_tone` - Change writing tone
- `expand` - Expand text with more details
- `free_prompt` - Custom instruction (requires `customPrompt`)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "streamUrl": "/api/ai/stream/550e8400-e29b-41d4-a716-446655440000",
    "estimatedTokens": 245,
    "rateLimit": {
      "remaining": 99,
      "resetAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Required Permission:** `ai.enhance.create`

### Stream Enhancement Response

```
GET /api/ai/stream/:sessionId
```

**Headers:**
```
Authorization: Bearer <access-token>
Accept: text/event-stream
```

**Response (SSE):**
```
event: connected
data: {"sessionId":"550e8400-e29b-41d4-a716-446655440000"}

event: chunk
data: {"text":"The enhanced","tokens":2}

event: chunk
data: {"text":" text content","tokens":2}

event: done
data: {"sessionId":"550e8400-e29b-41d4-a716-446655440000","totalTokens":150}
```

**Event Types:**
- `connected` - Connection established
- `chunk` - Text chunk with token count
- `metadata` - Additional metadata
- `done` - Stream completed
- `error` - Error occurred
- `cancelled` - Stream cancelled

**Required Permission:** `ai.stream.access`

### Get Session Status

```
GET /api/ai/session/:sessionId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "text": "Original text",
    "enhancedText": "Enhanced text",
    "action": "improve",
    "tokens": 150,
    "cost": 0.002,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Status Values:**
- `pending` - Request created, not yet processed
- `processing` - Currently being processed
- `completed` - Successfully completed
- `cancelled` - Cancelled by user
- `error` - Error occurred

**Required Permission:** `ai.session.view`

### Cancel Session

```
DELETE /api/ai/session/:sessionId
```

**Response:**
```json
{
  "success": true,
  "message": "Session cancelled successfully"
}
```

This endpoint cancels an active session and stops any ongoing streaming.

**Required Permission:** `ai.session.manage`

### Get Usage Statistics

```
GET /api/ai/usage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": {
      "used": 45,
      "limit": 100,
      "resetAt": "2024-01-15T11:00:00Z"
    },
    "tokens": {
      "used": 50000,
      "limit": 100000,
      "resetAt": "2024-01-15T11:00:00Z"
    },
    "cost": {
      "used": 2.50,
      "limit": 100.00,
      "resetAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

**Required Permission:** `ai.usage.view`

## Configuration

### LLM Provider Selection

Set default provider in `.env`:
```bash
DEFAULT_LLM_PROVIDER=openai  # or 'claude' or 'gemini'
LLM_FALLBACK_PROVIDERS=claude,gemini
USE_MOCK_PROVIDER=false  # Set to true for development
```

### Rate Limiting

Configure rate limits in `.env`:
```bash
AI_RATE_LIMIT_USER_REQUESTS=100      # Requests per window
AI_RATE_LIMIT_USER_TOKENS=100000     # Tokens per window
AI_RATE_LIMIT_ORG_COST=100.00        # Cost limit per window
AI_RATE_LIMIT_WINDOW_HOURS=1         # Window duration
```

## LLM Providers

### Supported Providers

1. **OpenAI** (`openai.provider.ts`)
   - Models: GPT-4, GPT-3.5-turbo
   - API: OpenAI SDK

2. **Claude** (`claude.provider.ts`)
   - Models: Claude 3.5 Sonnet, Claude 3 Opus
   - API: Anthropic SDK

3. **Gemini** (`gemini.provider.ts`)
   - Models: Gemini 2.0 Flash
   - API: Google Generative AI SDK

4. **Mock** (`mock.provider.ts`)
   - Development/testing provider
   - Generates dummy streaming text
   - No API calls required

### Provider Selection Logic

1. Uses `DEFAULT_LLM_PROVIDER` if specified
2. Falls back to `LLM_FALLBACK_PROVIDERS` in order if default fails
3. Uses mock provider if `USE_MOCK_PROVIDER=true` or in development with no API keys

## Session Management

**Session Lifecycle:**
1. `pending` - Created when enhancement request is made
2. `processing` - Set when streaming starts
3. `completed` - Set when stream completes successfully
4. `cancelled` - Set when user cancels or stream is stopped
5. `error` - Set when an error occurs

Sessions are automatically cleaned up after TTL expires (configured via `REDIS_TTL_SESSIONS`).

## Rate Limiting

Rate limiting is enforced per user and tracks:

- **Requests**: Number of enhancement requests
- **Tokens**: Total tokens consumed
- **Cost**: Total cost

Limits reset based on the configured window (default: 1 hour). When a limit is exceeded, requests return `429 Too Many Requests`.

Rate limit information is included in enhancement request responses:
```json
{
  "rateLimit": {
    "remaining": 99,
    "resetAt": "2024-01-15T11:00:00Z"
  }
}
```

## Context Assembly

The context assembler gathers related data based on field type and entity relationships. This helps the LLM provide more relevant and contextual enhancements.

**Supported Field Types:**
- `opportunity_description` - Opportunity details
- `project_note` - Project information
- `table_cell` - Table row context
- `comment` - Comment thread context
- `custom_field` - Custom field metadata

**Context Options:**
- `opportunity_details` - Full opportunity data
- `current_tab` - Current view/tab context
- `related_fields` - Related field values
- `user_history` - User's previous enhancements

Context data is sanitized before being sent to the LLM to ensure privacy and remove sensitive information.

## Error Handling

The module handles various error scenarios:

- **LLM Provider Errors**: Automatic fallback to next provider
- **Rate Limit Exceeded**: Returns 429 with reset information
- **Invalid Session**: Returns 404 for non-existent sessions
- **Permission Denied**: Returns 403 if user lacks required permissions
- **Stream Errors**: Sends error event via SSE and closes connection

## Performance Considerations

- **Streaming**: Responses are streamed in real-time to reduce perceived latency
- **Redis Caching**: Session data cached for fast retrieval
- **Connection Management**: SSE connections are properly tracked and cleaned up
- **Token Counting**: Token usage tracked in real-time for accurate rate limiting

## Development

### Using Mock Provider

For development without API keys:
```bash
USE_MOCK_PROVIDER=true
```

---

For backend overview and setup instructions, see [Main README](../../README.md).

