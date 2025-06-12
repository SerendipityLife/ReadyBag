import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductListItem } from "@/components/product/product-list-item";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Heart, RotateCcw, FolderOpen, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isNonMember = !user;
  const [purchasedProducts, setPurchasedProducts] = useState<ExtendedUserProduct[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TravelGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mutation to delete purchased item and return it to explore
  const returnToExplore = useMutation({
    mutationFn: async (userProductId: number) => {
      if (isNonMember) {
        // For non-members, remove from local storage
        const storageKey = `userProducts_${selectedCountry.id}`;
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedData = existingData.filter((item: any) => item.id !== userProductId);
        localStorage.setItem(storageKey, JSON.stringify(updatedData));
        window.dispatchEvent(new Event('localStorageChange'));
        return { success: true };
      } else {
        // For logged-in users, delete via API
        const response = await apiRequest(`${API_ROUTES.USER_PRODUCTS}/${userProductId}`, "DELETE");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
      });
      refetch();
      // Update selected group if it exists
      if (selectedGroup) {
        const updatedGroup = {
          ...selectedGroup,
          items: selectedGroup.items.filter(item => returnToExplore.variables !== item.id)
        };
        setSelectedGroup(updatedGroup);
        if (updatedGroup.items.length === 0) {
          setIsModalOpen(false);
          setSelectedGroup(null);
        }
      }
    }
  });

  // Mutation to delete entire travel folder
  const deleteTravelFolder = useMutation({
    mutationFn: async (group: TravelGroup) => {
      if (isNonMember) {
        // For non-members, remove all items in the group from local storage
        const storageKey = `userProducts_${selectedCountry.id}`;
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const itemIds = group.items.map(item => item.id);
        const updatedData = existingData.filter((item: any) => !itemIds.includes(item.id));
        localStorage.setItem(storageKey, JSON.stringify(updatedData));
        window.dispatchEvent(new Event('localStorageChange'));
        return { success: true };
      } else {
        // For logged-in users, delete all items in the group via API
        const deletePromises = group.items.map(item => 
          apiRequest(`${API_ROUTES.USER_PRODUCTS}/${item.id}`, "DELETE")
        );
        await Promise.all(deletePromises);
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
      });
      refetch();
      setIsModalOpen(false);
      setSelectedGroup(null);
      toast({
        title: "폴더 삭제 완료",
        description: "여행 폴더와 모든 상품이 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "삭제 실패",
        description: "폴더 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

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

  const openModal = (group: TravelGroup) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };

  return (
    <>
      <div className="space-y-4">
        {groupedByTravel.map((group, index) => (
          <div 
            key={index} 
            className="bg-white border rounded-lg shadow-sm p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center space-x-3 flex-1 cursor-pointer"
                onClick={() => openModal(group)}
              >
                <FolderOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{group.country} 여행</h3>
                  <p className="text-sm text-gray-600">{group.dateRange}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-600">{group.items.length}개 상품</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTravelFolder.mutate(group);
                  }}
                  disabled={deleteTravelFolder.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for showing products */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <span>{selectedGroup?.country} 여행 - {selectedGroup?.dateRange}</span>
              <span className="text-sm font-normal text-gray-500">
                ({selectedGroup?.items.length}개 상품)
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {selectedGroup?.items.map((userProduct) => (
              <div key={userProduct.id} className="border rounded-lg overflow-hidden">
                <ProductListItem
                  product={userProduct.product}
                  userProduct={userProduct}
                  readOnly={true}
                />
                {/* Purchase status indicator and return button */}
                <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
                  <div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => returnToExplore.mutate(userProduct.id)}
                    disabled={returnToExplore.isPending}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    다시구경
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}