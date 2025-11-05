import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { 
  insertBankAccountSchema, insertTransactionSchema, insertWalletSchema, insertOtcOfferSchema 
} from "@shared/schema";

const VUDY_API_BASE = "https://api-stg.vudy.app/v1/auth";

export function registerRoutes(app: Express) {
  // Auth routes (from Supabase Edge Functions)
  app.post("/api/auth/check-user", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const vudyApiKey = process.env.VUDY_API_KEY;
      if (!vudyApiKey) {
        console.error('VUDY_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
      }

      const response = await fetch(`${VUDY_API_BASE}/check-user`, {
        method: 'POST',
        headers: {
          'x-api-key': vudyApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vudy API error:', errorText);
        return res.status(200).json({ exists: false });
      }

      const data = await response.json() as any;
      return res.json({ exists: data.exists || false });
    } catch (error) {
      console.error('Error in auth-check-user:', error);
      return res.status(500).json({ error: 'Internal server error', exists: false });
    }
  });

  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { email, language } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const vudyApiKey = process.env.VUDY_API_KEY;
      if (!vudyApiKey) {
        console.error('VUDY_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
      }

      const response = await fetch(`${VUDY_API_BASE}/send-otp`, {
        method: 'POST',
        headers: {
          'x-api-key': vudyApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          language: language || 'en',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vudy API error:', errorText);
        return res.status(response.status).json({ error: 'Failed to send OTP', details: errorText });
      }

      const data = await response.json() as any;
      return res.json({ 
        success: data.success || false, 
        otpId: data.data?.otpId,
        identifier: data.data?.identifier,
        profiles: data.data?.profiles || []
      });
    } catch (error) {
      console.error('Error in auth-send-otp:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { otp, otpId, email, identifier, profileId } = req.body;
      
      if (!otp || !otpId || !email || !identifier) {
        return res.status(400).json({ error: 'OTP, otpId, email, and identifier are required' });
      }

      const vudyApiKey = process.env.VUDY_API_KEY;
      if (!vudyApiKey) {
        console.error('VUDY_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
      }

      const response = await fetch(`${VUDY_API_BASE}/verify-otp`, {
        method: 'POST',
        headers: {
          'x-api-key': vudyApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          otpId,
          identifier,
          ...(profileId && { profileId })
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vudy API error:', errorText);
        return res.status(response.status).json({ error: 'Invalid or expired OTP', details: errorText });
      }

      const data = await response.json() as any;
      return res.json({ 
        success: data.success || false, 
        sessionToken: data.data?.session,
        data 
      });
    } catch (error) {
      console.error('Error in auth-verify-otp:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/auth/onboard", async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName, username, country } = req.body;
      
      if (!email || !firstName || !lastName || !username || !country) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const vudyApiKey = process.env.VUDY_API_KEY;
      if (!vudyApiKey) {
        console.error('VUDY_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
      }

      const response = await fetch(`${VUDY_API_BASE}/onboard`, {
        method: 'POST',
        headers: {
          'x-api-key': vudyApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          username,
          country,
          isBusiness: false,
          termsOfService: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vudy API error:', errorText);
        return res.status(response.status).json({ error: 'Failed to onboard user', details: errorText });
      }

      const data = await response.json() as any;
      return res.json({ success: true, data });
    } catch (error) {
      console.error('Error in auth-onboard:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Profiles
  app.post("/api/profiles/get-or-create", async (req: Request, res: Response) => {
    const { email, firstName, lastName, country } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let profile = await storage.getProfileByEmail(email);
    
    if (!profile) {
      profile = await storage.createProfile({
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        country: country || null,
        phone: null,
      });
    }
    
    return res.json(profile);
  });

  app.get("/api/profiles/:id", async (req: Request, res: Response) => {
    const profile = await storage.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.json(profile);
  });

  app.patch("/api/profiles/:id", async (req: Request, res: Response) => {
    const profile = await storage.updateProfile(req.params.id, req.body);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.json(profile);
  });

  // Bank Accounts
  app.get("/api/bank-accounts", async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const accounts = await storage.getBankAccounts(userId);
    return res.json(accounts);
  });

  app.post("/api/bank-accounts", async (req: Request, res: Response) => {
    const validated = insertBankAccountSchema.parse(req.body);
    const account = await storage.createBankAccount(validated);
    return res.json(account);
  });

  app.delete("/api/bank-accounts/:id", async (req: Request, res: Response) => {
    await storage.deleteBankAccount(req.params.id);
    return res.json({ success: true });
  });

  // Notifications
  app.get("/api/notifications", async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const notifications = await storage.getNotifications(userId);
    return res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    await storage.markNotificationAsRead(req.params.id);
    return res.json({ success: true });
  });

  app.post("/api/notifications/mark-all-read", async (req: Request, res: Response) => {
    const userId = req.body.userId as string;
    await storage.markAllNotificationsAsRead(userId);
    return res.json({ success: true });
  });

  // Transactions
  app.get("/api/transactions", async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const datePreset = req.query.datePreset as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    
    let transactions = await storage.getTransactions(userId);
    
    // Apply type filter
    if (type && type !== 'all') {
      transactions = transactions.filter((t: any) => {
        if (type === 'buy') return t.type === 'buy';
        if (type === 'sell') return t.type === 'sell';
        return true;
      });
    }
    
    // Apply status filter
    if (status && status !== 'all') {
      transactions = transactions.filter((t: any) => t.status === status);
    }
    
    // Apply date filter
    if (datePreset && datePreset !== 'range') {
      const now = new Date();
      let startDate: Date;
      
      switch (datePreset) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'this_week':
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek;
          startDate = new Date(now.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      transactions = transactions.filter((t: any) => 
        new Date(t.createdAt) >= startDate
      );
    }
    
    // Apply custom range filter
    if (datePreset === 'range' && from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      
      transactions = transactions.filter((t: any) => {
        const txDate = new Date(t.createdAt);
        return txDate >= fromDate && txDate <= toDate;
      });
    }
    
    return res.json(transactions);
  });

  app.get("/api/transactions/:id", async (req: Request, res: Response) => {
    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    return res.json(transaction);
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    const validated = insertTransactionSchema.parse(req.body);
    const transaction = await storage.createTransaction(validated);
    return res.json(transaction);
  });

  app.patch("/api/transactions/:id", async (req: Request, res: Response) => {
    const transaction = await storage.updateTransaction(req.params.id, req.body);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    return res.json(transaction);
  });

  // Wallets
  app.get("/api/wallets", async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const wallets = await storage.getWallets(userId);
    return res.json(wallets);
  });

  app.post("/api/wallets", async (req: Request, res: Response) => {
    const validated = insertWalletSchema.parse(req.body);
    const wallet = await storage.createWallet(validated);
    return res.json(wallet);
  });

  app.delete("/api/wallets/:id", async (req: Request, res: Response) => {
    await storage.deleteWallet(req.params.id);
    return res.json({ success: true });
  });

  // OTC Offers
  app.get("/api/offers/transaction/:transactionId", async (req: Request, res: Response) => {
    const offers = await storage.getOffersForTransaction(req.params.transactionId);
    return res.json(offers);
  });

  app.post("/api/offers", async (req: Request, res: Response) => {
    const validated = insertOtcOfferSchema.parse(req.body);
    const offer = await storage.createOtcOffer(validated);
    return res.json(offer);
  });
}
