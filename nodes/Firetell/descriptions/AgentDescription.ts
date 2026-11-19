import type { INodeProperties } from 'n8n-workflow';

export const agentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['agent'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create an agent' },
      { name: 'Delete', value: 'delete', action: 'Delete an agent' },
      { name: 'Get', value: 'get', action: 'Get an agent' },
      { name: 'Get Many', value: 'getMany', action: 'Get many agents' },
      { name: 'Update', value: 'update', action: 'Update an agent' },
    ],
    default: 'getMany',
  },
];

export const agentFields: INodeProperties[] = [
  {
    displayName: 'Agent Name or ID',
    name: 'agentId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getAgents' },
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['agent'], operation: ['get', 'update', 'delete'] },
    },
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
  },
  {
    displayName: 'Username',
    name: 'username',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'agentjohn',
    displayOptions: { show: { resource: ['agent'], operation: ['create'] } },
    description: 'Lowercase letters and numbers, starting with a letter',
  },
  {
    displayName: 'Password',
    name: 'password',
    type: 'string',
    typeOptions: { password: true },
    required: true,
    default: '',
    displayOptions: { show: { resource: ['agent'], operation: ['create'] } },
  },
  {
    displayName: 'Display Name',
    name: 'displayName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'John Doe',
    displayOptions: { show: { resource: ['agent'], operation: ['create'] } },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['agent'], operation: ['create', 'update'] },
    },
    options: [
      {
        displayName: 'Country Code',
        name: 'country_code',
        type: 'string',
        default: '',
        placeholder: 'US',
      },
      {
        displayName: 'Display Name',
        name: 'display_name',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'john@company.com',
        default: '',
      },
      {
        displayName: 'Is Active',
        name: 'is_active',
        type: 'boolean',
        default: true,
      },
      {
        displayName: 'Role',
        name: 'role',
        type: 'options',
        options: [
          { name: 'Leader', value: 'leader' },
          { name: 'Member', value: 'member' },
          { name: 'Supervisor', value: 'supervisor' },
        ],
        default: 'member',
      },
    ],
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: { show: { resource: ['agent'], operation: ['getMany'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 100 },
    default: 20,
    displayOptions: {
      show: {
        resource: ['agent'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
  },
];
