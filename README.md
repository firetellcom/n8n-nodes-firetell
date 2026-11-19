# @firetell/n8n-nodes-firetell

Official **n8n community nodes** for [Firetell](https://firetell.com) — automate programmable voice calls, SMS/MMS messaging, Voice AI agents, Knowledge Bases (RAG), contacts, and real-time webhook triggers with built-in **HMAC-SHA256 signature verification**.

- **Zero runtime dependencies** (uses native n8n HTTP helpers and `node:crypto`)
- **AI Agent Tool compatible** (`usableAsTool: true`) — let n8n AI Agents place calls, send SMS, or lookup contacts
- **Auto-managed Firetell Trigger** — automatically registers/updates/deletes webhook subscriptions in your Firetell workspace and verifies `X-Webhook-Signature`
- **Dynamic dropdowns** — auto-loads Phone Numbers, Voice AI Agents, Knowledge Bases, Address Books, Agents, and Teams

---

## Installation

### In n8n UI (Recommended)

1. Open your n8n instance and go to **Settings → Community Nodes**.
2. Click **Install**.
3. Enter `@firetell/n8n-nodes-firetell` and confirm.

### Manual Installation

```bash
npm install @firetell/n8n-nodes-firetell
```

---

## Credentials Setup (`Firetell API`)

1. In Firetell Console, generate an **API Secret Key** (`sk-...`).
2. In n8n, create a new **Firetell API** credential with:
   - **Workspace Domain:** e.g. `yourcompany.firetell.app`
   - **API Secret Key:** `sk-...`
3. Click **Test** to verify connectivity (`GET /api/v1` with `Authorization: ApiKey <secretKey>`).

---

## Nodes Included

### 1. Firetell Trigger (`FiretellTrigger`)

Starts an n8n workflow whenever selected Firetell events occur.

- **Auto-Managed Webhooks:** Activating a workflow registers the n8n webhook URL in Firetell (`POST /api/v1/webhooks`) and stores the signing secret. Deactivating automatically removes it (`DELETE /api/v1/webhooks/{id}`).
- **HMAC-SHA256 Verification:** Enabled by default (`Verify Webhook Signature = true`). Validates the `X-Webhook-Signature` header using constant-time `crypto.timingSafeEqual` against the raw request body and rejects unauthorized requests with HTTP `401`.
- **Supported Events (18):**
  - **Calls:** `call.created`, `call.answered`, `call.ended`, `call.recording.ready`, `call.transcription.completed`, `call.transcription.summary`
  - **Messages:** `message.received`, `message.sent`, `message.delivered`, `message.failed`, `message.undelivered`
  - **Contacts:** `contact.created`, `contact.updated`, `contact.deleted`
  - **Agents:** `agent.created`, `agent.updated`, `agent.deleted`
  - **Workspace:** `workspace.credit.updated`

### 2. Firetell (`Firetell`)

Action node supporting 9 resources (usable as an n8n AI Agent Tool):

| Resource | Operations |
| :--- | :--- |
| **Call** | `Make Call`, `Send Actions`, `Get Many`, `Get Events`, `Get Recordings`, `Get Transcription` |
| **Message (SMS/MMS)** | `Send`, `Get`, `Get Many` |
| **Contact** | `Lookup by Phone`, `Create`, `Get`, `Get Many`, `Update`, `Delete` |
| **Address Book** | `Create`, `Get`, `Get Many`, `Update`, `Delete` |
| **Voice AI Agent** | `Get Many`, `Get`, `Create`, `Update`, `Update Settings`, `Publish Version` |
| **Knowledge Base** | `Get Many`, `Get`, `Create`, `Upload Document` *(binary)*, `Crawl URLs`, `Recrawl Document`, `Delete Document` |
| **Phone Number** | `Get Many`, `Get`, `Update` |
| **Agent** | `Get Many`, `Get`, `Create`, `Update`, `Delete` |
| **Team** | `Get Many`, `Get`, `Create`, `Update`, `Delete`, `Add Agent`, `Remove Agent` |

---

## Documentation & References

- **Workspace API Reference:** https://firetell.com/docs/developers/rest-api/overview
- **Quickstart:** https://firetell.com/docs/developers/getting-started/quickstart
- **Authentication:** https://firetell.com/docs/developers/getting-started/authentication
- **Webhooks:** https://firetell.com/docs/developers/rest-api/workspace-api/webhooks
- **SDKs Overview:** https://firetell.com/docs/developers/sdks/overview
- **OpenAPI Playground:** https://firetell.com/docs/developers/api-playground/workspace-api

---

## License

MIT © [Firetell](https://github.com/firetellcom/firetell-n8n-nodes/blob/main/LICENSE)
