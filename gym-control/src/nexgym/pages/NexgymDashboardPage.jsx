// src/nexgym/pages/NexgymDashboardPage.jsx

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
  DollarSign,
  Clock3,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Wifi,
  Users,
  ArrowRight,
  Activity
} from 'lucide-react';

import {
  getNexgymCloudActivity,
  getNexgymCloudGyms
} from '../services/nexgymCloudGymService.js';


// ======================================================
// PAGE
// ======================================================

const NexgymDashboardPage = () => {

  const navigate =
    useNavigate();


  const [
    gyms,
    setGyms
  ] = useState([]);


  const [
    activity,
    setActivity
  ] = useState([]);


  // ======================================================
  // CARGAR
  // ======================================================

  const loadData =
    async () => {

      try {

        const [
          gymsResult,
          activityResult
        ] =
          await Promise.all([
            getNexgymCloudGyms(),
            getNexgymCloudActivity()
          ]);


        if (
          gymsResult.success
        ) {

          setGyms(
            gymsResult.gyms ||
            []
          );

        } else {

          console.error(
            '❌ No se pudieron cargar los gimnasios del Dashboard:',
            gymsResult
          );

          setGyms([]);

        }


        if (
          activityResult.success
        ) {

          setActivity(
            activityResult.activity ||
            []
          );

        } else {

          console.error(
            '❌ No se pudo cargar la actividad del Dashboard:',
            activityResult
          );

          setActivity([]);

        }

      } catch (error) {

        console.error(
          '❌ Error cargando Dashboard NEXGYM:',
          error
        );

        setGyms([]);
        setActivity([]);

      }

    };


  useEffect(
    () => {

      void loadData();


      window.addEventListener(
        'nexgym-gyms-update',
        loadData
      );


      window.addEventListener(
        'nexgym-activity-update',
        loadData
      );


      return () => {

        window.removeEventListener(
          'nexgym-gyms-update',
          loadData
        );


        window.removeEventListener(
          'nexgym-activity-update',
          loadData
        );


      };

    },
    []
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
              gym.access?.accountStatus !==
                'inactive' &&
              gym.subscription?.status ===
                'active'
          );


        const trials =
          gyms.filter(
            gym =>
              gym.subscription?.status ===
              'trial'
          );


        const pending =
          gyms.filter(
            gym =>
              gym.subscription?.status ===
              'past_due'
          );


        const suspended =
          gyms.filter(
            gym =>
              gym.subscription?.status ===
                'suspended' &&
              gym.access?.accountStatus !==
                'inactive'
          );


        const inactive =
          gyms.filter(
            gym =>
              gym.access?.accountStatus ===
              'inactive'
          );


        const monthlyRevenue =
          active.reduce(
            (
              total,
              gym
            ) =>
              total +
              Number(
                gym.subscription
                  ?.finalPrice ||
                0
              ),
            0
          );


        const totalMembers =
          gyms.reduce(
            (
              total,
              gym
            ) =>
              total +
              Number(
                gym.membersCount ||
                0
              ),
            0
          );


        return {
          active,
          trials,
          pending,
          suspended,
          inactive,
          monthlyRevenue,
          totalMembers
        };

      },
      [
        gyms
      ]
    );


  // ======================================================
  // PRÓXIMOS PAGOS
  // ======================================================

  const upcomingPayments =
    useMemo(
      () => {

        return gyms
          .filter(
            gym =>
              gym.subscription
                ?.nextPaymentDate
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                a.subscription
                  .nextPaymentDate
              ).localeCompare(
                String(
                  b.subscription
                    .nextPaymentDate
                )
              )
          )
          .slice(
            0,
            5
          );

      },
      [
        gyms
      ]
    );


  // ======================================================
  // FECHAS
  // ======================================================

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


  const formatDateTime =
    (
      value
    ) => {

      if (!value) {

        return '';

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


      <div className="flex items-center justify-between mb-8">

        <p className="text-gray-500 text-sm">
          Estado actual de tu plataforma
        </p>


        <div className="flex items-center gap-2 text-xs text-gray-500">

          <span className="w-2 h-2 rounded-full bg-[#00ff88]" />

          Sistema operativo

        </div>

      </div>


      {/* ================================================== */}
      {/* KPIS */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        <StatCard
          icon={
            Building2
          }
          title="Gimnasios activos"
          value={
            stats.active.length
          }
          detail={`${gyms.length} registrados en total`}
        />


        <StatCard
          icon={
            DollarSign
          }
          title="MRR estimado"
          value={`$${stats.monthlyRevenue.toLocaleString(
            'es-MX'
          )}`}
          detail="Ingreso mensual recurrente"
        />


        <StatCard
          icon={
            Clock3
          }
          title="Pagos pendientes"
          value={
            stats.pending.length
          }
          detail="Clientes que requieren atención"
          warning
        />


        <StatCard
          icon={
            FlaskConical
          }
          title="Pruebas activas"
          value={
            stats.trials.length
          }
          detail="Periodos de prueba actuales"
        />

      </div>


      {/* ================================================== */}
      {/* SEGUNDA FILA */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">


        <div className="xl:col-span-2 bg-[#111111] border border-[#202020] rounded-2xl p-6">

          <div className="flex items-center justify-between">

            <div>

              <h3 className="text-white font-semibold">
                Clientes NEXGYM
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                Resumen de tu cartera actual
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  '/nexgym/gyms'
                )
              }
              className="text-[#00ff88] text-sm flex items-center gap-2"
            >

              Ver gimnasios

              <ArrowRight
                className="w-4 h-4"
              />

            </button>

          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-7">

            <MiniMetric
              label="Clientes"
              value={
                gyms.length
              }
            />

            <MiniMetric
              label="Miembros totales"
              value={
                stats.totalMembers
              }
            />

            <MiniMetric
              label="Suspendidos"
              value={
                stats.suspended.length
              }
            />

            <MiniMetric
              label="Desactivados"
              value={
                stats.inactive.length
              }
            />

          </div>


          <div className="mt-7 border-t border-[#202020] pt-5">

            <p className="text-gray-500 text-xs">
              El MRR se calcula usando el precio final de los gimnasios actualmente activos.
            </p>

          </div>

        </div>


        {/* ESTADOS */}

        <div className="bg-[#111111] border border-[#202020] rounded-2xl p-6">

          <h3 className="text-white font-semibold">
            Estado de clientes
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            Distribución actual
          </p>


          <div className="mt-7 space-y-5">

            <ClientStatus
              label="Activos"
              value={
                stats.active.length
              }
              color="bg-[#00ff88]"
            />

            <ClientStatus
              label="Prueba"
              value={
                stats.trials.length
              }
              color="bg-blue-500"
            />

            <ClientStatus
              label="Pago pendiente"
              value={
                stats.pending.length
              }
              color="bg-yellow-500"
            />

            <ClientStatus
              label="Suspendidos"
              value={
                stats.suspended.length
              }
              color="bg-orange-500"
            />

            <ClientStatus
              label="Desactivados"
              value={
                stats.inactive.length
              }
              color="bg-red-500"
            />

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* PAGOS Y ALERTAS */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">


        <div className="bg-[#111111] border border-[#202020] rounded-2xl">

          <div className="p-6 border-b border-[#202020]">

            <h3 className="text-white font-semibold">
              Próximos cobros
            </h3>

            <p className="text-gray-500 text-sm mt-1">
              Fechas próximas de tus clientes
            </p>

          </div>


          {
            upcomingPayments.length ===
            0
              ? (

                <EmptyMessage
                  text="No existen cobros programados."
                />

              )
              : (

                upcomingPayments.map(
                  gym => (

                    <button
                      type="button"
                      key={
                        gym.id
                      }
                      onClick={() =>
                        navigate(
                          `/nexgym/gyms/${gym.id}`
                        )
                      }
                      className="w-full px-6 py-4 border-b border-[#1b1b1b] last:border-b-0 flex items-center justify-between hover:bg-[#141414] text-left"
                    >

                      <div>

                        <p className="text-white text-sm font-medium">
                          {gym.name}
                        </p>

                        <p className="text-gray-600 text-xs mt-1">
                          {
                            formatDate(
                              gym.subscription
                                ?.nextPaymentDate
                            )
                          }
                        </p>

                      </div>


                      <span className="text-white font-semibold">
                        $
                        {
                          Number(
                            gym.subscription
                              ?.finalPrice ||
                            0
                          ).toFixed(
                            2
                          )
                        }
                      </span>

                    </button>

                  )
                )

              )
          }

        </div>


        {/* ATENCIÓN */}

        <div className="bg-[#111111] border border-[#202020] rounded-2xl">

          <div className="p-6 border-b border-[#202020]">

            <div className="flex items-center gap-2">

              <AlertTriangle
                className="w-4 h-4 text-yellow-500"
              />

              <h3 className="text-white font-semibold">
                Atención requerida
              </h3>

            </div>

          </div>


          {
            (
              stats.pending.length +
              stats.suspended.length
            ) ===
            0
              ? (

                <div className="p-8 text-center">

                  <CheckCircle2
                    className="w-8 h-8 text-[#00ff88] mx-auto"
                  />

                  <p className="text-gray-400 text-sm mt-3">
                    No hay situaciones pendientes.
                  </p>

                </div>

              )
              : (

                [
                  ...stats.pending,
                  ...stats.suspended
                ]
                  .slice(
                    0,
                    5
                  )
                  .map(
                    gym => (

                      <button
                        key={
                          gym.id
                        }
                        type="button"
                        onClick={() =>
                          navigate(
                            `/nexgym/gyms/${gym.id}`
                          )
                        }
                        className="w-full px-6 py-4 border-b border-[#1b1b1b] last:border-b-0 text-left hover:bg-[#141414]"
                      >

                        <p className="text-white text-sm font-medium">
                          {gym.name}
                        </p>

                        <p className="text-yellow-500 text-xs mt-1">
                          {
                            gym.subscription
                              ?.status ===
                            'past_due'
                              ? 'Pago pendiente'
                              : 'Servicio suspendido'
                          }
                        </p>

                      </button>

                    )
                  )

              )
          }

        </div>

      </div>


      {/* ================================================== */}
      {/* ACTIVIDAD */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">

        <div className="xl:col-span-2 bg-[#111111] border border-[#202020] rounded-2xl">

          <div className="p-6 border-b border-[#202020]">

            <div className="flex items-center gap-2">

              <Activity
                className="w-4 h-4 text-[#00ff88]"
              />

              <h3 className="text-white font-semibold">
                Actividad reciente
              </h3>

            </div>

          </div>


          {
            activity.length ===
            0
              ? (

                <EmptyMessage
                  text="Todavía no hay actividad administrativa."
                />

              )
              : (

                activity
                  .slice(
                    0,
                    8
                  )
                  .map(
                    item => (

                      <div
                        key={
                          item.id
                        }
                        className="px-6 py-4 border-b border-[#1b1b1b] last:border-b-0 flex items-center gap-4"
                      >

                        <div className="w-9 h-9 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

                          <CircleDollarSign
                            className="w-4 h-4 text-[#00ff88]"
                          />

                        </div>


                        <div className="flex-1">

                          <p className="text-white text-sm">
                            {item.title}
                          </p>

                          <p className="text-gray-600 text-xs mt-1">
                            {item.description}
                          </p>

                        </div>


                        <span className="text-gray-700 text-xs">
                          {
                            formatDateTime(
                              item.date
                            )
                          }
                        </span>

                      </div>

                    )
                  )

              )
          }

        </div>


        <div className="bg-[#111111] border border-[#202020] rounded-2xl p-6">

          <div className="flex items-center gap-2">

            <Wifi
              className="w-4 h-4 text-[#00ff88]"
            />

            <h3 className="text-white font-semibold">
              Sistema
            </h3>

          </div>


          <div className="mt-6 space-y-4">

            <SystemStatus
              label="Panel NEXGYM"
            />

            <SystemStatus
              label="Autenticación"
            />

            <SystemStatus
              label="Almacenamiento local"
            />

          </div>


          <div className="mt-6 pt-5 border-t border-[#202020]">

            <div className="flex items-center gap-2">

              <Users
                className="w-4 h-4 text-gray-500"
              />

              <p className="text-gray-500 text-xs">
                {gyms.length} clientes administrados
              </p>

            </div>

          </div>

        </div>

      </div>


      <div className="h-8" />

    </div>

  );

};


// ======================================================
// COMPONENTES
// ======================================================

const StatCard = ({
  icon: Icon,
  title,
  value,
  detail,
  warning
}) => {

  return (

    <div className="bg-[#111111] border border-[#202020] rounded-2xl p-5">

      <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center">

        <Icon
          className="w-5 h-5 text-[#00ff88]"
        />

      </div>

      <p className="text-gray-500 text-sm mt-5">
        {title}
      </p>

      <p className="text-white text-3xl font-semibold mt-1">
        {value}
      </p>

      <p
        className={`
          text-xs
          mt-2
          ${
            warning
              ? 'text-yellow-500'
              : 'text-gray-600'
          }
        `}
      >
        {detail}
      </p>

    </div>

  );

};


const MiniMetric = ({
  label,
  value
}) => {

  return (

    <div className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4">

      <p className="text-gray-600 text-xs">
        {label}
      </p>

      <p className="text-white text-xl font-semibold mt-1">
        {value}
      </p>

    </div>

  );

};


const ClientStatus = ({
  label,
  value,
  color
}) => {

  return (

    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        <span
          className={`w-2.5 h-2.5 rounded-full ${color}`}
        />

        <span className="text-gray-400 text-sm">
          {label}
        </span>

      </div>

      <span className="text-white font-semibold text-sm">
        {value}
      </span>

    </div>

  );

};


const SystemStatus = ({
  label
}) => {

  return (

    <div className="flex items-center justify-between">

      <span className="text-gray-400 text-sm">
        {label}
      </span>

      <span className="text-[#00ff88] text-xs flex items-center gap-2">

        <span className="w-2 h-2 bg-[#00ff88] rounded-full" />

        Operativo

      </span>

    </div>

  );

};


const EmptyMessage = ({
  text
}) => {

  return (

    <div className="py-10 text-center text-gray-600 text-sm">
      {text}
    </div>

  );

};


export default NexgymDashboardPage;