import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ size = 24, className = '', style = {} }: LogoProps) {
  return (
    <img 
      src="/logo.jpg" 
      alt="BIS AI Assistant Logo" 
      width={size} 
      height={size} 
      className={className} 
      style={{ display: 'block', flexShrink: 0, borderRadius: '20%', objectFit: 'cover', ...style }} 
    />
  );
}
