import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vudy OTC Hub API',
      version: '1.0.0',
      description: 'Internal OTC platform API for managing cryptocurrency transactions. Traders create offers, assign them, move to escrow, and settle transactions.',
      contact: {
        name: 'Vudy OTC Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for external integrations. Format: vdy_xxxxxxxx...',
        },
      },
      schemas: {
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['buy', 'sell'] },
            direction: { type: 'string' },
            chain: { type: 'string' },
            token: { type: 'string' },
            amountValue: { type: 'string' },
            amountCurrency: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'escrow', 'completed', 'failed'] },
            clientAlias: { type: 'string' },
            clientKycUrl: { type: 'string' },
            clientNotes: { type: 'string' },
            requestOrigin: { type: 'string', enum: ['whatsapp', 'api', 'form', 'manual'] },
            slaMinutes: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        OtcOffer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            transactionId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            amountValue: { type: 'string' },
            amountCurrency: { type: 'string' },
            etaMinutes: { type: 'integer' },
            notes: { type: 'string' },
            status: { type: 'string', enum: ['open', 'won', 'lost'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            keyPrefix: { type: 'string' },
            isActive: { type: 'boolean' },
            lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      {
        name: 'External API',
        description: 'Endpoints for external systems to create transactions (requires API key)',
      },
      {
        name: 'Transactions',
        description: 'Internal transaction management',
      },
      {
        name: 'Offers',
        description: 'OTC offer management',
      },
      {
        name: 'API Keys',
        description: 'API key management for external integrations',
      },
      {
        name: 'Profiles',
        description: 'User profile management',
      },
      {
        name: 'Bank Accounts',
        description: 'Bank account management',
      },
      {
        name: 'Wallets',
        description: 'Crypto wallet management',
      },
    ],
  },
  apis: ['./server/routes.ts', './server/externalRoutes.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
