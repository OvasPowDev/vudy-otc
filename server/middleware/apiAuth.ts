import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  apiKeyUserId?: string;
}

export async function validateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  // Validate API key format
  if (!apiKey.startsWith('vdy_')) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  try {
    // Hash the provided key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Look up the key in the database
    const apiKeyRecord = await storage.getApiKeyByHash(keyHash);

    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await storage.updateApiKeyLastUsed(apiKeyRecord.id);

    // Attach user ID to request
    req.apiKeyUserId = apiKeyRecord.userId;

    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
