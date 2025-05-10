# Serendipity - 여행 쇼핑 추천 플랫폼

## 프로젝트 소개
Serendipity는 해외 여행 중 쇼핑을 위한 맞춤형 제품 추천 플랫폼입니다. 일본을 시작으로 여러 국가의 인기 상품을 제공하며 사용자 경험을 높이기 위한 다국어 지원과 모바일 최적화 UI를 갖추고 있습니다.

## 주요 기능
- 국가별 제품 추천
- 카테고리 필터링
- 가격 범위 설정
- 실시간 환율 반영
- 다국어 지원
- 모바일 최적화 UI

## 기술 스택
- React (TypeScript)
- Express.js
- PostgreSQL with Drizzle ORM
- TailwindCSS + ShadcnUI

## 최근 업데이트
- UI 개선: 필터 모달 창 닫기 버튼 문제 해결
- 슬라이더 컴포넌트 개선: 다중 핸들 지원
- 통화 단위 일관성 유지 (KRW)
- 불필요한 컴포넌트 정리

## 환경 설정
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 데이터베이스 스키마 적용
npm run db:push

# 초기 데이터 생성
npm run db:seed
```

## 연락처
문의 사항은 GitHub 이슈를 통해 남겨주세요.