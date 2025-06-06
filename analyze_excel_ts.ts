import * as fs from 'fs';

const XLSX = require('xlsx');

function analyzeExcelFile() {
  try {
    console.log("=== 업데이트된 Excel 파일 분석 ===");
    
    // Excel 파일 읽기
    const workbook = XLSX.readFile('attached_assets/japanese_products_donki.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`총 행 수: ${data.length}`);
    
    if (data.length === 0) {
      console.log("데이터가 없습니다.");
      return;
    }
    
    // 헤더 정보 (첫 번째 행)
    const headers = data[0] as string[];
    console.log(`총 열 수: ${headers.length}`);
    console.log(`새로운 컬럼명: ${JSON.stringify(headers)}`);
    
    // 데이터 행들 (헤더 제외)
    const dataRows = data.slice(1);
    console.log(`실제 데이터 행 수: ${dataRows.length}`);
    
    console.log("\n=== 각 컬럼별 상세 정보 ===");
    
    headers.forEach((header, colIndex) => {
      console.log(`\n컬럼 ${colIndex + 1}: '${header}'`);
      
      // 해당 컬럼의 모든 값들 추출
      const columnValues = dataRows.map(row => (row as any[])[colIndex]).filter(val => val !== undefined && val !== null && val !== '');
      
      console.log(`  - 데이터 있는 행: ${columnValues.length}`);
      console.log(`  - 빈 행: ${dataRows.length - columnValues.length}`);
      
      if (columnValues.length > 0) {
        // 샘플 데이터 표시
        console.log(`  - 샘플 데이터:`);
        const samples = columnValues.slice(0, 5);
        samples.forEach((sample, idx) => {
          const sampleStr = String(sample).length > 60 ? String(sample).substring(0, 60) + "..." : String(sample);
          console.log(`    ${idx + 1}. ${sampleStr}`);
        });
        
        // 고유값 수 계산
        const uniqueValues = new Set(columnValues.map(val => String(val).toLowerCase().trim()));
        console.log(`  - 고유값 수: ${uniqueValues.size}`);
        
        // 중복 검사
        if (uniqueValues.size < columnValues.length) {
          const duplicateCount = columnValues.length - uniqueValues.size;
          console.log(`  - 중복된 값: ${duplicateCount}개`);
        }
      }
    });
    
    console.log("\n=== 전체 데이터 미리보기 (처음 10행) ===");
    console.log("행번호", headers.join(" | "));
    console.log("-".repeat(80));
    
    dataRows.slice(0, 10).forEach((row, idx) => {
      const rowData = (row as any[]).map(cell => {
        const cellStr = String(cell || '');
        return cellStr.length > 15 ? cellStr.substring(0, 15) + "..." : cellStr;
      });
      console.log(`${idx + 1}    ${rowData.join(" | ")}`);
    });
    
    console.log("\n=== 중복 데이터 검사 ===");
    headers.forEach((header, colIndex) => {
      const columnValues = dataRows.map(row => (row as any[])[colIndex]).filter(val => val !== undefined && val !== null && val !== '');
      
      if (columnValues.length > 0) {
        const valueCount = new Map();
        columnValues.forEach(val => {
          const key = String(val).toLowerCase().trim();
          valueCount.set(key, (valueCount.get(key) || 0) + 1);
        });
        
        const duplicates = Array.from(valueCount.entries()).filter(([key, count]) => count > 1);
        
        if (duplicates.length > 0) {
          console.log(`\n'${header}' 컬럼 중복값: ${duplicates.length}개 고유값이 중복됨`);
          console.log("  중복된 값들:");
          duplicates.slice(0, 5).forEach(([value, count]) => {
            const valueStr = value.length > 30 ? value.substring(0, 30) + "..." : value;
            console.log(`    '${valueStr}': ${count}회`);
          });
        }
      }
    });
    
    console.log("\n✅ Excel 파일 분석이 완료되었습니다.");
    
  } catch (error) {
    console.error("Excel 파일 분석 오류:", error);
  }
}

// 실행
analyzeExcelFile();