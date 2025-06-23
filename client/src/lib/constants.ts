// Countries available in the app
export const COUNTRIES = [
  {
    id: "japan",
    name: "일본",
    code: "JP",
    currency: "JPY",
    flagUrl: "https://images.unsplash.com/photo-1543922596-b3bbaba80649?auto=format&fit=crop&w=50&h=50&q=80",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Default country to show for new users
export const DEFAULT_COUNTRY = COUNTRIES[0];

// Product Category Icons
export const CATEGORIES = {
  BEAUTY: "💄",
  FOOD: "🍣",
  ELECTRONICS: "📱", // 전자제품/가전 (통합됨: IT)
  FASHION: "👗",
  HEALTH: "💊",
  TOYS: "🧸", // 장난감 (통합됨: CHARACTER)
  LIQUOR: "🍷"
};

// 카테고리 매핑 (통합을 위한 참조 테이블)
export const CATEGORY_MAPPING = {
  // 기본 카테고리는 그대로 유지
  BEAUTY: "BEAUTY",
  FOOD: "FOOD",
  ELECTRONICS: "ELECTRONICS",
  FASHION: "FASHION",
  HEALTH: "HEALTH",
  TOYS: "TOYS",
  LIQUOR: "LIQUOR",
  
  // 통합 대상 카테고리
  IT: "ELECTRONICS", // IT → 전자제품/가전
  CHARACTER: "TOYS", // 캐릭터 굿즈 → 장난감
  
  // 삭제 대상 카테고리 (기타로 매핑)
  HOME: "ELECTRONICS",
  OTHER: "ELECTRONICS"
};

// API Routes
export const API_ROUTES = {
  PRODUCTS: "/api/products",
  PRODUCT_REVIEWS: "/api/product-reviews",
  COUNTRIES: "/api/countries",
  USER_PRODUCTS: "/api/user-products",
  SHARED_LIST: "/api/shared-list",
  CURRENCY: "/api/currency"
};

// User Product Status
export enum ProductStatus {
  INTERESTED = "interested",
  MAYBE = "maybe",
  UNSEEN = "unseen",
  SKIP = "skip",  // 건너뛰기 상태 추가
  PURCHASED = "purchased",  // 구입완료
  NOT_PURCHASED = "not_purchased"  // 미구입
}

// Status Colors
export const STATUS_COLORS = {
  [ProductStatus.INTERESTED]: "status-interested",
  [ProductStatus.MAYBE]: "status-gray"
};

// Status Icons
export const STATUS_ICONS = {
  [ProductStatus.INTERESTED]: "heart",
  [ProductStatus.MAYBE]: "help-circle"  // bookmark에서 help-circle(물음표)로 변경
};

// Swipe Directions
export enum SwipeDirection {
  RIGHT = "right",
  LEFT = "left",
  UP = "up"
}

// Swipe to Status Mapping - 스와이프 방향 수정 (요구사항에 맞게)
export const SWIPE_TO_STATUS = {
  [SwipeDirection.LEFT]: ProductStatus.SKIP,          // 왼쪽 스와이프: 건너뛰기 (저장 안 함)
  [SwipeDirection.UP]: ProductStatus.MAYBE,           // 위로 스와이프: 고민중
  [SwipeDirection.RIGHT]: ProductStatus.INTERESTED    // 오른쪽 스와이프: 관심
};

// Status to Swipe Mapping - 수정된 스와이프 방향에 맞춰 업데이트
export const STATUS_TO_SWIPE = {
  [ProductStatus.INTERESTED]: SwipeDirection.RIGHT,   // 관심 상품: 오른쪽 스와이프
  [ProductStatus.MAYBE]: SwipeDirection.UP,           // 고민중: 위로 스와이프
  [ProductStatus.SKIP]: SwipeDirection.LEFT           // 건너뛰기: 왼쪽 스와이프
};

// Views
export enum View {
  EXPLORE = "explore",
  LISTS = "lists",
  INFO = "info",
  HISTORY = "history"  // 쇼핑기록 뷰 추가
}
