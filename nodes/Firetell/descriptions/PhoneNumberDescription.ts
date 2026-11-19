import type { INodeProperties } from 'n8n-workflow';

export const phoneNumberOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['phoneNumber'] } },
    options: [
      {
        name: 'Get',
        value: 'get',
        action: 'Get a phone number',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many phone numbers',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update phone number routing, call flow, or recording settings',
        action: 'Update a phone number',
      },
    ],
    default: 'getMany',
  },
];

export const phoneNumberFields: INodeProperties[] = [
  {
    displayName: 'Phone Number Name or ID',
    name: 'phoneNumberId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getPhoneNumbers' },
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['phoneNumber'], operation: ['get', 'update'] },
    },
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['phoneNumber'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'Call Flow ID',
        name: 'call_flow_id',
        type: 'string',
        default: '',
        description: 'Call Flow ID to handle inbound calls on this number',
      },
      {
        displayName: 'Enable Outbound',
        name: 'enable_outbound',
        type: 'boolean',
        default: true,
      },
      {
        displayName: 'Record Outbound',
        name: 'record_outbound',
        type: 'boolean',
        default: false,
      },
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
      },
    ],
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: { resource: ['phoneNumber'], operation: ['getMany'] },
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
        resource: ['phoneNumber'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
  },
];
