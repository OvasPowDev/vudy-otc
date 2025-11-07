import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { 
  insertBankAccountSchema, insertTransactionSchema, insertWalletSchema, insertOtcOfferSchema 
} from "@shared/schema";
import { broadcast } from "./index";
import { sendActivationEmail } from "./lib/emailService";
import { z } from "zod";

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

  // Registration endpoint - Creates company and pending user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const registrationSchema = z.object({
        company: z.object({
          name: z.string().min(2),
          address: z.string().optional(),
          website: z.string().url().optional().or(z.literal("")),
          phone: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
        }),
        user: z.object({
          firstName: z.string().min(2),
          lastName: z.string().min(2),
          email: z.string().email(),
        }),
      });

      const validated = registrationSchema.parse(req.body);

      // Check if email is already registered
      const existingEmail = await storage.getProfileByEmail(validated.user.email);
      if (existingEmail) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Use email as username
      const username = validated.user.email;

      // Create company
      const company = await storage.createCompany({
        name: validated.company.name,
        address: validated.company.address || null,
        website: validated.company.website || null,
        phone: validated.company.phone || null,
        email: validated.company.email || null,
        logo: null,
      });

      // Create user profile with pending status
      const profile = await storage.createProfile({
        companyId: company.id,
        email: validated.user.email,
        username: username,
        firstName: validated.user.firstName,
        lastName: validated.user.lastName,
        country: "SV",
        status: "pending",
        role: "admin",
        vudyUserId: null,
        phone: null,
      });

      // Generate activation token (expires in 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      const activationToken = await storage.createActivationToken(profile.id, expiresAt);

      // Send activation email
      const baseUrl = process.env.REPL_URL || `http://localhost:${process.env.PORT || 5000}`;
      const activationLink = `${baseUrl}/activate/${activationToken.token}`;

      const emailSent = await sendActivationEmail({
        to: validated.user.email,
        firstName: validated.user.firstName,
        activationLink,
      });

      if (!emailSent) {
        console.warn('Failed to send activation email, but user was created');
      }

      return res.status(201).json({
        success: true,
        message: 'Cuenta creada exitosamente. Revisa tu email para activarla.',
        userId: profile.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      console.error('Error in registration:', error);
      return res.status(500).json({ error: 'Error al crear la cuenta' });
    }
  });

  // Activation endpoint - Activates user and calls Vudy onboard
  app.get("/api/auth/activate/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      // Get activation token
      const activationToken = await storage.getActivationToken(token);
      if (!activationToken) {
        return res.status(404).json({ error: 'Token de activación no encontrado' });
      }

      // Check if already used
      if (activationToken.used) {
        return res.status(400).json({ error: 'Este token ya ha sido utilizado' });
      }

      // Check if expired
      if (new Date() > activationToken.expiresAt) {
        return res.status(400).json({ error: 'El token ha expirado' });
      }

      // Get user profile
      const profile = await storage.getProfile(activationToken.userId);
      if (!profile) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Get company
      const company = profile.companyId ? await storage.getCompany(profile.companyId) : null;

      // Call Vudy onboard API
      const vudyApiKey = process.env.VUDY_API_KEY;
      if (!vudyApiKey) {
        console.error('VUDY_API_KEY not configured');
        return res.status(500).json({ error: 'Configuración del servidor incompleta' });
      }

      const vudyResponse = await fetch(`${VUDY_API_BASE}/onboard`, {
        method: 'POST',
        headers: {
          'x-api-key': vudyApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          country: profile.country,
          isBusiness: !!company,
          businessName: company?.name,
          termsOfService: true,
        }),
      });

      if (!vudyResponse.ok) {
        const errorText = await vudyResponse.text();
        console.error('Vudy API error during activation:', errorText);
        return res.status(500).json({ 
          error: 'Error al crear cuenta en Vudy',
          details: errorText,
          canRetry: true 
        });
      }

      const vudyData = await vudyResponse.json() as any;

      // Mark user as active
      await storage.updateProfile(profile.id, {
        status: 'active',
        vudyUserId: vudyData.data?.userId || null,
      });

      // Mark token as used
      await storage.markActivationTokenUsed(token);

      return res.json({
        success: true,
        message: 'Cuenta activada exitosamente',
        profile: {
          ...profile,
          status: 'active',
        },
      });
    } catch (error) {
      console.error('Error in activation:', error);
      return res.status(500).json({ error: 'Error al activar la cuenta' });
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
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const { 
        companyName, companyAddress, companyWebsite, companyPhone, companyEmail, companyLogo,
        ...profileData 
      } = req.body;

      // Update profile data
      if (Object.keys(profileData).length > 0) {
        await storage.updateProfile(req.params.id, profileData);
      }

      // Update company data if provided and user has a company
      if (profile.companyId && (companyName || companyAddress || companyWebsite || companyPhone || companyEmail || companyLogo)) {
        const companyUpdate: any = {};
        if (companyName !== undefined) companyUpdate.name = companyName;
        if (companyAddress !== undefined) companyUpdate.address = companyAddress;
        if (companyWebsite !== undefined) companyUpdate.website = companyWebsite;
        if (companyPhone !== undefined) companyUpdate.phone = companyPhone;
        if (companyEmail !== undefined) companyUpdate.email = companyEmail;
        if (companyLogo !== undefined) companyUpdate.logo = companyLogo;
        
        await storage.updateCompany(profile.companyId, companyUpdate);
      }

      // Return updated profile with company data
      const updatedProfile = await storage.getProfile(req.params.id);
      return res.json(updatedProfile);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: error.message || 'Error updating profile' });
    }
  });

  app.post("/api/profiles/:id/change-password", async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const bcrypt = await import('bcrypt');
      
      // Verify current password if one exists
      if (profile.passwordHash) {
        const isValid = await bcrypt.compare(currentPassword, profile.passwordHash);
        if (!isValid) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }
      }
      
      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateProfile(req.params.id, { passwordHash: hashedPassword });
      
      return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bank Accounts
  app.get("/api/bank-accounts", async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const accounts = await storage.getBankAccounts(userId);
    return res.json(accounts);
  });

  app.get("/api/bank-accounts/:id", async (req: Request, res: Response) => {
    const account = await storage.getBankAccount(req.params.id);
    if (!account) {
      return res.status(404).json({ error: "Bank account not found" });
    }
    return res.json(account);
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
    const filters = {
      userId: req.query.userId as string | undefined,
      type: req.query.type as "all" | "fiat_to_crypto" | "crypto_to_fiat" | undefined,
      datePreset: req.query.datePreset as "today" | "this_week" | "this_month" | "range" | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    };
    
    const transactions = await storage.getTransactions(filters);
    return res.json(transactions);
  });

  app.get("/api/user-statistics/:userId", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const statistics = await storage.getUserStatistics(userId);
    return res.json(statistics);
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
    
    // Broadcast transaction created event to SSE clients
    broadcast('tx.created', transaction);
    
    return res.json(transaction);
  });

  app.patch("/api/transactions/:id", async (req: Request, res: Response) => {
    const transaction = await storage.updateTransaction(req.params.id, req.body);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    // Broadcast transaction updated event to SSE clients
    broadcast('tx.updated', transaction);
    
    return res.json(transaction);
  });

  // OTC makes an offer on a transaction
  app.post("/api/tx/:id/offer", async (req: Request, res: Response) => {
    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    if (transaction.status !== "pending") {
      return res.status(409).json({ error: "Transaction is not pending" });
    }

    // Create the offer - transactionId comes from URL, not body
    const offerData = {
      ...req.body,
      transactionId: req.params.id,
    };
    const validated = insertOtcOfferSchema.parse(offerData);
    const offer = await storage.createOtcOffer(validated);

    // Update transaction status to "offer_made"
    const updatedTransaction = await storage.updateTransaction(req.params.id, {
      status: "offer_made",
    });

    // Broadcast offer created event to SSE clients
    broadcast('offer.created', offer);
    
    // Broadcast transaction updated event for real-time kanban updates
    if (updatedTransaction) {
      broadcast('tx.updated', updatedTransaction);
    }

    return res.json(offer);
  });

  // Client accepts an offer (transaction moves to escrow)
  app.post("/api/tx/:id/accept", async (req: Request, res: Response) => {
    const { offerId } = req.body;
    if (!offerId) {
      return res.status(400).json({ error: "offerId is required" });
    }

    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    if (transaction.status !== "pending") {
      return res.status(409).json({ error: "Transaction is not pending" });
    }

    const offer = await storage.getOffer(offerId);
    if (!offer || offer.transactionId !== req.params.id) {
      return res.status(404).json({ error: "Offer not found for this transaction" });
    }

    // Update all offers for this transaction
    await storage.updateMultipleOfferStatuses(req.params.id, offerId);

    // Update transaction status to escrow and set winner
    const updatedTx = await storage.updateTransaction(req.params.id, {
      status: "escrow",
      winnerOtcId: offer.userId,
    });

    // Broadcast transaction accepted event to SSE clients
    broadcast('tx.accepted', {
      txId: req.params.id,
      winnerOtcId: offer.userId,
    });

    return res.json(updatedTx);
  });

  // OTC uploads proof (only for crypto_to_fiat)
  app.post("/api/tx/:id/proof", async (req: Request, res: Response) => {
    const { fileName, hash } = req.body;
    if (!fileName || !hash) {
      return res.status(400).json({ error: "fileName and hash are required" });
    }

    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    if (transaction.type !== "sell") {
      return res.status(400).json({ error: "Proof upload only for crypto_to_fiat (sell) transactions" });
    }
    if (transaction.status !== "escrow") {
      return res.status(409).json({ error: "Transaction must be in escrow status" });
    }

    // Mark proof as uploaded
    await storage.updateTransaction(req.params.id, {
      proofUploaded: true,
    });

    return res.json({ ok: true });
  });

  // Client validates and finalizes transaction
  app.post("/api/tx/:id/validate", async (req: Request, res: Response) => {
    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    if (transaction.status !== "escrow") {
      return res.status(409).json({ error: "Transaction must be in escrow status" });
    }

    // For crypto_to_fiat, proof must be uploaded
    if (transaction.type === "sell" && !transaction.proofUploaded) {
      return res.status(409).json({ error: "Proof must be uploaded before validating" });
    }

    // Update transaction to completed
    const completedTx = await storage.updateTransaction(req.params.id, {
      status: "completed",
      completedAt: new Date(),
    });

    // Broadcast transaction completed event to SSE clients
    broadcast('tx.completed', { txId: req.params.id });

    return res.json(completedTx);
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
  app.get("/api/offers", async (req: Request, res: Response) => {
    // Get all offers (can be filtered by userId if needed)
    const userId = req.query.userId as string;
    if (userId) {
      const offers = await storage.getOffersByUserId(userId);
      return res.json(offers);
    }
    // Return all offers when no filter is provided
    const offers = await storage.getAllOffers();
    return res.json(offers);
  });

  app.get("/api/offers/transaction/:transactionId", async (req: Request, res: Response) => {
    const offers = await storage.getOffersForTransaction(req.params.transactionId);
    return res.json(offers);
  });

  app.post("/api/offers", async (req: Request, res: Response) => {
    const validated = insertOtcOfferSchema.parse(req.body);
    const offer = await storage.createOtcOffer(validated);
    return res.json(offer);
  });

  app.post("/api/offers/:offerId/accept", async (req: Request, res: Response) => {
    const { offerId } = req.params;

    try {
      await storage.acceptOffer(offerId);
      return res.json({ success: true, message: "Offer accepted successfully" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  // API Keys Management
  app.get("/api/api-keys", async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const keys = await storage.getApiKeys(userId);
    return res.json(keys);
  });

  app.post("/api/api-keys", async (req: Request, res: Response) => {
    const { userId, name } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: "userId and name are required" });
    }
    const result = await storage.generateApiKey(userId, name);
    return res.json(result);
  });

  app.delete("/api/api-keys/:id", async (req: Request, res: Response) => {
    await storage.revokeApiKey(req.params.id);
    return res.json({ success: true });
  });
}
