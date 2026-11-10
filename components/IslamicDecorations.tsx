import React from 'react';

/**
 * Clean star / badge icon (minimal, no ornate decoration)
 */
export const IslamicStarIcon: React.FC<{ className?: string; size?: number; fill?: string; stroke?: string }> = () => null;

/**
 * Corner ornaments: completely removed per user request
 */
export const MushafCornerOrnaments: React.FC = () => null;

/**
 * Minimal Divider for multiple Surahs on a single Mushaf page - clean line without decorations or stars
 */
export const IslamicSectionDivider: React.FC<{ className?: string }> = ({ className = "my-6" }) => (
  <div className={`${className} flex items-center justify-center select-none`} aria-hidden="true">
    <div className="w-full max-w-md mx-auto h-px bg-border-subtle/40" />
  </div>
);

/**
 * Hizb/Juz Margin Badge - clean text badge without ornate stars or heavy borders
 */
export const HizbMarginBadge: React.FC<{ label: string; side?: 'left' | 'right' }> = ({ label, side = 'right' }) => (
  <div className={`hizb-marker ${side} flex items-center shadow-xs bg-surface/90 rounded-full px-2.5 py-0.5 text-xs font-medium text-text-secondary z-20`}>
    <span>{label}</span>
  </div>
);
