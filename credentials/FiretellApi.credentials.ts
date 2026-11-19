import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class FiretellApi implements ICredentialType {
  name = 'firetellApi';
  displayName = 'Firetell API';
  documentationUrl =
    'https://firetell.com/docs/developers/getting-started/authentication';

  properties: INodeProperties[] = [
    {
      displayName: 'Workspace Domain',
      name: 'domain',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'yourcompany.firetell.app',
      description:
        'Your Firetell workspace domain (e.g. yourcompany.firetell.app or https://yourcompany.firetell.app)',
    },
    {
      displayName: 'API Secret Key',
      name: 'secretKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      placeholder: 'sk-...',
      description:
        'Workspace API Secret Key generated in Firetell Console (sent as Authorization: ApiKey <secretKey>)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=ApiKey {{$credentials.secretKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL:
        '={{$credentials.domain.trim().replace(/\\/+$/, "").startsWith("http") ? $credentials.domain.trim().replace(/\\/+$/, "") : "https://" + $credentials.domain.trim().replace(/\\/+$/, "")}}',
      url: '/api/v1',
      method: 'GET',
    },
  };
}
