/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface WaterColorSwatchProps {
  hex: string;
  label: string;
}

export const WaterColorSwatch: React.FC<WaterColorSwatchProps> = ({ hex, label }) => {
  return (
    <div className="flex flex-col items-center text-center gap-1.5 p-2 bg-slate-50/50 rounded-2xl border border-slate-100/50 min-w-[100px] flex-shrink-0" id={`swatch-${label.replace(/\s+/g, '-').toLowerCase()}`}>
      <div
        id="color-block"
        className="w-14 h-14 rounded-2xl border border-slate-200/80 shadow-inner flex items-center justify-center transition-transform hover:scale-105 duration-300"
        style={{ backgroundColor: hex }}
      >
        <div className="w-4 h-4 rounded-full bg-white/20 backdrop-blur-[1px]" />
      </div>
      <span className="text-[10.5px] text-slate-500 font-bold max-w-[95px] leading-tight block whitespace-normal break-words uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
};
