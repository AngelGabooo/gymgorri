import React from 'react';

const DonutChart = ({ data, total, label }) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const colors = {
    'Activas': '#00ff88',
    'Por vencer': '#eab308',
    'Vencidas': '#ef4444',
    'Bloqueadas': '#6b7280',
  };

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {data.map((item, index) => {
          const percentage = (item.value / totalValue) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle += angle;

          const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
          const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
          const largeArc = angle > 180 ? 1 : 0;

          return (
            <path
              key={index}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={colors[item.label] || '#6b7280'}
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="#111111" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    </div>
  );
};

export default DonutChart;