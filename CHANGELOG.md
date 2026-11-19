# Changelog

All notable changes to `@firetell/n8n-nodes-firetell` will be documented in this file.

## [1.0.3] - 2026-11-19

### Changed
- Upgraded `n8n-workflow` devDependency to `^2.16.0` for full type-checking and compatibility with modern n8n v2/v3 runtimes (while preserving `peerDependencies: { "n8n-workflow": "*" }` for backward compatibility with n8n v1).

## [1.0.2] - 2026-11-19

### Fixed
- **Prevent duplicate webhooks on n8n Save / Publish**:
  - `checkExists()` now queries `GET /api/v1/webhooks` by `webhookUrl`, automatically deduplicates any extra webhooks sharing the same n8n URL, and updates the existing webhook in-place (`PATCH`) when events change (or deletes & recreates cleanly if the signing secret is missing).
  - `delete()` also removes any matching webhooks by `webhookUrl` so deactivating a workflow never leaves orphaned endpoints in Firetell Console.

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
