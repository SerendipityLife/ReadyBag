import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { API_ROUTES } from "@/lib/constants";
import type { ProductReview } from "@shared/schema";

interface ProductReviewsModalProps {
  productId: number;
  productName: string;
}

export function ProductReviewsModal({ productId, productName }: ProductReviewsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch reviews for this product
  const { data: reviews = [], isLoading } = useQuery<ProductReview[]>({
    queryKey: [API_ROUTES.PRODUCT_REVIEWS, productId],
    queryFn: async () => {
      const response = await fetch(`${API_ROUTES.PRODUCT_REVIEWS}/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: isOpen, // Only fetch when modal is open
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 p-0 hover:bg-gray-100"
      >
        <MessageSquare className="h-4 w-4 text-gray-500" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {productName} - 리뷰
            </DialogTitle>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {renderStars(Math.round(averageRating))}
                <span>평균 {averageRating.toFixed(1)}점 ({reviews.length}개 리뷰)</span>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">리뷰를 불러오는 중...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">아직 리뷰가 없습니다.</p>
                <p className="text-sm text-gray-400 text-center mt-1">
                  첫 번째 리뷰를 작성해보세요!
                </p>
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
                            {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {review.reviewText && (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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