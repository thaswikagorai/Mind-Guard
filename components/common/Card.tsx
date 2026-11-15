
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // Fix: updated onClick type to accept MouseEvent to support event-aware handlers like stopPropagation()
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#cce7e3] p-5 sm:p-6 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        onClick
          ? 'cursor-pointer hover:border-[#8cd3ca] hover:bg-[#fafefe] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]'
          : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
