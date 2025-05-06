import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/product/product-card";
import { ActionButtons } from "@/components/product/action-buttons";
import { CurrencyInfoPanel } from "@/components/ui/currency-display";
import { useAppContext } from "@/contexts/AppContext";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { API_ROUTES, ProductStatus, SwipeDirection, SWIPE_TO_STATUS } from "@/lib/constants";
import type { Product } from "@shared/schema";

export function ProductCardStack() {
  const queryClient = useQueryClient();
  const { 
    selectedCountry, 
    selectedCategory, 
    setCurrentProductIndex 
  } = useAppContext();
  
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  
  // Fetch products for the selected country
  const { data: allProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id],
    enabled: !!selectedCountry && !!selectedCountry.id,
  });
  
  // Filter products by selected category
  const products = selectedCategory === "ALL" 
    ? allProducts 
    : allProducts.filter(product => product.category === selectedCategory);
  
  // Update user product status mutation
  const updateProductStatus = useMutation({
    mutationFn: async ({ productId, status }: { productId: number, status: ProductStatus }) => {
      const response = await apiRequest(
        "POST",
        `${API_ROUTES.USER_PRODUCTS}`,
        { productId, status }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
    }
  });
  
  // Initialize visible products when products are loaded or category changes
  useEffect(() => {
    if (products.length > 0) {
      setVisibleProducts(products.slice(0, 3));
      setCurrentProductIndex(0); // Reset position counter when category changes
    }
  }, [products, setCurrentProductIndex]);
  
  // Handle swipe on cards
  const handleSwipe = (direction: SwipeDirection, productId: number) => {
    // Update the product status in the backend
    const status = SWIPE_TO_STATUS[direction];
    updateProductStatus.mutate({ productId, status });
    
    // Remove the swiped card and add the next one in queue
    setVisibleProducts(prev => {
      const remaining = prev.filter(p => p.id !== productId);
      const currentIndex = products.findIndex(p => p.id === productId);
      const nextIndex = currentIndex + 3;
      
      // Update the current product index
      setCurrentProductIndex(currentIndex + 1);
      
      if (nextIndex < products.length) {
        return [...remaining, products[nextIndex]];
      }
      
      return remaining;
    });
  };
  
  // Handle action button clicks
  const handleActionClick = (direction: SwipeDirection) => {
    if (visibleProducts.length === 0) return;
    
    const topProductId = visibleProducts[0].id;
    handleSwipe(direction, topProductId);
  };
  
  // Calculate progress
  const totalProducts = products.length;
  const seenProducts = Math.min(products.findIndex(p => 
    p.id === (visibleProducts[0]?.id ?? -1)), totalProducts);
  const currentPosition = seenProducts + 1;
  const progressPercentage = totalProducts > 0 ? (seenProducts / totalProducts) * 100 : 0;
  
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto flex items-center justify-center h-[500px]">
        <div className="text-center">
          <p>상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto flex items-center justify-center h-[500px]">
        <div className="text-center">
          <p>선택한 국가에 등록된 상품이 없습니다.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-md mx-auto">
      <CurrencyInfoPanel />
      
      <div className="card-stack relative h-[500px] w-full mx-auto">
        {visibleProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            isTopCard={index === 0}
            position={index}
            onSwipe={handleSwipe}
          />
        ))}
      </div>
      
      <ActionButtons onActionClick={handleActionClick} />
      
      <div className="mt-6 w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-primary h-1.5 rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-neutral text-center mt-1">
        {currentPosition}/{totalProducts} • {selectedCategory === "ALL" ? "전체" : selectedCategory} 카테고리
      </div>
    </div>
  );
}
