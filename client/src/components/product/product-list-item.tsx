import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { Instagram, Trash2, X, ShoppingCart, XCircle, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Product, UserProduct } from "@shared/schema";

interface ProductListItemProps {
  product?: Product;
  userProduct: UserProduct;
  readOnly?: boolean;
  onSuccessfulAction?: () => void;
  travelStartDate?: Date | null;
  travelEndDate?: Date | null;
}

export function ProductListItem(props: ProductListItemProps) {
  const { product, userProduct, readOnly = false, onSuccessfulAction, travelStartDate, travelEndDate } = props;
  const queryClient = useQueryClient();
  const { selectedCountry, exchangeRate, setShouldActivateCalendar, accommodationLocation } = useAppContext();
  const { user } = useAuth();
  const { toast } = useToast();
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
  
  // '분류변경' 기능 제거로 인해 상품 상태 변경 기능도 제거됨
  
  // Update product status mutation (for purchase tracking)
  const updateProductStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      // Check travel dates for purchase completion
      if ((newStatus === ProductStatus.PURCHASED || newStatus === ProductStatus.NOT_PURCHASED) && (!travelStartDate || !travelEndDate)) {
        throw new Error("여행 날짜를 먼저 선택해주세요.");
      }

      if (isNonMember) {
        // 비회원은 로컬 스토리지에서 상태 업데이트
        const storageKey = `userProducts_${selectedCountry.id}`;
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedData = existingData.map((item: any) => 
          item.productId === userProduct.productId 
            ? { 
                ...item, 
                status: newStatus, 
                updatedAt: new Date().toISOString(),
                travelStartDate: travelStartDate?.toISOString(),
                travelEndDate: travelEndDate?.toISOString(),
                purchaseDate: newStatus === ProductStatus.PURCHASED ? new Date().toISOString() : item.purchaseDate,
                accommodationAddress: newStatus === ProductStatus.PURCHASED ? accommodationLocation?.address : item.accommodationAddress
              }
            : item
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedData));
        return { status: newStatus };
      } else {
        // 회원은 API 호출
        const response = await apiRequest(
          "PATCH",
          `${API_ROUTES.USER_PRODUCTS}/${userProduct.id}`,
          { 
            status: newStatus,
            travelStartDate: travelStartDate?.toISOString(),
            travelEndDate: travelEndDate?.toISOString(),
            accommodationAddress: newStatus === ProductStatus.PURCHASED ? accommodationLocation?.address : undefined
          }
        );
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      if (onSuccessfulAction) {
        onSuccessfulAction();
      }
    },
    onError: (error: Error) => {
      toast({
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
      
      // 여행 날짜 오류일 때 캘린더 활성화
      if (error.message.includes("여행 날짜를 먼저 선택해주세요")) {
        setShouldActivateCalendar(true);
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

  // Opens Instagram in a new tab with the product name search
  const handleInstagramSearch = () => {
    if (!productName) return;
    
    // Use product name for Instagram search instead of hashtag
    window.open(`https://www.instagram.com/explore/tags/${encodeURIComponent(productName)}`, "_blank");
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
      <div className="relative">
        <img
          src={productImageUrl}
          alt={productName}
          className="w-full h-40 sm:w-28 sm:h-28 object-cover"
        />
        {/* Delete button - X icon on top-right corner of image */}
        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => deleteUserProduct.mutate()}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="p-3 flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <div className="flex flex-col mb-2 sm:mb-0">
            <h3 className="font-medium text-sm">{productName}</h3>
            {productNameJapanese && (
              <p className="text-xs text-gray-500 mt-0.5">{productNameJapanese}</p>
            )}
          </div>
          
          <div className="bg-gradient-to-r from-white to-gray-50 px-2 py-1 rounded-md shadow-sm">
            {/* Instagram button - above price */}
            {!readOnly && (
              <div className="flex justify-end mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-neutral hover:bg-neutral hover:text-white rounded"
                  onClick={handleInstagramSearch}
                  disabled={!productName}
                >
                  <Instagram className="h-3 w-3" />
                </Button>
              </div>
            )}
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
        
        {!readOnly && userProduct.status === ProductStatus.INTERESTED && (
          <div className="mt-3 flex gap-2">
            {/* 관심 상품에만 구입 완료/미구입 버튼 표시 */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs py-0.5 px-2 h-8 border-green-300 text-green-600 hover:bg-green-500 hover:text-white"
              onClick={() => updateProductStatus.mutate(ProductStatus.PURCHASED)}
              disabled={updateProductStatus.isPending}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              구입완료
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs py-0.5 px-2 h-8 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white"
              onClick={() => updateProductStatus.mutate(ProductStatus.NOT_PURCHASED)}
              disabled={updateProductStatus.isPending}
            >
              <XCircle className="h-3 w-3 mr-1" />
              미구입
            </Button>
          </div>
        )}

        {!readOnly && userProduct.status === ProductStatus.MAYBE && (
          <div className="mt-3 flex gap-2">
            {/* 고민중 상품에만 관심으로 이동 버튼 표시 */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs py-0.5 px-2 h-8 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => updateProductStatus.mutate(ProductStatus.INTERESTED)}
              disabled={updateProductStatus.isPending}
            >
              <Heart className="h-3 w-3 mr-1" />
              관심으로
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}