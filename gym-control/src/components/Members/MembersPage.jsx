import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Clock, 
  UserX,
  Search,
  Filter,
  Plus,
  MoreVertical,
  QrCode,
  Eye,
  RefreshCw,
  Edit,
  Lock,
  UserPlus,
  CircleDot
} from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import MemberStatCard from './Cards/MemberStatCard';

const MembersPage = () => {
  const navigate = useNavigate();
  
  // TODOS LOS DATOS EN CERO - SIN DATOS PRECARGADOS
  const [stats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
  });

  const [members] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const filters = [
    { name: 'Todos', count: 0 },
    { name: 'Activos', count: 0 },
    { name: 'Por vencer', count: 0 },
    { name: 'Vencidos', count: 0 },
    { name: 'Bloqueados', count: 0 },
    { name: 'Sin suscripción', count: 0 },
  ];

  // Estado vacío
  const isEmpty = members.length === 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Miembros" />
      
      <div className="flex-1 lg:ml-0">
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Título */}
          <div>
            <h1 className="text-2xl font-bold text-white">Miembros</h1>
            <p className="text-gray-400">Administra las personas registradas en el gimnasio.</p>
          </div>

          {/* Estadísticas compactas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MemberStatCard
              title="Total de miembros"
              value={stats.total}
              subtitle="Personas registradas"
              icon={Users}
              color="gray"
            />
            <MemberStatCard
              title="Activos"
              value={stats.active}
              subtitle="Suscripción activa"
              icon={UserCheck}
              color="green"
            />
            <MemberStatCard
              title="Por vencer"
              value={stats.expiring}
              subtitle="Próximos 5 días"
              icon={Clock}
              color="yellow"
            />
            <MemberStatCard
              title="Vencidos"
              value={stats.expired}
              subtitle="Requieren renovación"
              icon={UserX}
              color="red"
            />
          </div>

          {/* Barra de acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono, correo o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-10 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2">
                <Filter size={18} />
                Filtros
              </button>
              <button 
                onClick={() => navigate('/members/register')}
                className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
              >
                <Plus size={18} />
                Registrar miembro
              </button>
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.name}
                onClick={() => setActiveFilter(filter.name)}
                className={`
                  px-4 py-1.5 rounded-full text-sm transition-all duration-200
                  ${activeFilter === filter.name 
                    ? 'bg-[#00ff88] text-black font-bold' 
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }
                `}
              >
                {filter.name} <span className="text-xs opacity-70">({filter.count})</span>
              </button>
            ))}
          </div>

          {/* Tabla de miembros */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
            {isEmpty ? (
              // Estado vacío
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-[#1a1a1a] rounded-full">
                    <Users size={48} className="text-gray-600" />
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Todavía no hay miembros registrados</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                  Registra tu primer miembro para comenzar a gestionar sus suscripciones y accesos.
                </p>
                <button 
                  onClick={() => navigate('/members/register')}
                  className="px-6 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2 mx-auto"
                >
                  <UserPlus size={18} />
                  Registrar primer miembro
                </button>
              </div>
            ) : (
              // Tabla con datos (cuando existan)
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                    <tr>
                      <th className="py-3 px-4 text-left">
                        <input type="checkbox" className="w-4 h-4 bg-[#1a1a1a] border-[#2a2a2a] rounded text-[#00ff88]" />
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Miembro</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Contacto</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Suscripción</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Vencimiento</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Última visita</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Estado</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Los datos se mostrarán aquí cuando existan */}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginación (vacía) */}
          {!isEmpty && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-sm">Mostrando 1–0 de 0 miembros</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-400 text-sm hover:border-[#00ff88] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Anterior
                </button>
                <button className="px-3 py-1.5 bg-[#00ff88] text-black rounded-lg text-sm font-bold">1</button>
                <button className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-400 text-sm hover:border-[#00ff88] transition-colors">
                  Siguiente
                </button>
                <select className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm">
                  <option>20 por página</option>
                  <option>50 por página</option>
                  <option>100 por página</option>
                </select>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MembersPage;