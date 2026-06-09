import React from 'react';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ size = 'md', className = '', animate = true }) => {
  const sizes = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-3 py-1 text-[10px] gap-1.5',
    lg: 'px-4 py-1.5 text-xs gap-2',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-black uppercase tracking-widest rounded-full
        bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500
        text-amber-900 shadow-lg shadow-amber-200/60
        border border-amber-300/60
        ${sizes[size]}
        ${animate ? 'animate-pulse-slow' : ''}
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 40%, #f59e0b 70%, #d97706 100%)',
        boxShadow: '0 0 12px rgba(251,191,36,0.4), 0 2px 8px rgba(217,119,6,0.3)',
      }}
    >
      {/* Crown / star icon */}
      <svg
        className={`${iconSizes[size]} text-amber-800`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      Premium
    </span>
  );
};

export default PremiumBadge;
