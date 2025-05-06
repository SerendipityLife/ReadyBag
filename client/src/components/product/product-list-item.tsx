import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { RefreshCw, Instagram, Trash2, Heart, Triangle, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import type { Product, UserProduct } from "@shared/schema";

interface ProductListItemProps {
  product?: Product;
  userProduct: UserProduct;
  readOnly?: boolean;
  onSuccessfulAction?: () => void;
}

export function ProductListItem(props: ProductListItemProps) {
  const { product, userProduct, readOnly = false, onSuccessfulAction } = props;
  const queryClient = useQueryClient();
  const { selectedCountry, exchangeRate } = useAppContext();
  const { user } = useAuth();
  const isNonMember = !user;
  
  // 상태 초기화
  const [price, setPrice] = useState(0);
  const [convertedPrice, setConvertedPrice] = useState(0);
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productNameJapanese, setProductNameJapanese] = useState<string | null>(null);
  const [productLocation, setProductLocation] = useState<string | null>(null);
  const [productHashtags, setProductHashtags] = useState<string[] | null>(null);
  const [hasProductError, setHasProductError] = useState(false);
  
  // Update user product status mutation
  const updateStatus = useMutation({
    mutationFn: async (newStatus: ProductStatus) => {
      // 비회원인 경우 로컬 스토리지에서 상태 업데이트
      if (isNonMember) {
        const storageKey = `userProducts_${selectedCountry.id}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const products = JSON.parse(storedData);
          const updatedProducts = products.map((item: any) => {
            if (item.id === userProduct.id) {
              return { ...item, status: newStatus };
            }
            return item;
          });
          
          localStorage.setItem(storageKey, JSON.stringify(updatedProducts));
          return { status: newStatus, id: userProduct.id };
        }
        
        throw new Error("로컬 스토리지에서 상품을 찾을 수 없습니다");
      }
      
      // 회원인 경우 API 호출
      const response = await apiRequest(
        "PATCH",
        `${API_ROUTES.USER_PRODUCTS}/${userProduct.id}`,
        { status: newStatus }
      );
      
      if (!response.ok) {
        throw new Error("Status update operation failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // 공통: 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      
      // Call callback if provided
      if (onSuccessfulAction) {
        onSuccessfulAction();
      }
    }
  });
  
  // Delete user product mutation
  const deleteUserProduct = useMutation({
    mutationFn: async () => {
      // 비회원인 경우 로컬 스토리지에서 삭제
      if (isNonMember) {
        const storageKey = `userProducts_${selectedCountry.id}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const products = JSON.parse(storedData);
          const updatedProducts = products.filter((item: any) => item.id !== userProduct.id);
          
          localStorage.setItem(storageKey, JSON.stringify(updatedProducts));
          
          // 로컬 스토리지 변경 이벤트 트리거 (다른 컴포넌트에 알림)
          window.dispatchEvent(new Event('localStorageChange'));
          
          return { success: true };
        }
        
        throw new Error("로컬 스토리지에서 상품을 찾을 수 없습니다");
      }
      
      // 회원인 경우 API 호출
      const response = await apiRequest(
        "DELETE",
        `${API_ROUTES.USER_PRODUCTS}/${userProduct.id}`
      );
      
      if (!response.ok) {
        throw new Error("Delete operation failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // 공통: 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      
      // This is important to make the product reappear in the exploring section
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
      });
      
      // Call callback if provided
      if (onSuccessfulAction) {
        onSuccessfulAction();
      }
    }
  });

  // 상품 데이터 유효성 검사 및 상태 설정
  useEffect(() => {
    if (!product) {
      setHasProductError(true);
      return;
    }
    
    setHasProductError(false);
    setProductImageUrl(product.imageUrl || "");
    setProductName(product.name || "");
    setProductNameJapanese(product.nameJapanese || null);
    setProductLocation(product.location || null);
    setProductHashtags(product.hashtags || null);
    
    // 가격 계산
    const roundedPrice = Math.round(product.price);
    const calculatedPrice = Math.round(product.price * (exchangeRate || 9.57));
    
    setPrice(roundedPrice);
    setConvertedPrice(calculatedPrice);
  }, [product, exchangeRate]);

  // Change product status directly
  const changeStatus = (newStatus: ProductStatus) => {
    updateStatus.mutate(newStatus);
  };

  // Opens Instagram in a new tab with the hashtag search
  const handleInstagramSearch = () => {
    if (!productHashtags || productHashtags.length === 0) return;
    
    const hashtag = productHashtags[0].replace("#", "");
    window.open(`https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}`, "_blank");
  };

  // 상품 에러일 경우 에러 UI 표시
  if (hasProductError) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4 flex justify-center items-center">
        <p className="text-gray-500 text-sm">상품 정보를 불러오는 중 오류가 발생했습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col sm:flex-row">
      <img
        src={productImageUrl}
        alt={productName}
        className="w-full h-40 sm:w-28 sm:h-28 object-cover"
      />
      
      <div className="p-3 flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <div className="flex flex-col mb-2 sm:mb-0">
            <h3 className="font-medium text-sm">{productName}</h3>
            {productNameJapanese && (
              <p className="text-xs text-gray-500 mt-0.5">{productNameJapanese}</p>
            )}
            
            {productLocation && (
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span className="mr-1">📍</span>
                <span>{productLocation}</span>
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-r from-white to-gray-50 px-2 py-1 rounded-md shadow-sm">
            <div className="flex items-center justify-between sm:flex-col sm:items-end">
              <div className="text-xs text-gray-500">
                현지: <span className="font-medium">¥{price.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-medium text-primary">{convertedPrice.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>
        
        {!readOnly && (
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial text-xs py-0.5 px-2 h-8 border-neutral text-neutral hover:bg-neutral hover:text-white"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    분류변경
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-40" align="start">
                  <div className="flex flex-col gap-1 p-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`justify-start text-xs ${userProduct.status === ProductStatus.INTERESTED ? 'bg-red-50 text-red-500' : ''}`}
                      onClick={() => changeStatus(ProductStatus.INTERESTED)}
                    >
                      <Heart className={`h-3.5 w-3.5 mr-2 ${userProduct.status === ProductStatus.INTERESTED ? 'fill-red-500 text-red-500' : ''}`} />
                      관심 상품
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`justify-start text-xs ${userProduct.status === ProductStatus.MAYBE ? 'bg-orange-50 text-orange-500' : ''}`}
                      onClick={() => changeStatus(ProductStatus.MAYBE)}
                    >
                      <Triangle className={`h-3.5 w-3.5 mr-2 ${userProduct.status === ProductStatus.MAYBE ? 'fill-orange-500 text-orange-500' : ''}`} />
                      나중에
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`justify-start text-xs ${userProduct.status === ProductStatus.NOT_INTERESTED ? 'bg-neutral-50 text-neutral-500' : ''}`}
                      onClick={() => changeStatus(ProductStatus.NOT_INTERESTED)}
                    >
                      <X className={`h-3.5 w-3.5 mr-2 ${userProduct.status === ProductStatus.NOT_INTERESTED ? 'text-neutral-500' : ''}`} />
                      관심없음
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial text-xs py-0.5 px-2 h-8 border-neutral text-neutral hover:bg-neutral hover:text-white"
                onClick={handleInstagramSearch}
                disabled={!productHashtags || productHashtags.length === 0}
              >
                <Instagram className="h-3 w-3 mr-1" />
                인스타
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs py-0.5 px-2 h-8 border-red-300 text-red-500 hover:bg-red-500 hover:text-white"
              onClick={() => deleteUserProduct.mutate()}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              삭제
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}