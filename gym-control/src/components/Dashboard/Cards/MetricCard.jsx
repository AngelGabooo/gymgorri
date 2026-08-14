import React from 'react';

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'green',
  trend,
  action,
  onActionClick,
  onClick
}) => {
  const colorClasses = {
    green: 'text-[#00ff88]',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
  };

  const bgClasses = {
    green: 'bg-[#00ff88]/10',
    yellow: 'bg-yellow-500/10',
    red: 'bg-red-500/10',
    blue: 'bg-blue-500/10',
  };

  const isEmpty = value === 0 || value === null || value === undefined;

  return (
    <div 
      className={`bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#00ff88] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.05)] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${isEmpty ? 'text-gray-500' : colorClasses[color]}`}>
            {isEmpty ? '0' : value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 ${
              trend === 'Sin datos' || trend === 'En tiempo real' ? 'text-gray-500' :
              trend.startsWith('+') ? 'text-[#00ff88]' : 'text-red-500'
            }`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${isEmpty ? 'bg-[#1a1a1a]' : bgClasses[color]}`}>
          <Icon size={24} className={isEmpty ? 'text-gray-600' : colorClasses[color]} />
        </div>
      </div>
      {action && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onActionClick) onActionClick();
          }}
          className="mt-3 text-xs text-[#00ff88] hover:underline"
        >
          {action}
        </button>
      )}
    </div>
  );
};

export default MetricCard;