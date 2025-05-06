/**
 * Get Instagram hashtags for a product name
 * 
 * In a real implementation, this would call the Instagram API to search for hashtags
 * For now, we'll return some predefined hashtags based on the product name
 * 
 * @param productName Name of the product to search hashtags for
 * @returns Array of hashtag strings
 */
export async function getInstagramHashtags(productName: string): Promise<string[]> {
  // Convert product name to lowercase for easier matching
  const nameLower = productName.toLowerCase();
  
  // Predefined hashtags for different product categories
  const hashtagsByCategory: Record<string, string[]> = {
    beauty: ['일본화장품', '일본코스메틱', '일본스킨케어', '뷰티제품', '화장품추천'],
    food: ['일본과자', '일본음식', '일본스낵', '일본디저트', '일본맛집'],
    electronics: ['일본전자제품', '일본가전', '일본테크', '일본가젯', '일본디지털'],
    fashion: ['일본패션', '일본스타일', '일본브랜드', '일본유니클로', '일본쇼핑'],
    toys: ['일본장난감', '일본피규어', '일본캐릭터', '일본애니', '일본토이'],
    medicine: ['일본약', '일본의약품', '일본건강식품', '일본드러그스토어', '일본약국'],
    stationery: ['일본문구', '일본펜', '일본노트', '일본다이어리', '일본문구류'],
  };
  
  // Keyword matching
  const keywordMap: Record<string, string> = {
    '화장품': 'beauty',
    '스킨': 'beauty',
    '화이트닝': 'beauty',
    '크림': 'beauty',
    '마스크팩': 'beauty',
    '선크림': 'beauty',
    '립': 'beauty',
    '과자': 'food',
    '초콜릿': 'food',
    '스낵': 'food',
    '라면': 'food',
    '디저트': 'food',
    '전자': 'electronics',
    '닌텐도': 'electronics',
    '카메라': 'electronics',
    '게임': 'electronics',
    '의류': 'fashion',
    '신발': 'fashion',
    '가방': 'fashion',
    '모자': 'fashion',
    '장난감': 'toys',
    '피규어': 'toys',
    '인형': 'toys',
    '약': 'medicine',
    '영양제': 'medicine',
    '건강': 'medicine',
    '문구': 'stationery',
    '펜': 'stationery',
    '노트': 'stationery',
  };
  
  // Determine category based on product name
  let category = 'general';
  
  for (const [keyword, cat] of Object.entries(keywordMap)) {
    if (nameLower.includes(keyword)) {
      category = cat;
      break;
    }
  }
  
  // Get category-specific hashtags, or use general ones if no category matched
  const categoryHashtags = hashtagsByCategory[category] || ['일본여행', '일본쇼핑', '일본직구', '일본소품', '일본추천'];
  
  // Add brand-specific hashtags if detected
  const brands = {
    '시세이도': '시세이도',
    '유니클로': '유니클로',
    '무인양품': '무지',
    '닌텐도': '닌텐도',
    '소니': '소니',
    '파나소닉': '파나소닉',
    '도쿄바나나': '도쿄바나나',
    '로프트': '로프트',
    '다이소': '다이소재팬',
  };
  
  let brandHashtags: string[] = [];
  
  for (const [brandKeyword, brandHashtag] of Object.entries(brands)) {
    if (nameLower.includes(brandKeyword.toLowerCase())) {
      brandHashtags = [brandHashtag, `${brandHashtag}추천`, `${brandHashtag}쇼핑`];
      break;
    }
  }
  
  // Create product-specific hashtag (remove spaces and special chars)
  const productSpecificHashtag = productName
    .replace(/[^\w\s가-힣]/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  // Combine hashtags
  let allHashtags = [
    ...categoryHashtags,
    ...brandHashtags,
    productSpecificHashtag,
    '일본여행',
    '일본쇼핑',
  ];
  
  // Remove duplicates and limit to 10 hashtags
  return [...new Set(allHashtags)].slice(0, 10);
}
