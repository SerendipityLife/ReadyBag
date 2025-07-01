import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Star, MessageSquare } from "lucide-react";
import { ProductReviews } from "./product-reviews";

interface ReviewButtonProps {
  productId: number;
  productName: string;
  variant?: "button" | "icon";
  size?: "sm" | "default";
  readOnly?: boolean;
}

export function ReviewButton({ productId, productName, variant = "button", size = "sm", readOnly = false }: ReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="outline" size={size} className="px-2">
            <MessageSquare className="h-3 w-3" />
          </Button>
        ) : (
          <Button variant="outline" size={size} className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            리뷰
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {productName} - 리뷰
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ProductReviews productId={productId} productName={productName} readOnly={readOnly} />
        </div>
      </DialogContent>
    </Dialog>
  );
}