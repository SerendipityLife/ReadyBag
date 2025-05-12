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
      categories?: string[];
      priceRange?: { min: number; max: number };
      tags?: string[];
    }
  ) {
    let conditions = [eq(products.countryId, countryId)];
    
    // 카테고리 필터링
    if (filters?.categories && filters.categories.length > 0 && !filters.categories.includes("ALL")) {
      // 카테고리 매핑 처리
      // UI에서 넘어온 카테고리(FOOD)와 DB에 저장된 카테고리(FOOD)를 비교하기 위해
      // 메모리에서 필터링하도록 수정 (inArray 조건은 사용하지 않음)
      // 최적화를 위해 추후 DB 스키마 수정 필요할 수 있음
      
      // 여기서는 조건을 추가하지 않고, 쿼리 후 카테고리 필터링을 메모리에서 처리
      // conditions.push(inArray(products.category, filters.categories));
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
    
    const products_list = await db.query.products.findMany({
      where: and(...conditions),
      orderBy: [desc(products.featured), asc(products.name)],
    });
    
    // 필터 객체 복사 (원본 변경 방지)
    let filteredProducts = [...products_list];
    
    // 카테고리 필터링 (메모리에서 처리)
    if (filters?.categories && filters.categories.length > 0 && !filters.categories.includes("ALL")) {
      console.log("카테고리 필터링 처리 - 메모리 필터링:", {
        요청카테고리: filters.categories,
        전체상품수: filteredProducts.length
      });
      
      // lib/constants.ts의 CATEGORY_MAPPING을 서버에서 복제하여 사용
      // 향후 클라이언트와 서버 간 일관된 매핑을 위해 공유 파일로 리팩토링 고려
      const CATEGORY_MAPPING: Record<string, string> = {
        // 기본 카테고리는 그대로 유지
        "BEAUTY": "BEAUTY",
        "FOOD": "FOOD", 
        "ELECTRONICS": "ELECTRONICS",
        "FASHION": "FASHION",
        "HEALTH": "HEALTH",
        "TOYS": "TOYS",
        "LIQUOR": "LIQUOR",
        
        // 통합 대상 카테고리
        "IT": "ELECTRONICS", // IT → 전자제품/가전
        "CHARACTER": "TOYS", // 캐릭터 굿즈 → 장난감
        
        // 삭제 대상 카테고리 (기타로 매핑)
        "HOME": "ELECTRONICS",
        "OTHER": "ELECTRONICS"
      };
      
      // 카테고리 정규화 함수 (매핑 테이블 활용)
      const normalizeCategory = (category: string): string => {
        return category in CATEGORY_MAPPING 
          ? CATEGORY_MAPPING[category] 
          : category;
      };
      
      // 메모리에서 카테고리 필터링
      filteredProducts = filteredProducts.filter(product => {
        // 1. 정확한 카테고리 일치 확인
        if (filters.categories!.includes(product.category)) {
          return true;
        }
        
        // 2. 정규화된 카테고리 확인
        const normalizedCategory = normalizeCategory(product.category);
        return filters.categories!.includes(normalizedCategory);
      });
      
      console.log("카테고리 필터링 결과:", {
        필터링후상품수: filteredProducts.length,
        샘플카테고리: filteredProducts.slice(0, 3).map(p => p.category)
      });
    }
    
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
    sessionId: string
  ) {
    console.log(`UserProduct 요청: productId=${productId}, status=${status}`);
    
    // 이 사용자/세션에 대해 해당 제품의 모든 레코드 찾기
    const existingProducts = await db.query.userProducts.findMany({
      where: and(
        eq(userProducts.productId, productId),
        or(
          userId ? eq(userProducts.userId, userId) : undefined,
          sessionId ? eq(userProducts.sessionId, sessionId) : undefined
        )
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
      
      const [updated] = await db
        .update(userProducts)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(userProducts.id, latestProduct.id))
        .returning();
      
      return updated;
    } else {
      // 새 사용자 제품 생성
      console.log(`새 UserProduct 생성: productId=${productId}, status=${status}`);
      
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
