import { db } from "./index";
import { products, userProducts } from "@shared/schema";

// Sample product data based on typical Japanese shopping items
const sampleProducts = [
  // Beauty Products
  { name: "SK-II 페이셜 트리트먼트 에센스", nameJapanese: "SK-II フェイシャル トリートメント エッセンス", description: "일본의 대표적인 프리미엄 스킨케어 에센스", category: "BEAUTY", price: 12000 },
  { name: "시세이도 선크림", nameJapanese: "資生堂 日焼け止め", description: "높은 SPF 지수의 일본산 선크림", category: "BEAUTY", price: 3500 },
  { name: "DHC 립크림", nameJapanese: "DHC リップクリーム", description: "보습력이 뛰어난 일본 립케어 제품", category: "BEAUTY", price: 800 },
  { name: "캔메이크 아이섀도우", nameJapanese: "キャンメイク アイシャドウ", description: "저렴하고 발색 좋은 일본 아이섀도우", category: "BEAUTY", price: 600 },
  { name: "하다라보 히알루론산 로션", nameJapanese: "肌ラボ ヒアルロン酸ローション", description: "히알루론산이 풍부한 보습 로션", category: "BEAUTY", price: 1200 },
  
  // Food Products
  { name: "도쿄 바나나", nameJapanese: "東京ばな奈", description: "도쿄의 대표적인 기념품 과자", category: "FOOD", price: 1500 },
  { name: "킷캣 말차맛", nameJapanese: "キットカット 抹茶味", description: "일본 한정 말차맛 킷캣", category: "FOOD", price: 800 },
  { name: "로이스 생초콜릿", nameJapanese: "ロイズ 生チョコレート", description: "부드러운 생초콜릿", category: "FOOD", price: 2000 },
  { name: "히로타 슈크림", nameJapanese: "ヒロタ シュークリーム", description: "일본의 인기 슈크림", category: "FOOD", price: 300 },
  { name: "메이지 초콜릿", nameJapanese: "明治チョコレート", description: "일본의 대표 초콜릿 브랜드", category: "FOOD", price: 500 },
  
  // IT Products
  { name: "닌텐도 스위치 게임", nameJapanese: "ニンテンドースイッチ ゲーム", description: "일본 한정 닌텐도 스위치 게임", category: "IT", price: 6000 },
  { name: "소니 이어폰", nameJapanese: "ソニー イヤホン", description: "고음질 무선 이어폰", category: "IT", price: 15000 },
  { name: "카시오 전자사전", nameJapanese: "カシオ 電子辞書", description: "일본어 학습용 전자사전", category: "IT", price: 25000 },
  { name: "후지필름 인스턴트 카메라", nameJapanese: "富士フイルム インスタントカメラ", description: "인스턴트 필름 카메라", category: "IT", price: 8000 },
  { name: "아이패드 액세서리", nameJapanese: "iPad アクセサリー", description: "일본 한정 아이패드 케이스", category: "IT", price: 3000 },
  
  // Fashion Products
  { name: "유니클로 히트텍", nameJapanese: "ユニクロ ヒートテック", description: "발열 기능성 의류", category: "FASHION", price: 2000 },
  { name: "무인양품 가방", nameJapanese: "無印良品 バッグ", description: "심플한 디자인의 가방", category: "FASHION", price: 4000 },
  { name: "일본 전통 신발", nameJapanese: "日本の伝統的な靴", description: "전통적인 일본 신발", category: "FASHION", price: 6000 },
  { name: "기모노 액세서리", nameJapanese: "着物アクセサリー", description: "기모노용 장신구", category: "FASHION", price: 3500 },
  { name: "일본 브랜드 시계", nameJapanese: "日本ブランド 時計", description: "일본 브랜드 손목시계", category: "FASHION", price: 12000 },
  
  // Health Products
  { name: "아리나민 비타민", nameJapanese: "アリナミン ビタミン", description: "피로회복용 비타민제", category: "HEALTH", price: 1500 },
  { name: "사론파스 파스", nameJapanese: "サロンパス 湿布", description: "근육통 완화 파스", category: "HEALTH", price: 800 },
  { name: "일본 마스크팩", nameJapanese: "日本のマスクパック", description: "보습 효과가 뛰어난 마스크팩", category: "HEALTH", price: 600 },
  { name: "로토 안약", nameJapanese: "ロート目薬", description: "눈 피로 완화 안약", category: "HEALTH", price: 1000 },
  { name: "일본 건강보조식품", nameJapanese: "日本の健康補助食品", description: "일본산 건강보조식품", category: "HEALTH", price: 2500 },
  
  // Lifestyle Products
  { name: "일본 문구용품", nameJapanese: "日本の文房具", description: "고품질 일본 문구용품", category: "LIFESTYLE", price: 1200 },
  { name: "다이소 생활용품", nameJapanese: "ダイソー 生活用品", description: "실용적인 100엔샵 상품", category: "LIFESTYLE", price: 100 },
  { name: "일본 수건", nameJapanese: "日本のタオル", description: "부드러운 일본산 수건", category: "LIFESTYLE", price: 1500 },
  { name: "벤토 도시락통", nameJapanese: "弁当 お弁当箱", description: "일본 전통 도시락통", category: "LIFESTYLE", price: 2000 },
  { name: "일본 주방용품", nameJapanese: "日本のキッチン用品", description: "고품질 주방 도구", category: "LIFESTYLE", price: 3000 }
];

function getCategoryImage(category: string): string {
  const imageUrls = {
    'BEAUTY': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
    'FOOD': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=300&fit=crop',
    'IT': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop',
    'FASHION': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
    'HEALTH': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
    'LIFESTYLE': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop'
  };
  
  return imageUrls[category as keyof typeof imageUrls] || imageUrls['LIFESTYLE'];
}

async function replaceProducts() {
  try {
    console.log("기존 데이터를 삭제하는 중...");
    
    // 기존 데이터 삭제
    await db.delete(userProducts);
    await db.delete(products);
    
    console.log("새 상품 데이터를 생성하는 중...");
    
    // 새 상품 데이터 생성
    const newProducts = sampleProducts.map(product => ({
      name: product.name,
      nameJapanese: product.nameJapanese,
      description: product.description,
      price: product.price,
      imageUrl: getCategoryImage(product.category),
      countryId: 'japan',
      category: product.category,
      hashtags: [`#${product.category.toLowerCase()}`, "#일본쇼핑", "#여행필수템"],
      location: null,
      featured: false
    }));
    
    console.log(`${newProducts.length}개의 상품 데이터를 데이터베이스에 삽입하는 중...`);
    
    // 배치 삽입
    await db.insert(products).values(newProducts);
    
    console.log("상품 데이터 교체가 완료되었습니다!");
    
  } catch (error) {
    console.error("오류 발생:", error);
    throw error;
  }
}

// 스크립트 실행
replaceProducts()
  .then(() => {
    console.log("성공적으로 완료되었습니다.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("실패:", error);
    process.exit(1);
  });