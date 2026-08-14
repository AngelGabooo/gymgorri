import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  LogIn, 
  Clock, 
  QrCode,
  UserPlus,
  Calendar,
  Ticket,
  Scan,
  Eye,
  CircleDot,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import MetricCard from './Cards/MetricCard';
import QuickAction from './Cards/QuickAction';
import DonutChart from './Charts/DonutChart';
import ActivityTable from './Tables/ActivityTable';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // TODOS LOS DATOS EN CERO - SIN NINGÚN VALOR PRECARGADO
  const [metrics] = useState({
    activeMembers: 0,
    currentInside: 0,
    todayEntries: 0,
    expiringSoon: 0,
  });

  const [subscriptionData] = useState([
    { label: 'Activas', value: 0 },
    { label: 'Por vencer', value: 0 },
    { label: 'Vencidas', value: 0 },
    { label: 'Bloqueadas', value: 0 },
  ]);

  const [weeklyAttendance] = useState([
    { day: 'Lun', value: 0 },
    { day: 'Mar', value: 0 },
    { day: 'Mié', value: 0 },
    { day: 'Jue', value: 0 },
    { day: 'Vie', value: 0 },
    { day: 'Sáb', value: 0 },
    { day: 'Dom', value: 0 },
  ]);

  const [peakHours] = useState([
    { hour: '6:00 AM', people: 0 },
    { hour: '8:00 AM', people: 0 },
    { hour: '12:00 PM', people: 0 },
    { hour: '5:00 PM', people: 0 },
    { hour: '7:00 PM', people: 0 },
    { hour: '9:00 PM', people: 0 },
  ]);

  const [activities] = useState([]);
  const [upcomingExpirations] = useState([]);

  const totalSubscriptions = subscriptionData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Dashboard" />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <Header />
        
        <main className="p-6 space-y-6 max-w-full">
          {/* Saludo y botón de acceso */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div>
              <h2 className="text-2xl font-bold text-white">Buenos días, Administrador</h2>
              <p className="text-gray-400">Esto es lo que está pasando hoy en tu gimnasio.</p>
            </div>
            <button 
              onClick={() => navigate('/access')}
              className="bg-[#00ff88] text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] whitespace-nowrap"
            >
              <QrCode size={20} />
              Abrir control de acceso
            </button>
          </div>

          {/* Métricas principales - Grid de 4 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            <MetricCard
              title="Miembros activos"
              value={metrics.activeMembers}
              subtitle="+0 este mes"
              icon={Users}
              color="green"
              trend="Sin datos"
              onClick={() => navigate('/members')}
            />
            <MetricCard
              title="Dentro del gimnasio"
              value={metrics.currentInside}
              subtitle="Ahora mismo"
              icon={UserCheck}
              color="green"
              trend="En tiempo real"
              onClick={() => navigate('/attendance')}
            />
            <MetricCard
              title="Entradas de hoy"
              value={metrics.todayEntries}
              subtitle="Personas registradas"
              icon={LogIn}
              color="green"
              trend="Sin datos"
              onClick={() => navigate('/attendance')}
            />
            <MetricCard
              title="Suscripciones por vencer"
              value={metrics.expiringSoon}
              subtitle="Próximos 5 días"
              icon={Clock}
              color="yellow"
              action="Revisar"
              onActionClick={() => navigate('/subscriptions')}
              onClick={() => navigate('/subscriptions')}
            />
          </div>

          {/* Acciones rápidas */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full">
            <h3 className="text-white font-bold mb-4">Acciones rápidas</h3>
            <div className="flex flex-wrap gap-3">
              <QuickAction 
                icon={UserPlus} 
                label="Registrar miembro" 
                onClick={() => navigate('/members/register')}
              />
              <QuickAction 
                icon={Calendar} 
                label="Renovar suscripción" 
                onClick={() => navigate('/subscriptions')}
              />
              <QuickAction 
                icon={QrCode} 
                label="Generar QR" 
                onClick={() => navigate('/members')}
              />
              <QuickAction 
                icon={Ticket} 
                label="Registrar visita" 
                onClick={() => navigate('/members/register')}
              />
              <QuickAction 
                icon={Scan} 
                label="Control de acceso" 
                onClick={() => navigate('/access')}
                color="green"
              />
            </div>
          </div>

          {/* Gráficas - Grid 2 columnas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
            {/* Estado de suscripciones */}
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-bold">Estado de suscripciones</h3>
                  <p className="text-gray-400 text-sm">Distribución actual de los miembros</p>
                </div>
                <button 
                  onClick={() => navigate('/subscriptions')}
                  className="text-[#00ff88] text-sm hover:underline"
                >
                  Ver todas
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-8 w-full">
                <CircleDot size={48} className="text-gray-600 mb-3" />
                <p className="text-gray-400">No hay suscripciones registradas</p>
                <p className="text-gray-500 text-sm mt-1">Comienza registrando tu primer miembro</p>
                <button 
                  onClick={() => navigate('/members/register')}
                  className="mt-4 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors text-sm"
                >
                  Registrar miembro
                </button>
              </div>
            </div>

            {/* Asistencia semanal */}
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-bold">Asistencia semanal</h3>
                  <p className="text-gray-400 text-sm">Distribución de accesos por día</p>
                </div>
                <select className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm">
                  <option>Esta semana</option>
                  <option>Este mes</option>
                  <option>Últimos 30 días</option>
                </select>
              </div>
              
              <div className="h-64 w-full">
                <div className="flex h-full items-end gap-2 w-full">
                  {weeklyAttendance.map((item) => (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full bg-[#1a1a1a] rounded-t-lg" style={{ height: '0%' }}>
                        <div className="w-full h-full bg-[#00ff88]/10 rounded-t-lg" />
                      </div>
                      <span className="text-gray-400 text-xs">{item.day}</span>
                      <span className="text-gray-500 text-xs">0</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex justify-between items-center w-full">
                <div>
                  <p className="text-gray-400 text-sm">Total de accesos esta semana</p>
                  <p className="text-white font-bold text-xl">0</p>
                </div>
                <button 
                  onClick={() => navigate('/attendance')}
                  className="text-[#00ff88] text-sm hover:underline flex items-center gap-1"
                >
                  Ver detalles
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Horas con mayor afluencia */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full">
            <h3 className="text-white font-bold mb-4">Horas con mayor afluencia</h3>
            <p className="text-gray-400 text-sm mb-4">
              Horario con mayor asistencia: <span className="text-gray-500">Sin datos</span>
            </p>
            <div className="space-y-3 w-full">
              {peakHours.map((item) => (
                <div key={item.hour} className="flex items-center gap-4 w-full">
                  <span className="text-gray-400 text-sm w-20">{item.hour}</span>
                  <div className="flex-1 h-8 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-[#00ff88]/10 rounded-lg"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <span className="text-gray-500 text-sm w-20 text-right">0 personas</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/reports')}
              className="mt-4 text-[#00ff88] text-sm hover:underline flex items-center gap-1"
            >
              Ver reporte completo
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Actividad reciente y Próximas a vencer - Grid 2 columnas */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
            {/* Actividad reciente - 2 columnas */}
            <div className="xl:col-span-2 bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold">Actividad reciente</h3>
                  <p className="text-gray-400 text-sm">Últimos movimientos registrados</p>
                </div>
                <button 
                  onClick={() => navigate('/attendance')}
                  className="text-[#00ff88] text-sm hover:underline flex items-center gap-1"
                >
                  <Eye size={16} />
                  Ver historial
                </button>
              </div>
              <div className="text-center py-12 w-full">
                <CircleDot size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No hay actividad reciente</p>
                <p className="text-gray-500 text-sm mt-1">Los movimientos aparecerán aquí cuando los miembros registren acceso</p>
              </div>
            </div>

            {/* Próximas a vencer - 1 columna */}
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Próximas a vencer</h3>
                <button 
                  onClick={() => navigate('/subscriptions')}
                  className="text-[#00ff88] text-sm hover:underline"
                >
                  Ver todas
                </button>
              </div>
              <div className="text-center py-8 w-full">
                <CircleDot size={36} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">No hay suscripciones próximas a vencer</p>
                <p className="text-gray-500 text-sm mt-1">Todas las suscripciones están al día</p>
              </div>
            </div>
          </div>

          {/* Estado del sistema */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-[#00ff88] rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">Sistema operativo</span>
              <span className="text-gray-400 text-sm">Control de acceso disponible</span>
            </div>
            <button 
              onClick={() => navigate('/access')}
              className="text-[#00ff88] text-xs hover:underline"
            >
              ✅ Todo funcionando correctamente
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;