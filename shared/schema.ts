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
  nameJapanese: text("name_japanese"), // 일본어 상품명
  nameEnglish: text("name_english"), // 영어 상품명
  description: text("description").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  countryId: text("country_id").references(() => countries.id).notNull(),
  storeType: text("store_type").notNull(), // 판매처: donkihote, convenience
  purposeCategory: text("purpose_category").notNull(), // 용도: eat, apply, health, etc
  brand: text("brand"), // 브랜드명
  hashtags: jsonb("hashtags").$type<string[]>(),
  tags: text("tags"), // 태그 (기존 호환성 유지)
  info: text("info"), // 추가 상품 정보
  location: text("location"),
  featured: boolean("featured").default(false),
  // 라쿠텐 가격 정보
  rakutenMinPrice: integer("rakuten_min_price"), // 라쿠텐 최저가 (엔화)
  rakutenMaxPrice: integer("rakuten_max_price"), // 라쿠텐 최저가 + 20% (엔화)
  rakutenMinPriceKrw: integer("rakuten_min_price_krw"), // 라쿠텐 최저가 (원화)
  rakutenMaxPriceKrw: integer("rakuten_max_price_krw"), // 라쿠텐 최저가 + 20% (원화)
  rakutenPriceUpdatedAt: timestamp("rakuten_price_updated_at"), // 가격 업데이트 시간
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
  status: text("status").notNull(), // 'interested', 'maybe', 'purchased', 'not_purchased'
  sessionId: text("session_id"), // For non-authenticated users
  travelDateId: text("travel_date_id"), // 선택된 여행 날짜 폴더 ID
  travelStartDate: timestamp("travel_start_date"), // 여행 시작 날짜
  travelEndDate: timestamp("travel_end_date"), // 여행 종료 날짜
  purchaseDate: timestamp("purchase_date"), // 구입 완료 날짜
  accommodationAddress: text("accommodation_address"), // 숙박지 주소
  actualPurchasePrice: integer("actual_purchase_price"), // 실제 구입 가격 (현지 화폐 기준)
  actualPurchasePriceKrw: integer("actual_purchase_price_krw"), // 실제 구입 가격 (원화 기준, 실시간 환율로 계산)
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
  username: text("username").notNull(), // 기존 컬럼 유지
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  nickname: text("nickname"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



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

// Product Reviews table - for user reviews on products
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id).notNull(),
  sessionId: text("session_id"), // For non-authenticated users
  rating: integer("rating").notNull(), // 1-5 star rating
  reviewText: text("review_text"),
  reviewerName: text("reviewer_name"), // Display name for the review
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productReviewsInsertSchema = createInsertSchema(productReviews, {
  rating: (schema) => schema.min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  reviewText: (schema) => schema.min(1, "Review text is required").max(1000, "Review text must be less than 1000 characters"),
  reviewerName: (schema) => schema.min(1, "Reviewer name is required").max(50, "Reviewer name must be less than 50 characters"),
});
export type ProductReviewInsert = z.infer<typeof productReviewsInsertSchema>;
export type ProductReview = typeof productReviews.$inferSelect;

// Relations - Updated to include reviews
export const countriesRelations = relations(countries, ({ many }) => ({
  products: many(products),
}));

export const productsRelationsUpdated = relations(products, ({ one, many }) => ({
  country: one(countries, { fields: [products.countryId], references: [countries.id] }),
  userProducts: many(userProducts),
  reviews: many(productReviews),
}));

export const usersRelationsUpdated = relations(users, ({ many }) => ({
  userProducts: many(userProducts),
  reviews: many(productReviews),
}));

export const userProductsRelationsUpdated = relations(userProducts, ({ one }) => ({
  user: one(users, { fields: [userProducts.userId], references: [users.id] }),
  product: one(products, { fields: [userProducts.productId], references: [products.id] }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  user: one(users, { fields: [productReviews.userId], references: [users.id] }),
  product: one(products, { fields: [productReviews.productId], references: [products.id] }),
}));

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
