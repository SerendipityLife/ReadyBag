import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { Instagram, X, ShoppingCart, XCircle, Heart, Edit } from "lucide-react";
import { ReviewButton } from "./review-button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Product, UserProduct } from "@shared/schema";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { PriceRangeDisplay } from "@/components/ui/price-range-display";

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

  // 실제 구입 가격 관련 상태
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [actualPriceInput, setActualPriceInput] = useState("");

  // Extract productId from userProduct
  const productId = userProduct.productId;

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

  // Update actual purchase price mutation
  const updateActualPrice = useMutation({
    mutationFn: async (actualPrice: number) => {
      // 실시간 환율로 원화 가격 계산
      const actualPriceKrw = Math.round(actualPrice * (exchangeRate || 9.57));

      if (isNonMember) {
        // 비회원은 로컬 스토리지에서 업데이트
        const storageKey = `userProducts_${selectedCountry.id}`;
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedData = existingData.map((item: any) => 
          item.productId === userProduct.productId 
            ? { 
                ...item, 
                actualPurchasePrice: actualPrice,
                actualPurchasePriceKrw: actualPriceKrw,
                updatedAt: new Date().toISOString()
              }
            : item
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedData));

        // 로컬 스토리지 변경 이벤트 트리거 (다른 컴포넌트에 알림)
        window.dispatchEvent(new Event('localStorageChange'));

        return { success: true };
      } else {
        // 회원은 API 호출
        const response = await apiRequest(
          "PATCH",
          `${API_ROUTES.USER_PRODUCTS}/${userProduct.id}`,
          { 
            actualPurchasePrice: actualPrice,
            actualPurchasePriceKrw: actualPriceKrw
          }
        );
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      setIsEditingPrice(false);
      setActualPriceInput("");
      toast({
        description: "실제 구입 가격이 저장되었습니다.",
        duration: 2000,
      });

      // 즉시 UI 업데이트를 위해 onSuccessfulAction 호출
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
    }
  });

  const handleSaveActualPrice = () => {
    const actualPrice = actualPriceInput ? parseInt(actualPriceInput) : undefined;

    if (!actualPrice) {
      toast({
        description: "실제 가격을 입력해주세요.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    updateActualPrice.mutate(actualPrice);
  };

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
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{productName}</h3>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-neutral hover:bg-neutral hover:text-white rounded ml-2"
                  onClick={handleInstagramSearch}
                  disabled={!productName}
                >
                  <Instagram className="h-3 w-3" />
                </Button>
              )}
            </div>
            {productNameJapanese && (
              <p className="text-xs text-gray-500 mt-0.5">{productNameJapanese}</p>
            )}
          </div>

          <div className="bg-gradient-to-r from-white to-gray-50 px-2 py-1 rounded-md shadow-sm">
            {/* Price edit button */}
            {!readOnly && (
              <div className="flex justify-end mb-1">
                <Dialog open={isEditingPrice} onOpenChange={setIsEditingPrice}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-blue-600 hover:bg-blue-100 rounded"
                      onClick={() => {
                        // 다이얼로그 열 때 기존 값 설정
                        setActualPriceInput(userProduct.actualPurchasePrice?.toString() || "");
                        setIsEditingPrice(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>실제 구입 가격 입력</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">실제 구입 가격 (¥)</label>
                        <Input
                          type="number"
                          placeholder={userProduct.actualPurchasePrice ? userProduct.actualPurchasePrice.toString() : "예: 3500"}
                          value={actualPriceInput}
                          onChange={(e) => setActualPriceInput(e.target.value)}
                        />
                        {actualPriceInput && (
                          <div className="mt-2 text-sm text-gray-600">
                            한국 원화: {Math.round(parseInt(actualPriceInput) * (exchangeRate || 9.57)).toLocaleString()}원
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSaveActualPrice}
                          disabled={updateActualPrice.isPending}
                          className="flex-1"
                        >
                          저장
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingPrice(false);
                            setActualPriceInput("");
                          }}
                          className="flex-1"
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Price display */}
            <div className="space-y-2">
              {/* 예상 가격 */}
              <div className="text-xs text-gray-500 pb-1 border-b border-gray-200">
                <div className="flex justify-between">
                  <span>예상:</span>
                  <span>¥{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span></span>
                  <span className="text-primary">{convertedPrice.toLocaleString()}원</span>
                </div>
              </div>

              {/* 실제 구입 가격 */}
              {userProduct.actualPurchasePrice && (
                <div className="text-xs font-medium text-green-700">
                  <div className="flex justify-between">
                    <span>실제:</span>
                    <span>¥{userProduct.actualPurchasePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span></span>
                    <span>{Math.round(userProduct.actualPurchasePrice * (exchangeRate || 9.57)).toLocaleString()}원</span>
                  </div>
                </div>
              )}
            </div>
            <PriceRangeDisplay 
              productId={product.id}
              className="text-xs"
            />
          </div>
        </div>

        {!readOnly && userProduct.status === ProductStatus.INTERESTED && (
          <div className="mt-3 flex gap-2">
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
              className="flex-1 text-xs py-0.5 px-2 h-8 border-blue-300 text-blue-600 hover:bg-blue-500 hover:text-white"
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