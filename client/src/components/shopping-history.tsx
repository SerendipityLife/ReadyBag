import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductListItem } from "@/components/product/product-list-item";
import { ReviewButton } from "@/components/product/review-button";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Heart, FolderOpen, X, Trash2, Edit2, Check, X as XIcon, MapPin, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  totalAmount: number;
  totalAmountKrw: number;
  travelDateId: string;
  customTitle?: string;
}

// 숙박지 주소 표시 컴포넌트
function AccommodationAddressDisplay({ address }: { address: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "주소가 복사되었습니다",
        description: "클립보드에 저장되었습니다.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "복사 실패",
        description: "주소 복사에 실패했습니다.",
      });
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 p-1 h-auto"
        >
          <MapPin className="h-3 w-3 mr-1" />
          <span className="text-xs">숙박지</span>
        </Button>
        
        {isVisible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(address)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isVisible && (
        <div className="mt-1 px-2 py-1.5 bg-blue-50 border border-blue-100 roundedext-xs text-sand-brown-700 break-words">
          {address}
        </div>
      )}
    </div>
  );
}

export function ShoppingHistory() {
  const { selectedCountry, removeTravelDateWithProducts } = useAppContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isNonMember = !user;
  const [purchasedProducts, setPurchasedProducts] = useState<ExtendedUserProduct[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TravelGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<TravelGroup | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<TravelGroup | null>(null);
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [showAccommodationAddress, setShowAccommodationAddress] = useState(false);

  // Helper function to calculate total amounts for a group
  const calculateGroupTotal = (items: ExtendedUserProduct[]) => {
    let totalJpy = 0;
    let totalKrw = 0;
    
    items.forEach(item => {
      // 사용자가 입력한 실제 가격이 있으면 우선 사용
      if (item.actualPurchasePrice) {
        totalJpy += item.actualPurchasePrice;
        // 실제 가격의 원화 환산값 사용 (저장된 값이 있으면 사용, 없으면 9.57로 계산)
        if (item.actualPurchasePriceKrw) {
          totalKrw += item.actualPurchasePriceKrw;
        } else {
          totalKrw += Math.round(item.actualPurchasePrice * 9.57);
        }
      } else if (item.product?.price) {
        // 실제 가격이 없으면 예상 가격 사용
        totalJpy += item.product.price;
        totalKrw += Math.round(item.product.price * 9.57);
      }
    });
    
    return { totalJpy, totalKrw };
  };

  // Helper function to get/set custom titles from localStorage
  const getCustomTitle = (travelDateId: string): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    try {
      const customTitles = JSON.parse(localStorage.getItem('travelFolderTitles') || '{}');
      return customTitles[travelDateId];
    } catch {
      return undefined;
    }
  };

  const saveCustomTitle = (travelDateId: string, title: string) => {
    if (typeof window === 'undefined') return;
    try {
      const customTitles = JSON.parse(localStorage.getItem('travelFolderTitles') || '{}');
      if (title.trim()) {
        customTitles[travelDateId] = title.trim();
      } else {
        delete customTitles[travelDateId];
      }
      localStorage.setItem('travelFolderTitles', JSON.stringify(customTitles));
    } catch (error) {
      console.error('Error saving custom title:', error);
    }
  };

  // Functions to handle title editing
  const startEditingTitle = (group: TravelGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupToEdit(group);
    setEditTitle(group.customTitle || `${group.country} 여행`);
    setIsEditTitleOpen(true);
  };

  const saveTitle = () => {
    if (groupToEdit) {
      saveCustomTitle(groupToEdit.travelDateId, editTitle);
      setIsEditTitleOpen(false);
      setGroupToEdit(null);
      setEditTitle("");
      // Trigger a re-render by updating the component state
      setPurchasedProducts(prev => [...prev]);
    }
  };

  const cancelEditTitle = () => {
    setIsEditTitleOpen(false);
    setGroupToEdit(null);
    setEditTitle("");
  };



  // Mutation to delete entire travel folder
  const deleteTravelFolder = useMutation({
    mutationFn: async (group: TravelGroup) => {
      // Extract travel date ID from the first item in the group
      const travelDateId = group.items[0]?.travelDateId;
      
      if (!travelDateId) {
        throw new Error('Travel date ID not found');
      }
      
      // Use the context function to delete travel date with all its products
      await removeTravelDateWithProducts(travelDateId);
      
      return { success: true };
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
        description: "여행 폴더와 모든 상품이 삭제되었습니다.",
        duration: 2000,
      });
    },
    onError: () => {
      toast({
        description: "폴더 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 2000,
      });
    }
  });

  // Functions to handle confirmation dialog
  const handleDeleteClick = (group: TravelGroup) => {
    setGroupToDelete(group);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (groupToDelete) {
      deleteTravelFolder.mutate(groupToDelete);
      setIsDeleteConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setGroupToDelete(null);
  };

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
    const travelDateId = product.travelDateId || 'no-date';
    
    let dateRange = "날짜 미설정";
    if (startDate && endDate) {
      dateRange = `${format(startDate, "yyyy.MM.dd", { locale: ko })} - ${format(endDate, "yyyy.MM.dd", { locale: ko })}`;
    } else if (startDate) {
      dateRange = format(startDate, "yyyy.MM.dd", { locale: ko });
    }
    
    const existingGroup = groups.find(g => g.travelDateId === travelDateId);
    
    if (existingGroup) {
      existingGroup.items.push(product);
    } else {
      const customTitle = getCustomTitle(travelDateId);
      groups.push({
        dateRange,
        country: selectedCountry.name,
        items: [product],
        totalAmount: 0,
        totalAmountKrw: 0,
        travelDateId,
        customTitle
      });
    }
    
    return groups;
  }, []);

  // Calculate totals for each group
  groupedByTravel.forEach(group => {
    const { totalJpy, totalKrw } = calculateGroupTotal(group.items);
    group.totalAmount = totalJpy;
    group.totalAmountKrw = totalKrw;
  });

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
    setShowAccommodationAddress(false);
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
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.customTitle || `${group.country} 여행`}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      onClick={(e) => startEditingTitle(group, e)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{group.dateRange}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-medium text-green-700">
                      총 ¥{group.totalAmount.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({group.totalAmountKrw.toLocaleString()}원)
                    </span>
                  </div>
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
                    handleDeleteClick(group);
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 -mt-6 px-6 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-lg font-bold text-gray-900 leading-tight">
                  {selectedGroup?.customTitle || `${selectedGroup?.country} 여행`}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-0.5">
                  {selectedGroup?.dateRange}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* 숙박지 아이콘 */}
                {selectedGroup?.items.some(item => item.accommodationAddress) && (
                  <button
                    onClick={() => setShowAccommodationAddress(!showAccommodationAddress)}
                    className="p-2 bg-white text-sand-brown-600 rounded-lg shadow-sm border border-sand-brown-100 hover:bg-sand-brown-50 transition-colors"
                    title="숙박지 주소 보기"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                )}
                
                <div className="inline-flex items-center px-3 py-1.5 bg-white text-sand-brown-700 text-sm font-medium rounded-lg shadow-sm border border-sand-brown-100">
                  <span className="w-1.5 h-1.5 bg-sand-brown-500 rounded-full mr-2"></span>
                  {selectedGroup?.items.length}개 상품
                </div>
                <div className="inline-flex items-center px-3 py-1.5 bg-sand-brown-50 border border-sand-brown-200 rounded-lg">
                  <div className="text-sm font-semibold text-sand-brown-800">
                    ¥{selectedGroup?.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-sand-brown-600 ml-2">
                    약 {selectedGroup?.totalAmountKrw.toLocaleString()}원
                  </div>
                </div>
              </div>
            </div>
            
            {/* 숙박지 주소 표시 - 토글 가능 */}
            {showAccommodationAddress && selectedGroup?.items.some(item => item.accommodationAddress) && (
              <div className="mt-3 px-4 py-3 bg-sand-brown-50 border border-sand-brown-200 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-sand-brown-600" />
                      <span className="text-sm font-medium text-sand-brown-800">숙박지 주소</span>
                    </div>
                    <p className="text-sm text-sand-brown-700 leading-relaxed">
                      {selectedGroup?.items.find(item => item.accommodationAddress)?.accommodationAddress}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const address = selectedGroup?.items.find(item => item.accommodationAddress)?.accommodationAddress;
                      if (address) {
                        navigator.clipboard.writeText(address);
                        toast({
                          title: "주소가 복사되었습니다",
                          description: "클립보드에 숙박지 주소가 저장되었습니다.",
                        });
                      }
                    }}
                    className="p-2 text-sand-brown-600 hover:bg-sand-brown-100 rounded-md transition-colors"
                    title="주소 복사"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {selectedGroup?.items.map((userProduct) => (
              <div key={userProduct.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <ProductListItem
                  product={userProduct.product}
                  userProduct={userProduct}
                  readOnly={true}
                />
                {/* Enhanced status and info section */}
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        userProduct.status === ProductStatus.PURCHASED 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        {userProduct.status === ProductStatus.PURCHASED ? '✓ 구입완료' : '⏳ 미구입'}
                      </span>
                      {userProduct.purchaseDate && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          {format(new Date(userProduct.purchaseDate), "MM/dd HH:mm", { locale: ko })}
                        </span>
                      )}
                    </div>
                    {/* Review button for purchased items only */}
                    {userProduct.status === ProductStatus.PURCHASED && userProduct.product && (
                      <ReviewButton 
                        productId={userProduct.productId} 
                        productName={userProduct.product.name}
                        variant="button"
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing folder title */}
      <Dialog open={isEditTitleOpen} onOpenChange={setIsEditTitleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>폴더 이름 수정</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                폴더 이름
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="폴더 이름을 입력하세요"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') cancelEditTitle();
                }}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={cancelEditTitle}
            >
              취소
            </Button>
            <Button
              onClick={saveTitle}
              disabled={!editTitle.trim()}
            >
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for folder deletion */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>폴더 삭제 확인</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              "{groupToDelete?.customTitle || `${groupToDelete?.country} 여행`} - {groupToDelete?.dateRange}" 폴더와 모든 상품({groupToDelete?.items.length}개)을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-red-600 mt-2">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteTravelFolder.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteTravelFolder.isPending}
            >
              {deleteTravelFolder.isPending ? "삭제 중..." : "삭제"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}