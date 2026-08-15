import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { getMemberById, saveMember } from '../../../utils/memberId';
import WhatsAppButton from '../../WhatsApp/WhatsAppButton';
import WhatsAppHistory from '../../WhatsApp/WhatsAppHistory';
import { getSuggestedWhatsAppType } from '../../../services/whatsappService';


// ======================================================
// STORAGE DE ASISTENCIAS
// ======================================================

const ATTENDANCE_KEY = 'gym_control_attendance';

// ======================================================
// STORAGE DE PAGOS E HISTORIAL DE SUSCRIPCIONES
// ======================================================
// Se agregan sin modificar las funciones de asistencias,
// WhatsApp, QR, bloqueo ni edición del perfil.

const PAYMENTS_KEY = 'gym_control_payments';
const SUBSCRIPTION_HISTORY_KEY = 'gym_control_subscription_history';

const readLocalArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error leyendo ${key}:`, error);
    return [];
  }
};

const parseAttendanceDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatAttendanceDate = (value) => {
  const date = parseAttendanceDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const formatAttendanceTime = (value) => {
  const date = parseAttendanceDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const getAttendanceDurationMinutes = (record) => {
  if (Number(record?.durationMinutes) > 0) {
    return Number(record.durationMinutes);
  }

  const entry = parseAttendanceDate(record?.entryAt);
  const exit = parseAttendanceDate(record?.exitAt);

  if (!entry || !exit) return 0;

  return Math.max(
    0,
    Math.round((exit.getTime() - entry.getTime()) / 60000)
  );
};

const formatAttendanceDuration = (minutes) => {
  const value = Number(minutes || 0);
  if (value <= 0) return '—';

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (hours <= 0) return `${mins} min`;
  return `${hours}h ${mins}min`;
};

const formatAttendanceMethod = (method) => {
  switch (String(method || '').toLowerCase()) {
    case 'qr':
      return 'QR';
    case 'face':
      return 'Rostro';
    case 'pin':
      return 'PIN';
    case 'manual':
      return 'Manual';
    default:
      return method || 'Desconocido';
  }
};


// ======================================================
// FECHAS DE SUSCRIPCIÓN
// ======================================================
// Acepta tanto ISO como formatos usados por el sistema:
// 15 sep 2026, 15 sept 2026, 15 septiembre 2026,
// 15 oct 2026, etc.

const SUBSCRIPTION_MONTHS = {
  ene: 0,
  enero: 0,
  feb: 1,
  febrero: 1,
  mar: 2,
  marzo: 2,
  abr: 3,
  abril: 3,
  may: 4,
  mayo: 4,
  jun: 5,
  junio: 5,
  jul: 6,
  julio: 6,
  ago: 7,
  agosto: 7,
  sep: 8,
  sept: 8,
  septiembre: 8,
  oct: 9,
  octubre: 9,
  nov: 10,
  noviembre: 10,
  dic: 11,
  diciembre: 11
};

const parseSubscriptionDate = (value) => {
  if (!value) return null;

  // YYYY-MM-DD se interpreta de forma local para evitar desfases por UTC.
  const isoDateOnly = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      23,
      59,
      59,
      999
    );
  }

  const direct = new Date(value);

  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const cleanValue = String(value)
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

  const parts = cleanValue.split(' ');

  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = SUBSCRIPTION_MONTHS[parts[1]];
  const year = Number(parts[2]);

  if (
    Number.isNaN(day) ||
    month === undefined ||
    Number.isNaN(year)
  ) {
    return null;
  }

  return new Date(
    year,
    month,
    day,
    23,
    59,
    59,
    999
  );
};

const formatSubscriptionDate = (value) => {
  const date = parseSubscriptionDate(value);

  if (!date) return value || '—';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const formatPaymentMoney = (value, currency = 'MXN') => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
};

const MemberProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ======================================================
  // CARGAR EL MIEMBRO REAL DESDE LOCALSTORAGE
  // ======================================================
  const [memberData, setMemberData] = useState(null);
  const [loadingMember, setLoadingMember] = useState(true);

  useEffect(() => {
    const loadMember = () => {
      const storedMember = getMemberById(id);

      console.log('👤 Perfil cargado desde localStorage:', storedMember);

      setMemberData(storedMember);
      setLoadingMember(false);
    };

    loadMember();

    const handleStorageChange = () => {
      loadMember();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gym-storage-update', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gym-storage-update', handleStorageChange);
    };
  }, [id]);

  // La suscripción vive dentro del miembro guardado.
  const subscriptionData = memberData?.subscription || {
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

  const fullName = memberData
    ? `${memberData.firstName || ''} ${memberData.lastName || ''}`.trim() || 'Miembro'
    : 'Cargando miembro...';

  const memberId = memberData?.id || id || '';

  // Calcular días restantes
  // Conservamos la función original, pero ahora acepta todos los formatos
  // de fecha que ya utiliza el sistema.
  const calculateDaysRemaining = () => {
    if (
      !subscriptionData.endDate ||
      subscriptionData.endDate === 'Fecha no disponible'
    ) {
      return 0;
    }

    try {
      const endDate = parseSubscriptionDate(subscriptionData.endDate);

      if (!endDate) {
        return 0;
      }

      const today = new Date();

      today.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error('Error calculando días restantes:', error);
      return 0;
    }
  };

  const daysRemaining = calculateDaysRemaining();

  // ======================================================
  // ASISTENCIAS REALES DEL MIEMBRO
  // ======================================================
  const [attendanceData, setAttendanceData] = useState([]);

  // ======================================================
  // PAGOS REALES DEL MIEMBRO
  // ======================================================
  const [paymentData, setPaymentData] = useState([]);

  // ======================================================
  // HISTORIAL REAL DE SUSCRIPCIONES
  // ======================================================
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);

  useEffect(() => {
    const loadMemberAttendance = () => {
      const records = readLocalArray(ATTENDANCE_KEY)
        .filter(item => item?.memberId === memberId)
        .map(item => {
          const durationMinutes = getAttendanceDurationMinutes(item);

          return {
            ...item,
            date: formatAttendanceDate(item.entryAt || item.createdAt),
            entry: formatAttendanceTime(item.entryAt),
            exit: item.exitAt ? formatAttendanceTime(item.exitAt) : '—',
            durationMinutes,
            duration: formatAttendanceDuration(durationMinutes),
            method: formatAttendanceMethod(item.method)
          };
        })
        .sort((a, b) => {
          const dateA = parseAttendanceDate(a.entryAt || a.createdAt)?.getTime() || 0;
          const dateB = parseAttendanceDate(b.entryAt || b.createdAt)?.getTime() || 0;
          return dateB - dateA;
        });

      console.log(`🕒 Asistencias del miembro ${memberId}:`, records);
      setAttendanceData(records);
    };

    if (memberId) {
      loadMemberAttendance();
    }

    window.addEventListener('storage', loadMemberAttendance);
    window.addEventListener('gym-storage-update', loadMemberAttendance);

    return () => {
      window.removeEventListener('storage', loadMemberAttendance);
      window.removeEventListener('gym-storage-update', loadMemberAttendance);
    };
  }, [memberId]);


  // ======================================================
  // CARGAR PAGOS E HISTORIAL DE SUSCRIPCIONES
  // ======================================================
  // Esto se suma a la carga de asistencias existente. No se elimina
  // ni modifica ninguna de las funciones anteriores.

  useEffect(() => {
    const loadMemberFinancialData = () => {
      if (!memberId) {
        setPaymentData([]);
        setSubscriptionHistory([]);
        return;
      }

      // ----------------------------------------------------
      // PAGOS
      // ----------------------------------------------------

      const payments = readLocalArray(PAYMENTS_KEY)
        .filter(item =>
          item?.memberId === memberId ||
          item?.member?.id === memberId
        )
        .map(item => {
          const rawDate = item.createdAt || item.date || '';
          const paymentDate = parseSubscriptionDate(rawDate);

          return {
            ...item,

            // Campos que ya consume renderPagosTab y Resumen.
            date: paymentDate
              ? new Intl.DateTimeFormat('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }).format(paymentDate)
              : formatSubscriptionDate(rawDate),

            concept:
              item.concept ||
              item.planLabel ||
              'Pago de suscripción',

            period:
              item.period ||
              (
                item.startDate ||
                item.endDate
                  ? `${item.startDate || '—'} - ${item.endDate || '—'}`
                  : '—'
              ),

            method:
              item.paymentMethod ||
              item.method ||
              'No registrado',

            amount:
              formatPaymentMoney(
                item.amount,
                item.currency || 'MXN'
              ),

            status:
              String(item.status || '').toLowerCase() === 'completed'
                ? 'Pagado'
                : item.status || 'Pagado',

            _sortDate:
              paymentDate?.getTime() || 0
          };
        })
        .sort((a, b) => b._sortDate - a._sortDate);

      // ----------------------------------------------------
      // HISTORIAL DE SUSCRIPCIONES
      // ----------------------------------------------------

      const history = readLocalArray(SUBSCRIPTION_HISTORY_KEY)
        .filter(item =>
          item?.memberId === memberId ||
          item?.member?.id === memberId
        )
        .map(item => {
          // Las renovaciones pueden guardar la suscripción dentro
          // de item.subscription, mientras otros registros la guardan plana.
          const storedSubscription = item.subscription || item;

          const startDate =
            storedSubscription.startDate ||
            item.startDate ||
            '';

          const endDate =
            storedSubscription.endDate ||
            item.endDate ||
            '';

          const end = parseSubscriptionDate(endDate);
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const isCurrentPeriod =
            startDate === subscriptionData.startDate &&
            endDate === subscriptionData.endDate;

          const storedStatus =
            storedSubscription.status ||
            item.status ||
            '';

          let status = 'Finalizada';

          if (
            isCurrentPeriod ||
            (
              storedStatus === 'active' &&
              end &&
              end.getTime() >= now.getTime()
            )
          ) {
            status = 'Activa';
          }

          const created = parseSubscriptionDate(
            item.createdAt ||
            storedSubscription.createdAt ||
            startDate
          );

          return {
            ...item,
            ...storedSubscription,

            period:
              item.period ||
              `${startDate || '—'} - ${endDate || '—'}`,

            status,

            _sortDate:
              created?.getTime() ||
              parseSubscriptionDate(startDate)?.getTime() ||
              0
          };
        })
        .sort((a, b) => b._sortDate - a._sortDate);

      console.log(`💵 Pagos del miembro ${memberId}:`, payments);
      console.log(`📚 Historial de suscripciones ${memberId}:`, history);

      setPaymentData(payments);
      setSubscriptionHistory(history);
    };

    loadMemberFinancialData();

    window.addEventListener('storage', loadMemberFinancialData);
    window.addEventListener('gym-storage-update', loadMemberFinancialData);

    return () => {
      window.removeEventListener('storage', loadMemberFinancialData);
      window.removeEventListener('gym-storage-update', loadMemberFinancialData);
    };
  }, [
    memberId,
    subscriptionData.startDate,
    subscriptionData.endDate
  ]);

  // ======================================================
  // ESTADÍSTICAS DEL MIEMBRO
  // ======================================================
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
      const date = parseAttendanceDate(item.entryAt || item.createdAt);
      return (
        date &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const thisWeek = attendanceData.filter(item => {
      const date = parseAttendanceDate(item.entryAt || item.createdAt);
      return date && date >= startOfWeek && date <= now;
    });

    const last = attendanceData[0] || null;

    const completedVisits = attendanceData.filter(
      item => Number(item.durationMinutes || 0) > 0
    );

    const totalMinutes = completedVisits.reduce(
      (total, item) => total + Number(item.durationMinutes || 0),
      0
    );

    const avgMinutes = completedVisits.length > 0
      ? Math.round(totalMinutes / completedVisits.length)
      : 0;

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

  const currentAttendance = attendanceData.find(
    item => item.status === 'inside' && !item.exitAt
  ) || null;

  // Datos del QR
  // Debe coincidir con el formato generado durante el registro.
  const qrData = JSON.stringify({
    type: 'GYM_ACCESS_V2',
    memberId: memberId,
    token: memberData?.access?.qr?.token || ''
  });

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'suscripcion', label: 'Suscripción' },
    { id: 'asistencias', label: 'Asistencias' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'contacto', label: 'Contacto' },
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
      case 'contacto':
        return renderContactoTab();
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
        {memberData?.access?.qr?.enabled && memberData?.access?.qr?.token ? (
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
            <div className={`w-3 h-3 rounded-full ${currentAttendance ? 'bg-[#00ff88]' : 'bg-gray-500'}`} />
            <div>
              <p className="text-white font-medium">
                {currentAttendance ? 'Dentro del gimnasio' : 'Fuera del gimnasio'}
              </p>
              <p className="text-gray-400 text-sm">
                {currentAttendance
                  ? `Entrada registrada a las ${formatAttendanceTime(currentAttendance.entryAt)} mediante ${currentAttendance.method}.`
                  : attendanceData.length > 0
                    ? `Última asistencia: ${attendanceData[0].date} a las ${attendanceData[0].entry}.`
                    : 'Sin registros de entrada recientes.'}
              </p>
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
                      <span>Acceso mediante {item.method}</span>
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
                  <tr key={item.id || index} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
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

  const renderContactoTab = () => (

    <div className="space-y-6">

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>

            <h3 className="text-white font-bold">
              Contacto por WhatsApp
            </h3>

            <p className="text-gray-500 text-sm mt-1">
              Prepara mensajes de renovación, vencimiento, promociones, cumpleaños o seguimiento.
            </p>

          </div>


          <WhatsAppButton
            member={
              memberData
            }
            defaultType={
              getSuggestedWhatsAppType(
                memberData
              )
            }
          />

        </div>

      </div>


      <WhatsAppHistory
        memberId={
          memberId
        }
      />

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

    if (!memberData) {
      return;
    }

    const updatedMember = {
      ...memberData,
      accessBlocked: true,
      blockReason: blockReason.trim(),
      blockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveMember(updatedMember);
    setMemberData(updatedMember);
    setShowBlockModal(false);
    setBlockReason('');

    alert('Acceso bloqueado correctamente');
  };

  const handleDeactivateMember = () => {
    if (!deactivateReason) {
      alert('Debes seleccionar un motivo');
      return;
    }

    if (!memberData) {
      return;
    }

    const updatedMember = {
      ...memberData,
      status: 'inactive',
      accessBlocked: true,
      deactivationReason: deactivateReason,
      deactivatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveMember(updatedMember);
    setMemberData(updatedMember);
    setShowDeactivateModal(false);
    setDeactivateReason('');

    alert('Miembro dado de baja correctamente');
    navigate('/members');
  };

  // ======================================================
  // CARGANDO MIEMBRO
  // ======================================================
  if (loadingMember) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <Sidebar activePage="Miembros" />

        <div className="flex-1 lg:ml-0">
          <Header />

          <main className="p-6">
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-12 text-center">
              <div className="w-10 h-10 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Cargando perfil...</p>
              <p className="text-gray-500 text-sm mt-1">Buscando {id} en el almacenamiento local.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ======================================================
  // MIEMBRO NO ENCONTRADO
  // ======================================================
  if (!memberData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <Sidebar activePage="Miembros" />

        <div className="flex-1 lg:ml-0">
          <Header />

          <main className="p-6">
            <div className="bg-[#111111] border border-red-500/20 rounded-xl p-12 text-center">
              <UserX size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-white text-xl font-bold">Miembro no encontrado</h2>
              <p className="text-gray-400 mt-2">
                No encontramos el miembro {id} en el almacenamiento local.
              </p>

              <button
                type="button"
                onClick={() => navigate('/members')}
                className="mt-6 px-5 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold"
              >
                Volver a miembros
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
            <div className="flex gap-2 flex-wrap">

              <WhatsAppButton
                member={
                  memberData
                }
                defaultType={
                  getSuggestedWhatsAppType(
                    memberData
                  )
                }
              />

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