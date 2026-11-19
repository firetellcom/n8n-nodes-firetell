import type { INodeProperties } from 'n8n-workflow';

export const voiceAgentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['voiceAgent'] } },
    options: [
      {
        name: 'Create',
        value: 'create',
        action: 'Create a Voice AI agent',
      },
      {
        name: 'Get',
        value: 'get',
        action: 'Get a Voice AI agent',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many Voice AI agents',
      },
      {
        name: 'Publish Version',
        value: 'publish',
        action: 'Publish a Voice AI agent version',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a Voice AI agent',
      },
      {
        name: 'Update Settings',
        value: 'updateSettings',
        action: 'Update Voice AI agent settings',
      },
    ],
    default: 'getMany',
  },
];

export const voiceAgentFields: INodeProperties[] = [
  {
    displayName: 'Voice Agent Name or ID',
    name: 'voiceAgentId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getVoiceAgents' },
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['voiceAgent'],
        operation: ['get', 'update', 'updateSettings', 'publish'],
      },
    },
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['voiceAgent'], operation: ['create', 'update'] },
    },
  },
  {
    displayName: 'Instructions',
    name: 'instructions',
    type: 'string',
    typeOptions: { rows: 5 },
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['voiceAgent'], operation: ['create'] },
    },
    description: 'System prompt and persona instructions for the Voice AI agent',
  },
  {
    displayName: 'Version',
    name: 'version',
    type: 'number',
    typeOptions: { minValue: 1 },
    required: true,
    default: 1,
    displayOptions: {
      show: {
        resource: ['voiceAgent'],
        operation: ['updateSettings', 'publish'],
      },
    },
  },
  {
    displayName: 'Settings',
    name: 'settingsFields',
    type: 'collection',
    placeholder: 'Add Setting',
    default: {},
    displayOptions: {
      show: { resource: ['voiceAgent'], operation: ['updateSettings'] },
    },
    options: [
      {
        displayName: 'Enable Conversation Memory',
        name: 'enable_conversation_memory',
        type: 'boolean',
        default: false,
      },
      {
        displayName: 'Enable Noise Reduction',
        name: 'enable_noise_reduction',
        type: 'boolean',
        default: true,
      },
      {
        displayName: 'Enable Recording',
        name: 'enable_recording',
        type: 'boolean',
        default: false,
      },
      {
        displayName: 'Greeting Message',
        name: 'greeting_message',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Instructions',
        name: 'instructions',
        type: 'string',
        typeOptions: { rows: 5 },
        default: '',
      },
      {
        displayName: 'Knowledge Base IDs (Comma-Separated)',
        name: 'knowledge_base_ids',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Language',
        name: 'language',
        type: 'string',
        default: 'en',
        placeholder: 'en, vi, ja',
      },
      {
        displayName: 'Max Call Duration (Seconds)',
        name: 'max_call_duration_seconds',
        type: 'number',
        typeOptions: { minValue: 0, maxValue: 1800 },
        default: 180,
      },
      {
        displayName: 'Model ID',
        name: 'model_id',
        type: 'string',
        default: '',
        placeholder: 'gemini-3.1-flash-live-preview',
      },
      {
        displayName: 'Provider',
        name: 'provider',
        type: 'options',
        options: [
          { name: 'Gemini', value: 'gemini' },
          { name: 'OpenAI', value: 'openai' },
        ],
        default: 'gemini',
      },
      {
        displayName: 'Speed',
        name: 'speed',
        type: 'number',
        typeOptions: { minValue: 0.5, maxValue: 2, numberPrecision: 2 },
        default: 1,
      },
      {
        displayName: 'Temperature',
        name: 'temperature',
        type: 'number',
        typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
        default: 0.8,
      },
      {
        displayName: 'Voice ID',
        name: 'voice_id',
        type: 'string',
        default: '',
        placeholder: 'Aoede',
      },
    ],
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: { resource: ['voiceAgent'], operation: ['getMany'] },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 100 },
    default: 20,
    displayOptions: {
      show: {
        resource: ['voiceAgent'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
  },
];
