import { db } from "./index";
import { products, userProducts } from "@shared/schema";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

// 한국어-일본어 번역 매핑
const translationMap = {
  // 뷰티 관련
  '화장품': 'コスメ', '스킨케어': 'スキンケア', '에센스': 'エッセンス', '크림': 'クリーム',
  '로션': 'ローション', '마스크': 'マスク', '선크림': '日焼け止め', '립크림': 'リップクリーム',
  '립밤': 'リップバーム', '아이섀도우': 'アイシャドウ', '팩트': 'ファクト', '파우더': 'パウダー',
  
  // 음식 관련
  '과자': 'お菓子', '초콜릿': 'チョコレート', '사탕': 'キャンディー', '쿠키': 'クッキー',
  '케이크': 'ケーキ', '음료': '飲み物', '차': 'お茶', '라면': 'ラーメン', '프레츨': 'プレッツェル',
  '레몬': 'レモン',
  
  // 건강 관련
  '비타민': 'ビタミン', '영양제': 'サプリメント', '보조제': 'サプリメント', '진통제': '鎮痛剤',
  '치약': '歯磨き粉', '마스크팩': 'マスクパック',
  
  // 브랜드명 (그대로 유지하되 카타카나로)
  'DHC': 'DHC', 'CANMAKE': 'キャンメイク', 'APAGARD': 'アパガード', 'EVE': 'イブ',
  'CLUB': 'クラブ', 'CHOI': 'チョイ'
};

// 카테고리 분류 키워드
const categoryKeywords = {
  'BEAUTY': ['화장품', '스킨케어', '메이크업', '뷰티', '크림', '에센스', '마스크', '립', '팩트', '파우더', 'canmake', 'dhc', '코스메'],
  'FOOD': ['과자', '음식', '간식', '음료', '차', '초콜릿', '사탕', '라면', '쿠키', '케이크', '빵', '프레츨', '레몬'],
  'HEALTH': ['건강', '의료', '약품', '비타민', '영양제', '마사지', '헬스케어', '진통제', '치약', '보조제', 'eve'],
  'IT': ['전자기기', '게임', '컴퓨터', '스마트폰', '이어폰', '충전기', '케이블', '액세서리', '카메라'],
  'FASHION': ['의류', '신발', '가방', '액세서리', '모자', '선글라스', '시계', '쥬얼리', '옷'],
  'LIFESTYLE': ['생활용품', '문구', '인테리어', '주방', '욕실', '청소', '수납', '장난감', '도구', '마스크팩']
};

function generateJapaneseName(koreanName: string): string {
  let japaneseName = koreanName;
  
  // 번역 매핑 적용
  for (const [korean, japanese] of Object.entries(translationMap)) {
    const regex = new RegExp(korean, 'gi');
    japaneseName = japaneseName.replace(regex, japanese);
  }
  
  // 숫자 처리 (아라비아 숫자를 한자 숫자로)
  const numberMap: { [key: string]: string } = {
    '10': '十', '9': '九', '8': '八', '7': '七', '6': '六', 
    '5': '五', '4': '四', '3': '三', '2': '二', '1': '一'
  };
  
  for (const [num, japanese] of Object.entries(numberMap)) {
    japaneseName = japaneseName.replace(new RegExp(num, 'g'), japanese);
  }
  
  return japaneseName;
}

function categorizeProduct(name: string, description: string): string {
  const text = (name + " " + description).toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'LIFESTYLE';
}

function getRandomPrice(category: string): number {
  const priceRanges: { [key: string]: [number, number] } = {
    'BEAUTY': [1500, 12000],
    'FOOD': [300, 2500],
    'IT': [2000, 45000],
    'FASHION': [800, 8000],
    'HEALTH': [600, 6000],
    'LIFESTYLE': [400, 4000]
  };
  
  const [min, max] = priceRanges[category] || [500, 3000];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCategoryImage(category: string): string {
  const imageUrls: { [key: string]: string } = {
    'BEAUTY': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
    'FOOD': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=300&fit=crop',
    'IT': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop',
    'FASHION': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
    'HEALTH': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
    'LIFESTYLE': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop'
  };
  
  return imageUrls[category] || imageUrls['LIFESTYLE'];
}

async function processUpdatedDonkiExcel() {
  try {
    console.log("=== 업데이트된 돈키호테 Excel 파일 처리 시작 ===");
    
    // Excel 파일 읽기
    const workbook = XLSX.readFile('attached_assets/japanese_products_donki.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Excel에서 ${rawData.length}개의 상품을 읽었습니다.`);
    
    // 기존 데이터 삭제
    console.log("기존 데이터를 삭제하는 중...");
    await db.delete(userProducts);
    await db.delete(products);
    console.log("기존 데이터 삭제 완료");
    
    // 중복 검사
    console.log("\n=== 중복 상품 검사 ===");
    const productNames = rawData.map((item: any) => item.products_name?.toLowerCase().trim()).filter(Boolean);
    const uniqueNames = new Set(productNames);
    
    if (uniqueNames.size < productNames.length) {
      const duplicateCount = productNames.length - uniqueNames.size;
      console.log(`⚠️  중복 상품 발견: ${duplicateCount}개`);
      
      // 중복 상품 목록 표시
      const nameCount = new Map();
      productNames.forEach(name => {
        nameCount.set(name, (nameCount.get(name) || 0) + 1);
      });
      
      const duplicates = Array.from(nameCount.entries()).filter(([name, count]) => count > 1);
      
      if (duplicates.length > 0) {
        console.log("================================================================================");
        console.log("행번호    제품명                           일본어명                    설명");
        console.log("================================================================================");
        
        let rowNum = 2; // Excel 행 번호 (헤더 다음부터)
        for (const item of rawData as any[]) {
          const productName = item.products_name?.toLowerCase().trim();
          if (duplicates.some(([name]) => name === productName)) {
            const japaneseName = generateJapaneseName(item.products_name || '');
            const description = (item.description || '').substring(0, 20) + '...';
            console.log(`${rowNum.toString().padEnd(8)} ${(item.products_name || '').padEnd(30)} ${japaneseName.padEnd(25)} ${description}`);
          }
          rowNum++;
        }
        console.log("================================================================================");
      }
    } else {
      console.log("✅ 중복 상품이 발견되지 않았습니다.");
    }
    
    // 상품 데이터 처리
    console.log("\n=== 상품 데이터 처리 중 ===");
    const processedProducts = [];
    
    for (const item of rawData as any[]) {
      const name = item.products_name?.trim();
      const description = item.description?.trim();
      const sellingPlace = item.selling_place?.trim() || 'donkihote';
      
      if (!name || !description) {
        continue;
      }
      
      // 일본어 제품명 생성
      const nameJapanese = generateJapaneseName(name);
      
      // 카테고리 결정
      const category = categorizeProduct(name, description);
      
      // 가격 설정
      const price = getRandomPrice(category);
      
      // 이미지 URL
      const imageUrl = getCategoryImage(category);
      
      // 해시태그
      const hashtags = [`#${category.toLowerCase()}`, "#돈키호테", "#일본쇼핑", "#여행필수템"];
      
      processedProducts.push({
        name,
        nameJapanese,
        description,
        price,
        imageUrl,
        countryId: 'japan',
        category,
        hashtags,
        location: null,
        storeType: sellingPlace,
        featured: false
      });
    }
    
    console.log(`${processedProducts.length}개의 상품을 데이터베이스에 삽입하는 중...`);
    
    // 배치 삽입 (50개씩)
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < processedProducts.length; i += batchSize) {
      const batch = processedProducts.slice(i, i + batchSize);
      await db.insert(products).values(batch);
      insertedCount += batch.length;
      console.log(`${insertedCount}/${processedProducts.length} 상품 삽입 완료`);
    }
    
    // 카테고리별 통계
    console.log("\n=== 카테고리별 상품 수 ===");
    const categoryStats: { [key: string]: number } = {};
    processedProducts.forEach(product => {
      categoryStats[product.category] = (categoryStats[product.category] || 0) + 1;
    });
    
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`${category}: ${count}개`);
    });
    
    console.log("\n=== 처리 완료 ===");
    console.log(`✅ 총 ${insertedCount}개의 실제 돈키호테 상품이 데이터베이스에 추가되었습니다.`);
    console.log("✅ 모든 상품에 일본어 제품명이 자동 생성되었습니다.");
    console.log("✅ 판매 장소 구분이 설정되어 편의점, 드럭스토어 상품 추가 준비가 완료되었습니다.");
    
  } catch (error) {
    console.error("처리 오류:", error);
    throw error;
  }
}

// 스크립트 실행
processUpdatedDonkiExcel()
  .then(() => {
    console.log("성공적으로 완료되었습니다.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("실패:", error);
    process.exit(1);
  });