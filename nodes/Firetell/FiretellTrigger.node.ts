import type {
  IDataObject,
  IHookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from 'n8n-workflow';
import {
  firetellApiRequest,
  firetellApiRequestAllItems,
  verifyWebhookSignature,
} from './GenericFunctions';

export const FIRETELL_WEBHOOK_EVENTS = [
  { name: 'Agent Created', value: 'agent.created' },
  { name: 'Agent Deleted', value: 'agent.deleted' },
  { name: 'Agent Updated', value: 'agent.updated' },
  { name: 'Call Answered', value: 'call.answered' },
  { name: 'Call Created', value: 'call.created' },
  { name: 'Call Ended', value: 'call.ended' },
  { name: 'Call Recording Ready', value: 'call.recording.ready' },
  { name: 'Call Transcription Completed', value: 'call.transcription.completed' },
  { name: 'Call Transcription Summary', value: 'call.transcription.summary' },
  { name: 'Contact Created', value: 'contact.created' },
  { name: 'Contact Deleted', value: 'contact.deleted' },
  { name: 'Contact Updated', value: 'contact.updated' },
  { name: 'Message Delivered', value: 'message.delivered' },
  { name: 'Message Failed', value: 'message.failed' },
  { name: 'Message Received', value: 'message.received' },
  { name: 'Message Sent', value: 'message.sent' },
  { name: 'Message Undelivered', value: 'message.undelivered' },
  { name: 'Workspace Credit Updated', value: 'workspace.credit.updated' },
];

/**
 * In-memory fallback cache keyed by webhook URL so Test mode ("Listen for Test Event")
 * and n8n Publish flows still have access to the signing secret even when n8n resets
 * workflowStaticData across versions or manual test runs.
 */
const inMemorySecretByUrl = new Map<string, string>();

function getStaticDataKeys(mode: string): { idKey: string; secretKey: string } {
  const suffix = mode === 'manual' ? 'test' : 'prod';
  return {
    idKey: `webhookId_${suffix}`,
    secretKey: `webhookSecret_${suffix}`,
  };
}

async function listWebhooksByUrl(
  ctx: IHookFunctions,
  webhookUrl: string,
): Promise<IDataObject[]> {
  if (!webhookUrl) return [];
  try {
    const all = await firetellApiRequestAllItems.call(
      ctx,
      '/webhooks',
      {},
      true,
      100,
    );
    return all.filter((w) => w.url === webhookUrl);
  } catch {
    return [];
  }
}

async function safeDeleteWebhook(
  ctx: IHookFunctions,
  id: string,
): Promise<void> {
  try {
    await firetellApiRequest.call(
      ctx,
      'DELETE',
      `/webhooks/${encodeURIComponent(id)}`,
    );
  } catch {
    // ignore cleanup errors if already deleted
  }
}

export class FiretellTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Firetell Trigger',
    name: 'firetellTrigger',
    icon: 'file:firetell.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["events"].join(", ")}}',
    description:
      'Starts a workflow when Firetell webhook events occur (with HMAC-SHA256 signature verification)',
    defaults: {
      name: 'Firetell Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'firetellApi',
        required: true,
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        required: true,
        default: ['call.ended'],
        description: 'Firetell webhook events to listen for',
        options: FIRETELL_WEBHOOK_EVENTS,
      },
      {
        displayName: 'Verify Webhook Signature',
        name: 'verifySignature',
        type: 'boolean',
        default: true,
        description:
          'Whether to verify the X-Webhook-Signature header using HMAC-SHA256 before triggering the workflow',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Webhook Title',
            name: 'webhookTitle',
            type: 'string',
            default: '',
            placeholder: 'n8n Workflow Trigger',
            description:
              'Custom title for the webhook subscription automatically created in Firetell (max 100 chars)',
          },
          {
            displayName: 'Manual Webhook Secret',
            name: 'manualWebhookSecret',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            description:
              'Optional override signing secret used to verify X-Webhook-Signature (by default, the secret returned during auto-registration is used)',
          },
        ],
      },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');
        const mode = this.getMode();
        const { idKey, secretKey } = getStaticDataKeys(mode);
        const webhookUrl = this.getNodeWebhookUrl('default') || '';
        const events = this.getNodeParameter('events') as string[];
        const verifySignature = this.getNodeParameter(
          'verifySignature',
          true,
        ) as boolean;
        const options = (this.getNodeParameter('options', {}) ||
          {}) as IDataObject;
        const manualSecret = String(options.manualWebhookSecret || '').trim();

        const storedId =
          (webhookData[idKey] as string | undefined) ??
          (mode !== 'manual'
            ? (webhookData.webhookId as string | undefined)
            : undefined);
        const storedSecret =
          (webhookData[secretKey] as string | undefined) ??
          (mode !== 'manual'
            ? (webhookData.webhookSecret as string | undefined)
            : undefined) ??
          inMemorySecretByUrl.get(webhookUrl);

        // Always look up existing webhooks matching this n8n URL so we never
        // accumulate duplicates across Save/Publish cycles.
        const matchingWebhooks = await listWebhooksByUrl(this, webhookUrl);

        if (matchingWebhooks.length === 0) {
          delete webhookData[idKey];
          delete webhookData[secretKey];
          return false;
        }

        // Prefer the webhook matching our stored ID (if still present), otherwise the newest one
        const primary =
          (storedId
            ? matchingWebhooks.find((w) => String(w.id) === storedId)
            : undefined) ?? matchingWebhooks[0];

        // Delete any duplicate webhooks sharing the same URL
        for (const dup of matchingWebhooks) {
          if (dup.id && String(dup.id) !== String(primary.id)) {
            await safeDeleteWebhook(this, String(dup.id));
          }
        }

        // Firetell's GET /webhooks omits `secret` (select: false).
        // If signature verification is enabled and we don't have the secret for `primary`,
        // delete `primary` and return false so `create()` registers 1 fresh webhook with a known secret.
        const resolvedSecret =
          (primary.secret as string | undefined) || storedSecret || manualSecret;

        if (verifySignature && !resolvedSecret) {
          if (primary.id) {
            await safeDeleteWebhook(this, String(primary.id));
          }
          delete webhookData[idKey];
          delete webhookData[secretKey];
          return false;
        }

        const existingEvents = Array.isArray(primary.events)
          ? [...(primary.events as string[])].sort()
          : [];
        const desiredEvents = [...events].sort();
        const desiredTitle = (
          (options.webhookTitle as string) ||
          (primary.title as string) ||
          `n8n: ${this.getWorkflow().name || 'Workflow'}`
        ).slice(0, 100);

        if (
          JSON.stringify(existingEvents) !== JSON.stringify(desiredEvents) ||
          primary.title !== desiredTitle
        ) {
          await firetellApiRequest.call(
            this,
            'PATCH',
            `/webhooks/${encodeURIComponent(String(primary.id))}`,
            {
              title: desiredTitle,
              url: webhookUrl,
              events,
            },
          );
        }

        webhookData[idKey] = String(primary.id);
        if (resolvedSecret) {
          webhookData[secretKey] = resolvedSecret;
          if (webhookUrl) {
            inMemorySecretByUrl.set(webhookUrl, resolvedSecret);
          }
        }

        return true;
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default') || '';
        const events = this.getNodeParameter('events') as string[];
        const options = (this.getNodeParameter('options', {}) ||
          {}) as IDataObject;
        const workflowName = this.getWorkflow().name || 'Workflow';
        const mode = this.getMode();
        const modeSuffix = mode === 'manual' ? ' (test)' : '';
        const title = (
          (options.webhookTitle as string) ||
          `n8n: ${workflowName}${modeSuffix}`
        ).slice(0, 100);

        const response = await firetellApiRequest.call(
          this,
          'POST',
          '/webhooks',
          {
            title,
            url: webhookUrl,
            events,
          },
        );

        if (!response?.id) {
          return false;
        }

        const webhookData = this.getWorkflowStaticData('node');
        const { idKey, secretKey } = getStaticDataKeys(mode);

        webhookData[idKey] = response.id;
        if (response.secret) {
          webhookData[secretKey] = response.secret;
          if (webhookUrl) {
            inMemorySecretByUrl.set(webhookUrl, String(response.secret));
          }
        }

        return true;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');
        const mode = this.getMode();
        const { idKey, secretKey } = getStaticDataKeys(mode);
        const webhookUrl = this.getNodeWebhookUrl('default') || '';

        const storedId =
          (webhookData[idKey] as string | undefined) ??
          (mode !== 'manual'
            ? (webhookData.webhookId as string | undefined)
            : undefined);

        if (webhookUrl) {
          inMemorySecretByUrl.delete(webhookUrl);
        }

        const idsToDelete = new Set<string>();
        if (storedId) {
          idsToDelete.add(storedId);
        }

        // Also clean up any webhook matching this n8n URL in case staticData was cleared
        const matchingWebhooks = await listWebhooksByUrl(this, webhookUrl);
        for (const w of matchingWebhooks) {
          if (w.id) {
            idsToDelete.add(String(w.id));
          }
        }

        for (const id of idsToDelete) {
          await safeDeleteWebhook(this, id);
        }

        delete webhookData[idKey];
        delete webhookData[secretKey];
        if (mode !== 'manual') {
          delete webhookData.webhookId;
          delete webhookData.webhookSecret;
        }

        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const res = this.getResponseObject();
    const body = this.getBodyData() as IDataObject;
    const headers = this.getHeaderData() as Record<
      string,
      string | string[] | undefined
    >;

    const verifySignature = this.getNodeParameter(
      'verifySignature',
      true,
    ) as boolean;

    if (verifySignature) {
      const options = (this.getNodeParameter('options', {}) ||
        {}) as IDataObject;
      const webhookData = this.getWorkflowStaticData('node');
      const mode = this.getMode();
      const { secretKey } = getStaticDataKeys(mode);
      const webhookUrl = this.getNodeWebhookUrl('default') || '';

      const manualSecret = String(options.manualWebhookSecret || '').trim();
      const secret =
        manualSecret ||
        (webhookData[secretKey] as string | undefined) ||
        (webhookData.webhookSecret as string | undefined) ||
        inMemorySecretByUrl.get(webhookUrl);

      const rawHeader =
        headers['x-webhook-signature'] ??
        headers['X-Webhook-Signature'] ??
        (req.headers?.['x-webhook-signature'] as
          | string
          | string[]
          | undefined);
      const signature = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

      if (!signature) {
        res.status(401).json({
          error: 'Missing X-Webhook-Signature header',
        });
        return { noWebhookResponse: true };
      }

      if (!secret) {
        res.status(401).json({
          error:
            'Webhook signing secret not found. Deactivate and reactivate the workflow, or set Manual Webhook Secret in Options.',
        });
        return { noWebhookResponse: true };
      }

      const reqRawBody = (req as unknown as { rawBody?: string | Buffer })
        .rawBody;
      const jsonBody = JSON.stringify(body);

      const isValid =
        (reqRawBody !== undefined &&
          reqRawBody.length > 0 &&
          verifyWebhookSignature(reqRawBody, signature, secret)) ||
        verifyWebhookSignature(jsonBody, signature, secret);

      if (!isValid) {
        res.status(401).json({
          error: 'Invalid X-Webhook-Signature header',
        });
        return { noWebhookResponse: true };
      }
    }

    const subscribedEvents = this.getNodeParameter('events', []) as string[];
    const incomingEvent = body.event as string | undefined;
    if (
      subscribedEvents.length > 0 &&
      incomingEvent &&
      !subscribedEvents.includes(incomingEvent)
    ) {
      return { noWebhookResponse: false };
    }

    return {
      workflowData: [this.helpers.returnJsonArray(body)],
    };
  }
}
