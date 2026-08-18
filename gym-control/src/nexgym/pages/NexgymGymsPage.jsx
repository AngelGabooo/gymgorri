// src/nexgym/pages/NexgymGymsPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  Building2,
  Search,
  Plus,
  Users,
  UserCog,
  CalendarDays,
  Wifi,
  ChevronRight,
  CircleDollarSign,
  AlertTriangle
} from 'lucide-react';

import {
  getNexgymGymsWithStats
} from '../services/nexgymGymService';


// ======================================================
// PAGE
// ======================================================

const NexgymGymsPage = () => {

  const navigate =
    useNavigate();


  const [
    gyms,
    setGyms
  ] = useState([]);


  const [
    search,
    setSearch
  ] = useState('');


  const [
    filter,
    setFilter
  ] = useState('all');


  // ======================================================
  // CARGAR
  // ======================================================

  const loadGyms =
    () => {

      setGyms(
        getNexgymGymsWithStats()
      );

    };


  useEffect(
    () => {

      loadGyms();


      window.addEventListener(
        'nexgym-gyms-update',
        loadGyms
      );


      window.addEventListener(
        'gym-storage-update',
        loadGyms
      );


      return () => {

        window.removeEventListener(
          'nexgym-gyms-update',
          loadGyms
        );


        window.removeEventListener(
          'gym-storage-update',
          loadGyms
        );

      };

    },
    []
  );


  // ======================================================
  // ESTADO REAL
  // ======================================================

  const getGymStatus =
    (
      gym
    ) => {

      if (
        gym?.access
          ?.accountStatus ===
        'inactive'
      ) {

        return 'inactive';

      }


      return (
        gym?.subscription
          ?.status ||
        'active'
      );

    };


  // ======================================================
  // FILTRADO
  // ======================================================

  const filteredGyms =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return gyms.filter(
          gym => {

            const status =
              getGymStatus(
                gym
              );


            const matchesFilter =
              filter ===
              'all'
                ? true
                : status ===
                  filter;


            const matchesSearch =
              !query ||
              gym.name
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              gym.gymCode
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              gym.owner?.name
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              gym.access?.email
                ?.toLowerCase()
                .includes(
                  query
                );


            return (
              matchesFilter &&
              matchesSearch
            );

          }
        );

      },
      [
        gyms,
        search,
        filter
      ]
    );


  // ======================================================
  // STATS
  // ======================================================

  const stats =
    useMemo(
      () => {

        const active =
          gyms.filter(
            gym =>
              getGymStatus(
                gym
              ) ===
              'active'
          ).length;


        const trial =
          gyms.filter(
            gym =>
              getGymStatus(
                gym
              ) ===
              'trial'
          ).length;


        const pending =
          gyms.filter(
            gym =>
              getGymStatus(
                gym
              ) ===
              'past_due'
          ).length;


        const suspended =
          gyms.filter(
            gym =>
              getGymStatus(
                gym
              ) ===
              'suspended'
          ).length;


        const inactive =
          gyms.filter(
            gym =>
              getGymStatus(
                gym
              ) ===
              'inactive'
          ).length;


        return {
          total:
            gyms.length,
          active,
          trial,
          pending,
          suspended,
          inactive
        };

      },
      [
        gyms
      ]
    );


  // ======================================================
  // FECHA
  // ======================================================

  const formatDate =
    (
      date
    ) => {

      if (!date) {

        return 'Sin fecha';

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
        new Date(
          `${date}T12:00:00`
        )
      );

    };


  const formatDateTime =
    (
      value
    ) => {

      if (!value) {

        return 'Nunca';

      }


      return new Intl.DateTimeFormat(
        'es-MX',
        {
          day:
            '2-digit',
          month:
            'short',
          hour:
            '2-digit',
          minute:
            '2-digit'
        }
      ).format(
        new Date(
          value
        )
      );

    };


  return (

    <div className="p-8">


      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">

        <div>

          <p className="text-gray-500 text-sm">
            Clientes registrados en tu plataforma
          </p>

          <p className="text-gray-600 text-xs mt-1">
            {stats.total} gimnasio(s) registrado(s)
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            navigate(
              '/nexgym/gyms/new'
            )
          }
          className="
            h-11
            px-5
            rounded-xl
            bg-[#00ff88]
            text-black
            font-semibold
            text-sm
            flex
            items-center
            justify-center
            gap-2
            hover:bg-[#00e67a]
            transition-all
          "
        >

          <Plus
            className="w-4 h-4"
          />

          Nuevo gimnasio

        </button>

      </div>


      {/* ================================================== */}
      {/* RESUMEN */}
      {/* ================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">

        <SummaryCard
          label="Total"
          value={
            stats.total
          }
        />

        <SummaryCard
          label="Activos"
          value={
            stats.active
          }
        />

        <SummaryCard
          label="Prueba"
          value={
            stats.trial
          }
        />

        <SummaryCard
          label="Pendientes"
          value={
            stats.pending
          }
        />

        <SummaryCard
          label="Suspendidos"
          value={
            stats.suspended
          }
        />

        <SummaryCard
          label="Desactivados"
          value={
            stats.inactive
          }
        />

      </div>


      {/* ================================================== */}
      {/* BUSCADOR */}
      {/* ================================================== */}

      <div className="bg-[#111111] border border-[#202020] rounded-2xl p-4 mb-5">

        <div className="flex flex-col xl:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                w-4
                h-4
                text-gray-600
              "
            />

            <input
              type="text"
              value={
                search
              }
              onChange={
                event =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Buscar gimnasio, código, propietario o correo..."
              className="
                w-full
                h-11
                bg-[#0c0c0c]
                border
                border-[#242424]
                rounded-xl
                pl-11
                pr-4
                outline-none
                text-white
                text-sm
                placeholder:text-gray-700
                focus:border-[#00ff88]/40
              "
            />

          </div>


          <select
            value={
              filter
            }
            onChange={
              event =>
                setFilter(
                  event.target.value
                )
            }
            className="
              h-11
              min-w-[190px]
              bg-[#0c0c0c]
              border
              border-[#242424]
              rounded-xl
              px-4
              text-gray-300
              text-sm
              outline-none
            "
          >

            <option value="all">
              Todos los estados
            </option>

            <option value="active">
              Activos
            </option>

            <option value="trial">
              Periodo de prueba
            </option>

            <option value="past_due">
              Pago pendiente
            </option>

            <option value="suspended">
              Suspendidos
            </option>

            <option value="inactive">
              Desactivados
            </option>

          </select>

        </div>

      </div>


      {/* ================================================== */}
      {/* LISTA */}
      {/* ================================================== */}

      <div className="bg-[#111111] border border-[#202020] rounded-2xl overflow-hidden">

        {
          filteredGyms.length ===
          0
            ? (

              <div className="py-20 text-center">

                <Building2
                  className="w-12 h-12 text-gray-800 mx-auto"
                />

                <p className="text-white font-medium mt-4">
                  No hay gimnasios
                </p>

                <p className="text-gray-600 text-sm mt-1">
                  Crea tu primer cliente desde Nuevo gimnasio.
                </p>

              </div>

            )
            : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="border-b border-[#202020]">

                      <TableHeader>
                        Gimnasio
                      </TableHeader>

                      <TableHeader>
                        Propietario
                      </TableHeader>

                      <TableHeader>
                        Usuarios
                      </TableHeader>

                      <TableHeader>
                        Miembros
                      </TableHeader>

                      <TableHeader>
                        Próximo pago
                      </TableHeader>

                      <TableHeader>
                        Estado
                      </TableHeader>

                      <TableHeader>
                        Última conexión
                      </TableHeader>

                      <TableHeader>
                        Acción
                      </TableHeader>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      filteredGyms.map(
                        gym => {

                          const status =
                            getGymStatus(
                              gym
                            );


                          const statusData =
                            getStatusData(
                              status
                            );


                          return (

                            <tr
                              key={
                                gym.id
                              }
                              className="
                                border-b
                                border-[#1b1b1b]
                                last:border-b-0
                                hover:bg-[#141414]
                                transition-all
                              "
                            >

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-3">

                                  <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/10 flex items-center justify-center">

                                    <Building2
                                      className="w-5 h-5 text-[#00ff88]"
                                    />

                                  </div>


                                  <div>

                                    <p className="text-white text-sm font-medium">
                                      {gym.name}
                                    </p>

                                    <p className="text-gray-600 text-xs mt-1">
                                      {gym.gymCode}
                                    </p>

                                  </div>

                                </div>

                              </td>


                              <td className="px-5 py-4">

                                <p className="text-gray-300 text-sm">
                                  {gym.owner?.name || 'Sin propietario'}
                                </p>

                                <p className="text-gray-600 text-xs mt-1">
                                  {gym.access?.email || 'Sin correo'}
                                </p>

                              </td>


                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2 text-gray-300 text-sm">

                                  <UserCog
                                    className="w-4 h-4 text-gray-600"
                                  />

                                  {gym.usersCount || 0}

                                </div>

                              </td>


                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2 text-gray-300 text-sm">

                                  <Users
                                    className="w-4 h-4 text-gray-600"
                                  />

                                  {gym.membersCount || 0}

                                </div>

                              </td>


                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2">

                                  <CalendarDays
                                    className="w-4 h-4 text-gray-600"
                                  />

                                  <span className="text-gray-300 text-sm whitespace-nowrap">
                                    {
                                      formatDate(
                                        gym.subscription
                                          ?.nextPaymentDate
                                      )
                                    }
                                  </span>

                                </div>

                              </td>


                              <td className="px-5 py-4">

                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    border
                                    rounded-full
                                    px-2.5
                                    py-1
                                    text-xs
                                    font-medium

                                    ${statusData.className}
                                  `}
                                >
                                  {statusData.label}
                                </span>

                              </td>


                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2">

                                  <Wifi
                                    className="w-4 h-4 text-gray-600"
                                  />

                                  <span className="text-gray-400 text-xs whitespace-nowrap">
                                    {
                                      formatDateTime(
                                        gym.lastConnectionAt
                                      )
                                    }
                                  </span>

                                </div>

                              </td>


                              <td className="px-5 py-4">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/nexgym/gyms/${gym.id}`
                                    )
                                  }
                                  className="
                                    h-9
                                    px-3
                                    rounded-lg
                                    bg-[#171717]
                                    border
                                    border-[#272727]
                                    text-gray-300
                                    text-xs
                                    flex
                                    items-center
                                    gap-2
                                    hover:text-white
                                    hover:border-[#3a3a3a]
                                  "
                                >

                                  Administrar

                                  <ChevronRight
                                    className="w-4 h-4"
                                  />

                                </button>

                              </td>

                            </tr>

                          );

                        }
                      )
                    }

                  </tbody>

                </table>

              </div>

            )
        }

      </div>


      {/* ================================================== */}
      {/* INFORMACIÓN */}
      {/* ================================================== */}

      <div className="mt-5 flex items-start gap-3 bg-[#111111] border border-[#202020] rounded-2xl p-4">

        <CircleDollarSign
          className="w-5 h-5 text-[#00ff88] mt-0.5"
        />

        <div>

          <p className="text-white text-sm font-medium">
            Administración de clientes
          </p>

          <p className="text-gray-500 text-xs mt-1">
            Desde el botón Administrar puedes registrar pagos, restablecer contraseñas, suspender, reactivar o desactivar un gimnasio.
          </p>

        </div>

      </div>

    </div>

  );

};


// ======================================================
// STATUS
// ======================================================

const getStatusData = (
  status
) => {

  const statuses = {

    active: {
      label:
        'Activo',
      className:
        'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20'
    },

    trial: {
      label:
        'Prueba',
      className:
        'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },

    past_due: {
      label:
        'Pago pendiente',
      className:
        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    },

    suspended: {
      label:
        'Suspendido',
      className:
        'bg-orange-500/10 text-orange-400 border-orange-500/20'
    },

    inactive: {
      label:
        'Desactivado',
      className:
        'bg-red-500/10 text-red-400 border-red-500/20'
    }

  };


  return (
    statuses[
      status
    ] ||
    statuses.active
  );

};


// ======================================================
// SUMMARY
// ======================================================

const SummaryCard = ({
  label,
  value
}) => {

  return (

    <div className="bg-[#111111] border border-[#202020] rounded-xl p-4">

      <p className="text-gray-600 text-xs">
        {label}
      </p>

      <p className="text-white text-2xl font-semibold mt-1">
        {value}
      </p>

    </div>

  );

};


// ======================================================
// TABLE HEADER
// ======================================================

const TableHeader = ({
  children
}) => {

  return (

    <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-600 whitespace-nowrap">
      {children}
    </th>

  );

};


export default NexgymGymsPage;