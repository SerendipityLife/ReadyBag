import { db } from '.';
import { products } from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

async function updateProductDescriptions() {
  try {
    console.log('상품 설명 업데이트 시작...');
    
    // CSV 파일 읽기
    const csvFilePath = path.resolve(process.cwd(), 'temp_japan_products.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // CSV 파싱
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    let updatedCount = 0;
    
    // 각 레코드에 대해 업데이트 수행
    for (const record of records) {
      const productId = parseInt(record.id);
      const description = record.description;
      
      if (isNaN(productId) || !description) {
        console.warn(`잘못된 데이터 항목 무시: ID=${record.id}`);
        continue;
      }
      
      // 데이터베이스 업데이트
      const result = await db.update(products)
        .set({ description })
        .where(eq(products.id, productId))
        .returning({ id: products.id });
      
      if (result.length > 0) {
        updatedCount++;
        console.log(`상품 ID ${productId} 업데이트 완료`);
      }
    }
    
    console.log(`총 ${updatedCount}개의 상품 설명이 업데이트되었습니다.`);
  } catch (error) {
    console.error('상품 설명 업데이트 중 오류 발생:', error);
  }
}

// 함수 실행
updateProductDescriptions()
  .then(() => {
    console.log('상품 설명 업데이트가 완료되었습니다.');
    process.exit(0);
  })
  .catch(error => {
    console.error('처리 중 오류 발생:', error);
    process.exit(1);
  });