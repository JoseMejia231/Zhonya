import React from 'react';

interface MonaMarkProps {
  size?: number;
  className?: string;
}

export const MonaMark: React.FC<MonaMarkProps> = ({ size = 24, className }) => {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt=""
      aria-hidden
      className={className}
      draggable={false}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
};

