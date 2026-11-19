# Changelog

All notable changes to `@firetell/n8n-nodes-firetell` will be documented in this file.

## [1.0.1] - 2026-11-19

### Fixed
- **FiretellTrigger signature verification & Test vs. Production mode**:
  - Separated `workflowStaticData` keys (`webhookId_test`/`webhookSecret_test` vs. `webhookId_prod`/`webhookSecret_prod`) so Test mode ("Listen for Test Event") and Production mode no longer overwrite or delete each other's webhook subscriptions.
  - Added an in-memory URL-keyed secret fallback cache for manual Test runs where n8n does not persist `workflowStaticData`.
  - In `checkExists`, automatically recreate the Firetell webhook if `verifySignature` is enabled and no signing secret is stored (since `GET /api/v1/webhooks/:id` omits `secret`).
  - Added fallback HMAC-SHA256 verification against `JSON.stringify(body)` when `req.rawBody` is missing or empty, plus clearer `401` diagnostic messages.

## [1.0.0] - 2026-11-19

### Added
- Initial release of `@firetell/n8n-nodes-firetell` (MIT license).
- `FiretellApi` credential with Workspace Domain + API Secret Key (`Authorization: ApiKey <secretKey>`) and built-in connection test.
- `FiretellTrigger` node with automatic Firetell webhook lifecycle management (`checkExists`, `create`, `delete`), all 18 Firetell webhook events, and HMAC-SHA256 `X-Webhook-Signature` verification.
- `Firetell` action node (`usableAsTool: true`) with dynamic `loadOptions` and 9 resources: Call, Message (SMS/MMS), Contact, Address Book, Voice AI Agent, Knowledge Base (including binary document upload & URL crawling), Phone Number, Agent, and Team.
