import React from 'react';
import { Search, Bell, Calendar as CalendarIcon } from 'lucide-react';

const Header = () => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <header className="bg-[#0d0d0d] border-b border-[#1a1a1a] px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Resumen general y actividad del gimnasio</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Búsqueda */}
          <button className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-gray-400 hover:text-white">
            <Search size={20} />
          </button>

          {/* Notificaciones */}
          <button className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-gray-400 hover:text-white relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#00ff88] rounded-full" />
          </button>

          {/* Fecha */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
            <CalendarIcon size={16} className="text-gray-400" />
            <span className="text-gray-300 text-sm capitalize">{dateStr}</span>
          </div>

          {/* Avatar - Usando imagen de public/img/crede.png */}
          <div className="w-10 h-10 rounded-full bg-[#00ff88] flex items-center justify-center overflow-hidden">
            <img 
              src="/img/crede.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;