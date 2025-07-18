import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getCurrencyRate } from "./services/currency";
import { getInstagramHashtags } from "./services/instagram";
import { db } from "../db";
import { userProducts, productReviews, products } from "../shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { setupAuth } from "./auth";
import cache from "./cache";
import { rakutenService } from "./services/rakuten";

// Extend Express Request type to have session properties
declare module 'express-session' {
  interface SessionData {
    id: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (Passport.js)
  setupAuth(app);
  // API prefix
  const apiPrefix = "/api";

  // Get all countries
  app.get(`${apiPrefix}/countries`, async (req, res) => {
    try {
      // 캐시에서 국가 목록 확인
      const cacheKey = "countries:all";
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        console.log("Serving countries from cache");
        return res.json(cachedData);
      }

      const countries = await storage.getCountries();

      // 캐시에 데이터 저장 (5분 유효)
      cache.set(cacheKey, countries, 5 * 60 * 1000);

      return res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      return res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  // Get products by country with filter support
  app.get(`${apiPrefix}/products`, async (req, res) => {
    try {
      // 성능 측정 시작
      const startTime = Date.now();
      const countryId = req.query.countryId as string || "japan";

      // 필터 파라미터 추출 - 새로운 두단계 카테고리 시스템
      const storeTypes = req.query.storeTypes 
        ? (req.query.storeTypes as string).split(',') 
        : undefined;

      const purposeCategories = req.query.purposeCategories 
        ? (req.query.purposeCategories as string).split(',') 
        : undefined;

      const minPrice = req.query.minPrice 
        ? parseInt(req.query.minPrice as string) 
        : undefined;

      const maxPrice = req.query.maxPrice 
        ? parseInt(req.query.maxPrice as string) 
        : undefined;

      const tags = req.query.tags 
        ? (req.query.tags as string).split(',') 
        : undefined;

      // 필터 객체 생성 - 새로운 두단계 카테고리 시스템
      const filters = {
        storeTypes,
        purposeCategories,
        priceRange: (minPrice !== undefined || maxPrice !== undefined) 
          ? { 
              min: minPrice !== undefined ? minPrice : 0, 
              max: maxPrice !== undefined ? maxPrice : Number.MAX_SAFE_INTEGER 
            } 
          : undefined,
        tags
      };

      // 캐시 키 생성
      const cacheKey = `products:${countryId}:${JSON.stringify(filters)}`;

      // 캐시에서 데이터 확인
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log("Serving products from cache");

        // 로깅 추가
        try {
          // logger 모듈 동적 로드 (비동기 import가 실패해도 API는 계속 동작하도록)
          const logger = await import('./logger').catch(() => null);
          if (logger) {
            const responseTime = Date.now() - startTime;
            logger.logApiRequest(`[CACHE HIT] GET products - country: ${countryId}, filters: ${JSON.stringify(filters)}, responseTime: ${responseTime}ms, products: ${Array.isArray(cachedData) ? cachedData.length : 0}`);
          }
        } catch (logError) {
          // 로깅 실패해도 API 응답에는 영향 없도록
          console.error("로깅 실패:", logError);
        }

        return res.json(cachedData);
      }

      console.log("Fetching products with filters:", filters);
      const products = await storage.getProductsByCountry(countryId, filters);

      // 캐시에 데이터 저장 (30초 유효)
      cache.set(cacheKey, products, 30 * 1000);

      // 로깅 추가
      try {
        const logger = await import('./logger').catch(() => null);
        if (logger) {
          const responseTime = Date.now() - startTime;
          logger.logApiRequest(`[DB QUERY] GET products - country: ${countryId}, filters: ${JSON.stringify(filters)}, responseTime: ${responseTime}ms, products: ${products.length}`);
        }
      } catch (logError) {
        console.error("로깅 실패:", logError);
      }

      return res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);

      // 에러 로깅 추가
      try {
        const logger = await import('./logger').catch(() => null);
        if (logger) {
          logger.logError("API 오류: 제품 목록 불러오기 실패", error);
        }
      } catch (logError) {
        console.error("에러 로깅 실패:", logError);
      }

      return res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get price range for specific category filters (이 라우트를 먼저 배치)
  app.get(`${apiPrefix}/products/price-range`, async (req, res) => {
    try {
      const countryId = req.query.countryId as string || "japan";

      // 필터 파라미터 추출
      const storeTypes = req.query.storeTypes 
        ? (req.query.storeTypes as string).split(',') 
        : undefined;

      const purposeCategories = req.query.purposeCategories 
        ? (req.query.purposeCategories as string).split(',') 
        : undefined;

      const tags = req.query.tags 
        ? (req.query.tags as string).split(',') 
        : undefined;

      console.log(`[PRICE RANGE] 요청 파라미터: countryId=${countryId}, storeTypes=${storeTypes}, purposeCategories=${purposeCategories}`);

      // 캐시 키 생성
      const cacheKey = `price-range:${countryId}:${JSON.stringify({ storeTypes, purposeCategories, tags })}`;
      
      // 캐시에서 데이터 확인
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`[PRICE RANGE] 캐시에서 반환: ${JSON.stringify(cachedData)}`);
        return res.json(cachedData);
      }

      // 필터 객체 생성
      const filters = {
        storeTypes,
        purposeCategories,
        tags
      };

      // 해당 필터 조건에 맞는 상품들 가져오기
      const products = await storage.getProductsByCountry(countryId, filters);
      console.log(`[PRICE RANGE] 필터링된 상품 수: ${products.length}`);

      if (products.length === 0) {
        const defaultRange = { min: 100, max: 3000 };
        console.log(`[PRICE RANGE] 상품이 없어서 기본값 반환: ${JSON.stringify(defaultRange)}`);
        cache.set(cacheKey, defaultRange, 5 * 60 * 1000); // 5분 캐시
        return res.json(defaultRange);
      }

      // 가격 범위 계산
      const prices = products.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      console.log(`[PRICE RANGE] 실제 가격 범위: ${minPrice} ~ ${maxPrice}`);

      const priceRange = {
        min: Math.floor(minPrice / 100) * 100, // 100엔 단위로 내림
        max: Math.ceil(maxPrice / 100) * 100   // 100엔 단위로 올림
      };

      console.log(`[PRICE RANGE] 최종 반환값: ${JSON.stringify(priceRange)}`);

      // 캐시에 저장 (5분 유효)
      cache.set(cacheKey, priceRange, 5 * 60 * 1000);

      return res.json(priceRange);
    } catch (error) {
      console.error("Error fetching price range:", error);
      return res.status(500).json({ message: "Failed to fetch price range" });
    }
  });

  // Get product by ID
  app.get(`${apiPrefix}/products/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProductById(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Get user products (categorized)
  app.get(`${apiPrefix}/user-products`, async (req, res) => {
    try {
      const countryId = req.query.countryId as string;
      const userId = req.user?.id ? String(req.user.id) : null;
      const sessionId = req.session?.id || req.sessionID || null;

      if (!countryId) {
        return res.status(400).json({ message: "Country ID is required" });
      }

      const travelDateId = req.query.travelDateId as string | undefined;

      // 캐시 키 생성 - 사용자 ID 또는 세션 ID와 여행 날짜 ID로 구별
      const userIdentifier = userId || sessionId || 'anonymous';
      const cacheKey = `user-products:${countryId}:${userIdentifier}:${travelDateId || 'no-date'}`;

      // 캐시에서 데이터 확인
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log("Serving user products from cache");
        return res.json(cachedData);
      }

      const userProducts = await storage.getUserProducts(countryId, userId, sessionId, travelDateId);

      // 캐시에 데이터 저장 (60초 유효 - 사용자 제품 캐시 시간 연장)
      cache.set(cacheKey, userProducts, 60 * 1000);

      return res.json(userProducts);
    } catch (error) {
      console.error("Error fetching user products:", error);
      return res.status(500).json({ message: "Failed to fetch user products" });
    }
  });

  // Create or update user product status
  app.post(`${apiPrefix}/user-products`, async (req, res) => {
    try {
      const schema = z.object({
        productId: z.number(),
        status: z.string(),
        travelDateId: z.string().nullable().optional(),
        travelStartDate: z.string().nullable().optional(),
        travelEndDate: z.string().nullable().optional(),
        accommodationAddress: z.string().optional(),
      });

      const validatedData = schema.parse(req.body);
      const userId = req.user?.id ? String(req.user.id) : null;
      const sessionId = req.session?.id || req.sessionID;

      const userProduct = await storage.upsertUserProduct(
        validatedData.productId,
        validatedData.status,
        userId,
        sessionId,
        validatedData.travelStartDate === null ? undefined : validatedData.travelStartDate,
        validatedData.travelEndDate === null ? undefined : validatedData.travelEndDate,
        validatedData.travelDateId === null ? undefined : validatedData.travelDateId,
        validatedData.accommodationAddress
      );

      // 사용자 제품 관련 캐시 무효화
      cache.deleteByPrefix("user-products:");

      return res.status(201).json(userProduct);
    } catch (error) {
      console.error("Error updating product status:", error);
      return res.status(500).json({ message: "Failed to update product status" });
    }
  });

  // Update user product status
  app.patch(`${apiPrefix}/user-products/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const schema = z.object({
        status: z.string(),
        travelStartDate: z.string().optional(),
        travelEndDate: z.string().optional(),
        accommodationAddress: z.string().optional(),
        actualPurchasePrice: z.number().optional(),
        actualPurchasePriceKrw: z.number().optional(),
      });

      const validatedData = schema.parse(req.body);

      // Log detailed information for debugging
      console.log("Update request: ID=", id, "Status=", validatedData.status);
      console.log("Travel dates:", validatedData.travelStartDate, validatedData.travelEndDate);

      // 간단하게 직접 업데이트 - 모든 권한 확인 생략
      try {
        const updateData: any = {
          status: validatedData.status,
          updatedAt: new Date(),
        };

        // Add travel dates if provided
        if (validatedData.travelStartDate) {
          updateData.travelStartDate = new Date(validatedData.travelStartDate);
        }
        if (validatedData.travelEndDate) {
          updateData.travelEndDate = new Date(validatedData.travelEndDate);
        }

        // Set purchase date for completed purchases
        if (validatedData.status === 'purchased') {
          updateData.purchaseDate = new Date();
        }

        // Add accommodation address for purchased items
        if (validatedData.accommodationAddress !== undefined) {
          updateData.accommodationAddress = validatedData.accommodationAddress;
        }
        if (validatedData.actualPurchasePrice !== undefined) {
          updateData.actualPurchasePrice = validatedData.actualPurchasePrice;
        }
        if (validatedData.actualPurchasePriceKrw !== undefined) {
          updateData.actualPurchasePriceKrw = validatedData.actualPurchasePriceKrw;
        }

        const [updated] = await db
          .update(userProducts)
          .set(updateData)
          .where(eq(userProducts.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ message: "User product not found" });
        }

        // 사용자 제품 관련 캐시 무효화
        cache.deleteByPrefix("user-products:");

        return res.json(updated);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Error updating user product:", error);
      return res.status(500).json({ message: "Failed to update user product" });
    }
  });

  // Batch delete user products (must come before /:id route)
  app.delete(`${apiPrefix}/user-products/batch`, async (req, res) => {
    try {
      console.log("Batch delete request body:", req.body);
      console.log("Request body type:", typeof req.body);
      console.log("Request headers:", req.headers);

      if (!req.body || typeof req.body !== 'object') {
        console.log("Invalid request body format");
        return res.status(400).json({ message: "Invalid request body format" });
      }

      const schema = z.object({
        ids: z.array(z.number()),
      });

      let validatedData;
      try {
        validatedData = schema.parse(req.body);
      } catch (parseError) {
        console.log("Schema validation error:", parseError);
        return res.status(400).json({ message: "Invalid data format", details: parseError });
      }

      const { ids } = validatedData;

      if (ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided for deletion" });
      }

      console.log(`Batch delete request: IDs=${ids.join(', ')}`);

      try {
        // Delete each product individually and collect results
        const deletePromises = ids.map(id => 
          db.delete(userProducts)
            .where(eq(userProducts.id, id))
            .returning()
        );

        const deleteResults = await Promise.all(deletePromises);
        const deletedProducts = deleteResults.filter(result => result.length > 0).flat();

        console.log(`Successfully batch deleted ${deletedProducts.length} products`);

        // 사용자 제품 관련 캐시 무효화
        cache.deleteByPrefix("user-products:");

        return res.json({ 
          message: `Deleted ${deletedProducts.length} products`,
          deletedProducts 
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Error batch deleting user products:", error);
      return res.status(500).json({ message: "Failed to batch delete user products" });
    }
  });

  // Delete user product
  app.delete(`${apiPrefix}/user-products/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Log detailed information for debugging
      console.log("Delete request: ID=", id);

      // 최적화된 직접 삭제 - 존재 확인 없이 바로 삭제
      try {
        const [deleted] = await db
          .delete(userProducts)
          .where(eq(userProducts.id, id))
          .returning();

        if (!deleted) {
          console.log("Product with ID", id, "does not exist");
          return res.status(200).json({ message: "Product already deleted" });
        }

        // 사용자 제품 관련 캐시 무효화
        cache.deleteByPrefix("user-products:");

        console.log("Successfully deleted product:", deleted);
        return res.json(deleted);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Error deleting user product:", error);
      return res.status(500).json({ message: "Failed to delete user product" });
    }
  });

  // Delete all products by travel date ID
  app.delete(`${apiPrefix}/user-products/by-travel-date/:travelDateId`, async (req, res) => {
    try {
      const travelDateId = req.params.travelDateId;
      const userId = req.user?.id ? String(req.user.id) : null;
      const sessionId = req.session?.id || req.sessionID || null;

      if (!travelDateId) {
        return res.status(400).json({ message: "Travel date ID is required" });
      }

      console.log(`Delete products by travel date: ${travelDateId} for user ${userId || sessionId}`);

      // Build where conditions based on user authentication
      let whereConditions;
      if (userId) {
        whereConditions = and(
          eq(userProducts.userId, parseInt(userId)),
          eq(userProducts.travelDateId, travelDateId)
        );
      } else if (sessionId) {
        whereConditions = and(
          eq(userProducts.sessionId, sessionId),
          eq(userProducts.travelDateId, travelDateId)
        );
      } else {
        return res.status(400).json({ message: "User authentication required" });
      }

      try {
        const deletedProducts = await db
          .delete(userProducts)
          .where(whereConditions)
          .returning();

        console.log(`Successfully deleted ${deletedProducts.length} products for travel date ${travelDateId}`);

        // 사용자 제품 관련 캐시 무효화
        cache.deleteByPrefix("user-products:");

        return res.json({ 
          message: `Deleted ${deletedProducts.length} products for travel date ${travelDateId}`,
          deletedProducts 
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Error deleting products by travel date:", error);
      return res.status(500).json({ message: "Failed to delete products by travel date" });
    }
  });

  // Create a shared list
  app.post(`${apiPrefix}/shared-list`, async (req, res) => {
    try {
      const schema = z.object({
        countryId: z.string(),
      });

      const validatedData = schema.parse(req.body);
      const status = req.query.status as string | undefined;
      const userId = req.user?.id ? String(req.user.id) : null;
      const sessionId = req.session?.id || req.sessionID;

      // Generate a unique share ID
      const shareId = nanoid(8);

      // Create shared list in database
      const sharedList = await storage.createSharedList(
        shareId,
        validatedData.countryId,
        status,
        userId,
        sessionId
      );

      // Generate share URL
      const host = req.headers.host || "localhost:5000";
      const protocol = req.secure ? "https" : "http";
      const shareUrl = `${protocol}://${host}/shared/${shareId}`;

      return res.status(201).json({ shareId, shareUrl });
    } catch (error) {
      console.error("Error creating shared list:", error);
      return res.status(500).json({ message: "Failed to create shared list" });
    }
  });

  // Get a shared list by share ID
  app.get(`${apiPrefix}/shared-list/:shareId`, async (req, res) => {
    try {
      const shareId = req.params.shareId;

      const sharedListData = await storage.getSharedListByShareId(shareId);

      if (!sharedListData) {
        return res.status(404).json({ message: "Shared list not found or expired" });
      }

      return res.json(sharedListData);
    } catch (error) {
      console.error("Error fetching shared list:", error);
      return res.status(500).json({ message: "Failed to fetch shared list" });
    }
  });

  // Get currency exchange rate
  app.get(`${apiPrefix}/currency`, async (req, res) => {
    try {
      const fromCurrency = req.query.from as string || "JPY";
      const toCurrency = req.query.to as string || "KRW";

      // 캐시 키 생성
      const cacheKey = `currency:${fromCurrency}:${toCurrency}`;

      // 캐시에서 환율 데이터 확인
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log("Serving currency data from cache");
        return res.json(cachedData);
      }

      const rate = await getCurrencyRate(fromCurrency, toCurrency);

      // 캐시에 데이터 저장 (1시간 유효)
      cache.set(cacheKey, rate, 60 * 60 * 1000);

      return res.json(rate);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      return res.status(500).json({ message: "Failed to fetch exchange rate" });
    }
  });

  // Get Instagram hashtags for a product
  app.get(`${apiPrefix}/instagram-hashtags`, async (req, res) => {
    try {
      const productName = req.query.productName as string;

      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      const hashtags = await getInstagramHashtags(productName);

      return res.json({ hashtags });
    } catch (error) {
      console.error("Error fetching Instagram hashtags:", error);
      return res.status(500).json({ message: "Failed to fetch Instagram hashtags" });
    }
  });

  // 로그 확인용 엔드포인트 (개발 환경에서만 사용)
  if (process.env.NODE_ENV !== 'production') {
    const logger = await import('./logger');

    app.get(`${apiPrefix}/logs/api`, (req, res) => {
      try {
        const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
        const logs = logger.readLogs('api', lines);
        return res.json({ logs });
      } catch (error) {
        console.error('API 로그 열람 오류:', error);
        return res.status(500).json({ message: 'API 로그 열람 중 오류가 발생했습니다.' });
      }
    });

    app.get(`${apiPrefix}/logs/error`, (req, res) => {
      try {
        const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
        const logs = logger.readLogs('error', lines);
        return res.json({ logs });
      } catch (error) {
        console.error('에러 로그 열람 오류:', error);
        return res.status(500).json({ message: '에러 로그 열람 중 오류가 발생했습니다.' });
      }
    });
  }

  // 새로운 카테고리 필터 엔드포인트
  app.get(`${apiPrefix}/categories/store-types`, async (_req, res) => {
    try {
      const storeTypes = [
        { id: 'donkihote', name: '돈키호테', nameJapanese: 'ドン・キホーテ' },
        { id: 'convenience', name: '편의점', nameJapanese: 'コンビニ' }
      ];
      res.json(storeTypes);
    } catch (error) {
      console.error("Error fetching store types:", error);
      res.status(500).json({ message: "Failed to fetch store types" });
    }
  });

  app.get(`${apiPrefix}/categories/purpose-categories`, async (_req, res) => {
    try {
      const purposeCategories = [
        { id: 'eat', name: '먹을거', nameJapanese: '食べ物' },
        { id: 'apply', name: '바르는거', nameJapanese: 'コスメ' },
        { id: 'health', name: '몸에 좋은거', nameJapanese: 'ヘルス' },
        { id: 'stick', name: '붙이는거/붙여두는거', nameJapanese: 'ステッカー' },
        { id: 'home', name: '집에서 쓰는거', nameJapanese: 'ホーム' },
        { id: 'wear', name: '입는거/쓰는거', nameJapanese: '衣類' },
        { id: 'gift', name: '기분내는거/선물용', nameJapanese: 'ギフト' }
      ];
      res.json(purposeCategories);
    } catch (error) {
      console.error("Error fetching purpose categories:", error);
      res.status(500).json({ message: "Failed to fetch purpose categories" });
    }
  });

  // Google Maps API 키 제공 엔드포인트
  app.get(`${apiPrefix}/config/google-maps`, (_req, res) => {
    res.json({ 
      apiKey: process.env.GOOGLE_MAPS_API_KEY || '' 
    });
  });

  // Product Reviews API endpoints

  // Get reviews for a specific product
  app.get(`${apiPrefix}/product-reviews/:productId`, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const reviews = await db.query.productReviews.findMany({
        where: eq(productReviews.productId, productId),
        orderBy: desc(productReviews.createdAt),
        with: {
          user: {
            columns: {
              id: true,
              nickname: true,
            }
          }
        }
      });

      return res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      return res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Create a new review
  app.post(`${apiPrefix}/product-reviews`, async (req, res) => {
    try {
      const schema = z.object({
        productId: z.number(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().min(1).max(1000),
        reviewerName: z.string().min(1).max(50),
        isAnonymous: z.boolean().optional().default(false),
      });

      const validatedData = schema.parse(req.body);

      // Check if user is authenticated
      const userId = req.user?.id || null;
      const sessionId = !userId ? req.session.id || nanoid() : null;

      // Check if user already reviewed this product
      const existingReview = await db.query.productReviews.findFirst({
        where: and(
          eq(productReviews.productId, validatedData.productId),
          userId 
            ? eq(productReviews.userId, userId)
            : eq(productReviews.sessionId, sessionId!)
        )
      });

      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this product" });
      }

      const [newReview] = await db.insert(productReviews).values({
        userId,
        sessionId,
        productId: validatedData.productId,
        rating: validatedData.rating,
        reviewText: validatedData.reviewText,
        reviewerName: validatedData.reviewerName,
        isAnonymous: validatedData.isAnonymous,
      }).returning();

      return res.status(201).json(newReview);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Update a review
  app.put(`${apiPrefix}/product-reviews/:id`, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      const schema = z.object({
        rating: z.number().min(1).max(5),
        reviewText: z.string().min(1).max(1000),
        reviewerName: z.string().min(1).max(50),
        isAnonymous: z.boolean().optional(),
      });

      const validatedData = schema.parse(req.body);

      // Check if user owns this review
      const userId = req.user?.id || null;
      const sessionId = !userId ? req.session.id : null;

      const existingReview = await db.query.productReviews.findFirst({
        where: and(
          eq(productReviews.id, reviewId),
          userId 
            ? eq(productReviews.userId, userId)
            : eq(productReviews.sessionId, sessionId!)
        )
      });

      if (!existingReview) {
        return res.status(404).json({ message: "Review not found or you don't have permission to edit it" });
      }

      const [updatedReview] = await db.update(productReviews)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(productReviews.id, reviewId))
        .returning();

      return res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update review" });
    }
  });

  // Delete a review
  app.delete(`${apiPrefix}/product-reviews/:id`, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      // Check if user owns this review
      const userId = req.user?.id || null;
      const sessionId = !userId ? req.session.id : null;

      const existingReview = await db.query.productReviews.findFirst({
        where: and(
          eq(productReviews.id, reviewId),
          userId 
            ? eq(productReviews.userId, userId)
            : eq(productReviews.sessionId, sessionId!)
        )
      });

      if (!existingReview) {
        return res.status(404).json({ message: "Review not found or you don't have permission to delete it" });
      }

      await db.delete(productReviews).where(eq(productReviews.id, reviewId));

      return res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      return res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Currency conversion endpoint
  app.get("/api/currency", async (req, res) => {
    try {
      const rate = await getCurrencyRate("JPY", "KRW");
      res.json({
        fromCurrency: "JPY",
        toCurrency: "KRW",
        rate: rate.toString(),
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error("Currency rate fetch error:", error);
      res.status(500).json({ message: "환율 정보를 가져올 수 없습니다." });
    }
  });

  // 라쿠텐 가격 정보 업데이트 엔드포인트
  app.post("/api/rakuten/update-prices", async (req, res) => {
    try {
      const { limit = 10 } = req.body;
      await rakutenService.updateProductPrices(limit);
      res.json({ 
        message: `라쿠텐 가격 정보 업데이트가 시작되었습니다. (최대 ${limit}개 상품)`,
        success: true 
      });
    } catch (error) {
      console.error("라쿠텐 가격 업데이트 오류:", error);
      res.status(500).json({ message: "가격 업데이트 중 오류가 발생했습니다." });
    }
  });

  // 특정 상품의 라쿠텐 가격 조회
  app.get("/api/rakuten/product/:id/price", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: {
          id: true,
          name: true,
          nameJapanese: true,
          nameEnglish: true,
          rakutenMinPrice: true,
          rakutenMaxPrice: true,
          rakutenMinPriceKrw: true,
          rakutenMaxPriceKrw: true,
          rakutenPriceUpdatedAt: true,
        }
      });

      if (!product) {
        return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
      }

      res.json(product);
    } catch (error) {
      console.error("라쿠텐 상품 가격 조회 오류:", error);
      res.status(500).json({ message: "가격 정보를 가져올 수 없습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}