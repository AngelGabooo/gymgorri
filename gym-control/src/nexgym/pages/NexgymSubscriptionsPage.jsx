// src/nexgym/pages/NexgymSubscriptionsPage.jsx

import React, {
  useCallback,
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
  CircleDollarSign,
  LoaderCircle,
  RefreshCcw
} from 'lucide-react';

import {
  getNexgymCloudGyms
} from '../services/nexgymCloudGymService.js';


// ======================================================
// HELPERS
// ======================================================

const parseLocalDate = (
  value
) => {

  if (!value) {
    return null;
  }

  try {

    const date =
      String(value).length === 10
        ? new Date(
            `${value}T12:00:00`
          )
        : new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }


    return date;

  } catch {

    return null;

  }

};


// ======================================================
// DIFERENCIA DE DÍAS
// ======================================================

const getDaysDifference = (
  nextPaymentDate
) => {

  const paymentDate =
    parseLocalDate(
      nextPaymentDate
    );


  if (!paymentDate) {
    return null;
  }


  const today =
    new Date();


  const todayNormalized =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0
    );


  const paymentNormalized =
    new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      paymentDate.getDate(),
      12,
      0,
      0
    );


  const milliseconds =
    paymentNormalized.getTime() -
    todayNormalized.getTime();


  return Math.ceil(
    milliseconds /
    (
      1000 *
      60 *
      60 *
      24
    )
  );

};


// ======================================================
// ESTADO EFECTIVO
// ======================================================

const getEffectiveStatus = (
  gym
) => {

  const accountStatus =
    gym?.access
      ?.accountStatus;


  const subscriptionStatus =
    gym?.subscription
      ?.status ||
    'active';


  // ==================================================
  // DESACTIVADO
  // ==================================================

  if (
    accountStatus ===
    'inactive'
  ) {

    return 'inactive';

  }


  // ==================================================
  // SUSPENDIDO
  // ==================================================

  if (
    accountStatus ===
      'suspended' ||
    subscriptionStatus ===
      'suspended'
  ) {

    return 'suspended';

  }


  // ==================================================
  // TRIAL
  // ==================================================

  if (
    subscriptionStatus ===
      'trial' ||
    gym?.trial?.active
  ) {

    return 'trial';

  }


  // ==================================================
  // PAGO VENCIDO
  // ==================================================

  const difference =
    getDaysDifference(
      gym?.subscription
        ?.nextPaymentDate
    );


  if (
    difference !==
      null &&
    difference <
      0
  ) {

    return 'past_due';

  }


  return subscriptionStatus;

};


// ======================================================
// NORMALIZAR GIMNASIO A SUSCRIPCIÓN
// ======================================================

const normalizeGymSubscription = (
  gym
) => {

  const status =
    getEffectiveStatus(
      gym
    );


  const nextPaymentDate =
    gym?.subscription
      ?.nextPaymentDate ||
    null;


  return {

    gymId:
      gym.id,

    gymName:
      gym.name ||
      'Sin nombre',

    gymCode:
      gym.gymCode ||
      '',

    ownerName:
      gym.owner?.name ||
      '',

    ownerEmail:
      gym.owner?.email ||
      '',

    accessEmail:
      gym.access?.email ||
      '',

    status,

    billingCycle:
      gym.subscription
        ?.billingCycle ||
      'monthly',

    price:
      Number(
        gym.subscription
          ?.price ||
        0
      ),

    discount:
      Number(
        gym.subscription
          ?.discount ||
        0
      ),

    finalPrice:
      Number(
        gym.subscription
          ?.finalPrice ||
        0
      ),

    nextPaymentDate,

    daysDifference:
      getDaysDifference(
        nextPaymentDate
      ),

    membersCount:
      Number(
        gym.membersCount ||
        0
      ),

    trialActive:
      Boolean(
        gym.trial?.active
      ),

    trialEndDate:
      gym.trial?.endDate ||
      null

  };

};


// ======================================================
// PAGE
// ======================================================

const NexgymSubscriptionsPage =
  () => {

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


    const [
      loading,
      setLoading
    ] = useState(true);


    const [
      error,
      setError
    ] = useState('');


    // ====================================================
    // CARGAR DESDE SUPABASE
    // ====================================================

    const loadData =
      useCallback(
        async () => {

          try {

            setLoading(
              true
            );

            setError(
              ''
            );


            const result =
              await getNexgymCloudGyms();


            if (
              !result.success
            ) {

              console.error(
                '❌ No se pudieron cargar suscripciones:',
                result
              );


              setSubscriptions(
                []
              );


              setError(
                result.message ||
                'No se pudieron cargar las suscripciones.'
              );


              return;

            }


            const gyms =
              Array.isArray(
                result.gyms
              )
                ? result.gyms
                : [];


            const normalized =
              gyms.map(
                normalizeGymSubscription
              );


            setSubscriptions(
              normalized
            );


            console.log(
              '☁️ Suscripciones cargadas desde Supabase:',
              {
                total:
                  normalized.length
              }
            );

          } catch (
            loadError
          ) {

            console.error(
              '❌ Error cargando suscripciones:',
              loadError
            );


            setSubscriptions(
              []
            );


            setError(
              loadError?.message ||
              'No se pudieron cargar las suscripciones.'
            );

          } finally {

            setLoading(
              false
            );

          }

        },
        []
      );


    // ====================================================
    // INIT
    // ====================================================

    useEffect(
      () => {

        void loadData();


        const refresh =
          () => {

            void loadData();

          };


        window.addEventListener(
          'nexgym-gyms-update',
          refresh
        );


        window.addEventListener(
          'nexgym-subscriptions-update',
          refresh
        );


        window.addEventListener(
          'nexgym-payments-update',
          refresh
        );


        return () => {

          window.removeEventListener(
            'nexgym-gyms-update',
            refresh
          );


          window.removeEventListener(
            'nexgym-subscriptions-update',
            refresh
          );


          window.removeEventListener(
            'nexgym-payments-update',
            refresh
          );

        };

      },
      [
        loadData
      ]
    );


    // ====================================================
    // FILTROS
    // ====================================================

    const filtered =
      useMemo(
        () => {

          const query =
            search
              .trim()
              .toLowerCase();


          return subscriptions.filter(
            item => {

              const gymName =
                String(
                  item.gymName ||
                  ''
                )
                  .toLowerCase();


              const gymCode =
                String(
                  item.gymCode ||
                  ''
                )
                  .toLowerCase();


              const ownerName =
                String(
                  item.ownerName ||
                  ''
                )
                  .toLowerCase();


              const ownerEmail =
                String(
                  item.ownerEmail ||
                  ''
                )
                  .toLowerCase();


              const accessEmail =
                String(
                  item.accessEmail ||
                  ''
                )
                  .toLowerCase();


              const matchesSearch =
                !query ||

                gymName.includes(
                  query
                ) ||

                gymCode.includes(
                  query
                ) ||

                ownerName.includes(
                  query
                ) ||

                ownerEmail.includes(
                  query
                ) ||

                accessEmail.includes(
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


    // ====================================================
    // STATS
    // ====================================================

    const stats =
      useMemo(
        () => {

          const count =
            status =>
              subscriptions.filter(
                item =>
                  item.status ===
                  status
              ).length;


          return {

            total:
              subscriptions.length,

            active:
              count(
                'active'
              ),

            trial:
              count(
                'trial'
              ),

            pastDue:
              count(
                'past_due'
              ),

            suspended:
              count(
                'suspended'
              ),

            inactive:
              count(
                'inactive'
              )

          };

        },
        [
          subscriptions
        ]
      );


    // ====================================================
    // FORMATEAR FECHA
    // ====================================================

    const formatDate =
      (
        value
      ) => {

        if (!value) {

          return 'Sin fecha';

        }


        const date =
          parseLocalDate(
            value
          );


        if (!date) {

          return 'Sin fecha';

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
                'numeric'
            }
          ).format(
            date
          );

        } catch {

          return 'Sin fecha';

        }

      };


    // ====================================================
    // TEXTO VENCIMIENTO
    // ====================================================

    const getDueText =
      (
        item
      ) => {

        if (
          item.status ===
          'inactive'
        ) {

          return 'Servicio desactivado';

        }


        if (
          item.status ===
          'suspended'
        ) {

          return 'Servicio suspendido';

        }


        if (
          item.status ===
            'trial' &&
          item.trialEndDate
        ) {

          return (
            `Prueba hasta ${formatDate(
              item.trialEndDate
            )}`
          );

        }


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

          return (
            `${Math.abs(
              item.daysDifference
            )} día(s) de atraso`
          );

        }


        if (
          item.daysDifference ===
          0
        ) {

          return 'Vence hoy';

        }


        return (
          `Faltan ${item.daysDifference} día(s)`
        );

      };


    // ====================================================
    // RENDER
    // ====================================================

    return (

      <div className="p-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>

            <p className="text-gray-500 text-sm">
              Control global de las rentas de NEXGYM
            </p>

            <p className="text-gray-700 text-xs mt-1">
              Información actualizada directamente desde Supabase
            </p>

          </div>


          <button
            type="button"
            onClick={
              loadData
            }
            disabled={
              loading
            }
            className="
              h-10
              px-4
              rounded-xl
              bg-[#171717]
              border
              border-[#292929]
              text-gray-300
              text-sm
              flex
              items-center
              gap-2
              hover:text-white
              disabled:opacity-50
            "
          >

            <RefreshCcw
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


        {/* ================================================== */}
        {/* STATS */}
        {/* ================================================== */}

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


        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {
          error && (

            <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">

              <p className="text-red-400 text-sm">
                {error}
              </p>

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
                placeholder="Buscar gimnasio, propietario o correo..."
                className="w-full h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl pl-11 pr-4 text-white text-sm outline-none placeholder:text-gray-700 focus:border-[#00ff88]/30"
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


        {/* ================================================== */}
        {/* TABLA */}
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
                    Cargando suscripciones...
                  </p>

                </div>

              )
              : filtered.length ===
                0
                ? (

                  <div className="py-16 text-center">

                    <CreditCard
                      className="w-10 h-10 text-gray-800 mx-auto"
                    />

                    <p className="text-white mt-4">
                      No hay suscripciones
                    </p>

                    <p className="text-gray-600 text-sm mt-1">
                      No existen gimnasios que coincidan con los filtros.
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

                                  {/* ====================================== */}
                                  {/* GYM */}
                                  {/* ====================================== */}

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


                                  {/* ====================================== */}
                                  {/* ESTADO */}
                                  {/* ====================================== */}

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


                                  {/* ====================================== */}
                                  {/* PRECIO */}
                                  {/* ====================================== */}

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


                                  {/* ====================================== */}
                                  {/* PRÓXIMO PAGO */}
                                  {/* ====================================== */}

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


                                  {/* ====================================== */}
                                  {/* SITUACIÓN */}
                                  {/* ====================================== */}

                                  <td className="px-5 py-4">

                                    <div
                                      className={`
                                        flex
                                        items-center
                                        gap-2
                                        text-xs

                                        ${
                                          item.status ===
                                          'suspended'
                                            ? 'text-orange-400'
                                            : item.status ===
                                              'inactive'
                                              ? 'text-red-400'
                                              : overdue
                                                ? 'text-red-400'
                                                : item.daysDifference ===
                                                  0
                                                  ? 'text-yellow-400'
                                                  : 'text-gray-500'
                                        }
                                      `}
                                    >

                                      {
                                        item.status ===
                                          'suspended' ||
                                        item.status ===
                                          'inactive' ||
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


                                  {/* ====================================== */}
                                  {/* MIEMBROS */}
                                  {/* ====================================== */}

                                  <td className="px-5 py-4 text-gray-300 text-sm">

                                    {item.membersCount}

                                  </td>


                                  {/* ====================================== */}
                                  {/* ACTION */}
                                  {/* ====================================== */}

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


        {/* ================================================== */}
        {/* INFO */}
        {/* ================================================== */}

        <div className="mt-5 bg-[#111111] border border-[#202020] rounded-2xl p-4 flex items-start gap-3">

          <CircleDollarSign
            className="w-5 h-5 text-[#00ff88] mt-0.5"
          />

          <p className="text-gray-500 text-xs leading-relaxed">

            Cuando la fecha de próximo pago ya pasó,
            NEXGYM mostrará el gimnasio como “Pago pendiente”.
            Las extensiones, pagos, suspensiones y reactivaciones
            se reflejan directamente desde Supabase.

          </p>

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

    },


    expired: {

      label:
        'Vencido',

      className:
        'bg-red-500/10 text-red-400 border-red-500/20'

    },


    cancelled: {

      label:
        'Cancelado',

      className:
        'bg-gray-500/10 text-gray-400 border-gray-500/20'

    }

  };


  return (
    data[
      status
    ] ||
    data.active
  );

};


// ======================================================
// STAT
// ======================================================

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


// ======================================================
// TABLE HEADER
// ======================================================

const TH = ({
  children
}) => (

  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-600 whitespace-nowrap">

    {children}

  </th>

);


export default NexgymSubscriptionsPage;