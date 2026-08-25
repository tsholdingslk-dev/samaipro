# SAM AI Platform — User Manual

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Quick Start](#quick-start)
4. [Authentication](#authentication)
5. [Sam AI Core (Main API)](#sam-ai-core-main-api)
6. [Agent System (35 Agents)](#agent-system-35-agents)
7. [Multi-Model Gateway](#multi-model-gateway)
8. [Knowledge Engine (RAG)](#knowledge-engine-rag)
9. [Web Research](#web-research)
10. [Permission System](#permission-system)
11. [Security Features](#security-features)
12. [Analytics & Cost Tracking](#analytics--cost-tracking)
13. [Secret Management](#secret-management)
14. [Validation Layer](#validation-layer)
15. [Emergency Lockdown](#emergency-lockdown)
16. [API Gateway](#api-gateway)
17. [Code Examples](#code-examples)

---

## Overview

SAM AI is an AI orchestration platform that transforms a chatbot into a full AI agent system. It provides:

- **35 specialized AI agents** across 12 domains (content, technical, business, media, research, security, etc.)
- **Multi-provider support** (OpenAI, Gemini, Claude, local LLMs) with automatic fallback
- **Dynamic permission engine** (User → Role → Module → Action → Time/Usage Limit)
- **Zero-trust security** (device fingerprinting, audit logging, TOTP 2FA, refresh tokens)
- **RAG knowledge engine** with admin-approved trusted knowledge base
- **Web research** with source reliability ranking
- **Output validation** with automatic retry/repair
- **Cost tracking** per user/provider/module
- **Emergency lockdown** mode with key rotation

---

## Installation & Setup

### Prerequisites
- Python 3.9+
- pip
- API keys for at least one provider (OpenAI, Gemini, Claude, or local LLM)

### Steps

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.py
   ```

2. **Configure environment**
   Create `.env` in `backend/`:
   ```env
   # Database
   DATABASE_URL=sqlite:///./samai.db

   # JWT
   SECRET_KEY=your-super-secret-key-change-this

   # AI Providers (at least one required)
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=...
   CLAUDE_API_KEY=...

   # Master secret for vault encryption
   SAM_SECRET_MASTER_KEY=generate-a-random-32-char-string

   # Optional: SerpAPI for web research
   SERP_API_KEY=...

   # Environment
   ENVIRONMENT=development
   DEBUG=true
   ```

3. **Initialize database**
   ```bash
   python init_db.py
   ```

4. **Start the server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **Verify**
   ```bash
   curl http://localhost:8000/health
   # Expected: {"status": "SAM AI Backend is Running"}
   ```

---

## Quick Start

### 1. Create an account
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user1", "password": "securepass123", "email": "user@example.com"}'
```

### 2. Login and get JWT token
```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=user1&password=securepass123"
# Returns: {"access_token": "...", "refresh_token": "...", "user": {...}}
```

### 3. Process a task with Sam AI Core
```bash
curl -X POST http://localhost:8000/sam/process \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Write a professional email about project delay to a client",
    "priority": "medium"
  }'
```

### 4. List available agents
```bash
curl http://localhost:8000/agents/available \
  -H "Authorization: Bearer <access_token>"
```

---

## Authentication

### Login (returns access + refresh tokens)
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user1&password=securepass123
```

Response:
```json
{
  "access_token": "eyJhbG... (15 minutes expiry)",
  "refresh_token": "d2f3-4a5b...",
  "user": {
    "id": "uuid",
    "username": "user1",
    "role": "user",
    "email": "user@example.com"
  },
  "expires_in": 900
}
```

### Refresh expired token
```http
POST /auth/refresh
Content-Type: application/json

{"refresh_token": "d2f3-4a5b..."}
```

### Two-Factor Authentication (TOTP)
```bash
# Enable 2FA (requires authenticator app)
curl -X POST http://localhost:8000/auth/2fa/enable \
  -H "Authorization: Bearer <token>"

# Verify with TOTP code
curl -X POST http://localhost:8000/auth/2fa/verify \
  -H "Authorization: Bearer <token>" \
  -d '{"code": "123456"}'
```

### API Keys (for service-to-service)
```bash
# Create API key
curl -X POST http://localhost:8000/auth/api-keys \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "my-service-key", "scopes": ["chat:*", "image:*"], "expires_days": 365}'
```

---

## Sam AI Core (Main API)

The `/sam/*` endpoints are the primary interface. They automatically route through intent classification, model selection, agent execution, validation, and cost tracking.

### Process a Task
```http
POST /sam/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "task": "Your task description here",
  "context": {},           // Optional additional context
  "priority": "medium",    // low | medium | high | urgent
  "deadline": "2026-08-27T12:00:00Z",
  "stream": false          // Enable for real-time streaming
}
```

**Response:**
```json
{
  "task_id": "uuid",
  "status": "completed",
  "result": "The generated response...",
  "understanding": {
    "intent_category": "chat",
    "confidence": 0.95,
    "module": "chat",
    "model": {"provider": "openai", "model": "gpt-4o-mini", "tier": "standard"},
    "requires_research": true,
    "requires_code": false,
    "requires_multimodal": false
  },
  "plan": {
    "steps": [...],
    "agents": ["Researcher", "Content Creator"],
    "estimated_cost": 0.015,
    "risk_level": "low"
  },
  "confidence": 0.92,
  "citations": [],
  "trace": ["Analyzing task...", "Executing by agent..."],
  "metadata": {
    "agent_used": "Content Creator",
    "cost_usd": 0.005,
    "validation": {"passed": true, "confidence": 0.95, "issues": 0}
  },
  "execution_time_ms": 1234
}
```

### Understand Intent (Without Execution)
```http
POST /sam/understand
Content-Type: application/json

{"task": "Explain quantum computing"}
```

Returns the detected intent, selected model, and whether research/code/multimedia is needed.

### Create Plan (Without Execution)
```http
POST /sam/plan
Content-Type: application/json

{"task": "Build a Flutter app for local food delivery"}
```

Returns a step-by-step execution plan with agents, time/cost estimates, and risk level.

### System Status
```http
GET /sam/status
Authorization: Bearer <admin_token>
```

Returns operational status of all components.

### Available Agents
```http
GET /sam/agents
Authorization: Bearer <token>
```

Lists all 35 agents with descriptions and tools.

---

## Agent System (35 Agents)

SAM AI has 35 specialized agents grouped by domain:

### Content & Communication
| Agent | Description | Keywords |
|-------|-------------|----------|
| Email Writer | Professional emails, subject lines | email, e-mail, mail, letter |
| Content Creator | Blog posts, articles, creative writing | blog, article, content |
| Resume Builder | Resumes, CVs, cover letters | resume, cv, cover letter |
| Translator | Multilingual translation (Sinhala/Tamil/English) | translate, translation, tamil, sinhala |
| Presentation Builder | Slide decks, speaker notes | presentation, slides, ppt |
| Storytelling | Stories, narratives, fiction | story, tale, narrative |
| Recipe Master | Recipes, meal plans, cooking | recipe, cook, food |
| Entertainment Host | Jokes, trivia, games | joke, funny, comedy, game |

### Technical
| Agent | Description | Keywords |
|-------|-------------|----------|
| Coder | Code generation & debugging | code, programming, python, javascript |
| Flutter Builder | Flutter apps, widgets | flutter, dart, mobile app |
| Security Analyst | APK analysis, security audit | apk, android, security audit |
| Automation Specialist | Workflows, scripts | automate, automation, workflow |

### Business & Professional
| Agent | Description | Keywords |
|-------|-------------|----------|
| Business Analyst | Business analysis, strategy | business, strategy, profit |
| SEO Specialist | Keyword research, SEO | seo, keywords, ranking |
| Legal Assistant | Legal documents, contracts | legal, contract, agreement |
| Finance Agent | Budgeting, investment analysis | finance, budget, tax |
| Lead Generator | Business leads, outreach | lead, leads, prospect |
| Tourism Guide | Travel itineraries (Sri Lanka) | tourism, travel, itinerary |

### Media & Creative
| Agent | Description | Keywords |
|-------|-------------|----------|
| Image Generator | AI image generation | image, art, illustration, logo |
| Vision Analyst | Image analysis, OCR | analyze image, vision, ocr |
| Video Creator | Video generation | video, animation, reel |
| Voice Agent | Text-to-speech, transcription | voice, tts, speech to text |

### Research & Knowledge
| Agent | Description | Keywords |
|-------|-------------|----------|
| Researcher | Web research, fact-finding | research, find, investigate |
| Knowledge Assistant | Knowledge base Q&A | knowledge, database, faq |
| News Synthesizer | Current events aggregation | news, headlines, current |
| Education Tutor | Teaching, tutoring | teach, learn, tutorial |
| Sri Lanka Expert | Sri Lankan culture, laws, tourism | srilanka, sri lanka, colombo |

### Coordination
| Agent | Description |
|-------|-------------|
| AI Council | Multi-agent consultation and conflict resolution |
| Planner | Task decomposition and planning |

### Execute via Agent System
```http
POST /agents/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "task": "Write a blog post about AI trends in Sri Lanka",
  "agent_type": "blog",  // optional: specific agent override
  "context": {
    "target_audience": "Sinhala-speaking developers",
    "language": "singlish",
    "tone": "conversational"
  }
}
```

---

## Multi-Model Gateway

Routes requests to the best provider based on cost tier, complexity, and provider health.

### Providers
| Provider | Models | Use Case |
|----------|--------|----------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo | Premium quality |
| Gemini | gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-pro | Fast + cost-effective |
| Claude | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus | Long contexts |
| Local LLMs | Custom OpenAI-format endpoints | Private/offline |

### Provider Failover
When a provider fails, the system automatically falls back:
1. Primary model (selected by cost tier)
2. Fallback 1 (cheaper/faster)
3. Fallback 2 (different provider)

### Cost Tiers
| Tier | Use | Example Models |
|------|-----|---------------|
| cheap | Simple tasks | gpt-3.5-turbo, gemini-1.5-flash |
| standard | General tasks | gpt-4o-mini, gemini-2.0-flash |
| premium | Complex tasks | gpt-4o, claude-3-5-sonnet |

### Multimodal Endpoints
```bash
# Generate image
POST /multimodel/image
{"prompt": "A futuristic Colombo skyline at night", "size": "1024x1024"}

# Transcribe audio
POST /multimodel/audio/transcribe
(content-type: multipart/form-data, file: audio.wav)

# Text-to-speech
POST /multimodel/audio/tts
{"text": "Hello, how are you?", "voice": "alloy"}

# Analyze image
POST /multimodel/image/analyze
{"image_data": "base64...", "prompt": "What objects are in this image?"}
```

---

## Knowledge Engine (RAG)

### 3-Tier Knowledge System

1. **Trusted Knowledge Base** — Admin-approved, version-controlled entries with 5 trust levels:
   - `admin_approved` (highest)
   - `verified`
   - `user_submitted`
   - `web_crawled`
   - `unverified` (lowest)

2. **RAG with Chunking** — Documents are split into semantic chunks (by paragraphs or headings) before embedding.

3. **Web Research** — Real-time research with source reliability ranking.

### Managing Knowledge

```bash
# Add to trusted KB (admin)
curl -X POST http://localhost:8000/knowledge/trusted/add \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "content": "Sri Lankan corporate tax rate is 24%",
    "source": "Inland Revenue Department",
    "category": "business",
    "trust_level": "admin_approved"
  }'

# Search knowledge (all users)
curl -X POST http://localhost:8000/knowledge/search \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "Sri Lankan corporate tax"}'

# Get pending approvals (admin)
curl http://localhost:8000/knowledge/pending-approval \
  -H "Authorization: Bearer <admin_token>"

# Approve entry (admin)
curl -X POST http://localhost:8000/knowledge/approve/{id} \
  -H "Authorization: Bearer <admin_token>"

# Knowledge stats (admin)
curl http://localhost:8000/knowledge/stats \
  -H "Authorization: Bearer <admin_token>"
```

---

## Web Research

Uses DuckDuckGo + optional SerpAPI. Sources are ranked by reliability:

| Tier | Reliability Score | Examples |
|------|------------------|----------|
| Government | 0.95 | .gov, .gov.lk, .gov.in |
| Official | 0.90 | .org, .edu |
| Primary | 0.85 | First-hand sources |
| Trusted Media | 0.75 | Wikipedia, BBC, Reuters, Nature |
| Other | 0.50 | Blogs, forums |

Sri Lankan sources (.lk domains) are automatically boosted.

```bash
curl -X POST http://localhost:8000/knowledge/research \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "AI adoption in Sri Lankan startups", "num_sources": 5}'
```

Response includes cited sources with reliability scores.

---

## Permission System

### Architecture: User → Role → Module → Action → Time Limit → Usage Limit

```bash
# Check your permissions
curl http://localhost:8000/permissions/my \
  -H "Authorization: Bearer <token>"

# Check a specific permission
curl -X POST http://localhost:8000/permissions/check \
  -H "Authorization: Bearer <token>" \
  -d '{"module": "image", "action": "write"}'

# List all permissions
curl http://localhost:8000/permissions/permissions \
  -H "Authorization: Bearer <token>"

# List roles
curl http://localhost:8000/permissions/roles \
  -H "Authorization: Bearer <admin_token>"
```

### Granting Permissions (Admin)
```bash
curl -X POST http://localhost:8000/permissions/grants \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "user_id": "target-user-uuid",
    "module": "video",
    "action": "write",
    "usage_limit": 50,
    "time_limit_hours": 0,
    "expires_days": 7
  }'
```
This grants 50 video generations per 7 days.

### Usage Quotas
```bash
# Check daily quota
curl -X POST http://localhost:8000/permissions/quota/check \
  -H "Authorization: Bearer <token>" \
  -d '{"module": "image", "action": "write"}'

# Set quota limit (admin)
curl -X POST http://localhost:8000/permissions/quota/set \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"user_id": "...", "module": "image", "limit": 100, "days": 30}'
```

### Default Roles
| Role | Permissions |
|------|------------|
| admin | Full access to all modules/actions |
| staff | Core modules (chat, translate, knowledge, agents, analytics) |
| student | Basic access (chat, translate, knowledge read, image read, voice read) |
| teacher | Educational content access |
| creator | Content creation tools (higher limits) |

---

## Security Features

### Zero-Trust Middleware
All requests are automatically:
- Device fingerprinted
- Rate-limited
- Logged to audit trail
- Checked for revoked sessions

### Refresh Token Rotation
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry with rotation
- **Reuse detection**: If you try to use a refresh token twice, the entire session is revoked

### API Scopes
Scopes use wildcard syntax: `chat:*`, `image:write`, `model:openai`

### Audit Logging
Every security event is logged with:
- Event type (login, grant_created, secret_rotated, etc.)
- User ID, IP, device fingerprint
- Severity (info, warning, error, critical, emergency)
- Risk score

```bash
# View audit logs (admin)
curl http://localhost:8000/security/audit/logs?severity=warning&limit=100 \
  -H "Authorization: Bearer <admin_token>"

# Check risk score
curl http://localhost:8000/security/risk-score \
  -H "Authorization: Bearer <token>"
```

---

## Analytics & Cost Tracking

### Cost Tracking
```bash
# Your cost summary
curl http://localhost:8000/analytics/my/costs \
  -H "Authorization: Bearer <token>"

# System-wide costs (admin)
curl http://localhost:8000/analytics/costs/system-wide?days=7 \
  -H "Authorization: Bearer <admin_token>"

# Provider breakdown (admin)
curl http://localhost:8000/analytics/costs/providers \
  -H "Authorization: Bearer <admin_token>"
```

### Usage Analytics
```bash
# System dashboard (admin)
curl http://localhost:8000/analytics/dashboard?days=7 \
  -H "Authorization: Bearer <admin_token>"

# Your activity
curl http://localhost:8000/analytics/user/activity/me?days=7 \
  -H "Authorization: Bearer <token>"

# Real-time stats (admin)
curl http://localhost:8000/analytics/realtime \
  -H "Authorization: Bearer <admin_token>"

# Submit feedback
curl -X POST http://localhost:8000/analytics/feedback \
  -H "Authorization: Bearer <token>" \
  -d '{"module": "chat", "rating": 5, "feedback": "Great response!"}'
```

### Pricing Reference
| Provider | Model | Input / 1M tokens | Output / 1M tokens |
|----------|-------|-------------------|--------------------|
| OpenAI | gpt-4o | $0.005 | $0.015 |
| OpenAI | gpt-4o-mini | $0.00015 | $0.0006 |
| OpenAI | gpt-3.5-turbo | $0.0005 | $0.0015 |
| Gemini | gemini-2.5-flash | $0.00015 | $0.0006 |
| Gemini | gemini-1.5-pro | $0.0035 | $0.0105 |
| Claude | claude-3-5-sonnet | $0.003 | $0.015 |
| Ollama/Local | any | Free | Free |

---

## Secret Management

The secret vault stores encrypted API keys and credentials.

```bash
# Store a secret
curl -X POST http://localhost:8000/secrets \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "openai_api_key",
    "value": "sk-...",
    "secret_type": "api_key",
    "provider": "openai",
    "scope": "user"
  }'

# List your secrets (redacted)
curl http://localhost:8000/secrets \
  -H "Authorization: Bearer <token>"

# Retrieve a secret value
curl -X POST http://localhost:8000/secrets/{id}/retrieve \
  -H "Authorization: Bearer <token>"

# Rotate a secret (admin)
curl -X POST http://localhost:8000/secrets/{id}/rotate \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"new_value": "sk-new-key"}'

# Check expiring secrets
curl http://localhost:8000/secrets/expiring?days=7 \
  -H "Authorization: Bearer <admin_token>"

# Test redaction
curl -X POST http://localhost:8000/secrets/redact \
  -H "Authorization: Bearer <token>" \
  -d '{"text": "My key is sk-abc123def456..."}'
```

**Features:**
- AES-256 encryption at rest
- Key rotation with version history
- Access counting and audit trails
- Auto-redaction in logs (sk-**, AKIA**, ghp_**, Bearer ***)

---

## Validation Layer

All AI outputs are automatically validated through a 6-stage pipeline:

| Stage | Check | Description |
|-------|-------|-------------|
| 1 | Safety | Blocks harmful content, checks disclaimers |
| 2 | Length | Ensures output isn't empty or too short |
| 3 | Completeness | Detects truncation, unbalanced braces/brackets |
| 4 | Schema | Validates JSON structure against expected schema |
| 5 | Fact Check | Verifies claims, checks Sri Lankan facts |
| 6 | Format | Ensures code blocks, translation format, etc. |

### Auto-Retry with Repair
If validation fails, the system:
1. Analyzes which checks failed
2. Generates a targeted repair prompt
3. Re-prompts the AI with instructions to fix
4. Re-validates (up to 3 attempts)

```bash
# Validate output manually
curl -X POST http://localhost:8000/validation/validate \
  -H "Authorization: Bearer <token>" \
  -d '{
    "output": "Your AI output here",
    "intent_category": "knowledge",
    "auto_repair": true
  }'

# Safe execution (runs task + validates + repairs)
curl -X POST http://localhost:8000/validation/safe-execute \
  -H "Authorization: Bearer <token>" \
  -d '{
    "task": "Explain quantum computing",
    "intent_category": "knowledge",
    "max_repairs": 3
  }'

# Manual safety check
curl -X POST http://localhost:8000/validation/safety-check \
  -d '{"text": "Any text to check"}'

# Fact check
curl -X POST http://localhost:8000/validation/fact-check \
  -d '{"text": "The population of Sri Lanka is 22 million"}'
```

---

## Emergency Lockdown

Emergency lockdown instantly blocks all non-admin access. Activated by admin.

```bash
# Enable lockdown (admin only)
curl -X POST http://localhost:8000/security/lockdown/enable \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"reason": "Security incident"}'

# Disable lockdown
curl -X POST http://localhost:8000/security/lockdown/disable \
  -H "Authorization: Bearer <admin_token>"

# Emergency access (with key rotation)
curl -X POST http://localhost:8000/security/lockdown/emergency-access \
  -d '{"emergency_key": "..." }'

# Lockdown status
curl http://localhost:8000/security/lockdown/status \
  -H "Authorization: Bearer <token>"
```

During lockdown:
- All non-admin endpoints return 403
- Admin access requires emergency key
- Emergency key is automatically rotated after use

---

## API Gateway

Centralized API gateway with rate limiting and health monitoring.

```bash
# Gateway stats (admin)
curl http://localhost:8000/gateway/stats \
  -H "Authorization: Bearer <admin_token>"

# Service discovery
curl http://localhost:8000/gateway/services \
  -H "Authorization: Bearer <token>"

# Health check
curl http://localhost:8000/gateway/health \
  -H "Authorization: Bearer <admin_token>"
```

### Rate Limits
| Role | Requests/Minute | Burst |
|------|----------------|-------|
| user | 100 | 150 |
| staff | 200 | 300 |
| admin | 500 | 1000 |

Rate limits are enforced per user, per service, per endpoint using token bucket algorithm.

---

## Code Examples

### Python Client
```python
import requests

BASE = "http://localhost:8000"

# Login
resp = requests.post(f"{BASE}/auth/login", data={"username": "user1", "password": "pass"})
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Process a task
result = requests.post(
    f"{BASE}/sam/process",
    headers=headers,
    json={
        "task": "Write a blog post about AI in healthcare in Sri Lanka",
        "priority": "medium",
        "context": {"language": "english"}
    }
)
print(result.json()["result"])

# Check costs
costs = requests.get(f"{BASE}/analytics/my/costs", headers=headers)
print(costs.json())
```

### JavaScript/TypeScript Client
```typescript
import axios from 'axios';

const BASE = 'http://localhost:8000';

// Auth
const resp = await axios.post(`${BASE}/auth/login`, {
    username: 'user1',
    password: 'pass'
});
const token = resp.data.access_token;

// Process task
const result = await axios.post(`${BASE}/sam/process`, {
    task: 'Create a Flutter widget for a login page',
    priority: 'high'
}, {
    headers: { Authorization: `Bearer ${token}` }
});

console.log(result.data.result);
```

### cURL Examples

```bash
# Chat
curl -X POST http://localhost:8000/sam/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task": "What is the capital of Sri Lanka?"}'

# Generate code
curl -X POST http://localhost:8000/sam/process \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"task": "Write a Python function to calculate factorial"}'

# Generate image
curl -X POST http://localhost:8000/sam/process \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"task": "Generate an image of a traditional Sri Lankan mask"}'

# Research
curl -X POST http://localhost:8000/sam/process \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"task": "Research the latest AI developments and their impact on developing economies"}'
```

---

## Environment Variables Reference

### Required
| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT signing key (required) |
| `OPENAI_API_KEY` | OpenAI API key (or alternative) |
| `DATABASE_URL` | Database connection string |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | - | Google Gemini API key |
| `CLAUDE_API_KEY` | - | Anthropic Claude API key |
| `SAM_SECRET_MASTER_KEY` | (random) | Master key for secret vault encryption |
| `SERP_API_KEY` | - | SerpAPI key for enhanced web research |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `DEBUG` | `true` | Enable debug mode |
| `JWT_EXPIRE_MINUTES` | `15` | JWT token expiry |
| `JWT_REFRESH_EXPIRE_DAYS` | `7` | Refresh token expiry |
| `LOCAL_LLM_URL` | - | Local LLM endpoint URL |
| `LOCAL_LLM_MODEL` | - | Local LLM model name |

---

## All API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (returns JWT + refresh token) |
| POST | `/auth/refresh` | Refresh expired access token |
| POST | `/auth/2fa/enable` | Enable 2FA |
| POST | `/auth/2fa/verify` | Verify 2FA code |
| POST | `/auth/api-keys` | Create API key |
| GET | `/auth/api-keys` | List API keys |
| DELETE | `/auth/api-keys/{id}` | Revoke API key |

### Sam AI Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sam/process` | Full pipeline task processing |
| POST | `/sam/understand` | Intent classification only |
| POST | `/sam/plan` | Create execution plan |
| GET | `/sam/status` | System status (admin) |
| GET | `/sam/agents` | List all agents |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agents/execute` | Execute task via agent |
| GET | `/agents/available` | List available agents |
| GET | `/agents/tools` | List available tools |
| GET | `/agents/history` | Execution history |
| GET | `/agents/info` | Detailed agent info |

### Multi-Model Gateway
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/multimodel/chat` | Chat completion |
| POST | `/multimodel/image` | Generate image |
| POST | `/multimodel/image/analyze` | Analyze image |
| POST | `/multimodel/audio/transcribe` | Transcribe audio |
| POST | `/multimodel/audio/tts` | Text-to-speech |

### Knowledge Engine
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/knowledge/search` | Search knowledge base |
| POST | `/knowledge/add` | Add knowledge entry |
| POST | `/knowledge/research` | Web research with citations |
| POST | `/knowledge/crawl` | Crawl URL → store |
| POST | `/knowledge/train` | Admin training command |
| GET | `/knowledge/stats` | Knowledge stats |
| POST | `/knowledge/trusted/add` | Add to trusted KB |
| GET | `/knowledge/pending-approval` | Pending approvals |
| POST | `/knowledge/approve/{id}` | Approve entry |

### Permissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/permissions/my` | My permissions |
| POST | `/permissions/check` | Check permission |
| POST | `/permissions/check-user/{id}` | Admin check user |
| GET | `/permissions/grants` | List grants |
| POST | `/permissions/grants` | Create grant |
| DELETE | `/permissions/grants/{id}` | Revoke grant |
| GET | `/permissions/roles` | List roles |
| GET | `/permissions/permissions` | List all permissions |
| POST | `/permissions/quota/check` | Check quota |
| POST | `/permissions/quota/set` | Set quota limit (admin) |

### Security
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/security/2fa/setup` | Setup 2FA |
| POST | `/security/2fa/verify` | Verify 2FA |
| POST | `/security/lockdown/enable` | Enable lockdown (admin) |
| POST | `/security/lockdown/disable` | Disable lockdown |
| GET | `/security/lockdown/status` | Lockdown status |
| GET | `/security/audit/logs` | Audit logs (admin) |
| GET | `/security/risk-score` | Risk assessment |
| POST | `/security/sign` | Sign request (HMAC) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | System dashboard (admin) |
| GET | `/analytics/my/costs` | My cost summary |
| GET | `/analytics/costs/system-wide` | System costs (admin) |
| GET | `/analytics/costs/providers` | Provider costs (admin) |
| GET | `/analytics/user/activity/{id}` | User activity |
| GET | `/analytics/realtime` | Real-time stats |
| POST | `/analytics/feedback` | Submit feedback |
| GET | `/analytics/top-users` | Top users (admin) |

### Secrets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/secrets/` | Store secret |
| GET | `/secrets/` | List secrets |
| POST | `/secrets/{id}/retrieve` | Retrieve secret value |
| POST | `/secrets/{id}/rotate` | Rotate secret |
| DELETE | `/secrets/{id}` | Delete secret |
| GET | `/secrets/expiring` | Check expiring |
| POST | `/secrets/redact` | Test redaction |

### Validation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/validation/validate` | Validate AI output |
| POST | `/validation/safe-execute` | Execute with validation |
| POST | `/validation/safety-check` | Safety check |
| POST | `/validation/fact-check` | Fact check |
| POST | `/validation/schema-detect` | Auto-detect schema |

### Gateway
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gateway/stats` | Gateway stats |
| GET | `/gateway/services` | Service discovery |
| GET | `/gateway/health` | Health checks |

---

## Troubleshooting

### "No suitable agent found"
The task description may need more specific keywords. Check `/agents/available` for the 35 agents and their keywords. Try adding more context.

### "Permission denied"
- Check your role with `/permissions/my`
- Ask admin to check `/permissions/check-user/{your_id}` with specific module/action
- Admin can grant via `/permissions/grants`

### "Rate limit exceeded"
- Wait for the reset period (shown in response headers)
- Admin can check `/analytics/realtime` for usage patterns

### Provider errors / fallback
- Check provider API keys in `.env`
- The system auto-falls-back to other providers
- Check `/analytics/costs/providers` for provider health

### "Lockdown enabled"
- The system is in emergency lockdown
- Contact admin for emergency access key

---

*For support: check `/help` in the CLI, or report issues at the GitHub repository.*