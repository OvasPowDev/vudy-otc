import { Request, Response, Express } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { validateApiKey, AuthenticatedRequest } from './middleware/apiAuth';
import { broadcast } from './index';

const externalTransactionSchema = z.object({
  type: z.enum(['FTC', 'CTF']),
  clientAlias: z.string(),
  clientKycUrl: z.string().url().optional(),
  clientNotes: z.string().optional(),
  requestOrigin: z.enum(['whatsapp', 'api', 'form', 'manual']),
  slaMinutes: z.number().int().positive().optional(),
  internalNotes: z.string().optional(),
  
  // FTC specific fields
  ftc: z.object({
    montoFiat: z.number().positive(),
    monedaFiat: z.enum(['USD', 'GTQ', 'MXN', 'EUR', 'VES', 'COP', 'ARS']),
    cadenaDestino: z.string(),
    tokenDestino: z.string(),
    walletDestinoCliente: z.string(),
  }).optional(),
  
  // CTF specific fields
  ctf: z.object({
    cadenaOrigen: z.string(),
    tokenOrigen: z.string(),
    montoCrypto: z.number().positive(),
    cuentaFiatDestinoCliente: z.object({
      banco: z.string(),
      numeroCuenta: z.string(),
      titular: z.string(),
      moneda: z.enum(['USD', 'GTQ', 'MXN', 'EUR', 'VES', 'COP', 'ARS']),
    }),
  }).optional(),
}).refine(data => {
  if (data.type === 'FTC') return !!data.ftc;
  if (data.type === 'CTF') return !!data.ctf;
  return false;
}, {
  message: 'Transaction must include either ftc or ctf data based on type'
});

export function registerExternalRoutes(app: Express) {
  /**
   * @swagger
   * /api/external/transactions:
   *   post:
   *     summary: Create a new OTC transaction (External API)
   *     description: Creates a new transaction in the OTC system. This endpoint is protected with API key authentication.
   *     tags:
   *       - External API
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - clientAlias
   *               - requestOrigin
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [FTC, CTF]
   *                 description: Transaction type - FTC (Fiat to Crypto) or CTF (Crypto to Fiat)
   *               clientAlias:
   *                 type: string
   *                 description: Client identifier/alias
   *               clientKycUrl:
   *                 type: string
   *                 format: uri
   *                 description: URL to client's KYC document (PDF)
   *               clientNotes:
   *                 type: string
   *                 description: Notes from the client
   *               requestOrigin:
   *                 type: string
   *                 enum: [whatsapp, api, form, manual]
   *                 description: Origin of the transaction request
   *               slaMinutes:
   *                 type: integer
   *                 description: SLA in minutes for completing the transaction
   *               internalNotes:
   *                 type: string
   *                 description: Internal notes for OTC operators
   *               ftc:
   *                 type: object
   *                 description: Required if type is FTC
   *                 properties:
   *                   montoFiat:
   *                     type: number
   *                     description: Amount in fiat currency
   *                   monedaFiat:
   *                     type: string
   *                     enum: [USD, GTQ, MXN, EUR, VES, COP, ARS]
   *                   cadenaDestino:
   *                     type: string
   *                     description: Destination blockchain (e.g., Algorand, Ethereum)
   *                   tokenDestino:
   *                     type: string
   *                     description: Destination token (e.g., USDC, USDT)
   *                   walletDestinoCliente:
   *                     type: string
   *                     description: Client's wallet address to receive crypto
   *               ctf:
   *                 type: object
   *                 description: Required if type is CTF
   *                 properties:
   *                   cadenaOrigen:
   *                     type: string
   *                     description: Source blockchain
   *                   tokenOrigen:
   *                     type: string
   *                     description: Source token
   *                   montoCrypto:
   *                     type: number
   *                     description: Amount in cryptocurrency
   *                   cuentaFiatDestinoCliente:
   *                     type: object
   *                     properties:
   *                       banco:
   *                         type: string
   *                       numeroCuenta:
   *                         type: string
   *                       titular:
   *                         type: string
   *                       moneda:
   *                         type: string
   *                         enum: [USD, GTQ, MXN, EUR, VES, COP, ARS]
   *     responses:
   *       201:
   *         description: Transaction created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                 code:
   *                   type: string
   *                 status:
   *                   type: string
   *                   enum: [pending, escrow, completed, failed]
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Invalid or missing API key
   */
  app.post("/api/external/transactions", validateApiKey, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validated = externalTransactionSchema.parse(req.body);
      const userId = req.apiKeyUserId!;
      
      // Generate unique transaction code
      const code = `TX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      let transactionData: any;
      
      if (validated.type === 'FTC') {
        transactionData = {
          code,
          userId,
          type: 'buy' as const,
          direction: 'fiat_to_crypto',
          chain: validated.ftc!.cadenaDestino,
          token: validated.ftc!.tokenDestino,
          amountValue: String(validated.ftc!.montoFiat),
          amountCurrency: validated.ftc!.monedaFiat,
          bankAccountId: 'external',
          walletAddress: validated.ftc!.walletDestinoCliente,
          status: 'pending' as const,
          clientAlias: validated.clientAlias,
          clientKycUrl: validated.clientKycUrl,
          clientNotes: validated.clientNotes,
          requestOrigin: validated.requestOrigin,
          internalNotes: validated.internalNotes,
          slaMinutes: validated.slaMinutes,
        };
      } else {
        transactionData = {
          code,
          userId,
          type: 'sell' as const,
          direction: 'crypto_to_fiat',
          chain: validated.ctf!.cadenaOrigen,
          token: validated.ctf!.tokenOrigen,
          amountValue: String(validated.ctf!.montoCrypto),
          amountCurrency: validated.ctf!.cuentaFiatDestinoCliente.moneda,
          bankAccountId: 'external',
          walletAddress: 'client-wallet',
          status: 'pending' as const,
          clientAlias: validated.clientAlias,
          clientKycUrl: validated.clientKycUrl,
          clientNotes: validated.clientNotes,
          requestOrigin: validated.requestOrigin,
          internalNotes: validated.internalNotes,
          slaMinutes: validated.slaMinutes,
        };
      }
      
      const transaction = await storage.createTransaction(transactionData);
      
      // Broadcast transaction created event to SSE clients for real-time kanban updates
      broadcast('tx.created', transaction);
      
      return res.status(201).json({
        id: transaction.id,
        code: transaction.code,
        status: transaction.status,
        type: validated.type,
        createdAt: transaction.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error creating external transaction:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}
