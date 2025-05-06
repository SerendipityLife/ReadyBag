import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus } from "@/lib/constants";
import { RefreshCw, Instagram } from "lucide-react";
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
      const response = await apiRequest(
        "PATCH",
        `${API_ROUTES.USER_PRODUCTS}/${userProduct.id}`,
        { status: newStatus }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTES.USER_PRODUCTS] });
    }
  });

  // Opens classification modal to change status
  const handleChangeClassification = () => {
    // In a real implementation, this would open a modal with options
    // Here we'll just cycle between statuses as a simple demonstration
    const statuses = [ProductStatus.INTERESTED, ProductStatus.NOT_INTERESTED, ProductStatus.MAYBE];
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
          <div className="mt-2 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs py-0.5 px-2 h-8 border-neutral text-neutral hover:bg-neutral hover:text-white"
              onClick={handleChangeClassification}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              분류변경
            </Button>
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
          </div>
        )}
      </div>
    </div>
  );
}
