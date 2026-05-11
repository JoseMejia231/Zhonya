import React from 'react';

interface MonaMarkProps {
  size?: number;
  className?: string;
}

export const MonaMark: React.FC<MonaMarkProps> = ({ size = 24, className }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <circle cx="14" cy="15" r="5.5" fill="#836637" opacity="0.22" />
      <circle cx="34" cy="15" r="5.5" fill="#836637" opacity="0.22" />
      <circle cx="24" cy="25" r="13.5" fill="#836637" />
      <circle cx="24" cy="27" r="8.8" fill="#F5F5F0" opacity="0.96" />
      <circle cx="18.3" cy="22" r="1.8" fill="#F5F5F0" />
      <circle cx="29.7" cy="22" r="1.8" fill="#F5F5F0" />
      <path
        d="M21.6 28.4c1 1.1 2.2 1.7 2.4 1.7s1.4-.6 2.4-1.7"
        stroke="#836637"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.3 25.4h1.4"
        stroke="#836637"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12.4 34.2c2.7 3 6.4 4.8 11.6 4.8s8.9-1.8 11.6-4.8"
        stroke="#836637"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30.8 12.8c2.4.4 4.2 1.7 5.1 3.6"
        stroke="#2D5A27"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

