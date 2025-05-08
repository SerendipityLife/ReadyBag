/**
 * 일본 여행 쇼핑 관련 트렌딩 키워드 목록
 * 
 * 이 데이터는 제품 검색 쿼리 및 인기 검색어 표시에 사용됩니다.
 * 카테고리별로 그룹화되어 있어 사용자 인터페이스에서 다양하게 활용할 수 있습니다.
 */

export type TrendingKeyword = {
  id: string;      // 고유 식별자
  text: string;    // 표시될 텍스트 
  category: string; // 키워드 카테고리
  weight: number;  // 인기도 가중치 (1-10)
  related?: string[]; // 관련 키워드
};

export type KeywordCategory = {
  id: string;
  name: string;
  description: string;
};

export const KEYWORD_CATEGORIES: KeywordCategory[] = [
  {
    id: "general",
    name: "일반",
    description: "일본 쇼핑 및 여행 관련 일반 키워드"
  },
  {
    id: "beauty",
    name: "뷰티",
    description: "화장품, 스킨케어, 미용 관련 키워드"
  },
  {
    id: "food",
    name: "식품",
    description: "일본 식품 및 음료 관련 키워드"
  },
  {
    id: "fashion",
    name: "패션",
    description: "의류, 액세서리, 브랜드 관련 키워드"
  },
  {
    id: "electronics",
    name: "전자제품",
    description: "가전제품, 전자기기 관련 키워드"
  },
  {
    id: "souvenirs",
    name: "기념품",
    description: "기념품 및 선물 관련 키워드"
  }
];

/**
 * 일본 여행 쇼핑 관련 트렌딩 키워드 배열
 */
export const TRENDING_KEYWORDS: TrendingKeyword[] = [
  // 일반 카테고리
  {
    id: "japan_shopping",
    text: "일본 쇼핑",
    category: "general",
    weight: 10,
    related: ["도쿄 쇼핑", "오사카 쇼핑", "일본 여행"]
  },
  {
    id: "don_quijote",
    text: "돈키호테",
    category: "general",
    weight: 9,
    related: ["돈키 쇼핑", "돈키호테 인기상품", "돈키호테 면세"]
  },
  {
    id: "japan_duty_free",
    text: "일본 면세점",
    category: "general",
    weight: 8,
    related: ["나리타 면세점", "하네다 면세점", "간사이 면세점"]
  },
  {
    id: "tokyo_shopping",
    text: "도쿄 쇼핑",
    category: "general",
    weight: 9,
    related: ["신주쿠 쇼핑", "시부야 쇼핑", "긴자 쇼핑"]
  },
  {
    id: "osaka_shopping",
    text: "오사카 쇼핑",
    category: "general",
    weight: 8,
    related: ["신사이바시 쇼핑", "도톤보리 쇼핑", "난바 쇼핑"]
  },
  {
    id: "japan_daiso",
    text: "일본 다이소 인기상품",
    category: "general",
    weight: 7,
    related: ["다이소 추천", "100엔숍", "300엔숍"]
  },
  {
    id: "japan_drugstore",
    text: "일본 드럭스토어",
    category: "general",
    weight: 9,
    related: ["마츠모토 키요시", "순도", "웰시아"]
  },

  // 뷰티 카테고리
  {
    id: "japan_beauty",
    text: "일본 뷰티템",
    category: "beauty",
    weight: 10,
    related: ["일본 화장품", "일본 스킨케어", "일본 코스메"]
  },
  {
    id: "japan_skincare",
    text: "일본 스킨케어",
    category: "beauty",
    weight: 9,
    related: ["시세이도", "SK-II", "DHC"]
  },
  {
    id: "japan_cosmetics",
    text: "일본 화장품",
    category: "beauty",
    weight: 9,
    related: ["캔메이크", "케이트", "메이블린"]
  },
  {
    id: "japan_sunscreen",
    text: "일본 선크림",
    category: "beauty",
    weight: 8,
    related: ["아넷사", "비오레", "알리즈"]
  },
  {
    id: "japan_facemask",
    text: "일본 마스크팩",
    category: "beauty",
    weight: 7,
    related: ["룰루룬", "크라시에", "코세"]
  },

  // 식품 카테고리
  {
    id: "japan_snacks",
    text: "일본 과자",
    category: "food",
    weight: 10,
    related: ["도쿄바나나", "기츠네센베이", "시로이코이비토"]
  },
  {
    id: "japan_chocolate",
    text: "일본 초콜릿",
    category: "food",
    weight: 8,
    related: ["로이스", "메이지", "기타카트"]
  },
  {
    id: "japan_ramen",
    text: "일본 라면",
    category: "food",
    weight: 9,
    related: ["이치란", "닛신", "삿포로 이치방"]
  },
  {
    id: "tokyo_banana",
    text: "도쿄바나나",
    category: "food",
    weight: 7,
    related: ["도쿄 기념품", "일본 과자", "도쿄 선물"]
  },
  {
    id: "japan_matcha",
    text: "일본 말차",
    category: "food",
    weight: 7,
    related: ["교토 말차", "말차 과자", "말차 음료"]
  },

  // 패션 카테고리
  {
    id: "uniqlo_japan",
    text: "유니클로 일본",
    category: "fashion",
    weight: 9,
    related: ["유니클로 한정판", "유니클로 UT", "유니클로 할인"]
  },
  {
    id: "muji_japan",
    text: "무인양품 일본",
    category: "fashion",
    weight: 8,
    related: ["무지 의류", "무지 생활용품", "무지 문구"]
  },
  {
    id: "japan_fashion",
    text: "일본 패션",
    category: "fashion",
    weight: 7,
    related: ["하라주쿠 패션", "시부야 패션", "도쿄 패션"]
  },
  {
    id: "japan_streetwear",
    text: "일본 스트릿패션",
    category: "fashion",
    weight: 6,
    related: ["하라주쿠 스타일", "아베바토슨", "베이프"]
  },

  // 전자제품 카테고리
  {
    id: "japan_electronics",
    text: "일본 전자제품",
    category: "electronics",
    weight: 10,
    related: ["빅카메라", "요도바시", "에디온"]
  },
  {
    id: "japan_camera",
    text: "일본 카메라",
    category: "electronics",
    weight: 8,
    related: ["캐논", "니콘", "소니"]
  },
  {
    id: "nintendo_switch",
    text: "닌텐도 스위치",
    category: "electronics",
    weight: 9,
    related: ["닌텐도 게임", "스위치 한정판", "스위치 악세서리"]
  },
  {
    id: "japan_watches",
    text: "일본 시계",
    category: "electronics",
    weight: 7,
    related: ["세이코", "카시오", "시티즌"]
  },

  // 기념품 카테고리
  {
    id: "tokyo_souvenirs",
    text: "도쿄 기념품",
    category: "souvenirs",
    weight: 8,
    related: ["도쿄 선물", "도쿄 쇼핑", "도쿄타워 기념품"]
  },
  {
    id: "japan_stationery",
    text: "일본 문구",
    category: "souvenirs",
    weight: 7,
    related: ["지브리 문구", "산리오 문구", "일본 필기구"]
  },
  {
    id: "japan_gifts",
    text: "일본 선물",
    category: "souvenirs",
    weight: 8,
    related: ["일본 기념품", "일본 선물 추천", "직장 동료 선물"]
  },
  {
    id: "japan_traditional",
    text: "일본 전통 기념품",
    category: "souvenirs",
    weight: 6,
    related: ["일본 부채", "일본 냄비받침", "일본 목각인형"]
  }
];

/**
 * 간단한 배열 형태의 트렌딩 키워드 (문자열만 포함)
 * 검색 쿼리나 태그 클라우드와 같은 간단한 용도로 사용
 */
export const SIMPLE_TRENDING_KEYWORDS: string[] = [
  "일본 쇼핑",
  "도쿄 기념품",
  "일본 드럭스토어",
  "일본 뷰티템",
  "일본 다이소 인기상품",
  "돈키호테",
  "유니클로 일본",
  "일본 과자",
  "일본 전자제품",
  "일본 화장품",
  "도쿄바나나",
  "닌텐도 스위치",
  "일본 면세점",
  "무인양품 일본",
  "일본 선물",
  "일본 스킨케어",
  "일본 라면",
  "일본 시계",
  "빅카메라",
  "일본 선크림",
  "마츠모토 키요시",
  "일본 문구",
  "지브리 굿즈",
  "하라주쿠 쇼핑",
  "오사카 쇼핑"
];