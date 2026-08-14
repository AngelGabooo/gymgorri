import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  QrCode, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ activePage = 'Dashboard' }) => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Miembros', icon: Users, path: '/members' },
    { name: 'Suscripciones', icon: CreditCard, path: '/subscriptions' },
    { name: 'Control de acceso', icon: QrCode, path: '/access' },
    { name: 'Asistencias', icon: Calendar, path: '/attendance' },
    { name: 'Visitas', icon: UserCheck, path: '/visits' },
    { name: 'Pagos', icon: DollarSign, path: '/payments' },
    { name: 'Reportes', icon: BarChart3, path: '/reports' },
  ];

  const bottomItems = [
    { name: 'Configuración', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <>
      {/* Botón hamburguesa móvil */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#1a1a1a] p-3 rounded-xl border border-[#2a2a2a]"
      >
        {isMobileOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
      </button>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-[#0d0d0d] border-r border-[#1a1a1a]
        flex flex-col
        transform transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo con más espacio */}
        <div className="p-8 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#00ff88] flex items-center justify-center shadow-lg shadow-[#00ff88]/10">
              <img 
                src="/img/crede.png" 
                alt="GYM CONTROL" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold tracking-wide">GYM CONTROL</h1>
              <p className="text-gray-500 text-xs tracking-wider mt-0.5">SMART GYM MANAGEMENT</p>
            </div>
          </div>
        </div>

        {/* Menú con más espacio entre elementos */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = item.name === activePage;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-[#1a1a1a] text-white border-l-3 border-[#00ff88]' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                  }
                `}
              >
                <item.icon 
                  size={22} 
                  className={isActive ? 'text-[#00ff88]' : 'text-gray-500'} 
                />
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 bg-[#00ff88] rounded-full" />
                )}
              </button>
            );
          })}

          {/* Separador con más espacio */}
          <div className="border-t border-[#1a1a1a] my-6" />

          {bottomItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <item.icon size={22} className="text-gray-500" />
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Usuario con más espacio */}
        <div className="p-6 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#00ff88] flex items-center justify-center overflow-hidden shadow-lg shadow-[#00ff88]/10">
              <img 
                src="/img/crede.png" 
                alt="Admin" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Administrador</p>
              <p className="text-gray-500 text-xs">Recepción Principal</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-500 transition-colors p-1"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;