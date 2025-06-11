import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductListItem } from "@/components/product/product-list-item";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Heart } from "lucide-react";
import type { UserProduct, Product } from "@shared/schema";

interface ExtendedUserProduct extends UserProduct {
  product?: Product;
}

interface TravelGroup {
  dateRange: string;
  country: string;
  items: ExtendedUserProduct[];
}

export function ShoppingHistory() {
  const { selectedCountry } = useAppContext();
  const { user } = useAuth();
  const isNonMember = !user;
  const [purchasedProducts, setPurchasedProducts] = useState<ExtendedUserProduct[]>([]);

  // API query for logged-in users
  const { data: apiData, refetch } = useQuery({
    queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id],
    enabled: !isNonMember && !!selectedCountry?.id,
  });

  // Get all products for reference
  const { data: allProducts } = useQuery({
    queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id],
    enabled: !!selectedCountry?.id,
  });

  // Load purchased products from local storage for non-members
  const getLocalPurchasedProducts = async () => {
    try {
      if (!selectedCountry?.id) return [];
      
      const storageKey = `userProducts_${selectedCountry.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) return [];
        
      const localData = JSON.parse(storedData);
      
      if (!Array.isArray(localData) || localData.length === 0) return [];
      
      // Filter only purchased and not purchased items
      const purchasedItems = localData.filter((item: any) => 
        item.status === ProductStatus.PURCHASED || item.status === ProductStatus.NOT_PURCHASED
      );
      
      if (allProducts && allProducts.length > 0) {
        return purchasedItems.map((item: any) => {
          const productData = allProducts.find((p: Product) => p.id === item.productId);
          return {
            ...item,
            product: productData || {
              id: item.productId,
              name: "상품 정보 없음",
              description: "",
              price: 0,
              imageUrl: "",
              category: "",
              countryId: selectedCountry.id,
              hashtags: [],
              location: null
            }
          };
        });
      }
      
      return purchasedItems;
    } catch (error) {
      console.error("로컬 스토리지에서 구매 기록 로드 중 오류:", error);
      return [];
    }
  };

  // Update purchased products when data changes
  useEffect(() => {
    const updatePurchasedProducts = async () => {
      if (isNonMember) {
        const localProducts = await getLocalPurchasedProducts();
        setPurchasedProducts(localProducts);
      } else if (apiData) {
        const purchased = apiData.filter((item: ExtendedUserProduct) => 
          item.status === ProductStatus.PURCHASED || item.status === ProductStatus.NOT_PURCHASED
        );
        setPurchasedProducts(purchased);
      }
    };

    updatePurchasedProducts();
  }, [apiData, allProducts, selectedCountry, isNonMember]);

  // Listen to local storage changes for non-members
  useEffect(() => {
    if (isNonMember) {
      const handleStorageChange = async () => {
        const localProducts = await getLocalPurchasedProducts();
        setPurchasedProducts(localProducts);
      };

      window.addEventListener('localStorageChange', handleStorageChange);
      return () => window.removeEventListener('localStorageChange', handleStorageChange);
    }
  }, [isNonMember, allProducts, selectedCountry]);

  // Group products by travel dates
  const groupedByTravel: TravelGroup[] = purchasedProducts.reduce((groups: TravelGroup[], product) => {
    const startDate = product.travelStartDate ? new Date(product.travelStartDate) : null;
    const endDate = product.travelEndDate ? new Date(product.travelEndDate) : null;
    
    let dateRange = "날짜 미설정";
    if (startDate && endDate) {
      dateRange = `${format(startDate, "MM/dd", { locale: ko })} - ${format(endDate, "MM/dd", { locale: ko })}`;
    } else if (startDate) {
      dateRange = format(startDate, "MM/dd", { locale: ko });
    }
    
    const existingGroup = groups.find(g => g.dateRange === dateRange);
    
    if (existingGroup) {
      existingGroup.items.push(product);
    } else {
      groups.push({
        dateRange,
        country: selectedCountry.name,
        items: [product]
      });
    }
    
    return groups;
  }, []);

  // Sort groups by date (most recent first)
  groupedByTravel.sort((a, b) => {
    if (a.dateRange === "날짜 미설정") return 1;
    if (b.dateRange === "날짜 미설정") return -1;
    return b.dateRange.localeCompare(a.dateRange);
  });

  if (purchasedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          <Heart className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">쇼핑 기록이 없습니다</h3>
        <p className="text-gray-500 text-center max-w-sm">
          관심 상품에서 '구입완료'를 선택하면 여기에 여행별로 기록됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedByTravel.map((group, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Travel header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="font-medium text-gray-900">{group.country} 여행</h3>
                <p className="text-sm text-gray-600">{group.dateRange}</p>
              </div>
              <div className="ml-auto text-sm text-gray-500">
                {group.items.length}개 상품
              </div>
            </div>
          </div>
          
          {/* Products in this travel */}
          <div className="p-4 space-y-4">
            {group.items.map((userProduct) => (
              <div key={userProduct.id} className="border rounded-lg overflow-hidden">
                <ProductListItem
                  product={userProduct.product}
                  userProduct={userProduct}
                  readOnly={true}
                />
                {/* Purchase status indicator */}
                <div className="px-4 py-2 bg-gray-50 border-t">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    userProduct.status === ProductStatus.PURCHASED 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {userProduct.status === ProductStatus.PURCHASED ? '구입완료' : '미구입'}
                  </span>
                  {userProduct.purchaseDate && (
                    <span className="ml-2 text-xs text-gray-500">
                      {format(new Date(userProduct.purchaseDate), "MM/dd HH:mm", { locale: ko })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}