import { db } from "./index";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

// 기존 카테고리를 새로운 용도 카테고리로 매핑
const categoryToPurposeMap: { [key: string]: string } = {
  'BEAUTY': 'cosmetic',
  'FOOD': 'food', 
  'HEALTH': 'etc',
  'IT': 'etc',
  'FASHION': 'clothing',
  'LIFESTYLE': 'etc'
};

async function migrateToNewCategories() {
  try {
    console.log("=== 새로운 카테고리 시스템으로 마이그레이션 시작 ===");
    
    // 1. 먼저 새 컬럼들을 추가하는 SQL 실행
    console.log("1. 새로운 컬럼 추가 중...");
    await db.execute(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS purpose_category text,
      ALTER COLUMN store_type SET NOT NULL
    `);
    
    // 2. 기존 데이터의 category 컬럼을 기반으로 purpose_category 설정
    console.log("2. 기존 카테고리를 새로운 용도 카테고리로 변환 중...");
    
    const allProducts = await db.query.products.findMany();
    console.log(`총 ${allProducts.length}개 상품 처리 중...`);
    
    let updateCount = 0;
    for (const product of allProducts) {
      const oldCategory = (product as any).category;
      const purposeCategory = categoryToPurposeMap[oldCategory] || 'etc';
      
      await db.update(products)
        .set({ 
          purposeCategory,
          storeType: product.storeType || 'donkihote'
        })
        .where(eq(products.id, product.id));
      
      updateCount++;
      if (updateCount % 50 === 0) {
        console.log(`${updateCount}/${allProducts.length} 상품 업데이트 완료`);
      }
    }
    
    console.log(`전체 ${updateCount}개 상품 업데이트 완료`);
    
    // 3. 기존 category 컬럼 삭제
    console.log("3. 기존 category 컬럼 삭제 중...");
    await db.execute(`ALTER TABLE products DROP COLUMN IF EXISTS category`);
    
    // 4. 용도별 통계 출력
    console.log("\n=== 새로운 용도별 상품 수 ===");
    const purposeStats = await db.execute(`
      SELECT purpose_category, COUNT(*) as count 
      FROM products 
      GROUP BY purpose_category
    `);
    
    for (const stat of purposeStats as any[]) {
      const purposeName = {
        'food': '먹을거',
        'drink': '마실거', 
        'cosmetic': '바를거',
        'clothing': '입을거',
        'etc': '기타'
      }[stat.purpose_category] || stat.purpose_category;
      
      console.log(`${purposeName}: ${stat.count}개`);
    }
    
    console.log("\n=== 마이그레이션 완료 ===");
    console.log("✅ 기존 카테고리 시스템이 새로운 두단계 카테고리로 성공적으로 변경되었습니다.");
    console.log("✅ 상위 카테고리: 판매처 (donkihote, convenience, drugstore)");
    console.log("✅ 하위 카테고리: 용도 (먹을거, 마실거, 바를거, 입을거, 기타)");
    
  } catch (error) {
    console.error("마이그레이션 오류:", error);
    throw error;
  }
}

// 스크립트 실행
migrateToNewCategories()
  .then(() => {
    console.log("마이그레이션이 성공적으로 완료되었습니다.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("마이그레이션 실패:", error);
    process.exit(1);
  });