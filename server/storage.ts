import { db } from "./db";
import { 
  profiles, bankAccounts, notifications, transactions, wallets, otcOffers,
  type Profile, type InsertProfile,
  type BankAccount, type InsertBankAccount,
  type Notification, type InsertNotification,
  type Transaction, type InsertTransaction,
  type Wallet, type InsertWallet,
  type OtcOffer, type InsertOtcOffer
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(data: InsertProfile): Promise<Profile>;
  updateProfile(id: string, data: Partial<InsertProfile>): Promise<Profile | undefined>;

  // Bank Accounts
  getBankAccounts(userId: string): Promise<BankAccount[]>;
  getBankAccount(id: string): Promise<BankAccount | undefined>;
  createBankAccount(data: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: string, data: Partial<InsertBankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: string): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
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

  // Wallets
  getWallets(userId: string): Promise<Wallet[]>;
  createWallet(data: InsertWallet): Promise<Wallet>;
  deleteWallet(id: string): Promise<void>;

  // OTC Offers
  getOffersForTransaction(transactionId: string): Promise<OtcOffer[]>;
  createOtcOffer(data: InsertOtcOffer): Promise<OtcOffer>;
}

export class DbStorage implements IStorage {
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email));
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

  async getOffersForTransaction(transactionId: string): Promise<OtcOffer[]> {
    return await db.select().from(otcOffers).where(eq(otcOffers.transactionId, transactionId));
  }

  async createOtcOffer(data: InsertOtcOffer): Promise<OtcOffer> {
    const result = await db.insert(otcOffers).values(data).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
