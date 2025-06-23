import { db } from "./index";
import {
  countries,
  products,
  currencyRates,
} from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Insert countries if they don't exist
    const existingCountries = await db.select().from(countries);
    
    if (existingCountries.length === 0) {
      console.log("Seeding countries...");
      
      await db.insert(countries).values([
        {
          id: "japan",
          name: "일본",
          code: "JP",
          currency: "JPY",
          flagUrl: "https://flagcdn.com/w20/jp.png",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "korea",
          name: "한국",
          code: "KR",
          currency: "KRW",
          flagUrl: "https://pixabay.com/get/g1dc6174a327c2927b80802296a20cafb06236f8da91f56a5d724515effb38b6a696427110af1c1dee706594e12decb2573f9d070ddf0c6e84a52e8dcf8d96bfc_1280.jpg",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    // Insert Japanese products if they don't exist
    const existingProducts = await db.select().from(products);
    
    if (existingProducts.length === 0) {
      console.log("Seeding products...");
      
      // Japanese products
      await db.insert(products).values([
        {
          name: "시세이도 스킨케어 세트",
          description: "일본 현지에서만 구매할 수 있는 한정판 스킨케어 세트. 페이셜 마스크, 에센스, 크림 포함.",
          price: 8500,
          imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&h=400&q=80",
          countryId: "japan",
          category: "BEAUTY",
          hashtags: ["시세이도", "일본화장품", "스킨케어"],
          location: "주로 긴자, 신주쿠 등 백화점에서 구매 가능",
          featured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "도쿄 바나나 선물 세트",
          description: "일본의 인기 과자 도쿄 바나나 선물용 세트. 다양한 맛을 즐길 수 있습니다.",
          price: 1200,
          imageUrl: "https://images.unsplash.com/photo-1534312527009-56c7016453e6?auto=format&fit=crop&w=800&h=400&q=80",
          countryId: "japan",
          category: "FOOD",
          hashtags: ["도쿄바나나", "일본과자", "일본선물"],
          location: "도쿄역, 공항, 주요 관광지 기념품점",
          featured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "닌텐도 스위치 일본 한정판",
          description: "일본에서만 구매 가능한 한정판 닌텐도 스위치와 일본 독점 게임 세트.",
          price: 35000,
          imageUrl: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&h=400&q=80",
          countryId: "japan",
          category: "ELECTRONICS",
          hashtags: ["닌텐도", "닌텐도스위치", "일본게임"],
          location: "아키하바라, 요도바시 카메라, 빅카메라",
          featured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "유니클로 한정판 티셔츠",
          description: "일본 유니클로에서만 판매하는 한정판 디자인 티셔츠. UT 컬렉션.",
          price: 1900,
          imageUrl: "https://plus.unsplash.com/premium_photo-1673688152102-b24caa6e8725?auto=format&fit=crop&w=800&h=400&q=80",
          countryId: "japan",
          category: "FASHION",
          hashtags: ["유니클로", "일본패션", "UT"],
          location: "유니클로 매장 (긴자, 신주쿠, 시부야)",
          featured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "마츠모토 키요시 약국 세트",
          description: "일본 드럭스토어 인기 상품 모음. 진통제, 감기약, 파스, 비타민 등.",
          price: 5000,
          imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&h=400&q=80",
          countryId: "japan",
          category: "HEALTH",
          hashtags: ["마츠키요", "일본약", "일본드럭스토어"],
          location: "마츠모토 키요시 매장 (도쿄, 오사카 등 전국)",
          featured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "스튜디오 지브리 피규어 세트",
          description: "일본 지브리 스튜디오 공식 캐릭터 피규어 세트. 토토로, 포뇨, 가오나시 등.",
          price: 4800,
          imageUrl: "https://images.unsplash.com/photo-1531907700752-62799b2a3e84?auto=format&fit=crop&w=800&h=400&q=80",
          countryId: "japan",
          category: "TOYS",
          hashtags: ["지브리", "토토로", "일본애니"],
          location: "지브리 박물관, 동키호테, 아니메이트",
          featured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "일본 전통 다과 세트",
          description: "고급 화과자, 말차, 센베이 등이 포함된 일본 전통 다과 선물 세트.",
          price: 3200,
          imageUrl: "https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=800&h=400&q=80",
          countryId: "japan",
          category: "FOOD",
          hashtags: ["화과자", "일본전통", "말차"],
          location: "백화점 지하 식품관, 전통 다과점",
          featured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    // Insert initial currency rates
    const existingRates = await db.select().from(currencyRates);
    
    if (existingRates.length === 0) {
      console.log("Seeding currency rates...");
      
      await db.insert(currencyRates).values([
        {
          fromCurrency: "JPY",
          toCurrency: "KRW",
          rate: "9.82",
          lastUpdated: new Date(),
        },
        {
          fromCurrency: "KRW",
          toCurrency: "JPY",
          rate: "0.10",
          lastUpdated: new Date(),
        },
      ]);
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during database seeding:", error);
  }
}

seed();
