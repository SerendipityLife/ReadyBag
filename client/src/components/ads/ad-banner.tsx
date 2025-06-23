import React from 'react';

interface AdBannerProps {
  className?: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

/**
 * 구글 애드센스 광고를 표시하는 컴포넌트
 * 실제 애플리케이션에서는 애드센스 스크립트를 추가해야 합니다.
 * 개발 환경에서는 광고 공간만 표시됩니다.
 */
export function AdBanner({
  className = '',
  adFormat = 'auto',
  style = {},
}: AdBannerProps) {
  // 광고 형식에 따른 크기 설정
  let adSizeClasses = 'min-h-[250px]';
  let adLabel = '광고 공간';
  
  if (adFormat === 'rectangle') {
    adSizeClasses = 'min-h-[250px] min-w-[300px]';
    adLabel = '광고 공간 (300x250)';
  } else if (adFormat === 'horizontal') {
    adSizeClasses = 'min-h-[90px] w-full max-w-[728px]';
    adLabel = '광고 공간 (728x90)';
  } else if (adFormat === 'vertical') {
    adSizeClasses = 'min-h-[600px] min-w-[160px]';
    adLabel = '광고 공간 (160x600)';
  }

  return (
    <div 
      className={`ad-container overflow-hidden border border-dashed border-gray-200 rounded-md flex items-center justify-center bg-gray-50 ${adSizeClasses} ${className}`}
      style={style}
    >
      <div className="text-gray-400 text-sm flex flex-col items-center justify-center h-full">
        <span className="mb-1">{adLabel}</span>
        <span className="text-xs">구글 애드센스</span>
      </div>
    </div>
  );
}