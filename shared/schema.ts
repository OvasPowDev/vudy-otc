import { pgTable, uuid, text, timestamp, boolean, jsonb, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactionTypeEnum = pgEnum("transaction_type", ["buy", "sell"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "offer_made", "escrow", "completed", "failed"]);
export const offerStatusEnum = pgEnum("offer_status", ["open", "won", "lost"]);
export const requestOriginEnum = pgEnum("request_origin", ["whatsapp", "api", "form", "manual"]);
export const userStatusEnum = pgEnum("user_status", ["pending", "active", "inactive"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  logo: text("logo"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id"),
  email: text("email"),
  username: text("username").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  country: text("country"),
  status: userStatusEnum("status").notNull().default("pending"),
  role: userRoleEnum("role").notNull().default("user"),
  vudyUserId: text("vudy_user_id"),
  profilePhoto: text("profile_photo"),
  companyLogo: text("company_logo"),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyWebsite: text("company_website"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  passwordHash: text("password_hash"),
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
  winnerOtcId: uuid("winner_otc_id"),
  proofUploaded: boolean("proof_uploaded").default(false),
  clientAlias: text("client_alias"),
  clientKycUrl: text("client_kyc_url"),
  clientNotes: text("client_notes"),
  requestOrigin: requestOriginEnum("request_origin"),
  internalNotes: text("internal_notes"),
  slaMinutes: integer("sla_minutes"),
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
  status: offerStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

export const activationTokens = pgTable("activation_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  token: uuid("token").notNull().unique().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOtcOfferSchema = createInsertSchema(otcOffers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true });

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

// Profile with joined company data
export type ProfileWithCompany = Profile & {
  companyName: string | null;
  companyAddress: string | null;
  companyWebsite: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyLogo: string | null;
};
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
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ActivationToken = typeof activationTokens.$inferSelect;
