import React from 'react';
import { Link } from 'react-router-dom';

interface PremiumGateProps {
  children: React.ReactNode;
  /**
   * When true, the gate is open (premium user) — children rendered normally.
   * When false, a blurred lock overlay is shown.
   */
  isUnlocked: boolean;
  /**
   * Label shown on the lock overlay, defaults to "Premium Exclusive"
   */
  label?: string;
  className?: string;
}

const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  isUnlocked,
  label = 'Premium Exclusive',
  className = '',
}) => {
  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Blurred content preview */}
      <div className="blur-sm brightness-75 pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-indigo-950/60 via-indigo-950/70 to-indigo-950/80 rounded-2xl">
        {/* Glow ring */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)',
            boxShadow: '0 0 24px rgba(251,191,36,0.5)',
          }}
        >
          <svg className="w-7 h-7 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 1a5 5 0 00-5 5v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 7V6a3 3 0 10-6 0v2h6zm-3 4a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <p
          className="text-[10px] font-black uppercase tracking-widest mb-1"
          style={{ color: '#fcd34d' }}
        >
          {label}
        </p>
        <p className="text-white text-xs font-medium mb-4 opacity-80 text-center px-4">
          Upgrade to Premium to unlock this content
        </p>

        <Link
          to="/premium"
          className="flex items-center gap-1.5 text-amber-900 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)',
            boxShadow: '0 4px 16px rgba(251,191,36,0.4)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Unlock with Premium
        </Link>
      </div>
    </div>
  );
};

export default PremiumGate;
