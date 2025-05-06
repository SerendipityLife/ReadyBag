import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add font imports
const fontStyles = document.createElement("link");
fontStyles.rel = "stylesheet";
fontStyles.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@300;400;500;600&family=Poppins:wght@500;600;700&display=swap";
document.head.appendChild(fontStyles);

// Set title and meta tags
document.title = "ReadyBag - 여행 쇼핑 아이템 추천";
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "ReadyBag은 당신이 여행하는 국가에서 인기 있는 쇼핑 아이템을 추천해주는 앱입니다. 타인더 스타일로 당신의 쇼핑 목록을 쉽게 관리하세요.";
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
