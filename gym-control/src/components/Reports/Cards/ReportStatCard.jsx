import React from 'react';

const ReportStatCard = ({ 
  title, 
  value, 
  subtitle, 
  color = 'green',
  icon: Icon,
  trend,
  tooltip
}) => {
  const colorClasses = {
    green: 'text-[#00ff88]',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
    gray: 'text-gray-400',
  };

  const bgClasses = {
    green: 'bg-[#00ff88]/10',
    yellow: 'bg-yellow-500/10',
    red: 'bg-red-500/10',
    blue: 'bg-blue-500/10',
    gray: 'bg-[#1a1a1a]',
  };

  const isEmpty = value === 0 || value === null || value === undefined;

  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#00ff88] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.05)] group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-xs font-medium">{title}</p>
            {tooltip && (
              <div className="relative">
                <span className="text-gray-500 text-xs cursor-help">ⓘ</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-300 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {tooltip}
                </div>
              </div>
            )}
          </div>
          <p className={`text-2xl font-bold ${isEmpty ? 'text-gray-500' : colorClasses[color]}`}>
            {isEmpty ? '0' : value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 ${
              trend === 'Sin datos' ? 'text-gray-500' :
              trend.startsWith('+') ? 'text-[#00ff88]' : 'text-red-500'
            }`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${isEmpty ? 'bg-[#1a1a1a]' : bgClasses[color]}`}>
          <Icon size={20} className={isEmpty ? 'text-gray-600' : colorClasses[color]} />
        </div>
      </div>
    </div>
  );
};

export default ReportStatCard;