import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

// 카테고리 타입 정의
export type ProductCategory = {
  id: string;
  name: string;
  count: number;
};

export function CategorySelector() {
  const { selectedCountry, setSelectedCategory, selectedCategory } = useAppContext();
  
  // 상품 데이터 가져오기
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id],
    enabled: !!selectedCountry.id,
  });
  
  // 카테고리 목록 생성
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  useEffect(() => {
    if (products && products.length > 0) {
      // 전체 카테고리 옵션 포함
      const allCategory: ProductCategory = { id: "ALL", name: "전체", count: products.length };
      
      // 고유 카테고리 추출 및 각 카테고리별 상품 수 계산
      const categoryCounts: Record<string, number> = {};
      const categoryNames: Record<string, string> = {
        "IT": "IT 제품",
        "BEAUTY": "화장품/뷰티",
        "LIQUOR": "주류",
        "HEALTH": "의약품/건강",
        "FOOD": "식품/간식",
        "CHARACTER": "캐릭터 굿즈",
        "FASHION": "의류/잡화",
        "ELECTRONICS": "전자제품/가전",
      };
      
      products.forEach(product => {
        if (product.category) {
          categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
        }
      });
      
      // 카테고리 배열 생성
      const categoryList = Object.keys(categoryCounts).map(categoryId => ({
        id: categoryId,
        name: categoryNames[categoryId] || categoryId,
        count: categoryCounts[categoryId]
      }));
      
      // 전체 카테고리를 맨 앞에 추가하고 나머지 카테고리는 알파벳 순으로 정렬
      setCategories([
        allCategory,
        ...categoryList.sort((a, b) => a.name.localeCompare(b.name))
      ]);
      
      // 카테고리가 없거나 카테고리가 바뀌었을 때 기본값으로 '전체' 선택
      if (!selectedCategory || !categoryList.some(c => c.id === selectedCategory)) {
        setSelectedCategory("ALL");
      }
    }
  }, [products, setSelectedCategory, selectedCategory]);
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      <div className="text-sm font-medium">카테고리:</div>
      <Select
        value={selectedCategory || "ALL"}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="카테고리 선택" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name} ({category.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}