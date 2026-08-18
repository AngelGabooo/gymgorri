// src/components/Attendance/AttendancePage.jsx

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
  LogIn,
  LogOut,
  QrCode,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Clock,
  User,
  TrendingUp,
  Camera
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import AttendanceStatCard from './Cards/AttendanceStatCard';

import {
  getMemberById,
  getCurrentGymContext
} from '../../utils/memberId';

import {
  getVisitAttendance,
  getVisitById
} from '../../utils/visitsStorage';


// ======================================================
// CONFIGURACIÓN
// ======================================================

const ATTENDANCE_KEY =
  'gym_control_attendance';

const MAX_CAPACITY =
  80;


// ======================================================
// LEER ASISTENCIAS
// ======================================================

const getStoredAttendance = () => {

  try {

    const raw =
      localStorage.getItem(
        ATTENDANCE_KEY
      );


    if (!raw) {

      return [];

    }


    const parsed =
      JSON.parse(
        raw
      );


    const records =
      Array.isArray(
        parsed
      )
        ? parsed
        : [];


    const {
      gymId
    } =
      getCurrentGymContext();


    // ====================================================
    // MODO LEGACY
    // ====================================================

    if (!gymId) {

      return records;

    }


    // ====================================================
    // FILTRAR POR GIMNASIO
    // ====================================================
    //
    // Los registros nuevos siempre tendrán gymId.
    //
    // Para registros antiguos sin gymId comprobamos si el
    // memberId pertenece al gimnasio actualmente abierto.
    //
    // ====================================================

    return records.filter(
      record => {

        if (
          record?.gymId
        ) {

          return (
            record.gymId ===
            gymId
          );

        }


        if (
          !record?.memberId
        ) {

          return false;

        }


        return Boolean(
          getMemberById(
            record.memberId
          )
        );

      }
    );

  } catch (error) {

    console.error(
      'Error leyendo asistencias:',
      error
    );


    return [];

  }

};


// ======================================================
// PARSEAR FECHA
// ======================================================

const parseDate = (value) => {

  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;

};


// ======================================================
// FORMATEAR FECHA
// ======================================================

const formatDate = (value) => {

  const date =
    parseDate(value);

  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  ).format(date);

};


// ======================================================
// FORMATEAR HORA
// ======================================================

const formatTime = (value) => {

  const date =
    parseDate(value);

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
  ).format(date);

};


// ======================================================
// ES HOY
// ======================================================

const isToday = (value) => {

  const date =
    parseDate(value);

  if (!date) {
    return false;
  }

  const today =
    new Date();

  return (
    date.getDate() ===
      today.getDate() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getFullYear() ===
      today.getFullYear()
  );

};


// ======================================================
// ES AYER
// ======================================================

const isYesterday = (value) => {

  const date =
    parseDate(value);

  if (!date) {
    return false;
  }

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() -
    1
  );

  return (
    date.getDate() ===
      yesterday.getDate() &&
    date.getMonth() ===
      yesterday.getMonth() &&
    date.getFullYear() ===
      yesterday.getFullYear()
  );

};


// ======================================================
// ESTÁ EN LOS ÚLTIMOS X DÍAS
// ======================================================

const isWithinDays = (
  value,
  days
) => {

  const date =
    parseDate(value);

  if (!date) {
    return false;
  }

  const now =
    new Date();

  const start =
    new Date();

  start.setHours(
    0,
    0,
    0,
    0
  );

  start.setDate(
    start.getDate() -
    (days - 1)
  );

  return (
    date >= start &&
    date <= now
  );

};


// ======================================================
// DURACIÓN
// ======================================================

const getDurationMinutes = (
  entryAt,
  exitAt
) => {

  const entry =
    parseDate(entryAt);

  const exit =
    parseDate(exitAt);

  if (
    !entry ||
    !exit
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (
        exit.getTime() -
        entry.getTime()
      ) /
      60000
    )
  );

};


// ======================================================
// FORMATEAR DURACIÓN
// ======================================================

const formatDuration = (
  minutes
) => {

  if (
    !minutes ||
    minutes <= 0
  ) {
    return '—';
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  const mins =
    minutes %
    60;

  if (
    hours <= 0
  ) {
    return `${mins} min`;
  }

  return `${hours}h ${mins}min`;

};


// ======================================================
// MÉTODO DE ACCESO
// ======================================================

const formatMethod = (method) => {

  switch (
    String(method || '')
      .toLowerCase()
  ) {

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
// COMPONENTE
// ======================================================

const AttendancePage = () => {

  const navigate =
    useNavigate();


  // ======================================================
  // ESTADOS
  // ======================================================

  const [
    activeTab,
    setActiveTab
  ] = useState(
    'historial'
  );


  const [
    activeFilter,
    setActiveFilter
  ] = useState(
    'Hoy'
  );


  const [
    searchTerm,
    setSearchTerm
  ] = useState('');


  const [
    insideSearchTerm,
    setInsideSearchTerm
  ] = useState('');


  const [
    attendanceData,
    setAttendanceData
  ] = useState([]);


  const [
    selectedEvidence,
    setSelectedEvidence
  ] = useState(null);


  // ======================================================
  // CARGAR ASISTENCIAS
  // ======================================================

  const loadAttendance =
    () => {

      const memberAttendance =
        getStoredAttendance();

      const visitAttendance =
        getVisitAttendance();


      const normalizedMemberRecords =
        memberAttendance.map(
          record => ({
            ...record,

            personType:
              'member'
          })
        );


      const normalizedVisitRecords =
        visitAttendance.map(
          record => ({
            ...record,

            personType:
              'visit',

            memberId:
              record.visitId ||
              record.visitorId ||
              record.memberId,

            memberName:
              record.visitName ||
              record.visitorName ||
              record.memberName ||
              'Visita'
          })
        );


      const allAttendance = [
        ...normalizedMemberRecords,
        ...normalizedVisitRecords
      ];


      console.log(
        '🕒 Asistencias de miembros:',
        memberAttendance
      );


      console.log(
        '👤 Asistencias de visitas:',
        visitAttendance
      );


      console.log(
        '📋 Asistencias combinadas:',
        allAttendance
      );


      setAttendanceData(
        allAttendance
      );

    };


  // ======================================================
  // ESCUCHAR CAMBIOS
  // ======================================================

  useEffect(
    () => {

      loadAttendance();


      const handleUpdate =
        () => {

          loadAttendance();

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
  // NORMALIZAR DATOS
  // ======================================================

  const normalizedAttendance =
    useMemo(
      () => {

        return attendanceData
          .map(
            item => {

              const isVisit =
                item.personType ===
                  'visit' ||
                Boolean(
                  item.visitId
                ) ||
                Boolean(
                  item.visitorId
                ) ||
                String(
                  item.memberId ||
                  ''
                ).startsWith(
                  'VIS-'
                );


              const personId =
                item.visitId ||
                item.visitorId ||
                item.memberId;


              const member =
                !isVisit
                  ? getMemberById(
                      personId
                    )
                  : null;


              const visit =
                isVisit
                  ? getVisitById(
                      personId
                    )
                  : null;


              const personName =
                isVisit
                  ? (
                      item.visitName ||
                      item.visitorName ||
                      item.memberName ||
                      `${visit?.firstName || ''} ${visit?.lastName || ''}`.trim() ||
                      visit?.name ||
                      'Visita'
                    )
                  : (
                      item.memberName ||
                      `${member?.firstName || ''} ${member?.lastName || ''}`.trim() ||
                      'Miembro'
                    );


              const profilePhoto =
                item.profilePhoto ||
                (
                  isVisit
                    ? (
                        visit?.profilePhoto ||
                        visit?.profilePhotoUrl ||
                        null
                      )
                    : (
                        member?.profilePhoto ||
                        null
                      )
                );


              return {

                ...item,

                memberId:
                  personId,

                memberName:
                  personName,

                profilePhoto,

                phone:
                  isVisit
                    ? (
                        visit?.phone ||
                        visit?.telephone ||
                        ''
                      )
                    : (
                        member?.phone ||
                        ''
                      ),

                personType:
                  isVisit
                    ? 'visit'
                    : 'member',

                durationMinutes:
                  item.durationMinutes ||
                  getDurationMinutes(
                    item.entryAt,
                    item.exitAt
                  )

              };

            }
          )
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b.entryAt ||
                b.createdAt ||
                0
              ) -
              new Date(
                a.entryAt ||
                a.createdAt ||
                0
              )
          );

      },
      [attendanceData]
    );


  // ======================================================
  // PERSONAS DENTRO
  // ======================================================

  const peopleInside =
    useMemo(
      () => {

        return normalizedAttendance.filter(
          item =>
            item.status ===
              'inside' &&
            !item.exitAt
        );

      },
      [normalizedAttendance]
    );


  // ======================================================
  // ESTADÍSTICAS DE HOY
  // ======================================================

  const stats =
    useMemo(
      () => {

        const entriesToday =
          normalizedAttendance.filter(
            item =>
              isToday(
                item.entryAt
              )
          ).length;


        const exitsToday =
          normalizedAttendance.filter(
            item =>
              item.exitAt &&
              isToday(
                item.exitAt
              )
          ).length;


        return {

          inside:
            peopleInside.length,

          entriesToday,

          exitsToday,

          totalMovements:
            entriesToday +
            exitsToday

        };

      },
      [
        normalizedAttendance,
        peopleInside
      ]
    );


  // ======================================================
  // FILTRAR POR FECHA
  // ======================================================

  const attendanceByDate =
    useMemo(
      () => {

        return normalizedAttendance.filter(
          item => {

            const referenceDate =
              item.entryAt ||
              item.createdAt;


            if (
              activeFilter ===
              'Hoy'
            ) {

              return isToday(
                referenceDate
              );

            }


            if (
              activeFilter ===
              'Ayer'
            ) {

              return isYesterday(
                referenceDate
              );

            }


            if (
              activeFilter ===
              '7 días'
            ) {

              return isWithinDays(
                referenceDate,
                7
              );

            }


            if (
              activeFilter ===
              '30 días'
            ) {

              return isWithinDays(
                referenceDate,
                30
              );

            }


            return true;

          }
        );

      },
      [
        normalizedAttendance,
        activeFilter
      ]
    );


  // ======================================================
  // BUSCADOR HISTORIAL
  // ======================================================

  const filteredAttendance =
    useMemo(
      () => {

        const term =
          searchTerm
            .trim()
            .toLowerCase();


        if (!term) {
          return attendanceByDate;
        }


        return attendanceByDate.filter(
          item => {

            return (

              String(
                item.memberName ||
                ''
              )
                .toLowerCase()
                .includes(
                  term
                ) ||

              String(
                item.memberId ||
                ''
              )
                .toLowerCase()
                .includes(
                  term
                )

            );

          }
        );

      },
      [
        attendanceByDate,
        searchTerm
      ]
    );


  // ======================================================
  // BUSCADOR PERSONAS DENTRO
  // ======================================================

  const filteredPeopleInside =
    useMemo(
      () => {

        const term =
          insideSearchTerm
            .trim()
            .toLowerCase();


        if (!term) {
          return peopleInside;
        }


        return peopleInside.filter(
          item => {

            return (

              String(
                item.memberName ||
                ''
              )
                .toLowerCase()
                .includes(
                  term
                ) ||

              String(
                item.memberId ||
                ''
              )
                .toLowerCase()
                .includes(
                  term
                )

            );

          }
        );

      },
      [
        peopleInside,
        insideSearchTerm
      ]
    );


  // ======================================================
  // OCUPACIÓN
  // ======================================================

  const occupancyPercentage =
    Math.min(
      100,
      Math.round(
        (
          stats.inside /
          MAX_CAPACITY
        ) *
        100
      )
    );


  const availablePlaces =
    Math.max(
      0,
      MAX_CAPACITY -
      stats.inside
    );


  // ======================================================
  // PROMEDIO DE TIEMPO DE PERSONAS DENTRO
  // ======================================================

  const currentInsideStats =
    useMemo(
      () => {

        if (
          peopleInside.length ===
          0
        ) {

          return {
            average:
              '0h 0min',

            longest:
              '0h 0min'
          };

        }


        const now =
          new Date();


        const times =
          peopleInside.map(
            item => {

              const entry =
                parseDate(
                  item.entryAt
                );

              if (!entry) {
                return 0;
              }

              return Math.max(
                0,
                Math.floor(
                  (
                    now.getTime() -
                    entry.getTime()
                  ) /
                  60000
                )
              );

            }
          );


        const total =
          times.reduce(
            (
              sum,
              value
            ) =>
              sum +
              value,
            0
          );


        const average =
          Math.round(
            total /
            times.length
          );


        const longest =
          Math.max(
            ...times
          );


        return {

          average:
            formatDuration(
              average
            )
              .replace(
                '—',
                '0h 0min'
              ),

          longest:
            formatDuration(
              longest
            )
              .replace(
                '—',
                '0h 0min'
              )

        };

      },
      [peopleInside]
    );


  // ======================================================
  // AFLUENCIA
  // ======================================================

  const attendanceLevel =
    useMemo(
      () => {

        if (
          stats.inside ===
          0
        ) {

          return {
            label:
              'Sin actividad',

            className:
              'text-gray-400'
          };

        }


        if (
          occupancyPercentage <
          25
        ) {

          return {
            label:
              'Baja',

            className:
              'text-[#00ff88]'
          };

        }


        if (
          occupancyPercentage <
          60
        ) {

          return {
            label:
              'Moderada',

            className:
              'text-yellow-500'
          };

        }


        return {
          label:
            'Alta',

          className:
            'text-red-400'
        };

      },
      [
        stats.inside,
        occupancyPercentage
      ]
    );


  // ======================================================
  // MOVIMIENTOS POR HORA
  // ======================================================

  const hourlyActivity =
    useMemo(
      () => {

        const hours = [
          6,
          8,
          10,
          12,
          14,
          16,
          18,
          20
        ];


        return hours.map(
          hour => {

            const count =
              normalizedAttendance.reduce(
                (
                  total,
                  item
                ) => {

                  let movementCount =
                    0;


                  const entry =
                    parseDate(
                      item.entryAt
                    );


                  const exit =
                    parseDate(
                      item.exitAt
                    );


                  if (
                    entry &&
                    isToday(
                      entry
                    ) &&
                    entry.getHours() >=
                      hour &&
                    entry.getHours() <
                      hour +
                      2
                  ) {

                    movementCount +=
                      1;

                  }


                  if (
                    exit &&
                    isToday(
                      exit
                    ) &&
                    exit.getHours() >=
                      hour &&
                    exit.getHours() <
                      hour +
                      2
                  ) {

                    movementCount +=
                      1;

                  }


                  return (
                    total +
                    movementCount
                  );

                },
                0
              );


            return {
              hour,
              count
            };

          }
        );

      },
      [normalizedAttendance]
    );


  const maxHourlyActivity =
    Math.max(
      1,
      ...hourlyActivity.map(
        item =>
          item.count
      )
    );


  // ======================================================
  // EXPORTAR
  // ======================================================

  const handleExport =
    () => {

      if (
        filteredAttendance.length ===
        0
      ) {

        return;

      }


      const rows = [

        [
          'Persona',
          'Tipo',
          'ID',
          'Fecha',
          'Entrada',
          'Salida',
          'Duración',
          'Método',
          'Estado'
        ],

        ...filteredAttendance.map(
          item => [

            item.memberName,

            item.personType ===
              'visit'
              ? 'Visita'
              : 'Miembro',

            item.memberId,

            formatDate(
              item.entryAt
            ),

            formatTime(
              item.entryAt
            ),

            item.exitAt
              ? formatTime(
                  item.exitAt
                )
              : '',

            formatDuration(
              item.durationMinutes
            ),

            formatMethod(
              item.method
            ),

            item.status ===
              'inside'
              ? 'Dentro'
              : 'Finalizada'

          ]
        )

      ];


      const csv =
        rows
          .map(
            row =>
              row
                .map(
                  value =>
                    `"${String(
                      value ??
                      ''
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
        `asistencias-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.csv`;


      link.click();


      URL.revokeObjectURL(
        url
      );

    };


  // ======================================================
  // FILTROS
  // ======================================================

  const quickFilters = [
    'Hoy',
    'Ayer',
    '7 días',
    '30 días',
    'Personalizado'
  ];


  const tabs = [
    {
      id:
        'historial',

      label:
        'Historial'
    },

    {
      id:
        'inside',

      label:
        `Dentro del gimnasio · ${stats.inside}`
    }
  ];


  // ======================================================
  // TAB HISTORIAL
  // ======================================================

  const renderHistorialTab =
    () => (

      <div className="space-y-6">


        {/* ================================================= */}
        {/* FILTROS FECHA */}
        {/* ================================================= */}

        <div className="flex flex-wrap gap-2">

          {
            quickFilters.map(
              filter => (

                <button
                  type="button"
                  key={
                    filter
                  }
                  onClick={() =>
                    setActiveFilter(
                      filter
                    )
                  }
                  className={`
                    px-4 py-1.5 rounded-full text-sm transition-all duration-200

                    ${
                      activeFilter ===
                      filter

                        ? 'bg-[#00ff88] text-black font-bold'

                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                    }
                  `}
                >
                  {
                    filter
                  }
                </button>

              )
            )
          }

        </div>


        {/* ================================================= */}
        {/* BUSCADOR */}
        {/* ================================================= */}

        <div className="flex flex-col sm:flex-row gap-3">

          <div className="flex-1 relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />


            <input
              type="text"
              placeholder="Buscar persona por nombre o ID..."
              value={
                searchTerm
              }
              onChange={
                e =>
                  setSearchTerm(
                    e.target.value
                  )
              }
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-10 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none"
            />

          </div>


          <div className="flex gap-2">

            <button
              type="button"
              className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white flex items-center gap-2"
            >

              <Filter
                size={18}
              />

              Filtros

            </button>


            <button
              type="button"
              onClick={
                handleExport
              }
              disabled={
                filteredAttendance.length ===
                0
              }
              className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white flex items-center gap-2 disabled:opacity-40"
            >

              <Download
                size={18}
              />

              Exportar

            </button>

          </div>

        </div>


        {/* ================================================= */}
        {/* ACTIVIDAD HOY */}
        {/* ================================================= */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

          <h3 className="text-white font-bold mb-4">
            Actividad de hoy
          </h3>


          <div className="h-32 flex items-end gap-2">

            {
              hourlyActivity.map(
                (
                  item,
                  index
                ) => {

                  const height =
                    item.count ===
                    0
                      ? 2
                      : Math.max(
                          10,
                          Math.round(
                            (
                              item.count /
                              maxHourlyActivity
                            ) *
                            80
                          )
                        );


                  const labels = [
                    '6 AM',
                    '8 AM',
                    '10 AM',
                    '12 PM',
                    '2 PM',
                    '4 PM',
                    '6 PM',
                    '8 PM'
                  ];


                  return (

                    <div
                      key={
                        item.hour
                      }
                      className="flex-1 flex flex-col items-center justify-end gap-1 h-full"
                    >

                      {
                        item.count >
                          0 &&
                        (

                          <span className="text-[#00ff88] text-xs">
                            {
                              item.count
                            }
                          </span>

                        )
                      }


                      <div
                        className={
                          item.count >
                          0
                            ? 'w-full bg-[#00ff88] rounded-t-lg transition-all'
                            : 'w-full bg-[#1a1a1a] rounded-t-lg'
                        }
                        style={{
                          height:
                            `${height}px`
                        }}
                      />


                      <span className="text-gray-500 text-xs">
                        {
                          labels[index]
                        }
                      </span>

                    </div>

                  );

                }
              )
            }

          </div>


          <p className="text-gray-400 text-sm text-center mt-3">

            {
              stats.totalMovements >
              0
                ? `${stats.totalMovements} movimientos registrados hoy`
                : 'Sin datos de actividad'
            }

          </p>

        </div>


        {/* ================================================= */}
        {/* TABLA */}
        {/* ================================================= */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

          {
            filteredAttendance.length ===
            0
              ? (

                <div className="text-center py-16">

                  <div className="flex justify-center mb-4">

                    <div className="p-4 bg-[#1a1a1a] rounded-full">

                      <Clock
                        size={48}
                        className="text-gray-600"
                      />

                    </div>

                  </div>


                  <h3 className="text-white text-xl font-bold mb-2">
                    No hay asistencias registradas
                  </h3>


                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    No encontramos entradas o salidas para este periodo.
                  </p>

                </div>

              )
              : (

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">

                      <tr>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">
                          Persona
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">
                          Fecha
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">
                          Entrada
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">
                          Salida
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">
                          Duración
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">
                          Método
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">
                          Estado
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">
                          Acciones
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {
                        filteredAttendance.map(
                          item => (

                            <tr
                              key={
                                item.id
                              }
                              className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#151515]"
                            >


                              {/* MIEMBRO */}

                              <td className="py-4 px-4">

                                <div className="flex items-center gap-3">

                                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex items-center justify-center">

                                    {
                                      item.profilePhoto
                                        ? (

                                          <img
                                            src={
                                              item.profilePhoto
                                            }
                                            alt={
                                              item.memberName
                                            }
                                            className="w-full h-full object-cover"
                                          />

                                        )
                                        : (

                                          <User
                                            size={19}
                                            className="text-gray-500"
                                          />

                                        )
                                    }

                                  </div>


                                  <div>

                                    <p className="text-white text-sm font-medium">
                                      {
                                        item.memberName
                                      }
                                    </p>


                                    <div className="flex items-center gap-2 mt-0.5">

                                      <p className="text-gray-500 text-xs font-mono">
                                        {
                                          item.memberId
                                        }
                                      </p>


                                      {
                                        item.personType ===
                                          'visit' &&
                                        (
                                          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase tracking-wide">
                                            Visita
                                          </span>
                                        )
                                      }

                                    </div>

                                  </div>

                                </div>

                              </td>


                              {/* FECHA */}

                              <td className="py-4 px-4 text-gray-300 text-sm">
                                {
                                  formatDate(
                                    item.entryAt
                                  )
                                }
                              </td>


                              {/* ENTRADA */}

                              <td className="py-4 px-4">

                                <span className="text-[#00ff88] text-sm">
                                  {
                                    formatTime(
                                      item.entryAt
                                    )
                                  }
                                </span>

                              </td>


                              {/* SALIDA */}

                              <td className="py-4 px-4">

                                <span className="text-gray-300 text-sm">
                                  {
                                    item.exitAt
                                      ? formatTime(
                                          item.exitAt
                                        )
                                      : '—'
                                  }
                                </span>

                              </td>


                              {/* DURACIÓN */}

                              <td className="py-4 px-4 text-gray-300 text-sm">

                                {
                                  item.status ===
                                    'inside'

                                    ? 'En curso'

                                    : formatDuration(
                                        item.durationMinutes
                                      )
                                }

                              </td>


                              {/* MÉTODO */}

                              <td className="py-4 px-4">

                                <span className="px-2 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-full text-xs">
                                  {
                                    formatMethod(
                                      item.method
                                    )
                                  }
                                </span>

                              </td>


                              {/* ESTADO */}

                              <td className="py-4 px-4">

                                {
                                  item.status ===
                                    'inside'
                                    ? (

                                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-full text-xs">

                                        <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />

                                        Dentro

                                      </span>

                                    )
                                    : (

                                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-gray-500/10 text-gray-400 rounded-full text-xs">

                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />

                                        Finalizada

                                      </span>

                                    )
                                }

                              </td>


                              {/* ACCIONES */}

                              <td className="py-4 px-4">

                                <div className="flex items-center gap-2">

                                  {
                                    (
                                      item.entryEvidence?.photo ||
                                      item.exitEvidence?.photo
                                    ) &&
                                    (

                                      <button
                                        type="button"
                                        title="Ver evidencia de acceso"
                                        onClick={() =>
                                          setSelectedEvidence(
                                            item
                                          )
                                        }
                                        className="w-9 h-9 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]"
                                      >

                                        <Camera
                                          size={16}
                                        />

                                      </button>

                                    )
                                  }


                                  <button
                                    type="button"
                                    title="Ver perfil"
                                    onClick={() => {
                                      if (
                                        item.personType ===
                                        'visit'
                                      ) {
                                        navigate(
                                          '/visits'
                                        );

                                        return;
                                      }

                                      navigate(
                                        `/members/${item.memberId}`
                                      );
                                    }}
                                    className="w-9 h-9 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]"
                                  >

                                    <Eye
                                      size={16}
                                    />

                                  </button>

                                </div>

                              </td>

                            </tr>

                          )
                        )
                      }

                    </tbody>

                  </table>

                </div>

              )
          }

        </div>


        {
          filteredAttendance.length >
            0 &&
          (

            <p className="text-gray-400 text-sm">
              Mostrando {filteredAttendance.length} asistencias
            </p>

          )
        }

      </div>

    );


  // ======================================================
  // TAB PERSONAS DENTRO
  // ======================================================

  const renderInsideTab =
    () => (

      <div className="space-y-6">


        {/* ================================================= */}
        {/* RESUMEN */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 text-center">

            <p className="text-2xl font-bold text-[#00ff88]">
              {
                stats.inside
              }
            </p>

            <p className="text-gray-400 text-xs">
              Dentro actualmente
            </p>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 text-center">

            <p className="text-2xl font-bold text-white">
              {
                currentInsideStats.average
              }
            </p>

            <p className="text-gray-400 text-xs">
              Tiempo promedio actual
            </p>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 text-center">

            <p className="text-2xl font-bold text-white">
              {
                currentInsideStats.longest
              }
            </p>

            <p className="text-gray-400 text-xs">
              Mayor tiempo dentro
            </p>

          </div>

        </div>


        {/* ================================================= */}
        {/* BUSCADOR */}
        {/* ================================================= */}

        <div className="relative">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />


          <input
            type="text"
            placeholder="Buscar persona dentro del gimnasio..."
            value={
              insideSearchTerm
            }
            onChange={
              e =>
                setInsideSearchTerm(
                  e.target.value
                )
            }
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-10 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none"
          />

        </div>


        {/* ================================================= */}
        {/* OCUPACIÓN */}
        {/* ================================================= */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-400 text-sm">
                Ocupación
              </p>


              <div className="flex items-center gap-4">

                <span className="text-2xl font-bold text-white">
                  {stats.inside} / {MAX_CAPACITY}
                </span>


                <span className="text-[#00ff88] text-sm font-medium">
                  {occupancyPercentage}% ocupado
                </span>

              </div>

            </div>


            <span className="text-gray-400 text-sm">
              {availablePlaces} lugares disponibles
            </span>

          </div>


          <div className="mt-3 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">

            <div
              className="h-full bg-[#00ff88] rounded-full transition-all"
              style={{
                width:
                  `${occupancyPercentage}%`
              }}
            />

          </div>

        </div>


        {/* ================================================= */}
        {/* PERSONAS */}
        {/* ================================================= */}

        {
          filteredPeopleInside.length ===
          0
            ? (

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-12 text-center">

                <div className="flex justify-center mb-4">

                  <div className="p-4 bg-[#1a1a1a] rounded-full">

                    <Users
                      size={48}
                      className="text-gray-600"
                    />

                  </div>

                </div>


                <h3 className="text-white text-xl font-bold mb-2">

                  {
                    peopleInside.length ===
                    0
                      ? 'El gimnasio está vacío'
                      : 'No encontramos resultados'
                  }

                </h3>


                <p className="text-gray-400 text-sm">
                  {
                    peopleInside.length ===
                    0
                      ? 'No hay personas con una entrada activa en este momento.'
                      : 'Cambia la búsqueda para encontrar a la persona.'
                  }
                </p>

              </div>

            )
            : (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {
                  filteredPeopleInside.map(
                    item => {

                      const entry =
                        parseDate(
                          item.entryAt
                        );


                      const minutesInside =
                        entry
                          ? Math.floor(
                              (
                                Date.now() -
                                entry.getTime()
                              ) /
                              60000
                            )
                          : 0;


                      return (

                        <div
                          key={
                            item.id
                          }
                          className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#00ff88]/40"
                        >

                          <div className="flex items-center gap-3">

                            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex items-center justify-center">

                              {
                                item.profilePhoto
                                  ? (

                                    <img
                                      src={
                                        item.profilePhoto
                                      }
                                      alt={
                                        item.memberName
                                      }
                                      className="w-full h-full object-cover"
                                    />

                                  )
                                  : (

                                    <User
                                      size={23}
                                      className="text-gray-500"
                                    />

                                  )
                              }

                            </div>


                            <div className="flex-1">

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    item.personType ===
                                      'visit'
                                  ) {
                                    navigate(
                                      '/visits'
                                    );

                                    return;
                                  }

                                  navigate(
                                    `/members/${item.memberId}`
                                  );
                                }}
                                className="text-white font-semibold hover:text-[#00ff88]"
                              >
                                {
                                  item.memberName
                                }
                              </button>


                              <div className="flex items-center gap-2 mt-0.5">

                                <p className="text-gray-500 text-xs font-mono">
                                  {
                                    item.memberId
                                  }
                                </p>


                                {
                                  item.personType ===
                                    'visit' &&
                                  (
                                    <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase tracking-wide">
                                      Visita
                                    </span>
                                  )
                                }

                              </div>

                            </div>


                            <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />

                          </div>


                          <div className="border-t border-[#1a1a1a] mt-4 pt-4 space-y-2 text-sm">

                            <div className="flex justify-between">

                              <span className="text-gray-400">
                                Entrada
                              </span>


                              <span className="text-white">
                                {
                                  formatTime(
                                    item.entryAt
                                  )
                                }
                              </span>

                            </div>


                            <div className="flex justify-between">

                              <span className="text-gray-400">
                                Tiempo dentro
                              </span>


                              <span className="text-[#00ff88]">
                                {
                                  formatDuration(
                                    minutesInside
                                  )
                                }
                              </span>

                            </div>


                            <div className="flex justify-between">

                              <span className="text-gray-400">
                                Método
                              </span>


                              <span className="text-white">
                                {
                                  formatMethod(
                                    item.method
                                  )
                                }
                              </span>

                            </div>

                          </div>

                        </div>

                      );

                    }
                  )
                }

              </div>

            )
        }

      </div>

    );


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Asistencias"
      />


      <div className="flex-1 lg:ml-0">

        <Header />


        <main className="p-6 space-y-6">


          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <h1 className="text-2xl font-bold text-white">
                Asistencias
              </h1>


              <p className="text-gray-400">
                Consulta las entradas, salidas y ocupación actual del gimnasio.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  '/access'
                )
              }
              className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2"
            >

              <QrCode
                size={18}
              />

              Abrir control de acceso

            </button>

          </div>


          {/* ================================================= */}
          {/* TIEMPO REAL */}
          {/* ================================================= */}

          <div className="flex items-center gap-2 text-sm">

            <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />


            <span className="text-[#00ff88] font-medium">
              Actualización en tiempo real
            </span>


            <span className="text-gray-500">
              •
            </span>


            <span className="text-gray-400">
              Datos almacenados localmente
            </span>

          </div>


          {/* ================================================= */}
          {/* ESTADÍSTICAS */}
          {/* ================================================= */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            <AttendanceStatCard
              title="Dentro ahora"
              value={
                stats.inside
              }
              subtitle="Personas dentro del gimnasio"
              icon={
                Users
              }
              color="green"
              trend="En tiempo real"
              isHighlighted
            />


            <AttendanceStatCard
              title="Entradas hoy"
              value={
                stats.entriesToday
              }
              subtitle="Entradas registradas"
              icon={
                LogIn
              }
              color="green"
              trend={
                stats.entriesToday >
                0
                  ? `+${stats.entriesToday} hoy`
                  : 'Sin datos'
              }
            />


            <AttendanceStatCard
              title="Salidas hoy"
              value={
                stats.exitsToday
              }
              subtitle="Salidas registradas"
              icon={
                LogOut
              }
              color="blue"
            />


            <AttendanceStatCard
              title="Total de movimientos"
              value={
                stats.totalMovements
              }
              subtitle="Entradas + salidas de hoy"
              icon={
                TrendingUp
              }
              color="gray"
              trend="En tiempo real"
            />

          </div>


          {/* ================================================= */}
          {/* OCUPACIÓN / AFLUENCIA */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">

              <h3 className="text-white font-bold mb-2">
                Ocupación actual
              </h3>


              <div className="flex items-center justify-between">

                <div>

                  <p className="text-2xl font-bold text-white">
                    {
                      stats.inside
                    } personas
                  </p>


                  <p className="text-gray-400 text-sm">
                    {stats.inside} / {MAX_CAPACITY} • {occupancyPercentage}% ocupado
                  </p>

                </div>


                <span className="text-[#00ff88] text-sm font-medium">
                  {availablePlaces} lugares disponibles
                </span>

              </div>


              <div className="mt-3 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">

                <div
                  className="h-full bg-[#00ff88] rounded-full transition-all duration-500"
                  style={{
                    width:
                      `${occupancyPercentage}%`
                  }}
                />

              </div>

            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">

              <h3 className="text-white font-bold mb-2">
                Nivel de afluencia
              </h3>


              <div className="flex items-center gap-4">

                <div className="flex-1">

                  <p className={`text-2xl font-bold ${attendanceLevel.className}`}>
                    {
                      attendanceLevel.label
                    }
                  </p>


                  <p className="text-gray-400 text-sm">
                    {stats.inside} personas actualmente
                  </p>

                </div>


                <div className="p-3 bg-[#1a1a1a] rounded-lg">

                  <Users
                    size={24}
                    className="text-gray-500"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* TABS */}
          {/* ================================================= */}

          <div className="border-b border-[#1a1a1a]">

            <div className="flex flex-wrap gap-1">

              {
                tabs.map(
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
                        px-4 py-2.5 text-sm font-medium border-b-2 transition-all

                        ${
                          activeTab ===
                          tab.id

                            ? 'text-[#00ff88] border-[#00ff88]'

                            : 'text-gray-400 border-transparent hover:text-white'
                        }
                      `}
                    >
                      {
                        tab.label
                      }
                    </button>

                  )
                )
              }

            </div>

          </div>


          {/* ================================================= */}
          {/* CONTENIDO */}
          {/* ================================================= */}

          {
            activeTab ===
            'historial'
              ? renderHistorialTab()
              : renderInsideTab()
          }

        </main>

      </div>

      {
        selectedEvidence &&
        (

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

            <button
              type="button"
              aria-label="Cerrar evidencia"
              onClick={() =>
                setSelectedEvidence(
                  null
                )
              }
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />


            <div className="relative w-full max-w-3xl bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl">

              <div className="p-6 border-b border-[#1a1a1a] flex items-start justify-between gap-4">

                <div>

                  <h2 className="text-white text-xl font-black">
                    Evidencia de acceso
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    {selectedEvidence.memberName} · {selectedEvidence.memberId}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setSelectedEvidence(
                      null
                    )
                  }
                  className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white"
                >
                  ×
                </button>

              </div>


              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                <EvidenceCard
                  title="Entrada"
                  evidence={
                    selectedEvidence.entryEvidence
                  }
                  date={
                    selectedEvidence.entryAt
                  }
                  method={
                    selectedEvidence.method
                  }
                />

                <EvidenceCard
                  title="Salida"
                  evidence={
                    selectedEvidence.exitEvidence
                  }
                  date={
                    selectedEvidence.exitAt
                  }
                  method={
                    selectedEvidence.exitMethod ||
                    selectedEvidence.method
                  }
                />

              </div>

            </div>

          </div>

        )
      }


    </div>

  );

};


// ======================================================
// TARJETA DE EVIDENCIA
// ======================================================

const EvidenceCard = ({
  title,
  evidence,
  date,
  method
}) => {

  if (!evidence) {

    return (

      <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-8 text-center text-gray-500">
        No existe evidencia para {title.toLowerCase()}.
      </div>

    );

  }


  return (

    <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] overflow-hidden">

      <div className="p-4 border-b border-[#1a1a1a]">

        <p className="text-white font-bold">
          {title}
        </p>

        <p className="text-gray-500 text-xs mt-1">
          {formatDate(date)} · {formatTime(date)}
        </p>

      </div>


      {
        evidence.photo
          ? (

            <img
              src={
                evidence.photo
              }
              alt={`Evidencia ${title.toLowerCase()}`}
              className="w-full aspect-[4/3] object-cover bg-black"
            />

          )
          : (

            <div className="aspect-[4/3] flex items-center justify-center text-gray-600">
              Sin fotografía
            </div>

          )
      }


      <div className="p-4 space-y-2 text-sm">

        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Método</span>
          <span className="text-white">{formatMethod(method)}</span>
        </div>


        {
          evidence.faceVerified !==
            null &&
          evidence.faceVerified !==
            undefined &&
          (

            <div className="flex justify-between gap-3">

              <span className="text-gray-500">
                Verificación facial
              </span>

              <span className={
                evidence.faceVerified
                  ? 'text-[#00ff88]'
                  : 'text-red-400'
              }>
                {
                  evidence.faceVerified
                    ? 'Coincide'
                    : 'No coincide'
                }
              </span>

            </div>

          )
        }


        {
          Number(
            evidence.similarity
          ) >
            0 &&
          (

            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Similitud</span>
              <span className="text-white">
                {Math.round(Number(evidence.similarity) * 100)}%
              </span>
            </div>

          )
        }

      </div>

    </div>

  );

};


export default AttendancePage;