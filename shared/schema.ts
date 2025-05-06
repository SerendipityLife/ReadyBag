import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Countries table
export const countries = pgTable("countries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  currency: text("currency").notNull(),
  flagUrl: text("flag_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const countriesInsertSchema = createInsertSchema(countries);
export type CountryInsert = z.infer<typeof countriesInsertSchema>;
export type Country = typeof countries.$inferSelect;

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameJapanese: text("name_japanese"), // 일본어 상품명 추가
  description: text("description").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  countryId: text("country_id").references(() => countries.id).notNull(),
  category: text("category").notNull(),
  hashtags: jsonb("hashtags").$type<string[]>(),
  location: text("location"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsInsertSchema = createInsertSchema(products);
export type ProductInsert = z.infer<typeof productsInsertSchema>;
export type Product = typeof products.$inferSelect;

// User Products table - to store user's interest in products
export const userProducts = pgTable("user_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),  // User ID for authenticated users
  productId: integer("product_id").references(() => products.id).notNull(),
  status: text("status").notNull(), // 'interested', 'notInterested', 'maybe'
  sessionId: text("session_id"), // For non-authenticated users
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userProductsInsertSchema = createInsertSchema(userProducts);
export type UserProductInsert = z.infer<typeof userProductsInsertSchema>;
export type UserProduct = typeof userProducts.$inferSelect;

// Shared Lists table
export const sharedLists = pgTable("shared_lists", {
  id: serial("id").primaryKey(),
  shareId: text("share_id").unique().notNull(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  countryId: text("country_id").references(() => countries.id).notNull(),
  status: text("status"), // Optional filter by status
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const sharedListsInsertSchema = createInsertSchema(sharedLists);
export type SharedListInsert = z.infer<typeof sharedListsInsertSchema>;
export type SharedList = typeof sharedLists.$inferSelect;

// Currency Rates table
export const currencyRates = pgTable("currency_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull().default("KRW"),
  rate: text("rate").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const currencyRatesInsertSchema = createInsertSchema(currencyRates);
export type CurrencyRateInsert = z.infer<typeof currencyRatesInsertSchema>;
export type CurrencyRate = typeof currencyRates.$inferSelect;

// Define relations
export const productsRelations = relations(products, ({ one }) => ({
  country: one(countries, {
    fields: [products.countryId],
    references: [countries.id],
  }),
}));

export const userProductsRelations = relations(userProducts, ({ one }) => ({
  product: one(products, {
    fields: [userProducts.productId],
    references: [products.id],
  }),
}));

export const sharedListsRelations = relations(sharedLists, ({ one }) => ({
  country: one(countries, {
    fields: [sharedLists.countryId],
    references: [countries.id],
  }),
}));

// Users table - expanded implementation for email-based authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  nickname: text("nickname"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations between users and user products
export const usersRelations = relations(users, ({ many }) => ({
  userProducts: many(userProducts),
  sharedLists: many(sharedLists),
}));

// Update userProductsRelations to include user relation
export const userProductsRelationsWithUser = relations(userProducts, ({ one }) => ({
  product: one(products, {
    fields: [userProducts.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [userProducts.userId],
    references: [users.id],
  }),
}));

// Define validation schema for user registration
export const registerUserSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  nickname: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

// Define schema for login
export const loginUserSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// Define schema for password reset request
export const resetPasswordRequestSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요")
});

// Define schema for password reset confirmation
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
