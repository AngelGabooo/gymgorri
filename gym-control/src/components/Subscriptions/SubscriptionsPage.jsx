import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  RefreshCw,
  FileText,
  Download,
  ChevronRight,
  Users,
  User,
  CircleDot,
  TrendingUp,
  TrendingDown,
  CreditCard,
  QrCode
} from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import SubscriptionStatCard from './Cards/SubscriptionStatCard';

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  
  // TODOS LOS DATOS EN CERO - SIN DATOS PRECARGADOS
  const [stats] = useState({
    active: 0,
    expiring: 0,
    expired: 0,
    renewals: 0,
  });

  const [subscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todas');

  const filters = [
    { name: 'Todas', count: 0 },
    { name: 'Activas', count: 0 },
    { name: 'Por vencer', count: 0 },
    { name: 'Vencidas', count: 0 },
    { name: 'Sin suscripción', count: 0 },
    { name: 'Bloqueadas', count: 0 },
  ];

  // Estado vacío
  const isEmpty = subscriptions.length === 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Suscripciones" />
      
      <div className="flex-1 lg:ml-0">
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Título */}
          <div>
            <h1 className="text-2xl font-bold text-white">Suscripciones</h1>
            <p className="text-gray-400">Administra, supervisa y renueva las suscripciones de los miembros.</p>
          </div>

          {/* Estadísticas compactas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SubscriptionStatCard
              title="Suscripciones activas"
              value={stats.active}
              subtitle="Miembros con acceso habilitado"
              icon={CheckCircle}
              color="green"
              trend="0% del total"
            />
            <SubscriptionStatCard
              title="Por vencer"
              value={stats.expiring}
              subtitle="Vencen en los próximos 5 días"
              icon={Clock}
              color="yellow"
              action="Revisar"
            />
            <SubscriptionStatCard
              title="Vencidas"
              value={stats.expired}
              subtitle="Acceso actualmente bloqueado"
              icon={XCircle}
              color="red"
              trend="Requieren renovación"
            />
            <SubscriptionStatCard
              title="Renovaciones del mes"
              value={stats.renewals}
              subtitle="Renovaciones realizadas"
              icon={RefreshCw}
              color="green"
              trend="Sin datos"
            />
          </div>

          {/* Alerta de renovaciones */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-white font-medium">0 suscripciones están próximas a vencer</p>
                  <p className="text-gray-400 text-sm">No hay suscripciones que vencen en los próximos 5 días.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-[#00ff88] text-sm hover:underline">Ver miembros</button>
                <button className="px-4 py-1.5 bg-[#00ff88] text-black rounded-lg text-sm font-medium hover:bg-[#00cc6a] transition-colors">
                  Gestionar renovaciones
                </button>
              </div>
            </div>
          </div>

          {/* Barra de acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar miembro, ID o teléfono..."
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
              <button 
                onClick={() => navigate('/members/register')}
                className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
              >
                <Plus size={18} />
                Nueva suscripción
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

          {/* Tabla de suscripciones */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
            {isEmpty ? (
              // Estado vacío
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-[#1a1a1a] rounded-full">
                    <Calendar size={48} className="text-gray-600" />
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Todavía no hay suscripciones</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                  Las suscripciones activadas para los miembros aparecerán aquí.
                </p>
                <button 
                  onClick={() => navigate('/members/register')}
                  className="px-6 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2 mx-auto"
                >
                  <Plus size={18} />
                  Crear primera suscripción
                </button>
              </div>
            ) : (
              // Tabla con datos (cuando existan)
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Miembro</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Plan</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Inicio</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Vencimiento</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Tiempo restante</th>
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
              <p className="text-gray-400 text-sm">Mostrando 1–0 de 0 suscripciones</p>
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

export default SubscriptionsPage;