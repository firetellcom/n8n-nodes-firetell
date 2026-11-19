import type { INodeProperties } from 'n8n-workflow';

export const teamOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['team'] } },
    options: [
      { name: 'Add Agent', value: 'addAgent', action: 'Add an agent to a team' },
      { name: 'Create', value: 'create', action: 'Create a team' },
      { name: 'Delete', value: 'delete', action: 'Delete a team' },
      { name: 'Get', value: 'get', action: 'Get a team' },
      { name: 'Get Many', value: 'getMany', action: 'Get many teams' },
      {
        name: 'Remove Agent',
        value: 'removeAgent',
        action: 'Remove an agent from a team',
      },
      { name: 'Update', value: 'update', action: 'Update a team' },
    ],
    default: 'getMany',
  },
];

export const teamFields: INodeProperties[] = [
  {
    displayName: 'Team Name or ID',
    name: 'teamId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getTeams' },
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['team'],
        operation: ['get', 'update', 'delete', 'addAgent', 'removeAgent'],
      },
    },
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
  },
  {
    displayName: 'Agent Name or ID',
    name: 'teamAgentId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getAgents' },
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['team'], operation: ['addAgent', 'removeAgent'] },
    },
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
  },
  {
    displayName: 'Title',
    name: 'title',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['team'], operation: ['create', 'update'] },
    },
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: { show: { resource: ['team'], operation: ['getMany'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 100 },
    default: 20,
    displayOptions: {
      show: {
        resource: ['team'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
  },
];
