import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add font imports
const fontStyles = document.createElement("link");
fontStyles.rel = "stylesheet";
fontStyles.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@300;400;500;600&family=Poppins:wght@500;600;700&display=swap";
document.head.appendChild(fontStyles);

// Set title and meta tags
document.title = "Serendipity - 여행 쇼핑 추천 플랫폼";
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "Serendipity는 여행 날짜별로 상품을 관리하고 숙박지 기반 주변 시설을 찾을 수 있는 스마트 여행 쇼핑 플랫폼입니다. Tinder 스타일로 쇼핑 목록을 쉽게 관리하세요.";
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
