import { db } from "./db";
import { 
  profiles, bankAccounts, notifications, transactions, wallets, otcOffers, apiKeys,
  companies, activationTokens,
  type Profile, type InsertProfile,
  type BankAccount, type InsertBankAccount,
  type Notification, type InsertNotification,
  type Transaction, type InsertTransaction,
  type Wallet, type InsertWallet,
  type OtcOffer, type InsertOtcOffer,
  type ApiKey, type InsertApiKey,
  type Company, type InsertCompany,
  type ActivationToken
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Companies
  createCompany(data: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;

  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  createProfile(data: InsertProfile): Promise<Profile>;
  updateProfile(id: string, data: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Activation Tokens
  createActivationToken(userId: string, expiresAt: Date): Promise<ActivationToken>;
  getActivationToken(token: string): Promise<ActivationToken | undefined>;
  markActivationTokenUsed(token: string): Promise<void>;

  // Bank Accounts
  getBankAccounts(userId: string): Promise<BankAccount[]>;
  getBankAccount(id: string): Promise<BankAccount | undefined>;
  createBankAccount(data: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: string, data: Partial<InsertBankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: string): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Transactions
  getTransactions(filters?: {
    userId?: string;
    type?: "all" | "fiat_to_crypto" | "crypto_to_fiat";
    datePreset?: "today" | "this_week" | "this_month" | "range";
    from?: string;
    to?: string;
  }): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  getUserStatistics(userId: string): Promise<{
    totalTransactions: number;
    buyOrders: number;
    sellOrders: number;
    totalProcessed: number;
  }>;

  // Wallets
  getWallets(userId: string): Promise<Wallet[]>;
  createWallet(data: InsertWallet): Promise<Wallet>;
  deleteWallet(id: string): Promise<void>;

  // OTC Offers
  getAllOffers(): Promise<OtcOffer[]>;
  getOffersForTransaction(transactionId: string): Promise<OtcOffer[]>;
  getOffersByUserId(userId: string): Promise<OtcOffer[]>;
  getOffer(id: string): Promise<OtcOffer | undefined>;
  createOtcOffer(data: InsertOtcOffer): Promise<OtcOffer>;
  updateOfferStatus(id: string, status: "open" | "won" | "lost"): Promise<OtcOffer | undefined>;
  updateMultipleOfferStatuses(transactionId: string, winnerId: string): Promise<void>;
  acceptOffer(offerId: string): Promise<void>;

  // API Keys
  getApiKeys(userId: string): Promise<ApiKey[]>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  createApiKey(data: InsertApiKey): Promise<ApiKey>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  revokeApiKey(id: string): Promise<void>;
  generateApiKey(userId: string, name: string): Promise<{ apiKey: ApiKey; plainKey: string }>;
}

export class DbStorage implements IStorage {
  async createCompany(data: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(data).returning();
    return result[0];
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id));
    return result[0];
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email));
    return result[0];
  }

  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.username, username));
    return result[0];
  }

  async createProfile(data: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(data).returning();
    return result[0];
  }

  async updateProfile(id: string, data: Partial<InsertProfile>): Promise<Profile | undefined> {
    const result = await db.update(profiles).set(data).where(eq(profiles.id, id)).returning();
    return result[0];
  }

  async createActivationToken(userId: string, expiresAt: Date): Promise<ActivationToken> {
    const result = await db.insert(activationTokens).values({
      userId,
      expiresAt,
    }).returning();
    return result[0];
  }

  async getActivationToken(token: string): Promise<ActivationToken | undefined> {
    const result = await db.select().from(activationTokens).where(eq(activationTokens.token, token));
    return result[0];
  }

  async markActivationTokenUsed(token: string): Promise<void> {
    await db.update(activationTokens)
      .set({ used: true, usedAt: new Date() })
      .where(eq(activationTokens.token, token));
  }

  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async getBankAccount(id: string): Promise<BankAccount | undefined> {
    const result = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return result[0];
  }

  async createBankAccount(data: InsertBankAccount): Promise<BankAccount> {
    const result = await db.insert(bankAccounts).values(data).returning();
    return result[0];
  }

  async updateBankAccount(id: string, data: Partial<InsertBankAccount>): Promise<BankAccount | undefined> {
    const result = await db.update(bankAccounts).set(data).where(eq(bankAccounts.id, id)).returning();
    return result[0];
  }

  async deleteBankAccount(id: string): Promise<void> {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(data).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async getTransactions(filters?: {
    userId?: string;
    type?: "all" | "fiat_to_crypto" | "crypto_to_fiat";
    datePreset?: "today" | "this_week" | "this_month" | "range";
    from?: string;
    to?: string;
  }): Promise<Transaction[]> {
    const conditions: any[] = [];

    // Filter by userId if provided
    if (filters?.userId) {
      conditions.push(eq(transactions.userId, filters.userId));
    }

    // Filter by type if not 'all'
    if (filters?.type && filters.type !== "all") {
      // Map type values to match schema: fiat_to_crypto -> sell, crypto_to_fiat -> buy
      const typeValue = filters.type === "fiat_to_crypto" ? "sell" : "buy";
      conditions.push(eq(transactions.type, typeValue));
    }

    // Filter by date
    if (filters?.datePreset) {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (filters.datePreset) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "this_week":
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek;
          startDate = new Date(now.getFullYear(), now.getMonth(), diff);
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "range":
          if (filters.from) {
            startDate = new Date(filters.from);
          }
          if (filters.to) {
            endDate = new Date(filters.to);
            endDate.setHours(23, 59, 59, 999); // End of day
          }
          break;
      }

      if (startDate) {
        conditions.push(gte(transactions.createdAt, startDate));
      }
      if (endDate) {
        conditions.push(lte(transactions.createdAt, endDate));
      }
    }

    // Build and execute query
    if (conditions.length > 0) {
      return await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt));
    }

    // Return all transactions if no filters specified
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0];
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(data).returning();
    return result[0];
  }

  async updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return result[0];
  }

  async getUserStatistics(userId: string): Promise<{
    totalTransactions: number;
    buyOrders: number;
    sellOrders: number;
    totalProcessed: number;
  }> {
    const userOffers = await db
      .select({ transactionId: otcOffers.transactionId })
      .from(otcOffers)
      .where(eq(otcOffers.userId, userId));
    
    const uniqueTransactionIds = new Set(userOffers.map(o => o.transactionId));
    const totalTransactions = uniqueTransactionIds.size;

    const wonTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.winnerOtcId, userId));

    const buyOrders = wonTransactions.filter(t => t.type === 'buy').length;
    const sellOrders = wonTransactions.filter(t => t.type === 'sell').length;

    const completedTransactions = wonTransactions.filter(t => t.status === 'completed');
    const totalProcessed = completedTransactions.reduce((sum, t) => {
      return sum + parseFloat(t.amountValue?.toString() || '0');
    }, 0);

    return {
      totalTransactions,
      buyOrders,
      sellOrders,
      totalProcessed
    };
  }

  async getWallets(userId: string): Promise<Wallet[]> {
    return await db.select().from(wallets).where(eq(wallets.userId, userId));
  }

  async createWallet(data: InsertWallet): Promise<Wallet> {
    const result = await db.insert(wallets).values(data).returning();
    return result[0];
  }

  async deleteWallet(id: string): Promise<void> {
    await db.delete(wallets).where(eq(wallets.id, id));
  }

  async getAllOffers(): Promise<OtcOffer[]> {
    return await db.select().from(otcOffers).orderBy(desc(otcOffers.createdAt));
  }

  async getOffersForTransaction(transactionId: string): Promise<OtcOffer[]> {
    return await db.select().from(otcOffers).where(eq(otcOffers.transactionId, transactionId)).orderBy(desc(otcOffers.createdAt));
  }

  async getOffersByUserId(userId: string): Promise<OtcOffer[]> {
    return await db.select().from(otcOffers).where(eq(otcOffers.userId, userId)).orderBy(desc(otcOffers.createdAt));
  }

  async getOffer(id: string): Promise<OtcOffer | undefined> {
    const result = await db.select().from(otcOffers).where(eq(otcOffers.id, id));
    return result[0];
  }

  async createOtcOffer(data: InsertOtcOffer): Promise<OtcOffer> {
    const result = await db.insert(otcOffers).values(data).returning();
    return result[0];
  }

  async updateOfferStatus(id: string, status: "open" | "won" | "lost"): Promise<OtcOffer | undefined> {
    const result = await db.update(otcOffers).set({ status }).where(eq(otcOffers.id, id)).returning();
    return result[0];
  }

  async updateMultipleOfferStatuses(transactionId: string, winnerId: string): Promise<void> {
    // Get all offers for this transaction
    const offers = await this.getOffersForTransaction(transactionId);
    
    // Update each offer based on whether it's the winner
    for (const offer of offers) {
      const newStatus = offer.id === winnerId ? "won" : "lost";
      await db.update(otcOffers).set({ status: newStatus }).where(eq(otcOffers.id, offer.id));
    }
  }

  async acceptOffer(offerId: string): Promise<void> {
    // Get the offer that's being accepted
    const acceptedOffer = await this.getOffer(offerId);
    if (!acceptedOffer) {
      throw new Error("Offer not found");
    }

    // Use the transaction ID from the offer to prevent tampering
    const transactionId = acceptedOffer.transactionId;

    // Get the transaction
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Update transaction status to escrow and set winner
    await db.update(transactions)
      .set({ 
        status: "escrow",
        winnerOtcId: acceptedOffer.userId 
      })
      .where(eq(transactions.id, transactionId));

    // Get all offers for this transaction
    const allOffers = await this.getOffersForTransaction(transactionId);

    // Update all offers statuses
    for (const offer of allOffers) {
      const newStatus = offer.id === offerId ? "won" : "lost";
      await db.update(otcOffers).set({ status: newStatus }).where(eq(otcOffers.id, offer.id));

      // Send notification to users whose offers were rejected
      if (offer.id !== offerId) {
        await this.createNotification({
          userId: offer.userId,
          type: "offer_rejected",
          title: "Oferta no aceptada",
          message: `Tu oferta para la transacción ${transaction.code || transaction.id.substring(0, 8)} no fue aceptada.`,
          severity: "info",
          source: "system",
          payload: {
            transactionId: transaction.id,
            offerId: offer.id
          }
        });
      }
    }

    // Send notification to the winner
    await this.createNotification({
      userId: acceptedOffer.userId,
      type: "offer_accepted",
      title: "¡Oferta aceptada!",
      message: `Tu oferta para la transacción ${transaction.code || transaction.id.substring(0, 8)} fue aceptada. Ahora está en Escrow.`,
      severity: "success",
      source: "system",
      payload: {
        transactionId: transaction.id,
        offerId: acceptedOffer.id
      }
    });
  }

  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const result = await db.select().from(apiKeys)
      .where(and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true)
      ));
    return result[0];
  }

  async createApiKey(data: InsertApiKey): Promise<ApiKey> {
    const result = await db.insert(apiKeys).values(data).returning();
    return result[0];
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }

  async revokeApiKey(id: string): Promise<void> {
    await db.update(apiKeys)
      .set({ isActive: false, revokedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async generateApiKey(userId: string, name: string): Promise<{ apiKey: ApiKey; plainKey: string }> {
    // Generate a random API key
    const plainKey = `vdy_${crypto.randomBytes(32).toString('hex')}`;
    
    // Hash the key for storage
    const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');
    
    // Store only the prefix for display
    const keyPrefix = plainKey.substring(0, 11);
    
    // Create the API key record
    const apiKey = await this.createApiKey({
      userId,
      name,
      keyHash,
      keyPrefix,
      isActive: true,
    });
    
    return { apiKey, plainKey };
  }
}

export const storage = new DbStorage();
