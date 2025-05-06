import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductListItem } from "@/components/product/product-list-item";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Bookmark, Heart, X, Trash2, RefreshCw, Triangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import type { UserProduct } from "@shared/schema";

export function Lists() {
  const queryClient = useQueryClient();
  const { selectedCountry, generateShareUrl } = useAppContext();
  const [activeTab, setActiveTab] = useState<ProductStatus>(ProductStatus.INTERESTED);
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  
  // Fetch user products
  const { data: userProducts = [], isLoading, refetch } = useQuery<
    Array<UserProduct & { product: { id: number; name: string; description: string; price: number; imageUrl: string; category: string; countryId: string; hashtags?: string[]; location?: string }}>
  >({
    queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id],
    staleTime: 0, // Always get fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // 대량 삭제 mutation
  const batchDelete = useMutation({
    mutationFn: async (ids: number[]) => {
      // 일괄 삭제를 위해 각 ID마다 개별 요청을 보냄
      const deletePromises = ids.map(id => 
        apiRequest("DELETE", `${API_ROUTES.USER_PRODUCTS}/${id}`)
      );
      
      const results = await Promise.all(deletePromises);
      return results;
    },
    onSuccess: () => {
      // 삭제 후 쿼리 무효화 및 체크박스 초기화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
      });
      setSelectedIds({});
      setSelectAll(false);
    }
  });
  
  // 대량 상태 변경 mutation
  const batchChangeStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[], status: ProductStatus }) => {
      // 각 ID마다 개별 요청을 보냄
      const updatePromises = ids.map(id => 
        apiRequest("PATCH", `${API_ROUTES.USER_PRODUCTS}/${id}`, { status })
      );
      
      const results = await Promise.all(updatePromises);
      return results;
    },
    onSuccess: () => {
      // 상태 변경 후 쿼리 무효화 및 체크박스 초기화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      setSelectedIds({});
      setSelectAll(false);
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
  
  // 체크박스 변경 처리
  const handleCheckboxChange = (id: number, checked: boolean) => {
    setSelectedIds(prev => ({ ...prev, [id]: checked }));
  };

  // 전체 선택/해제 처리
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    
    if (checked) {
      // 현재 활성 탭의 모든 제품 선택
      const productsToSelect = activeTab === ProductStatus.INTERESTED ? interestedProducts :
                               activeTab === ProductStatus.MAYBE ? maybeProducts :
                               notInterestedProducts;
      
      const newSelectedIds: Record<number, boolean> = {};
      productsToSelect.forEach(product => {
        newSelectedIds[product.id] = true;
      });
      setSelectedIds(newSelectedIds);
    } else {
      // 모두 선택 해제
      setSelectedIds({});
    }
  };

  // 대량 삭제 처리
  const handleBatchDelete = () => {
    const ids = Object.entries(selectedIds)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => parseInt(id));
    
    if (ids.length > 0) {
      batchDelete.mutate(ids);
    }
  };

  // 대량 상태 변경 처리
  const handleBatchChangeStatus = (newStatus: ProductStatus) => {
    const ids = Object.entries(selectedIds)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => parseInt(id));
    
    if (ids.length > 0) {
      batchChangeStatus.mutate({ ids, status: newStatus });
    }
  };

  // 현재 선택된 항목 수 계산
  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

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
          emptyMessage = "관심 있는 상품들이 여기에 표시됩니다.";
          emptyIcon = <Heart className="w-16 h-16 mb-4 opacity-20" />;
          break;
        case ProductStatus.MAYBE:
          emptyMessage = "고민중인 상품들이 여기에 표시됩니다.";
          emptyIcon = <Bookmark className="w-16 h-16 mb-4 opacity-20" />;
          break;
        case ProductStatus.NOT_INTERESTED:
          emptyMessage = "관심없는 상품들이 여기에 표시됩니다.";
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
    
    // 선택 관련 버튼 렌더링
    const renderActionButtons = () => {
      if (products.length === 0) return null;
      
      return (
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all" 
              checked={selectAll}
              onCheckedChange={handleSelectAllChange}
            />
            <label htmlFor="select-all" className="text-sm cursor-pointer select-none">
              전체 선택 {selectedCount > 0 && `(${selectedCount}/${products.length})`}
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedCount > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      분류변경
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {status !== ProductStatus.INTERESTED && (
                      <DropdownMenuItem onClick={() => handleBatchChangeStatus(ProductStatus.INTERESTED)}>
                        <Heart className="h-4 w-4 mr-2 text-red-500" />
                        관심
                      </DropdownMenuItem>
                    )}
                    {status !== ProductStatus.MAYBE && (
                      <DropdownMenuItem onClick={() => handleBatchChangeStatus(ProductStatus.MAYBE)}>
                        <Triangle className="h-4 w-4 mr-2 text-gray-600" />
                        고민중
                      </DropdownMenuItem>
                    )}
                    {status !== ProductStatus.NOT_INTERESTED && (
                      <DropdownMenuItem onClick={() => handleBatchChangeStatus(ProductStatus.NOT_INTERESTED)}>
                        <X className="h-4 w-4 mr-2 text-orange-500" />
                        관심없음
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8 text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  선택 삭제
                </Button>
              </>
            )}
            
            {products.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                onClick={() => batchDelete.mutate(products.map(p => p.id))}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                전체 삭제
              </Button>
            )}
          </div>
        </div>
      );
    };
    
    return (
      <div>
        {renderActionButtons()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((userProduct: ExtendedUserProduct) => (
            <div key={userProduct.id} className="flex items-start space-x-2">
              <div className="pt-3">
                <Checkbox 
                  checked={!!selectedIds[userProduct.id]} 
                  onCheckedChange={(checked) => handleCheckboxChange(userProduct.id, !!checked)}
                />
              </div>
              <div className="flex-1">
                <ProductListItem
                  product={userProduct.product}
                  userProduct={userProduct}
                  onSuccessfulAction={refetch}
                />
              </div>
            </div>
          ))}
        </div>
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
            <span className="text-red-500">관심</span> {getCountBadge(interestedProducts.length)}
          </TabsTrigger>
          <TabsTrigger
            value={ProductStatus.MAYBE}
            className="flex items-center justify-center"
          >
            <span className="text-gray-600">고민중</span> {getCountBadge(maybeProducts.length)}
          </TabsTrigger>
          <TabsTrigger
            value={ProductStatus.NOT_INTERESTED}
            className="flex items-center justify-center"
          >
            <span className="text-orange-500">관심없음</span> {getCountBadge(notInterestedProducts.length)}
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
                관심 목록 공유하기
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
