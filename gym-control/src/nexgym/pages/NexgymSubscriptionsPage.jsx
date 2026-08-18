// src/nexgym/pages/NexgymSubscriptionsPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  Search,
  CreditCard,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Building2,
  ChevronRight,
  CircleDollarSign
} from 'lucide-react';

import {
  getNexgymSubscriptions
} from '../services/nexgymGymService';


const NexgymSubscriptionsPage = () => {

  const navigate =
    useNavigate();


  const [
    subscriptions,
    setSubscriptions
  ] = useState([]);


  const [
    search,
    setSearch
  ] = useState('');


  const [
    statusFilter,
    setStatusFilter
  ] = useState('all');


  const loadData =
    () => {

      setSubscriptions(
        getNexgymSubscriptions()
      );

    };


  useEffect(
    () => {

      loadData();


      window.addEventListener(
        'nexgym-gyms-update',
        loadData
      );


      window.addEventListener(
        'gym-storage-update',
        loadData
      );


      return () => {

        window.removeEventListener(
          'nexgym-gyms-update',
          loadData
        );


        window.removeEventListener(
          'gym-storage-update',
          loadData
        );

      };

    },
    []
  );


  const filtered =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return subscriptions.filter(
          item => {

            const matchesSearch =
              !query ||
              item.gymName
                .toLowerCase()
                .includes(
                  query
                ) ||
              item.gymCode
                .toLowerCase()
                .includes(
                  query
                ) ||
              item.ownerName
                .toLowerCase()
                .includes(
                  query
                ) ||
              item.accessEmail
                .toLowerCase()
                .includes(
                  query
                );


            const matchesStatus =
              statusFilter ===
              'all'
                ? true
                : item.status ===
                  statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        subscriptions,
        search,
        statusFilter
      ]
    );


  const stats =
    useMemo(
      () => {

        return {

          total:
            subscriptions.length,

          active:
            subscriptions.filter(
              item =>
                item.status ===
                'active'
            ).length,

          trial:
            subscriptions.filter(
              item =>
                item.status ===
                'trial'
            ).length,

          pastDue:
            subscriptions.filter(
              item =>
                item.status ===
                'past_due'
            ).length,

          suspended:
            subscriptions.filter(
              item =>
                item.status ===
                'suspended'
            ).length,

          inactive:
            subscriptions.filter(
              item =>
                item.status ===
                'inactive'
            ).length

        };

      },
      [
        subscriptions
      ]
    );


  const formatDate =
    (
      value
    ) => {

      if (!value) {

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
          `${value}T12:00:00`
        )
      );

    };


  const getDueText =
    (
      item
    ) => {

      if (
        item.daysDifference ===
        null
      ) {

        return 'Sin fecha';

      }


      if (
        item.daysDifference <
        0
      ) {

        return `${Math.abs(
          item.daysDifference
        )} día(s) de atraso`;

      }


      if (
        item.daysDifference ===
        0
      ) {

        return 'Vence hoy';

      }


      return `Faltan ${item.daysDifference} día(s)`;

    };


  return (

    <div className="p-8">


      <div className="mb-7">

        <p className="text-gray-500 text-sm">
          Control global de las rentas de NEXGYM
        </p>

      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">

        <Stat
          label="Total"
          value={
            stats.total
          }
        />

        <Stat
          label="Activos"
          value={
            stats.active
          }
        />

        <Stat
          label="Prueba"
          value={
            stats.trial
          }
        />

        <Stat
          label="Pendientes"
          value={
            stats.pastDue
          }
        />

        <Stat
          label="Suspendidos"
          value={
            stats.suspended
          }
        />

        <Stat
          label="Desactivados"
          value={
            stats.inactive
          }
        />

      </div>


      <div className="bg-[#111111] border border-[#202020] rounded-2xl p-4 mb-5">

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
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
              placeholder="Buscar gimnasio, propietario o correo..."
              className="w-full h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl pl-11 pr-4 text-white text-sm outline-none placeholder:text-gray-700"
            />

          </div>


          <select
            value={
              statusFilter
            }
            onChange={
              event =>
                setStatusFilter(
                  event.target.value
                )
            }
            className="h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl px-4 text-gray-300 text-sm outline-none"
          >

            <option value="all">
              Todos los estados
            </option>

            <option value="active">
              Activos
            </option>

            <option value="trial">
              Prueba
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


      <div className="bg-[#111111] border border-[#202020] rounded-2xl overflow-hidden">

        {
          filtered.length ===
          0
            ? (

              <div className="py-16 text-center">

                <CreditCard
                  className="w-10 h-10 text-gray-800 mx-auto"
                />

                <p className="text-white mt-4">
                  No hay suscripciones
                </p>

              </div>

            )
            : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="border-b border-[#202020]">

                      <TH>
                        Gimnasio
                      </TH>

                      <TH>
                        Estado
                      </TH>

                      <TH>
                        Precio
                      </TH>

                      <TH>
                        Próximo pago
                      </TH>

                      <TH>
                        Situación
                      </TH>

                      <TH>
                        Miembros
                      </TH>

                      <TH>
                        Acción
                      </TH>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      filtered.map(
                        item => {

                          const status =
                            getStatusData(
                              item.status
                            );


                          const overdue =
                            item.daysDifference !==
                              null &&
                            item.daysDifference <
                              0;


                          return (

                            <tr
                              key={
                                item.gymId
                              }
                              className="border-b border-[#1b1b1b] last:border-b-0 hover:bg-[#141414]"
                            >

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-3">

                                  <div className="w-10 h-10 bg-[#00ff88]/10 rounded-xl flex items-center justify-center">

                                    <Building2
                                      className="w-5 h-5 text-[#00ff88]"
                                    />

                                  </div>

                                  <div>

                                    <p className="text-white text-sm font-medium">
                                      {item.gymName}
                                    </p>

                                    <p className="text-gray-600 text-xs mt-1">
                                      {item.gymCode}
                                    </p>

                                  </div>

                                </div>

                              </td>


                              <td className="px-5 py-4">

                                <span
                                  className={`
                                    inline-flex
                                    border
                                    rounded-full
                                    px-2.5
                                    py-1
                                    text-xs

                                    ${status.className}
                                  `}
                                >
                                  {status.label}
                                </span>

                              </td>


                              <td className="px-5 py-4">

                                <p className="text-white text-sm font-semibold">
                                  $
                                  {
                                    item.finalPrice.toFixed(
                                      2
                                    )
                                  }
                                </p>

                                {
                                  item.discount >
                                  0 &&
                                  (

                                    <p className="text-gray-600 text-xs mt-1">
                                      Descuento $
                                      {
                                        item.discount.toFixed(
                                          2
                                        )
                                      }
                                    </p>

                                  )
                                }

                              </td>


                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2">

                                  <CalendarDays
                                    className="w-4 h-4 text-gray-600"
                                  />

                                  <span className="text-gray-300 text-sm whitespace-nowrap">
                                    {
                                      formatDate(
                                        item.nextPaymentDate
                                      )
                                    }
                                  </span>

                                </div>

                              </td>


                              <td className="px-5 py-4">

                                <div
                                  className={`
                                    flex
                                    items-center
                                    gap-2
                                    text-xs

                                    ${
                                      overdue
                                        ? 'text-red-400'
                                        : item.daysDifference ===
                                          0
                                          ? 'text-yellow-400'
                                          : 'text-gray-500'
                                    }
                                  `}
                                >

                                  {
                                    overdue
                                      ? (
                                        <AlertTriangle
                                          className="w-4 h-4"
                                        />
                                      )
                                      : item.daysDifference ===
                                        0
                                        ? (
                                          <Clock3
                                            className="w-4 h-4"
                                          />
                                        )
                                        : (
                                          <CheckCircle2
                                            className="w-4 h-4"
                                          />
                                        )
                                  }

                                  {
                                    getDueText(
                                      item
                                    )
                                  }

                                </div>

                              </td>


                              <td className="px-5 py-4 text-gray-300 text-sm">
                                {item.membersCount}
                              </td>


                              <td className="px-5 py-4">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/nexgym/gyms/${item.gymId}`
                                    )
                                  }
                                  className="h-9 px-3 rounded-lg bg-[#171717] border border-[#282828] text-gray-300 text-xs flex items-center gap-2 hover:text-white"
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


      <div className="mt-5 bg-[#111111] border border-[#202020] rounded-2xl p-4 flex items-start gap-3">

        <CircleDollarSign
          className="w-5 h-5 text-[#00ff88] mt-0.5"
        />

        <p className="text-gray-500 text-xs leading-relaxed">
          Cuando la fecha de próximo pago ya pasó, NEXGYM cambia automáticamente el estado a “Pago pendiente”. La suspensión sigue siendo una acción manual desde el perfil del cliente.
        </p>

      </div>

    </div>

  );

};


const getStatusData = (
  status
) => {

  const data = {

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
    data[
      status
    ] ||
    data.active
  );

};


const Stat = ({
  label,
  value
}) => (

  <div className="bg-[#111111] border border-[#202020] rounded-xl p-4">

    <p className="text-gray-600 text-xs">
      {label}
    </p>

    <p className="text-white text-2xl font-semibold mt-1">
      {value}
    </p>

  </div>

);


const TH = ({
  children
}) => (

  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-600 whitespace-nowrap">
    {children}
  </th>

);


export default NexgymSubscriptionsPage;