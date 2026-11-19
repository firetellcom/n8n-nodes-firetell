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
 * still has access to the newly created signing secret even when n8n does not persist
 * workflowStaticData across manual test runs.
 */
const inMemorySecretByUrl = new Map<string, string>();

function getStaticDataKeys(mode: string): { idKey: string; secretKey: string } {
  const suffix = mode === 'manual' ? 'test' : 'prod';
  return {
    idKey: `webhookId_${suffix}`,
    secretKey: `webhookSecret_${suffix}`,
  };
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

        const webhookId =
          (webhookData[idKey] as string | undefined) ??
          (mode !== 'manual'
            ? (webhookData.webhookId as string | undefined)
            : undefined);

        if (!webhookId) {
          return false;
        }

        const verifySignature = this.getNodeParameter(
          'verifySignature',
          true,
        ) as boolean;
        const options = (this.getNodeParameter('options', {}) ||
          {}) as IDataObject;
        const manualSecret = String(options.manualWebhookSecret || '').trim();
        const storedSecret =
          (webhookData[secretKey] as string | undefined) ??
          (mode !== 'manual'
            ? (webhookData.webhookSecret as string | undefined)
            : undefined) ??
          inMemorySecretByUrl.get(webhookUrl);

        try {
          const existing = await firetellApiRequest.call(
            this,
            'GET',
            `/webhooks/${encodeURIComponent(webhookId)}`,
          );

          if (!existing?.id) {
            delete webhookData[idKey];
            delete webhookData[secretKey];
            return false;
          }

          // Firetell's GET /webhooks/:id omits `secret` (select: false).
          // If signature verification is enabled and we have no secret stored,
          // recreate the webhook so we capture a fresh signing secret.
          const resolvedSecret = existing.secret || storedSecret || manualSecret;
          if (verifySignature && !resolvedSecret) {
            try {
              await firetellApiRequest.call(
                this,
                'DELETE',
                `/webhooks/${encodeURIComponent(webhookId)}`,
              );
            } catch {
              // ignore cleanup errors
            }
            delete webhookData[idKey];
            delete webhookData[secretKey];
            return false;
          }

          const events = this.getNodeParameter('events') as string[];
          const existingEvents = Array.isArray(existing.events)
            ? [...existing.events].sort()
            : [];
          const desiredEvents = [...events].sort();

          if (
            existing.url !== webhookUrl ||
            JSON.stringify(existingEvents) !== JSON.stringify(desiredEvents)
          ) {
            const title =
              (options.webhookTitle as string) ||
              existing.title ||
              `n8n - ${this.getWorkflow().name || 'Firetell Trigger'}`.slice(
                0,
                100,
              );

            await firetellApiRequest.call(
              this,
              'PATCH',
              `/webhooks/${encodeURIComponent(webhookId)}`,
              {
                title,
                url: webhookUrl,
                events,
              },
            );
          }

          webhookData[idKey] = existing.id;
          if (resolvedSecret) {
            webhookData[secretKey] = resolvedSecret;
            if (webhookUrl) {
              inMemorySecretByUrl.set(webhookUrl, resolvedSecret);
            }
          }

          return true;
        } catch {
          delete webhookData[idKey];
          delete webhookData[secretKey];
          return false;
        }
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

        const webhookId =
          (webhookData[idKey] as string | undefined) ??
          (mode !== 'manual'
            ? (webhookData.webhookId as string | undefined)
            : undefined);

        if (webhookUrl) {
          inMemorySecretByUrl.delete(webhookUrl);
        }

        if (!webhookId) {
          delete webhookData[idKey];
          delete webhookData[secretKey];
          return true;
        }

        try {
          await firetellApiRequest.call(
            this,
            'DELETE',
            `/webhooks/${encodeURIComponent(webhookId)}`,
          );
        } catch {
          return false;
        } finally {
          delete webhookData[idKey];
          delete webhookData[secretKey];
          if (mode !== 'manual') {
            delete webhookData.webhookId;
            delete webhookData.webhookSecret;
          }
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
