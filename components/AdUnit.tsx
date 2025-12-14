import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  slotId?: string;
  className?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  label?: string;
}

// Global configuration for AdSense
const AD_CLIENT_ID = "ca-pub-YOUR_CLIENT_ID_HERE";

export const AdUnit: React.FC<AdUnitProps> = ({ 
  slotId = "1234567890", // Default placeholder slot
  className = "",
  format = "auto",
  label = "Advertisement"
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    // Avoid double push in React StrictMode
    if (loaded.current) return;

    // Wrap in setTimeout to allow layout to settle
    // This fixes "No slot size for availableWidth=0" errors
    const timer = setTimeout(() => {
      try {
        if (adRef.current && adRef.current.clientWidth > 0) {
           // @ts-ignore
           (window.adsbygoogle = window.adsbygoogle || []).push({});
           loaded.current = true;
        } else {
          // If hidden or no width, we skip to avoid error
          console.debug("Ad container not visible, skipping push");
        }
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`w-full flex flex-col items-center justify-center my-8 ${className}`}>
      {label && <span className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">{label}</span>}
      <div className="w-full bg-slate-100 rounded-lg overflow-hidden min-h-[90px] flex items-center justify-center border border-slate-200">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={AD_CLIENT_ID}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
        {/* Visual placeholder for development (hidden when ads load) */}
        <div className="absolute text-slate-400 text-sm font-medium opacity-50 pointer-events-none">
          Google AdSpace
        </div>
      </div>
    </div>
  );
};