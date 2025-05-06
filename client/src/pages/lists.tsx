import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductListItem } from "@/components/product/product-list-item";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Bookmark, Heart, X } from "lucide-react";
import type { UserProduct } from "@shared/schema";

export function Lists() {
  const { selectedCountry, generateShareUrl } = useAppContext();
  const [activeTab, setActiveTab] = useState<ProductStatus>(ProductStatus.INTERESTED);
  
  // Fetch user products
  const { data: userProducts = [], isLoading } = useQuery<
    Array<UserProduct & { product: { id: number; name: string; description: string; price: number; imageUrl: string; category: string; countryId: string; hashtags?: string[]; location?: string }}>
  >({
    queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id],
    onSuccess: (data) => {
      console.log("Fetched userProducts:", data);
    }
  });
  
  // TypeScript 타입 정의
  type ExtendedUserProduct = UserProduct & {
    product: {
      id: number;
      name: string;
      description: string;
      price: number;
      imageUrl: string;
      category: string;
      countryId: string;
      hashtags?: string[];
      location?: string;
    }
  };

  // Filter products by status
  const getProductsByStatus = (status: ProductStatus) => {
    return userProducts.filter((up) => up.status === status) as ExtendedUserProduct[];
  };
  
  const interestedProducts = getProductsByStatus(ProductStatus.INTERESTED);
  const maybeProducts = getProductsByStatus(ProductStatus.MAYBE);
  const notInterestedProducts = getProductsByStatus(ProductStatus.NOT_INTERESTED);
  
  // Get count badge for each tab
  const getCountBadge = (count: number) => (
    <span className="ml-1 bg-primary text-white rounded-full text-xs px-2 py-0.5">
      {count}
    </span>
  );
  
  // Handle share button click
  const handleShare = () => {
    generateShareUrl(activeTab);
  };
  
  // Render content for a tab
  const renderTabContent = (products: ExtendedUserProduct[], status: ProductStatus) => {
    if (isLoading) {
      return (
        <div className="p-8 text-center text-neutral">
          <p>목록을 불러오는 중...</p>
        </div>
      );
    }
    
    if (products.length === 0) {
      let emptyMessage = "";
      let emptyIcon = null;
      
      switch (status) {
        case ProductStatus.INTERESTED:
          emptyMessage = "관심 있는 상품이 없습니다.";
          emptyIcon = <Heart className="w-16 h-16 mb-4 opacity-20" />;
          break;
        case ProductStatus.MAYBE:
          emptyMessage = "나중에 다시 볼 상품들이 여기에 표시됩니다.";
          emptyIcon = <Bookmark className="w-16 h-16 mb-4 opacity-20" />;
          break;
        case ProductStatus.NOT_INTERESTED:
          emptyMessage = "관심 없는 상품들이 여기에 표시됩니다.";
          emptyIcon = <X className="w-16 h-16 mb-4 opacity-20" />;
          break;
      }
      
      return (
        <div className="p-8 text-center text-neutral">
          {emptyIcon}
          <p>{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((userProduct: ExtendedUserProduct) => (
          <ProductListItem
            key={userProduct.id}
            product={userProduct.product}
            userProduct={userProduct}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Tabs
        defaultValue={ProductStatus.INTERESTED}
        onValueChange={(value) => setActiveTab(value as ProductStatus)}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger
            value={ProductStatus.INTERESTED}
            className="flex items-center justify-center"
          >
            관심 상품 {getCountBadge(interestedProducts.length)}
          </TabsTrigger>
          <TabsTrigger
            value={ProductStatus.MAYBE}
            className="flex items-center justify-center"
          >
            나중에 {getCountBadge(maybeProducts.length)}
          </TabsTrigger>
          <TabsTrigger
            value={ProductStatus.NOT_INTERESTED}
            className="flex items-center justify-center"
          >
            관심없음 {getCountBadge(notInterestedProducts.length)}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={ProductStatus.INTERESTED}>
          {renderTabContent(interestedProducts, ProductStatus.INTERESTED)}
          
          {interestedProducts.length > 0 && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleShare}
                className="bg-primary text-white py-3 px-6 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
              >
                <Share2 className="mr-2 h-4 w-4" />
                관심 상품 목록 공유하기
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value={ProductStatus.MAYBE}>
          {renderTabContent(maybeProducts, ProductStatus.MAYBE)}
        </TabsContent>
        
        <TabsContent value={ProductStatus.NOT_INTERESTED}>
          {renderTabContent(notInterestedProducts, ProductStatus.NOT_INTERESTED)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
