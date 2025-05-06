import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductListItem } from "@/components/product/product-list-item";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Bookmark, Heart, X, Trash2, RefreshCw, Triangle, User, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import type { UserProduct } from "@shared/schema";

export function Lists() {
  const queryClient = useQueryClient();
  const { selectedCountry, generateShareUrl, exchangeRate, lastUpdated } = useAppContext();
  const { user } = useAuth();
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
      console.log("일괄 삭제 성공, 쿼리 무효화 중...");
      
      // 특정 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      
      // 상품 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
      });
      
      // 모든 사용자 상품 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: [API_ROUTES.USER_PRODUCTS]
      });
      
      // 패턴 기반 쿼리 무효화
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return typeof queryKey === 'string' && queryKey.includes('/api/user-products');
        }
      });
      
      // 상태 초기화
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
      console.log("일괄 상태 변경 성공, 쿼리 무효화 중...");
      
      // 특정 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      
      // 모든 사용자 상품 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: [API_ROUTES.USER_PRODUCTS]
      });
      
      // 패턴 기반 쿼리 무효화
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return typeof queryKey === 'string' && queryKey.includes('/api/user-products');
        }
      });
      
      // 상태 초기화
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b pb-3 gap-3">
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
          
          <div className="flex flex-wrap gap-2">
            {selectedCount > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8 flex-grow sm:flex-grow-0">
                      <RefreshCw className="h-3 w-3 mr-1 sm:mr-2" />
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
                  className="text-xs h-8 flex-grow sm:flex-grow-0 text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-3 w-3 mr-1 sm:mr-2" />
                  선택 삭제
                </Button>
              </>
            )}
            
            {products.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 flex-grow sm:flex-grow-0 text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                onClick={() => batchDelete.mutate(products.map(p => p.id))}
              >
                <Trash2 className="h-3 w-3 mr-1 sm:mr-2" />
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
        
        <div className="grid grid-cols-1 gap-4">
          {products.map((userProduct: ExtendedUserProduct) => (
            <div key={userProduct.id} className="flex items-start space-x-2">
              <div className="pt-3 md:pt-8">
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
    <div className="w-full max-w-3xl mx-auto pb-20">
      {/* 메인 헤더 아래 위치하도록 top 값 조정 (헤더 높이 + 여백) */}
      <div className="sticky top-[60px] md:top-[68px] z-40 bg-gray-50 pt-2 pb-2 border-b border-gray-100 shadow-sm">
        {/* 환율 정보 표시 */}
        {exchangeRate && (
          <div className="bg-white rounded-lg p-2 mb-2 flex items-center justify-between text-xs text-gray-600 shadow-sm">
            <div className="flex items-center">
              <span className="font-medium">현재 환율:</span>
              <span className="ml-1 font-semibold">
                100{selectedCountry.currency === "JPY" ? "엔" : selectedCountry.currency} = {(exchangeRate * 100).toFixed(0)}원
              </span>
              <span className="ml-1 px-1 bg-green-50 text-green-600 rounded text-[10px]">LIVE</span>
            </div>
            <div className="text-gray-500 text-[10px]">
              {lastUpdated && new Date(lastUpdated).toLocaleString('ko-KR', {
                month: 'numeric',
                day: 'numeric', 
                hour: '2-digit',
                minute: '2-digit'
              })} 기준
            </div>
          </div>
        )}

        {/* 탭 리스트 영역 - 스크롤해도 고정 */}
        <div className="bg-white rounded-lg shadow-sm w-full">
          <Tabs
            defaultValue={ProductStatus.INTERESTED}
            onValueChange={(value) => setActiveTab(value as ProductStatus)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3 bg-white rounded-lg mb-2">
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
          </Tabs>
        </div>
      </div>

      {/* 탭 컨텐츠 영역 - 스크롤 가능 */}
      <div className="mt-2">
        <Tabs
          defaultValue={ProductStatus.INTERESTED}
          value={activeTab}
          className="w-full"
        >
          <TabsContent value={ProductStatus.INTERESTED}>
            {renderTabContent(interestedProducts, ProductStatus.INTERESTED)}
            
            {interestedProducts.length > 0 && (
              <div className="mt-6 text-center">
                {user ? (
                  <Button
                    onClick={handleShare}
                    className="bg-primary text-white w-full sm:w-auto py-3 px-6 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    관심 목록 공유하기
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      onClick={() => window.location.href = "/auth"}
                      className="bg-primary text-white w-full sm:w-auto py-3 px-6 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
                    >
                      <User className="mr-2 h-4 w-4" />
                      회원가입하여 목록 유지 및 공유하기
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200 max-w-md">
                      <AlertTriangle className="inline-block mr-1 h-3 w-3 text-yellow-500" />
                      비회원은 페이지 이탈 시 저장된 상품이 모두 사라집니다.
                    </p>
                  </div>
                )}
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
    </div>
  );
}