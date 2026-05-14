import React from 'react';

interface MonaMarkProps {
  size?: number;
  className?: string;
}

export const MonaMark: React.FC<MonaMarkProps> = ({ size = 24, className }) => {
  return (
    <div 
      className={`overflow-hidden flex-shrink-0 ${className || ''}`} 
      style={{ width: size, height: size }}
    >
      <img
        src="/logo.jpeg"
        alt=""
        aria-hidden
        className="w-full h-full"
        draggable={false}
        style={{ 
          display: 'block', 
          objectFit: 'cover',
          transform: 'scale(1.15)', // Zoom in to hide the grey corners of the JPEG
        }}
      />
    </div>
  );
};

