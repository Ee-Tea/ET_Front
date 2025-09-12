'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingPageProps {
  isLoading?: boolean;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ isLoading = true }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col mobile-container">
      {/* FT 로고 */}
      <div className="flex-1 flex items-center justify-center">
        <Image 
          src="/FT-logo.png" 
          alt="FT" 
          width={160} 
          height={160} 
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default LoadingPage;
