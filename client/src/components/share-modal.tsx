import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/contexts/AppContext";
import { Copy, X, Facebook, Twitter } from "lucide-react";
import { FaComment } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

export function ShareModal() {
  const { isShareModalOpen, closeShareModal, shareUrl } = useAppContext();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    if (!shareUrl || !inputRef.current) return;
    
    inputRef.current.select();
    document.execCommand('copy');
    
    toast({
      title: "링크가 복사되었습니다",
      description: "원하는 곳에 붙여넣기 하세요",
    });
  };
  
  // Share via social media
  const handleSocialShare = (platform: string) => {
    if (!shareUrl) return;
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Serendipity에서 공유한 쇼핑 목록을 확인해보세요!')}`;
        break;
      case 'kakao':
        // In a real app, this would use the Kakao SDK
        toast({
          title: "카카오 공유",
          description: "카카오 SDK 연동이 필요합니다",
        });
        return;
      default:
        return;
    }
    
    window.open(shareLink, '_blank');
  };
  
  return (
    <Dialog open={isShareModalOpen} onOpenChange={closeShareModal}>
      <DialogContent className="bg-white rounded-2xl p-6 w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">목록 공유</DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-neutral mb-4">
          아래 링크를 공유하면 친구들도 당신의 관심 상품을 볼 수 있어요.
        </p>
        
        <div className="flex items-center space-x-2 mb-6">
          <Input
            ref={inputRef}
            type="text"
            value={shareUrl || ""}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm bg-neutral-light"
            readOnly
          />
          <Button
            className="bg-primary text-white p-3 rounded-lg"
            onClick={handleCopy}
          >
            <Copy className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center w-12 h-auto p-0"
            onClick={() => handleSocialShare('facebook')}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white mb-1">
              <Facebook />
            </div>
            <span className="text-xs">Facebook</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center w-12 h-auto p-0"
            onClick={() => handleSocialShare('kakao')}
          >
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white mb-1">
              <FaComment />
            </div>
            <span className="text-xs">카카오</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center w-12 h-auto p-0"
            onClick={() => handleSocialShare('twitter')}
          >
            <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white mb-1">
              <Twitter />
            </div>
            <span className="text-xs">Twitter</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center w-12 h-auto p-0"
            onClick={handleCopy}
          >
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white mb-1">
              <Copy />
            </div>
            <span className="text-xs">URL</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
