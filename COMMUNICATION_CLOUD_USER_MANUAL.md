# SAM AI Communication Cloud — User Manual

> Unified realtime communication infrastructure for the SAM AI platform.  
> One API. Multiple providers. Automatic routing and failover.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [Getting Started](#3-getting-started)
4. [Dashboard](#4-dashboard)
5. [Provider Registry](#5-provider-registry)
6. [Rooms](#6-rooms)
7. [Meetings](#7-meetings)
8. [Recordings](#8-recordings)
9. [API Keys & Tokens](#9-api-keys--tokens)
10. [Webhooks](#10-webhooks)
11. [Usage & Quotas](#11-usage--quotas)
12. [API Reference](#12-api-reference)
13. [SDK Examples](#13-sdk-examples)
14. [Security](#14-security)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Introduction

SAM Communication Cloud is a native module inside the SAM AI platform. It provides a **unified communication API** that abstracts multiple realtime providers behind one secure interface.

### What you can build

- 1-to-1 and group video/audio calls
- Zoom-style meetings
- Screen sharing
- Cloud recording
- Live streaming
- Chat
- AI transcription, translation, and summaries

### Why SAM Communication Cloud?

| Problem | SAM Solution |
|---------|--------------|
| Multiple vendor SDKs | One unified API |
| Provider lock-in | Swap providers without changing client code |
| Failover complexity | Automatic provider failover |
| Secret management | Encrypted credentials, never exposed to clients |
| Scaling | Provider routing by quality, cost, or latency |

---

## 2. Architecture Overview

```text
Customer Application
        ↓
SAM Unified Communication API
        ↓
Authentication / Authorization
        ↓
Tenant Validation
        ↓
Quota / Rate Limit Check
        ↓
Provider Router
        ↓
Provider Adapter
        ↓
Agora / LiveKit / Jitsi / WebRTC / Future Providers
```

### Key Principles

- **Provider Agnostic**: Never hard-code Agora, LiveKit, or Jitsi into business logic.
- **Short-lived Tokens**: Communication tokens expire quickly and are generated server-side only.
- **Secrets Stay Server-side**: Provider master credentials never leave the backend.
- **Tenant Isolation**: Every request is scoped to a project/organization.

---

## 3. Getting Started

### Prerequisites

- SAM AI account with admin or staff access
- At least one communication provider configured (Agora, LiveKit, Jitsi, or WebRTC)

### Step 1: Open Communication Cloud

1. Log in to SAM AI.
2. Go to **Modules**.
3. Open **SAM Communication Cloud**.

### Step 2: Configure a Provider

1. Go to **Providers**.
2. Click **Add Provider**.
3. Enter:
   - **Provider ID**: `agora`, `livekit`, `jitsi`, or `webrtc`
   - **Display Name**: e.g., `Agora Production`
   - **Priority**: lower number = higher priority
   - **Credentials**: provider-specific secrets (stored encrypted)
4. Click **Save Provider**.

### Step 3: Create a Room

1. Go to **Rooms**.
2. Click **Create Room**.
3. Enter room details:
   - **Room ID**: unique identifier
   - **Room Name**: display name
   - **Type**: `video`, `audio`, or `group`
   - **Max Participants**: limit for the room
   - **Recording**: enable/disable
4. Click **Create Room**.

### Step 4: Generate a Token

1. Open the room detail or use the token endpoint.
2. Request an RTC token for a user.
3. Use the token in your client SDK to join the room.

### Step 5: Build Your Client

Use the SAM Communication SDK or direct API calls to integrate video, audio, or meetings into your application.

---

## 4. Dashboard

The **Communication Dashboard** gives you a real-time overview of your communication infrastructure.

### Stats

| Metric | Description |
|--------|-------------|
| Active Calls | Currently ongoing calls |
| Active Rooms | Rooms with participants |
| Active Meetings | Running meetings |
| Total Minutes | Cumulative call duration |
| API Requests | Communication API usage |
| Provider Health | Overall provider uptime |

### Provider Health Panel

Shows each provider’s status:

- **Healthy** — operating normally
- **Degraded** — high latency or partial failures
- **Unavailable** — provider is down
- **Unknown** — not yet checked

### Recent Activity

Logs recent events such as:
- Meeting started / ended
- Recording completed
- Provider failover
- API key rotated
- Webhook delivered

---

## 5. Provider Registry

The provider registry is the heart of SAM Communication Cloud. It stores all configured providers and their capabilities.

### Supported Providers

| Provider | Category | Video | Audio | Group | Screen Share | Recording | Live Streaming | Max Participants |
|----------|----------|-------|-------|-------|--------------|-----------|----------------|------------------|
| Agora | RTC | Yes | Yes | Yes | Yes | Yes | Yes | 1000 |
| LiveKit | RTC | Yes | Yes | Yes | Yes | Yes | Yes | 200 |
| Jitsi | RTC | Yes | Yes | Yes | Yes | No | No | 100 |
| WebRTC | RTC | Yes | Yes | Yes | Yes | No | No | 10 |

> Note: Capabilities depend on configuration. Self-hosted providers may differ.

### Adding a Provider

1. Navigate to **Providers**.
2. Click **Add Provider**.
3. Fill in the form.
4. Click **Save**.

### Editing a Provider

- Toggle **Enabled** to disable/enable without deleting.
- Update **Priority** to change routing order.
- Update **Credentials** to rotate keys.

### Deleting a Provider

- Click the delete icon on the provider card.
- Active sessions using this provider may be affected.

### Provider Health Checks

- Health checks run automatically.
- You can view status in the **Provider Health** panel or via the API.

---

## 6. Rooms

Rooms are virtual spaces where users join for video, audio, or group calls.

### Creating a Room

```http
POST /communication/rooms?project_id=<project_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "room_id": "sam_room_123",
  "room_type": "video",
  "name": "Team Standup",
  "max_participants": 12,
  "record": true,
  "enable_chat": true,
  "enable_screen_share": true
}
```

### Room Types

| Type | Description |
|------|-------------|
| `video` | Video + audio call |
| `audio` | Audio only |
| `group` | Group call |

### Joining a Room

```http
POST /communication/rooms/sam_room_123/join
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "room_id": "sam_room_123",
  "token": "<short-lived-rtc-token>",
  "provider": "agora",
  "expires_at": "2026-08-27T13:00:00Z"
}
```

### Leaving a Room

```http
POST /communication/rooms/sam_room_123/leave
Authorization: Bearer <token>
```

### Deleting a Room

```http
DELETE /communication/rooms/sam_room_123
Authorization: Bearer <token>
```

> Admin only.

---

## 7. Meetings

Meetings are scheduled events with optional passwords, waiting rooms, and recording.

### Creating a Meeting

```http
POST /communication/meetings
Authorization: Bearer <token>
Content-Type: application/json

{
  "meeting_id": "sam_meet_001",
  "title": "Weekly All-Hands",
  "password": "optional-pass",
  "max_participants": 100,
  "record": true,
  "waiting_room": true
}
```

### Meeting Features

| Feature | Description |
|---------|-------------|
| Password | Optional meeting password |
| Waiting Room | Participants wait for host approval |
| Recording | Cloud recording enabled |
| Co-host | Multiple moderators |

### Joining a Meeting

```http
POST /communication/meetings/sam_meet_001/join
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "meeting_id": "sam_meet_001",
  "token": "<join-token>",
  "provider": "livekit",
  "join_url": "/modules/communication-cloud/meetings/sam_meet_001"
}
```

### Ending a Meeting

```http
POST /communication/meetings/sam_meet_001/end
Authorization: Bearer <token>
```

---

## 8. Recordings

Recordings are stored per room or meeting. Use the recording API to start, stop, and retrieve recordings.

### Starting a Recording

```http
POST /communication/recordings/start?room_id=sam_room_123
Authorization: Bearer <token>
```

### Stopping a Recording

```http
POST /communication/recordings/stop?recording_id=rec_123
Authorization: Bearer <token>
```

### Listing Recordings

```http
GET /communication/recordings
Authorization: Bearer <token>
```

### Recording Status

| Status | Description |
|--------|-------------|
| `started` | Recording in progress |
| `completed` | Recording finished, file ready |
| `error` | Recording failed |
| `unsupported` | Provider does not support recording |

---

## 9. API Keys & Tokens

### API Key Types

| Type | Purpose |
|------|---------|
| `public` | Client-side SDK initialization |
| `secret` | Server-side API calls |
| `server` | Backend-to-backend communication |
| `webhook` | Webhook endpoint authentication |

### Creating an API Key

```http
POST /communication/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production Key",
  "key_type": "public",
  "scopes": "rtc,video,chat",
  "environment": "production"
}
```

Response:
```json
{
  "id": "...",
  "key_code": "SAM-COMM-A1B2-C3D4",
  "secret_key": "<shown-only-once>",
  "name": "Production Key",
  "key_type": "public",
  "environment": "production",
  "created_at": "..."
}
```

> **Important**: The `secret_key` is shown only once. Store it securely.

### Token Service

Tokens are short-lived credentials for joining rooms or meetings.

```http
POST /communication/tokens/rtc
Authorization: Bearer <token>
Content-Type: application/json

{
  "room_id": "sam_room_123",
  "user_name": "John Doe",
  "role": "publisher",
  "expire_seconds": 3600
}
```

Response:
```json
{
  "success": true,
  "token": "<rtc-token>",
  "provider": "agora",
  "expires_at": "2026-08-27T13:00:00Z"
}
```

---

## 10. Webhooks

Webhooks notify your application about communication events.

### Supported Events

| Event | Description |
|-------|-------------|
| `call.started` | A call has started |
| `call.ended` | A call has ended |
| `participant.joined` | User joined a room |
| `participant.left` | User left a room |
| `meeting.created` | Meeting was created |
| `meeting.started` | Meeting started |
| `meeting.ended` | Meeting ended |
| `recording.started` | Recording started |
| `recording.completed` | Recording finished |
| `message.created` | Chat message sent |
| `provider.failed` | Provider failed |
| `provider.recovered` | Provider recovered |
| `quota.warning` | Quota threshold reached |

### Creating a Webhook

```http
POST /communication/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/sam",
  "events": "call.started,call.ended,recording.completed",
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "call.ended",
  "event_id": "evt_123",
  "timestamp": "2026-08-27T12:00:00Z",
  "data": {
    "room_id": "sam_room_123",
    "duration": 1845,
    "provider": "agora"
  },
  "signature": "hmac-sha256-signature"
}
```

### Webhook Security

- Every webhook is signed with HMAC-SHA256.
- Verify the signature using your webhook secret.
- Reject requests with invalid signatures.

---

## 11. Usage & Quotas

### Viewing Usage

```http
GET /communication/usage
Authorization: Bearer <token>
```

### Viewing Quotas

```http
GET /communication/quotas
Authorization: Bearer <token>
```

### Quota Types

| Quota Type | Description |
|------------|-------------|
| `monthly_minutes` | RTC minutes per month |
| `monthly_requests` | API requests per month |
| `concurrent_rooms` | Simultaneous rooms |
| `concurrent_users` | Simultaneous participants |

### Quota Behavior

- **Warning threshold**: default 80% — you are notified.
- **Soft limit**: requests may be throttled.
- **Hard limit**: requests are rejected.

---

## 12. API Reference

### Base URL

```
https://api.sam.ai/communication
```

### Authentication

All requests require a Bearer token:

```http
Authorization: Bearer <access-token>
```

### Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/providers` | List providers |
| `POST` | `/providers` | Create provider |
| `PUT` | `/providers/{id}` | Update provider |
| `DELETE` | `/providers/{id}` | Delete provider |
| `GET` | `/providers/health` | Provider health status |
| `POST` | `/rooms` | Create room |
| `GET` | `/rooms` | List rooms |
| `GET` | `/rooms/{id}` | Get room |
| `POST` | `/rooms/{id}/join` | Join room |
| `POST` | `/rooms/{id}/leave` | Leave room |
| `DELETE` | `/rooms/{id}` | Delete room |
| `POST` | `/tokens/rtc` | Generate RTC token |
| `POST` | `/meetings` | Create meeting |
| `GET` | `/meetings` | List meetings |
| `GET` | `/meetings/{id}` | Get meeting |
| `POST` | `/meetings/{id}/join` | Join meeting |
| `POST` | `/meetings/{id}/end` | End meeting |
| `POST` | `/recordings/start` | Start recording |
| `POST` | `/recordings/stop` | Stop recording |
| `GET` | `/recordings` | List recordings |
| `POST` | `/webhooks` | Create webhook |
| `GET` | `/webhooks` | List webhooks |
| `DELETE` | `/webhooks/{id}` | Delete webhook |
| `POST` | `/api-keys` | Create API key |
| `GET` | `/api-keys` | List API keys |
| `DELETE` | `/api-keys/{id}` | Revoke API key |
| `GET` | `/usage` | Usage events |
| `GET` | `/quotas` | Quota status |

---

## 13. SDK Examples

### JavaScript / TypeScript

```typescript
const sam = new SAMCommunication({
  apiKey: process.env.SAM_COMM_API_KEY
});

// Create a room
const room = await sam.rooms.create({
  room_id: "demo-room",
  room_type: "video",
  name: "Demo",
  max_participants: 10,
  record: true
});

// Generate token
const token = await sam.tokens.rtc.generate({
  room_id: "demo-room",
  user_name: "Alice",
  role: "publisher"
});

// Join room with provider SDK
await providerClient.join(room.room_id, token.token);
```

### Python

```python
from sam_comm import SAMCommunication

sam = SAMCommunication(api_key="SAM-COMM-...")

room = sam.rooms.create(
    room_id="demo-room",
    room_type="video",
    name="Demo",
    max_participants=10,
    record=True
)

token = sam.tokens.rtc.generate(
    room_id="demo-room",
    user_name="Alice",
    role="publisher"
)
```

### cURL

```bash
# Create room
curl -X POST https://api.sam.ai/communication/rooms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id":"demo-room","room_type":"video","name":"Demo"}'

# Generate token
curl -X POST https://api.sam.ai/communication/tokens/rtc \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id":"demo-room","user_name":"Alice"}'
```

---

## 14. Security

### Secrets Management

- Provider credentials are stored encrypted in the database.
- Master secrets never appear in API responses unless explicitly required.
- API keys are hashed; raw secrets are returned only once at creation.

### Token Security

- RTC tokens are short-lived (default 1 hour).
- Tokens are scoped to a specific room and user.
- Tokens are generated server-side only.

### Network Security

- All API traffic must use HTTPS.
- CORS is configured for allowed origins.
- Security headers are enforced via middleware.

### Audit Logging

All sensitive actions are logged:
- Provider creation, update, deletion
- Room creation, joining, leaving
- Token generation
- API key creation and revocation
- Recording start/stop

---

## 15. Troubleshooting

### Provider Unavailable

- Check **Provider Health** in the dashboard.
- Verify provider credentials are correct.
- Check network connectivity to the provider.

### Token Generation Fails

- Ensure the room exists.
- Ensure the provider is configured and healthy.
- Check user authentication and permissions.

### Recording Fails

- Verify the selected provider supports recording.
- Check provider quota and storage limits.
- Review provider-specific recording configuration.

### Webhook Not Delivered

- Verify the webhook URL is reachable.
- Check webhook secret matches.
- Review webhook delivery logs in the dashboard.

### Rate Limiting

- Standard limit: 100 requests/minute per API key.
- Configure custom limits in the admin panel.
- Backoff and retry with exponential backoff.

---

## Support

For issues or questions:
- Check the **API Documentation** in SAM AI (`/docs`)
- Review **Recent Activity** in the Communication Dashboard
- Contact your SAM AI administrator

---

*Last updated: 2026-08-27*
