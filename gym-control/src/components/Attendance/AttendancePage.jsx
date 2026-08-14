import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  LogIn,
  LogOut,
  QrCode,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  Clock,
  User,
  CircleDot,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  UserCheck,
  UserX,
  ArrowLeft
} from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import AttendanceStatCard from './Cards/AttendanceStatCard';

const AttendancePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('historial');
  const [activeFilter, setActiveFilter] = useState('Hoy');
  const [searchTerm, setSearchTerm] = useState('');

  // TODOS LOS DATOS EN CERO - SIN DATOS PRECARGADOS
  const [stats] = useState({
    inside: 0,
    entriesToday: 0,
    exitsToday: 0,
    totalMovements: 0,
  });

  const [attendanceData] = useState([]);
  const [peopleInside] = useState([]);
  const [filters] = useState({
    movement: 'Todos',
    method: 'Todos',
    status: 'Todos',
  });

  const isEmpty = attendanceData.length === 0;
  const isEmptyInside = peopleInside.length === 0;

  // Filtros rápidos
  const quickFilters = ['Hoy', 'Ayer', '7 días', '30 días', 'Personalizado'];

  // Tabs
  const tabs = [
    { id: 'historial', label: 'Historial' },
    { id: 'inside', label: `Dentro del gimnasio · ${stats.inside}` },
  ];

  // Renderizar contenido según tab activa
  const renderContent = () => {
    if (activeTab === 'historial') {
      return renderHistorialTab();
    } else {
      return renderInsideTab();
    }
  };

  const renderHistorialTab = () => (
    <div className="space-y-6">
      {/* Filtros de fecha */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`
              px-4 py-1.5 rounded-full text-sm transition-all duration-200
              ${activeFilter === filter 
                ? 'bg-[#00ff88] text-black font-bold' 
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
              }
            `}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar miembro por nombre o ID..."
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
          <button className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      {/* Timeline de actividad */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Actividad de hoy</h3>
        <div className="h-20 flex items-end gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#1a1a1a] rounded-t-lg h-[2px]" />
              <span className="text-gray-500 text-xs">
                {['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'][i]}
              </span>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm text-center mt-2">Sin datos de actividad</p>
      </div>

      {/* Tabla de historial */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {isEmpty ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[#1a1a1a] rounded-full">
                <Clock size={48} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">No hay asistencias registradas</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              No encontramos entradas o salidas para este periodo.
            </p>
            <button className="px-6 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 flex items-center gap-2 mx-auto">
              <Calendar size={18} />
              Cambiar fecha
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Miembro</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Fecha</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Entrada</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Salida</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Duración</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Método</th>
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

      {/* Paginación */}
      {!isEmpty && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">Mostrando 1–0 de 0 asistencias</p>
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
    </div>
  );

  const renderInsideTab = () => (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#00ff88]">{stats.inside}</p>
          <p className="text-gray-400 text-xs">Dentro actualmente</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">0h 0min</p>
          <p className="text-gray-400 text-xs">Tiempo promedio actual</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">0h 0min</p>
          <p className="text-gray-400 text-xs">Mayor tiempo dentro</p>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar persona dentro del gimnasio..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-10 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors text-sm">Todos</button>
          <button className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors text-sm">Miembros</button>
          <button className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors text-sm">Visitas</button>
          <select className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm focus:border-[#00ff88] focus:outline-none transition-colors">
            <option>Ordenar por</option>
            <option>Entrada reciente</option>
            <option>Más tiempo dentro</option>
            <option>Nombre</option>
          </select>
        </div>
      </div>

      {/* Ocupación */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Ocupación</p>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-white">{stats.inside} / 80</span>
              <span className="text-[#00ff88] text-sm font-medium">0% ocupado</span>
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">80 lugares disponibles</span>
          </div>
        </div>
        <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="h-full bg-[#00ff88] rounded-full transition-all duration-500" style={{ width: '0%' }} />
        </div>
      </div>

      {/* Grid de personas dentro */}
      {isEmptyInside ? (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-[#1a1a1a] rounded-full">
              <Users size={48} className="text-gray-600" />
            </div>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">El gimnasio está vacío</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            No hay personas con una entrada activa en este momento.
          </p>
          <p className="text-[#00ff88] text-sm mt-2">0 personas dentro</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Las cards se mostrarán aquí cuando existan datos */}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Asistencias" />
      
      <div className="flex-1 lg:ml-0">
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Título y acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Asistencias</h1>
              <p className="text-gray-400">Consulta las entradas, salidas y ocupación actual del gimnasio.</p>
            </div>
            <button 
              onClick={() => navigate('/access')}
              className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
            >
              <QrCode size={18} />
              Abrir control de acceso
            </button>
          </div>

          {/* Indicador en tiempo real */}
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
            <span className="text-[#00ff88] font-medium">Actualización en tiempo real</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">Última actualización: hace unos segundos</span>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <AttendanceStatCard
              title="Dentro ahora"
              value={stats.inside}
              subtitle="Personas dentro del gimnasio"
              icon={Users}
              color="green"
              trend="En tiempo real"
              isHighlighted={true}
            />
            <AttendanceStatCard
              title="Entradas hoy"
              value={stats.entriesToday}
              subtitle="Entradas registradas"
              icon={LogIn}
              color="green"
              trend="Sin datos"
            />
            <AttendanceStatCard
              title="Salidas hoy"
              value={stats.exitsToday}
              subtitle="Salidas registradas"
              icon={LogOut}
              color="blue"
            />
            <AttendanceStatCard
              title="Total de movimientos"
              value={stats.totalMovements}
              subtitle="Entradas + salidas de hoy"
              icon={TrendingUp}
              color="gray"
              trend="Actualizado ahora"
            />
          </div>

          {/* Ocupación y afluencia */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">Ocupación actual</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.inside} personas</p>
                  <p className="text-gray-400 text-sm">0 / 80 • 0% ocupado</p>
                </div>
                <div className="text-right">
                  <span className="text-[#00ff88] text-sm font-medium">80 lugares disponibles</span>
                </div>
              </div>
              <div className="mt-3 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full bg-[#00ff88] rounded-full transition-all duration-500" style={{ width: '0%' }} />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">Nivel de afluencia</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-400">Sin datos</p>
                  <p className="text-gray-400 text-sm">{stats.inside} personas actualmente</p>
                </div>
                <div className="p-3 bg-[#1a1a1a] rounded-lg">
                  <Users size={24} className="text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#1a1a1a]">
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2
                    ${activeTab === tab.id 
                      ? 'text-[#00ff88] border-[#00ff88]' 
                      : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido de tabs */}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AttendancePage;