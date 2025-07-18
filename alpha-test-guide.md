
# ReadyBag 알파테스트 가이드 📱

## 🎯 서비스 소개
ReadyBag은 일본 여행자를 위한 스마트 쇼핑 플랫폼입니다. 여행 날짜별로 관심 상품을 관리하고, 숙박지 기반으로 주변 쇼핑 시설을 찾을 수 있는 종합 여행 쇼핑 도우미입니다.

---

## 📋 주요 기능 가이드

### 1️⃣ 구경하기 탭 - 상품 탐색
![구경하기 화면](스크린샷1)

**핵심 기능:**
- **틴더 스타일 상품 탐색**: 카드를 좌우로 스와이프하여 관심상품 분류
- **실시간 환율 표시**: 100엔 = 940원 (LIVE) 환율 정보
- **진행률 표시**: 현재 탐색 진행률 (17/612)
- **3단계 액션**: 건너뛰기(❌) / 고민중(❓) / 관심(❤️)

**테스트 포인트:**
- 카드 스와이프의 자연스러움
- 상품 이미지 및 정보 표시 적절성
- 환율 정보의 명확성

---

### 2️⃣ 여행 날짜 선택
![여행날짜 선택](스크린샷2)

**핵심 기능:**
- **캘린더 기반 날짜 선택**: 직관적인 달력 인터페이스
- **여행 기간 설정**: 시작일과 종료일 선택
- **날짜별 상품 관리**: 각 여행마다 독립적인 쇼핑 리스트

**테스트 포인트:**
- 날짜 선택의 편의성
- 여행 기간 설정 로직
- 날짜별 데이터 분리 기능

---

### 3️⃣ 숙박지 주소 설정
![숙박지 설정](스크린샷3)

**핵심 기능:**
- **구글 맵스 연동**: 정확한 주소 검색
- **영문 주소 입력**: 일본 현지 주소 형식 지원
- **주변 시설 검색 기반**: 설정된 숙박지 중심으로 쇼핑 시설 탐색

**테스트 포인트:**
- 주소 검색 정확도
- 영문/일문 주소 인식률
- UI 사용성

---

### 4️⃣ 장바구니 탭 - 관심 상품
![관심 상품](스크린샷4)

**핵심 기능:**
- **관심 상품 목록**: 하트로 표시한 상품들
- **상세 정보 표시**: 상품명(한글/일본어), 가격, 환율 적용가
- **구매 액션**: "구입완료" / "미구입" 버튼
- **일괄 관리**: 전체 선택 및 삭제 기능

**테스트 포인트:**
- 상품 정보의 완성도
- 구매 상태 변경 기능
- 목록 관리 편의성

---

### 5️⃣ 장바구니 탭 - 고민중 상품
![고민중 상품](스크린샷5)

**핵심 기능:**
- **보류 상품 관리**: 결정을 미룬 상품들
- **관심으로 이동**: "모두 관심으로" 일괄 변경
- **재검토 기능**: 고민중인 상품들을 다시 평가

**테스트 포인트:**
- 상태 변경 기능
- 일괄 처리 성능
- 사용자 의도 반영도

---

### 6️⃣ 장바구니 탭 - 사러가기 (위치 서비스)
![사러가기](스크린샷6)

**핵심 기능:**
- **주변 시설 검색**: 편의점, 돈키호테 등
- **브랜드별 필터**: 세븐일레븐, 로손, 패밀리마트 등
- **거리 및 경로 안내**: 구글 맵스 연동 네비게이션

**테스트 포인트:**
- 위치 기반 검색 정확도
- 브랜드 필터링 기능
- 지도 연동 성능

---

### 7️⃣ 쇼핑기록 탭
![쇼핑기록](스크린샷7)

**핵심 기능:**
- **여행별 기록 관리**: 날짜별 쇼핑 내역
- **총 지출 요약**: 여행별 총 구매 금액
- **상품 개수 표시**: 구매한 상품 수량

**테스트 포인트:**
- 여행별 데이터 분리
- 지출 계산 정확성
- 기록 보관 기능

---

### 8️⃣ 쇼핑기록 세부 내역
![세부내역](스크린샷8)

**핵심 기능:**
- **구매 상품 목록**: 실제 구매한 상품들
- **구매 일시 기록**: 정확한 구매 시점
- **가격 정보 보관**: 구매 당시 환율 적용가

**테스트 포인트:**
- 구매 기록 정확성
- 시간 정보 저장
- 데이터 무결성

---

### 9️⃣ 상품 리뷰 기능
![리뷰 기능](스크린샷9)

**핵심 기능:**
- **구매 후 리뷰**: 실제 사용 경험 공유
- **로그인 후 이용**: 회원 전용 리뷰 시스템
- **리뷰 작성 유도**: 첫 리뷰 작성 가이드

**테스트 포인트:**
- 리뷰 작성 편의성
- 로그인 연동 기능
- 리뷰 데이터 저장

---

### 🔟 상품 필터 기능
![상품 필터](스크린샷10)

**핵심 기능:**
- **2단계 필터링**: 
  - **판매처**: 전체 / 돈키호테 / 편의점
  - **용도**: 먹을거리 / 바르는거 / 붙이는거 / 기념품 등
- **가격 범위**: ¥100 ~ ¥3,000 슬라이더 조절
- **실시간 필터링**: 조건 변경 시 즉시 상품 목록 업데이트

**테스트 포인트:**
- 필터 조합의 정확성
- 가격 범위 설정 편의성
- 필터링 성능

---

## 🧪 테스트 중점 사항

### 📱 사용성 (UX)
- [ ] 첫 사용자도 직관적으로 이용할 수 있는가?
- [ ] 터치 인터페이스가 자연스러운가?
- [ ] 정보 구조가 명확하게 전달되는가?

### ⚡ 성능
- [ ] 상품 로딩 속도는 적절한가?
- [ ] 필터링 반응 속도는 빠른가?
- [ ] 대용량 데이터 처리가 원활한가?

### 🔄 기능성
- [ ] 여행 날짜별 데이터 분리가 정확한가?
- [ ] 환율 정보가 실시간으로 반영되는가?
- [ ] 위치 기반 서비스가 정확한가?

### 📊 데이터 무결성
- [ ] 상품 분류가 정확하게 저장되는가?
- [ ] 구매 기록이 올바르게 관리되는가?
- [ ] 여행별 데이터가 섞이지 않는가?

---

## 💬 피드백 요청 사항

### 🎯 우선순위 HIGH
1. **온보딩 경험**: 처음 사용 시 어려운 부분
2. **상품 탐색**: 카드 스와이프 인터페이스의 자연스러움
3. **여행 날짜 관리**: 날짜별 상품 분리의 명확성

### 🎯 우선순위 MEDIUM
4. **필터 시스템**: 원하는 상품을 쉽게 찾을 수 있는가?
5. **위치 서비스**: 주변 시설 검색의 정확도
6. **환율 정보**: 가격 비교의 유용성

### 🎯 우선순위 LOW
7. **디자인**: 전반적인 UI/UX 만족도
8. **성능**: 로딩 시간 및 반응 속도
9. **기타**: 개선이 필요한 세부 기능

---

## 📞 테스트 참여 방법

1. **접속**: [ReadyBag 테스트 링크]
2. **회원가입**: 테스트 계정 생성 (선택사항)
3. **여행 계획**: 실제 일본 여행 계획으로 테스트
4. **피드백**: 각 기능별 사용 후기 및 개선사항 전달

**테스트 기간**: 2주간  
**피드백 마감**: [날짜 설정]  
**문의**: [연락처 정보]

---

## 🚀 향후 업데이트 예정

- 다른 국가 상품 추가 (한국, 대만 등)
- AI 기반 상품 추천 시스템
- 소셜 쇼핑 기능 (친구와 목록 공유)
- 가격 알림 서비스

ReadyBag과 함께 더 스마트한 여행 쇼핑을 경험해보세요! 🛍️✈️
