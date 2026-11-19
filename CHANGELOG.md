# Changelog

All notable changes to `@firetell/n8n-nodes-firetell` will be documented in this file.

## [1.0.0] - 2026-11-19

### Added
- Initial release of `@firetell/n8n-nodes-firetell` (MIT license).
- `FiretellApi` credential with Workspace Domain + API Secret Key (`Authorization: ApiKey <secretKey>`) and built-in connection test.
- `FiretellTrigger` node with automatic Firetell webhook lifecycle management (`checkExists`, `create`, `delete`), all 18 Firetell webhook events, and HMAC-SHA256 `X-Webhook-Signature` verification.
- `Firetell` action node (`usableAsTool: true`) with dynamic `loadOptions` and 9 resources: Call, Message (SMS/MMS), Contact, Address Book, Voice AI Agent, Knowledge Base (including binary document upload & URL crawling), Phone Number, Agent, and Team.
