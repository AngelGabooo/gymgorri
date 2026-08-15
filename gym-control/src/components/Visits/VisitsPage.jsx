// src/components/Visits/VisitsPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  UserCheck,
  Users,
  Clock,
  Search,
  QrCode,
  ScanFace,
  KeyRound,
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

import {
  getStoredVisits,
  getVisitAttendance
} from '../../utils/visitsStorage';

import {
  getStoredMembers
} from '../../utils/memberId';


// ======================================================
// UTILIDADES
// ======================================================

const ITEMS_PER_PAGE = 10;

const MEMBER_ATTENDANCE_KEY =
  'gym_control_attendance';


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
// OBTENER INFORMACIÓN DEL PLAN
// ======================================================

const getPlanInfo = (
  member
) => {

  const subscription =
    member?.subscription ||
    {};

  const planId =
    String(
      subscription.plan ||
      subscription.planId ||
      subscription.selectedPlan ||
      ''
    )
      .trim()
      .toLowerCase();

  const planLabel =
    String(
      subscription.planLabel ||
      subscription.label ||
      ''
    )
      .trim();

  const days =
    Number(
      subscription.days ??
      subscription.durationDays ??
      subscription.planDays ??
      0
    ) ||
    0;

  const normalizedLabel =
    planLabel
      .toLowerCase();

  const isMonthly =
    planId === 'mensual' ||
    planId === 'monthly' ||
    normalizedLabel === 'mensual' ||
    normalizedLabel === 'monthly';

  const isAnnual =
    planId === 'anual' ||
    planId === 'annual' ||
    normalizedLabel === 'anual' ||
    normalizedLabel === 'annual';

  const idLooksLikeDays =
    planId.includes('dia') ||
    planId.includes('day');

  const labelLooksLikeDays =
    normalizedLabel.includes('día') ||
    normalizedLabel.includes('dia') ||
    normalizedLabel.includes('day');

  // En GYM CONTROL los planes cortos configurados son
  // 7 días y 15 días. Esta condición también soporta
  // futuros planes por días menores a un mes.
  const isDayPlan =
    !isMonthly &&
    !isAnnual &&
    (
      idLooksLikeDays ||
      labelLooksLikeDays ||
      (
        days > 0 &&
        days < 30
      )
    );

  let resolvedLabel =
    planLabel;

  if (!resolvedLabel) {

    if (planId === '7dias') {
      resolvedLabel = '7 días';
    } else if (planId === '15dias') {
      resolvedLabel = '15 días';
    } else if (isMonthly) {
      resolvedLabel = 'Mensual';
    } else if (isAnnual) {
      resolvedLabel = 'Anual';
    } else if (days > 0) {
      resolvedLabel = `${days} días`;
    } else {
      resolvedLabel = 'Sin plan';
    }

  }

  return {
    planId,
    planLabel:
      resolvedLabel,
    days,
    isDayPlan,
    isMonthly,
    isAnnual
  };

};


const getLocalDateKey = (
  value = new Date()
) => {

  const date =
    value instanceof Date
      ? value
      : new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }


  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );


  return `${year}-${month}-${day}`;

};


const formatDate = (
  value
) => {

  if (!value) {
    return '—';
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day:
        '2-digit',
      month:
        'short',
      year:
        'numeric'
    }
  ).format(
    date
  );

};


const formatTime = (
  value
) => {

  if (!value) {
    return '—';
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      hour:
        '2-digit',
      minute:
        '2-digit'
    }
  ).format(
    date
  );

};


const getMethodData = (
  method
) => {

  const normalized =
    String(
      method ||
      ''
    ).toLowerCase();


  if (
    normalized ===
      'face' ||
    normalized ===
      'facial' ||
    normalized ===
      'biometria'
  ) {

    return {
      label:
        'Rostro',
      icon:
        ScanFace,
      color:
        'text-purple-400'
    };

  }


  if (
    normalized ===
    'pin'
  ) {

    return {
      label:
        'PIN',
      icon:
        KeyRound,
      color:
        'text-blue-400'
    };

  }


  return {
    label:
      'QR',
    icon:
      QrCode,
    color:
      'text-[#00ff88]'
  };

};


const VisitsPage = () => {

  const navigate =
    useNavigate();


  const [
    visits,
    setVisits
  ] = useState([]);


  const [
    attendance,
    setAttendance
  ] = useState([]);


  const [
    members,
    setMembers
  ] = useState([]);


  const [
    memberAttendance,
    setMemberAttendance
  ] = useState([]);


  const [
    searchTerm,
    setSearchTerm
  ] = useState('');


  const [
    selectedDate,
    setSelectedDate
  ] = useState(
    getLocalDateKey()
  );


  const [
    currentPage,
    setCurrentPage
  ] = useState(1);


  // ======================================================
  // CARGAR
  // ======================================================

  const loadData =
    () => {

      setVisits(
        getStoredVisits()
      );


      setAttendance(
        getVisitAttendance()
      );


      setMembers(
        getStoredMembers()
      );


      setMemberAttendance(
        readLocalArray(
          MEMBER_ATTENDANCE_KEY
        )
      );

    };


  useEffect(
    () => {

      loadData();


      const refresh =
        () =>
          loadData();


      window.addEventListener(
        'gym-storage-update',
        refresh
      );


      window.addEventListener(
        'storage',
        refresh
      );


      return () => {

        window.removeEventListener(
          'gym-storage-update',
          refresh
        );


        window.removeEventListener(
          'storage',
          refresh
        );

      };

    },
    []
  );


  // ======================================================
  // MAPA DE VISITANTES
  // ======================================================

  const visitMap =
    useMemo(
      () => {

        const map =
          new Map();


        visits.forEach(
          visit => {

            if (
              visit?.id
            ) {

              map.set(
                visit.id,
                visit
              );

            }

          }
        );


        return map;

      },
      [visits]
    );


  // ======================================================
  // MAPA DE MIEMBROS
  // ======================================================

  const memberMap =
    useMemo(
      () => {

        const map =
          new Map();


        members.forEach(
          member => {

            if (
              member?.id
            ) {

              map.set(
                member.id,
                member
              );

            }

          }
        );


        return map;

      },
      [members]
    );


  // ======================================================
  // NORMALIZAR HISTORIAL DE VISITAS POR DÍA
  //
  // Se consideran:
  // 1. Visitas temporales reales (VIS-xxxxx).
  // 2. Miembros GYM-xxxxx con plan POR DÍAS
  //    (7 días, 15 días o cualquier plan < 30 días).
  // ======================================================

  const dailyVisitRecords =
    useMemo(
      () => {

        // ================================================
        // VISITAS TEMPORALES (VIS-xxxxx)
        // ================================================

        const temporaryVisitRecords =
          attendance
            .map(
              record => {

                const visitId =
                  record.visitId ||
                  record.visitorId ||
                  record.memberId ||
                  record.idVisit ||
                  '';


                const visit =
                  visitMap.get(
                    visitId
                  ) ||
                  null;


                const fullName =
                  record.visitName ||
                  record.visitorName ||
                  record.memberName ||
                  record.name ||
                  `${visit?.firstName || ''} ${visit?.lastName || ''}`.trim() ||
                  'Visita';


                const entryAt =
                  record.entryAt ||
                  record.createdAt ||
                  null;


                const exitAt =
                  record.exitAt ||
                  null;


                const durationMinutes =
                  Number(
                    record.durationMinutes ||
                    0
                  ) ||
                  (
                    entryAt &&
                    exitAt
                      ? Math.max(
                          0,
                          Math.round(
                            (
                              new Date(exitAt) -
                              new Date(entryAt)
                            ) /
                            60000
                          )
                        )
                      : 0
                  );


                return {
                  ...record,

                  sourceType:
                    'visit',

                  visit,
                  visitId,

                  fullName,

                  phone:
                    visit?.phone ||
                    visit?.telephone ||
                    '',

                  planId:
                    'visita',

                  planLabel:
                    visit?.planLabel ||
                    visit?.visitType ||
                    'Visita temporal',

                  entryAt,
                  exitAt,

                  entryDateKey:
                    getLocalDateKey(
                      entryAt
                    ),

                  durationMinutes
                };

              }
            );


        // ================================================
        // MIEMBROS CON PLAN POR DÍAS (GYM-xxxxx)
        // ================================================

        const shortPlanMemberRecords =
          memberAttendance
            .map(
              record => {

                const memberId =
                  record.memberId ||
                  '';


                const member =
                  memberMap.get(
                    memberId
                  ) ||
                  null;


                if (!member) {
                  return null;
                }


                const planInfo =
                  getPlanInfo(
                    member
                  );


                // Mensual y anual NO pertenecen a Visitas.
                if (
                  !planInfo.isDayPlan
                ) {
                  return null;
                }


                const entryAt =
                  record.entryAt ||
                  record.createdAt ||
                  null;


                const exitAt =
                  record.exitAt ||
                  null;


                const durationMinutes =
                  Number(
                    record.durationMinutes ||
                    0
                  ) ||
                  (
                    entryAt &&
                    exitAt
                      ? Math.max(
                          0,
                          Math.round(
                            (
                              new Date(exitAt) -
                              new Date(entryAt)
                            ) /
                            60000
                          )
                        )
                      : 0
                  );


                const fullName =
                  record.memberName ||
                  `${member?.firstName || ''} ${member?.lastName || ''}`.trim() ||
                  'Miembro';


                return {
                  ...record,

                  sourceType:
                    'day-plan-member',

                  visit:
                    null,

                  visitId:
                    memberId,

                  member,

                  fullName,

                  phone:
                    member?.phone ||
                    '',

                  profilePhoto:
                    record.profilePhoto ||
                    member?.profilePhoto ||
                    null,

                  planId:
                    planInfo.planId,

                  planLabel:
                    planInfo.planLabel,

                  planDays:
                    planInfo.days,

                  entryAt,
                  exitAt,

                  entryDateKey:
                    getLocalDateKey(
                      entryAt
                    ),

                  durationMinutes
                };

              }
            )
            .filter(
              Boolean
            );


        return [
          ...temporaryVisitRecords,
          ...shortPlanMemberRecords
        ]
          .filter(
            record =>
              Boolean(
                record.entryAt
              )
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

      },
      [
        attendance,
        visitMap,
        memberAttendance,
        memberMap
      ]
    );


  // ======================================================
  // FILTRAR POR DÍA Y BÚSQUEDA
  // ======================================================

  const filteredRecords =
    useMemo(
      () => {

        const term =
          searchTerm
            .trim()
            .toLowerCase();


        return dailyVisitRecords.filter(
          record => {

            const matchesDate =
              !selectedDate ||
              record.entryDateKey ===
                selectedDate;


            const matchesSearch =
              !term ||
              record.fullName
                .toLowerCase()
                .includes(
                  term
                ) ||
              String(
                record.visitId ||
                ''
              )
                .toLowerCase()
                .includes(
                  term
                ) ||
              String(
                record.phone ||
                record.visit?.phone ||
                ''
              )
                .toLowerCase()
                .includes(
                  term
                );


            return (
              matchesDate &&
              matchesSearch
            );

          }
        );

      },
      [
        dailyVisitRecords,
        selectedDate,
        searchTerm
      ]
    );


  // ======================================================
  // ESTADÍSTICAS DEL DÍA SELECCIONADO
  // ======================================================

  const selectedDayRecords =
    useMemo(
      () =>
        dailyVisitRecords.filter(
          record =>
            !selectedDate ||
            record.entryDateKey ===
              selectedDate
        ),
      [
        dailyVisitRecords,
        selectedDate
      ]
    );


  const insideNow =
    selectedDayRecords.filter(
      record =>
        record.status ===
          'inside' &&
        !record.exitAt
    ).length;


  const exits =
    selectedDayRecords.filter(
      record =>
        Boolean(
          record.exitAt
        )
    ).length;


  const uniqueVisitors =
    new Set(
      selectedDayRecords.map(
        record =>
          record.visitId ||
          record.fullName
      )
    ).size;


  // ======================================================
  // PAGINACIÓN
  // ======================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRecords.length /
        ITEMS_PER_PAGE
      )
    );


  const paginatedRecords =
    useMemo(
      () => {

        const start =
          (currentPage - 1) *
          ITEMS_PER_PAGE;


        return filteredRecords.slice(
          start,
          start + ITEMS_PER_PAGE
        );

      },
      [
        filteredRecords,
        currentPage
      ]
    );


  useEffect(
    () => {

      setCurrentPage(1);

    },
    [
      selectedDate,
      searchTerm
    ]
  );


  useEffect(
    () => {

      if (
        currentPage > totalPages
      ) {

        setCurrentPage(
          totalPages
        );

      }

    },
    [
      currentPage,
      totalPages
    ]
  );


  // ======================================================
  // CAMBIAR DÍA
  // ======================================================

  const changeDay = (
    offset
  ) => {

    const base =
      selectedDate
        ? new Date(
            `${selectedDate}T12:00:00`
          )
        : new Date();


    base.setDate(
      base.getDate() +
      offset
    );


    setSelectedDate(
      getLocalDateKey(
        base
      )
    );

  };


  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Visitas"
      />


      <div className="flex-1 lg:ml-0 min-w-0">

        <Header />


        <main className="p-6 space-y-6">

          {/* HEADER */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <h1 className="text-2xl font-bold text-white">
                Visitas por día
              </h1>

              <p className="text-gray-400">
                Accesos de visitas temporales y miembros con planes por días.
              </p>

            </div>


            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/access'
                  )
                }
                className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] flex items-center gap-2"
              >

                <QrCode
                  size={18}
                />

                Terminal de visitas

              </button>


              <button
                type="button"
                onClick={loadData}
                className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2"
              >

                <UserCheck
                  size={18}
                />

                Actualizar historial

              </button>

            </div>

          </div>


          {/* SELECTOR DEL DÍA */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
                <Calendar
                  size={19}
                  className="text-[#00ff88]"
                />
              </div>

              <div>
                <p className="text-white font-semibold">
                  Día consultado
                </p>
                <p className="text-gray-500 text-sm">
                  {formatDate(selectedDate)}
                </p>
              </div>

            </div>


            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  changeDay(-1)
                }
                className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-[#00ff88]/40 flex items-center justify-center"
              >
                <ChevronLeft size={18} />
              </button>


              <input
                type="date"
                value={selectedDate}
                onChange={event =>
                  setSelectedDate(
                    event.target.value
                  )
                }
                className="h-10 bg-[#171717] border border-[#2a2a2a] rounded-xl px-3 text-white focus:border-[#00ff88] focus:outline-none"
              />


              <button
                type="button"
                onClick={() =>
                  changeDay(1)
                }
                className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-[#00ff88]/40 flex items-center justify-center"
              >
                <ChevronRight size={18} />
              </button>


              <button
                type="button"
                onClick={() =>
                  setSelectedDate(
                    getLocalDateKey()
                  )
                }
                className="h-10 px-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] font-semibold text-sm"
              >
                Hoy
              </button>

            </div>

          </div>


          {/* STATS */}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Accesos temporales</p>
                  <p className="text-white text-2xl font-bold mt-1">
                    {selectedDayRecords.length}
                  </p>
                </div>
                <Users className="text-gray-500" />
              </div>
            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Personas diferentes</p>
                  <p className="text-[#00ff88] text-2xl font-bold mt-1">
                    {uniqueVisitors}
                  </p>
                </div>
                <LogIn className="text-[#00ff88]" />
              </div>
            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Dentro ahora</p>
                  <p className="text-blue-400 text-2xl font-bold mt-1">
                    {insideNow}
                  </p>
                </div>
                <UserCheck className="text-blue-400" />
              </div>
            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Salidas del día</p>
                  <p className="text-white text-2xl font-bold mt-1">
                    {exits}
                  </p>
                </div>
                <LogOut className="text-gray-400" />
              </div>
            </div>

          </div>


          {/* AVISO */}

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle
                size={20}
                className="text-blue-400 shrink-0"
              />
              <div>
                <p className="text-white text-sm font-medium">
                  Visitas y planes por días
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Este apartado muestra visitas temporales y accesos de miembros con planes por días (7 y 15 días). Los planes mensuales y anuales continúan únicamente en Asistencias.
                </p>
              </div>
            </div>
          </div>


          {/* BUSCADOR */}

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar visita por nombre, teléfono o ID..."
              value={searchTerm}
              onChange={event =>
                setSearchTerm(
                  event.target.value
                )
              }
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none"
            />
          </div>


          {/* TABLA DE VISITAS DEL DÍA */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

            {
              filteredRecords.length ===
              0
                ? (

                    <div className="text-center py-16">
                      <UserCheck
                        size={48}
                        className="text-gray-600 mx-auto mb-4"
                      />
                      <h3 className="text-white font-bold text-xl">
                        No hay visitas para este día
                      </h3>
                      <p className="text-gray-400 text-sm mt-2">
                        Cambia la fecha o registra un acceso de una visita o de un miembro con plan por días.
                      </p>
                    </div>

                  )
                : (

                    <>

                      <div className="overflow-x-auto">

                        <table className="w-full">

                          <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                            <tr>
                              <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase">Visita</th>
                              <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase">Entrada</th>
                              <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase">Salida</th>
                              <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase">Tiempo</th>
                              <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase">Método</th>
                              <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase">Estado</th>
                            </tr>
                          </thead>


                          <tbody>

                            {
                              paginatedRecords.map(
                                record => {

                                  const method =
                                    getMethodData(
                                      record.method ||
                                      record.entryMethod
                                    );

                                  const MethodIcon =
                                    method.icon;

                                  return (

                                    <tr
                                      key={
                                        record.id ||
                                        `${record.visitId}-${record.entryAt}`
                                      }
                                      className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#151515] transition-colors"
                                    >

                                      <td className="px-4 py-4">
                                        <p className="text-white font-medium">
                                          {record.fullName}
                                        </p>
                                        <p className="text-gray-500 text-xs font-mono mt-1">
                                          {record.visitId || 'VISITA'}
                                        </p>

                                        <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-[#00ff88]/10 text-[#00ff88] text-[11px] font-semibold">
                                          {record.planLabel || 'Visita temporal'}
                                        </span>
                                      </td>


                                      <td className="px-4 py-4">
                                        <p className="text-white text-sm">
                                          {formatTime(record.entryAt)}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1">
                                          {formatDate(record.entryAt)}
                                        </p>
                                      </td>


                                      <td className="px-4 py-4 text-gray-300 text-sm">
                                        {record.exitAt ? formatTime(record.exitAt) : '—'}
                                      </td>


                                      <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                                          <Clock size={16} className="text-gray-500" />
                                          {
                                            record.exitAt
                                              ? `${record.durationMinutes} min`
                                              : 'En el gimnasio'
                                          }
                                        </div>
                                      </td>


                                      <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                          <MethodIcon
                                            size={17}
                                            className={method.color}
                                          />
                                          <span className="text-gray-300 text-sm">
                                            {method.label}
                                          </span>
                                        </div>
                                      </td>


                                      <td className="px-4 py-4">
                                        <span
                                          className={`
                                            inline-flex
                                            items-center
                                            gap-2
                                            px-2.5
                                            py-1
                                            rounded-full
                                            text-xs
                                            font-medium
                                            ${
                                              record.status === 'inside' && !record.exitAt
                                                ? 'bg-blue-500/10 text-blue-400'
                                                : 'bg-[#00ff88]/10 text-[#00ff88]'
                                            }
                                          `}
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              record.status === 'inside' && !record.exitAt
                                                ? 'bg-blue-400'
                                                : 'bg-[#00ff88]'
                                            }`}
                                          />
                                          {
                                            record.status === 'inside' && !record.exitAt
                                              ? 'Dentro'
                                              : 'Finalizada'
                                          }
                                        </span>
                                      </td>

                                    </tr>

                                  );

                                }
                              )
                            }

                          </tbody>

                        </table>

                      </div>


                      <div className="px-4 py-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4">

                        <p className="text-gray-500 text-sm">
                          Mostrando {paginatedRecords.length} de {filteredRecords.length} visitas del día
                        </p>


                        {
                          totalPages > 1 &&
                          (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setCurrentPage(page =>
                                    Math.max(1, page - 1)
                                  )
                                }
                                disabled={currentPage === 1}
                                className="px-3 h-9 rounded-lg bg-[#171717] border border-[#2a2a2a] text-gray-300 disabled:opacity-40"
                              >
                                Anterior
                              </button>

                              <span className="text-gray-400 text-sm px-2">
                                Página <span className="text-white font-semibold">{currentPage}</span> de {totalPages}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setCurrentPage(page =>
                                    Math.min(totalPages, page + 1)
                                  )
                                }
                                disabled={currentPage === totalPages}
                                className="px-3 h-9 rounded-lg bg-[#171717] border border-[#2a2a2a] text-gray-300 disabled:opacity-40"
                              >
                                Siguiente
                              </button>
                            </div>
                          )
                        }

                      </div>

                    </>

                  )
            }

          </div>

        </main>

      </div>

    </div>

  );

};


export default VisitsPage;