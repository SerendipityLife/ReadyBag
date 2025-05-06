import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { RefreshCw, Instagram, Trash2, Heart, Triangle, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Product, UserProduct } from "@shared/schema";

interface ProductListItemProps {
  product: Product;
  userProduct: UserProduct;
  readOnly?: boolean;
}

export function ProductListItem({ product, userProduct, readOnly = false }: ProductListItemProps) {
  const queryClient = useQueryClient();
  const { selectedCountry } = useAppContext();

  // Update user product status mutation
  const updateStatus = useMutation({
    mutationFn: async (newStatus: ProductStatus) => {
      console.log("Updating status for ID:", userProduct.id, "to:", newStatus);
      try {
        const response = await apiRequest(
          "PATCH",
          `${API_ROUTES.USER_PRODUCTS}/${userProduct.id}`,
          { status: newStatus }
        );
        if (!response.ok) {
          console.error("Status update failed:", await response.json());
          throw new Error("Status update operation failed");
        }
        return response.json();
      } catch (error) {
        console.error("Error updating status:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Status update successful, invalidating queries");
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
    },
    onError: (error) => {
      console.error("Status update mutation error:", error);
    }
  });
  
  // Delete user product mutation
  const deleteUserProduct = useMutation({
    mutationFn: async () => {
      console.log("Deleting user product with ID:", userProduct.id);
      try {
        const response = await apiRequest(
          "DELETE",
          `${API_ROUTES.USER_PRODUCTS}/${userProduct.id}`
        );
        if (!response.ok) {
          console.error("Delete failed:", await response.json());
          throw new Error("Delete operation failed");
        }
        return response.json();
      } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Delete successful, invalidating queries");
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      // This is important to make the product reappear in the exploring section
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
      });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
    }
  });

  // Change product status directly
  const changeStatus = (newStatus: ProductStatus) => {
    updateStatus.mutate(newStatus);
  };
  
  // Legacy function for backwards compatibility
  const handleChangeClassification = () => {
    const statuses = [ProductStatus.INTERESTED, ProductStatus.MAYBE, ProductStatus.NOT_INTERESTED];
    const currentIndex = statuses.indexOf(userProduct.status as ProductStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    updateStatus.mutate(statuses[nextIndex]);
  };

  // Opens Instagram in a new tab with the hashtag search
  const handleInstagramSearch = () => {
    if (!product.hashtags || product.hashtags.length === 0) return;
    
    const hashtag = product.hashtags[0].replace("#", "");
    window.open(`https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}`, "_blank");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-24 h-24 object-cover"
      />
      
      <div className="p-3 flex-1">
        <div className="flex justify-between">
          <h3 className="font-medium text-sm">{product.name}</h3>
          <div className="text-right">
            <CurrencyDisplay
              amount={product.price}
              fromCurrency={selectedCountry.currency}
            />
          </div>
        </div>
        
        {!readOnly && (
          <div className="mt-2 flex flex-wrap space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs py-0.5 px-2 h-8 border-neutral text-neutral hover:bg-neutral hover:text-white"
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
              className="text-xs py-0.5 px-2 h-8 border-neutral text-neutral hover:bg-neutral hover:text-white"
              onClick={handleInstagramSearch}
              disabled={!product.hashtags || product.hashtags.length === 0}
            >
              <Instagram className="h-3 w-3 mr-1" />
              인스타
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs py-0.5 px-2 h-8 border-red-300 text-red-500 hover:bg-red-500 hover:text-white mt-2 md:mt-0"
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
