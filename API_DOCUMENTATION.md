# Sam AI v2 — Unified API Documentation

## Overview
The Sam AI v2 API acts as a secure, unified gateway to 35+ AI modules, multi-provider LLMs, and the self-learning knowledge base. It uses a token-bucket rate limiter, security middlewares, and role-based access control.

## Base URL
- **Local:** `http://localhost:8000/api`
- **Production:** `https://samai.uhrpo.com/api`

## Authentication
All endpoints (except public webhooks) require a Bearer token or an Access Key.
- **Admin Endpoints:** Require Admin JWT or `SAM-ADMIN-XXXX-XXXX`
- **Staff Endpoints:** Require Staff JWT or `SAM-STAFF-XXXX-XXXX`

Add header: `Authorization: Bearer <token>`

## 1. Core API Gateway (`/api`)
All module routes are duplicated under `/api/*` and secured by the Gateway.
- **Rate Limit:** 60 req/min, 1000 req/hour (per API Key)
- **Sanitization:** Internal model IDs are masked as `sam-ai-model`

## 2. Authentication & Security (`/auth`)

### `POST /auth/login`
- **Body:** `{ email, password }`
- **Rate Limit:** 5 failed attempts locks account for 15 mins.

### `POST /auth/key-login`
- **Body:** `{ key_code }`
- **Response:** JWT Token

### `POST /auth/verify-admin-access`
- **Body:** `{ admin_key }`
- **Purpose:** Verifies master key for frontend Admin Gate.

## 3. Telegram Bot (`/telegram`)
Webhook handles commands from authorized `TELEGRAM_ADMIN_CHAT_ID`.
- `/newadminkey` - Generate new admin key
- `/staffkey 7d` - Generate staff key
- `/listkeys` - View active keys
- `/rotate` - Rotate system master key

## 4. Self-Learning Knowledge Base (`/knowledge`)

### `POST /knowledge/add` (Admin Only)
- **Body:** `{ content: "...", source: "...", category: "general" }`
- **Purpose:** Embeds and stores a new fact.

### `POST /knowledge/search`
- **Body:** `{ query: "...", top_k: 5 }`
- **Purpose:** Semantic search across user and system knowledge.

### `POST /knowledge/crawl` (Admin Only)
- **Body:** `{ url: "..." }`
- **Purpose:** Scrapes URL and stores text in knowledge base.

### `POST /knowledge/train` (Admin Only)
- **Body:** `{ message: "LEARN: Sri Lanka's capital is..." }`
- **Purpose:** Process natural language training commands.

## 5. AI Chat & RAG (`/chat`)

### `POST /chat/completions`
- **Body:** `{ message: "...", project_id: "...", mode: "auto" }`
- **Behavior:** Auto-injects semantic RAG context and Knowledge Base context into the prompt before routing to the best available provider (via `api_hub.py`).

## 6. Multi-Provider AI Hub
Managed internally by `api_hub.py`. Supports automatic fallback between:
1. Gemini 1.5 Pro
2. Groq (Llama 3 / Mixtral)
3. DeepSeek / InferX
4. OpenRouter
5. OpenAI (Optional)
6. ElevenLabs (TTS)

*Note: For the full OpenAPI interactive documentation, run the server locally in development mode (`IS_PRODUCTION=false`) and visit `http://localhost:8000/docs`.*
