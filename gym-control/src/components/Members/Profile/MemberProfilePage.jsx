import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  QrCode,
  LogIn,
  LogOut,
  DollarSign,
  Edit,
  MoreVertical,
  Printer,
  Download,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Eye,
  FileText,
  Copy,
  RefreshCw,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  Users,
  BarChart3,
  Settings,
  LayoutDashboard,
  UserCheck,
  UserX,
  CircleDot
} from 'lucide-react';
import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';
import { QRCodeSVG } from 'qrcode.react';

const MemberProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener datos del miembro (desde el registro o desde la lista)
  const memberData = location.state?.memberData || {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    id: 'GYM-00000',
    registrationDate: 'Fecha no disponible',
    birthDate: '',
    emergencyContact: '',
    emergencyPhone: '',
    gender: '',
    notes: '',
    profilePhoto: null
  };

  // Obtener datos de suscripción (desde el registro o vacío)
  const subscriptionData = location.state?.subscriptionData || {
    plan: '',
    days: 0,
    startDate: '',
    endDate: '',
    paymentMethod: '',
    amount: '0.00',
    status: 'inactive'
  };

  const [activeTab, setActiveTab] = useState('resumen');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');

  const fullName = `${memberData.firstName} ${memberData.lastName}`.trim() || 'Nuevo miembro';
  const memberId = memberData.id || 'GYM-00000';

  // Calcular días restantes
  const calculateDaysRemaining = () => {
    if (!subscriptionData.endDate || subscriptionData.endDate === 'Fecha no disponible') return 0;
    try {
      const today = new Date();
      const parts = subscriptionData.endDate.split(' ');
      const day = parseInt(parts[0]);
      const month = parts[1];
      const year = parseInt(parts[2]);
      const monthMap = { 'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11 };
      const endDate = new Date(year, monthMap[month], day);
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  };

  const daysRemaining = calculateDaysRemaining();

  // Datos de asistencias - VACÍOS
  const [attendanceData] = useState([]);
  
  // Datos de pagos - VACÍOS
  const [paymentData] = useState([]);
  
  // Datos de historial de suscripciones - VACÍOS
  const [subscriptionHistory] = useState([]);

  // Calcular estadísticas desde las asistencias
  const calculateStats = () => {
    if (attendanceData.length === 0) {
      return {
        totalThisMonth: 0,
        totalThisWeek: 0,
        lastAttendance: 'Sin asistencias',
        lastAttendanceTime: '',
        averageTime: '0h 0min'
      };
    }

    const now = new Date();
    const thisMonth = attendanceData.filter(item => {
      const date = new Date(item.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const thisWeek = attendanceData.filter(item => {
      const date = new Date(item.date);
      return date >= startOfWeek;
    });

    const last = attendanceData[0] || null;

    let totalMinutes = 0;
    attendanceData.forEach(item => {
      if (item.durationMinutes) {
        totalMinutes += item.durationMinutes;
      }
    });
    const avgMinutes = attendanceData.length > 0 ? Math.round(totalMinutes / attendanceData.length) : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = avgMinutes % 60;

    return {
      totalThisMonth: thisMonth.length,
      totalThisWeek: thisWeek.length,
      lastAttendance: last ? last.date : 'Sin asistencias',
      lastAttendanceTime: last ? last.entry : '',
      averageTime: `${avgHours}h ${avgMins}min`
    };
  };

  const stats = calculateStats();

  // Datos del QR
  const qrData = JSON.stringify({
    id: memberId,
    name: fullName,
    phone: memberData.phone || '',
    email: memberData.email || '',
    subscription: subscriptionData.status || 'inactive',
    validUntil: subscriptionData.endDate || ''
  });

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'suscripcion', label: 'Suscripción' },
    { id: 'asistencias', label: 'Asistencias' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'informacion', label: 'Información personal' },
  ];

  // Determinar estado de la suscripción para mostrar alerta
  const getAlert = () => {
    if (subscriptionData.status === 'active' && daysRemaining <= 5 && daysRemaining > 0) {
      return {
        type: 'warning',
        icon: <AlertCircle size={20} className="text-yellow-500" />,
        title: 'Suscripción próxima a vencer',
        message: `Esta suscripción vence en ${daysRemaining} días.`,
        action: 'Renovar ahora'
      };
    } else if (subscriptionData.status === 'expired') {
      return {
        type: 'danger',
        icon: <XCircle size={20} className="text-red-500" />,
        title: 'Suscripción vencida',
        message: 'El acceso mediante QR se encuentra bloqueado hasta renovar la suscripción.',
        action: 'Renovar suscripción'
      };
    } else if (subscriptionData.status === 'active') {
      return {
        type: 'success',
        icon: <CheckCircle size={20} className="text-[#00ff88]" />,
        title: 'Suscripción activa',
        message: 'Este miembro puede acceder normalmente al gimnasio.',
        action: null
      };
    } else {
      return {
        type: 'info',
        icon: <CircleDot size={20} className="text-gray-500" />,
        title: 'Sin suscripción',
        message: 'Este miembro no tiene una suscripción activa.',
        action: 'Activar suscripción'
      };
    }
  };

  const alert = getAlert();

  const getAlertStyles = () => {
    switch (alert.type) {
      case 'success':
        return 'bg-[#00ff88]/5 border-[#00ff88]/20';
      case 'warning':
        return 'bg-yellow-500/5 border-yellow-500/20';
      case 'danger':
        return 'bg-red-500/5 border-red-500/20';
      default:
        return 'bg-gray-500/5 border-gray-500/20';
    }
  };

  // Función para renderizar el contenido según la tab seleccionada
  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return renderResumenTab();
      case 'suscripcion':
        return renderSuscripcionTab();
      case 'asistencias':
        return renderAsistenciasTab();
      case 'pagos':
        return renderPagosTab();
      case 'informacion':
        return renderInformacionTab();
      default:
        return null;
    }
  };

  const renderResumenTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Suscripción actual */}
      <div className="xl:col-span-2">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Suscripción actual</h3>
          {subscriptionData.status === 'active' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Plan</p>
                <p className="text-white font-bold text-lg">
                  {subscriptionData.plan || 'Mensual'} — {subscriptionData.days || 30} días
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Estado</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00ff88] rounded-full" />
                  <span className="text-[#00ff88] font-bold">Activa</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Inicio</p>
                <p className="text-white">{subscriptionData.startDate || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Vencimiento</p>
                <p className={daysRemaining > 5 ? 'text-white' : 'text-yellow-500 font-medium'}>
                  {subscriptionData.endDate || 'No disponible'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-400 text-sm">Días restantes</p>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-white">{daysRemaining} días</span>
                  <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00ff88] rounded-full transition-all duration-500"
                      style={{ width: `${subscriptionData.days > 0 ? (daysRemaining / subscriptionData.days) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CircleDot size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Sin suscripción activa</p>
              <p className="text-gray-500 text-sm mt-1">Este miembro no tiene una suscripción activa actualmente.</p>
            </div>
          )}
          <button 
            onClick={() => navigate(`/members/${memberId}/renew`, { 
              state: { 
                memberData: memberData,
                subscriptionData: subscriptionData
              }
            })}
            className="mt-4 text-[#00ff88] text-sm hover:underline flex items-center gap-1"
          >
            Ver detalles
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Código QR */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Código de acceso</h3>
        {memberId !== 'GYM-00000' ? (
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-xl p-3 mb-3 inline-block">
              <QRCodeSVG 
                value={qrData}
                size={120}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <p className="text-white font-mono font-bold">{memberId}</p>
            <p className="text-gray-400 text-xs">Código único del miembro</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${subscriptionData.status === 'active' ? 'bg-[#00ff88]' : 'bg-gray-500'}`} />
              <span className={`text-sm font-medium ${subscriptionData.status === 'active' ? 'text-[#00ff88]' : 'text-gray-500'}`}>
                {subscriptionData.status === 'active' ? 'QR habilitado' : 'QR deshabilitado'}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-2 text-center">
              {subscriptionData.status === 'active' 
                ? 'El código puede utilizarse mientras la suscripción permanezca activa.'
                : 'El código no está habilitado actualmente.'}
            </p>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => navigate('/access')}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm hover:border-[#00ff88] transition-colors flex items-center gap-1"
              >
                <Eye size={14} />
                Ver QR
              </button>
              <button 
                onClick={() => alert('Imprimiendo credencial...')}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm hover:border-[#00ff88] transition-colors flex items-center gap-1"
              >
                <Printer size={14} />
                Imprimir
              </button>
              <button 
                onClick={() => alert('Descargando QR...')}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm hover:border-[#00ff88] transition-colors flex items-center gap-1"
              >
                <Download size={14} />
                Descargar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CircleDot size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">QR no disponible</p>
            <p className="text-gray-500 text-sm mt-1">El código QR se generará al completar el registro.</p>
          </div>
        )}
      </div>

      {/* Estadísticas del miembro */}
      <div className="xl:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-gray-400 text-xs">Asistencias este mes</p>
          <p className="text-2xl font-bold text-white">{stats.totalThisMonth}</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-gray-400 text-xs">Esta semana</p>
          <p className="text-2xl font-bold text-white">{stats.totalThisWeek}</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-gray-400 text-xs">Última asistencia</p>
          <p className="text-white font-bold">{stats.lastAttendance}</p>
          <p className="text-gray-400 text-xs">{stats.lastAttendanceTime}</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-gray-400 text-xs">Tiempo promedio</p>
          <p className="text-2xl font-bold text-white">{stats.averageTime}</p>
        </div>
      </div>

      {/* Estado actual */}
      <div className="xl:col-span-2">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Estado actual</h3>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <div>
              <p className="text-white font-medium">Fuera del gimnasio</p>
              <p className="text-gray-400 text-sm">Sin registros de entrada recientes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="xl:col-span-2">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Actividad reciente</h3>
            <button 
              onClick={() => navigate('/attendance')}
              className="text-[#00ff88] text-sm hover:underline"
            >
              Ver historial completo
            </button>
          </div>
          {attendanceData.length > 0 ? (
            <div className="space-y-4">
              {attendanceData.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-[#1a1a1a] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                    {item.entry ? <LogIn size={14} className="text-[#00ff88]" /> : <LogOut size={14} className="text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">{item.date}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.entry ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-gray-500/10 text-gray-400'}`}>
                        {item.entry ? 'Entrada' : 'Salida'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{item.entry}</span>
                      <span>•</span>
                      <span>Acceso mediante QR</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CircleDot size={36} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No hay actividad reciente</p>
              <p className="text-gray-500 text-sm">Las asistencias aparecerán aquí cuando el miembro registre acceso.</p>
            </div>
          )}
        </div>
      </div>

      {/* Últimos pagos */}
      <div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Últimos pagos</h3>
            <button 
              onClick={() => navigate('/payments')}
              className="text-[#00ff88] text-sm hover:underline"
            >
              Ver todos
            </button>
          </div>
          {paymentData.length > 0 ? (
            <div className="space-y-3">
              {paymentData.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between pb-2 border-b border-[#1a1a1a] last:border-0">
                  <div>
                    <p className="text-white text-sm">{item.concept}</p>
                    <p className="text-gray-400 text-xs">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00ff88] font-medium">{item.amount}</p>
                    <p className="text-gray-400 text-xs">Pagado</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CircleDot size={36} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No hay pagos registrados</p>
              <p className="text-gray-500 text-sm">Los pagos aparecerán aquí cuando se registren.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSuscripcionTab = () => (
    <div className="space-y-6">
      {/* Suscripción actual */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Suscripción actual</h3>
        {subscriptionData.status === 'active' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Plan</p>
              <p className="text-white font-bold">{subscriptionData.plan || 'Mensual'} — {subscriptionData.days || 30} días</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Estado</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00ff88] rounded-full" />
                <span className="text-[#00ff88] font-bold">Activa</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Fecha de inicio</p>
              <p className="text-white">{subscriptionData.startDate || 'No disponible'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Fecha de vencimiento</p>
              <p className={daysRemaining > 5 ? 'text-white' : 'text-yellow-500 font-medium'}>
                {subscriptionData.endDate || 'No disponible'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Días restantes</p>
              <p className="text-white font-bold">{daysRemaining} días</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Monto pagado</p>
              <p className="text-white">${subscriptionData.amount || '0.00'} MXN</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Método de pago</p>
              <p className="text-white">{subscriptionData.paymentMethod || 'No registrado'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CircleDot size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Sin suscripción activa</p>
            <p className="text-gray-500 text-sm mt-1">Este miembro no tiene una suscripción activa actualmente.</p>
          </div>
        )}
        <button 
          onClick={() => navigate(`/members/${memberId}/renew`, { 
            state: { 
              memberData: memberData,
              subscriptionData: subscriptionData
            }
          })}
          className="mt-4 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Renovar suscripción
        </button>
      </div>

      {/* Historial de suscripciones */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Historial de suscripciones</h3>
        {subscriptionHistory.length > 0 ? (
          <div className="space-y-3">
            {subscriptionHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
                <div>
                  <p className="text-white">{item.period}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.status === 'Activa' ? 'bg-[#00ff88]' : 'bg-gray-500'}`} />
                  <span className={`text-sm ${item.status === 'Activa' ? 'text-[#00ff88]' : 'text-gray-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CircleDot size={36} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No hay historial de suscripciones</p>
            <p className="text-gray-500 text-sm">El historial aparecerá aquí cuando se registren suscripciones.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAsistenciasTab = () => (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-gray-400 text-xs">Asistencias este mes</p>
          <p className="text-2xl font-bold text-white">{stats.totalThisMonth}</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-gray-400 text-xs">Esta semana</p>
          <p className="text-2xl font-bold text-white">{stats.totalThisWeek}</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-gray-400 text-xs">Última asistencia</p>
          <p className="text-white font-bold">{stats.lastAttendance}</p>
          <p className="text-gray-400 text-xs">{stats.lastAttendanceTime}</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-gray-400 text-xs">Tiempo promedio</p>
          <p className="text-2xl font-bold text-white">{stats.averageTime}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-1.5 bg-[#00ff88] text-black rounded-full text-sm font-bold">Hoy</button>
        <button className="px-4 py-1.5 bg-[#1a1a1a] text-gray-400 rounded-full text-sm hover:bg-[#2a2a2a] transition-colors">7 días</button>
        <button className="px-4 py-1.5 bg-[#1a1a1a] text-gray-400 rounded-full text-sm hover:bg-[#2a2a2a] transition-colors">30 días</button>
        <button className="px-4 py-1.5 bg-[#1a1a1a] text-gray-400 rounded-full text-sm hover:bg-[#2a2a2a] transition-colors">Personalizado</button>
      </div>

      {/* Tabla de asistencias */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {attendanceData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Fecha</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Entrada</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Salida</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Duración</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Método</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((item, index) => (
                  <tr key={index} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 px-4 text-white">{item.date}</td>
                    <td className="py-3 px-4 text-gray-300">{item.entry}</td>
                    <td className="py-3 px-4 text-gray-300">{item.exit}</td>
                    <td className="py-3 px-4 text-gray-300">{item.duration}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full">{item.method}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CircleDot size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay asistencias registradas</p>
            <p className="text-gray-500 text-sm mt-1">Las asistencias aparecerán aquí cuando el miembro registre acceso.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPagosTab = () => (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => navigate('/payments')}
          className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors flex items-center gap-2"
        >
          <DollarSign size={18} />
          Registrar pago
        </button>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {paymentData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Fecha</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Concepto</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Periodo</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Método</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Monto</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Estado</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paymentData.map((item, index) => (
                  <tr key={index} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 px-4 text-white">{item.date}</td>
                    <td className="py-3 px-4 text-gray-300">{item.concept}</td>
                    <td className="py-3 px-4 text-gray-300">{item.period}</td>
                    <td className="py-3 px-4 text-gray-300">{item.method}</td>
                    <td className="py-3 px-4 text-[#00ff88] font-medium">{item.amount}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full">{item.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CircleDot size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay pagos registrados</p>
            <p className="text-gray-500 text-sm mt-1">Los pagos aparecerán aquí cuando se registren.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderInformacionTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Datos personales</h3>
        <div className="space-y-3">
          <div>
            <p className="text-gray-400 text-sm">Nombre completo</p>
            <p className="text-white">{fullName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Fecha de nacimiento</p>
            <p className="text-white">{memberData.birthDate || 'No especificada'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Género</p>
            <p className="text-white">{memberData.gender || 'No especificado'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">ID del miembro</p>
            <p className="text-[#00ff88] font-mono">{memberId}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Fecha de registro</p>
            <p className="text-white">{memberData.registrationDate}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Contacto</h3>
        <div className="space-y-3">
          <div>
            <p className="text-gray-400 text-sm">Teléfono</p>
            <p className="text-white flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              {memberData.phone || 'No especificado'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Correo electrónico</p>
            <p className="text-white flex items-center gap-2">
              <Mail size={16} className="text-gray-400" />
              {memberData.email || 'No especificado'}
            </p>
          </div>
        </div>

        <h4 className="text-white font-medium mt-6 mb-3">Contacto de emergencia</h4>
        <div className="space-y-3">
          <div>
            <p className="text-gray-400 text-sm">Nombre del contacto</p>
            <p className="text-white">{memberData.emergencyContact || 'No especificado'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Teléfono de emergencia</p>
            <p className="text-white">{memberData.emergencyPhone || 'No especificado'}</p>
          </div>
        </div>
      </div>

      <div className="xl:col-span-2">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Notas</h3>
          <p className="text-gray-400">{memberData.notes || 'No hay notas registradas para este miembro.'}</p>
        </div>
      </div>

      <div className="xl:col-span-2 flex justify-end">
        <button 
          onClick={() => navigate(`/members/${memberId}/edit`, { 
            state: { 
              memberData: memberData,
              subscriptionData: subscriptionData
            }
          })}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
        >
          <Edit size={18} />
          Editar información
        </button>
      </div>
    </div>
  );

  // Funciones para acciones del menú
  const handleRegisterEntry = () => {
    alert('Registrando entrada manual...');
    // Aquí iría la lógica para registrar entrada
  };

  const handleRegisterExit = () => {
    alert('Registrando salida manual...');
    // Aquí iría la lógica para registrar salida
  };

  const handleBlockAccess = () => {
    if (!blockReason.trim()) {
      alert('Debes escribir un motivo');
      return;
    }
    setShowBlockModal(false);
    setBlockReason('');
    alert('Acceso bloqueado correctamente');
  };

  const handleDeactivateMember = () => {
    if (!deactivateReason) {
      alert('Debes seleccionar un motivo');
      return;
    }
    setShowDeactivateModal(false);
    setDeactivateReason('');
    alert('Miembro dado de baja correctamente');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Miembros" />
      
      <div className="flex-1 lg:ml-0">
        <Header />
        
        <main className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <button onClick={() => navigate('/members')} className="hover:text-white transition-colors">
              Miembros
            </button>
            <span>/</span>
            <span className="text-white">{fullName}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Perfil del miembro</h1>
              <p className="text-gray-400">Información completa y gestión del miembro</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/members/${memberId}/edit`, { 
                  state: { 
                    memberData: memberData,
                    subscriptionData: subscriptionData
                  }
                })}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
              >
                <Edit size={18} />
                Editar
              </button>
              <button 
                onClick={() => navigate(`/members/${memberId}/renew`, { 
                  state: { 
                    memberData: memberData,
                    subscriptionData: subscriptionData
                  }
                })}
                className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Renovar suscripción
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl z-10 overflow-hidden">
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        navigate('/access');
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                    >
                      <QrCode size={16} />
                      Ver QR
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        alert('Imprimiendo credencial...');
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                    >
                      <Printer size={16} />
                      Imprimir credencial
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        navigate(`/members/${memberId}/edit`, { 
                          state: { 
                            memberData: memberData,
                            subscriptionData: subscriptionData
                          }
                        });
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Editar miembro
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleRegisterEntry();
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                    >
                      <LogIn size={16} />
                      Registrar entrada manual
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleRegisterExit();
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Registrar salida manual
                    </button>
                    <div className="border-t border-[#2a2a2a]" />
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowBlockModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <Lock size={16} />
                      Bloquear acceso
                    </button>
                    <div className="border-t border-[#2a2a2a]" />
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowDeactivateModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Dar de baja miembro
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta principal del miembro */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {memberData.profilePhoto ? (
                  <img 
                    src={memberData.profilePhoto} 
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{fullName}</h2>
                    <p className="text-[#00ff88] font-mono text-sm">{memberId}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Miembro desde {memberData.registrationDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {memberData.phone || 'Sin teléfono'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {memberData.email || 'Sin correo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {subscriptionData.status === 'active' ? (
                      <>
                        <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full font-medium flex items-center gap-1">
                          <CheckCircle size={12} />
                          Suscripción activa
                        </span>
                        <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full font-medium flex items-center gap-1">
                          <CheckCircle size={12} />
                          Acceso permitido
                        </span>
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-full font-medium flex items-center gap-1">
                        <XCircle size={12} />
                        Sin suscripción
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {subscriptionData.status === 'active' && (
                <div className="text-right border-l border-[#2a2a2a] pl-6">
                  <p className="text-gray-400 text-sm">Vence en</p>
                  <p className={`text-2xl font-bold ${daysRemaining <= 5 ? 'text-yellow-500' : 'text-white'}`}>
                    {daysRemaining} días
                  </p>
                  <p className="text-gray-400 text-xs">{subscriptionData.endDate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Alertas */}
          <div className={`${getAlertStyles()} border rounded-xl p-4 mb-6`}>
            <div className="flex items-center gap-3">
              {alert.icon}
              <div className="flex-1">
                <p className="text-white font-medium">{alert.title}</p>
                <p className="text-gray-400 text-sm">{alert.message}</p>
              </div>
              {alert.action && (
                <button 
                  onClick={() => navigate(`/members/${memberId}/renew`, { 
                    state: { 
                      memberData: memberData,
                      subscriptionData: subscriptionData
                    }
                  })}
                  className="px-4 py-1.5 bg-[#00ff88] text-black rounded-lg text-sm font-medium hover:bg-[#00cc6a] transition-colors"
                >
                  {alert.action}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#1a1a1a] mb-6">
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
          {renderTabContent()}
        </main>
      </div>

      {/* Modal Bloquear acceso */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-red-400" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Bloquear acceso de {fullName}</h2>
              <p className="text-gray-400 text-sm mb-4">
                El miembro no podrá ingresar mediante su código QR hasta que un administrador retire el bloqueo.
              </p>
              <div className="text-left mb-6">
                <label className="text-white text-sm font-medium mb-1 block">
                  Motivo <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Escribe el motivo del bloqueo..."
                  rows="3"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleBlockAccess}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  Bloquear acceso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dar de baja */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <UserX size={32} className="text-red-400" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Dar de baja miembro</h2>
              <p className="text-gray-400 text-sm mb-4">
                {fullName} dejará de aparecer entre los miembros activos. Su historial de suscripciones, pagos y asistencias será conservado.
              </p>
              <div className="text-left mb-6">
                <label className="text-white text-sm font-medium mb-1 block">
                  Motivo <span className="text-red-400">*</span>
                </label>
                <select 
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                >
                  <option value="">Seleccionar motivo</option>
                  <option value="solicitud">Solicitud del miembro</option>
                  <option value="cambio">Cambio de gimnasio</option>
                  <option value="inactividad">Inactividad</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setDeactivateReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeactivateMember}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  Confirmar baja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfilePage;