// src/nexgym/pages/NexgymActivityPage.jsx

import React, {
  useCallback,
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
  RefreshCw,
  LoaderCircle,
  AlertCircle
} from 'lucide-react';

import {
  getNexgymCloudActivity,
  getNexgymCloudGyms
} from '../services/nexgymCloudGymService.js';


// ======================================================
// PAGE
// ======================================================

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


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState('');


  // ======================================================
  // CARGAR ACTIVIDAD CLOUD
  // ======================================================

  const loadData =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError('');


          // ==================================================
          // 1. ACTIVIDAD
          // ==================================================

          const activityResult =
            await getNexgymCloudActivity(
              200
            );


          if (
            !activityResult.success
          ) {

            console.error(
              '❌ No se pudo cargar la actividad:',
              activityResult
            );


            setActivity([]);


            setError(
              activityResult.message ||
              'No se pudo cargar la actividad.'
            );


            return;

          }


          // ==================================================
          // 2. GIMNASIOS
          // ==================================================

          const gymsResult =
            await getNexgymCloudGyms();


          const gyms =
            gymsResult.success &&
            Array.isArray(
              gymsResult.gyms
            )
              ? gymsResult.gyms
              : [];


          // ==================================================
          // 3. MAPA GYM ID -> NOMBRE
          // ==================================================

          const gymMap =
            new Map(
              gyms.map(
                gym => [
                  gym.id,
                  gym
                ]
              )
            );


          // ==================================================
          // 4. NORMALIZAR
          // ==================================================

          const normalized =
            (
              Array.isArray(
                activityResult.activity
              )
                ? activityResult.activity
                : []
            )
              .map(
                item => {

                  const gym =
                    item.gymId
                      ? gymMap.get(
                          item.gymId
                        )
                      : null;


                  return {

                    id:
                      item.id,

                    gymId:
                      item.gymId ||
                      null,

                    gymName:
                      gym?.name ||
                      item.metadata?.gymName ||
                      '',

                    gymCode:
                      gym?.gymCode ||
                      item.metadata?.gymCode ||
                      '',

                    adminId:
                      item.adminId ||
                      null,

                    type:
                      item.type ||
                      'activity',

                    title:
                      item.title ||
                      'Movimiento administrativo',

                    description:
                      item.description ||
                      '',

                    metadata:
                      item.metadata ||
                      {},

                    date:
                      item.createdAt ||
                      null

                  };

                }
              );


          setActivity(
            normalized
          );


          console.log(
            '☁️ Actividad cargada desde Supabase:',
            {
              total:
                normalized.length
            }
          );

        } catch (loadError) {

          console.error(
            '❌ Error cargando actividad NEXGYM:',
            loadError
          );


          setActivity([]);


          setError(
            loadError?.message ||
            'No se pudo cargar la actividad.'
          );

        } finally {

          setLoading(false);

        }

      },
      []
    );


  // ======================================================
  // INIT
  // ======================================================

  useEffect(
    () => {

      void loadData();


      const refresh =
        () => {

          void loadData();

        };


      window.addEventListener(
        'nexgym-activity-update',
        refresh
      );


      window.addEventListener(
        'nexgym-gyms-update',
        refresh
      );


      window.addEventListener(
        'nexgym-payments-update',
        refresh
      );


      window.addEventListener(
        'nexgym-subscriptions-update',
        refresh
      );


      return () => {

        window.removeEventListener(
          'nexgym-activity-update',
          refresh
        );


        window.removeEventListener(
          'nexgym-gyms-update',
          refresh
        );


        window.removeEventListener(
          'nexgym-payments-update',
          refresh
        );


        window.removeEventListener(
          'nexgym-subscriptions-update',
          refresh
        );

      };

    },
    [
      loadData
    ]
  );


  // ======================================================
  // FILTRO
  // ======================================================

  const filtered =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return activity.filter(
          item => {

            const gymName =
              String(
                item.gymName ||
                ''
              ).toLowerCase();


            const gymCode =
              String(
                item.gymCode ||
                ''
              ).toLowerCase();


            const title =
              String(
                item.title ||
                ''
              ).toLowerCase();


            const description =
              String(
                item.description ||
                ''
              ).toLowerCase();


            const matchesSearch =
              !query ||

              gymName.includes(
                query
              ) ||

              gymCode.includes(
                query
              ) ||

              title.includes(
                query
              ) ||

              description.includes(
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


  // ======================================================
  // FECHA
  // ======================================================

  const formatDateTime =
    (
      value
    ) => {

      if (!value) {

        return '-';

      }


      try {

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

      } catch {

        return '-';

      }

    };


  // ======================================================
  // ICONO
  // ======================================================

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


  // ======================================================
  // LABEL TIPO
  // ======================================================

  const getTypeLabel =
    (
      activityType
    ) => {

      const labels = {

        gym_created:
          'Alta',

        payment:
          'Pago',

        password_reset:
          'Contraseña',

        suspended:
          'Suspensión',

        deactivated:
          'Desactivación',

        reactivated:
          'Reactivación',

        service_extended:
          'Extensión',

        support_ticket:
          'Soporte',

        support_status:
          'Soporte',

        support_resolved:
          'Soporte'

      };


      return (
        labels[
          activityType
        ] ||
        'Actividad'
      );

    };


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="p-8">

      {/* ================================================== */}
      {/* RESUMEN */}
      {/* ================================================== */}

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


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {
        error && (

          <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">

            <AlertCircle
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
            />

            <div>

              <p className="text-red-400 text-sm font-medium">
                No se pudo cargar la actividad
              </p>

              <p className="text-red-400/70 text-xs mt-1">
                {error}
              </p>

            </div>

          </div>

        )
      }


      {/* ================================================== */}
      {/* FILTROS */}
      {/* ================================================== */}

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
              className="w-full h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl pl-11 pr-4 text-white text-sm outline-none placeholder:text-gray-700 focus:border-[#00ff88]/30"
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

            <option value="deactivated">
              Desactivaciones
            </option>

            <option value="service_extended">
              Extensiones
            </option>

            <option value="support_ticket">
              Soporte
            </option>

          </select>


          <button
            type="button"
            onClick={
              loadData
            }
            disabled={
              loading
            }
            className="
              h-11
              px-4
              rounded-xl
              bg-[#171717]
              border
              border-[#292929]
              text-gray-300
              text-sm
              flex
              items-center
              justify-center
              gap-2
              hover:text-white
              disabled:opacity-50
            "
          >

            <RefreshCw
              className={`
                w-4
                h-4
                ${
                  loading
                    ? 'animate-spin'
                    : ''
                }
              `}
            />

            Actualizar

          </button>

        </div>

      </div>


      {/* ================================================== */}
      {/* ACTIVIDAD */}
      {/* ================================================== */}

      <div className="bg-[#111111] border border-[#202020] rounded-2xl overflow-hidden">

        {
          loading
            ? (

              <div className="py-20 flex flex-col items-center justify-center">

                <LoaderCircle
                  className="w-10 h-10 text-[#00ff88] animate-spin"
                />

                <p className="text-gray-500 text-sm mt-4">
                  Cargando actividad...
                </p>

              </div>

            )
            : filtered.length ===
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

                          {/* ====================================== */}
                          {/* ICONO */}
                          {/* ====================================== */}

                          <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/10 flex items-center justify-center shrink-0">

                            <Icon
                              className="w-5 h-5 text-[#00ff88]"
                            />

                          </div>


                          {/* ====================================== */}
                          {/* CONTENIDO */}
                          {/* ====================================== */}

                          <div className="flex-1 min-w-0">

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">

                              <div className="min-w-0">

                                <div className="flex items-center gap-2 flex-wrap">

                                  <p className="text-white text-sm font-medium">
                                    {item.title}
                                  </p>


                                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-gray-500 text-[10px] uppercase tracking-wider">

                                    {
                                      getTypeLabel(
                                        item.type
                                      )
                                    }

                                  </span>

                                </div>


                                {
                                  item.gymName &&
                                  (

                                    <p className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">

                                      <Building2
                                        className="w-3.5 h-3.5"
                                      />

                                      {item.gymName}

                                      {
                                        item.gymCode &&
                                        (

                                          <span className="text-gray-700">
                                            · {item.gymCode}
                                          </span>

                                        )
                                      }

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


                            {
                              item.description &&
                              (

                                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                                  {item.description}
                                </p>

                              )
                            }

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


// ======================================================
// METRIC
// ======================================================

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