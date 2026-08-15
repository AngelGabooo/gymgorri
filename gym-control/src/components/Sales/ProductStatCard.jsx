// src/components/Sales/ProductStatCard.jsx

import React from 'react';

const ProductStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'green'
}) => {
  const tones = {
    green: 'text-[#00ff88] bg-[#00ff88]/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    red: 'text-red-400 bg-red-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    gray: 'text-gray-300 bg-white/[0.05]'
  };

  return (
    <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-5 hover:border-[#00ff88]/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-gray-500 text-xs font-medium">{title}</p>
          <p className="text-white text-2xl font-black mt-1">{value}</p>
          {subtitle && (
            <p className="text-gray-600 text-xs mt-1">{subtitle}</p>
          )}
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            tones[tone] || tones.green
          }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
};

export default ProductStatCard;
