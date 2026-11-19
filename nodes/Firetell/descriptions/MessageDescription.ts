import type { INodeProperties } from 'n8n-workflow';

export const messageOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['message'] } },
    options: [
      {
        name: 'Get',
        value: 'get',
        description: 'Get SMS/MMS message details by ID',
        action: 'Get a message',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        description: 'List SMS/MMS message history',
        action: 'Get many messages',
      },
      {
        name: 'Send',
        value: 'send',
        description: 'Send an SMS or MMS message',
        action: 'Send an SMS or MMS message',
      },
    ],
    default: 'send',
  },
];

export const messageFields: INodeProperties[] = [
  {
    displayName: 'Message ID',
    name: 'messageId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['message'], operation: ['get'] } },
    description: 'The unique ID of the message',
  },

  // Send fields
  {
    displayName: 'From Phone Number',
    name: 'from',
    type: 'string',
    required: true,
    default: '',
    placeholder: '+15551234567',
    displayOptions: { show: { resource: ['message'], operation: ['send'] } },
    description:
      'Sender phone number in E.164 format owned by your workspace (must have SMS capability)',
  },
  {
    displayName: 'To Phone Number',
    name: 'to',
    type: 'string',
    required: true,
    default: '',
    placeholder: '+15559876543',
    displayOptions: { show: { resource: ['message'], operation: ['send'] } },
    description: 'Destination phone number in E.164 format',
  },
  {
    displayName: 'Body',
    name: 'body',
    type: 'string',
    typeOptions: { rows: 4 },
    required: true,
    default: '',
    displayOptions: { show: { resource: ['message'], operation: ['send'] } },
    description: 'Text content of the SMS/MMS message (max 1600 characters)',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['message'], operation: ['send'] } },
    options: [
      {
        displayName: 'Conversation ID',
        name: 'conversation_id',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Media URLs (Comma-Separated)',
        name: 'media_urls',
        type: 'string',
        default: '',
        placeholder: 'https://example.com/image.png',
        description: 'Optional comma-separated media URLs for MMS',
      },
      {
        displayName: 'Sender ID',
        name: 'sender_id',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Sender Type',
        name: 'sender_type',
        type: 'options',
        options: [
          { name: 'Agent', value: 'agent' },
          { name: 'Client', value: 'client' },
          { name: 'System', value: 'system' },
          { name: 'Voice Agent', value: 'voice_agent' },
        ],
        default: 'system',
      },
    ],
  },

  // Get Many pagination & filters
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: { show: { resource: ['message'], operation: ['getMany'] } },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 100 },
    default: 20,
    displayOptions: {
      show: {
        resource: ['message'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: { show: { resource: ['message'], operation: ['getMany'] } },
    options: [
      {
        displayName: 'Direction',
        name: 'direction',
        type: 'options',
        options: [
          { name: 'Inbound', value: 'inbound' },
          { name: 'Outbound', value: 'outbound' },
        ],
        default: 'outbound',
      },
      {
        displayName: 'From Date (ISO 8601)',
        name: 'from',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Phone Number ID',
        name: 'phone_number_id',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Delivered', value: 'delivered' },
          { name: 'Failed', value: 'failed' },
          { name: 'Queued', value: 'queued' },
          { name: 'Received', value: 'received' },
          { name: 'Sending', value: 'sending' },
          { name: 'Sent', value: 'sent' },
          { name: 'Undelivered', value: 'undelivered' },
        ],
        default: 'delivered',
      },
      {
        displayName: 'To Date (ISO 8601)',
        name: 'to_date',
        type: 'string',
        default: '',
      },
    ],
  },
];
