import { db } from "@db";
import { eq, and, desc, asc, or, isNull } from "drizzle-orm";
import {
  countries,
  products,
  userProducts,
  sharedLists,
  currencyRates,
} from "@shared/schema";

export const storage = {
  // Countries
  async getCountries() {
    return await db.select().from(countries).orderBy(asc(countries.name));
  },
  
  async getCountryById(id: string) {
    return await db.query.countries.findFirst({
      where: eq(countries.id, id),
    });
  },
  
  // Products
  async getProductsByCountry(countryId: string) {
    return await db.query.products.findMany({
      where: eq(products.countryId, countryId),
      orderBy: [desc(products.featured), asc(products.name)],
    });
  },
  
  async getProductById(id: number) {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
    });
  },
  
  // User Products
  async getUserProductById(id: number) {
    return await db.query.userProducts.findFirst({
      where: eq(userProducts.id, id)
    });
  },
  
  async getUserProducts(countryId: string, userId: string | null, sessionId: string | null) {
    // Get products from the specified country
    const countryProducts = await this.getProductsByCountry(countryId);
    
    // Get the user's categorized products
    let query = db.query.userProducts.findMany({
      where: and(
        or(
          userId ? eq(userProducts.userId, userId) : undefined,
          sessionId ? eq(userProducts.sessionId, sessionId) : undefined
        )
      ),
      with: {
        product: true,
      },
      orderBy: desc(userProducts.updatedAt),
    });
    
    const userProductsList = await query;
    
    // Filter for products from the selected country
    const filteredUserProducts = userProductsList.filter(
      up => up.product.countryId === countryId
    );
    
    return filteredUserProducts;
  },
  
  async upsertUserProduct(
    productId: number,
    status: string,
    userId: string | null,
    sessionId: string
  ) {
    // Check if user product already exists
    const existingUserProduct = await db.query.userProducts.findFirst({
      where: and(
        eq(userProducts.productId, productId),
        or(
          userId ? eq(userProducts.userId, userId) : undefined,
          eq(userProducts.sessionId, sessionId)
        )
      ),
    });
    
    if (existingUserProduct) {
      // Update existing user product
      const [updated] = await db
        .update(userProducts)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(userProducts.id, existingUserProduct.id))
        .returning();
      
      return updated;
    } else {
      // Create new user product
      const [newUserProduct] = await db
        .insert(userProducts)
        .values({
          productId,
          status,
          userId,
          sessionId,
        })
        .returning();
      
      return newUserProduct;
    }
  },
  
  async updateUserProductStatus(
    id: number,
    status: string,
    userId: string | null,
    sessionId: string
  ) {
    // Verify ownership
    const userProduct = await db.query.userProducts.findFirst({
      where: and(
        eq(userProducts.id, id),
        or(
          userId ? eq(userProducts.userId, userId) : undefined,
          eq(userProducts.sessionId, sessionId)
        )
      ),
    });
    
    if (!userProduct) {
      return null;
    }
    
    // Update status
    const [updated] = await db
      .update(userProducts)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(userProducts.id, id))
      .returning();
    
    return updated;
  },
  
  async deleteUserProduct(
    id: number,
    userId: string | null,
    sessionId: string
  ) {
    // Verify ownership
    const userProduct = await db.query.userProducts.findFirst({
      where: and(
        eq(userProducts.id, id),
        or(
          userId ? eq(userProducts.userId, userId) : undefined,
          eq(userProducts.sessionId, sessionId)
        )
      ),
    });
    
    if (!userProduct) {
      return null;
    }
    
    // Delete the user product
    const [deleted] = await db
      .delete(userProducts)
      .where(eq(userProducts.id, id))
      .returning();
    
    return deleted;
  },
  
  // Shared Lists
  async createSharedList(
    shareId: string,
    countryId: string,
    status: string | undefined,
    userId: string | null,
    sessionId: string
  ) {
    // Create an expiration date (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const [sharedList] = await db
      .insert(sharedLists)
      .values({
        shareId,
        countryId,
        status,
        userId,
        sessionId,
        expiresAt,
      })
      .returning();
    
    return sharedList;
  },
  
  async getSharedListByShareId(shareId: string) {
    // Get the shared list
    const sharedList = await db.query.sharedLists.findFirst({
      where: eq(sharedLists.shareId, shareId),
      with: {
        country: true,
      },
    });
    
    if (!sharedList) {
      return null;
    }
    
    // Check if expired
    if (sharedList.expiresAt && new Date() > new Date(sharedList.expiresAt)) {
      return null;
    }
    
    // Get user products for this shared list
    let userProductsQuery = db.query.userProducts.findMany({
      where: and(
        or(
          sharedList.userId ? eq(userProducts.userId, sharedList.userId) : undefined,
          sharedList.sessionId ? eq(userProducts.sessionId, sharedList.sessionId) : undefined
        ),
        sharedList.status ? eq(userProducts.status, sharedList.status) : undefined
      ),
      with: {
        product: {
          where: eq(products.countryId, sharedList.countryId),
        },
      },
      orderBy: desc(userProducts.updatedAt),
    });
    
    const userProductsList = await userProductsQuery;
    
    // Filter out products that don't match the country
    const filteredUserProducts = userProductsList.filter(
      up => up.product.countryId === sharedList.countryId
    );
    
    return {
      id: sharedList.id,
      shareId: sharedList.shareId,
      country: sharedList.country,
      status: sharedList.status,
      sharedBy: sharedList.userId ? "사용자" : "익명",
      sharedAt: sharedList.createdAt,
      expiresAt: sharedList.expiresAt,
      userProducts: filteredUserProducts,
    };
  },
  
  // Currency Rates
  async getCurrencyRate(fromCurrency: string, toCurrency: string) {
    const rate = await db.query.currencyRates.findFirst({
      where: and(
        eq(currencyRates.fromCurrency, fromCurrency),
        eq(currencyRates.toCurrency, toCurrency)
      ),
      orderBy: desc(currencyRates.lastUpdated),
    });
    
    return rate;
  },
  
  async updateCurrencyRate(fromCurrency: string, toCurrency: string, rate: number) {
    // Check if rate exists
    const existingRate = await this.getCurrencyRate(fromCurrency, toCurrency);
    
    if (existingRate) {
      // Update existing rate
      const [updated] = await db
        .update(currencyRates)
        .set({
          rate: rate.toString(),
          lastUpdated: new Date(),
        })
        .where(
          and(
            eq(currencyRates.fromCurrency, fromCurrency),
            eq(currencyRates.toCurrency, toCurrency)
          )
        )
        .returning();
      
      return updated;
    } else {
      // Create new rate
      const [newRate] = await db
        .insert(currencyRates)
        .values({
          fromCurrency,
          toCurrency,
          rate: rate.toString(),
        })
        .returning();
      
      return newRate;
    }
  },
};
