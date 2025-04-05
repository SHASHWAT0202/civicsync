import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className, size = 50 }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image 
        src="/logo.jpg" 
        alt="CivicSync Logo" 
        width={size} 
        height={size} 
        className="rounded-full"
        priority
      />
    </Link>
  );
} 