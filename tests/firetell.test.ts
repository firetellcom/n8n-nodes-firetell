import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { Firetell } from '../nodes/Firetell/Firetell.node';
import { FiretellTrigger } from '../nodes/Firetell/FiretellTrigger.node';
import {
  normalizeBaseUrl,
  verifyWebhookSignature,
} from '../nodes/Firetell/GenericFunctions';

describe('GenericFunctions', () => {
  it('normalizes workspace domains to /api/v1 base URL', () => {
    expect(normalizeBaseUrl('acme.firetell.app')).toBe(
      'https://acme.firetell.app/api/v1',
    );
    expect(normalizeBaseUrl('https://acme.firetell.app/')).toBe(
      'https://acme.firetell.app/api/v1',
    );
    expect(normalizeBaseUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/api/v1',
    );
    expect(normalizeBaseUrl('https://acme.firetell.app/api/v1')).toBe(
      'https://acme.firetell.app/api/v1',
    );
  });

  it('verifies HMAC-SHA256 X-Webhook-Signature properly', () => {
    const secret = 'whsec_firetell_test_secret';
    const rawBody = JSON.stringify({
      event: 'call.ended',
      workspace_id: 'acme',
      data: { call_id: 'call_1' },
      timestamp: '2026-11-19T00:00:00.000Z',
      attempt: 1,
    });
    const validSig = createHmac('sha256', secret).update(rawBody).digest('hex');

    expect(verifyWebhookSignature(rawBody, validSig, secret)).toBe(true);
    expect(verifyWebhookSignature(Buffer.from(rawBody), validSig, secret)).toBe(
      true,
    );
    expect(verifyWebhookSignature(rawBody + ' ', validSig, secret)).toBe(false);
    expect(verifyWebhookSignature(rawBody, 'wrong_sig', secret)).toBe(false);
    expect(verifyWebhookSignature(rawBody, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(rawBody, validSig, undefined)).toBe(false);
  });
});

describe('FiretellTrigger webhook verification', () => {
  const trigger = new FiretellTrigger();
  const secret = 'whsec_trigger_secret_123';
  const payload = {
    event: 'call.ended',
    workspace_id: 'acme',
    data: { call_id: 'call_99' },
    timestamp: '2026-11-19T00:00:00.000Z',
    attempt: 1,
  };
  const rawBody = JSON.stringify(payload);
  const validSig = createHmac('sha256', secret).update(rawBody).digest('hex');

  function makeWebhookContext(opts: {
    signature?: string;
    verifySignature?: boolean;
    events?: string[];
    mode?: string;
    secret?: string;
    rawBody?: string | Buffer;
  }) {
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn().mockReturnThis();
    const mode = opts.mode ?? 'trigger';
    const params: Record<string, unknown> = {
      verifySignature: opts.verifySignature ?? true,
      events: opts.events ?? ['call.ended'],
      options: {},
    };

    return {
      statusMock,
      jsonMock,
      ctx: {
        getMode: () => mode,
        getNodeWebhookUrl: () => 'https://n8n.example.com/webhook/abc',
        getRequestObject: () => ({
          rawBody: opts.rawBody !== undefined ? opts.rawBody : rawBody,
          headers: opts.signature
            ? { 'x-webhook-signature': opts.signature }
            : {},
        }),
        getResponseObject: () => ({ status: statusMock, json: jsonMock }),
        getBodyData: () => payload,
        getHeaderData: () =>
          opts.signature ? { 'x-webhook-signature': opts.signature } : {},
        getNodeParameter: (name: string, fallback?: unknown) =>
          params[name] ?? fallback,
        getWorkflowStaticData: () => ({
          webhookSecret_prod: opts.secret !== undefined ? opts.secret : secret,
        }),
        helpers: {
          returnJsonArray: (data: unknown) => [{ json: data }],
        },
      } as any,
    };
  }

  it('triggers workflow when X-Webhook-Signature is valid', async () => {
    const { ctx, statusMock } = makeWebhookContext({ signature: validSig });
    const result = await trigger.webhook.call(ctx);

    expect(statusMock).not.toHaveBeenCalled();
    expect(result.workflowData?.[0]?.[0]?.json).toEqual(payload);
  });

  it('falls back to JSON.stringify(body) when req.rawBody is missing', async () => {
    const { ctx, statusMock } = makeWebhookContext({
      signature: validSig,
      rawBody: '',
    });
    const result = await trigger.webhook.call(ctx);

    expect(statusMock).not.toHaveBeenCalled();
    expect(result.workflowData?.[0]?.[0]?.json).toEqual(payload);
  });

  it('rejects with HTTP 401 when X-Webhook-Signature is invalid', async () => {
    const { ctx, statusMock, jsonMock } = makeWebhookContext({
      signature: 'bad_signature',
    });
    const result = await trigger.webhook.call(ctx);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Invalid X-Webhook-Signature header',
    });
    expect(result).toEqual({ noWebhookResponse: true });
  });

  it('allows bypassing verification when verifySignature is false', async () => {
    const { ctx } = makeWebhookContext({
      signature: undefined,
      verifySignature: false,
    });
    const result = await trigger.webhook.call(ctx);

    expect(result.workflowData?.[0]?.[0]?.json).toEqual(payload);
  });
});

describe('Firetell Action Node', () => {
  it('sends SMS via POST /api/v1/messages/send', async () => {
    const node = new Firetell();
    const httpMock = vi.fn().mockResolvedValue({
      id: 'msg_1',
      status: 'queued',
    });

    const params: Record<string, unknown> = {
      resource: 'message',
      operation: 'send',
      from: '+15551234567',
      to: '+15559876543',
      body: 'Hello from n8n!',
      additionalFields: {},
    };

    const ctx = {
      getInputData: () => [{ json: {} }],
      getNodeParameter: (name: string, _idx: number, fallback?: unknown) =>
        params[name] ?? fallback,
      getCredentials: async () => ({
        domain: 'acme.firetell.app',
        secretKey: 'sk-test-123',
      }),
      getNode: () => ({ name: 'Firetell' }),
      continueOnFail: () => false,
      helpers: {
        httpRequestWithAuthentication: httpMock,
        returnJsonArray: (data: unknown) => [{ json: data }],
        constructExecutionMetaData: (items: unknown[]) => items,
      },
    } as any;

    const output = await node.execute.call(ctx);

    expect(httpMock).toHaveBeenCalledTimes(1);
    expect(httpMock).toHaveBeenCalledWith(
      'firetellApi',
      expect.objectContaining({
        method: 'POST',
        url: 'https://acme.firetell.app/api/v1/messages/send',
        body: {
          from: '+15551234567',
          to: '+15559876543',
          body: 'Hello from n8n!',
        },
      }),
    );
    expect(output[0][0].json).toEqual({ id: 'msg_1', status: 'queued' });
  });
});
