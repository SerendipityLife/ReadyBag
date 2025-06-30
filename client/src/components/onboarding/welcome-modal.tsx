import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Heart, ShoppingBag, ArrowRight, X } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      icon: <ShoppingBag className="w-16 h-16 text-blue-600" />,
      title: "ReadyBag에 오신 것을 환영합니다!",
      description: "해외여행에서 꼭 사야 할 인기 상품들을 미리 발견하고 계획해보세요.",
      subtitle: "스마트한 여행 쇼핑의 시작"
    },
    {
      icon: <Calendar className="w-16 h-16 text-green-600" />,
      title: "여행 날짜별 쇼핑 히스토리 관리",
      description: "여행 날짜별로 상품을 분류하고 구매 기록을 체계적으로 관리할 수 있습니다.",
      subtitle: "날짜별 맞춤 관리"
    },
    {
      icon: <MapPin className="w-16 h-16 text-red-600" />,
      title: "숙박지를 추가하세요",
      description: "숙박지 주변의 마트, 쇼핑몰 등 쇼핑 가능한 곳을 쉽게 찾을 수 있습니다.",
      subtitle: "위치 기반 쇼핑 가이드"
    },
    {
      icon: <Heart className="w-16 h-16 text-pink-600" />,
      title: "상품을 탐색하고 저장하세요",
      description: "여행 날짜별로 상품을 분류하고 구매 기록을 체계적으로 관리할 수 있습니다.",
      subtitle: "날짜별 쇼핑 히스토리 관리"
    }
  ];

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onClose();
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  const handleTodayOnly = () => {
    onClose();
    const today = new Date().toDateString();
    localStorage.setItem('welcomeSkippedDate', today);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <DialogHeader>
          <DialogTitle className="sr-only">ReadyBag 온보딩</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg p-6">
            <div className="text-center space-y-4">
              {/* 아이콘 */}
              <div className="flex justify-center">
                {currentStepData.icon}
              </div>

              {/* 제목 */}
              <h2 className="text-xl font-bold text-gray-800">
                {currentStepData.title}
              </h2>

              {/* 부제목 */}
              <p className="text-sm font-medium text-blue-600">
                {currentStepData.subtitle}
              </p>

              {/* 설명 */}
              <p className="text-gray-600 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* 진행 상황 표시 */}
              <div className="flex justify-center space-x-2 py-4">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? "bg-blue-600 w-6"
                        : index < currentStep
                        ? "bg-blue-400"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* 버튼 영역 */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLastStep ? (
                    <>
                      시작하기
                      <ShoppingBag className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      다음
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {!isLastStep && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleTodayOnly}
                      className="flex-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      오늘은 그만보기
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="flex-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      앞으로 열지 않기
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}