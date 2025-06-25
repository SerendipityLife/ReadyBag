
import { db } from "../../db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

interface RakutenProduct {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  imageFlag: number;
  mediumImageUrls: Array<{ imageUrl: string }>;
}

interface RakutenSearchResponse {
  Items: Array<{
    Item: RakutenProduct;
  }>;
  count: number;
  page: number;
  first: number;
  last: number;
  hits: number;
  carrier: number;
  pageCount: number;
}

class RakutenService {
  private applicationId: string;
  private baseUrl = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

  constructor() {
    this.applicationId = process.env.RAKUTEN_APPLICATION_ID || '';
    if (!this.applicationId) {
      console.warn('라쿠텐 API 키가 설정되지 않았습니다. RAKUTEN_APPLICATION_ID 환경변수를 설정해주세요.');
    }
  }

  private async searchProducts(keyword: string, page: number = 1): Promise<RakutenSearchResponse | null> {
    if (!this.applicationId) {
      console.error('라쿠텐 API 키가 없습니다.');
      return null;
    }

    try {
      const params = new URLSearchParams({
        format: 'json',
        keyword: keyword,
        applicationId: this.applicationId,
        hits: '30', // 한 번에 최대 30개 상품
        page: page.toString(),
        sort: 'standard', // 표준 정렬 (관련성 순)
        minPrice: '1', // 최소 가격 1엔
      });

      const url = `${this.baseUrl}?${params.toString()}`;
      console.log(`라쿠텐 API 호출: ${keyword} (페이지 ${page})`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ReadyBag/1.0'
        }
      });

      if (!response.ok) {
        console.error(`라쿠텐 API 오류: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('라쿠텐 API 호출 실패:', error);
      return null;
    }
  }

  async getMinPriceForProduct(productName: string, productNameJapanese?: string, productNameEnglish?: string): Promise<{ minPrice: number; maxPrice: number } | null> {
    const searchTerms = [
      productNameJapanese,
      productName,
      productNameEnglish
    ].filter(Boolean);

    let minPrice = Infinity;
    let foundResults = false;

    for (const searchTerm of searchTerms) {
      if (!searchTerm) continue;

      console.log(`라쿠텐에서 "${searchTerm}" 검색 중...`);
      
      const result = await this.searchProducts(searchTerm);
      
      if (result && result.Items && result.Items.length > 0) {
        foundResults = true;
        
        for (const item of result.Items) {
          const price = item.Item.itemPrice;
          if (price > 0 && price < minPrice) {
            minPrice = price;
          }
        }

        // 첫 번째 검색어에서 결과를 찾으면 중단
        if (minPrice !== Infinity) {
          break;
        }
      }
      
      // API 호출 제한을 고려해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!foundResults || minPrice === Infinity) {
      console.log(`"${productName}"에 대한 라쿠텐 검색 결과가 없습니다.`);
      return null;
    }

    const maxPrice = Math.round(minPrice * 1.2); // 20% 추가

    console.log(`"${productName}" - 최저가: ${minPrice}엔, 최대가: ${maxPrice}엔`);
    
    return {
      minPrice: Math.round(minPrice),
      maxPrice
    };
  }

  async updateProductPrices(limit: number = 10): Promise<void> {
    console.log('=== 라쿠텐 가격 정보 업데이트 시작 ===');
    
    // 가격 정보가 없거나 오래된 상품들을 조회
    const productsToUpdate = await db.query.products.findMany({
      where: (products, { or, isNull, lt }) => or(
        isNull(products.rakutenMinPrice),
        lt(products.rakutenPriceUpdatedAt as any, new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24시간 이전
      ),
      limit,
      columns: {
        id: true,
        name: true,
        nameJapanese: true,
        nameEnglish: true,
      }
    });

    console.log(`업데이트할 상품 ${productsToUpdate.length}개 발견`);

    let successCount = 0;
    let failCount = 0;

    for (const product of productsToUpdate) {
      try {
        const priceInfo = await this.getMinPriceForProduct(
          product.name,
          product.nameJapanese || undefined,
          product.nameEnglish || undefined
        );

        if (priceInfo) {
          // 환율 정보 가져오기 (JPY -> KRW)
          const exchangeRate = await this.getExchangeRate();
          const minPriceKrw = Math.round(priceInfo.minPrice * exchangeRate);
          const maxPriceKrw = Math.round(priceInfo.maxPrice * exchangeRate);

          await db.update(products)
            .set({
              rakutenMinPrice: priceInfo.minPrice,
              rakutenMaxPrice: priceInfo.maxPrice,
              rakutenMinPriceKrw: minPriceKrw,
              rakutenMaxPriceKrw: maxPriceKrw,
              rakutenPriceUpdatedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(products.id, product.id));

          console.log(`✅ ${product.name}: ${priceInfo.minPrice}엔 - ${priceInfo.maxPrice}엔 (${minPriceKrw}원 - ${maxPriceKrw}원)`);
          successCount++;
        } else {
          failCount++;
          console.log(`❌ ${product.name}: 가격 정보를 찾을 수 없음`);
        }

        // API 제한을 고려해 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        failCount++;
        console.error(`❌ ${product.name} 처리 중 오류:`, error);
      }
    }

    console.log(`=== 라쿠텐 가격 업데이트 완료: 성공 ${successCount}개, 실패 ${failCount}개 ===`);
  }

  private async getExchangeRate(): Promise<number> {
    try {
      // 기존 환율 서비스 사용
      const response = await fetch('http://localhost:5000/api/currency');
      const data = await response.json();
      return parseFloat(data.rate);
    } catch (error) {
      console.error('환율 정보 가져오기 실패:', error);
      return 9.5; // 기본값
    }
  }
}

export const rakutenService = new RakutenService();
