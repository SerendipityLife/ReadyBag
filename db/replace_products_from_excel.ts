import { db } from "./index";
import { products, userProducts } from "@shared/schema";
const XLSX = require('xlsx');
import * as fs from 'fs';

// 카테고리별 가격 범위 설정
const categoryPrices = {
  'BEAUTY': [2000, 15000],
  'FOOD': [300, 3000],
  'IT': [5000, 50000],
  'FASHION': [1000, 8000],
  'HEALTH': [800, 5000],
  'LIFESTYLE': [500, 4000]
} as const;

// 카테고리 키워드 매핑
const categoryKeywords = {
  'BEAUTY': ['화장품', '스킨케어', '메이크업', '뷰티', '크림', '에센스', '마스크', '립', '아이', '선크림'],
  'FOOD': ['과자', '음식', '간식', '음료', '차', '초콜릿', '사탕', '라면', '쿠키', '케이크'],
  'IT': ['전자기기', '게임', '컴퓨터', '스마트폰', '이어폰', '충전기', '케이블', '액세서리'],
  'FASHION': ['의류', '신발', '가방', '액세서리', '모자', '선글라스', '시계', '쥬얼리'],
  'HEALTH': ['건강', '의료', '약품', '비타민', '영양제', '마사지', '헬스케어'],
  'LIFESTYLE': ['생활용품', '문구', '인테리어', '주방', '욕실', '청소', '수납', '장난감']
} as const;

type CategoryType = keyof typeof categoryKeywords;

function determineCategoryFromText(text: string): CategoryType {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category as CategoryType;
    }
  }
  
  return 'LIFESTYLE';
}

function getRandomPrice(category: CategoryType): number {
  const [min, max] = categoryPrices[category];
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

async function replaceProductsFromExcel() {
  try {
    console.log("Excel 파일에서 상품 데이터를 읽어오는 중...");
    
    // Excel 파일 읽기
    const workbook = XLSX.readFile('attached_assets/japanese_products_donki.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Excel 파일에서 ${data.length} 행을 읽었습니다.`);
    
    // 기존 데이터 삭제
    console.log("기존 데이터를 삭제하는 중...");
    await db.delete(userProducts);
    const deletedProducts = await db.delete(products);
    console.log("기존 데이터 삭제 완료");
    
    // 새 상품 데이터 생성
    console.log("새 상품 데이터를 생성하는 중...");
    const newProducts = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      const name = row['제품명'] || `상품 ${i + 1}`;
      const nameJapanese = row['제품명_일본어'] || null;
      const description = row['설명'] || '상품 설명';
      
      // 빈 데이터 스킵
      if (!name || name.toString().trim() === '' || name.toString().toLowerCase() === 'nan') {
        continue;
      }
      
      // 카테고리 결정
      const textToCheck = (name + " " + description).toString();
      const category = determineCategoryFromText(textToCheck);
      
      // 가격 설정
      const price = getRandomPrice(category);
      
      // 이미지 URL
      const imageUrl = getCategoryImage(category);
      
      // 해시태그
      const hashtags = [`#${category.toLowerCase()}`, "#일본쇼핑", "#여행필수템"];
      
      newProducts.push({
        name: name.toString().trim(),
        nameJapanese: nameJapanese ? nameJapanese.toString().trim() : null,
        description: description.toString().trim(),
        price,
        imageUrl,
        countryId: 'japan',
        category,
        hashtags,
        location: null,
        featured: false
      });
    }
    
    console.log(`${newProducts.length}개의 상품 데이터를 데이터베이스에 삽입하는 중...`);
    
    // 배치 삽입
    const batchSize = 50;
    for (let i = 0; i < newProducts.length; i += batchSize) {
      const batch = newProducts.slice(i, i + batchSize);
      await db.insert(products).values(batch);
      console.log(`${i + batch.length}/${newProducts.length} 상품 삽입 완료`);
    }
    
    console.log("상품 데이터 교체가 완료되었습니다!");
    
  } catch (error) {
    console.error("오류 발생:", error);
    throw error;
  }
}

// 스크립트 실행
replaceProductsFromExcel()
  .then(() => {
    console.log("성공적으로 완료되었습니다.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("실패:", error);
    process.exit(1);
  });