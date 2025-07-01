import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Header } from "../components/layout/header";
import { BottomNavigation } from "../components/layout/bottom-navigation";
import { ProductListItem } from "../components/product/product-list-item";
import { Button } from "../components/ui/button";
import { API_ROUTES } from "../lib/constants";
import { ChevronLeft, Share2 } from "lucide-react";

export default function SharedList() {
  const [, params] = useRoute("/shared/:shareId");
  const shareId = params?.shareId;
  
  // Fetch shared list data
  const { data, isLoading, error } = useQuery({
    queryKey: [API_ROUTES.SHARED_LIST, shareId],
    enabled: !!shareId,
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 pb-24 pt-4 flex-1 flex items-center justify-center">
          <p>공유 목록을 불러오는 중...</p>
        </main>
        <BottomNavigation />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 pb-24 pt-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">공유 목록을 찾을 수 없습니다</h2>
            <p className="text-neutral mb-6">
              요청하신 공유 목록이 존재하지 않거나 만료되었을 수 있습니다.
            </p>
            <Button 
              className="bg-primary text-white py-3 px-6 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
              onClick={() => window.location.href = "/"}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }
  
  const { userProducts, country, sharedBy, sharedAt } = data;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 pb-24 pt-4 flex-1">
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h2 className="text-xl font-heading font-semibold mb-2">
              {sharedBy || "사용자"}님이 공유한 {country.name} 쇼핑 목록
            </h2>
            <div className="text-sm text-neutral">
              공유일: {new Date(sharedAt).toLocaleDateString()}
            </div>
          </div>
          
          {userProducts.length === 0 ? (
            <div className="text-center p-8">
              <p>공유된 상품이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProducts.map((userProduct: any) => (
                <ProductListItem
                  key={userProduct.id}
                  product={userProduct.product}
                  userProduct={userProduct}
                  readOnly={true}
                />
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Button
              className="bg-primary text-white py-3 px-6 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
              onClick={() => window.location.href = "/"}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              내 쇼핑 목록 만들기
            </Button>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
