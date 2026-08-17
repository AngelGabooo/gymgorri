// src/components/Reports/ReportsPage.jsx

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
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  UserX,
  CreditCard,
  FileText,
  X,
  Activity,
  UserPlus,
  CalendarDays,
  Zap,
  Sun,
  Moon,
  AlertCircle,
  ShoppingCart,
  WalletCards,
  ShieldAlert,
  Ban,
  PackageSearch,
  Receipt
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import ReportStatCard from './Cards/ReportStatCard';

import {
  getStoredMembers
} from '../../utils/memberId';

import {
  getSales
} from '../../services/salesService';

import {
  getStoredVisits,
  getVisitAttendance
} from '../../utils/visitsStorage';


// ======================================================
// STORAGE
// ======================================================

const ATTENDANCE_KEY =
  'gym_control_attendance';

const PAYMENTS_KEY =
  'gym_control_payments';

const SUBSCRIPTION_HISTORY_KEY =
  'gym_control_subscription_history';

const CASH_SHIFTS_KEY =
  'gym_control_cash_shifts';

const CASH_MOVEMENTS_KEY =
  'gym_control_cash_movements';

const ACCESS_LOGS_KEY =
  'gym_control_access_logs';

const BLACKLIST_KEY =
  'gym_control_blacklist';

const ADMIN_SECURITY_AUDIT_KEY =
  'gym_control_admin_security_audit';


// ======================================================
// MESES
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
// LEER LOCALSTORAGE
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
      .split(/\s+/);

  if (
    parts.length !==
    3
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
    day
  );

};


// ======================================================
// FORMATEAR DINERO
// ======================================================

const formatMoney = (
  value
) => {

  return `$${Number(
    value || 0
  ).toLocaleString(
    'es-MX',
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2
    }
  )}`;

};


// ======================================================
// FORMATEAR DURACIÓN
// ======================================================

const formatDuration = (
  minutes
) => {

  const value =
    Number(
      minutes || 0
    );

  const hours =
    Math.floor(
      value / 60
    );

  const mins =
    value % 60;

  return `${hours}h ${mins}min`;

};


// ======================================================
// RANGO SEGÚN PERIODO
// ======================================================

const getPeriodRange = (
  period
) => {

  const now =
    new Date();

  const end =
    new Date(
      now
    );

  end.setHours(
    23,
    59,
    59,
    999
  );

  const start =
    new Date(
      now
    );

  start.setHours(
    0,
    0,
    0,
    0
  );


  if (
    period ===
    'Hoy'
  ) {

    return {
      start,
      end
    };

  }


  if (
    period ===
    'Ayer'
  ) {

    start.setDate(
      start.getDate() -
      1
    );

    end.setDate(
      end.getDate() -
      1
    );

    return {
      start,
      end
    };

  }


  if (
    period ===
    '7 días'
  ) {

    start.setDate(
      start.getDate() -
      6
    );

    return {
      start,
      end
    };

  }


  if (
    period ===
    '30 días'
  ) {

    start.setDate(
      start.getDate() -
      29
    );

    return {
      start,
      end
    };

  }


  if (
    period ===
    'Mes anterior'
  ) {

    const previousMonthStart =
      new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

    const previousMonthEnd =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999
      );

    return {
      start:
        previousMonthStart,

      end:
        previousMonthEnd
    };

  }


  // Este mes
  return {

    start:
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ),

    end

  };

};


// ======================================================
// EN PERIODO
// ======================================================

const isInPeriod = (
  value,
  range
) => {

  const date =
    parseGymDate(
      value
    );

  if (!date) {
    return false;
  }

  return (
    date >=
      range.start &&
    date <=
      range.end
  );

};


// ======================================================
// DÍAS RESTANTES
// ======================================================

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
      expiration -
      today
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
// ESTADO SUSCRIPCIÓN
// ======================================================

const getSubscriptionState = (
  member
) => {

  if (
    member?.status ===
      'inactive' ||
    member?.accessBlocked ===
      true
  ) {
    return 'blocked';
  }

  if (
    !member?.subscription
  ) {
    return 'none';
  }

  const remaining =
    getDaysRemaining(
      member.subscription.endDate
    );

  if (
    remaining ===
    null
  ) {

    return member.subscription.status ===
      'active'
      ? 'active'
      : 'none';

  }

  if (
    remaining <
    0
  ) {
    return 'expired';
  }

  if (
    remaining <=
    5
  ) {
    return 'expiring';
  }

  return 'active';

};


// ======================================================
// REPORTS PAGE
// ======================================================

const ReportsPage = () => {

  const navigate =
    useNavigate();


  const [
    activeTab,
    setActiveTab
  ] = useState(
    'resumen'
  );


  const [
    period,
    setPeriod
  ] = useState(
    'Este mes'
  );


  const [
    comparison,
    setComparison
  ] = useState(
    'Periodo anterior'
  );


  const [
    showExportModal,
    setShowExportModal
  ] = useState(false);


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
    subscriptionHistory,
    setSubscriptionHistory
  ] = useState([]);

  const [
    sales,
    setSales
  ] = useState([]);

  const [
    registeredVisits,
    setRegisteredVisits
  ] = useState([]);


  const [
    visitAttendance,
    setVisitAttendance
  ] = useState([]);

  const [
    cashShifts,
    setCashShifts
  ] = useState([]);

  const [
    cashMovements,
    setCashMovements
  ] = useState([]);

  const [
    accessLogs,
    setAccessLogs
  ] = useState([]);

  const [
    blacklist,
    setBlacklist
  ] = useState([]);

  const [
    adminSecurityAudit,
    setAdminSecurityAudit
  ] = useState([]);


  // ======================================================
  // CARGAR DATOS
  // ======================================================

  const loadData =
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

      setSubscriptionHistory(
        readLocalArray(
          SUBSCRIPTION_HISTORY_KEY
        )
      );

      setSales(
        getSales()
      );

      setRegisteredVisits(
        getStoredVisits()
      );


      setVisitAttendance(
        getVisitAttendance()
      );

      setCashShifts(
        readLocalArray(
          CASH_SHIFTS_KEY
        )
      );

      setCashMovements(
        readLocalArray(
          CASH_MOVEMENTS_KEY
        )
      );

      setAccessLogs(
        readLocalArray(
          ACCESS_LOGS_KEY
        )
      );

      setBlacklist(
        readLocalArray(
          BLACKLIST_KEY
        )
      );

      setAdminSecurityAudit(
        readLocalArray(
          ADMIN_SECURITY_AUDIT_KEY
        )
      );

  };


  useEffect(
    () => {

      loadData();

      const handleUpdate =
        () => {

          loadData();

        };

      window.addEventListener(
        'storage',
        handleUpdate
      );

      window.addEventListener(
        'gym-storage-update',
        handleUpdate
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

      };

    },
    []
  );


  // ======================================================
  // RANGO
  // ======================================================

  const range =
    useMemo(
      () =>
        getPeriodRange(
          period
        ),
      [period]
    );


  // ======================================================
  // DATOS FILTRADOS
  // ======================================================

  const periodAttendance =
    useMemo(
      () => {

        return attendance.filter(
          item =>
            isInPeriod(
              item.entryAt ||
              item.createdAt,
              range
            )
        );

      },
      [
        attendance,
        range
      ]
    );


  const periodPayments =
    useMemo(
      () => {

        return payments.filter(
          item =>
            item.status !==
              'cancelled' &&
            isInPeriod(
              item.createdAt ||
              item.date,
              range
            )
        );

      },
      [
        payments,
        range
      ]
    );



  const periodProductSales =
    useMemo(
      () => {

        return sales
          .filter(
            sale =>
              sale.status !==
                'cancelled' &&
              isInPeriod(
                sale.createdAt,
                range
              )
          );

      },
      [
        range,
        sales
      ]
    );


  const productSalesIncome =
    periodProductSales.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.total ||
          0
        ),
      0
    );


  const productSalesProfit =
    periodProductSales.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.estimatedProfit ||
          0
        ),
      0
    );


  const renewalEvents =
    useMemo(
      () => {

        const map =
          new Map();


        subscriptionHistory
          .filter(
            item =>
              item.type ===
              'renewal'
          )
          .forEach(
            item => {

              const key =
                `${item.memberId || 'member'}-${item.createdAt || item.date || item.id}`;


              map.set(
                key,
                {
                  ...item,
                  source:
                    'subscription_history'
                }
              );

            }
          );


        payments
          .filter(
            item =>
              item.type ===
                'subscription_renewal' ||
              String(
                item.concept ||
                ''
              )
                .toLowerCase()
                .includes(
                  'renovación'
                ) ||
              String(
                item.concept ||
                ''
              )
                .toLowerCase()
                .includes(
                  'renovacion'
                )
          )
          .forEach(
            item => {

              const key =
                `${item.memberId || 'member'}-${item.createdAt || item.date || item.id}`;


              if (
                !map.has(
                  key
                )
              ) {

                map.set(
                  key,
                  {
                    ...item,
                    source:
                      'payments'
                  }
                );

              }

            }
          );


        return Array.from(
          map.values()
        );

      },
      [
        subscriptionHistory,
        payments
      ]
    );


  const periodRenewals =
    useMemo(
      () => {

        return renewalEvents.filter(
          item =>
            isInPeriod(
              item.createdAt ||
              item.date,
              range
            )
        );

      },
      [
        renewalEvents,
        range
      ]
    );


  // ======================================================
  // VISITAS
  // ======================================================

  const periodVisitAttendance =
    useMemo(
      () =>
        visitAttendance.filter(
          item =>
            isInPeriod(
              item.entryAt ||
              item.createdAt,
              range
            )
        ),
      [
        visitAttendance,
        range
      ]
    );


  const periodRegisteredVisits =
    useMemo(
      () =>
        registeredVisits.filter(
          visit =>
            isInPeriod(
              visit.createdAt ||
              visit.registeredAt ||
              visit.date ||
              visit.startDate,
              range
            )
        ),
      [
        registeredVisits,
        range
      ]
    );


  // ======================================================
  // CAJA
  // ======================================================

  const periodCashShifts =
    cashShifts.filter(
      shift =>
        isInPeriod(
          shift.closedAt ||
          shift.openedAt,
          range
        )
    );


  const closedCashShifts =
    periodCashShifts.filter(
      shift =>
        shift.status ===
        'closed'
    );


  const openCashShifts =
    cashShifts.filter(
      shift =>
        shift.status ===
        'open'
    );


  const periodCashMovements =
    cashMovements.filter(
      item =>
        isInPeriod(
          item.createdAt,
          range
        )
    );


  const getCashMovementTotal =
    type =>
      periodCashMovements
        .filter(
          item =>
            item.type ===
            type
        )
        .reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.amount ||
              0
            ),
          0
        );


  const cashExpenses =
    getCashMovementTotal(
      'expense'
    );


  const cashWithdrawals =
    getCashMovementTotal(
      'withdrawal'
    );


  const cashOtherIncome =
    getCashMovementTotal(
      'other_income'
    );


  const cashDifferenceTotal =
    closedCashShifts.reduce(
      (
        total,
        shift
      ) =>
        total +
        Number(
          shift.difference ||
          0
        ),
      0
    );


  const cashExpectedTotal =
    closedCashShifts.reduce(
      (
        total,
        shift
      ) =>
        total +
        Number(
          shift.expectedCash ||
          shift.closeSnapshot?.expectedCash ||
          0
        ),
      0
    );


  const cashCountedTotal =
    closedCashShifts.reduce(
      (
        total,
        shift
      ) =>
        total +
        Number(
          shift.countedCash ||
          0
        ),
      0
    );


  // ======================================================
  // SEGURIDAD
  // ======================================================

  const periodAccessLogs =
    accessLogs.filter(
      item =>
        isInPeriod(
          item.createdAt,
          range
        )
    );


  const allowedAccesses =
    periodAccessLogs.filter(
      item =>
        item.result ===
        'allowed'
    );


  const deniedAccesses =
    periodAccessLogs.filter(
      item =>
        item.result ===
        'denied'
    );


  const faceMismatchAttempts =
    deniedAccesses.filter(
      item =>
        item.reason ===
        'FACE_MISMATCH'
    );


  const activeBlacklist =
    blacklist.filter(
      item =>
        item.active !==
        false
    );


  const periodAdminAudit =
    adminSecurityAudit.filter(
      item =>
        isInPeriod(
          item.createdAt,
          range
        )
    );


  const deniedAdminActions =
    periodAdminAudit.filter(
      item =>
        item.result ===
        'denied'
    );


  // ======================================================
  // VENTAS
  // ======================================================

  const productUnitsSold =
    periodProductSales.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.itemCount ||
          0
        ),
      0
    );


  const averageSaleTicket =
    periodProductSales.length >
    0
      ? productSalesIncome /
        periodProductSales.length
      : 0;


  const productSalesMap = {};


  periodProductSales.forEach(
    sale => {

      (
        Array.isArray(
          sale.items
        )
          ? sale.items
          : []
      ).forEach(
        item => {

          const key =
            item.productId ||
            item.name ||
            'producto';


          if (
            !productSalesMap[
              key
            ]
          ) {

            productSalesMap[
              key
            ] = {
              name:
                item.name ||
                'Producto',

              quantity:
                0,

              revenue:
                0
            };

          }


          productSalesMap[
            key
          ].quantity +=
            Number(
              item.quantity ||
              0
            );


          productSalesMap[
            key
          ].revenue +=
            Number(
              item.subtotal ||
              0
            );

        }
      );

    }
  );


  const topProducts =
    Object.values(
      productSalesMap
    )
      .sort(
        (
          a,
          b
        ) =>
          b.quantity -
          a.quantity
      )
      .slice(
        0,
        8
      );


  // ======================================================
  // ESTADÍSTICAS GENERALES
  // ======================================================

  const subscriptionStats =
    useMemo(
      () => {

        const stats = {
          active: 0,
          expiring: 0,
          expired: 0,
          none: 0,
          blocked: 0
        };


        members.forEach(
          member => {

            const state =
              getSubscriptionState(
                member
              );

            stats[state] +=
              1;

          }
        );


        return stats;

      },
      [members]
    );


  const uniqueMemberIds =
    useMemo(
      () => {

        return new Set(
          periodAttendance.map(
            item =>
              item.memberId
          )
        );

      },
      [periodAttendance]
    );


  const totalIncome =
    periodPayments.reduce(
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


  const businessIncome =
    totalIncome +
    productSalesIncome +
    cashOtherIncome;


  const activeMembers =
    subscriptionStats.active +
    subscriptionStats.expiring;


  const stats = {

    activeMembers,

    attendances:
      periodAttendance.length,

    uniqueMembers:
      uniqueMemberIds.size,

    visits:
      periodRegisteredVisits.length,

    visitAccesses:
      periodVisitAttendance.length,

    renewals:
      periodRenewals.length,

    income:
      businessIncome

  };


  // ======================================================
  // HOY
  // ======================================================

  const todayRange =
    getPeriodRange(
      'Hoy'
    );


  const todayAttendance =
    attendance.filter(
      item =>
        isInPeriod(
          item.entryAt,
          todayRange
        )
    );


  const todayEntries =
    todayAttendance.length;


  const todayExits =
    attendance.filter(
      item =>
        item.exitAt &&
        isInPeriod(
          item.exitAt,
          todayRange
        )
    ).length;


  const insideNow =
    attendance.filter(
      item =>
        item.status ===
          'inside' &&
        !item.exitAt
    ).length;


  // ======================================================
  // HORA PICO
  // ======================================================

  const peakHourData =
    useMemo(
      () => {

        const buckets =
          Array.from(
            {
              length:
                24
            },
            () => 0
          );


        periodAttendance.forEach(
          item => {

            const date =
              parseGymDate(
                item.entryAt
              );

            if (
              date
            ) {

              buckets[
                date.getHours()
              ] += 1;

            }

          }
        );


        const max =
          Math.max(
            ...buckets
          );


        if (
          max ===
          0
        ) {

          return {
            hour:
              null,
            count:
              0
          };

        }


        const hour =
          buckets.indexOf(
            max
          );


        return {
          hour,
          count:
            max
        };

      },
      [periodAttendance]
    );


  const peakHourLabel =
    peakHourData.hour ===
    null
      ? 'Sin datos'
      : `${String(
          peakHourData.hour
        ).padStart(
          2,
          '0'
        )}:00`;


  // ======================================================
  // DÍA DE SEMANA
  // ======================================================

  const weekdayData =
    useMemo(
      () => {

        const labels = [
          'Domingo',
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado'
        ];


        return labels.map(
          (
            label,
            index
          ) => {

            const count =
              periodAttendance.filter(
                item => {

                  const date =
                    parseGymDate(
                      item.entryAt
                    );

                  return (
                    date &&
                    date.getDay() ===
                      index
                  );

                }
              ).length;


            return {
              label,
              count
            };

          }
        );

      },
      [periodAttendance]
    );


  const maxWeekday =
    Math.max(
      1,
      ...weekdayData.map(
        item =>
          item.count
      )
    );


  const busiestDay =
    [...weekdayData]
      .sort(
        (
          a,
          b
        ) =>
          b.count -
          a.count
      )[0];


  // ======================================================
  // DISTRIBUCIÓN HORARIA
  // ======================================================

  const timeDistribution =
    useMemo(
      () => {

        const result = {
          morning: 0,
          afternoon: 0,
          night: 0
        };


        periodAttendance.forEach(
          item => {

            const date =
              parseGymDate(
                item.entryAt
              );

            if (!date) {
              return;
            }

            const hour =
              date.getHours();

            if (
              hour <
              12
            ) {

              result.morning +=
                1;

            } else if (
              hour <
              18
            ) {

              result.afternoon +=
                1;

            } else {

              result.night +=
                1;

            }

          }
        );


        const total =
          periodAttendance.length ||
          1;


        return {

          morning:
            Math.round(
              result.morning /
              total *
              100
            ),

          afternoon:
            Math.round(
              result.afternoon /
              total *
              100
            ),

          night:
            Math.round(
              result.night /
              total *
              100
            )

        };

      },
      [periodAttendance]
    );


  // ======================================================
  // DURACIÓN PROMEDIO
  // ======================================================

  const completedAttendance =
    periodAttendance.filter(
      item =>
        item.exitAt ||
        item.durationMinutes
    );


  const averageDuration =
    completedAttendance.length >
    0
      ? Math.round(
          completedAttendance.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.durationMinutes ||
                0
              ),
            0
          ) /
          completedAttendance.length
        )
      : 0;


  // ======================================================
  // RANGOS DE PERMANENCIA
  // ======================================================

  const durationRanges =
    useMemo(
      () => {

        const ranges = [
          {
            label:
              'Menos de 30 min',
            min:
              0,
            max:
              29
          },
          {
            label:
              '30–60 min',
            min:
              30,
            max:
              60
          },
          {
            label:
              '1–1.5 h',
            min:
              61,
            max:
              90
          },
          {
            label:
              '1.5–2 h',
            min:
              91,
            max:
              120
          },
          {
            label:
              'Más de 2 h',
            min:
              121,
            max:
              Infinity
          }
        ];


        const total =
          completedAttendance.length ||
          1;


        return ranges.map(
          rangeItem => {

            const count =
              completedAttendance.filter(
                item => {

                  const minutes =
                    Number(
                      item.durationMinutes ||
                      0
                    );

                  return (
                    minutes >=
                      rangeItem.min &&
                    minutes <=
                      rangeItem.max
                  );

                }
              ).length;


            return {

              ...rangeItem,

              count,

              percentage:
                Math.round(
                  count /
                  total *
                  100
                )

            };

          }
        );

      },
      [completedAttendance]
    );


  // ======================================================
  // MIEMBROS FRECUENTES
  // ======================================================

  const frequentMembers =
    useMemo(
      () => {

        const countMap = {};


        periodAttendance.forEach(
          item => {

            if (
              !item.memberId
            ) {
              return;
            }

            countMap[
              item.memberId
            ] =
              (
                countMap[
                  item.memberId
                ] ||
                0
              ) +
              1;

          }
        );


        return Object.entries(
          countMap
        )
          .map(
            (
              [
                memberId,
                count
              ]
            ) => {

              const member =
                members.find(
                  item =>
                    item.id ===
                    memberId
                );


              return {

                memberId,

                count,

                name:
                  `${member?.firstName || ''} ${member?.lastName || ''}`
                    .trim() ||
                  memberId

              };

            }
          )
          .sort(
            (
              a,
              b
            ) =>
              b.count -
              a.count
          )
          .slice(
            0,
            5
          );

      },
      [
        periodAttendance,
        members
      ]
    );


  // ======================================================
  // PAGOS POR MÉTODO
  // ======================================================

  const paymentMethodData =
    useMemo(
      () => {

        const methods = [
          'efectivo',
          'transferencia',
          'tarjeta',
          'otro'
        ];


        return methods.map(
          method => {

            const total =
              periodPayments
                .filter(
                  item => {

                    const current =
                      item.paymentMethod ||
                      item.method ||
                      'otro';

                    if (
                      method ===
                      'otro'
                    ) {

                      return ![
                        'efectivo',
                        'transferencia',
                        'tarjeta'
                      ].includes(
                        current
                      );

                    }

                    return (
                      current ===
                      method
                    );

                  }
                )
                .reduce(
                  (
                    sum,
                    item
                  ) =>
                    sum +
                    Number(
                      item.amount ||
                      0
                    ),
                  0
                );


            return {
              method,
              total
            };

          }
        );

      },
      [periodPayments]
    );


  const maxPaymentMethod =
    Math.max(
      1,
      ...paymentMethodData.map(
        item =>
          item.total
      )
    );


  // ======================================================
  // PAGOS POR DÍA
  // ======================================================

  const incomeByDay =
    useMemo(
      () => {

        const map = {};


        periodPayments.forEach(
          payment => {

            const date =
              parseGymDate(
                payment.createdAt ||
                payment.date
              );

            if (!date) {
              return;
            }

            const key =
              date.toISOString()
                .slice(
                  0,
                  10
                );

            map[key] =
              (
                map[key] ||
                0
              ) +
              Number(
                payment.amount ||
                0
              );

          }
        );


        return Object.entries(
          map
        )
          .map(
            (
              [
                date,
                total
              ]
            ) => ({
              date,
              total
            })
          )
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                a.date
              ) -
              new Date(
                b.date
              )
          );

      },
      [periodPayments]
    );


  const maxIncomeDay =
    Math.max(
      1,
      ...incomeByDay.map(
        item =>
          item.total
      )
    );


  // ======================================================
  // ALTAS DE MIEMBROS
  // ======================================================

  const newMembers =
    members.filter(
      member =>
        isInPeriod(
          member.registrationDate ||
          member.createdAt,
          range
        )
    ).length;


  // ======================================================
  // ACTIVIDAD POR MIEMBRO
  // ======================================================

  const memberActivity =
    useMemo(
      () => {

        const counts = {};

        attendance.forEach(
          item => {

            counts[
              item.memberId
            ] =
              (
                counts[
                  item.memberId
                ] ||
                0
              ) +
              1;

          }
        );


        const categories = [
          {
            label:
              'Muy activos (20+)',
            min:
              20,
            max:
              Infinity
          },
          {
            label:
              'Activos (12-19)',
            min:
              12,
            max:
              19
          },
          {
            label:
              'Poco activos (6-11)',
            min:
              6,
            max:
              11
          },
          {
            label:
              'Baja frecuencia (1-5)',
            min:
              1,
            max:
              5
          },
          {
            label:
              'Sin actividad (0)',
            min:
              0,
            max:
              0
          }
        ];


        return categories.map(
          category => {

            const count =
              members.filter(
                member => {

                  const value =
                    counts[
                      member.id
                    ] ||
                    0;

                  return (
                    value >=
                      category.min &&
                    value <=
                      category.max
                  );

                }
              ).length;


            return {
              ...category,
              count
            };

          }
        );

      },
      [
        members,
        attendance
      ]
    );


  const maxMemberActivity =
    Math.max(
      1,
      ...memberActivity.map(
        item =>
          item.count
      )
    );


  // ======================================================
  // ACTIVOS SIN ASISTENCIA 14 DÍAS
  // ======================================================

  const inactiveActiveMembers =
    useMemo(
      () => {

        const cutoff =
          new Date();

        cutoff.setDate(
          cutoff.getDate() -
          14
        );


        return members.filter(
          member => {

            const state =
              getSubscriptionState(
                member
              );


            if (
              ![
                'active',
                'expiring'
              ].includes(
                state
              )
            ) {

              return false;

            }


            const records =
              attendance
                .filter(
                  item =>
                    item.memberId ===
                    member.id
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    new Date(
                      b.entryAt
                    ) -
                    new Date(
                      a.entryAt
                    )
                );


            if (
              records.length ===
              0
            ) {

              return true;

            }


            const last =
              parseGymDate(
                records[0].entryAt
              );


            return (
              !last ||
              last <
                cutoff
            );

          }
        );

      },
      [
        members,
        attendance
      ]
    );


  // ======================================================
  // RENOVACIÓN %
  // ======================================================

  const renewalRate =
    members.length >
    0
      ? Math.round(
          periodRenewals.length /
          members.length *
          100
        )
      : 0;


  // ======================================================
  // VENCIMIENTOS
  // ======================================================

  const expirations = {

    7:
      members.filter(
        member => {

          const remaining =
            getDaysRemaining(
              member.subscription
                ?.endDate
            );

          return (
            remaining !==
              null &&
            remaining >=
              0 &&
            remaining <=
              7
          );

        }
      ).length,

    15:
      members.filter(
        member => {

          const remaining =
            getDaysRemaining(
              member.subscription
                ?.endDate
            );

          return (
            remaining !==
              null &&
            remaining >=
              0 &&
            remaining <=
              15
          );

        }
      ).length,

    30:
      members.filter(
        member => {

          const remaining =
            getDaysRemaining(
              member.subscription
                ?.endDate
            );

          return (
            remaining !==
              null &&
            remaining >=
              0 &&
            remaining <=
              30
          );

        }
      ).length

  };


  // ======================================================
  // PROMEDIOS
  // ======================================================

  const periodDays =
    Math.max(
      1,
      Math.ceil(
        (
          range.end -
          range.start
        ) /
        86400000
      ) +
      1
    );


  const attendanceDailyAverage =
    (
      stats.attendances /
      periodDays
    ).toFixed(
      1
    );


  const incomeDailyAverage =
    businessIncome /
    periodDays;


  const averageTicket =
    periodPayments.length >
    0
      ? totalIncome /
        periodPayments.length
      : 0;


  // ======================================================
  // EXPORTAR CSV
  // ======================================================

  const exportCSV =
    () => {

      const rows = [
        [
          'Métrica',
          'Valor'
        ],
        [
          'Periodo',
          period
        ],
        [
          'Miembros activos',
          stats.activeMembers
        ],
        [
          'Asistencias',
          stats.attendances
        ],
        [
          'Miembros únicos',
          stats.uniqueMembers
        ],
        [
          'Renovaciones',
          stats.renewals
        ],
        [
          'Ingresos globales',
          stats.income
        ],
        [
          'Ingresos membresías',
          totalIncome
        ],
        [
          'Venta de productos',
          productSalesIncome
        ],
        [
          'Ganancia productos',
          productSalesProfit
        ],
        [
          'Productos vendidos',
          productUnitsSold
        ],
        [
          'Pases de visita registrados',
          periodRegisteredVisits.length
        ],
        [
          'Accesos de visita',
          periodVisitAttendance.length
        ],
        [
          'Turnos cerrados',
          closedCashShifts.length
        ],
        [
          'Gastos de caja',
          cashExpenses
        ],
        [
          'Retiros de caja',
          cashWithdrawals
        ],
        [
          'Diferencia de caja',
          cashDifferenceTotal
        ],
        [
          'Accesos bloqueados',
          deniedAccesses.length
        ],
        [
          'Rostros no coincidentes',
          faceMismatchAttempts.length
        ],
        [
          'Lista negra activa',
          activeBlacklist.length
        ],
        [
          'Dentro ahora',
          insideNow
        ]
      ];


      const csv =
        rows
          .map(
            row =>
              row
                .map(
                  value =>
                    `"${String(
                      value
                    ).replace(
                      /"/g,
                      '""'
                    )}"`
                )
                .join(',')
          )
          .join('\n');


      const blob =
        new Blob(
          [
            '\uFEFF',
            csv
          ],
          {
            type:
              'text/csv;charset=utf-8;'
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          'a'
        );


      link.href =
        url;

      link.download =
        `reporte-${period
          .toLowerCase()
          .replace(
            /\s+/g,
            '-'
          )}.csv`;

      link.click();

      URL.revokeObjectURL(
        url
      );

      setShowExportModal(
        false
      );

  };


  // ======================================================
  // TABS
  // ======================================================

  const tabs = [
    {
      id:
        'resumen',
      label:
        'Resumen general'
    },
    {
      id:
        'asistencias',
      label:
        'Asistencias'
    },
    {
      id:
        'suscripciones',
      label:
        'Suscripciones'
    },
    {
      id:
        'ingresos',
      label:
        'Ingresos'
    },
    {
      id:
        'ventas',
      label:
        'Ventas'
    },
    {
      id:
        'caja',
      label:
        'Caja'
    },
    {
      id:
        'seguridad',
      label:
        'Seguridad'
    },
    {
      id:
        'miembros',
      label:
        'Miembros'
    }
  ];


  const periods = [
    'Hoy',
    'Ayer',
    '7 días',
    '30 días',
    'Este mes',
    'Mes anterior'
  ];


  // ======================================================
  // RESUMEN
  // ======================================================

  const renderResumenTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">

          <ReportStatCard
            title="Miembros activos"
            value={
              stats.activeMembers
            }
            subtitle="Con suscripción activa"
            icon={
              Users
            }
            color="green"
          />

          <ReportStatCard
            title="Asistencias"
            value={
              stats.attendances
            }
            subtitle="Entradas registradas"
            icon={
              LogIn
            }
            color="green"
          />

          <ReportStatCard
            title="Miembros únicos"
            value={
              stats.uniqueMembers
            }
            subtitle="Personas diferentes"
            icon={
              UserCheck
            }
            color="blue"
          />

          <ReportStatCard
            title="Pases de visita"
            value={
              stats.visits
            }
            subtitle={`${stats.visitAccesses} accesos registrados`}
            icon={
              Calendar
            }
            color="yellow"
          />

          <ReportStatCard
            title="Renovaciones"
            value={
              stats.renewals
            }
            subtitle="Suscripciones renovadas"
            icon={
              TrendingUp
            }
            color="green"
          />

          <ReportStatCard
            title="Ingresos"
            value={`${formatMoney(
              stats.income
            )} MXN`}
            subtitle="Pagos registrados"
            icon={
              DollarSign
            }
            color="green"
          />

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Visitas del periodo
            </h3>

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-[#1a1a1a] rounded-xl p-4">

                <p className="text-gray-400 text-sm">
                  Pases registrados
                </p>

                <p className="text-white text-2xl font-black mt-1">
                  {periodRegisteredVisits.length}
                </p>

              </div>


              <div className="bg-[#1a1a1a] rounded-xl p-4">

                <p className="text-gray-400 text-sm">
                  Accesos de visita
                </p>

                <p className="text-[#00ff88] text-2xl font-black mt-1">
                  {periodVisitAttendance.length}
                </p>

              </div>

            </div>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Renovaciones del periodo
            </h3>

            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-gray-400 text-sm">
                  Renovaciones confirmadas
                </p>

                <p className="text-[#00ff88] text-3xl font-black mt-1">
                  {periodRenewals.length}
                </p>

              </div>

              <TrendingUp
                size={34}
                className="text-[#00ff88]"
              />

            </div>

          </div>

        </div>


        {/* INSIGHTS */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

          <h3 className="text-white font-bold mb-4">
            Resumen del periodo
          </h3>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                Mayor afluencia
              </p>
              <p className="text-white font-medium mt-1">
                {busiestDay?.count > 0
                  ? `${busiestDay.label} · ${busiestDay.count} entradas`
                  : 'Sin datos'}
              </p>
            </div>


            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                Horario más concurrido
              </p>
              <p className="text-yellow-500 font-medium mt-1">
                {peakHourLabel}
              </p>
            </div>


            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                Renovaciones
              </p>
              <p className="text-[#00ff88] font-medium mt-1">
                {stats.renewals}
              </p>
            </div>


            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                Ingresos
              </p>
              <p className="text-[#00ff88] font-medium mt-1">
                {formatMoney(
                  stats.income
                )}
              </p>
            </div>


            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                Oportunidad
              </p>
              <p className="text-yellow-500 font-medium mt-1">
                {inactiveActiveMembers.length} activos sin asistencia reciente
              </p>
            </div>

          </div>

        </div>


        {/* ACTIVIDAD HOY */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Actividad de hoy
            </h3>


            <div className="space-y-3">

              <div className="flex justify-between border-b border-[#1a1a1a] pb-2">
                <span className="text-gray-400">
                  Entradas
                </span>
                <span className="text-white font-bold">
                  {todayEntries}
                </span>
              </div>

              <div className="flex justify-between border-b border-[#1a1a1a] pb-2">
                <span className="text-gray-400">
                  Salidas
                </span>
                <span className="text-white font-bold">
                  {todayExits}
                </span>
              </div>

              <div className="flex justify-between border-b border-[#1a1a1a] pb-2">
                <span className="text-gray-400">
                  Dentro ahora
                </span>
                <span className="text-[#00ff88] font-bold">
                  {insideNow}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Hora más concurrida
                </span>
                <span className="text-yellow-500 font-bold">
                  {peakHourLabel}
                </span>
              </div>

            </div>

          </div>


          {/* DÍAS DE SEMANA */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Asistencia por día de la semana
            </h3>


            <div className="space-y-3">

              {weekdayData.map(
                item => {

                  const width =
                    item.count >
                    0
                      ? Math.max(
                          5,
                          item.count /
                          maxWeekday *
                          100
                        )
                      : 0;


                  return (

                    <div
                      key={
                        item.label
                      }
                      className="flex items-center gap-3"
                    >

                      <span className="text-gray-400 text-sm w-24">
                        {item.label}
                      </span>


                      <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">

                        <div
                          className="h-full bg-[#00ff88]/30 rounded-lg"
                          style={{
                            width:
                              `${width}%`
                          }}
                        />

                      </div>


                      <span className="text-gray-400 text-sm w-10 text-right">
                        {item.count}
                      </span>

                    </div>

                  );

                }
              )}

            </div>

          </div>

        </div>


        {/* SUSCRIPCIONES */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

          <h3 className="text-white font-bold mb-4">
            Estado de suscripciones
          </h3>


          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

            <div>
              <p className="text-gray-400 text-sm">
                Activas
              </p>
              <p className="text-[#00ff88] text-xl font-bold">
                {subscriptionStats.active}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                Por vencer
              </p>
              <p className="text-yellow-500 text-xl font-bold">
                {subscriptionStats.expiring}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                Vencidas
              </p>
              <p className="text-red-500 text-xl font-bold">
                {subscriptionStats.expired}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                Sin suscripción
              </p>
              <p className="text-gray-400 text-xl font-bold">
                {subscriptionStats.none}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                Bloqueadas
              </p>
              <p className="text-gray-500 text-xl font-bold">
                {subscriptionStats.blocked}
              </p>
            </div>

          </div>

        </div>

      </div>

    );


  // ======================================================
  // ASISTENCIAS
  // ======================================================

  const renderAsistenciasTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">

          <ReportStatCard
            title="Total de entradas"
            value={
              stats.attendances
            }
            icon={
              LogIn
            }
            color="green"
          />

          <ReportStatCard
            title="Miembros únicos"
            value={
              stats.uniqueMembers
            }
            icon={
              UserCheck
            }
            color="blue"
          />

          <ReportStatCard
            title="Promedio diario"
            value={
              attendanceDailyAverage
            }
            icon={
              Calendar
            }
            color="gray"
          />

          <ReportStatCard
            title="Duración promedio"
            value={
              formatDuration(
                averageDuration
              )
            }
            icon={
              Clock
            }
            color="gray"
          />

          <ReportStatCard
            title="Día más concurrido"
            value={
              busiestDay?.count >
              0
                ? busiestDay.label
                : 'Sin datos'
            }
            icon={
              TrendingUp
            }
            color="yellow"
          />

          <ReportStatCard
            title="Hora pico"
            value={
              peakHourLabel
            }
            icon={
              Zap
            }
            color="yellow"
          />

        </div>


        {/* HORARIOS */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Distribución por horario
            </h3>


            {[
              {
                label:
                  'Mañana',
                value:
                  timeDistribution.morning,
                icon:
                  Sun
              },
              {
                label:
                  'Tarde',
                value:
                  timeDistribution.afternoon,
                icon:
                  Activity
              },
              {
                label:
                  'Noche',
                value:
                  timeDistribution.night,
                icon:
                  Moon
              }
            ].map(
              item => {

                const Icon =
                  item.icon;


                return (

                  <div
                    key={
                      item.label
                    }
                    className="flex items-center gap-3 mb-3"
                  >

                    <div className="flex items-center gap-2 w-24">

                      <Icon
                        size={16}
                        className="text-[#00ff88]"
                      />


                      <span className="text-gray-400 text-sm">
                        {item.label}
                      </span>

                    </div>


                    <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">

                      <div
                        className="h-full bg-[#00ff88]/30 rounded-lg"
                        style={{
                          width:
                            `${item.value}%`
                        }}
                      />

                    </div>


                    <span className="text-gray-400 text-sm w-12 text-right">
                      {item.value}%
                    </span>

                  </div>

                );

              }
            )}

          </div>


          {/* PERMANENCIA */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Tiempo de permanencia
            </h3>


            {durationRanges.map(
              item => (

                <div
                  key={
                    item.label
                  }
                  className="flex items-center gap-3 mb-3"
                >

                  <span className="text-gray-400 text-sm w-28">
                    {item.label}
                  </span>


                  <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">

                    <div
                      className="h-full bg-[#00ff88]/30 rounded-lg"
                      style={{
                        width:
                          `${item.percentage}%`
                      }}
                    />

                  </div>


                  <span className="text-gray-400 text-sm w-12 text-right">
                    {item.percentage}%
                  </span>

                </div>

              )
            )}

          </div>

        </div>


        {/* FRECUENTES */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

          <div className="p-4 border-b border-[#1a1a1a]">

            <h3 className="text-white font-bold">
              Miembros con mayor asistencia
            </h3>

          </div>


          {frequentMembers.length ===
          0
            ? (

              <div className="text-center py-8">

                <Users
                  size={48}
                  className="text-gray-600 mx-auto mb-3"
                />

                <p className="text-gray-400">
                  Sin datos de miembros frecuentes
                </p>

              </div>

            )
            : (

              <div>

                {frequentMembers.map(
                  (
                    item,
                    index
                  ) => (

                    <button
                      type="button"
                      key={
                        item.memberId
                      }
                      onClick={() =>
                        navigate(
                          `/members/${item.memberId}`
                        )
                      }
                      className="w-full flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] last:border-0 hover:bg-[#151515]"
                    >

                      <div className="text-left">

                        <p className="text-white font-medium">
                          #{index + 1} {item.name}
                        </p>

                        <p className="text-gray-500 text-xs">
                          {item.memberId}
                        </p>

                      </div>


                      <span className="text-[#00ff88] font-bold">
                        {item.count} entradas
                      </span>

                    </button>

                  )
                )}

              </div>

            )}

        </div>

      </div>

    );


  // ======================================================
  // SUSCRIPCIONES
  // ======================================================

  const renderSuscripcionesTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <ReportStatCard
            title="Activas"
            value={
              subscriptionStats.active
            }
            icon={
              UserCheck
            }
            color="green"
          />

          <ReportStatCard
            title="Por vencer"
            value={
              subscriptionStats.expiring
            }
            icon={
              AlertCircle
            }
            color="yellow"
          />

          <ReportStatCard
            title="Vencidas"
            value={
              subscriptionStats.expired
            }
            icon={
              UserX
            }
            color="red"
          />

          <ReportStatCard
            title="Tasa de renovación"
            value={`${renewalRate}%`}
            icon={
              TrendingUp
            }
            color="gray"
          />

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Renovaciones del periodo
            </h3>


            <div className="text-center py-8">

              <TrendingUp
                size={48}
                className="text-[#00ff88] mx-auto mb-3"
              />


              <p className="text-3xl font-bold text-white">
                {stats.renewals}
              </p>


              <p className="text-gray-400 mt-1">
                renovaciones registradas
              </p>

            </div>


            {
              periodRenewals.length >
              0 &&
              (

                <div className="mt-4 border-t border-[#1a1a1a] pt-4 space-y-2 max-h-64 overflow-y-auto">

                  {
                    periodRenewals
                      .slice(
                        0,
                        8
                      )
                      .map(
                        renewal => (

                          <div
                            key={
                              renewal.id ||
                              `${renewal.memberId}-${renewal.createdAt || renewal.date}`
                            }
                            className="flex items-center justify-between gap-4 p-3 bg-[#1a1a1a] rounded-xl"
                          >

                            <div className="min-w-0">

                              <p className="text-white text-sm font-medium truncate">
                                {
                                  renewal.memberName ||
                                  renewal.memberId ||
                                  'Miembro'
                                }
                              </p>

                              <p className="text-gray-500 text-xs mt-1">
                                {
                                  renewal.subscription?.planLabel ||
                                  renewal.planLabel ||
                                  renewal.plan ||
                                  'Renovación'
                                }
                              </p>

                            </div>


                            <span className="text-[#00ff88] text-xs font-bold shrink-0">
                              RENOVADA
                            </span>

                          </div>

                        )
                      )
                  }

                </div>

              )
            }

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Vencimientos próximos
            </h3>


            <div className="space-y-3">

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Próximos 7 días
                </span>
                <span className="text-white font-bold">
                  {expirations[7]}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Próximos 15 días
                </span>
                <span className="text-white font-bold">
                  {expirations[15]}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Próximos 30 días
                </span>
                <span className="text-white font-bold">
                  {expirations[30]}
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>

    );


  // ======================================================
  // INGRESOS
  // ======================================================

  const renderIngresosTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <ReportStatCard
            title="Venta de productos"
            value={`${formatMoney(
              productSalesIncome
            )} MXN`}
            subtitle={`${periodProductSales.length} ventas`}
            icon={
              DollarSign
            }
            color="green"
          />

          <ReportStatCard
            title="Ganancia productos"
            value={`${formatMoney(
              productSalesProfit
            )} MXN`}
            subtitle="Estimación según costo"
            icon={
              TrendingUp
            }
            color="blue"
          />

          <ReportStatCard
            title="Ingresos globales"
            value={`${formatMoney(
              businessIncome
            )} MXN`}
            subtitle="Membresías + ventas + otros"
            icon={
              DollarSign
            }
            color="green"
          />

          <ReportStatCard
            title="Promedio diario"
            value={`${formatMoney(
              incomeDailyAverage
            )} MXN`}
            icon={
              Calendar
            }
            color="gray"
          />

          <ReportStatCard
            title="Ticket promedio"
            value={`${formatMoney(
              averageTicket
            )} MXN`}
            icon={
              FileText
            }
            color="gray"
          />

          <ReportStatCard
            title="Total de pagos"
            value={
              periodPayments.length
            }
            icon={
              CreditCard
            }
            color="green"
          />

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* INGRESOS DÍA */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Ingresos por día
            </h3>


            {incomeByDay.length ===
            0
              ? (

                <div className="text-center py-8">

                  <TrendingUp
                    size={48}
                    className="text-gray-600 mx-auto mb-3"
                  />

                  <p className="text-gray-400">
                    Sin datos de ingresos
                  </p>

                </div>

              )
              : (

                <div className="h-56 flex items-end gap-2">

                  {incomeByDay.map(
                    item => {

                      const height =
                        Math.max(
                          10,
                          item.total /
                          maxIncomeDay *
                          170
                        );


                      return (

                        <div
                          key={
                            item.date
                          }
                          className="flex-1 flex flex-col items-center justify-end gap-1 h-full"
                        >

                          <span className="text-[#00ff88] text-[10px]">
                            {formatMoney(
                              item.total
                            )}
                          </span>


                          <div
                            className="w-full bg-[#00ff88]/30 rounded-t-lg"
                            style={{
                              height:
                                `${height}px`
                            }}
                          />


                          <span className="text-gray-500 text-[10px]">
                            {item.date.slice(
                              8,
                              10
                            )}
                          </span>

                        </div>

                      );

                    }
                  )}

                </div>

              )}

          </div>


          {/* MÉTODOS */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Ingresos por método
            </h3>


            {paymentMethodData.map(
              item => {

                const labelMap = {
                  efectivo:
                    'Efectivo',
                  transferencia:
                    'Transferencia',
                  tarjeta:
                    'Tarjeta',
                  otro:
                    'Otro'
                };


                const width =
                  item.total >
                  0
                    ? item.total /
                      maxPaymentMethod *
                      100
                    : 0;


                return (

                  <div
                    key={
                      item.method
                    }
                    className="flex items-center gap-3 mb-3"
                  >

                    <span className="text-gray-400 text-sm w-24">
                      {labelMap[
                        item.method
                      ]}
                    </span>


                    <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">

                      <div
                        className="h-full bg-[#00ff88]/30 rounded-lg"
                        style={{
                          width:
                            `${width}%`
                        }}
                      />

                    </div>


                    <span className="text-gray-400 text-sm w-24 text-right">
                      {formatMoney(
                        item.total
                      )}
                    </span>

                  </div>

                );

              }
            )}

          </div>

        </div>

      </div>

    );


  // ======================================================
  // VENTAS
  // ======================================================

  const renderVentasTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">

          <ReportStatCard
            title="Ventas"
            value={
              periodProductSales.length
            }
            subtitle="Operaciones completadas"
            icon={
              ShoppingCart
            }
            color="green"
          />

          <ReportStatCard
            title="Ingresos"
            value={`${formatMoney(
              productSalesIncome
            )} MXN`}
            icon={
              DollarSign
            }
            color="green"
          />

          <ReportStatCard
            title="Productos vendidos"
            value={
              productUnitsSold
            }
            subtitle="Unidades"
            icon={
              PackageSearch
            }
            color="blue"
          />

          <ReportStatCard
            title="Ticket promedio"
            value={`${formatMoney(
              averageSaleTicket
            )} MXN`}
            icon={
              Receipt
            }
            color="gray"
          />

          <ReportStatCard
            title="Ganancia estimada"
            value={`${formatMoney(
              productSalesProfit
            )} MXN`}
            icon={
              TrendingUp
            }
            color="blue"
          />

        </div>


        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Productos más vendidos
            </h3>


            {
              topProducts.length ===
              0
                ? (

                  <div className="py-10 text-center text-gray-500">
                    Sin ventas de productos.
                  </div>

                )
                : (

                  <div className="space-y-3">

                    {
                      topProducts.map(
                        (
                          product,
                          index
                        ) => (

                          <div
                            key={
                              `${product.name}-${index}`
                            }
                            className="p-3 rounded-xl bg-[#1a1a1a] flex items-center justify-between gap-4"
                          >

                            <div>

                              <p className="text-white text-sm font-semibold">
                                #{index + 1} {product.name}
                              </p>

                              <p className="text-gray-600 text-xs mt-1">
                                {formatMoney(product.revenue)} generados
                              </p>

                            </div>


                            <span className="text-[#00ff88] font-bold">
                              {product.quantity} uds.
                            </span>

                          </div>

                        )
                      )
                    }

                  </div>

                )
            }

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

            <div className="p-5 border-b border-[#1a1a1a]">

              <h3 className="text-white font-bold">
                Últimas ventas
              </h3>

            </div>


            <div className="divide-y divide-[#1a1a1a]">

              {
                periodProductSales
                  .slice(
                    0,
                    10
                  )
                  .map(
                    sale => (

                      <div
                        key={
                          sale.id
                        }
                        className="p-4 flex items-center justify-between gap-4"
                      >

                        <div className="min-w-0">

                          <p className="text-white text-sm font-semibold">
                            {sale.folio || sale.id}
                          </p>

                          <p className="text-gray-500 text-xs mt-1 truncate">
                            {
                              Array.isArray(
                                sale.items
                              )
                                ? sale.items
                                    .map(
                                      item =>
                                        `${item.name} x${item.quantity}`
                                    )
                                    .join(', ')
                                : 'Sin detalle'
                            }
                          </p>

                        </div>


                        <div className="text-right shrink-0">

                          <p className="text-[#00ff88] font-bold">
                            {formatMoney(sale.total)}
                          </p>

                          <p className="text-gray-600 text-xs capitalize">
                            {sale.paymentMethod || 'otro'}
                          </p>

                        </div>

                      </div>

                    )
                  )
              }

            </div>

          </div>

        </div>

      </div>

    );


  // ======================================================
  // CAJA
  // ======================================================

  const renderCajaTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">

          <ReportStatCard
            title="Turnos cerrados"
            value={
              closedCashShifts.length
            }
            icon={
              WalletCards
            }
            color="green"
          />

          <ReportStatCard
            title="Turnos abiertos"
            value={
              openCashShifts.length
            }
            icon={
              Clock
            }
            color="yellow"
          />

          <ReportStatCard
            title="Gastos"
            value={`${formatMoney(
              cashExpenses
            )} MXN`}
            icon={
              DollarSign
            }
            color="red"
          />

          <ReportStatCard
            title="Retiros"
            value={`${formatMoney(
              cashWithdrawals
            )} MXN`}
            icon={
              DollarSign
            }
            color="red"
          />

          <ReportStatCard
            title="Contado"
            value={`${formatMoney(
              cashCountedTotal
            )} MXN`}
            subtitle={`Esperado ${formatMoney(cashExpectedTotal)}`}
            icon={
              Banknote
            }
            color="green"
          />

          <ReportStatCard
            title="Diferencia"
            value={`${formatMoney(
              cashDifferenceTotal
            )} MXN`}
            icon={
              AlertCircle
            }
            color={
              Math.abs(
                cashDifferenceTotal
              ) <
              0.01
                ? 'green'
                : 'red'
            }
          />

        </div>


        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

          <div className="p-5 border-b border-[#1a1a1a]">

            <h3 className="text-white font-bold">
              Cierres por empleado
            </h3>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead className="bg-[#0d0d0d]">

                <tr>
                  <th className="p-4 text-left text-gray-500 text-xs">Empleado</th>
                  <th className="p-4 text-left text-gray-500 text-xs">Apertura</th>
                  <th className="p-4 text-left text-gray-500 text-xs">Cierre</th>
                  <th className="p-4 text-right text-gray-500 text-xs">Manejado</th>
                  <th className="p-4 text-right text-gray-500 text-xs">Esperado</th>
                  <th className="p-4 text-right text-gray-500 text-xs">Contado</th>
                  <th className="p-4 text-right text-gray-500 text-xs">Diferencia</th>
                </tr>

              </thead>


              <tbody>

                {
                  closedCashShifts.map(
                    shift => (

                      <tr
                        key={
                          shift.id
                        }
                        className="border-t border-[#1a1a1a]"
                      >

                        <td className="p-4 text-white text-sm">
                          {shift.employee?.name || 'Usuario'}
                        </td>

                        <td className="p-4 text-gray-400 text-sm">
                          {parseGymDate(shift.openedAt)?.toLocaleString('es-MX') || '—'}
                        </td>

                        <td className="p-4 text-gray-400 text-sm">
                          {parseGymDate(shift.closedAt)?.toLocaleString('es-MX') || '—'}
                        </td>

                        <td className="p-4 text-right text-gray-300 text-sm">
                          {formatMoney(shift.closeSnapshot?.totalHandled || 0)}
                        </td>

                        <td className="p-4 text-right text-gray-300 text-sm">
                          {formatMoney(shift.expectedCash || 0)}
                        </td>

                        <td className="p-4 text-right text-gray-300 text-sm">
                          {formatMoney(shift.countedCash || 0)}
                        </td>

                        <td className={`p-4 text-right font-bold text-sm ${
                          Math.abs(
                            Number(
                              shift.difference ||
                              0
                            )
                          ) <
                          0.01
                            ? 'text-[#00ff88]'
                            : 'text-red-400'
                        }`}>
                          {formatMoney(shift.difference || 0)}
                        </td>

                      </tr>

                    )
                  )
                }

              </tbody>

            </table>

          </div>

        </div>

      </div>

    );


  // ======================================================
  // SEGURIDAD
  // ======================================================

  const renderSeguridadTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">

          <ReportStatCard
            title="Permitidos"
            value={
              allowedAccesses.length
            }
            subtitle="Accesos verificados"
            icon={
              UserCheck
            }
            color="green"
          />

          <ReportStatCard
            title="Bloqueados"
            value={
              deniedAccesses.length
            }
            icon={
              ShieldAlert
            }
            color="red"
          />

          <ReportStatCard
            title="Rostro no coincide"
            value={
              faceMismatchAttempts.length
            }
            icon={
              ShieldAlert
            }
            color="yellow"
          />

          <ReportStatCard
            title="Lista negra activa"
            value={
              activeBlacklist.length
            }
            icon={
              Ban
            }
            color="red"
          />

          <ReportStatCard
            title="Acciones protegidas"
            value={
              periodAdminAudit.length
            }
            icon={
              ShieldAlert
            }
            color="gray"
          />

          <ReportStatCard
            title="Autorización rechazada"
            value={
              deniedAdminActions.length
            }
            icon={
              AlertCircle
            }
            color="yellow"
          />

        </div>


        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

            <div className="p-5 border-b border-[#1a1a1a]">
              <h3 className="text-white font-bold">
                Incidentes de acceso
              </h3>
            </div>


            <div className="divide-y divide-[#1a1a1a]">

              {
                deniedAccesses
                  .slice(
                    0,
                    12
                  )
                  .map(
                    item => (

                      <div
                        key={
                          item.id
                        }
                        className="p-4 flex items-center justify-between gap-4"
                      >

                        <div>
                          <p className="text-white text-sm font-semibold">
                            {item.memberName || item.memberId || 'Acceso'}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {item.reason || 'Acceso rechazado'} · {item.method || '—'}
                          </p>
                        </div>

                        <span className="text-red-400 text-xs font-bold">
                          BLOQUEADO
                        </span>

                      </div>

                    )
                  )
              }

              {
                deniedAccesses.length ===
                0 &&
                (
                  <div className="py-10 text-center text-gray-500">
                    Sin incidentes registrados.
                  </div>
                )
              }

            </div>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

            <div className="p-5 border-b border-[#1a1a1a]">
              <h3 className="text-white font-bold">
                Auditoría administrativa
              </h3>
            </div>


            <div className="divide-y divide-[#1a1a1a]">

              {
                periodAdminAudit
                  .slice(
                    0,
                    12
                  )
                  .map(
                    item => (

                      <div
                        key={
                          item.id
                        }
                        className="p-4 flex items-center justify-between gap-4"
                      >

                        <div>
                          <p className="text-white text-sm font-semibold">
                            {item.action || 'Acción administrativa'}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {item.actor?.name || 'Sistema'}
                          </p>
                        </div>

                        <span className={`text-xs font-bold ${
                          item.result ===
                            'denied'
                            ? 'text-red-400'
                            : 'text-[#00ff88]'
                        }`}>
                          {
                            item.result ===
                              'denied'
                              ? 'RECHAZADO'
                              : 'AUTORIZADO'
                          }
                        </span>

                      </div>

                    )
                  )
              }

              {
                periodAdminAudit.length ===
                0 &&
                (
                  <div className="py-10 text-center text-gray-500">
                    Sin eventos administrativos.
                  </div>
                )
              }

            </div>

          </div>

        </div>

      </div>

    );


  // ======================================================
  // MIEMBROS
  // ======================================================

  const renderMiembrosTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <ReportStatCard
            title="Total registrados"
            value={
              members.length
            }
            icon={
              Users
            }
            color="gray"
          />

          <ReportStatCard
            title="Con suscripción activa"
            value={
              activeMembers
            }
            icon={
              UserCheck
            }
            color="green"
          />

          <ReportStatCard
            title="Sin suscripción"
            value={
              subscriptionStats.none
            }
            icon={
              UserX
            }
            color="red"
          />

          <ReportStatCard
            title="Nuevos en periodo"
            value={
              newMembers
            }
            icon={
              UserPlus
            }
            color="green"
          />

        </div>


        {/* ACTIVIDAD */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

          <h3 className="text-white font-bold mb-4">
            Actividad de miembros
          </h3>


          {memberActivity.map(
            item => {

              const width =
                item.count >
                0
                  ? item.count /
                    maxMemberActivity *
                    100
                  : 0;


              return (

                <div
                  key={
                    item.label
                  }
                  className="flex items-center gap-3 mb-3"
                >

                  <span className="text-gray-400 text-sm w-40">
                    {item.label}
                  </span>


                  <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">

                    <div
                      className="h-full bg-[#00ff88]/30 rounded-lg"
                      style={{
                        width:
                          `${width}%`
                      }}
                    />

                  </div>


                  <span className="text-gray-400 text-sm w-12 text-right">
                    {item.count}
                  </span>

                </div>

              );

            }
          )}

        </div>


        {/* SIN ASISTENCIA */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

          <h3 className="text-white font-bold mb-4">
            Miembros activos sin asistencia reciente
          </h3>


          {inactiveActiveMembers.length ===
          0
            ? (

              <div className="text-center py-8">

                <UserCheck
                  size={48}
                  className="text-[#00ff88] mx-auto mb-3"
                />

                <p className="text-gray-400">
                  Todos los miembros activos tienen asistencia reciente.
                </p>

              </div>

            )
            : (

              <div className="space-y-2">

                {inactiveActiveMembers.map(
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
                      className="w-full flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-yellow-500/40"
                    >

                      <div className="text-left">

                        <p className="text-white text-sm font-medium">
                          {member.firstName} {member.lastName}
                        </p>

                        <p className="text-gray-500 text-xs">
                          {member.id}
                        </p>

                      </div>


                      <span className="text-yellow-500 text-xs">
                        Sin asistencia reciente
                      </span>

                    </button>

                  )
                )}

              </div>

            )}

        </div>

      </div>

    );


  // ======================================================
  // RENDER TAB
  // ======================================================

  const renderContent =
    () => {

      switch (
        activeTab
      ) {

        case 'resumen':
          return renderResumenTab();

        case 'asistencias':
          return renderAsistenciasTab();

        case 'suscripciones':
          return renderSuscripcionesTab();

        case 'ingresos':
          return renderIngresosTab();

        case 'ventas':
          return renderVentasTab();

        case 'caja':
          return renderCajaTab();

        case 'seguridad':
          return renderSeguridadTab();

        case 'miembros':
          return renderMiembrosTab();

        default:
          return null;

      }

    };


  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Reportes"
      />


      <div className="flex-1 lg:ml-0">

        <Header />


        <main className="p-6 space-y-6">


          {/* HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <h1 className="text-2xl font-bold text-white">
                Reportes
              </h1>


              <p className="text-gray-400">
                Analiza miembros, asistencias, suscripciones, ingresos, ventas, caja y seguridad del gimnasio.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                setShowExportModal(
                  true
                )
              }
              className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] flex items-center gap-2"
            >

              <Download
                size={18}
              />

              Exportar reporte

            </button>

          </div>


          {/* PERIODO */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">

            <div className="flex flex-col xl:flex-row xl:items-center gap-4">

              <div>

                <p className="text-gray-400 text-xs font-medium">
                  Periodo analizado
                </p>


                <div className="flex flex-wrap gap-1 mt-1">

                  {periods.map(
                    item => (

                      <button
                        type="button"
                        key={
                          item
                        }
                        onClick={() =>
                          setPeriod(
                            item
                          )
                        }
                        className={`
                          px-3 py-1 rounded-full text-xs transition-all

                          ${
                            period ===
                            item
                              ? 'bg-[#00ff88] text-black font-bold'
                              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                          }
                        `}
                      >
                        {item}
                      </button>

                    )
                  )}

                </div>

              </div>


              <div className="xl:ml-auto flex flex-wrap items-center gap-3">

                <span className="text-gray-400 text-xs">
                  Comparar con:
                </span>


                <select
                  value={
                    comparison
                  }
                  onChange={
                    e =>
                      setComparison(
                        e.target.value
                      )
                  }
                  className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg px-3 py-1 text-xs"
                >

                  <option>
                    Periodo anterior
                  </option>

                  <option>
                    Mes anterior
                  </option>

                  <option>
                    Sin comparación
                  </option>

                </select>


                <div className="flex items-center gap-2">

                  <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />

                  <span className="text-[#00ff88] text-xs">
                    Datos actualizados
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* TABS */}

          <div className="border-b border-[#1a1a1a]">

            <div className="flex flex-wrap gap-1">

              {tabs.map(
                tab => (

                  <button
                    type="button"
                    key={
                      tab.id
                    }
                    onClick={() =>
                      setActiveTab(
                        tab.id
                      )
                    }
                    className={`
                      px-4 py-2.5
                      text-sm
                      font-medium
                      border-b-2

                      ${
                        activeTab ===
                        tab.id
                          ? 'text-[#00ff88] border-[#00ff88]'
                          : 'text-gray-400 border-transparent hover:text-white'
                      }
                    `}
                  >
                    {tab.label}
                  </button>

                )
              )}

            </div>

          </div>


          {renderContent()}

        </main>

      </div>


      {/* EXPORTAR */}

      {showExportModal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-lg w-full mx-4">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-white text-xl font-bold">
                Exportar reporte
              </h2>


              <button
                type="button"
                onClick={() =>
                  setShowExportModal(
                    false
                  )
                }
                className="text-gray-400 hover:text-white"
              >

                <X
                  size={20}
                />

              </button>

            </div>


            <div className="space-y-4">

              <div>

                <label className="text-white text-sm font-medium mb-2 block">
                  Tipo
                </label>


                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white">
                  {
                    tabs.find(
                      tab =>
                        tab.id ===
                        activeTab
                    )?.label
                  }
                </div>

              </div>


              <div>

                <label className="text-white text-sm font-medium mb-2 block">
                  Periodo
                </label>


                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-gray-300">
                  {period}
                </div>

              </div>


              <div>

                <label className="text-white text-sm font-medium mb-2 block">
                  Formato
                </label>


                <div className="p-3 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl text-[#00ff88] text-center font-medium">
                  CSV
                </div>

              </div>


              <button
                type="button"
                onClick={
                  exportCSV
                }
                className="w-full py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a]"
              >
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