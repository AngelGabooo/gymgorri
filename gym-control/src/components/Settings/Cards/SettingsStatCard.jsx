import React from 'react';

const SettingsStatCard = ({ 
  title, 
  value, 
  subtitle, 
  color = 'green',
  icon: Icon
}) => {
  const colorClasses = {
    green: 'text-[#00ff88]',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    gray: 'text-gray-400',
  };

  const bgClasses = {
    green: 'bg-[#00ff88]/10',
    yellow: 'bg-yellow-500/10',
    red: 'bg-red-500/10',
    gray: 'bg-[#1a1a1a]',
  };

  const isEmpty = value === 0 || value === null || value === undefined;

  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#00ff88] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-medium mb-1">{title}</p>
          <p className={`text-xl font-bold ${isEmpty ? 'text-gray-500' : colorClasses[color]}`}>
            {isEmpty ? '0' : value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${isEmpty ? 'bg-[#1a1a1a]' : bgClasses[color]}`}>
          <Icon size={18} className={isEmpty ? 'text-gray-600' : colorClasses[color]} />
        </div>
      </div>
    </div>
  );
};

export default SettingsStatCard;