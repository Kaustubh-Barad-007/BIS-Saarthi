import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ size = 24, className = '', style = {} }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-label="BIS Assistant Logo"
    >
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#00d084" />
        </linearGradient>
      </defs>
      {/* Hexagonal shield */}
      <path
        d="M24 4 C29 4 38 8 42 10 L42 25 C42 36 24 44 24 44 C24 44 6 36 6 25 L6 10 C10 8 19 4 24 4 Z"
        fill="url(#lg1)"
      />
      {/* Inner shield */}
      <path
        d="M24 9 C28 9 35 12 38 14 L38 25 C38 33 24 40 24 40 C24 40 10 33 10 25 L10 14 C13 12 20 9 24 9 Z"
        fill="rgba(255,255,255,0.1)"
      />
      {/* Checkmark */}
      <path
        d="M15.5 25 L21.5 31.5 L32.5 18"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* AI dot accent */}
      <circle cx="37" cy="11" r="4.5" fill="#00d084" />
      <circle cx="37" cy="11" r="2" fill="#FFFFFF" />
    </svg>
  );
}
