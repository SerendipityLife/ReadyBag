import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">카테고리</h3>
        <div className="flex items-center space-x-2">
          <img
            src={selectedCountry.flagUrl}
            alt={`${selectedCountry.name} 국기`}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-sm font-medium">{selectedCountry.name} 상품</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox 
              id={`category-${category.id}`} 
              checked={selectedCategory === category.id}
              onCheckedChange={() => handleCategoryChange(category.id)}
            />
            <Label 
              htmlFor={`category-${category.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              {category.name} ({category.count})
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}