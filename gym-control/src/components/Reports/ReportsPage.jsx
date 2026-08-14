import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  UserCheck,
  LogIn,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  Filter,
  Eye,
  ChevronRight,
  CircleDot,
  User,
  CreditCard,
  ArrowLeft,
  FileText,
  Printer,
  X,
  Check,
  AlertCircle,
  Activity,
  UserPlus,
  UserX,
  CalendarDays,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import ReportStatCard from './Cards/ReportStatCard';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resumen');
  const [period, setPeriod] = useState('Este mes');
  const [comparison, setComparison] = useState('Periodo anterior');
  const [showExportModal, setShowExportModal] = useState(false);

  // TODOS LOS DATOS EN CERO - SIN DATOS PRECARGADOS
  const [stats] = useState({
    activeMembers: 0,
    attendances: 0,
    uniqueMembers: 0,
    visits: 0,
    renewals: 0,
    income: 0,
  });

  const tabs = [
    { id: 'resumen', label: 'Resumen general' },
    { id: 'asistencias', label: 'Asistencias' },
    { id: 'suscripciones', label: 'Suscripciones' },
    { id: 'ingresos', label: 'Ingresos' },
    { id: 'miembros', label: 'Miembros' },
  ];

  const periods = ['Hoy', 'Ayer', '7 días', '30 días', 'Este mes', 'Mes anterior', 'Personalizado'];

  // Renderizar contenido según tab
  const renderContent = () => {
    switch (activeTab) {
      case 'resumen':
        return renderResumenTab();
      case 'asistencias':
        return renderAsistenciasTab();
      case 'suscripciones':
        return renderSuscripcionesTab();
      case 'ingresos':
        return renderIngresosTab();
      case 'miembros':
        return renderMiembrosTab();
      default:
        return null;
    }
  };

  const renderResumenTab = () => (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <ReportStatCard
          title="Miembros activos"
          value={stats.activeMembers}
          subtitle="Con suscripción activa"
          icon={Users}
          color="green"
          trend="Sin datos"
          tooltip="Miembros con suscripción activa"
        />
        <ReportStatCard
          title="Asistencias"
          value={stats.attendances}
          subtitle="Entradas registradas"
          icon={LogIn}
          color="green"
          trend="Sin datos"
          tooltip="Número total de entradas. Un mismo miembro puede generar varias asistencias durante el periodo."
        />
        <ReportStatCard
          title="Miembros únicos"
          value={stats.uniqueMembers}
          subtitle="Personas diferentes que asistieron"
          icon={UserCheck}
          color="blue"
          tooltip="Cantidad de miembros diferentes que ingresaron al menos una vez."
        />
        <ReportStatCard
          title="Visitas"
          value={stats.visits}
          subtitle="Accesos mediante pase de visita"
          icon={Calendar}
          color="yellow"
        />
        <ReportStatCard
          title="Renovaciones"
          value={stats.renewals}
          subtitle="Suscripciones renovadas"
          icon={TrendingUp}
          color="green"
        />
        <ReportStatCard
          title="Ingresos"
          value={`$${stats.income.toLocaleString()} MXN`}
          subtitle="Pagos registrados"
          icon={DollarSign}
          color="green"
          trend="Sin datos"
        />
      </div>

      {/* Insights automáticos */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Resumen del periodo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: 'Mayor afluencia', value: 'Sin datos', color: 'text-[#00ff88]' },
            { icon: Clock, label: 'Horario más concurrido', value: 'Sin datos', color: 'text-yellow-500' },
            { icon: Activity, label: 'Crecimiento', value: 'Sin datos', color: 'text-[#00ff88]' },
            { icon: CreditCard, label: 'Renovaciones', value: 'Sin datos', color: 'text-[#00ff88]' },
            { icon: UserX, label: 'Oportunidad', value: 'Sin datos', color: 'text-yellow-500' },
          ].map((insight, index) => (
            <div key={index} className="bg-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <insight.icon size={16} className={insight.color} />
                <span className="text-gray-400 text-sm">{insight.label}</span>
              </div>
              <p className="text-gray-500 text-sm">{insight.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad del gimnasio */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Actividad del gimnasio</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-lg text-xs font-medium">Entradas</button>
            <button className="px-3 py-1 bg-[#1a1a1a] text-gray-400 rounded-lg text-xs hover:bg-[#2a2a2a] transition-colors">Miembros únicos</button>
            <button className="px-3 py-1 bg-[#1a1a1a] text-gray-400 rounded-lg text-xs hover:bg-[#2a2a2a] transition-colors">Visitas</button>
          </div>
        </div>
        <div className="h-64 flex items-end gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#1a1a1a] rounded-t-lg h-[2px]" />
              <span className="text-gray-500 text-xs">{i + 1}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm text-center mt-2">Sin datos de actividad</p>
      </div>

      {/* Actividad de hoy y afluencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Actividad de hoy</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-[#1a1a1a] pb-2">
              <span className="text-gray-400">Entradas</span>
              <span className="text-white font-bold">0</span>
            </div>
            <div className="flex justify-between border-b border-[#1a1a1a] pb-2">
              <span className="text-gray-400">Salidas</span>
              <span className="text-white font-bold">0</span>
            </div>
            <div className="flex justify-between border-b border-[#1a1a1a] pb-2">
              <span className="text-gray-400">Dentro ahora</span>
              <span className="text-[#00ff88] font-bold">0</span>
            </div>
            <div className="flex justify-between border-b border-[#1a1a1a] pb-2">
              <span className="text-gray-400">Visitas</span>
              <span className="text-white font-bold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hora más concurrida</span>
              <span className="text-yellow-500 font-bold">Sin datos</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Asistencia por día de la semana</h3>
          <div className="space-y-3">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-16">{day}</span>
                <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                  <div className="h-full bg-[#00ff88]/20 rounded-lg" style={{ width: '0%' }} />
                </div>
                <span className="text-gray-500 text-sm w-12 text-right">0</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm text-center mt-3">Día con mayor asistencia: <span className="text-gray-500">Sin datos</span></p>
        </div>
      </div>

      {/* Mapa de calor y estado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Mapa de afluencia</h3>
          <div className="text-center py-8">
            <CalendarDays size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Sin datos de afluencia</p>
            <p className="text-gray-500 text-sm">Selecciona un periodo para ver el mapa</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Estado de suscripciones</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Activas</span>
              <span className="text-[#00ff88] font-bold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Por vencer</span>
              <span className="text-yellow-500 font-bold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Vencidas</span>
              <span className="text-red-500 font-bold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sin suscripción</span>
              <span className="text-gray-400 font-bold">0</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
            <p className="text-gray-400 text-sm text-center">Sin datos de suscripciones</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAsistenciasTab = () => (
    <div className="space-y-6">
      {/* KPIs de asistencia */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <ReportStatCard title="Total de entradas" value={stats.attendances} icon={LogIn} color="green" />
        <ReportStatCard title="Miembros únicos" value={stats.uniqueMembers} icon={UserCheck} color="blue" />
        <ReportStatCard title="Promedio diario" value="0" icon={Calendar} color="gray" />
        <ReportStatCard title="Duración promedio" value="0h 0min" icon={Clock} color="gray" />
        <ReportStatCard title="Día más concurrido" value="Sin datos" icon={TrendingUp} color="yellow" />
        <ReportStatCard title="Hora pico" value="Sin datos" icon={Zap} color="yellow" />
      </div>

      {/* Entradas vs Salidas */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Movimientos por día</h3>
        <div className="h-48 flex items-end gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#1a1a1a] rounded-t-lg h-[2px]" />
              <span className="text-gray-500 text-xs">{i + 1}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm text-center mt-2">Sin datos de movimientos</p>
      </div>

      {/* Distribución por horario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Distribución por horario</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sun size={16} className="text-yellow-500" />
                <span className="text-gray-400 text-sm">Mañana</span>
              </div>
              <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="h-full bg-[#00ff88]/20 rounded-lg" style={{ width: '0%' }} />
              </div>
              <span className="text-gray-500 text-sm w-12 text-right">0%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                <span className="text-gray-400 text-sm">Tarde</span>
              </div>
              <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="h-full bg-[#00ff88]/20 rounded-lg" style={{ width: '0%' }} />
              </div>
              <span className="text-gray-500 text-sm w-12 text-right">0%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Moon size={16} className="text-blue-300" />
                <span className="text-gray-400 text-sm">Noche</span>
              </div>
              <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="h-full bg-[#00ff88]/20 rounded-lg" style={{ width: '0%' }} />
              </div>
              <span className="text-gray-500 text-sm w-12 text-right">0%</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm text-center mt-3">Periodo con mayor asistencia: <span className="text-gray-500">Sin datos</span></p>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Tiempo de permanencia</h3>
          <div className="space-y-3">
            {['Menos de 30 min', '30–60 min', '1–1.5 h', '1.5–2 h', 'Más de 2 h'].map((range) => (
              <div key={range} className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-24">{range}</span>
                <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                  <div className="h-full bg-[#00ff88]/20 rounded-lg" style={{ width: '0%' }} />
                </div>
                <span className="text-gray-500 text-sm w-12 text-right">0%</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm text-center mt-3">Duración promedio: <span className="text-gray-500">0h 0min</span></p>
        </div>
      </div>

      {/* Miembros más frecuentes */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1a1a1a]">
          <h3 className="text-white font-bold">Miembros con mayor asistencia</h3>
        </div>
        <div className="text-center py-8">
          <Users size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Sin datos de miembros frecuentes</p>
        </div>
      </div>
    </div>
  );

  const renderSuscripcionesTab = () => (
    <div className="space-y-6">
      {/* KPIs de suscripciones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ReportStatCard title="Activas" value={0} icon={UserCheck} color="green" />
        <ReportStatCard title="Por vencer" value={0} icon={AlertCircle} color="yellow" />
        <ReportStatCard title="Vencidas" value={0} icon={UserX} color="red" />
        <ReportStatCard title="Tasa de renovación" value="0%" icon={TrendingUp} color="gray" />
      </div>

      {/* Gráficas de suscripciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Evolución de suscripciones</h3>
          <div className="text-center py-8">
            <TrendingUp size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Sin datos de evolución</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Vencimientos próximos</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Próximos 7 días</span>
              <span className="text-white font-bold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Próximos 15 días</span>
              <span className="text-white font-bold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Próximos 30 días</span>
              <span className="text-white font-bold">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIngresosTab = () => (
    <div className="space-y-6">
      {/* KPIs de ingresos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ReportStatCard title="Ingresos totales" value="$0" icon={DollarSign} color="green" />
        <ReportStatCard title="Promedio diario" value="$0" icon={Calendar} color="gray" />
        <ReportStatCard title="Ticket promedio" value="$0" icon={FileText} color="gray" />
        <ReportStatCard title="Total de pagos" value="0" icon={CreditCard} color="green" />
      </div>

      {/* Gráficas de ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Ingresos por día</h3>
          <div className="text-center py-8">
            <TrendingUp size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Sin datos de ingresos</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Ingresos por método</h3>
          <div className="space-y-3">
            {['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'].map((method) => (
              <div key={method} className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-24">{method}</span>
                <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                  <div className="h-full bg-[#00ff88]/20 rounded-lg" style={{ width: '0%' }} />
                </div>
                <span className="text-gray-500 text-sm w-20 text-right">$0</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMiembrosTab = () => (
    <div className="space-y-6">
      {/* KPIs de miembros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ReportStatCard title="Total registrados" value={0} icon={Users} color="gray" />
        <ReportStatCard title="Con suscripción activa" value={0} icon={UserCheck} color="green" />
        <ReportStatCard title="Sin suscripción" value={0} icon={UserX} color="red" />
        <ReportStatCard title="Nuevos este mes" value={0} icon={UserPlus} color="green" />
      </div>

      {/* Actividad de miembros */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Actividad de miembros</h3>
        <div className="space-y-3">
          {['Muy activos (20+)', 'Activos (12-19)', 'Poco activos (6-11)', 'Baja frecuencia (1-5)', 'Sin actividad (0)'].map((category) => (
            <div key={category} className="flex items-center gap-3">
              <span className="text-gray-400 text-sm w-40">{category}</span>
              <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="h-full bg-[#00ff88]/20 rounded-lg" style={{ width: '0%' }} />
              </div>
              <span className="text-gray-500 text-sm w-12 text-right">0</span>
            </div>
          ))}
        </div>
      </div>

      {/* Miembros sin asistencia */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Miembros activos sin asistencia reciente</h3>
        <div className="flex gap-2 mb-4">
          <button className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-lg text-xs font-medium">7 días</button>
          <button className="px-3 py-1 bg-[#00ff88] text-black rounded-lg text-xs font-medium">14 días</button>
          <button className="px-3 py-1 bg-[#1a1a1a] text-gray-400 rounded-lg text-xs hover:bg-[#2a2a2a] transition-colors">30 días</button>
        </div>
        <div className="text-center py-8">
          <UserX size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">0 miembros sin asistencia reciente</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Reportes" />
      
      <div className="flex-1 lg:ml-0">
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Título y acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Reportes</h1>
              <p className="text-gray-400">Analiza el rendimiento, asistencia y comportamiento general del gimnasio.</p>
            </div>
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Exportar reporte
            </button>
          </div>

          {/* Filtro de periodo */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div>
                <p className="text-gray-400 text-xs font-medium">Periodo analizado</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`
                        px-3 py-1 rounded-full text-xs transition-all duration-200
                        ${period === p 
                          ? 'bg-[#00ff88] text-black font-bold' 
                          : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                        }
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">Comparar con:</span>
                  <select 
                    value={comparison}
                    onChange={(e) => setComparison(e.target.value)}
                    className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg px-3 py-1 text-xs focus:border-[#00ff88] focus:outline-none transition-colors"
                  >
                    <option>Periodo anterior</option>
                    <option>Mes anterior</option>
                    <option>Mismo periodo año anterior</option>
                    <option>Sin comparación</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
                  <span className="text-[#00ff88] text-xs">Datos actualizados</span>
                  <span className="text-gray-500 text-xs">• Hace unos segundos</span>
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

      {/* Modal de exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold">Exportar reporte</h2>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Tipo</label>
                <select className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors">
                  <option>Resumen general</option>
                  <option>Asistencias</option>
                  <option>Suscripciones</option>
                  <option>Ingresos</option>
                  <option>Miembros</option>
                </select>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Periodo</label>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-gray-300">
                  {period} · 01 Ago — 31 Ago 2026
                </div>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Formato</label>
                <div className="grid grid-cols-3 gap-2">
                  {['PDF', 'Excel', 'CSV'].map((format) => (
                    <button key={format} className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors">
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <input type="checkbox" defaultChecked className="text-[#00ff88]" />
                  Incluir gráficas
                </label>
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <input type="checkbox" defaultChecked className="text-[#00ff88]" />
                  Incluir tablas
                </label>
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <input type="checkbox" className="text-[#00ff88]" />
                  Incluir resumen ejecutivo
                </label>
              </div>
              <button className="w-full py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]">
                Generar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;