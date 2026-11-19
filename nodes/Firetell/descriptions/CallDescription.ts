import type { INodeProperties } from 'n8n-workflow';

export const callOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['call'] } },
    options: [
      {
        name: 'Get Events',
        value: 'getEvents',
        description: 'Get the execution event timeline for a call',
        action: 'Get call events',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        description: 'List Call Detail Records (CDR)',
        action: 'Get many calls',
      },
      {
        name: 'Get Recordings',
        value: 'getRecordings',
        description: 'List all recordings for a call with presigned URLs',
        action: 'Get call recordings',
      },
      {
        name: 'Get Transcription',
        value: 'getTranscription',
        description: 'Get transcription, dialogues, summary, and sentiment for a call',
        action: 'Get call transcription',
      },
      {
        name: 'Make Call',
        value: 'make',
        description: 'Initiate an outbound programmable API call',
        action: 'Make an outbound call',
      },
      {
        name: 'Send Actions',
        value: 'sendActions',
        description: 'Execute active call control actions (hangup, tts, play, transfer, etc.)',
        action: 'Send actions to an active call',
      },
    ],
    default: 'make',
  },
];

export const callFields: INodeProperties[] = [
  // Call ID for call-scoped operations
  {
    displayName: 'Call ID',
    name: 'callId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'call_01h900000000000000000001',
    displayOptions: {
      show: {
        resource: ['call'],
        operation: ['sendActions', 'getEvents', 'getRecordings', 'getTranscription'],
      },
    },
    description: 'The unique ID of the call',
  },

  // Make Call fields
  {
    displayName: 'To Number',
    name: 'toNumber',
    type: 'string',
    required: true,
    default: '',
    placeholder: '+14155552671',
    displayOptions: { show: { resource: ['call'], operation: ['make'] } },
    description: 'Destination phone number in E.164 format',
  },
  {
    displayName: 'Actions (JSON)',
    name: 'actionsJson',
    type: 'json',
    required: true,
    default: '[\n  {\n    "action": "tts",\n    "params": {\n      "text": "Hello from Firetell!"\n    }\n  }\n]',
    displayOptions: {
      show: { resource: ['call'], operation: ['make', 'sendActions'] },
    },
    description:
      'JSON array of call actions (e.g. play, tts, ivr, connect_voice_agent, connect_agent, connect_team, connect_sip, to_operator, recording, hangup)',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['call'], operation: ['make'] } },
    options: [
      {
        displayName: 'Call Flow ID',
        name: 'call_flow_id',
        type: 'string',
        default: '',
        description: 'Optional call flow ID to attach to this outbound call',
      },
      {
        displayName: 'From Name',
        name: 'fromName',
        type: 'string',
        default: '',
        description: 'Optional caller display name',
      },
      {
        displayName: 'From Number',
        name: 'fromNumber',
        type: 'string',
        default: '',
        placeholder: '+18005550199',
        description: 'Caller ID phone number owned by your workspace',
      },
      {
        displayName: 'Max Duration (Seconds)',
        name: 'max_duration',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: 7200 },
        default: 180,
        description: 'Maximum call duration safety limit in seconds (1 to 7200)',
      },
      {
        displayName: 'To Name',
        name: 'toName',
        type: 'string',
        default: '',
        description: 'Optional callee display name',
      },
    ],
  },

  // Get Many / Get Events pagination
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: { resource: ['call'], operation: ['getMany', 'getEvents'] },
    },
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
        resource: ['call'],
        operation: ['getMany', 'getEvents'],
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
    displayOptions: { show: { resource: ['call'], operation: ['getMany'] } },
    options: [
      {
        displayName: 'Direction',
        name: 'direction',
        type: 'options',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Inbound', value: 'inbound' },
          { name: 'Internal', value: 'internal' },
          { name: 'Outbound', value: 'outbound' },
        ],
        default: 'all',
      },
      {
        displayName: 'From',
        name: 'from',
        type: 'string',
        default: '',
        description: 'Filter by caller number or name',
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Sentiment',
        name: 'sentiment',
        type: 'options',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Negative', value: 'negative' },
          { name: 'Neutral', value: 'neutral' },
          { name: 'Positive', value: 'positive' },
        ],
        default: 'all',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'string',
        default: '',
        placeholder: 'completed',
        description:
          'Filter by call status (answered, active, completed, failed, busy, no_answer, created, queued)',
      },
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        description: 'Filter by callee number or name',
      },
    ],
  },
];
