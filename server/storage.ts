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
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
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

  // Transactions
  getTransactions(userId?: string): Promise<Transaction[]>;
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

  async getTransactions(userId?: string): Promise<Transaction[]> {
    if (userId) {
      return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
    }
    return await db.select().from(transactions).where(eq(transactions.status, "pending")).orderBy(desc(transactions.createdAt));
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
