import type {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
  addressBookFields,
  addressBookOperations,
  agentFields,
  agentOperations,
  callFields,
  callOperations,
  contactFields,
  contactOperations,
  knowledgeBaseFields,
  knowledgeBaseOperations,
  messageFields,
  messageOperations,
  phoneNumberFields,
  phoneNumberOperations,
  teamFields,
  teamOperations,
  voiceAgentFields,
  voiceAgentOperations,
} from './descriptions';
import {
  firetellApiRequest,
  firetellApiRequestAllItems,
  firetellUploadFile,
} from './GenericFunctions';

function parseJsonParam(
  value: unknown,
  fieldName: string,
  node: ReturnType<IExecuteFunctions['getNode']>,
): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      throw new NodeOperationError(
        node,
        `Invalid JSON in "${fieldName}": ${(err as Error).message}`,
      );
    }
  }
  return value;
}

function splitList(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export class Firetell implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Firetell',
    name: 'firetell',
    icon: 'file:firetell.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      'Interact with the Firetell Workspace API — programmable calls, SMS/MMS, Voice AI agents, knowledge bases, contacts, and more',
    defaults: {
      name: 'Firetell',
    },
    usableAsTool: true,
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'firetellApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Address Book', value: 'addressBook' },
          { name: 'Agent', value: 'agent' },
          { name: 'Call', value: 'call' },
          { name: 'Contact', value: 'contact' },
          { name: 'Knowledge Base', value: 'knowledgeBase' },
          { name: 'Message (SMS/MMS)', value: 'message' },
          { name: 'Phone Number', value: 'phoneNumber' },
          { name: 'Team', value: 'team' },
          { name: 'Voice AI Agent', value: 'voiceAgent' },
        ],
        default: 'call',
      },
      ...callOperations,
      ...callFields,
      ...messageOperations,
      ...messageFields,
      ...contactOperations,
      ...contactFields,
      ...addressBookOperations,
      ...addressBookFields,
      ...voiceAgentOperations,
      ...voiceAgentFields,
      ...knowledgeBaseOperations,
      ...knowledgeBaseFields,
      ...phoneNumberOperations,
      ...phoneNumberFields,
      ...agentOperations,
      ...agentFields,
      ...teamOperations,
      ...teamFields,
    ],
  };

  methods = {
    loadOptions: {
      async getPhoneNumbers(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const items = await firetellApiRequestAllItems.call(
          this,
          '/phone-numbers',
          {},
          false,
          100,
        );
        return items.map((item) => ({
          name: `${item.title || item.number} (${item.number})`,
          value: String(item.id),
        }));
      },

      async getVoiceAgents(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const items = await firetellApiRequestAllItems.call(
          this,
          '/voice-agents',
          {},
          false,
          100,
        );
        return items.map((item) => ({
          name: String(item.name || item.id),
          value: String(item.id),
        }));
      },

      async getKnowledgeBases(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const items = await firetellApiRequestAllItems.call(
          this,
          '/knowledge-bases',
          {},
          false,
          100,
        );
        return items.map((item) => ({
          name: String(item.name || item.id),
          value: String(item.id),
        }));
      },

      async getAddressBooks(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const items = await firetellApiRequestAllItems.call(
          this,
          '/address-books',
          {},
          false,
          100,
        );
        return items.map((item) => ({
          name: String(item.title || item.id),
          value: String(item.id),
        }));
      },

      async getAgents(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const items = await firetellApiRequestAllItems.call(
          this,
          '/agents',
          {},
          false,
          100,
        );
        return items.map((item) => ({
          name: `${item.display_name || item.username} (${item.username})`,
          value: String(item.id),
        }));
      },

      async getTeams(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const items = await firetellApiRequestAllItems.call(
          this,
          '/teams',
          {},
          false,
          100,
        );
        return items.map((item) => ({
          name: String(item.title || item.id),
          value: String(item.id),
        }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: any;

        // ==================== CALL ====================
        if (resource === 'call') {
          if (operation === 'make') {
            const toNumber = this.getNodeParameter('toNumber', i) as string;
            const actionsRaw = this.getNodeParameter('actionsJson', i);
            const actions = parseJsonParam(
              actionsRaw,
              'Actions (JSON)',
              this.getNode(),
            );
            const additional = this.getNodeParameter(
              'additionalFields',
              i,
              {},
            ) as IDataObject;

            const body: IDataObject = {
              to: {
                number: toNumber,
                ...(additional.toName ? { name: additional.toName } : {}),
              },
              actions,
            };

            if (additional.fromNumber) {
              body.from = {
                number: additional.fromNumber,
                ...(additional.fromName ? { name: additional.fromName } : {}),
              };
            }
            if (additional.max_duration !== undefined) {
              body.max_duration = additional.max_duration;
            }
            if (additional.call_flow_id) {
              body.call_flow_id = additional.call_flow_id;
            }

            responseData = await firetellApiRequest.call(
              this,
              'POST',
              '/calls/make',
              body,
            );
          } else if (operation === 'sendActions') {
            const callId = this.getNodeParameter('callId', i) as string;
            const actionsRaw = this.getNodeParameter('actionsJson', i);
            const actions = parseJsonParam(
              actionsRaw,
              'Actions (JSON)',
              this.getNode(),
            );
            responseData = await firetellApiRequest.call(
              this,
              'PUT',
              `/calls/${encodeURIComponent(callId)}/actions`,
              { actions },
            );
          } else if (operation === 'getMany') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            const filters = this.getNodeParameter(
              'filters',
              i,
              {},
            ) as IDataObject;
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/calls',
              filters,
              returnAll,
              limit,
            );
          } else if (operation === 'getEvents') {
            const callId = this.getNodeParameter('callId', i) as string;
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            responseData = await firetellApiRequestAllItems.call(
              this,
              `/calls/${encodeURIComponent(callId)}/events`,
              {},
              returnAll,
              limit,
            );
          } else if (operation === 'getRecordings') {
            const callId = this.getNodeParameter('callId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/calls/${encodeURIComponent(callId)}/recordings`,
            );
          } else if (operation === 'getTranscription') {
            const callId = this.getNodeParameter('callId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/calls/${encodeURIComponent(callId)}/transcription`,
            );
          }
        }

        // ==================== MESSAGE ====================
        else if (resource === 'message') {
          if (operation === 'send') {
            const from = this.getNodeParameter('from', i) as string;
            const to = this.getNodeParameter('to', i) as string;
            const textBody = this.getNodeParameter('body', i) as string;
            const additional = this.getNodeParameter(
              'additionalFields',
              i,
              {},
            ) as IDataObject;

            const payload: IDataObject = { from, to, body: textBody };
            if (additional.media_urls) {
              payload.media_urls = splitList(String(additional.media_urls));
            }
            if (additional.conversation_id) {
              payload.conversation_id = additional.conversation_id;
            }
            if (additional.sender_type) {
              payload.sender_type = additional.sender_type;
            }
            if (additional.sender_id) {
              payload.sender_id = additional.sender_id;
            }

            responseData = await firetellApiRequest.call(
              this,
              'POST',
              '/messages/send',
              payload,
            );
          } else if (operation === 'get') {
            const messageId = this.getNodeParameter('messageId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/messages/${encodeURIComponent(messageId)}`,
            );
          } else if (operation === 'getMany') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            const filters = this.getNodeParameter(
              'filters',
              i,
              {},
            ) as IDataObject;
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/messages',
              filters,
              returnAll,
              limit,
            );
          }
        }

        // ==================== CONTACT ====================
        else if (resource === 'contact') {
          if (operation === 'lookup') {
            const number = this.getNodeParameter('lookupNumber', i) as string;
            const result = await firetellApiRequest.call(
              this,
              'GET',
              '/contacts/lookup',
              {},
              { number },
            );
            responseData = result ?? { found: false, number };
          } else if (operation === 'get') {
            const contactId = this.getNodeParameter('contactId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/contacts/${encodeURIComponent(contactId)}`,
            );
          } else if (operation === 'getMany') {
            const addressBookId = this.getNodeParameter(
              'addressBookId',
              i,
            ) as string;
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            const search = this.getNodeParameter('search', i, '') as string;
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/contacts',
              { address_book_id: addressBookId, search },
              returnAll,
              limit,
            );
          } else if (operation === 'create' || operation === 'update') {
            const addressBookId = this.getNodeParameter(
              'addressBookId',
              i,
            ) as string;
            const primaryPhone = this.getNodeParameter(
              'primaryPhone',
              i,
            ) as string;
            const additional = this.getNodeParameter(
              'additionalFields',
              i,
              {},
            ) as IDataObject;

            const payload: IDataObject = {
              address_book_id: addressBookId,
              phone_numbers: [
                {
                  phone_number: primaryPhone,
                  type: 'mobile',
                  is_primary: true,
                },
              ],
            };

            if (additional.first_name) payload.first_name = additional.first_name;
            if (additional.last_name) payload.last_name = additional.last_name;
            if (additional.company) payload.company = additional.company;
            if (additional.title) payload.title = additional.title;
            if (additional.notes) payload.notes = additional.notes;
            if (additional.country_code) {
              payload.country_code = additional.country_code;
            }
            if (additional.email) {
              payload.emails = [
                { email: additional.email, type: 'work', is_primary: true },
              ];
            }
            if (additional.tags) {
              payload.tags = splitList(String(additional.tags));
            }
            if (additional.custom_fields) {
              payload.custom_fields = parseJsonParam(
                additional.custom_fields,
                'Custom Fields (JSON)',
                this.getNode(),
              );
            }

            if (operation === 'create') {
              responseData = await firetellApiRequest.call(
                this,
                'POST',
                '/contacts',
                payload,
              );
            } else {
              const contactId = this.getNodeParameter('contactId', i) as string;
              responseData = await firetellApiRequest.call(
                this,
                'PUT',
                `/contacts/${encodeURIComponent(contactId)}`,
                payload,
              );
            }
          } else if (operation === 'delete') {
            const contactId = this.getNodeParameter('contactId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'DELETE',
              `/contacts/${encodeURIComponent(contactId)}`,
            );
          }
        }

        // ==================== ADDRESS BOOK ====================
        else if (resource === 'addressBook') {
          if (operation === 'getMany') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/address-books',
              {},
              returnAll,
              limit,
            );
          } else if (operation === 'get') {
            const id = this.getNodeParameter('addressBookId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/address-books/${encodeURIComponent(id)}`,
            );
          } else if (operation === 'create') {
            const title = this.getNodeParameter('title', i) as string;
            const additional = this.getNodeParameter(
              'additionalFields',
              i,
              {},
            ) as IDataObject;
            responseData = await firetellApiRequest.call(
              this,
              'POST',
              '/address-books',
              { ...additional, title },
            );
          } else if (operation === 'update') {
            const id = this.getNodeParameter('addressBookId', i) as string;
            const additional = this.getNodeParameter(
              'additionalFields',
              i,
              {},
            ) as IDataObject;
            responseData = await firetellApiRequest.call(
              this,
              'PUT',
              `/address-books/${encodeURIComponent(id)}`,
              additional,
            );
          } else if (operation === 'delete') {
            const id = this.getNodeParameter('addressBookId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'DELETE',
              `/address-books/${encodeURIComponent(id)}`,
            );
          }
        }

        // ==================== VOICE AI AGENT ====================
        else if (resource === 'voiceAgent') {
          if (operation === 'getMany') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/voice-agents',
              {},
              returnAll,
              limit,
            );
          } else if (operation === 'get') {
            const id = this.getNodeParameter('voiceAgentId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/voice-agents/${encodeURIComponent(id)}`,
            );
          } else if (operation === 'create') {
            const name = this.getNodeParameter('name', i) as string;
            const instructions = this.getNodeParameter(
              'instructions',
              i,
            ) as string;
            responseData = await firetellApiRequest.call(
              this,
              'POST',
              '/voice-agents',
              { name, instructions },
            );
          } else if (operation === 'update') {
            const id = this.getNodeParameter('voiceAgentId', i) as string;
            const name = this.getNodeParameter('name', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'PATCH',
              `/voice-agents/${encodeURIComponent(id)}`,
              { name },
            );
          } else if (operation === 'updateSettings') {
            const id = this.getNodeParameter('voiceAgentId', i) as string;
            const version = this.getNodeParameter('version', i) as number;
            const settings = this.getNodeParameter(
              'settingsFields',
              i,
              {},
            ) as IDataObject;
            const payload: IDataObject = { ...settings, version };
            if (typeof settings.knowledge_base_ids === 'string') {
              payload.knowledge_base_ids = splitList(
                settings.knowledge_base_ids,
              );
            }
            responseData = await firetellApiRequest.call(
              this,
              'PATCH',
              `/voice-agents/${encodeURIComponent(id)}/settings`,
              payload,
            );
          } else if (operation === 'publish') {
            const id = this.getNodeParameter('voiceAgentId', i) as string;
            const version = this.getNodeParameter('version', i) as number;
            responseData = await firetellApiRequest.call(
              this,
              'PATCH',
              `/voice-agents/${encodeURIComponent(id)}/publish`,
              { version },
            );
          }
        }

        // ==================== KNOWLEDGE BASE ====================
        else if (resource === 'knowledgeBase') {
          if (operation === 'getMany') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/knowledge-bases',
              {},
              returnAll,
              limit,
            );
          } else if (operation === 'get') {
            const id = this.getNodeParameter('knowledgeBaseId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/knowledge-bases/${encodeURIComponent(id)}`,
            );
          } else if (operation === 'create') {
            const name = this.getNodeParameter('name', i) as string;
            const description = this.getNodeParameter(
              'description',
              i,
              '',
            ) as string;
            const payload: IDataObject = { name };
            if (description) payload.description = description;
            responseData = await firetellApiRequest.call(
              this,
              'POST',
              '/knowledge-bases',
              payload,
            );
          } else if (operation === 'uploadDocument') {
            const kbId = this.getNodeParameter('knowledgeBaseId', i) as string;
            const binaryPropertyName = this.getNodeParameter(
              'binaryPropertyName',
              i,
            ) as string;
            const binaryData = this.helpers.assertBinaryData(
              i,
              binaryPropertyName,
            );
            const fileBuffer = await this.helpers.getBinaryDataBuffer(
              i,
              binaryPropertyName,
            );
            responseData = await firetellUploadFile.call(
              this,
              'POST',
              `/knowledge-bases/${encodeURIComponent(kbId)}/documents/upload`,
              fileBuffer,
              binaryData.fileName || 'document.pdf',
              binaryData.mimeType || 'application/octet-stream',
            );
          } else if (operation === 'crawlUrls') {
            const kbId = this.getNodeParameter('knowledgeBaseId', i) as string;
            const rawUrls = this.getNodeParameter('urls', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'POST',
              `/knowledge-bases/${encodeURIComponent(kbId)}/documents/crawl`,
              { urls: splitList(rawUrls) },
            );
          } else if (operation === 'recrawlDocument') {
            const kbId = this.getNodeParameter('knowledgeBaseId', i) as string;
            const docId = this.getNodeParameter('documentId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'POST',
              `/knowledge-bases/${encodeURIComponent(kbId)}/documents/${encodeURIComponent(docId)}/recrawl`,
            );
          } else if (operation === 'deleteDocument') {
            const kbId = this.getNodeParameter('knowledgeBaseId', i) as string;
            const docId = this.getNodeParameter('documentId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'DELETE',
              `/knowledge-bases/${encodeURIComponent(kbId)}/documents/${encodeURIComponent(docId)}`,
            );
          }
        }

        // ==================== PHONE NUMBER ====================
        else if (resource === 'phoneNumber') {
          if (operation === 'getMany') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/phone-numbers',
              {},
              returnAll,
              limit,
            );
          } else if (operation === 'get') {
            const id = this.getNodeParameter('phoneNumberId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/phone-numbers/${encodeURIComponent(id)}`,
            );
          } else if (operation === 'update') {
            const id = this.getNodeParameter('phoneNumberId', i) as string;
            const updateFields = this.getNodeParameter(
              'updateFields',
              i,
              {},
            ) as IDataObject;
            responseData = await firetellApiRequest.call(
              this,
              'PATCH',
              `/phone-numbers/${encodeURIComponent(id)}`,
              updateFields,
            );
          }
        }

        // ==================== AGENT ====================
        else if (resource === 'agent') {
          if (operation === 'getMany') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/agents',
              {},
              returnAll,
              limit,
            );
          } else if (operation === 'get') {
            const id = this.getNodeParameter('agentId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/agents/${encodeURIComponent(id)}`,
            );
          } else if (operation === 'create') {
            const username = this.getNodeParameter('username', i) as string;
            const password = this.getNodeParameter('password', i) as string;
            const display_name = this.getNodeParameter(
              'displayName',
              i,
            ) as string;
            const additional = this.getNodeParameter(
              'additionalFields',
              i,
              {},
            ) as IDataObject;
            responseData = await firetellApiRequest.call(
              this,
              'POST',
              '/agents',
              { ...additional, username, password, display_name },
            );
          } else if (operation === 'update') {
            const id = this.getNodeParameter('agentId', i) as string;
            const additional = this.getNodeParameter(
              'additionalFields',
              i,
              {},
            ) as IDataObject;
            responseData = await firetellApiRequest.call(
              this,
              'PATCH',
              `/agents/${encodeURIComponent(id)}`,
              additional,
            );
          } else if (operation === 'delete') {
            const id = this.getNodeParameter('agentId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'DELETE',
              `/agents/${encodeURIComponent(id)}`,
            );
          }
        }

        // ==================== TEAM ====================
        else if (resource === 'team') {
          if (operation === 'getMany') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll
              ? 100
              : (this.getNodeParameter('limit', i) as number);
            responseData = await firetellApiRequestAllItems.call(
              this,
              '/teams',
              {},
              returnAll,
              limit,
            );
          } else if (operation === 'get') {
            const id = this.getNodeParameter('teamId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'GET',
              `/teams/${encodeURIComponent(id)}`,
            );
          } else if (operation === 'create') {
            const title = this.getNodeParameter('title', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'POST',
              '/teams',
              { title },
            );
          } else if (operation === 'update') {
            const id = this.getNodeParameter('teamId', i) as string;
            const title = this.getNodeParameter('title', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'PATCH',
              `/teams/${encodeURIComponent(id)}`,
              { title },
            );
          } else if (operation === 'delete') {
            const id = this.getNodeParameter('teamId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'DELETE',
              `/teams/${encodeURIComponent(id)}`,
            );
          } else if (operation === 'addAgent') {
            const teamId = this.getNodeParameter('teamId', i) as string;
            const agentId = this.getNodeParameter('teamAgentId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'PUT',
              `/teams/${encodeURIComponent(teamId)}/agents/${encodeURIComponent(agentId)}`,
            );
          } else if (operation === 'removeAgent') {
            const teamId = this.getNodeParameter('teamId', i) as string;
            const agentId = this.getNodeParameter('teamAgentId', i) as string;
            responseData = await firetellApiRequest.call(
              this,
              'DELETE',
              `/teams/${encodeURIComponent(teamId)}/agents/${encodeURIComponent(agentId)}`,
            );
          }
        }

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData as IDataObject | IDataObject[]),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
