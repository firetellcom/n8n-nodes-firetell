import type { INodeProperties } from 'n8n-workflow';

export const knowledgeBaseOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['knowledgeBase'] } },
    options: [
      {
        name: 'Crawl URLs',
        value: 'crawlUrls',
        description: 'Crawl web URLs into a Knowledge Base',
        action: 'Crawl URLs into a Knowledge Base',
      },
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new Knowledge Base',
        action: 'Create a Knowledge Base',
      },
      {
        name: 'Delete Document',
        value: 'deleteDocument',
        description: 'Delete a document from a Knowledge Base',
        action: 'Delete a document from a Knowledge Base',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get Knowledge Base details',
        action: 'Get a Knowledge Base',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        description: 'List Knowledge Bases',
        action: 'Get many Knowledge Bases',
      },
      {
        name: 'Recrawl Document',
        value: 'recrawlDocument',
        description: 'Re-crawl and re-index a URL document',
        action: 'Recrawl a Knowledge Base document',
      },
      {
        name: 'Upload Document',
        value: 'uploadDocument',
        description: 'Upload a binary file (PDF, DOCX, XLSX, TXT) to a Knowledge Base',
        action: 'Upload a document to a Knowledge Base',
      },
    ],
    default: 'getMany',
  },
];

export const knowledgeBaseFields: INodeProperties[] = [
  {
    displayName: 'Knowledge Base Name or ID',
    name: 'knowledgeBaseId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getKnowledgeBases' },
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['knowledgeBase'],
        operation: [
          'get',
          'uploadDocument',
          'crawlUrls',
          'recrawlDocument',
          'deleteDocument',
        ],
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
      show: { resource: ['knowledgeBase'], operation: ['create'] },
    },
  },
  {
    displayName: 'Description',
    name: 'description',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['knowledgeBase'], operation: ['create'] },
    },
  },
  {
    displayName: 'Input Binary Field',
    name: 'binaryPropertyName',
    type: 'string',
    required: true,
    default: 'data',
    displayOptions: {
      show: { resource: ['knowledgeBase'], operation: ['uploadDocument'] },
    },
    description: 'Name of the binary property containing the file to upload',
  },
  {
    displayName: 'URLs (Comma-Separated or Newline-Separated)',
    name: 'urls',
    type: 'string',
    typeOptions: { rows: 4 },
    required: true,
    default: '',
    placeholder: 'https://example.com/pricing\nhttps://example.com/faq',
    displayOptions: {
      show: { resource: ['knowledgeBase'], operation: ['crawlUrls'] },
    },
    description: 'List of URLs to crawl and ingest (1 to 100 URLs)',
  },
  {
    displayName: 'Document ID',
    name: 'documentId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['knowledgeBase'],
        operation: ['recrawlDocument', 'deleteDocument'],
      },
    },
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: { resource: ['knowledgeBase'], operation: ['getMany'] },
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
        resource: ['knowledgeBase'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
  },
];
