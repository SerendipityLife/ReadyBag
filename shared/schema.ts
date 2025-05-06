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
  userId: text("user_id"),  // Can be null for non-authenticated users
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
  userId: text("user_id"),
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

// Users table - basic implementation for future authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
