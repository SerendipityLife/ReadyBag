import { db } from "./index";
import {
  products,
} from "@shared/schema";
import { eq } from "drizzle-orm";

// 이 스크립트는 기존 상품을 모두 삭제하고 CSV 파일에서 가져온 일본 상품들로 데이터베이스를 다시 채웁니다
async function resetAndSeedProducts() {
  try {
    console.log("데이터베이스 상품 초기화 및 재설정 시작...");
    
    // 1. 모든 기존 상품 삭제
    console.log("기존 상품 삭제 중...");
    await db.delete(products);
    
    // 2. CSV 파일에서 가져온 상품 데이터 추가
    console.log("새로운 상품 데이터 추가 중...");
    
    // CSV에서 가져온 상품 데이터
    const newProducts = [
      // IT 제품
      {
        name: "애플 아이패드 9세대 (Wi-Fi 64GB)",
        description: "일본 내에서 구매 가능한 애플 아이패드 9세대 Wi-Fi 모델. 전국적으로 판매되며 빅카메라나 애플 스토어에서 구매 가능합니다.",
        price: 50000,
        imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "IT",
        hashtags: ["애플", "아이패드", "일본전자제품"],
        location: "애플스토어, 빅카메라 등 전국 매장",
        featured: true,
      },
      {
        name: "소니 무선이어폰 WF-1000XM5",
        description: "소니의 최신 노이즈 캔슬링 무선 이어폰. 일본에서 약 33,000~38,000엔에 요도바시카메라와 빅카메라에서 구매 가능합니다.",
        price: 35000,
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "IT",
        hashtags: ["소니", "이어폰", "일본전자제품"],
        location: "요도바시카메라, 빅카메라 등 전국 매장",
        featured: false,
      },
      {
        name: "닌텐도 스위치 OLED 모델",
        description: "더 커진 7인치 OLED 디스플레이를 탑재한 닌텐도 스위치 최신 모델. 일본 내 약 37,000~39,000엔에 판매됩니다.",
        price: 38000,
        imageUrl: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "IT",
        hashtags: ["닌텐도", "게임", "일본전자제품"],
        location: "요도바시카메라, 닌텐도 스토어, 트위스터샵",
        featured: true,
      },
      {
        name: "애플 매직 마우스 2",
        description: "애플의 인체공학적 디자인의 무선 마우스입니다. 멀티터치 표면으로 직관적인 사용이 가능합니다.",
        price: 11000,
        imageUrl: "https://images.unsplash.com/photo-1585051529508-05303d473a3a?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "IT",
        hashtags: ["애플", "마우스", "일본전자제품"],
        location: "애플스토어, 빅카메라",
        featured: false,
      },
      {
        name: "로지텍 무선 키보드 K380",
        description: "가볍고 휴대성이 좋은 로지텍의 인기 무선 키보드. 다중 기기 연결이 가능합니다.",
        price: 3500,
        imageUrl: "https://images.unsplash.com/photo-1561112078-7d24e04c3407?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "IT",
        hashtags: ["로지텍", "키보드", "일본전자제품"],
        location: "빅카메라, 아마존 재팬",
        featured: false,
      },
      
      // 화장품/뷰티 제품
      {
        name: "비오레 UV 아쿠아리치 선크림",
        description: "일본에서 가장 인기 있는 자외선 차단제 중 하나. 가볍고 산뜻한 사용감과 효과적인 자외선 차단력이 특징입니다.",
        price: 750,
        imageUrl: "https://images.unsplash.com/photo-1556229174-5e80a284afcb?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "BEAUTY",
        hashtags: ["비오레", "선크림", "일본화장품"],
        location: "마츠모토키요시 등 전국 드럭스토어",
        featured: true,
      },
      {
        name: "시세이도 아네사 퍼펙트 UV 선스크린",
        description: "시세이도의 인기 자외선 차단제. 땀과 물에 강한 워터프루프 기능을 갖춘 고급 선스크린입니다.",
        price: 2500,
        imageUrl: "https://images.unsplash.com/photo-1567733681389-585dc2dccbb8?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "BEAUTY",
        hashtags: ["시세이도", "아네사", "일본화장품"],
        location: "드럭스토어, 돈키호테, 면세점",
        featured: true,
      },
      {
        name: "캔메이크 크림치크",
        description: "일본 저가 화장품 브랜드 캔메이크의 인기 제품. 자연스러운 발색과 번짐 없는 지속력으로 인기 있는 크림 타입 블러셔입니다.",
        price: 700,
        imageUrl: "https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "BEAUTY",
        hashtags: ["캔메이크", "블러셔", "일본화장품"],
        location: "드럭스토어, 로프트",
        featured: false,
      },
      {
        name: "하다라보 고쿠쥰 로션",
        description: "히알루론산이 풍부하게 함유된 보습 로션. 저렴한 가격에 뛰어난 보습력을 자랑합니다.",
        price: 800,
        imageUrl: "https://images.unsplash.com/photo-1616002103028-c3c2496a541b?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "BEAUTY",
        hashtags: ["하다라보", "스킨케어", "일본화장품"],
        location: "드럭스토어",
        featured: false,
      },
      {
        name: "오페라 립틴트 N",
        description: "일본에서 인기 있는 립 틴트. 선명한 발색과 우수한 지속력으로 많은 사랑을 받고 있습니다.",
        price: 1600,
        imageUrl: "https://images.unsplash.com/photo-1544438706-4e18b1101522?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "BEAUTY",
        hashtags: ["오페라", "립틴트", "일본화장품"],
        location: "드럭스토어, 로프트, PLAZA",
        featured: false,
      },
      
      // 주류
      {
        name: "야마자키 12년 위스키",
        description: "일본의 대표적인 싱글 몰트 위스키. 세계적으로 인정받는 프리미엄 위스키로, 부드러운 맛과 복합적인 풍미가 특징입니다.",
        price: 18000,
        imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "LIQUOR",
        hashtags: ["야마자키", "일본위스키", "프리미엄위스키"],
        location: "주류 전문점, 면세점",
        featured: true,
      },
      {
        name: "하쿠슈 12년 위스키",
        description: "산토리에서 생산하는 싱글 몰트 위스키. 신선하고 가벼운 맛으로 야마자키와 함께 일본 위스키의 대표주자입니다.",
        price: 15000,
        imageUrl: "https://images.unsplash.com/photo-1514218953589-2d7d87afd6e8?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "LIQUOR",
        hashtags: ["하쿠슈", "일본위스키", "프리미엄위스키"],
        location: "주류 전문점, 면세점",
        featured: false,
      },
      {
        name: "다사이 23 사케",
        description: "일본의 프리미엄 준마이 다이긴조 사케. 쌀을 23%까지 정미한 고급 사케로, 깨끗하고 부드러운 맛이 특징입니다.",
        price: 6000,
        imageUrl: "https://images.unsplash.com/photo-1578559117711-29f7add363a9?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "LIQUOR",
        hashtags: ["다사이", "사케", "일본술"],
        location: "사케 전문점, 백화점",
        featured: false,
      },
      
      // 의약품/건강
      {
        name: "로이히츠보코 파스",
        description: "일본의 대표적인 파스 제품. 근육통과 관절통 완화에 효과적이며, 일본 여행객들 사이에서 인기 있는 기념품입니다.",
        price: 400,
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "HEALTH",
        hashtags: ["로이히", "파스", "일본의약품"],
        location: "드럭스토어, 돈키호테",
        featured: true,
      },
      {
        name: "에바A 진통제",
        description: "두통, 생리통에 효과적인 일본의 인기 진통제. 카페인이 함유되어 있어 빠른 효과를 볼 수 있습니다.",
        price: 600,
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "HEALTH",
        hashtags: ["에바", "진통제", "일본의약품"],
        location: "드럭스토어",
        featured: false,
      },
      {
        name: "산테 FX NEO 안약",
        description: "일본의 인기 안약. 눈의 피로와 충혈을 완화시키며 시원한 청량감을 주는 제품입니다.",
        price: 1200,
        imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "HEALTH",
        hashtags: ["산테", "안약", "일본의약품"],
        location: "드럭스토어, 돈키호테",
        featured: false,
      },
      
      // 식품/간식
      {
        name: "도쿄 바나나 (Tokyo Banana)",
        description: "도쿄를 대표하는 과자 중 하나로, 바나나 모양의 케이크 안에 바나나 크림이 들어있는 인기 기념품입니다.",
        price: 1200,
        imageUrl: "https://images.unsplash.com/photo-1534312527009-56c7016453e6?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "FOOD",
        hashtags: ["도쿄바나나", "일본과자", "도쿄기념품"],
        location: "공항, 기차역 키오스크",
        featured: true,
      },
      {
        name: "로이스 생초콜릿 (Royce Nama Chocolate)",
        description: "홋카이도 특산품인 고급 생초콜릿. 부드러운 텍스처와 깊은 맛으로 유명합니다.",
        price: 750,
        imageUrl: "https://images.unsplash.com/photo-1549007994-cb8bed85524c?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "FOOD",
        hashtags: ["로이스", "초콜릿", "홋카이도"],
        location: "로이스 매장, 백화점",
        featured: false,
      },
      {
        name: "킷캣 일본 한정맛 (녹차, 사케 등)",
        description: "일본에서만 구할 수 있는 특별한 맛의 킷캣 초콜릿. 녹차, 딸기, 사케 등 다양한 일본 현지 맛으로 출시됩니다.",
        price: 400,
        imageUrl: "https://images.unsplash.com/photo-1581226085223-81ef08740880?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "FOOD",
        hashtags: ["킷캣", "초콜릿", "일본과자"],
        location: "편의점, 슈퍼마켓, 기념품점",
        featured: false,
      },
      
      // 캐릭터 굿즈
      {
        name: "포켓몬 키링",
        description: "일본 오리지널 포켓몬 캐릭터 키링. 다양한 포켓몬 캐릭터 디자인으로 제공됩니다.",
        price: 800,
        imageUrl: "https://images.unsplash.com/photo-1613771404784-3a9b1a1300af?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "CHARACTER",
        hashtags: ["포켓몬", "키링", "일본캐릭터"],
        location: "포켓몬 센터, 돈키호테",
        featured: true,
      },
      {
        name: "지브리 캐릭터 인형",
        description: "지브리 스튜디오의 인기 캐릭터 인형. 토토로, 가오나시, 포뇨 등 다양한 캐릭터로 제공됩니다.",
        price: 2000,
        imageUrl: "https://images.unsplash.com/photo-1598799115142-afc4909bcc3b?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "CHARACTER",
        hashtags: ["지브리", "인형", "토토로"],
        location: "지브리샵 (도쿄/오사카)",
        featured: false,
      },
      
      // 의류/잡화
      {
        name: "유니클로 히트텍 이너웨어",
        description: "유니클로의 대표적인 보온 내의. 얇지만 효과적인 보온력으로 겨울철 필수 아이템입니다.",
        price: 1200,
        imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "FASHION",
        hashtags: ["유니클로", "히트텍", "일본패션"],
        location: "유니클로 매장, 공항점",
        featured: true,
      },
      {
        name: "포터(Porter) 탱커 백",
        description: "일본의 인기 가방 브랜드 포터의 대표 모델. 내구성이 뛰어나고 실용적인 디자인으로 인기가 많습니다.",
        price: 25000,
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "FASHION",
        hashtags: ["포터", "가방", "일본패션"],
        location: "포터 매장, 백화점",
        featured: false,
      },
      {
        name: "오니츠카 타이거 멕시코66 스니커즈",
        description: "일본의 클래식 스니커즈 브랜드. 레트로한 디자인과 편안한 착용감으로 세계적인 인기를 얻고 있습니다.",
        price: 12000,
        imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "FASHION",
        hashtags: ["오니츠카타이거", "스니커즈", "일본패션"],
        location: "오니츠카 타이거 매장, 백화점",
        featured: false,
      },
      
      // 전자제품/가전
      {
        name: "파나소닉 나노케어 드라이기 EH-NA0J",
        description: "나노이 기술을 적용해 모발에 수분을 공급하며 건조시켜주는 고급 헤어 드라이어입니다.",
        price: 30000,
        imageUrl: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "ELECTRONICS",
        hashtags: ["파나소닉", "드라이기", "일본가전"],
        location: "빅카메라, 요도바시카메라",
        featured: true,
      },
      {
        name: "샤프 플라즈마클러스터 공기청정기",
        description: "샤프의 플라즈마클러스터 기술이 적용된 고성능 공기청정기. 미세먼지와 냄새 제거에 효과적입니다.",
        price: 20000,
        imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "ELECTRONICS",
        hashtags: ["샤프", "공기청정기", "일본가전"],
        location: "가전 양판점, 빅카메라",
        featured: false,
      },
      {
        name: "타이거 미니 전기밥솥 3컵용",
        description: "컴팩트한 사이즈의 고품질 일본 전기밥솥. 1-3인 가구에 적합한 사이즈입니다.",
        price: 10000,
        imageUrl: "https://images.unsplash.com/photo-1544233726-9f1d2cfe73c5?auto=format&fit=crop&w=800&h=400&q=80",
        countryId: "japan",
        category: "ELECTRONICS",
        hashtags: ["타이거", "밥솥", "일본가전"],
        location: "빅카메라, 요도바시카메라",
        featured: false,
      }
    ];
    
    // 데이터베이스에 상품 추가
    const productsWithTimestamps = newProducts.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    await db.insert(products).values(productsWithTimestamps);
    
    console.log(`${productsWithTimestamps.length}개의 상품이 성공적으로 추가되었습니다.`);
  } catch (error) {
    console.error("상품 데이터 초기화 및 추가 중 오류 발생:", error);
  }
}

// 스크립트 실행
resetAndSeedProducts();