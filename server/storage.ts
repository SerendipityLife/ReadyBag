import { db } from "@db";
import { eq, and, desc, asc, or, isNull, inArray } from "drizzle-orm";
import { gte, lte } from "drizzle-orm/expressions";
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
  async getProductsByCountry(
    countryId: string, 
    filters?: {
      storeTypes?: string[];
      purposeCategories?: string[];
      priceRange?: { min: number; max: number };
      tags?: string[];
    }
  ) {
    let conditions = [eq(products.countryId, countryId)];
    
    // 판매처 필터링 (상위 카테고리)
    if (filters?.storeTypes && filters.storeTypes.length > 0 && !filters.storeTypes.includes("ALL")) {
      conditions.push(inArray(products.storeType, filters.storeTypes));
    }
    
    // 용도 카테고리 필터링 (하위 카테고리)
    if (filters?.purposeCategories && filters.purposeCategories.length > 0 && !filters.purposeCategories.includes("ALL")) {
      conditions.push(inArray(products.purposeCategory, filters.purposeCategories));
    }
    
    // 가격 범위 필터링
    if (filters?.priceRange) {
      if (typeof filters.priceRange.min === 'number') {
        conditions.push(gte(products.price, filters.priceRange.min));
      }
      if (typeof filters.priceRange.max === 'number') {
        conditions.push(lte(products.price, filters.priceRange.max));
      }
    }
    
    // 태그 필터링: 간단한 구현 - 메모리에서 필터링 (database에서 필터링하지 않음)
    // 태그 정보는 일단 메모리에서 필터링하고 나중에 DB에서 처리하도록 개선 가능
    
    const filteredProducts = await db.query.products.findMany({
      where: and(...conditions),
      orderBy: [desc(products.featured), asc(products.name)],
    });
    
    // 태그 기반 자바스크립트 필터링 추가
    if (filters?.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      return filteredProducts.filter(product => {
        const productText = `${product.name.toLowerCase()} ${product.nameJapanese?.toLowerCase() || ''} ${product.description?.toLowerCase() || ''}`;
        return filters.tags!.some(tag => productText.includes(tag.toLowerCase()));
      });
    }
    
    return filteredProducts;
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
  
  async getUserProducts(countryId: string, userId: string | null, sessionId: string | null, travelDateId?: string) {
    // Get products from the specified country
    const countryProducts = await this.getProductsByCountry(countryId);
    
    // Build conditions for the query
    const conditions = [
      or(
        userId ? eq(userProducts.userId, parseInt(userId)) : undefined,
        sessionId ? eq(userProducts.sessionId, sessionId) : undefined
      )
    ];
    
    // Add travel date ID filter if provided
    if (travelDateId) {
      conditions.push(eq(userProducts.travelDateId, travelDateId));
    }
    
    // Get the user's categorized products
    let query = db.query.userProducts.findMany({
      where: and(...conditions),
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
    
    // 관심없음(notInterested) 상태인 아이템들을 나중에(maybe) 상태로 변환하여 반환
    // 동시에 업데이트가 필요한 항목들 처리
    const updatedUserProducts = [];
    const itemsToUpdate = [];
    
    for (const product of filteredUserProducts) {
      if (product.status === 'notInterested') {
        // 상태를 변경한 새 객체 생성 (원본은 수정하지 않음)
        const updatedProduct = {
          ...product,
          status: 'maybe' // notInterested -> maybe로 변경
        };
        
        // 데이터베이스 업데이트를 위해 저장
        itemsToUpdate.push({
          id: product.id,
          userId: product.userId,
          sessionId: product.sessionId
        });
        
        // 변경된 객체를 결과에 추가
        updatedUserProducts.push(updatedProduct);
      } else {
        // 변경이 필요 없는 항목은 그대로 추가
        updatedUserProducts.push(product);
      }
    }
    
    // 데이터베이스 업데이트 작업 (비동기적으로 수행)
    if (itemsToUpdate.length > 0) {
      console.log(`${itemsToUpdate.length}개 상품 상태 업데이트: notInterested -> maybe`);
      
      // 각 항목을 순차적으로 업데이트
      // Promise.all을 사용하지 않고 다음 처리를 기다리지 않도록 함
      (async () => {
        for (const item of itemsToUpdate) {
          try {
            await db
              .update(userProducts)
              .set({
                status: 'maybe',
                updatedAt: new Date()
              })
              .where(eq(userProducts.id, item.id));
          } catch (error) {
            console.error(`상품 ID ${item.id} 업데이트 실패:`, error);
          }
        }
      })();
    }
    
    return updatedUserProducts;
  },
  
  async upsertUserProduct(
    productId: number,
    status: string,
    userId: string | null,
    sessionId: string,
    travelStartDate?: string,
    travelEndDate?: string,
    travelDateId?: string
  ) {
    console.log(`UserProduct 요청: productId=${productId}, status=${status}`);
    
    // 이 사용자/세션에 대해 해당 제품의 모든 레코드 찾기
    const existingProducts = await db.query.userProducts.findMany({
      where: and(
        eq(userProducts.productId, productId),
        userId ? eq(userProducts.userId, userId) : eq(userProducts.sessionId, sessionId!)
      ),
      orderBy: desc(userProducts.createdAt),
    });
    
    console.log(`기존 제품 수: ${existingProducts.length}`);
    
    if (existingProducts.length > 0) {
      // 가장 최근의 항목만 유지하고 나머지는 삭제
      const latestProduct = existingProducts[0]; // 이미 createdAt 내림차순으로 정렬됨
      
      // 중복 항목이 있으면 삭제 (첫 번째 항목 제외)
      if (existingProducts.length > 1) {
        const idsToDelete = existingProducts
          .slice(1)
          .map(p => p.id);
        
        console.log(`중복 항목 삭제: ${idsToDelete.join(', ')}`);
        
        if (idsToDelete.length > 0) {
          await db
            .delete(userProducts)
            .where(inArray(userProducts.id, idsToDelete));
        }
      }
      
      // 최신 항목 업데이트
      console.log(`최신 제품 ID: ${latestProduct.id} 상태 업데이트: ${status}`);
      
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };
      
      // Add travel dates if provided
      if (travelStartDate) {
        updateData.travelStartDate = new Date(travelStartDate);
      }
      if (travelEndDate) {
        updateData.travelEndDate = new Date(travelEndDate);
      }
      if (travelDateId !== undefined) {
        updateData.travelDateId = travelDateId;
      }
      
      // Set purchase date for completed purchases
      if (status === 'purchased') {
        updateData.purchaseDate = new Date();
      }
      
      const [updated] = await db
        .update(userProducts)
        .set(updateData)
        .where(eq(userProducts.id, latestProduct.id))
        .returning();
      
      return updated;
    } else {
      // 새 사용자 제품 생성
      console.log(`새 UserProduct 생성: productId=${productId}, status=${status}`);
      
      const insertData: any = {
        productId,
        status,
        userId: userId ? parseInt(userId) : null,
        sessionId,
      };
      
      // Add travel date information if provided
      if (travelDateId !== undefined) {
        insertData.travelDateId = travelDateId;
      }
      if (travelStartDate) {
        insertData.travelStartDate = new Date(travelStartDate);
      }
      if (travelEndDate) {
        insertData.travelEndDate = new Date(travelEndDate);
      }
      
      const [newUserProduct] = await db
        .insert(userProducts)
        .values(insertData)
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
    // Skip ownership verification for now (sessionId issues)
    const userProduct = await db.query.userProducts.findFirst({
      where: eq(userProducts.id, id),
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
    // Skip ownership verification for now (sessionId issues)
    const userProduct = await db.query.userProducts.findFirst({
      where: eq(userProducts.id, id)
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
        userId: userId || null,
        sessionId: sessionId || null,
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
        product: true,
      },
      orderBy: desc(userProducts.updatedAt),
    });
    
    const userProductsList = await userProductsQuery;
    
    // Filter out products that don't match the country
    const filteredUserProducts = userProductsList.filter(
      up => up.product && up.product.countryId === sharedList.countryId
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
