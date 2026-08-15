// src/components/Dashboard/DashboardPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

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
  ArrowRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  WalletCards,
  RefreshCw,
  CreditCard,
  Banknote,
  Landmark,
  Activity,
  Sparkles
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

import MetricCard from './Cards/MetricCard';
import QuickAction from './Cards/QuickAction';
import DonutChart from './Charts/DonutChart';
import ActivityTable from './Tables/ActivityTable';
import RetentionPanel from './RetentionPanel';

import {
  getStoredMembers
} from '../../utils/memberId';

import {
  useGymSettings
} from '../../context/GymSettingsContext';

import {
  getSales,
  getSalesSummary
} from '../../services/salesService';


// ======================================================
// STORAGE
// ======================================================

const ATTENDANCE_KEY =
  'gym_control_attendance';

const PAYMENTS_KEY =
  'gym_control_payments';


// ======================================================
// MESES ESPAÑOL
// ======================================================

const MONTHS = {
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


// ======================================================
// LEER ARRAY LOCAL
// ======================================================

const readLocalArray = (
  key
) => {

  try {

    const raw =
      localStorage.getItem(
        key
      );


    if (!raw) {
      return [];
    }


    const parsed =
      JSON.parse(
        raw
      );


    return Array.isArray(
      parsed
    )
      ? parsed
      : [];

  } catch (error) {

    console.error(
      `Error leyendo ${key}:`,
      error
    );


    return [];

  }

};


// ======================================================
// PARSEAR FECHA
// ======================================================

const parseGymDate = (
  value
) => {

  if (!value) {
    return null;
  }


  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return new Date(value);
  }


  const direct =
    new Date(
      value
    );


  if (
    !Number.isNaN(
      direct.getTime()
    )
  ) {
    return direct;
  }


  const parts =
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/,/g, '')
      .split(/\s+/);


  if (
    parts.length !== 3
  ) {
    return null;
  }


  const day =
    Number(
      parts[0]
    );

  const month =
    MONTHS[
      parts[1]
    ];

  const year =
    Number(
      parts[2]
    );


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
    12,
    0,
    0,
    0
  );

};


// ======================================================
// FECHAS
// ======================================================

const isSameDay = (
  first,
  second
) => {

  if (
    !first ||
    !second
  ) {
    return false;
  }


  return (
    first.getDate() ===
      second.getDate() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getFullYear() ===
      second.getFullYear()
  );

};


const isToday = (
  value
) => {

  const date =
    parseGymDate(
      value
    );


  return isSameDay(
    date,
    new Date()
  );

};


const getStartOfWeek =
  () => {

    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0
    );


    const day =
      today.getDay();


    const diff =
      day === 0
        ? -6
        : 1 - day;


    const monday =
      new Date(
        today
      );


    monday.setDate(
      today.getDate() +
      diff
    );


    return monday;

  };


const getDaysRemaining = (
  endDate
) => {

  const expiration =
    parseGymDate(
      endDate
    );


  if (!expiration) {
    return null;
  }


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  expiration.setHours(
    23,
    59,
    59,
    999
  );


  return Math.ceil(
    (
      expiration.getTime() -
      today.getTime()
    ) /
    (
      1000 *
      60 *
      60 *
      24
    )
  );

};


// ======================================================
// FORMATEO
// ======================================================

const formatTime = (
  value
) => {

  const date =
    parseGymDate(
      value
    );


  if (!date) {
    return '—';
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
  ).format(
    date
  );

};


const formatShortDate = (
  value
) => {

  const date =
    parseGymDate(
      value
    );


  if (!date) {
    return value || '—';
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short'
    }
  ).format(
    date
  );

};


const normalizeCurrency = (
  currency
) => {

  return currency === 'USD'
    ? 'USD'
    : 'MXN';

};


const formatMoney = (
  value,
  currency
) => {

  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency:
        normalizeCurrency(
          currency
        ),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(
    Number(value || 0)
  );

};


// ======================================================
// ESTADO DE SUSCRIPCIÓN
// ======================================================

const getMemberSubscriptionStatus = (
  member,
  warningDays = 5
) => {

  if (
    member?.status ===
      'inactive' ||
    member?.accessBlocked ===
      true
  ) {
    return 'Bloqueadas';
  }


  if (
    !member?.subscription
  ) {
    return 'Sin suscripción';
  }


  const remaining =
    getDaysRemaining(
      member.subscription.endDate
    );


  if (
    remaining === null
  ) {

    return member.subscription.status ===
      'active'
      ? 'Activas'
      : 'Sin suscripción';

  }


  if (
    remaining <
    0
  ) {
    return 'Vencidas';
  }


  if (
    remaining <=
    warningDays
  ) {
    return 'Por vencer';
  }


  return 'Activas';

};


// ======================================================
// FECHA DE PAGO
// ======================================================

const getPaymentDate = (
  payment
) => {

  return parseGymDate(
    payment?.createdAt ||
    payment?.date ||
    payment?.paymentDate ||
    payment?.paidAt
  );

};


// ======================================================
// ¿ES RENOVACIÓN?
// ======================================================

const isRenewalPayment = (
  payment
) => {

  const text =
    `${payment?.type || ''} ${payment?.concept || ''} ${payment?.source || ''}`
      .toLowerCase();


  return (
    text.includes(
      'renew'
    ) ||
    text.includes(
      'renov'
    )
  );

};


// ======================================================
// MÉTODO DE PAGO
// ======================================================

const paymentMethodLabel = (
  method
) => {

  const normalized =
    String(
      method || ''
    )
      .trim()
      .toLowerCase();


  const labels = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    otro: 'Otro'
  };


  return labels[normalized] ||
    'Otro';

};


// ======================================================
// DASHBOARD
// ======================================================

const DashboardPage = () => {

  const navigate =
    useNavigate();


  const {
    settings
  } = useGymSettings();


  const [
    members,
    setMembers
  ] = useState([]);


  const [
    attendance,
    setAttendance
  ] = useState([]);


  const [
    payments,
    setPayments
  ] = useState([]);


  const [
    lastUpdated,
    setLastUpdated
  ] = useState(
    new Date()
  );


  const currency =
    normalizeCurrency(
      settings?.currency
    );


  const warningDays =
    Math.max(
      0,
      Number(
        settings?.warningDays ??
        5
      )
    );


  // ======================================================
  // CARGAR TODO
  // ======================================================

  const loadDashboardData =
    () => {

      setMembers(
        getStoredMembers()
      );


      setAttendance(
        readLocalArray(
          ATTENDANCE_KEY
        )
      );


      setPayments(
        readLocalArray(
          PAYMENTS_KEY
        )
      );


      setLastUpdated(
        new Date()
      );

    };


  useEffect(
    () => {

      loadDashboardData();


      const handleUpdate =
        () =>
          loadDashboardData();


      window.addEventListener(
        'storage',
        handleUpdate
      );


      window.addEventListener(
        'gym-storage-update',
        handleUpdate
      );


      const interval =
        setInterval(
          loadDashboardData,
          60000
        );


      return () => {

        window.removeEventListener(
          'storage',
          handleUpdate
        );


        window.removeEventListener(
          'gym-storage-update',
          handleUpdate
        );


        clearInterval(
          interval
        );

      };

    },
    []
  );


  // ======================================================
  // MIEMBROS CON ESTADO
  // ======================================================

  const membersWithStatus =
    useMemo(
      () =>
        members.map(
          member => ({

            ...member,

            calculatedStatus:
              getMemberSubscriptionStatus(
                member,
                warningDays
              )

          })
        ),
      [
        members,
        warningDays
      ]
    );


  // ======================================================
  // PERSONAS DENTRO
  // ======================================================

  const peopleInside =
    useMemo(
      () =>
        attendance.filter(
          record =>
            record.status ===
              'inside' &&
            !record.exitAt
        ),
      [attendance]
    );


  // ======================================================
  // MÉTRICAS OPERATIVAS
  // ======================================================

  const metrics =
    useMemo(
      () => {

        const activeMembers =
          membersWithStatus.filter(
            member =>
              member.calculatedStatus ===
                'Activas' ||
              member.calculatedStatus ===
                'Por vencer'
          ).length;


        const todayEntries =
          attendance.filter(
            record =>
              record.entryAt &&
              isToday(
                record.entryAt
              )
          ).length;


        const expiringSoon =
          membersWithStatus.filter(
            member =>
              member.calculatedStatus ===
                'Por vencer'
          ).length;


        return {
          activeMembers,
          currentInside:
            peopleInside.length,
          todayEntries,
          expiringSoon
        };

      },
      [
        membersWithStatus,
        attendance,
        peopleInside
      ]
    );


  // ======================================================
  // ALTAS ESTE MES
  // ======================================================

  const membersRegisteredThisMonth =
    useMemo(
      () => {

        const now =
          new Date();


        return members.filter(
          member => {

            const date =
              parseGymDate(
                member.registrationDate ||
                member.createdAt
              );


            if (!date) {
              return false;
            }


            return (
              date.getMonth() ===
                now.getMonth() &&
              date.getFullYear() ===
                now.getFullYear()
            );

          }
        ).length;

      },
      [members]
    );


  // ======================================================
  // FINANZAS
  // ======================================================

  const financial =
    useMemo(
      () => {

        const now =
          new Date();


        const currentMonth =
          now.getMonth();

        const currentYear =
          now.getFullYear();


        const previousMonthDate =
          new Date(
            currentYear,
            currentMonth - 1,
            1
          );


        const previousMonth =
          previousMonthDate.getMonth();

        const previousYear =
          previousMonthDate.getFullYear();


        const completedPayments =
          payments.filter(
            payment =>
              !payment?.status ||
              [
                'completed',
                'paid',
                'pagado',
                'completado'
              ].includes(
                String(
                  payment.status
                ).toLowerCase()
              )
          );


        const todayPayments =
          completedPayments.filter(
            payment =>
              isToday(
                getPaymentDate(
                  payment
                )
              )
          );


        const monthPayments =
          completedPayments.filter(
            payment => {

              const date =
                getPaymentDate(
                  payment
                );


              return (
                date &&
                date.getMonth() ===
                  currentMonth &&
                date.getFullYear() ===
                  currentYear
              );

            }
          );


        const previousMonthPayments =
          completedPayments.filter(
            payment => {

              const date =
                getPaymentDate(
                  payment
                );


              return (
                date &&
                date.getMonth() ===
                  previousMonth &&
                date.getFullYear() ===
                  previousYear
              );

            }
          );


        const sum =
          list =>
            list.reduce(
              (
                total,
                payment
              ) =>
                total +
                Number(
                  payment.amount ||
                  0
                ),
              0
            );


        const incomeToday =
          sum(
            todayPayments
          );


        const incomeMonth =
          sum(
            monthPayments
          );


        const incomePreviousMonth =
          sum(
            previousMonthPayments
          );


        const comparison =
          incomePreviousMonth >
          0
            ? (
                (
                  incomeMonth -
                  incomePreviousMonth
                ) /
                incomePreviousMonth
              ) *
              100
            : incomeMonth >
              0
              ? 100
              : 0;


        const renewals =
          monthPayments.filter(
            isRenewalPayment
          ).length;


        const averageTicket =
          monthPayments.length >
          0
            ? incomeMonth /
              monthPayments.length
            : 0;


        const methods = {
          Efectivo: 0,
          Tarjeta: 0,
          Transferencia: 0,
          Otro: 0
        };


        monthPayments.forEach(
          payment => {

            const label =
              paymentMethodLabel(
                payment.paymentMethod ||
                payment.method
              );


            methods[label] =
              (
                methods[label] ||
                0
              ) +
              Number(
                payment.amount ||
                0
              );

          }
        );


        const methodData =
          Object.entries(
            methods
          )
            .map(
              (
                [
                  label,
                  value
                ]
              ) => ({
                label,
                value
              })
            )
            .sort(
              (
                a,
                b
              ) =>
                b.value -
                a.value
            );


        const planCounter = {};


        monthPayments.forEach(
          payment => {

            const label =
              payment.planLabel ||
              payment.plan ||
              'Sin plan';


            planCounter[label] =
              (
                planCounter[label] ||
                0
              ) +
              1;

          }
        );


        const topPlan =
          Object.entries(
            planCounter
          )
            .sort(
              (
                a,
                b
              ) =>
                b[1] -
                a[1]
            )[0] ||
          null;


        return {
          incomeToday,
          incomeMonth,
          incomePreviousMonth,
          comparison,
          renewals,
          averageTicket,
          paymentsThisMonth:
            monthPayments.length,
          methodData,
          topPlan
        };

      },
      [payments]
    );


  // ======================================================
  // DISTRIBUCIÓN SUSCRIPCIONES
  // ======================================================

  const subscriptionData =
    useMemo(
      () => [

        {
          label: 'Activas',
          value:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                  'Activas'
            ).length
        },

        {
          label: 'Por vencer',
          value:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                  'Por vencer'
            ).length
        },

        {
          label: 'Vencidas',
          value:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                  'Vencidas'
            ).length
        },

        {
          label: 'Bloqueadas',
          value:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                  'Bloqueadas'
            ).length
        }

      ],
      [membersWithStatus]
    );


  const totalSubscriptions =
    subscriptionData.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.value,
      0
    );


  // ======================================================
  // ASISTENCIA SEMANAL
  // ======================================================

  const weeklyAttendance =
    useMemo(
      () => {

        const labels = [
          'Lun',
          'Mar',
          'Mié',
          'Jue',
          'Vie',
          'Sáb',
          'Dom'
        ];


        const start =
          getStartOfWeek();


        return labels.map(
          (
            day,
            index
          ) => {

            const date =
              new Date(
                start
              );


            date.setDate(
              start.getDate() +
              index
            );


            const value =
              attendance.filter(
                record => {

                  const entry =
                    parseGymDate(
                      record.entryAt
                    );


                  return isSameDay(
                    entry,
                    date
                  );

                }
              ).length;


            return {
              day,
              value
            };

          }
        );

      },
      [attendance]
    );


  const totalWeeklyAttendance =
    weeklyAttendance.reduce(
      (
        total,
        item
      ) =>
        total +
        item.value,
      0
    );


  const maxWeeklyAttendance =
    Math.max(
      1,
      ...weeklyAttendance.map(
        item =>
          item.value
      )
    );


  // ======================================================
  // HORAS DE AFLUENCIA
  // ======================================================

  const peakHours =
    useMemo(
      () => {

        const ranges = [

          {
            label: '6:00 AM',
            start: 6,
            end: 8
          },

          {
            label: '8:00 AM',
            start: 8,
            end: 12
          },

          {
            label: '12:00 PM',
            start: 12,
            end: 17
          },

          {
            label: '5:00 PM',
            start: 17,
            end: 19
          },

          {
            label: '7:00 PM',
            start: 19,
            end: 21
          },

          {
            label: '9:00 PM',
            start: 21,
            end: 24
          }

        ];


        return ranges.map(
          range => {

            const people =
              attendance.filter(
                record => {

                  const entry =
                    parseGymDate(
                      record.entryAt
                    );


                  if (!entry) {
                    return false;
                  }


                  return (
                    entry.getHours() >=
                      range.start &&
                    entry.getHours() <
                      range.end
                  );

                }
              ).length;


            return {
              hour:
                range.label,
              people
            };

          }
        );

      },
      [attendance]
    );


  const maxPeak =
    Math.max(
      1,
      ...peakHours.map(
        item =>
          item.people
      )
    );


  const busiestHour =
    useMemo(
      () => {

        const sorted =
          [
            ...peakHours
          ].sort(
            (
              a,
              b
            ) =>
              b.people -
              a.people
          );


        return (
          sorted[0] &&
          sorted[0].people >
          0
        )
          ? sorted[0]
          : null;

      },
      [peakHours]
    );


  // ======================================================
  // ACTIVIDAD RECIENTE
  // ======================================================

  const activities =
    useMemo(
      () => {

        const movementList = [];


        attendance.forEach(
          record => {

            const member =
              members.find(
                item =>
                  item.id ===
                  record.memberId
              );


            const name =
              record.memberName ||
              `${member?.firstName || ''} ${member?.lastName || ''}`.trim() ||
              'Miembro';


            const subscriptionStatus =
              member
                ? getMemberSubscriptionStatus(
                    member,
                    warningDays
                  )
                : 'Sin suscripción';


            const base = {
              name,
              id:
                record.memberId,
              photo:
                member?.profilePhoto ||
                null,
              method:
                record.method ||
                record.accessMethod ||
                'Acceso',
              subscription:
                subscriptionStatus ===
                  'Activas'
                  ? 'Activa'
                  : subscriptionStatus
            };


            if (
              record.entryAt
            ) {

              movementList.push({

                ...base,

                timestamp:
                  record.entryAt,

                time:
                  formatTime(
                    record.entryAt
                  ),

                movement:
                  'Entrada',

                status:
                  'Acceso permitido'

              });

            }


            if (
              record.exitAt
            ) {

              movementList.push({

                ...base,

                timestamp:
                  record.exitAt,

                time:
                  formatTime(
                    record.exitAt
                  ),

                movement:
                  'Salida',

                status:
                  'Salida registrada'

              });

            }

          }
        );


        return movementList
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b.timestamp
              ) -
              new Date(
                a.timestamp
              )
          )
          .slice(
            0,
            7
          );

      },
      [
        attendance,
        members,
        warningDays
      ]
    );


  // ======================================================
  // PRÓXIMAS A VENCER
  // ======================================================

  const upcomingExpirations =
    useMemo(
      () =>
        membersWithStatus
          .filter(
            member =>
              member.calculatedStatus ===
                'Por vencer'
          )
          .map(
            member => ({

              id:
                member.id,

              name:
                `${member.firstName || ''} ${member.lastName || ''}`.trim(),

              photo:
                member.profilePhoto ||
                null,

              endDate:
                member.subscription?.endDate ||
                '',

              days:
                getDaysRemaining(
                  member.subscription?.endDate
                )

            })
          )
          .sort(
            (
              a,
              b
            ) =>
              a.days -
              b.days
          )
          .slice(
            0,
            5
          ),
      [membersWithStatus]
    );



  // ======================================================
  // VENTAS DE PRODUCTOS
  // ======================================================

  const productSalesSummary =
    useMemo(
      () =>
        getSalesSummary(
          getSales()
        ),
      [
        payments
      ]
    );


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Dashboard"
      />


      <div className="flex-1 lg:ml-0 min-w-0">

        <Header
          subtitle="Resumen operativo y financiero del gimnasio"
        />


        <main className="p-6 space-y-6 max-w-full">

          {/* ================================================= */}
          {/* HERO OPERATIVO */}
          {/* ================================================= */}

          <div className="relative overflow-hidden rounded-2xl border border-[#1d1d1d] bg-[#101010] p-6">

            <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-[#00ff88]/5 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

              <div>

                <div className="flex items-center gap-2 mb-2">

                  <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />

                  <span className="text-[#00ff88] text-[10px] font-bold tracking-[0.18em] uppercase">
                    Operación en tiempo real
                  </span>

                </div>


                <h2 className="text-2xl lg:text-3xl font-bold text-white">
                  Tu gimnasio está bajo control
                </h2>


                <p className="text-gray-500 text-sm mt-2 max-w-2xl">
                  Miembros, accesos, suscripciones e ingresos actualizados desde la misma información local.
                </p>

              </div>


              <div className="flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={
                    loadDashboardData
                  }
                  className="px-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#171717] text-gray-300 hover:text-white hover:border-[#00ff88]/30 transition-all flex items-center gap-2 text-sm"
                >

                  <RefreshCw
                    size={17}
                  />

                  Actualizar

                </button>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/access'
                    )
                  }
                  className="bg-[#00ff88] text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00d977] transition-all"
                >

                  <QrCode
                    size={19}
                  />

                  Abrir acceso

                </button>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* MÉTRICAS OPERATIVAS */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            <MetricCard
              title="Miembros activos"
              value={
                metrics.activeMembers
              }
              subtitle={`${membersRegisteredThisMonth} altas este mes`}
              icon={Users}
              color="green"
              badge="MIEMBROS"
              onClick={() =>
                navigate(
                  '/members'
                )
              }
            />


            <MetricCard
              title="Dentro del gimnasio"
              value={
                metrics.currentInside
              }
              subtitle="Personas ahora mismo"
              icon={UserCheck}
              color="blue"
              badge="EN VIVO"
              pulse={
                metrics.currentInside >
                0
              }
              onClick={() =>
                navigate(
                  '/attendance'
                )
              }
            />


            <MetricCard
              title="Entradas de hoy"
              value={
                metrics.todayEntries
              }
              subtitle="Accesos registrados hoy"
              icon={LogIn}
              color="green"
              badge="HOY"
              onClick={() =>
                navigate(
                  '/attendance'
                )
              }
            />


            <MetricCard
              title="Por vencer"
              value={
                metrics.expiringSoon
              }
              subtitle={`Próximos ${warningDays} días`}
              icon={Clock}
              color="yellow"
              badge="ATENCIÓN"
              action="Revisar"
              onActionClick={() =>
                navigate(
                  '/subscriptions'
                )
              }
              onClick={() =>
                navigate(
                  '/subscriptions'
                )
              }
            />

          </div>


          {/* ================================================= */}
          {/* DASHBOARD FINANCIERO */}
          {/* ================================================= */}

          <section className="bg-[#101010] border border-[#1d1d1d] rounded-2xl overflow-hidden">

            <div className="p-6 border-b border-[#1d1d1d] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div>

                <div className="flex items-center gap-2">

                  <div className="w-9 h-9 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

                    <TrendingUp
                      size={18}
                      className="text-[#00ff88]"
                    />

                  </div>


                  <div>

                    <h3 className="text-white font-bold text-lg">
                      Dashboard financiero
                    </h3>

                    <p className="text-gray-500 text-xs mt-0.5">
                      Ingresos, renovaciones, nuevos clientes y comportamiento del mes.
                    </p>

                  </div>

                </div>

              </div>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/payments'
                  )
                }
                className="text-[#00ff88] text-sm hover:underline flex items-center gap-1"
              >
                Ver pagos
                <ArrowRight size={14} />
              </button>

            </div>


            <div className="p-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <MetricCard
                  title="Ingresos de hoy"
                  value={
                    formatMoney(
                      financial.incomeToday,
                      currency
                    )
                  }
                  subtitle="Pagos confirmados"
                  icon={DollarSign}
                  color="green"
                  badge="HOY"
                  compact
                  onClick={() =>
                    navigate(
                      '/payments'
                    )
                  }
                />


                <MetricCard
                  title="Ingresos del mes"
                  value={
                    formatMoney(
                      financial.incomeMonth,
                      currency
                    )
                  }
                  subtitle={`${financial.paymentsThisMonth} pagos registrados`}
                  icon={WalletCards}
                  color="green"
                  badge="MES ACTUAL"
                  trendValue={
                    financial.comparison
                  }
                  compact
                  onClick={() =>
                    navigate(
                      '/payments'
                    )
                  }
                />


                <MetricCard
                  title="Renovaciones"
                  value={
                    financial.renewals
                  }
                  subtitle="Este mes"
                  icon={RefreshCw}
                  color="blue"
                  badge="RETENCIÓN"
                  compact
                  onClick={() =>
                    navigate(
                      '/subscriptions'
                    )
                  }
                />


                <MetricCard
                  title="Ticket promedio"
                  value={
                    formatMoney(
                      financial.averageTicket,
                      currency
                    )
                  }
                  subtitle="Promedio por pago"
                  icon={CreditCard}
                  color="yellow"
                  badge="PROMEDIO"
                  compact
                  onClick={() =>
                    navigate(
                      '/payments'
                    )
                  }
                />

              </div>


              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">

                {/* COMPARATIVA */}

                <div className="xl:col-span-2 bg-[#151515] border border-[#222222] rounded-2xl p-5">

                  <div className="flex items-center justify-between gap-4 mb-5">

                    <div>

                      <p className="text-white font-semibold">
                        Rendimiento mensual
                      </p>

                      <p className="text-gray-600 text-xs mt-1">
                        Comparativa contra el mes anterior
                      </p>

                    </div>


                    <div
                      className={`
                        px-3
                        py-1.5
                        rounded-full
                        text-xs
                        font-bold
                        flex
                        items-center
                        gap-1

                        ${
                          financial.comparison >=
                          0
                            ? 'bg-[#00ff88]/10 text-[#00ff88]'
                            : 'bg-red-500/10 text-red-400'
                        }
                      `}
                    >

                      {
                        financial.comparison >=
                        0
                          ? (
                            <TrendingUp size={14} />
                          )
                          : (
                            <TrendingDown size={14} />
                          )
                      }

                      {
                        financial.comparison >=
                        0
                          ? '+'
                          : ''
                      }
                      {financial.comparison.toFixed(1)}%

                    </div>

                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="rounded-xl bg-[#101010] border border-[#202020] p-4">

                      <p className="text-gray-500 text-xs">
                        Mes actual
                      </p>

                      <p className="text-white text-2xl font-bold mt-1">
                        {
                          formatMoney(
                            financial.incomeMonth,
                            currency
                          )
                        }
                      </p>

                    </div>


                    <div className="rounded-xl bg-[#101010] border border-[#202020] p-4">

                      <p className="text-gray-500 text-xs">
                        Mes anterior
                      </p>

                      <p className="text-gray-300 text-2xl font-bold mt-1">
                        {
                          formatMoney(
                            financial.incomePreviousMonth,
                            currency
                          )
                        }
                      </p>

                    </div>

                  </div>


                  <div className="mt-4 rounded-xl bg-[#101010] border border-[#202020] p-4 flex items-center justify-between gap-4">

                    <div>

                      <p className="text-gray-500 text-xs">
                        Plan con más ventas
                      </p>

                      <p className="text-white font-semibold mt-1 capitalize">
                        {
                          financial.topPlan
                            ? financial.topPlan[0]
                            : 'Sin datos todavía'
                        }
                      </p>

                    </div>


                    <div className="text-right">

                      <p className="text-[#00ff88] text-xl font-bold">
                        {
                          financial.topPlan
                            ? financial.topPlan[1]
                            : 0
                        }
                      </p>

                      <p className="text-gray-600 text-[10px]">
                        pagos
                      </p>

                    </div>

                  </div>

                </div>


                {/* MÉTODOS */}

                <div className="bg-[#151515] border border-[#222222] rounded-2xl p-5">

                  <p className="text-white font-semibold">
                    Métodos de pago
                  </p>

                  <p className="text-gray-600 text-xs mt-1">
                    Distribución del mes actual
                  </p>


                  <div className="space-y-4 mt-5">

                    {
                      financial.methodData.map(
                        item => {

                          const max =
                            Math.max(
                              1,
                              ...financial.methodData.map(
                                method =>
                                  method.value
                              )
                            );


                          const width =
                            item.value >
                            0
                              ? Math.max(
                                  4,
                                  (
                                    item.value /
                                    max
                                  ) *
                                  100
                                )
                              : 0;


                          const Icon =
                            item.label ===
                              'Efectivo'
                              ? Banknote
                              : item.label ===
                                'Transferencia'
                                ? Landmark
                                : CreditCard;


                          return (

                            <div
                              key={
                                item.label
                              }
                            >

                              <div className="flex items-center justify-between gap-3 mb-2">

                                <div className="flex items-center gap-2">

                                  <Icon
                                    size={14}
                                    className="text-gray-500"
                                  />

                                  <span className="text-gray-400 text-xs">
                                    {item.label}
                                  </span>

                                </div>


                                <span className="text-white text-xs font-semibold">
                                  {
                                    formatMoney(
                                      item.value,
                                      currency
                                    )
                                  }
                                </span>

                              </div>


                              <div className="h-1.5 rounded-full bg-[#222222] overflow-hidden">

                                <div
                                  className="h-full rounded-full bg-[#00ff88]"
                                  style={{
                                    width:
                                      `${width}%`
                                  }}
                                />

                              </div>

                            </div>

                          );

                        }
                      )
                    }

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* ================================================= */}
          {/* ACCIONES RÁPIDAS */}
          {/* ================================================= */}

          <div>

            <div className="flex items-center justify-between mb-3">

              <div>

                <h3 className="text-white font-bold">
                  Acciones rápidas
                </h3>

                <p className="text-gray-600 text-xs mt-1">
                  Operaciones frecuentes de recepción
                </p>

              </div>

            </div>


            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">

              <QuickAction
                icon={UserPlus}
                label="Registrar miembro"
                description="Nuevo cliente"
                onClick={() =>
                  navigate(
                    '/members/register'
                  )
                }
              />


              <QuickAction
                icon={Calendar}
                label="Renovar"
                description="Extender vigencia"
                color="blue"
                onClick={() =>
                  navigate(
                    '/subscriptions'
                  )
                }
              />


              <QuickAction
                icon={QrCode}
                label="Códigos QR"
                description="Gestionar accesos"
                onClick={() =>
                  navigate(
                    '/members'
                  )
                }
              />


              <QuickAction
                icon={Ticket}
                label="Registrar visita"
                description="Acceso temporal"
                color="yellow"
                onClick={() =>
                  navigate(
                    '/visits'
                  )
                }
              />


              <QuickAction
                icon={Scan}
                label="Control acceso"
                description="QR, PIN o rostro"
                onClick={() =>
                  navigate(
                    '/access'
                  )
                }
              />

            </div>

          </div>


          {/* ================================================= */}
          {/* SUSCRIPCIONES + ASISTENCIA */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <h3 className="text-white font-bold">
                    Estado de suscripciones
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Distribución actual de miembros
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/subscriptions'
                    )
                  }
                  className="text-[#00ff88] text-sm hover:underline"
                >
                  Ver todas
                </button>

              </div>


              {
                totalSubscriptions ===
                0
                  ? (

                    <div className="flex flex-col items-center justify-center py-10">

                      <CircleDot
                        size={44}
                        className="text-gray-700 mb-3"
                      />

                      <p className="text-gray-400">
                        No hay suscripciones registradas
                      </p>

                    </div>

                  )
                  : (

                    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">

                      <DonutChart
                        data={
                          subscriptionData
                        }
                        total={
                          totalSubscriptions
                        }
                        label="miembros"
                      />


                      <div className="space-y-3">

                        {
                          subscriptionData.map(
                            item => (

                              <div
                                key={
                                  item.label
                                }
                                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#171717] transition-colors"
                              >

                                <div className="flex items-center gap-2">

                                  <span
                                    className={`
                                      w-2
                                      h-2
                                      rounded-full

                                      ${
                                        item.label ===
                                          'Activas'
                                          ? 'bg-[#00ff88]'
                                          : item.label ===
                                            'Por vencer'
                                            ? 'bg-yellow-500'
                                            : item.label ===
                                              'Vencidas'
                                              ? 'bg-red-500'
                                              : 'bg-gray-500'
                                      }
                                    `}
                                  />


                                  <span className="text-gray-400 text-sm">
                                    {item.label}
                                  </span>

                                </div>


                                <span className="text-white font-bold">
                                  {item.value}
                                </span>

                              </div>

                            )
                          )
                        }

                      </div>

                    </div>

                  )
              }

            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <h3 className="text-white font-bold">
                    Asistencia semanal
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Accesos registrados por día
                  </p>

                </div>


                <span className="bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs">
                  Esta semana
                </span>

              </div>


              <div className="h-64">

                <div className="flex h-full items-end gap-2">

                  {
                    weeklyAttendance.map(
                      item => {

                        const percentage =
                          item.value >
                          0
                            ? Math.max(
                                8,
                                (
                                  item.value /
                                  maxWeeklyAttendance
                                ) *
                                85
                              )
                            : 2;


                        return (

                          <div
                            key={
                              item.day
                            }
                            className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                          >

                            <span className="text-[#00ff88] text-xs font-medium">
                              {item.value}
                            </span>


                            <div
                              className="w-full bg-[#171717] rounded-t-xl overflow-hidden"
                              style={{
                                height:
                                  `${percentage}%`
                              }}
                            >

                              <div
                                className={`
                                  w-full
                                  h-full
                                  rounded-t-xl

                                  ${
                                    item.value >
                                    0
                                      ? 'bg-gradient-to-t from-[#00ff88]/15 to-[#00ff88]/55'
                                      : 'bg-[#1a1a1a]'
                                  }
                                `}
                              />

                            </div>


                            <span className="text-gray-500 text-xs">
                              {item.day}
                            </span>

                          </div>

                        );

                      }
                    )
                  }

                </div>

              </div>


              <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex justify-between items-center">

                <div>

                  <p className="text-gray-500 text-xs">
                    Total esta semana
                  </p>

                  <p className="text-white font-bold text-xl">
                    {totalWeeklyAttendance}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/attendance'
                    )
                  }
                  className="text-[#00ff88] text-sm hover:underline flex items-center gap-1"
                >
                  Ver detalles
                  <ArrowRight size={14} />
                </button>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* AFLUENCIA */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

              <div>

                <h3 className="text-white font-bold">
                  Horas con mayor afluencia
                </h3>

                <p className="text-gray-500 text-sm mt-1">
                  Identifica los horarios de mayor carga
                </p>

              </div>


              <div className="flex items-center gap-2 px-3 py-2 bg-[#171717] border border-[#242424] rounded-xl">

                <Activity
                  size={15}
                  className="text-[#00ff88]"
                />

                <span className="text-gray-400 text-xs">
                  Hora pico:
                </span>

                <span className="text-white text-xs font-semibold">
                  {
                    busiestHour
                      ? `${busiestHour.hour} · ${busiestHour.people}`
                      : 'Sin datos'
                  }
                </span>

              </div>

            </div>


            <div className="space-y-3">

              {
                peakHours.map(
                  item => {

                    const percentage =
                      item.people >
                      0
                        ? Math.max(
                            4,
                            (
                              item.people /
                              maxPeak
                            ) *
                            100
                          )
                        : 0;


                    return (

                      <div
                        key={
                          item.hour
                        }
                        className="flex items-center gap-4"
                      >

                        <span className="text-gray-500 text-xs w-20">
                          {item.hour}
                        </span>


                        <div className="flex-1 h-8 bg-[#171717] rounded-lg overflow-hidden">

                          <div
                            className="h-full bg-gradient-to-r from-[#00ff88]/15 to-[#00ff88]/50 rounded-lg transition-all duration-500"
                            style={{
                              width:
                                `${percentage}%`
                            }}
                          />

                        </div>


                        <span className="text-gray-400 text-xs w-20 text-right">
                          {item.people} accesos
                        </span>

                      </div>

                    );

                  }
                )
              }

            </div>

          </div>


          {/* ================================================= */}
          {/* ACTIVIDAD + VENCIMIENTOS */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            <div className="xl:col-span-2 bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6">

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h3 className="text-white font-bold">
                    Actividad reciente
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Últimos movimientos registrados
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/attendance'
                    )
                  }
                  className="text-[#00ff88] text-sm hover:underline flex items-center gap-1"
                >
                  <Eye size={16} />
                  Ver historial
                </button>

              </div>


              {
                activities.length ===
                0
                  ? (

                    <div className="text-center py-12">

                      <CircleDot
                        size={44}
                        className="text-gray-700 mx-auto mb-3"
                      />

                      <p className="text-gray-400">
                        No hay actividad reciente
                      </p>

                    </div>

                  )
                  : (

                    <ActivityTable
                      activities={
                        activities
                      }
                      onMemberClick={
                        member =>
                          navigate(
                            `/members/${member.id}`
                          )
                      }
                    />

                  )
              }

            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6">

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h3 className="text-white font-bold">
                    Próximas a vencer
                  </h3>

                  <p className="text-gray-500 text-xs mt-1">
                    Próximos {warningDays} días
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/subscriptions'
                    )
                  }
                  className="text-[#00ff88] text-sm hover:underline"
                >
                  Ver todas
                </button>

              </div>


              {
                upcomingExpirations.length ===
                0
                  ? (

                    <div className="text-center py-8">

                      <Sparkles
                        size={34}
                        className="text-[#00ff88]/40 mx-auto mb-3"
                      />

                      <p className="text-gray-400 text-sm">
                        Todo está al día
                      </p>

                      <p className="text-gray-600 text-xs mt-1">
                        No hay vencimientos próximos.
                      </p>

                    </div>

                  )
                  : (

                    <div className="space-y-3">

                      {
                        upcomingExpirations.map(
                          member => (

                            <button
                              type="button"
                              key={
                                member.id
                              }
                              onClick={() =>
                                navigate(
                                  `/members/${member.id}`
                                )
                              }
                              className="w-full p-3 bg-[#171717] border border-[#242424] rounded-xl hover:border-yellow-500/40 transition-colors text-left"
                            >

                              <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-[#111111] overflow-hidden flex items-center justify-center shrink-0">

                                  {
                                    member.photo
                                      ? (

                                        <img
                                          src={
                                            member.photo
                                          }
                                          alt={
                                            member.name
                                          }
                                          className="w-full h-full object-cover"
                                        />

                                      )
                                      : (

                                        <Users
                                          size={18}
                                          className="text-gray-500"
                                        />

                                      )
                                  }

                                </div>


                                <div className="flex-1 min-w-0">

                                  <p className="text-white text-sm font-medium truncate">
                                    {member.name}
                                  </p>

                                  <p className="text-gray-600 text-xs mt-0.5">
                                    {
                                      formatShortDate(
                                        member.endDate
                                      )
                                    }
                                  </p>

                                </div>


                                <div className="text-right">

                                  <p className="text-yellow-400 font-bold text-sm">
                                    {
                                      member.days ===
                                      0
                                        ? 'Hoy'
                                        : `${member.days}d`
                                    }
                                  </p>

                                  <p className="text-gray-600 text-[10px]">
                                    restantes
                                  </p>

                                </div>

                              </div>

                            </button>

                          )
                        )
                      }

                    </div>

                  )
              }

            </div>

          </div>


          {/* ================================================= */}
          {/* RETENCIÓN DE MIEMBROS */}
          {/* ================================================= */}

          <RetentionPanel
            members={members}
            attendance={attendance}
          />


          {/* ================================================= */}
          {/* ESTADO SISTEMA */}
          {/* ================================================= */}

          <div className="bg-[#101010] border border-[#1d1d1d] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">

            <div className="flex items-center gap-3">

              <div className="w-2.5 h-2.5 bg-[#00ff88] rounded-full animate-pulse" />

              <div>

                <span className="text-white text-sm font-medium">
                  Sistema operativo
                </span>

                <span className="text-gray-600 text-xs ml-2">
                  Datos sincronizados localmente
                </span>

              </div>

            </div>


            <span className="text-gray-600 text-[10px]">
              Última actualización:{' '}
              {
                lastUpdated.toLocaleTimeString(
                  'es-MX',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }
                )
              }
            </span>

          </div>

        </main>

      </div>

    </div>

  );

};


export default DashboardPage;