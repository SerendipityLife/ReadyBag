import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, MessageSquare, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ROUTES } from "@/lib/constants";
import type { ProductReview } from "@shared/schema";

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isWritingReview, setIsWritingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState(user?.nickname || "");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Fetch reviews for this product
  const { data: reviews = [], isLoading } = useQuery<ProductReview[]>({
    queryKey: [API_ROUTES.PRODUCT_REVIEWS, productId],
    queryFn: async () => {
      const response = await fetch(`${API_ROUTES.PRODUCT_REVIEWS}/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
  });

  // Check if current user has already reviewed this product
  const userReview = reviews.find(review => 
    user ? review.userId === user.id : review.sessionId === localStorage.getItem('sessionId')
  );

  // Create review mutation
  const createReview = useMutation({
    mutationFn: async (reviewData: {
      productId: number;
      rating: number;
      reviewText: string;
      reviewerName: string;
      isAnonymous: boolean;
    }) => {
      return apiRequest("POST", API_ROUTES.PRODUCT_REVIEWS, reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTES.PRODUCT_REVIEWS, productId] });
      setIsWritingReview(false);
      resetForm();
      toast({
        title: "리뷰가 작성되었습니다",
        description: "다른 사용자들이 당신의 리뷰를 볼 수 있습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "리뷰 작성 실패",
        description: error.message || "리뷰 작성에 실패했습니다.",
      });
    },
  });

  // Update review mutation
  const updateReview = useMutation({
    mutationFn: async (data: { id: number; reviewData: any }) => {
      return apiRequest("PUT", `${API_ROUTES.PRODUCT_REVIEWS}/${data.id}`, data.reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTES.PRODUCT_REVIEWS, productId] });
      setEditingReview(null);
      resetForm();
      toast({
        title: "리뷰가 수정되었습니다",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "리뷰 수정 실패",
        description: error.message || "리뷰 수정에 실패했습니다.",
      });
    },
  });

  // Delete review mutation
  const deleteReview = useMutation({
    mutationFn: async (reviewId: number) => {
      return apiRequest("DELETE", `${API_ROUTES.PRODUCT_REVIEWS}/${reviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTES.PRODUCT_REVIEWS, productId] });
      toast({
        title: "리뷰가 삭제되었습니다",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "리뷰 삭제 실패",
        description: error.message || "리뷰 삭제에 실패했습니다.",
      });
    },
  });

  const resetForm = () => {
    setRating(5);
    setReviewText("");
    setReviewerName(user?.nickname || "");
    setIsAnonymous(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewText.trim() || !reviewerName.trim()) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "리뷰 내용과 작성자명을 모두 입력해주세요.",
      });
      return;
    }

    const reviewData = {
      productId,
      rating,
      reviewText: reviewText.trim(),
      reviewerName: reviewerName.trim(),
      isAnonymous,
    };

    if (editingReview) {
      updateReview.mutate({ id: editingReview.id, reviewData });
    } else {
      createReview.mutate(reviewData);
    }
  };

  const startEdit = (review: ProductReview) => {
    setEditingReview(review);
    setRating(review.rating);
    setReviewText(review.reviewText || "");
    setReviewerName(review.reviewerName || "");
    setIsAnonymous(review.isAnonymous || false);
    setIsWritingReview(true);
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <span className="font-medium">리뷰</span>
        </div>
        <p className="text-sm text-gray-500">리뷰를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <span className="font-medium">리뷰 ({reviews.length})</span>
        </div>
        
        {!userReview && (
          <Dialog open={isWritingReview} onOpenChange={setIsWritingReview}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                리뷰 작성
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingReview ? "리뷰 수정" : "리뷰 작성"} - {productName}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>별점</Label>
                  {renderStars(rating, true, setRating)}
                </div>
                
                <div>
                  <Label htmlFor="reviewText">리뷰 내용</Label>
                  <Textarea
                    id="reviewText"
                    placeholder="이 상품에 대한 리뷰를 작성해주세요..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={1000}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reviewText.length}/1000 자
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="reviewerName">작성자명</Label>
                  <Input
                    id="reviewerName"
                    placeholder="리뷰에 표시될 이름"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    maxLength={50}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    익명으로 작성
                  </Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsWritingReview(false);
                      setEditingReview(null);
                      resetForm();
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={createReview.isPending || updateReview.isPending}
                  >
                    {editingReview ? "수정" : "작성"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <CardContent className="p-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium">
                        {review.isAnonymous ? "익명" : review.reviewerName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  
                  {/* Edit/Delete buttons for user's own review */}
                  {((user && review.userId === user.id) || 
                    (!user && review.sessionId === localStorage.getItem('sessionId'))) && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(review)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReview.mutate(review.id)}
                        disabled={deleteReview.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {review.reviewText && (
                  <p className="text-sm">{review.reviewText}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}