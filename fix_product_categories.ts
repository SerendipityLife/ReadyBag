import { db } from "./db/index.js";
import { products } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function fixProductCategories() {
  console.log("상품 카테고리 정확한 재분류 시작...");
  
  try {
    // 모든 상품 조회
    const allProducts = await db.query.products.findMany();
    console.log(`총 ${allProducts.length}개 상품 재분류`);
    
    let updatedCount = 0;
    const categoryStats: Record<string, number> = {
      food: 0,
      cosmetic: 0,
      clothing: 0,
      etc: 0
    };
    
    for (const product of allProducts) {
      const text = `${product.name} ${product.description}`.toLowerCase();
      let newCategory = 'etc';
      
      // 1. 먹을거 (food) - 음식, 음료, 식품
      if (
        // 과자류
        text.includes('과자') || text.includes('초콜릿') || text.includes('사탕') || 
        text.includes('젤리') || text.includes('쿠키') || text.includes('케이크') ||
        text.includes('빵') || text.includes('크래커') || text.includes('비스킷') ||
        text.includes('스낵') || text.includes('센베이') || text.includes('모찌') ||
        text.includes('도라야키') || text.includes('마카다미아') ||
        
        // 음료류
        text.includes('음료') || text.includes('주스') || text.includes('차') ||
        text.includes('커피') || text.includes('라떼') || text.includes('우유') ||
        text.includes('요구르트') || text.includes('사이다') || text.includes('콜라') ||
        text.includes('이온음료') || text.includes('스포츠음료') ||
        
        // 식품류
        text.includes('라면') || text.includes('우동') || text.includes('소바') ||
        text.includes('카레') || text.includes('김치') || text.includes('된장') ||
        text.includes('간장') || text.includes('고추장') || text.includes('와사비') ||
        text.includes('김') || text.includes('식품') || text.includes('곤약') ||
        
        // 맛 관련 키워드
        text.includes('맛있는') || text.includes('달콤한') || text.includes('고소한') ||
        text.includes('바삭한') || text.includes('부드러운') || text.includes('씹는') ||
        
        // 브랜드/제품명
        text.includes('메이지') || text.includes('cc레몬') || text.includes('os-1') ||
        text.includes('프레츨') || text.includes('야끼소바') || text.includes('골든카레')
      ) {
        newCategory = 'food';
      }
      
      // 2. 바를거 (cosmetic) - 화장품, 스킨케어, 미용용품
      else if (
        // 기초화장품
        text.includes('크림') || text.includes('로션') || text.includes('토너') ||
        text.includes('세럼') || text.includes('에센스') || text.includes('오일') ||
        text.includes('밤') || text.includes('젤') || text.includes('팩') ||
        text.includes('마스크팩') || text.includes('클렌징') || text.includes('클렌저') ||
        
        // 색조화장품
        text.includes('파운데이션') || text.includes('bb크림') || text.includes('cc크림') ||
        text.includes('립스틱') || text.includes('립밤') || text.includes('립글로스') ||
        text.includes('아이라이너') || text.includes('마스카라') || text.includes('아이섀도') ||
        text.includes('블러셔') || text.includes('하이라이터') || text.includes('컨실러') ||
        text.includes('파우더') || text.includes('팩트') ||
        
        // 선케어
        text.includes('선크림') || text.includes('자외선') || text.includes('spf') ||
        text.includes('pa+') || text.includes('썬') ||
        
        // 헤어케어
        text.includes('샴푸') || text.includes('린스') || text.includes('트리트먼트') ||
        text.includes('헤어') ||
        
        // 바디케어
        text.includes('바디워시') || text.includes('바디로션') || text.includes('핸드크림') ||
        text.includes('바디크림') || text.includes('보디') ||
        
        // 스킨케어 키워드
        text.includes('피부') || text.includes('보습') || text.includes('진정') ||
        text.includes('미백') || text.includes('안티에이징') || text.includes('주름') ||
        text.includes('탄력') || text.includes('세안') || text.includes('각질') ||
        
        // 화장품 브랜드
        text.includes('minon') || text.includes('canmake') || text.includes('dhc') ||
        text.includes('메디큐브') || text.includes('lululun') || text.includes('pair') ||
        text.includes('멜라노') || text.includes('fancl') || text.includes('club') ||
        
        // 바르는 행위
        text.includes('바르') || text.includes('발라') || text.includes('도포') ||
        text.includes('피부에') || text.includes('얼굴에') || text.includes('손에')
      ) {
        newCategory = 'cosmetic';
      }
      
      // 3. 입을거 (clothing) - 의류, 패션용품
      else if (
        text.includes('옷') || text.includes('의류') || text.includes('셔츠') ||
        text.includes('바지') || text.includes('치마') || text.includes('드레스') ||
        text.includes('자켓') || text.includes('코트') || text.includes('속옷') ||
        text.includes('양말') || text.includes('신발') || text.includes('가방') ||
        text.includes('모자') || text.includes('장갑') || text.includes('스카프') ||
        text.includes('입는') || text.includes('착용') || text.includes('패션')
      ) {
        newCategory = 'clothing';
      }
      
      // 4. 기타 (etc) - 의약품, 생활용품, 전자제품 등
      // 나머지는 모두 기타로 분류 (이미 기본값)
      
      // 특별 처리: 의약품/건강용품은 명확히 기타로
      if (
        text.includes('진통제') || text.includes('감기약') || text.includes('두통약') ||
        text.includes('소화제') || text.includes('영양제') || text.includes('비타민') ||
        text.includes('약') || text.includes('의약품') || text.includes('파스') ||
        text.includes('안약') || text.includes('연고') || text.includes('eve') ||
        text.includes('loxonin') || text.includes('로토') || text.includes('메나리') ||
        
        // 생활용품
        text.includes('세제') || text.includes('얼룩제거제') || text.includes('청소') ||
        text.includes('클리너') || text.includes('닦기') || text.includes('top') ||
        text.includes('lion') || text.includes('후키후키') ||
        
        // 수면/릴랙스 용품
        text.includes('안대') || text.includes('아이마스크') || text.includes('온열') ||
        text.includes('메구리즘') || text.includes('숙면') || text.includes('수면')
      ) {
        newCategory = 'etc';
      }
      
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
    
    console.log("\n=== 정확한 카테고리 재분류 완료 ===");
    console.log(`업데이트된 상품: ${updatedCount}개`);
    console.log("\n=== 최종 카테고리 분포 ===");
    console.log(`먹을거 (food): ${categoryStats.food}개`);
    console.log(`바를거 (cosmetic): ${categoryStats.cosmetic}개`);
    console.log(`입을거 (clothing): ${categoryStats.clothing}개`);
    console.log(`기타 (etc): ${categoryStats.etc}개`);
    
  } catch (error) {
    console.error("카테고리 재분류 중 오류 발생:", error);
  }
}

// 스크립트 실행
fixProductCategories();