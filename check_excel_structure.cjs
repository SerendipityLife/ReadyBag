const XLSX = require('xlsx');

try {
  console.log("=== 업데이트된 Excel 파일 분석 ===");
  
  // Excel 파일 읽기
  const workbook = XLSX.readFile('attached_assets/japanese_products_donki.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // JSON 형태로 변환 (헤더 포함)
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  const headerData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`총 행 수: ${jsonData.length}`);
  console.log(`총 열 수: ${Object.keys(jsonData[0] || {}).length}`);
  
  // 헤더 정보
  const headers = headerData[0];
  console.log(`새로운 컬럼명: [${headers.map(h => `"${h}"`).join(', ')}]`);
  
  console.log("\n=== 각 컬럼별 상세 정보 ===");
  
  if (jsonData.length > 0) {
    Object.keys(jsonData[0]).forEach((header, index) => {
      console.log(`\n컬럼 ${index + 1}: "${header}"`);
      
      // 해당 컬럼의 데이터 통계
      const values = jsonData.map(row => row[header]).filter(val => val !== undefined && val !== null && val !== '');
      const emptyCount = jsonData.length - values.length;
      
      console.log(`  - 데이터 있는 행: ${values.length}`);
      console.log(`  - 빈 행: ${emptyCount}`);
      
      if (values.length > 0) {
        // 샘플 데이터
        console.log(`  - 샘플 데이터:`);
        values.slice(0, 3).forEach((sample, idx) => {
          const sampleStr = String(sample).length > 50 ? String(sample).substring(0, 50) + "..." : String(sample);
          console.log(`    ${idx + 1}. ${sampleStr}`);
        });
        
        // 고유값 수
        const uniqueValues = new Set(values.map(val => String(val).toLowerCase().trim()));
        console.log(`  - 고유값 수: ${uniqueValues.size}`);
        
        if (uniqueValues.size < values.length) {
          console.log(`  - 중복된 값: ${values.length - uniqueValues.size}개`);
        }
      }
    });
  }
  
  console.log("\n=== 데이터 미리보기 (처음 5행) ===");
  jsonData.slice(0, 5).forEach((row, idx) => {
    console.log(`\n행 ${idx + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      const valueStr = String(value).length > 60 ? String(value).substring(0, 60) + "..." : String(value);
      console.log(`  ${key}: ${valueStr}`);
    });
  });
  
  console.log("\n✅ Excel 파일 분석 완료");
  
} catch (error) {
  console.error("분석 오류:", error.message);
}