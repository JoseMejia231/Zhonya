import React, { useId } from 'react';

interface MonaMarkProps {
  size?: number;
  className?: string;
}

export const MonaMark: React.FC<MonaMarkProps> = ({ size = 24, className }) => {
  const shadowId = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <defs>
        <filter id={`mona-shadow-${shadowId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.16" />
        </filter>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="18" fill="#F7F4EC" filter={`url(#mona-shadow-${shadowId})`} />

      <circle cx="19" cy="26" r="7.5" fill="#836637" />
      <circle cx="45" cy="26" r="7.5" fill="#836637" />
      <circle cx="19" cy="26" r="4.8" fill="#F0D5A1" />
      <circle cx="45" cy="26" r="4.8" fill="#F0D5A1" />

      <path
        d="M32 13c11.5 0 20.8 9.3 20.8 20.8 0 9.3-4.9 16.5-12.7 20.5-2.2 1.1-5.2 1.7-8.1 1.7s-5.9-.6-8.1-1.7C16.1 50.3 11.2 43.1 11.2 33.8 11.2 22.3 20.5 13 32 13Z"
        fill="#836637"
      />

      <path
        d="M20.5 31.5c0-6.5 5.1-11.8 11.5-11.8s11.5 5.3 11.5 11.8c0 9.2-6.4 17.4-11.5 17.4s-11.5-8.2-11.5-17.4Z"
        fill="#F0D5A1"
      />

      <rect x="22.7" y="26.2" width="4.8" height="10.2" rx="2.4" fill="#836637" />
      <rect x="36.5" y="26.2" width="4.8" height="10.2" rx="2.4" fill="#836637" />

      <path d="M28.2 38.5c1.2 1.3 2.8 2.1 3.8 2.1s2.6-.8 3.8-2.1" stroke="#836637" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31.9 34.4h.2" stroke="#836637" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M21.7 44.7c2.5 2.7 5.9 4.2 10.3 4.2s7.8-1.5 10.3-4.2" stroke="#836637" strokeWidth="2.4" strokeLinecap="round" opacity="0.65" />
      <path d="M39.8 14.7c2.5.5 4.5 2 5.6 4.1" stroke="#2D5A27" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
};

