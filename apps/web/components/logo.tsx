'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({
  className = '',
  size = 72,
  showText = false,
}: LogoProps) {
  const [errorCount, setErrorCount] = useState(0);

  // Fallback cascade: /logo-black.png -> /logo.png -> /logo.svg
  const logoSources = ['/logo-black.png', '/logo.png', '/logo.svg'];
  const currentSrc = logoSources[Math.min(errorCount, logoSources.length - 1)];

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          key={currentSrc}
          src={currentSrc}
          alt="Hacker's Unity Logo"
          width={size}
          height={size}
          unoptimized
          className="object-contain w-auto h-14 sm:h-16 lg:h-[68px] transition-transform duration-200 group-hover:scale-105"
          priority
          onError={() => {
            if (errorCount < logoSources.length - 1) {
              setErrorCount((prev) => prev + 1);
            }
          }}
        />
      </div>

      {showText && (
        <div className="flex items-center font-black italic tracking-tight select-none text-xl sm:text-2xl leading-none whitespace-nowrap ml-2">
          <span className="text-[#0099e6] font-extrabold pr-1">
            Hacker&apos;s
          </span>
          <span className="text-[#ff7800] font-extrabold">
            Unity
          </span>
        </div>
      )}
    </div>
  );
}

