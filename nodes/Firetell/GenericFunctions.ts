import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  IDataObject,
  IExecuteFunctions,
  IHookFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  IWebhookFunctions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export interface FiretellCredentials {
  domain: string;
  secretKey: string;
}

export function normalizeBaseUrl(domain: string): string {
  const trimmed = domain.trim().replace(/\/+$/, '');
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  if (withProtocol.endsWith('/api/v1')) {
    return withProtocol;
  }

  return `${withProtocol}/api/v1`;
}

/**
 * Verify an incoming Firetell `X-Webhook-Signature` header using HMAC-SHA256
 * with constant-time comparison.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | undefined,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature.trim(), 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(sigBuf, expectedBuf);
}

type FiretellContext =
  | IExecuteFunctions
  | IHookFunctions
  | ILoadOptionsFunctions
  | IWebhookFunctions;

export async function firetellApiRequest(
  this: FiretellContext,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  extraHeaders: IDataObject = {},
): Promise<any> {
  const credentials = (await this.getCredentials(
    'firetellApi',
  )) as unknown as FiretellCredentials;

  const baseUrl = normalizeBaseUrl(credentials.domain);
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const cleanQs: IDataObject = {};
  for (const [k, v] of Object.entries(qs)) {
    if (v !== undefined && v !== null && v !== '') {
      cleanQs[k] = v;
    }
  }

  const options: IHttpRequestOptions = {
    method,
    url: `${baseUrl}${path}`,
    qs: cleanQs,
    headers: {
      Accept: 'application/json',
      ...extraHeaders,
    },
    json: true,
  };

  if (Object.keys(body).length > 0) {
    options.body = body;
  }

  try {
    return await this.helpers.httpRequestWithAuthentication.call(
      this,
      'firetellApi',
      options,
    );
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as any);
  }
}

export async function firetellApiRequestAllItems(
  this: FiretellContext,
  endpoint: string,
  qs: IDataObject = {},
  returnAll = false,
  limit = 20,
): Promise<IDataObject[]> {
  if (!returnAll) {
    const response = await firetellApiRequest.call(this, 'GET', endpoint, {}, {
      ...qs,
      page: qs.page ?? 1,
      limit,
    });
    return Array.isArray(response?.data) ? response.data : [];
  }

  const results: IDataObject[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const response = await firetellApiRequest.call(this, 'GET', endpoint, {}, {
      ...qs,
      page,
      limit: pageSize,
    });

    const items: IDataObject[] = Array.isArray(response?.data)
      ? response.data
      : [];
    results.push(...items);

    const totalPages = response?.meta?.total_pages ?? 1;
    if (page >= totalPages || items.length === 0) {
      break;
    }

    page += 1;
  }

  return results;
}

export async function firetellUploadFile(
  this: IExecuteFunctions,
  method: 'POST' | 'PATCH',
  endpoint: string,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  fields: Record<string, string> = {},
): Promise<any> {
  const credentials = (await this.getCredentials(
    'firetellApi',
  )) as unknown as FiretellCredentials;

  const baseUrl = normalizeBaseUrl(credentials.domain);
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  const blob = new Blob([new Uint8Array(fileBuffer)], {
    type: mimeType || 'application/octet-stream',
  });
  formData.append('file', blob, filename);

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `ApiKey ${credentials.secretKey.trim()}`,
    },
    body: formData,
  });

  const text = await response.text();
  let parsed: any;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { message: text };
  }

  if (!response.ok) {
    throw new NodeApiError(this.getNode(), {
      message: parsed?.message || `Upload failed with status ${response.status}`,
      httpCode: String(response.status),
      description: text,
    });
  }

  return parsed;
}
