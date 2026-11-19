import type { INodeProperties } from 'n8n-workflow';

export const contactOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['contact'] } },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new contact',
        action: 'Create a contact',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a contact by ID',
        action: 'Delete a contact',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get contact details by ID',
        action: 'Get a contact',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        description: 'List contacts in an address book',
        action: 'Get many contacts',
      },
      {
        name: 'Lookup by Phone',
        value: 'lookup',
        description: 'Lookup a contact by phone number',
        action: 'Lookup contact by phone number',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update contact details',
        action: 'Update a contact',
      },
    ],
    default: 'lookup',
  },
];

export const contactFields: INodeProperties[] = [
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['get', 'update', 'delete'] },
    },
  },
  {
    displayName: 'Phone Number',
    name: 'lookupNumber',
    type: 'string',
    required: true,
    default: '',
    placeholder: '+14155551234',
    displayOptions: { show: { resource: ['contact'], operation: ['lookup'] } },
    description: 'Phone number to lookup',
  },
  {
    displayName: 'Address Book Name or ID',
    name: 'addressBookId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getAddressBooks' },
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['create', 'update', 'getMany'],
      },
    },
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
  },
  {
    displayName: 'Primary Phone Number',
    name: 'primaryPhone',
    type: 'string',
    required: true,
    default: '',
    placeholder: '+14155551234',
    displayOptions: {
      show: { resource: ['contact'], operation: ['create', 'update'] },
    },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['contact'], operation: ['create', 'update'] },
    },
    options: [
      {
        displayName: 'Company',
        name: 'company',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Country Code',
        name: 'country_code',
        type: 'string',
        default: '',
        placeholder: 'US',
      },
      {
        displayName: 'Custom Fields (JSON)',
        name: 'custom_fields',
        type: 'json',
        default: '{}',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'alice@example.com',
        default: '',
      },
      {
        displayName: 'First Name',
        name: 'first_name',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Last Name',
        name: 'last_name',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Notes',
        name: 'notes',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
      },
      {
        displayName: 'Tags (Comma-Separated)',
        name: 'tags',
        type: 'string',
        default: '',
        placeholder: 'vip, enterprise',
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
    displayOptions: { show: { resource: ['contact'], operation: ['getMany'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 100 },
    default: 20,
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
  },
  {
    displayName: 'Search',
    name: 'search',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['contact'], operation: ['getMany'] } },
  },
];
