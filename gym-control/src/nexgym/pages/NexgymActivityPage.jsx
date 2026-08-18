// src/nexgym/pages/NexgymActivityPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Activity,
  Search,
  Building2,
  Clock3,
  CreditCard,
  KeyRound,
  Ban,
  PlusCircle,
  LifeBuoy,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

import {
  getNexgymActivity
} from '../services/nexgymGymService';


const NexgymActivityPage = () => {

  const [
    activity,
    setActivity
  ] = useState([]);


  const [
    search,
    setSearch
  ] = useState('');


  const [
    type,
    setType
  ] = useState('all');


  const loadData =
    () => {

      setActivity(
        getNexgymActivity()
      );

    };


  useEffect(
    () => {

      loadData();


      window.addEventListener(
        'nexgym-activity-update',
        loadData
      );


      window.addEventListener(
        'nexgym-gyms-update',
        loadData
      );


      return () => {

        window.removeEventListener(
          'nexgym-activity-update',
          loadData
        );


        window.removeEventListener(
          'nexgym-gyms-update',
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


        return activity.filter(
          item => {

            const matchesSearch =
              !query ||
              item.gymName
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              item.title
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              item.description
                ?.toLowerCase()
                .includes(
                  query
                );


            const matchesType =
              type ===
              'all'
                ? true
                : item.type ===
                  type;


            return (
              matchesSearch &&
              matchesType
            );

          }
        );

      },
      [
        activity,
        search,
        type
      ]
    );


  const formatDateTime =
    (
      value
    ) => {

      if (!value) {

        return '-';

      }


      return new Intl.DateTimeFormat(
        'es-MX',
        {
          day:
            '2-digit',
          month:
            'short',
          year:
            'numeric',
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


  const getIcon =
    (
      activityType
    ) => {

      const icons = {

        gym_created:
          PlusCircle,

        payment:
          CreditCard,

        password_reset:
          KeyRound,

        suspended:
          Ban,

        deactivated:
          Ban,

        reactivated:
          CheckCircle2,

        service_extended:
          RefreshCw,

        support_ticket:
          LifeBuoy,

        support_status:
          LifeBuoy,

        support_resolved:
          CheckCircle2

      };


      return (
        icons[
          activityType
        ] ||
        Activity
      );

    };


  return (

    <div className="p-8">


      {/* RESUMEN */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

        <Metric
          label="Eventos registrados"
          value={
            activity.length
          }
        />

        <Metric
          label="Mostrando"
          value={
            filtered.length
          }
        />

        <Metric
          label="Último movimiento"
          value={
            activity.length
              ? formatDateTime(
                  activity[0]
                    ?.date
                )
              : 'Sin actividad'
          }
          small
        />

      </div>


      {/* FILTROS */}

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
              placeholder="Buscar gimnasio, movimiento o descripción..."
              className="w-full h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl pl-11 pr-4 text-white text-sm outline-none placeholder:text-gray-700"
            />

          </div>


          <select
            value={
              type
            }
            onChange={
              event =>
                setType(
                  event.target.value
                )
            }
            className="h-11 min-w-[220px] bg-[#0c0c0c] border border-[#242424] rounded-xl px-4 text-gray-300 text-sm outline-none"
          >

            <option value="all">
              Todos los movimientos
            </option>

            <option value="gym_created">
              Gimnasios creados
            </option>

            <option value="payment">
              Pagos
            </option>

            <option value="password_reset">
              Contraseñas
            </option>

            <option value="suspended">
              Suspensiones
            </option>

            <option value="reactivated">
              Reactivaciones
            </option>

            <option value="service_extended">
              Extensiones
            </option>

            <option value="support_ticket">
              Soporte
            </option>

          </select>

        </div>

      </div>


      {/* ACTIVIDAD */}

      <div className="bg-[#111111] border border-[#202020] rounded-2xl overflow-hidden">

        {
          filtered.length ===
          0
            ? (

              <div className="py-20 text-center">

                <Activity
                  className="w-12 h-12 text-gray-800 mx-auto"
                />

                <p className="text-white font-medium mt-4">
                  Sin actividad
                </p>

                <p className="text-gray-600 text-sm mt-1">
                  Los movimientos administrativos aparecerán aquí.
                </p>

              </div>

            )
            : (

              filtered.map(
                item => {

                  const Icon =
                    getIcon(
                      item.type
                    );


                  return (

                    <div
                      key={
                        item.id
                      }
                      className="px-6 py-5 border-b border-[#1d1d1d] last:border-b-0 hover:bg-[#141414]"
                    >

                      <div className="flex items-start gap-4">

                        <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/10 flex items-center justify-center">

                          <Icon
                            className="w-5 h-5 text-[#00ff88]"
                          />

                        </div>


                        <div className="flex-1 min-w-0">

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">

                            <div>

                              <p className="text-white text-sm font-medium">
                                {item.title}
                              </p>

                              {
                                item.gymName &&
                                (

                                  <p className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">

                                    <Building2
                                      className="w-3.5 h-3.5"
                                    />

                                    {item.gymName}

                                  </p>

                                )
                              }

                            </div>


                            <p className="flex items-center gap-2 text-gray-600 text-xs whitespace-nowrap">

                              <Clock3
                                className="w-3.5 h-3.5"
                              />

                              {
                                formatDateTime(
                                  item.date
                                )
                              }

                            </p>

                          </div>


                          <p className="text-gray-400 text-sm mt-3">
                            {item.description}
                          </p>

                        </div>

                      </div>

                    </div>

                  );

                }
              )

            )
        }

      </div>

    </div>

  );

};


const Metric = ({
  label,
  value,
  small = false
}) => (

  <div className="bg-[#111111] border border-[#202020] rounded-2xl p-5">

    <p className="text-gray-600 text-xs">
      {label}
    </p>

    <p
      className={`
        text-white
        font-semibold
        mt-2

        ${
          small
            ? 'text-base'
            : 'text-2xl'
        }
      `}
    >
      {value}
    </p>

  </div>

);


export default NexgymActivityPage;