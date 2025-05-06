// Countries available in the app
export const COUNTRIES = [
  {
    id: "japan",
    name: "일본",
    code: "JP",
    currency: "JPY",
    flagUrl: "https://images.unsplash.com/photo-1543922596-b3bbaba80649?auto=format&fit=crop&w=50&h=50&q=80"
  },
  {
    id: "korea",
    name: "한국",
    code: "KR",
    currency: "KRW",
    flagUrl: "https://pixabay.com/get/g1dc6174a327c2927b80802296a20cafb06236f8da91f56a5d724515effb38b6a696427110af1c1dee706594e12decb2573f9d070ddf0c6e84a52e8dcf8d96bfc_1280.jpg"
  }
];

// Default country to show for new users
export const DEFAULT_COUNTRY = COUNTRIES[0];

// Product Category Icons
export const CATEGORIES = {
  BEAUTY: "💄",
  FOOD: "🍣",
  ELECTRONICS: "📱",
  FASHION: "👗",
  HEALTH: "💊",
  TOYS: "🧸",
  HOME: "🏠",
  OTHER: "🛍️"
};

// API Routes
export const API_ROUTES = {
  PRODUCTS: "/api/products",
  COUNTRIES: "/api/countries",
  USER_PRODUCTS: "/api/user-products",
  SHARED_LIST: "/api/shared-list",
  CURRENCY: "/api/currency"
};

// User Product Status
export enum ProductStatus {
  INTERESTED = "interested",
  NOT_INTERESTED = "notInterested",
  MAYBE = "maybe",
  UNSEEN = "unseen"
}

// Status Colors
export const STATUS_COLORS = {
  [ProductStatus.INTERESTED]: "status-interested",
  [ProductStatus.NOT_INTERESTED]: "status-notInterested",
  [ProductStatus.MAYBE]: "status-maybe"
};

// Status Icons
export const STATUS_ICONS = {
  [ProductStatus.INTERESTED]: "heart",
  [ProductStatus.NOT_INTERESTED]: "times",
  [ProductStatus.MAYBE]: "bookmark"
};

// Swipe Directions
export enum SwipeDirection {
  RIGHT = "right",
  LEFT = "left",
  UP = "up"
}

// Swipe to Status Mapping
export const SWIPE_TO_STATUS = {
  [SwipeDirection.LEFT]: ProductStatus.INTERESTED,    // 왼쪽 스와이프: 관심 상품
  [SwipeDirection.UP]: ProductStatus.MAYBE,           // 위로 스와이프: 나중에 
  [SwipeDirection.RIGHT]: ProductStatus.NOT_INTERESTED // 오른쪽 스와이프: 관심 없음
};

// Status to Swipe Mapping
export const STATUS_TO_SWIPE = {
  [ProductStatus.INTERESTED]: SwipeDirection.LEFT,    // 관심 상품: 왼쪽 스와이프
  [ProductStatus.NOT_INTERESTED]: SwipeDirection.RIGHT, // 관심 없음: 오른쪽 스와이프
  [ProductStatus.MAYBE]: SwipeDirection.UP            // 나중에: 위로 스와이프
};

// Views
export enum View {
  EXPLORE = "explore",
  LISTS = "lists",
  INFO = "info"
}
