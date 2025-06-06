import { db } from "./db/index.js";
import { products } from "./shared/schema.js";
import { eq } from "drizzle-orm";

// 카테고리 키워드 매핑
const categoryKeywords = {
  food: [
    // 음식/과자 키워드
    '과자', '초콜릿', '사탕', '젤리', '쿠키', '케이크', '빵', '라면', '우동', '소바',
    '차', '커피', '음료', '주스', '우유', '요구르트', '아이스크림',
    '김치', '된장', '고추장', '간장', '식품', '먹을거', '맛있는', '달콤한',
    '메이지', '모찌', '센베이', '도라야키', '와사비', '김', '스낵',
    '마카다미아', '죽순', '버섯', '크래커', '밀크', '카카오',
    '맛', '달콤', '고소', '씹는', '부드러운', '바삭한'
  ],
  drink: [
    // 음료 키워드  
    '음료', '차', '커피', '주스', '우유', '요구르트', '사이다', '콜라',
    '맥주', '소주', '위스키', '술', '음료수', '이온음료', '스포츠음료',
    '녹차', '홍차', '말차', '라떼', '마실거', '갈증', '시원한'
  ],
  cosmetic: [
    // 화장품/미용 키워드
    '화장품', '크림', '로션', '토너', '세럼', '마스크', '팩', '클렌징', '선크림',
    '립스틱', '립밤', '아이크림', 'BB크림', '파운데이션', '마스카라', '아이라이너',
    '샴푸', '린스', '바디워시', '비누', '향수', '데오도란트', '핸드크림',
    '미용', '피부', '보습', '진정', '미백', '안티에이징', '자외선', 'SPF',
    '바를거', '발라주는', '바르면', '피부에', '얼굴에', '손에',
    'MINON', '메디큐브', 'PDRN', '시카', '핑크'
  ],
  health: [
    // 건강/의약품 키워드
    '영양제', '비타민', '약', '의약품', '건강', '눈건강', '관절', '소화제',
    '감기약', '두통약', '진통제', '파스', '밴드', '소독제', '연고',
    '영양', '건강기능식품', '보충제', '미네랄', '오메가',
    '메나리', '복용', '먹는', '건강에'
  ],
  lifestyle: [
    // 생활용품 키워드
    '안대', '마스크', '아이마스크', '온열', '증기', '숙면', '수면',
    '클리너', '닦기', '청소', '세제', '섬유유연제', '표백제',
    '휴지', '물티슈', '생리대', '기저귀', '면봉', '화장지',
    '생활용품', '일용품', '편의용품', '휴대성', '실용적',
    '메구리즘', '후키후키', '안경', '스마트폰', '닦는',
    '피로', '힐링', '편안한', '릴랙스'
  ],
  clothing: [
    // 의류/패션 키워드
    '옷', '의류', '셔츠', '바지', '치마', '드레스', '자켓', '코트',
    '속옷', '양말', '신발', '가방', '모자', '장갑', '스카프',
    '패션', '스타일', '착용', '입는', '입을거', '패셔너블',
    '브랜드', '디자인', '소재', '면', '실크', '울'
  ],
  tech: [
    // 전자제품/IT 키워드
    '전자', '디지털', '스마트폰', '태블릿', '이어폰', '헤드폰', '충전기',
    '케이블', '배터리', 'USB', '블루투스', '와이파이',
    'IT', '기술', '전자제품', '가전', '디바이스'
  ]
};

// 상품 설명을 기반으로 카테고리 결정
function categorizeProduct(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  
  // 각 카테고리별 점수 계산
  const scores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches) {
        scores[category] += matches.length;
      }
    }
  }
  
  // 가장 높은 점수의 카테고리 찾기
  let maxScore = 0;
  let bestCategory = 'etc';
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }
  
  // 점수가 0이면 기타로 분류
  if (maxScore === 0) {
    return 'etc';
  }
  
  // health는 lifestyle로 통합 (생활용품에 포함)
  if (bestCategory === 'health') {
    return 'lifestyle';
  }
  
  // tech는 etc로 분류 (별도 카테고리 없음)
  if (bestCategory === 'tech') {
    return 'etc';
  }
  
  // drink는 food로 통합
  if (bestCategory === 'drink') {
    return 'food';
  }
  
  // lifestyle는 etc로 분류 (기타 생활용품)
  if (bestCategory === 'lifestyle') {
    return 'etc';
  }
  
  return bestCategory;
}

async function updateProductCategories() {
  console.log("상품 카테고리 업데이트 시작...");
  
  try {
    // 모든 상품 조회
    const allProducts = await db.query.products.findMany();
    console.log(`총 ${allProducts.length}개 상품 발견`);
    
    let updatedCount = 0;
    const categoryStats: Record<string, number> = {
      food: 0,
      cosmetic: 0,
      clothing: 0,
      etc: 0
    };
    
    // 각 상품의 카테고리 재분류
    for (const product of allProducts) {
      const newCategory = categorizeProduct(product.name, product.description);
      
      // 카테고리가 변경된 경우에만 업데이트
      if (product.purposeCategory !== newCategory) {
        await db
          .update(products)
          .set({ purposeCategory: newCategory })
          .where(eq(products.id, product.id));
        
        console.log(`[${product.id}] ${product.name}: ${product.purposeCategory} → ${newCategory}`);
        updatedCount++;
      }
      
      categoryStats[newCategory]++;
    }
    
    console.log("\n=== 카테고리 업데이트 완료 ===");
    console.log(`업데이트된 상품: ${updatedCount}개`);
    console.log("\n=== 최종 카테고리 분포 ===");
    console.log(`먹을거 (food): ${categoryStats.food}개`);
    console.log(`바를거 (cosmetic): ${categoryStats.cosmetic}개`);
    console.log(`입을거 (clothing): ${categoryStats.clothing}개`);
    console.log(`기타 (etc): ${categoryStats.etc}개`);
    
  } catch (error) {
    console.error("카테고리 업데이트 중 오류 발생:", error);
  }
}

// 스크립트 실행
updateProductCategories();