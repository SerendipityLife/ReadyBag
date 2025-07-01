import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Star, MessageSquare } from "lucide-react";
import { API_ROUTES } from "../lib/constants";
import type { ProductReview } from "@shared/schema";

interface ProductReviewsDisplayProps {
  productId: number;
  productName: string;
}

export function ProductReviewsDisplay({ productId, productName }: ProductReviewsDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 text-xs"
        disabled
      >
        <MessageSquare className="h-3 w-3 mr-1" />
        리뷰 로딩중...
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 text-xs"
        onClick={() => setIsModalOpen(true)}
      >
        <MessageSquare className="h-3 w-3 mr-1" />
        리뷰 ({reviews.length})
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {productName} - 리뷰
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">아직 리뷰가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <CardContent className="p-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="text-sm font-medium">
                              {review.isAnonymous ? "익명" : review.reviewerName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      
                      {review.reviewText && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {review.reviewText}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}