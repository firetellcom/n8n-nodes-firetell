import type { INodeProperties } from 'n8n-workflow';

export const addressBookOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['addressBook'] } },
    options: [
      {
        name: 'Create',
        value: 'create',
        action: 'Create an address book',
      },
      {
        name: 'Delete',
        value: 'delete',
        action: 'Delete an address book',
      },
      {
        name: 'Get',
        value: 'get',
        action: 'Get an address book',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many address books',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update an address book',
      },
    ],
    default: 'getMany',
  },
];

export const addressBookFields: INodeProperties[] = [
  {
    displayName: 'Address Book ID',
    name: 'addressBookId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['addressBook'],
        operation: ['get', 'update', 'delete'],
      },
    },
  },
  {
    displayName: 'Title',
    name: 'title',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['addressBook'], operation: ['create'] },
    },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['addressBook'], operation: ['create', 'update'] },
    },
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Owner ID',
        name: 'owner_id',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Owner Type',
        name: 'owner_type',
        type: 'options',
        options: [
          { name: 'Agent', value: 'agent' },
          { name: 'Everyone', value: 'everyone' },
          { name: 'Team', value: 'team' },
        ],
        default: 'everyone',
      },
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        description: 'New title (for Update)',
      },
    ],
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: { resource: ['addressBook'], operation: ['getMany'] },
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
        resource: ['addressBook'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
  },
];
