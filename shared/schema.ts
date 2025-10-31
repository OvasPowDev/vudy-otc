import { pgTable, uuid, text, timestamp, boolean, jsonb, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactionTypeEnum = pgEnum("transaction_type", ["Buy", "Sell"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "offer_made", "escrow_created", "completed"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  read: boolean("read").notNull().default(false),
  severity: text("severity").notNull(),
  source: text("source").notNull(),
  payload: jsonb("payload"),
  actions: jsonb("actions"),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  offeredAt: timestamp("offered_at"),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  type: transactionTypeEnum("type").notNull(),
  direction: text("direction").notNull(),
  chain: text("chain").notNull(),
  token: text("token").notNull(),
  amountValue: numeric("amount_value", { precision: 20, scale: 2 }).notNull(),
  amountCurrency: text("amount_currency").notNull().default("USD"),
  bankAccountId: text("bank_account_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  acceptedByUserId: uuid("accepted_by_user_id"),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  chain: text("chain").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const otcOffers = pgTable("otc_offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id").notNull(),
  userId: uuid("user_id").notNull(),
  amountValue: numeric("amount_value", { precision: 18, scale: 6 }).notNull(),
  amountCurrency: text("amount_currency").notNull(),
  bankAccountId: uuid("bank_account_id"),
  walletId: uuid("wallet_id"),
  etaMinutes: integer("eta_minutes").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ createdAt: true, updatedAt: true });
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOtcOfferSchema = createInsertSchema(otcOffers).omit({ id: true, createdAt: true, updatedAt: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type OtcOffer = typeof otcOffers.$inferSelect;
export type InsertOtcOffer = z.infer<typeof insertOtcOfferSchema>;
