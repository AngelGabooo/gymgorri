import React from 'react';

const QuickAction = ({ icon: Icon, label, color = 'green', onClick }) => {
  const colorClasses = {
    green: 'bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20',
    blue: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  };

  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1a1a1a]
        transition-all duration-200 hover:border-[#00ff88] hover:scale-[1.02]
        ${colorClasses[color]}
      `}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default QuickAction;