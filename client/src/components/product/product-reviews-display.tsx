import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { API_ROUTES } from "@/lib/constants";
import type { ProductReview } from "@shared/schema";

interface ProductReviewsDisplayProps {
  productId: number;
  productName: string;
}

export function ProductReviewsDisplay({ productId, productName }: ProductReviewsDisplayProps) {
  // Fetch reviews for this product
  const { data: reviews = [], isLoading } = useQuery<ProductReview[]>({
    queryKey: [API_ROUTES.PRODUCT_REVIEWS, productId],
    queryFn: async () => {
      const response = await fetch(`${API_ROUTES.PRODUCT_REVIEWS}/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">리뷰</span>
        </div>
        <p className="text-xs text-gray-500">리뷰를 불러오는 중...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">리뷰 (0)</span>
        </div>
        <p className="text-xs text-gray-500">아직 리뷰가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">리뷰 ({reviews.length})</span>
      </div>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {reviews.slice(0, 3).map((review) => (
          <Card key={review.id} className="p-3">
            <CardContent className="p-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {renderStars(review.rating)}
                    <span className="text-xs font-medium">
                      {review.isAnonymous ? "익명" : review.reviewerName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              
              {review.reviewText && (
                <p className="text-xs text-gray-700 line-clamp-2">{review.reviewText}</p>
              )}
            </CardContent>
          </Card>
        ))}
        
        {reviews.length > 3 && (
          <p className="text-xs text-gray-500 text-center">
            {reviews.length - 3}개의 리뷰가 더 있습니다
          </p>
        )}
      </div>
    </div>
  );
}