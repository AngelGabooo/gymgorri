// src/components/Members/InactiveMembersPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock3,
  Eye,
  Search,
  ShieldAlert,
  UserRoundCheck,
  UsersRound
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

import {
  useGymSettings
} from '../../context/GymSettingsContext';

import {
  buildRetentionMembers,
  getRetentionStats
} from '../../services/retentionService';

import WhatsAppButton from '../WhatsApp/WhatsAppButton';


const formatDate = (
  value
) => {

  if (!value) {
    return 'Nunca';
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
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


const getLevelClasses = (
  level
) => {

  const classes = {
    followup:
      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    risk:
      'bg-orange-500/10 text-orange-400 border-orange-500/20',
    inactive:
      'bg-red-500/10 text-red-400 border-red-500/20'
  };


  return (
    classes[level] ||
    'bg-gray-500/10 text-gray-400 border-gray-500/20'
  );

};


const InactiveMembersPage =
  () => {

    const navigate =
      useNavigate();


    const {
      settings
    } = useGymSettings();


    const [
      refreshToken,
      setRefreshToken
    ] = useState(0);


    const [
      searchTerm,
      setSearchTerm
    ] = useState('');


    const [
      activeFilter,
      setActiveFilter
    ] = useState(
      'all'
    );


    useEffect(
      () => {

        const refresh =
          () =>
            setRefreshToken(
              previous =>
                previous + 1
            );


        window.addEventListener(
          'gym-storage-update',
          refresh
        );

        window.addEventListener(
          'storage',
          refresh
        );

        window.addEventListener(
          'gym-settings-update',
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

          window.removeEventListener(
            'gym-settings-update',
            refresh
          );

        };

      },
      []
    );


    const members =
      useMemo(
        () =>
          buildRetentionMembers({
            settings
          }),
        [
          settings,
          refreshToken
        ]
      );


    const stats =
      useMemo(
        () =>
          getRetentionStats({
            settings
          }),
        [
          settings,
          refreshToken
        ]
      );


    const filteredMembers =
      useMemo(
        () => {

          const term =
            searchTerm
              .trim()
              .toLowerCase();


          return members.filter(
            member => {

              if (
                member.retention.level ===
                'frequent'
              ) {
                return false;
              }


              if (
                activeFilter !==
                  'all' &&
                member.retention.level !==
                  activeFilter
              ) {
                return false;
              }


              if (!term) {
                return true;
              }


              const searchable =
                [
                  member.firstName,
                  member.lastName,
                  member.id,
                  member.phone,
                  member.email
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase();


              return searchable.includes(
                term
              );

            }
          );

        },
        [
          members,
          activeFilter,
          searchTerm
        ]
      );




    const filters = [
      {
        id:
          'all',
        label:
          'Todos',
        count:
          stats.totalToContact
      },
      {
        id:
          'followup',
        label:
          'Seguimiento',
        count:
          stats.followup
      },
      {
        id:
          'risk',
        label:
          'En riesgo',
        count:
          stats.risk
      },
      {
        id:
          'inactive',
        label:
          'Inactivos',
        count:
          stats.inactive
      }
    ];


    return (

      <div className="min-h-screen bg-[#0a0a0a] flex">

        <Sidebar
          activePage="Retención"
        />


        <div className="flex-1 lg:ml-0">

          <Header />


          <main className="p-6 space-y-6">

            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">

              <div>

                <div className="flex items-center gap-2 text-[#00ff88] text-xs font-bold uppercase tracking-[0.18em] mb-2">

                  <Activity
                    size={15}
                  />

                  Retención de miembros

                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Clientes que requieren atención
                </h1>

                <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                  Se muestran únicamente miembros con suscripción activa que han dejado de asistir según los límites definidos en Configuración.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/settings'
                  )
                }
                className="px-4 py-2.5 bg-[#111111] border border-[#242424] rounded-xl text-gray-300 text-sm hover:border-[#00ff88]/40 transition-colors"
              >
                Configurar retención
              </button>

            </div>


            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">

              <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-5">
                <UsersRound
                  size={20}
                  className="text-[#00ff88]"
                />
                <p className="text-2xl font-black text-white mt-3">
                  {stats.totalToContact}
                </p>
                <p className="text-gray-500 text-xs">
                  Total por contactar
                </p>
              </div>


              <div className="bg-[#111111] border border-yellow-500/15 rounded-xl p-5">
                <Clock3
                  size={20}
                  className="text-yellow-400"
                />
                <p className="text-2xl font-black text-yellow-400 mt-3">
                  {stats.followup}
                </p>
                <p className="text-gray-500 text-xs">
                  Seguimiento
                </p>
              </div>


              <div className="bg-[#111111] border border-orange-500/15 rounded-xl p-5">
                <AlertTriangle
                  size={20}
                  className="text-orange-400"
                />
                <p className="text-2xl font-black text-orange-400 mt-3">
                  {stats.risk}
                </p>
                <p className="text-gray-500 text-xs">
                  Riesgo de abandono
                </p>
              </div>


              <div className="bg-[#111111] border border-red-500/15 rounded-xl p-5">
                <ShieldAlert
                  size={20}
                  className="text-red-400"
                />
                <p className="text-2xl font-black text-red-400 mt-3">
                  {stats.inactive}
                </p>
                <p className="text-gray-500 text-xs">
                  Inactivos
                </p>
              </div>

            </div>


            <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-4">

              <div className="flex flex-col xl:flex-row gap-3">

                <div className="relative flex-1">

                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    type="text"
                    value={
                      searchTerm
                    }
                    onChange={
                      event =>
                        setSearchTerm(
                          event.target.value
                        )
                    }
                    placeholder="Buscar por nombre, ID, teléfono o correo..."
                    className="w-full bg-[#171717] border border-[#292929] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88]/40"
                  />

                </div>


                <div className="flex flex-wrap gap-2">

                  {filters.map(
                    filter => (

                      <button
                        type="button"
                        key={
                          filter.id
                        }
                        onClick={() =>
                          setActiveFilter(
                            filter.id
                          )
                        }
                        className={`
                          px-4
                          py-2.5
                          rounded-xl
                          text-xs
                          font-semibold
                          transition-colors

                          ${
                            activeFilter ===
                            filter.id
                              ? 'bg-[#00ff88] text-black'
                              : 'bg-[#171717] border border-[#292929] text-gray-400'
                          }
                        `}
                      >
                        {filter.label} ({filter.count})
                      </button>

                    )
                  )}

                </div>

              </div>

            </div>


            {
              filteredMembers.length ===
              0
                ? (

                  <div className="bg-[#111111] border border-[#1d1d1d] rounded-2xl py-20 text-center">

                    <UserRoundCheck
                      size={48}
                      className="text-[#00ff88] mx-auto"
                    />

                    <h3 className="text-white text-lg font-bold mt-4">
                      No hay miembros que requieran atención
                    </h3>

                    <p className="text-gray-500 text-sm mt-2">
                      Con los filtros actuales no encontramos clientes inactivos.
                    </p>

                  </div>

                )
                : (

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                    {filteredMembers.map(
                      member => (

                        <div
                          key={
                            member.id
                          }
                          className="bg-[#111111] border border-[#1d1d1d] rounded-2xl p-5 hover:border-[#00ff88]/25 transition-colors"
                        >

                          <div className="flex items-start gap-4">

                            <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#292929] overflow-hidden flex items-center justify-center shrink-0">

                              {
                                member.profilePhoto
                                  ? (

                                    <img
                                      src={
                                        member.profilePhoto
                                      }
                                      alt={
                                        `${member.firstName || ''} ${member.lastName || ''}`
                                      }
                                      className="w-full h-full object-cover"
                                    />

                                  )
                                  : (

                                    <span className="text-[#00ff88] font-black">
                                      {
                                        `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`
                                          .toUpperCase() ||
                                        'M'
                                      }
                                    </span>

                                  )
                              }

                            </div>


                            <div className="flex-1 min-w-0">

                              <div className="flex flex-wrap items-start justify-between gap-2">

                                <div>

                                  <h3 className="text-white font-bold truncate">
                                    {`${member.firstName || ''} ${member.lastName || ''}`.trim()}
                                  </h3>

                                  <p className="text-gray-600 text-xs font-mono">
                                    {member.id}
                                  </p>

                                </div>


                                <span
                                  className={`
                                    px-2.5
                                    py-1
                                    rounded-full
                                    border
                                    text-[10px]
                                    font-bold

                                    ${getLevelClasses(
                                      member.retention.level
                                    )}
                                  `}
                                >
                                  {member.retention.label}
                                </span>

                              </div>


                              <div className="grid grid-cols-2 gap-3 mt-5">

                                <div className="bg-[#171717] border border-[#242424] rounded-xl p-3">

                                  <p className="text-gray-600 text-[10px] uppercase tracking-wider">
                                    Sin asistir
                                  </p>

                                  <p className="text-white font-black text-lg mt-1">
                                    {member.retention.daysWithoutAttendance} días
                                  </p>

                                </div>


                                <div className="bg-[#171717] border border-[#242424] rounded-xl p-3">

                                  <p className="text-gray-600 text-[10px] uppercase tracking-wider">
                                    Última visita
                                  </p>

                                  <p className="text-white text-sm font-semibold mt-1">
                                    {
                                      member.retention.neverAttended
                                        ? 'Nunca'
                                        : formatDate(
                                            member.retention.lastAttendanceAt
                                          )
                                    }
                                  </p>

                                </div>

                              </div>


                              {
                                member.retention.neverAttended &&
                                (

                                  <p className="text-yellow-400/80 text-xs mt-3">
                                    Este miembro todavía no registra ninguna asistencia; el cálculo usa su fecha de registro.
                                  </p>

                                )
                              }


                              <div className="flex items-center gap-2 text-gray-500 text-xs mt-3">

                                <CalendarDays
                                  size={14}
                                />

                                Suscripción vigente hasta{' '}

                                <span className="text-gray-300">
                                  {
                                    formatDate(
                                      member.retention.subscriptionEndDate
                                    )
                                  }
                                </span>

                              </div>


                              <div className="flex flex-wrap gap-2 mt-5">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/members/${member.id}`
                                    )
                                  }
                                  className="flex-1 min-w-[130px] px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#292929] text-white text-sm font-medium hover:border-[#00ff88]/40 flex items-center justify-center gap-2"
                                >
                                  <Eye
                                    size={16}
                                  />

                                  Ver perfil
                                </button>


                                <WhatsAppButton
                                  member={
                                    member
                                  }
                                  defaultType="inactive"
                                  extras={{
                                    inactiveDays:
                                      member.retention?.daysWithoutAttendance ||
                                      member.retention?.daysSinceLastVisit ||
                                      ''
                                  }}
                                  className="flex-1 min-w-[130px] px-4 py-2.5 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-sm font-bold hover:bg-[#00ff88]/15 flex items-center justify-center gap-2"
                                />

                              </div>

                            </div>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )
            }

          </main>

        </div>

      </div>

    );

  };


export default InactiveMembersPage;
