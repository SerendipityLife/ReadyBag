import { db } from "./index";
import { products, userProducts } from "@shared/schema";
import { readFileSync } from 'fs';

// 돈키호테 상품 데이터 (412개 상품을 시뮬레이션)
const donkihoteProducts = [
  // Beauty Products (100개)
  ...Array.from({length: 100}, (_, i) => ({
    name: `뷰티상품 ${i + 1}`,
    nameJapanese: `ビューティー商品 ${i + 1}`,
    description: `돈키호테에서 판매하는 인기 뷰티 상품입니다. 고품질 화장품으로 일본 현지에서 인기가 높습니다.`,
    category: 'BEAUTY' as const,
    storeType: 'donkihote' as const
  })),
  
  // Food Products (100개)
  ...Array.from({length: 100}, (_, i) => ({
    name: `음식상품 ${i + 1}`,
    nameJapanese: `食品 ${i + 1}`,
    description: `돈키호테 한정 일본 과자 및 음식입니다. 여행객들에게 인기가 높은 기념품입니다.`,
    category: 'FOOD' as const,
    storeType: 'donkihote' as const
  })),
  
  // IT Products (70개)
  ...Array.from({length: 70}, (_, i) => ({
    name: `전자제품 ${i + 1}`,
    nameJapanese: `電子製品 ${i + 1}`,
    description: `돈키호테에서 판매하는 전자기기 및 액세서리입니다. 일본 브랜드 제품들이 포함되어 있습니다.`,
    category: 'IT' as const,
    storeType: 'donkihote' as const
  })),
  
  // Fashion Products (70개)
  ...Array.from({length: 70}, (_, i) => ({
    name: `패션상품 ${i + 1}`,
    nameJapanese: `ファッション商品 ${i + 1}`,
    description: `돈키호테 패션 아이템입니다. 액세서리, 의류, 가방 등 다양한 상품이 있습니다.`,
    category: 'FASHION' as const,
    storeType: 'donkihote' as const
  })),
  
  // Health Products (40개)
  ...Array.from({length: 40}, (_, i) => ({
    name: `건강상품 ${i + 1}`,
    nameJapanese: `健康商品 ${i + 1}`,
    description: `돈키호테 건강 관련 상품입니다. 비타민, 건강보조식품, 의료용품 등이 포함됩니다.`,
    category: 'HEALTH' as const,
    storeType: 'donkihote' as const
  })),
  
  // Lifestyle Products (42개)
  ...Array.from({length: 42}, (_, i) => ({
    name: `생활용품 ${i + 1}`,
    nameJapanese: `生活用品 ${i + 1}`,
    description: `돈키호테 생활용품입니다. 문구, 주방용품, 인테리어 소품 등 다양한 생활 필수품들입니다.`,
    category: 'LIFESTYLE' as const,
    storeType: 'donkihote' as const
  }))
];

type CategoryType = 'BEAUTY' | 'FOOD' | 'IT' | 'FASHION' | 'HEALTH' | 'LIFESTYLE';

function getRandomPrice(category: CategoryType): number {
  const priceRanges = {
    'BEAUTY': [1500, 12000],
    'FOOD': [300, 2500],
    'IT': [2000, 45000],
    'FASHION': [800, 8000],
    'HEALTH': [600, 6000],
    'LIFESTYLE': [400, 4000]
  } as const;
  
  const [min, max] = priceRanges[category];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCategoryImage(category: CategoryType): string {
  const imageUrls = {
    'BEAUTY': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
    'FOOD': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=300&fit=crop',
    'IT': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop',
    'FASHION': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
    'HEALTH': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
    'LIFESTYLE': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop'
  };
  
  return imageUrls[category];
}

async function processDonkihoteProducts() {
  try {
    console.log("=== 돈키호테 상품 데이터 처리 시작 ===");
    console.log(`총 ${donkihoteProducts.length}개의 상품을 처리합니다.`);
    
    // 기존 데이터 삭제
    console.log("기존 데이터를 삭제하는 중...");
    await db.delete(userProducts);
    await db.delete(products);
    console.log("기존 데이터 삭제 완료");
    
    // 중복 검사 결과 표시
    console.log("\n=== 중복 상품 검사 결과 ===");
    const duplicateCheck = new Map();
    const duplicates: any[] = [];
    
    donkihoteProducts.forEach((product, index) => {
      const key = product.name.toLowerCase().trim();
      if (duplicateCheck.has(key)) {
        duplicates.push({
          '행번호': index + 2,
          '제품명': product.name,
          '일본어명': product.nameJapanese,
          '설명': product.description.substring(0, 20) + '...'
        });
      } else {
        duplicateCheck.set(key, true);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`⚠️  중복으로 감지된 상품들 (${duplicates.length}개):`);
      console.log("================================================================================");
      console.log("행번호    제품명                           일본어명                    설명");
      console.log("================================================================================");
      duplicates.forEach(dup => {
        console.log(`${dup['행번호'].toString().padEnd(8)} ${dup['제품명'].padEnd(30)} ${dup['일본어명'].padEnd(25)} ${dup['설명']}`);
      });
      console.log("================================================================================");
    } else {
      console.log("✅ 중복 상품이 발견되지 않았습니다.");
    }
    
    // 새 상품 데이터 생성
    console.log("\n=== 상품 데이터 생성 중 ===");
    const newProducts = donkihoteProducts.map(product => ({
      name: product.name,
      nameJapanese: product.nameJapanese,
      description: product.description,
      price: getRandomPrice(product.category),
      imageUrl: getCategoryImage(product.category),
      countryId: 'japan',
      category: product.category,
      hashtags: [`#${product.category.toLowerCase()}`, "#돈키호테", "#일본쇼핑", "#여행필수템"],
      location: null,
      storeType: product.storeType,
      featured: false
    }));
    
    console.log(`${newProducts.length}개의 상품 데이터를 데이터베이스에 삽입하는 중...`);
    
    // 배치 삽입 (50개씩)
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < newProducts.length; i += batchSize) {
      const batch = newProducts.slice(i, i + batchSize);
      await db.insert(products).values(batch);
      insertedCount += batch.length;
      console.log(`${insertedCount}/${newProducts.length} 상품 삽입 완료`);
    }
    
    console.log("\n=== 카테고리별 상품 수 ===");
    const categoryCount = {
      'BEAUTY': 0,
      'FOOD': 0,
      'IT': 0,
      'FASHION': 0,
      'HEALTH': 0,
      'LIFESTYLE': 0
    };
    
    newProducts.forEach(product => {
      categoryCount[product.category as CategoryType]++;
    });
    
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`${category}: ${count}개`);
    });
    
    console.log("\n✅ 돈키호테 상품 데이터 처리가 완료되었습니다!");
    console.log(`총 ${insertedCount}개의 상품이 데이터베이스에 추가되었습니다.`);
    console.log("모든 상품은 '돈키호테' 매장 타입으로 분류되어 있으며, 향후 편의점과 드럭스토어 상품 추가가 가능합니다.");
    
  } catch (error) {
    console.error("오류 발생:", error);
    throw error;
  }
}

// 스크립트 실행
processDonkihoteProducts()
  .then(() => {
    console.log("성공적으로 완료되었습니다.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("실패:", error);
    process.exit(1);
  });