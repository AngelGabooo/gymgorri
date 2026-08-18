// src/nexgym/pages/NexgymGymDetailPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  CreditCard,
  Users,
  Wifi,
  KeyRound,
  Clock3,
  ReceiptText,
  FileText,
  Activity,
  UserCog,
  ShieldCheck,
  CircleDollarSign,
  PauseCircle,
  PlayCircle,
  Ban,
  RefreshCw,
  Copy,
  X,
  CheckCircle2,
  AlertTriangle,
  Plus
} from 'lucide-react';

import {
  addNexgymGymNote,
  resetNexgymGymPassword
} from '../services/nexgymGymService';

import {
  deactivateNexgymCloudGym,
  extendNexgymCloudService,
  getNexgymCloudActivity,
  getNexgymCloudGymById,
  reactivateNexgymCloudGym,
  registerNexgymCloudPayment,
  suspendNexgymCloudGym
} from '../services/nexgymCloudGymService.js';


// ======================================================
// PAGE
// ======================================================

const NexgymGymDetailPage = () => {

  const {
    id
  } =
    useParams();


  const navigate =
    useNavigate();


  const [
    gym,
    setGym
  ] = useState(null);


  const [
    loadingGym,
    setLoadingGym
  ] = useState(true);


  const [
    gymLoadError,
    setGymLoadError
  ] = useState('');


  const [
    activity,
    setActivity
  ] = useState([]);


  const [
    activeTab,
    setActiveTab
  ] = useState(
    'summary'
  );


  const [
    modal,
    setModal
  ] = useState(null);


  const [
    actionError,
    setActionError
  ] = useState('');


  const [
    successMessage,
    setSuccessMessage
  ] = useState('');


  // ======================================================
  // CARGAR
  // ======================================================

  const loadGym =
    async () => {

      try {

        setLoadingGym(true);

        setGymLoadError('');


        const [
          gymResult,
          activityResult
        ] =
          await Promise.all([
            getNexgymCloudGymById(
              id
            ),
            getNexgymCloudActivity(
              id,
              30
            )
          ]);


        if (
          gymResult.success &&
          gymResult.gym
        ) {

          setGym(
            gymResult.gym
          );

        } else {

          setGym(null);

          setGymLoadError(
            gymResult.message ||
            'Gimnasio no encontrado.'
          );

        }


        if (
          activityResult.success
        ) {

          setActivity(
            activityResult.activity ||
            []
          );

        } else {

          setActivity([]);

        }

      } catch (error) {

        console.error(
          '❌ Error cargando detalle NEXGYM:',
          error
        );

        setGym(null);

        setActivity([]);

        setGymLoadError(
          error?.message ||
          'No se pudo cargar el gimnasio.'
        );

      } finally {

        setLoadingGym(false);

      }

    };


  useEffect(
    () => {

      void loadGym();


      window.addEventListener(
        'nexgym-gyms-update',
        loadGym
      );


      return () => {

        window.removeEventListener(
          'nexgym-gyms-update',
          loadGym
        );


      };

    },
    [
      id
    ]
  );


  // ======================================================
  // ACTIVIDAD
  // ======================================================
  //
  // La actividad ahora se carga desde Supabase junto
  // con el gimnasio dentro de loadGym().
  //
  // ======================================================


  // ======================================================
  // ESTADO
  // ======================================================

  const getGymStatus =
    () => {

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


  const status =
    getGymStatus();


  const statusInfo =
    getStatusData(
      status
    );


  // ======================================================
  // MENSAJE
  // ======================================================

  const showSuccess =
    (
      message
    ) => {

      setSuccessMessage(
        message
      );


      window.setTimeout(
        () => {

          setSuccessMessage(
            ''
          );

        },
        3500
      );

    };


  // ======================================================
  // FECHAS
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
            'long',
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
      date
    ) => {

      if (!date) {

        return 'Sin registro';

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
          date
        )
      );

    };


  // ======================================================
  // COPIAR CORREO
  // ======================================================

  const copyEmail =
    async () => {

      try {

        await navigator.clipboard.writeText(
          gym?.access
            ?.email ||
          ''
        );


        showSuccess(
          'Correo copiado.'
        );

      } catch (error) {

        console.error(
          error
        );

      }

    };


  // ======================================================
  // CARGANDO
  // ======================================================

  if (
    loadingGym
  ) {

    return (

      <div className="p-8">

        <div className="bg-[#111111] border border-[#202020] rounded-2xl p-12 text-center">

          <RefreshCw
            className="w-10 h-10 text-[#00ff88] mx-auto animate-spin"
          />

          <h2 className="text-white text-xl font-semibold mt-4">
            Cargando gimnasio
          </h2>

          <p className="text-gray-600 text-sm mt-2">
            Consultando la información en Supabase...
          </p>

        </div>

      </div>

    );

  }


  // ======================================================
  // NO ENCONTRADO
  // ======================================================

  if (!gym) {

    return (

      <div className="p-8">

        <div className="bg-[#111111] border border-[#202020] rounded-2xl p-12 text-center">

          <Building2
            className="w-12 h-12 text-gray-800 mx-auto"
          />

          <h2 className="text-white text-xl font-semibold mt-4">
            Gimnasio no encontrado
          </h2>

          <p className="text-gray-600 text-sm mt-2">
            {gymLoadError || 'Este cliente no existe en NEXGYM.'}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/nexgym/gyms'
              )
            }
            className="mt-6 bg-[#00ff88] text-black px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            Regresar
          </button>

        </div>

      </div>

    );

  }


  // ======================================================
  // TABS
  // ======================================================

  const tabs = [

    {
      id:
        'summary',
      label:
        'Resumen',
      icon:
        Building2
    },

    {
      id:
        'subscription',
      label:
        'Suscripción',
      icon:
        CreditCard
    },

    {
      id:
        'payments',
      label:
        'Pagos',
      icon:
        ReceiptText
    },

    {
      id:
        'access',
      label:
        'Acceso',
      icon:
        KeyRound
    },

    {
      id:
        'users',
      label:
        'Usuarios',
      icon:
        UserCog
    },

    {
      id:
        'activity',
      label:
        'Actividad',
      icon:
        Activity
    },

    {
      id:
        'notes',
      label:
        'Notas',
      icon:
        FileText
    }

  ];


  return (

    <div className="p-8">


      {/* ================================================== */}
      {/* NOTIFICACIÓN */}
      {/* ================================================== */}

      {
        successMessage &&
        (

          <div className="fixed top-6 right-6 z-[100] bg-[#111111] border border-[#00ff88]/30 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">

            <CheckCircle2
              className="w-5 h-5 text-[#00ff88]"
            />

            <span className="text-white text-sm">
              {successMessage}
            </span>

          </div>

        )
      }


      {/* ================================================== */}
      {/* REGRESAR */}
      {/* ================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(
            '/nexgym/gyms'
          )
        }
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6"
      >

        <ArrowLeft
          className="w-4 h-4"
        />

        Volver a gimnasios

      </button>


      {/* ================================================== */}
      {/* CLIENTE */}
      {/* ================================================== */}

      <div className="bg-[#111111] border border-[#202020] rounded-2xl p-6">

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">


          <div className="flex items-start gap-4">

            <div className="w-14 h-14 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">

              <Building2
                className="w-7 h-7 text-[#00ff88]"
              />

            </div>


            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-white text-2xl font-semibold">
                  {gym.name}
                </h1>

                <span
                  className={`
                    border
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-medium
                    ${statusInfo.className}
                  `}
                >
                  {statusInfo.label}
                </span>

              </div>


              <p className="text-gray-600 text-sm mt-1">
                {gym.gymCode}
              </p>


              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">

                <span className="flex items-center gap-2 text-gray-400 text-xs">

                  <User
                    className="w-4 h-4"
                  />

                  {gym.owner?.name || 'Sin propietario'}

                </span>


                <span className="flex items-center gap-2 text-gray-400 text-xs">

                  <MapPin
                    className="w-4 h-4"
                  />

                  {
                    [
                      gym.city,
                      gym.state
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        ', '
                      ) ||
                    'Sin ubicación'
                  }

                </span>


                <span className="flex items-center gap-2 text-gray-400 text-xs">

                  <Wifi
                    className="w-4 h-4"
                  />

                  Última conexión: {
                    formatDateTime(
                      gym.lastConnectionAt
                    )
                  }

                </span>

              </div>

            </div>

          </div>


          {/* ACCIONES */}

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                setModal(
                  'payment'
                )
              }
              className="h-10 px-4 rounded-xl bg-[#00ff88] text-black text-sm font-semibold flex items-center gap-2"
            >

              <CircleDollarSign
                className="w-4 h-4"
              />

              Registrar pago

            </button>


            <button
              type="button"
              onClick={async () => {

                try {

                  setActionError(
                    ''
                  );


                  const result =
                    await extendNexgymCloudService(
                      gym.id,
                      1
                    );


                  if (
                    !result.success
                  ) {

                    setActionError(
                      result.message ||
                      'No se pudo extender el servicio.'
                    );


                    return;

                  }


                  await loadGym();


                  showSuccess(
                    `Servicio extendido hasta ${result.nextPaymentDate || 'la nueva fecha'}.`
                  );

                } catch (error) {

                  console.error(
                    '❌ Error extendiendo servicio:',
                    error
                  );


                  setActionError(
                    error?.message ||
                    'No se pudo extender el servicio.'
                  );

                }

              }}
              className="h-10 px-4 rounded-xl bg-[#171717] border border-[#282828] text-gray-300 text-sm flex items-center gap-2"
            >

              <RefreshCw
                className="w-4 h-4"
              />

              Extender 1 mes

            </button>

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* TABS */}
      {/* ================================================== */}

      <div className="mt-5 bg-[#111111] border border-[#202020] rounded-2xl p-2 overflow-x-auto">

        <div className="flex gap-1 min-w-max">

          {
            tabs.map(
              tab => {

                const Icon =
                  tab.icon;


                return (

                  <button
                    key={
                      tab.id
                    }
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.id
                      )
                    }
                    className={`
                      h-10
                      px-4
                      rounded-xl
                      flex
                      items-center
                      gap-2
                      text-sm
                      transition-all

                      ${
                        activeTab ===
                        tab.id
                          ? 'bg-[#00ff88]/10 text-[#00ff88]'
                          : 'text-gray-500 hover:text-white hover:bg-[#161616]'
                      }
                    `}
                  >

                    <Icon
                      className="w-4 h-4"
                    />

                    {tab.label}

                  </button>

                );

              }
            )
          }

        </div>

      </div>


      {/* ================================================== */}
      {/* RESUMEN */}
      {/* ================================================== */}

      {
        activeTab ===
        'summary' &&
        (

          <div className="mt-5">

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

              <MetricCard
                icon={
                  Users
                }
                label="Miembros"
                value={
                  gym.membersCount ||
                  0
                }
              />

              <MetricCard
                icon={
                  UserCog
                }
                label="Usuarios"
                value={
                  gym.usersCount ||
                  0
                }
              />

              <MetricCard
                icon={
                  CalendarDays
                }
                label="Próximo pago"
                value={
                  formatDate(
                    gym.subscription
                      ?.nextPaymentDate
                  )
                }
              />

              <MetricCard
                icon={
                  Clock3
                }
                label="Última conexión"
                value={
                  gym.lastConnectionAt
                    ? formatDateTime(
                        gym.lastConnectionAt
                      )
                    : 'Nunca'
                }
              />

            </div>


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">


              <SectionCard
                title="Datos del gimnasio"
                subtitle="Información general del cliente"
              >

                <InfoRow
                  icon={
                    Building2
                  }
                  label="Nombre"
                  value={
                    gym.name
                  }
                />

                <InfoRow
                  icon={
                    Phone
                  }
                  label="Teléfono"
                  value={
                    gym.phone ||
                    'No registrado'
                  }
                />

                <InfoRow
                  icon={
                    MapPin
                  }
                  label="Dirección"
                  value={
                    [
                      gym.address,
                      gym.city,
                      gym.state
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        ', '
                      ) ||
                    'No registrada'
                  }
                />

                <InfoRow
                  icon={
                    CalendarDays
                  }
                  label="Registrado"
                  value={
                    formatDateTime(
                      gym.createdAt
                    )
                  }
                />

              </SectionCard>


              <SectionCard
                title="Propietario"
                subtitle="Responsable principal"
              >

                <InfoRow
                  icon={
                    User
                  }
                  label="Nombre"
                  value={
                    gym.owner?.name ||
                    'No registrado'
                  }
                />

                <InfoRow
                  icon={
                    Mail
                  }
                  label="Correo de contacto"
                  value={
                    gym.owner?.email ||
                    'No registrado'
                  }
                />

                <InfoRow
                  icon={
                    Phone
                  }
                  label="Teléfono"
                  value={
                    gym.owner?.phone ||
                    'No registrado'
                  }
                />

              </SectionCard>

            </div>


            {/* CONTROL */}

            <div className="mt-5">

              <SectionCard
                title="Control del cliente"
                subtitle="Suspende, reactiva o desactiva el acceso al sistema"
              >

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  {
                    status ===
                    'suspended'
                      ? (

                        <ActionCard
                          icon={
                            PlayCircle
                          }
                          title="Reactivar servicio"
                          description="Permite nuevamente el acceso al dueño y empleados."
                          success
                          onClick={() =>
                            setModal(
                              'reactivate'
                            )
                          }
                        />

                      )
                      : status ===
                        'inactive'
                        ? (

                          <ActionCard
                            icon={
                              PlayCircle
                            }
                            title="Reactivar cliente"
                            description="Vuelve a activar completamente esta cuenta."
                            success
                            onClick={() =>
                              setModal(
                                'reactivate'
                              )
                            }
                          />

                        )
                        : (

                          <ActionCard
                            icon={
                              PauseCircle
                            }
                            title="Suspender servicio"
                            description="Bloqueo temporal, por ejemplo por falta de pago."
                            warning
                            onClick={() =>
                              setModal(
                                'suspend'
                              )
                            }
                          />

                        )
                  }


                  <ActionCard
                    icon={
                      KeyRound
                    }
                    title="Restablecer contraseña"
                    description="Genera una nueva contraseña temporal para el propietario."
                    onClick={() =>
                      setModal(
                        'password'
                      )
                    }
                  />


                  <ActionCard
                    icon={
                      Ban
                    }
                    title="Desactivar cliente"
                    description="Para bajas definitivas sin eliminar su historial."
                    danger
                    disabled={
                      status ===
                      'inactive'
                    }
                    onClick={() =>
                      setModal(
                        'deactivate'
                      )
                    }
                  />

                </div>

              </SectionCard>

            </div>

          </div>

        )
      }


      {/* ================================================== */}
      {/* SUSCRIPCIÓN */}
      {/* ================================================== */}

      {
        activeTab ===
        'subscription' &&
        (

          <div className="mt-5">

            <SectionCard
              title="Suscripción NEXGYM"
              subtitle="Esta es la renta que el gimnasio te paga por utilizar tu sistema"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                <ValueCard
                  label="Precio normal"
                  value={`$${Number(
                    gym.subscription
                      ?.price ||
                    0
                  ).toFixed(2)} MXN`}
                />

                <ValueCard
                  label="Descuento"
                  value={`$${Number(
                    gym.subscription
                      ?.discount ||
                    0
                  ).toFixed(2)} MXN`}
                />

                <ValueCard
                  label="Precio final"
                  value={`$${Number(
                    gym.subscription
                      ?.finalPrice ||
                    0
                  ).toFixed(2)} MXN`}
                  highlight
                />

                <ValueCard
                  label="Próximo pago"
                  value={
                    formatDate(
                      gym.subscription
                        ?.nextPaymentDate
                    )
                  }
                />

              </div>


              {
                gym.trial?.active &&
                (

                  <div className="mt-5 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">

                    <p className="text-blue-400 text-sm font-medium">
                      Periodo de prueba
                    </p>

                    <p className="text-gray-500 text-xs mt-1">
                      {
                        formatDate(
                          gym.trial
                            ?.startDate
                        )
                      }
                      {' → '}
                      {
                        formatDate(
                          gym.trial
                            ?.endDate
                        )
                      }
                    </p>

                  </div>

                )
              }


              {
                gym.access?.suspendedReason &&
                (

                  <div className="mt-5 bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">

                    <p className="text-orange-400 text-sm font-medium">
                      Motivo de suspensión
                    </p>

                    <p className="text-gray-400 text-sm mt-2">
                      {gym.access.suspendedReason}
                    </p>

                  </div>

                )
              }

            </SectionCard>

          </div>

        )
      }


      {/* ================================================== */}
      {/* PAGOS */}
      {/* ================================================== */}

      {
        activeTab ===
        'payments' &&
        (

          <div className="mt-5">

            <SectionCard
              title="Historial de pagos"
              subtitle="Pagos realizados por este cliente a NEXGYM"
            >

              <button
                type="button"
                onClick={() =>
                  setModal(
                    'payment'
                  )
                }
                className="mb-5 h-10 px-4 rounded-xl bg-[#00ff88] text-black text-sm font-semibold flex items-center gap-2"
              >

                <Plus
                  className="w-4 h-4"
                />

                Registrar pago

              </button>


              {
                !gym.payments?.length
                  ? (

                    <EmptyState
                      icon={
                        ReceiptText
                      }
                      title="Sin pagos registrados"
                      description="Todavía no has registrado pagos de este cliente."
                    />

                  )
                  : (

                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead>

                          <tr className="border-b border-[#202020]">

                            <TableHeader>
                              Fecha
                            </TableHeader>

                            <TableHeader>
                              Importe
                            </TableHeader>

                            <TableHeader>
                              Método
                            </TableHeader>

                            <TableHeader>
                              Referencia
                            </TableHeader>

                            <TableHeader>
                              Estado
                            </TableHeader>

                          </tr>

                        </thead>


                        <tbody>

                          {
                            gym.payments.map(
                              payment => (

                                <tr
                                  key={
                                    payment.id
                                  }
                                  className="border-b border-[#1c1c1c] last:border-b-0"
                                >

                                  <td className="py-4 pr-6 text-gray-300 text-sm">
                                    {
                                      formatDate(
                                        payment.date
                                      )
                                    }
                                  </td>

                                  <td className="py-4 pr-6 text-white text-sm font-semibold">
                                    $
                                    {
                                      Number(
                                        payment.amount ||
                                        0
                                      ).toFixed(
                                        2
                                      )
                                    }
                                    {' '}
                                    MXN
                                  </td>

                                  <td className="py-4 pr-6 text-gray-400 text-sm">
                                    {payment.method || '-'}
                                  </td>

                                  <td className="py-4 pr-6 text-gray-500 text-sm">
                                    {payment.reference || '-'}
                                  </td>

                                  <td className="py-4">

                                    <span className="bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] px-2.5 py-1 rounded-full text-xs">
                                      Pagado
                                    </span>

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

            </SectionCard>

          </div>

        )
      }


      {/* ================================================== */}
      {/* ACCESO */}
      {/* ================================================== */}

      {
        activeTab ===
        'access' &&
        (

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">


            <SectionCard
              title="Cuenta principal"
              subtitle="Credenciales del propietario del gimnasio"
            >

              <InfoRow
                icon={
                  Mail
                }
                label="Correo de acceso"
                value={
                  gym.access?.email ||
                  'Sin correo'
                }
              />

              <InfoRow
                icon={
                  ShieldCheck
                }
                label="Estado de la cuenta"
                value={
                  statusInfo.label
                }
              />

              <InfoRow
                icon={
                  Clock3
                }
                label="Último inicio de sesión"
                value={
                  formatDateTime(
                    gym.access
                      ?.lastLoginAt
                  )
                }
              />


              <div className="flex flex-wrap gap-2 mt-5">

                <button
                  type="button"
                  onClick={
                    copyEmail
                  }
                  className="h-10 px-4 rounded-xl bg-[#171717] border border-[#282828] text-gray-300 text-sm flex items-center gap-2"
                >

                  <Copy
                    className="w-4 h-4"
                  />

                  Copiar correo

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setModal(
                      'password'
                    )
                  }
                  className="h-10 px-4 rounded-xl bg-[#00ff88] text-black font-semibold text-sm flex items-center gap-2"
                >

                  <KeyRound
                    className="w-4 h-4"
                  />

                  Restablecer contraseña

                </button>

              </div>

            </SectionCard>


            <SectionCard
              title="Seguridad"
              subtitle="Las contraseñas no se almacenan visibles"
            >

              <div className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4">

                <div className="flex items-start gap-3">

                  <ShieldCheck
                    className="w-5 h-5 text-[#00ff88] mt-0.5"
                  />

                  <div>

                    <p className="text-white text-sm font-medium">
                      Contraseña protegida
                    </p>

                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      NEXGYM guarda el hash de la contraseña. Si el cliente la pierde, no se recupera la anterior: se crea una contraseña temporal nueva.
                    </p>

                  </div>

                </div>

              </div>


              {
                gym.access
                  ?.mustChangePassword &&
                (

                  <div className="mt-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">

                    <p className="text-yellow-400 text-xs">
                      El propietario tiene una contraseña temporal pendiente de cambiar.
                    </p>

                  </div>

                )
              }

            </SectionCard>

          </div>

        )
      }


      {/* ================================================== */}
      {/* USUARIOS */}
      {/* ================================================== */}

      {
        activeTab ===
        'users' &&
        (

          <div className="mt-5">

            <SectionCard
              title="Usuarios del gimnasio"
              subtitle="Dueño, administradores y empleados vinculados al mismo gymId"
            >

              {
                !gym.users?.length
                  ? (

                    <EmptyState
                      icon={
                        Users
                      }
                      title="Sin usuarios"
                      description="No hay usuarios relacionados con este gimnasio."
                    />

                  )
                  : (

                    <div className="space-y-2">

                      {
                        gym.users.map(
                          user => (

                            <div
                              key={
                                user.id
                              }
                              className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4 flex items-center justify-between gap-4"
                            >

                              <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center">

                                  <UserCog
                                    className="w-5 h-5 text-gray-500"
                                  />

                                </div>

                                <div>

                                  <p className="text-white text-sm font-medium">
                                    {user.name}
                                  </p>

                                  <p className="text-gray-600 text-xs mt-1">
                                    {user.email}
                                  </p>

                                </div>

                              </div>


                              <div className="text-right">

                                <p className="text-gray-300 text-xs">
                                  {
                                    user.role ===
                                    'owner'
                                      ? 'Dueño'
                                      : user.role ===
                                        'admin'
                                        ? 'Administrador'
                                        : 'Encargado'
                                  }
                                </p>

                                <p
                                  className={`
                                    text-xs
                                    mt-1

                                    ${
                                      user.status ===
                                      'active'
                                        ? 'text-[#00ff88]'
                                        : 'text-red-400'
                                    }
                                  `}
                                >
                                  {
                                    user.status ===
                                    'active'
                                      ? 'Activo'
                                      : 'Desactivado'
                                  }
                                </p>

                              </div>

                            </div>

                          )
                        )
                      }

                    </div>

                  )
              }

            </SectionCard>

          </div>

        )
      }


      {/* ================================================== */}
      {/* ACTIVIDAD */}
      {/* ================================================== */}

      {
        activeTab ===
        'activity' &&
        (

          <div className="mt-5">

            <SectionCard
              title="Actividad administrativa"
              subtitle="Cambios realizados desde tu panel NEXGYM"
            >

              {
                activity.length ===
                0
                  ? (

                    <EmptyState
                      icon={
                        Activity
                      }
                      title="Sin actividad"
                      description="Todavía no existen movimientos administrativos."
                    />

                  )
                  : (

                    <div className="space-y-1">

                      {
                        activity.map(
                          item => (

                            <div
                              key={
                                item.id
                              }
                              className="py-4 border-b border-[#1e1e1e] last:border-b-0"
                            >

                              <div className="flex items-start justify-between gap-4">

                                <div>

                                  <p className="text-white text-sm font-medium">
                                    {item.title}
                                  </p>

                                  <p className="text-gray-500 text-xs mt-1">
                                    {item.description}
                                  </p>

                                </div>

                                <span className="text-gray-700 text-xs whitespace-nowrap">
                                  {
                                    formatDateTime(
                                      item.date
                                    )
                                  }
                                </span>

                              </div>

                            </div>

                          )
                        )
                      }

                    </div>

                  )
              }

            </SectionCard>

          </div>

        )
      }


      {/* ================================================== */}
      {/* NOTAS */}
      {/* ================================================== */}

      {
        activeTab ===
        'notes' &&
        (

          <div className="mt-5">

            <SectionCard
              title="Notas internas"
              subtitle="Solo visibles desde tu administración NEXGYM"
            >

              <button
                type="button"
                onClick={() =>
                  setModal(
                    'note'
                  )
                }
                className="h-10 px-4 bg-[#00ff88] text-black rounded-xl text-sm font-semibold flex items-center gap-2 mb-5"
              >

                <Plus
                  className="w-4 h-4"
                />

                Agregar nota

              </button>


              {
                !gym.notes?.length
                  ? (

                    <EmptyState
                      icon={
                        FileText
                      }
                      title="Sin notas"
                      description="Todavía no tienes notas internas de este cliente."
                    />

                  )
                  : (

                    <div className="space-y-3">

                      {
                        gym.notes.map(
                          note => (

                            <div
                              key={
                                note.id
                              }
                              className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4"
                            >

                              <div className="flex justify-between gap-4">

                                <p className="text-white text-sm font-medium">
                                  {note.author}
                                </p>

                                <span className="text-gray-700 text-xs">
                                  {
                                    formatDateTime(
                                      note.date
                                    )
                                  }
                                </span>

                              </div>

                              <p className="text-gray-400 text-sm mt-3">
                                {note.content}
                              </p>

                            </div>

                          )
                        )
                      }

                    </div>

                  )
              }

            </SectionCard>

          </div>

        )
      }


      <div className="h-8" />


      {/* ================================================== */}
      {/* MODALES */}
      {/* ================================================== */}

      {
        modal ===
        'password' &&
        (

          <PasswordModal
            gym={
              gym
            }
            error={
              actionError
            }
            setError={
              setActionError
            }
            onClose={() => {

              setModal(
                null
              );

              setActionError(
                ''
              );

            }}
            onSave={
              async password => {

                const result =
                  await resetNexgymGymPassword(
                    gym.id,
                    password
                  );


                if (
                  !result.success
                ) {

                  setActionError(
                    result.message
                  );

                  return;

                }


                loadGym();

                setModal(
                  null
                );

                setActionError(
                  ''
                );

                showSuccess(
                  'Contraseña temporal actualizada.'
                );

              }
            }
          />

        )
      }


      {
        modal ===
        'payment' &&
        (

          <PaymentModal
            gym={
              gym
            }
            error={
              actionError
            }
            setError={
              setActionError
            }
            onClose={() => {

              setModal(
                null
              );

              setActionError(
                ''
              );

            }}
            onSave={
              async data => {

                try {

                  setActionError(
                    ''
                  );


                  const result =
                    await registerNexgymCloudPayment(
                      gym.id,
                      data
                    );


                  if (
                    !result.success
                  ) {

                    setActionError(
                      result.message
                    );

                    return;

                  }


                  await loadGym();

                  setModal(
                    null
                  );

                  setActionError(
                    ''
                  );

                  showSuccess(
                    'Pago registrado correctamente.'
                  );

                } catch (
                  error
                ) {

                  console.error(
                    '❌ Error registrando pago:',
                    error
                  );


                  setActionError(
                    error?.message ||
                    'No se pudo registrar el pago.'
                  );

                }

              }
            }
          />

        )
      }


      {
        modal ===
        'suspend' &&
        (

          <ReasonModal
            title="Suspender servicio"
            description="El dueño y sus empleados ya no podrán iniciar sesión hasta que reactives la cuenta."
            buttonLabel="Suspender"
            danger
            error={
              actionError
            }
            setError={
              setActionError
            }
            onClose={() => {

              setModal(
                null
              );

              setActionError(
                ''
              );

            }}
            onConfirm={
              async reason => {

                const result =
                  await suspendNexgymCloudGym(
                    gym.id,
                    reason
                  );


                if (
                  !result.success
                ) {

                  setActionError(
                    result.message
                  );

                  return;

                }


                await loadGym();

                setModal(
                  null
                );

                showSuccess(
                  'Servicio suspendido.'
                );

              }
            }
          />

        )
      }


      {
        modal ===
        'deactivate' &&
        (

          <ReasonModal
            title="Desactivar cliente"
            description="El cliente conservará su historial, pero quedará marcado como baja/desactivado."
            buttonLabel="Desactivar cliente"
            danger
            error={
              actionError
            }
            setError={
              setActionError
            }
            onClose={() => {

              setModal(
                null
              );

              setActionError(
                ''
              );

            }}
            onConfirm={
              async reason => {

                const result =
                  await deactivateNexgymCloudGym(
                    gym.id,
                    reason
                  );


                if (
                  !result.success
                ) {

                  setActionError(
                    result.message
                  );

                  return;

                }


                await loadGym();

                setModal(
                  null
                );

                showSuccess(
                  'Cliente desactivado.'
                );

              }
            }
          />

        )
      }


      {
        modal ===
        'reactivate' &&
        (

          <ConfirmModal
            title="Reactivar cliente"
            description="El dueño y sus empleados podrán volver a iniciar sesión."
            buttonLabel="Reactivar"
            onClose={() =>
              setModal(
                null
              )
            }
            onConfirm={async () => {

              const result =
                await reactivateNexgymCloudGym(
                  gym.id
                );


              if (
                result.success
              ) {

                await loadGym();

                setModal(
                  null
                );

                showSuccess(
                  'Cliente reactivado.'
                );

              }

            }}
          />

        )
      }


      {
        modal ===
        'note' &&
        (

          <NoteModal
            error={
              actionError
            }
            setError={
              setActionError
            }
            onClose={() => {

              setModal(
                null
              );

              setActionError(
                ''
              );

            }}
            onSave={
              content => {

                const result =
                  addNexgymGymNote(
                    gym.id,
                    content,
                    'Angel García'
                  );


                if (
                  !result.success
                ) {

                  setActionError(
                    result.message
                  );

                  return;

                }


                loadGym();

                setModal(
                  null
                );

                setActionError(
                  ''
                );

                showSuccess(
                  'Nota guardada.'
                );

              }
            }
          />

        )
      }

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
        'Periodo de prueba',
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
// COMPONENTES GENERALES
// ======================================================

const SectionCard = ({
  title,
  subtitle,
  children
}) => {

  return (

    <div className="bg-[#111111] border border-[#202020] rounded-2xl p-6">

      <h3 className="text-white font-semibold">
        {title}
      </h3>

      {
        subtitle &&
        (

          <p className="text-gray-500 text-sm mt-1 mb-5">
            {subtitle}
          </p>

        )
      }

      {children}

    </div>

  );

};


const MetricCard = ({
  icon: Icon,
  label,
  value
}) => {

  return (

    <div className="bg-[#111111] border border-[#202020] rounded-2xl p-5">

      <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center">

        <Icon
          className="w-5 h-5 text-[#00ff88]"
        />

      </div>

      <p className="text-gray-600 text-xs mt-4">
        {label}
      </p>

      <p className="text-white font-semibold mt-1">
        {value}
      </p>

    </div>

  );

};


const InfoRow = ({
  icon: Icon,
  label,
  value
}) => {

  return (

    <div className="flex items-center gap-3 py-4 border-b border-[#1f1f1f] last:border-b-0">

      <div className="w-9 h-9 rounded-lg bg-[#171717] flex items-center justify-center">

        <Icon
          className="w-4 h-4 text-gray-600"
        />

      </div>

      <div>

        <p className="text-gray-600 text-xs">
          {label}
        </p>

        <p className="text-gray-300 text-sm mt-1">
          {value}
        </p>

      </div>

    </div>

  );

};


const ValueCard = ({
  label,
  value,
  highlight = false
}) => {

  return (

    <div className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4">

      <p className="text-gray-600 text-xs">
        {label}
      </p>

      <p
        className={`
          font-semibold
          mt-2
          ${
            highlight
              ? 'text-[#00ff88]'
              : 'text-white'
          }
        `}
      >
        {value}
      </p>

    </div>

  );

};


const ActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  danger,
  warning,
  success,
  disabled
}) => {

  return (

    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className={`
        text-left
        rounded-xl
        border
        p-4
        transition-all
        disabled:opacity-30
        disabled:cursor-not-allowed

        ${
          danger
            ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
            : warning
              ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10'
              : success
                ? 'bg-[#00ff88]/5 border-[#00ff88]/20 hover:bg-[#00ff88]/10'
                : 'bg-[#0c0c0c] border-[#242424] hover:border-[#353535]'
        }
      `}
    >

      <Icon
        className={`
          w-5
          h-5

          ${
            danger
              ? 'text-red-400'
              : warning
                ? 'text-orange-400'
                : success
                  ? 'text-[#00ff88]'
                  : 'text-gray-400'
          }
        `}
      />

      <p className="text-white text-sm font-medium mt-3">
        {title}
      </p>

      <p className="text-gray-600 text-xs mt-1 leading-relaxed">
        {description}
      </p>

    </button>

  );

};


const EmptyState = ({
  icon: Icon,
  title,
  description
}) => {

  return (

    <div className="py-10 text-center">

      <Icon
        className="w-10 h-10 text-gray-800 mx-auto"
      />

      <p className="text-white text-sm mt-4">
        {title}
      </p>

      <p className="text-gray-600 text-xs mt-1">
        {description}
      </p>

    </div>

  );

};


const TableHeader = ({
  children
}) => {

  return (

    <th className="py-3 pr-6 text-left uppercase tracking-wider text-[10px] font-semibold text-gray-600">
      {children}
    </th>

  );

};


// ======================================================
// BASE MODAL
// ======================================================

const ModalShell = ({
  title,
  description,
  children,
  onClose
}) => {

  return (

    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="w-full max-w-lg bg-[#111111] border border-[#292929] rounded-2xl shadow-2xl">

        <div className="p-5 border-b border-[#202020] flex items-start justify-between gap-4">

          <div>

            <h3 className="text-white font-semibold">
              {title}
            </h3>

            {
              description &&
              (

                <p className="text-gray-500 text-sm mt-1">
                  {description}
                </p>

              )
            }

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="w-9 h-9 rounded-lg hover:bg-[#1c1c1c] text-gray-500 hover:text-white flex items-center justify-center"
          >

            <X
              className="w-4 h-4"
            />

          </button>

        </div>

        {children}

      </div>

    </div>

  );

};


// ======================================================
// PASSWORD MODAL
// ======================================================

const PasswordModal = ({
  gym,
  onClose,
  onSave,
  error,
  setError
}) => {

  const [
    password,
    setPassword
  ] = useState('');


  const generatePassword =
    () => {

      const random =
        Math.random()
          .toString(36)
          .slice(
            -5
          );


      setPassword(
        `Nex${random}#2026`
      );

    };


  return (

    <ModalShell
      title="Restablecer contraseña"
      description={`Cuenta: ${gym.access?.email || ''}`}
      onClose={
        onClose
      }
    >

      <div className="p-5">

        <label className="text-gray-400 text-xs">
          Nueva contraseña temporal
        </label>

        <div className="flex gap-2 mt-2">

          <input
            type="text"
            value={
              password
            }
            onChange={
              event => {

                setPassword(
                  event.target.value
                );

                setError(
                  ''
                );

              }
            }
            className="flex-1 h-11 bg-[#0c0c0c] border border-[#282828] rounded-xl px-4 text-white outline-none"
            placeholder="Mínimo 8 caracteres"
          />

          <button
            type="button"
            onClick={
              generatePassword
            }
            className="px-4 rounded-xl bg-[#171717] border border-[#282828] text-gray-300 text-xs"
          >
            Generar
          </button>

        </div>


        {
          error &&
          (

            <p className="text-red-400 text-xs mt-3">
              {error}
            </p>

          )
        }


        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 mt-4">

          <p className="text-yellow-400 text-xs">
            Copia esta contraseña antes de cerrar la ventana. Después NEXGYM conservará únicamente su hash.
          </p>

        </div>


        <div className="flex justify-end gap-2 mt-5">

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 px-4 text-gray-400 text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() =>
              onSave(
                password
              )
            }
            className="h-10 px-5 rounded-xl bg-[#00ff88] text-black font-semibold text-sm"
          >
            Guardar contraseña
          </button>

        </div>

      </div>

    </ModalShell>

  );

};


// ======================================================
// PAYMENT
// ======================================================

const PaymentModal = ({
  gym,
  onClose,
  onSave,
  error,
  setError
}) => {

  const [
    amount,
    setAmount
  ] = useState(
    String(
      gym.subscription
        ?.finalPrice ||
      0
    )
  );


  const [
    method,
    setMethod
  ] = useState(
    'Transferencia'
  );


  const [
    reference,
    setReference
  ] = useState('');


  return (

    <ModalShell
      title="Registrar pago"
      description={`Pago de ${gym.name}`}
      onClose={
        onClose
      }
    >

      <div className="p-5 space-y-4">

        <div>

          <label className="text-gray-400 text-xs">
            Importe
          </label>

          <input
            type="number"
            value={
              amount
            }
            onChange={
              event => {

                setAmount(
                  event.target.value
                );

                setError(
                  ''
                );

              }
            }
            className="mt-2 w-full h-11 bg-[#0c0c0c] border border-[#282828] rounded-xl px-4 text-white outline-none"
          />

        </div>


        <div>

          <label className="text-gray-400 text-xs">
            Método
          </label>

          <select
            value={
              method
            }
            onChange={
              event =>
                setMethod(
                  event.target.value
                )
            }
            className="mt-2 w-full h-11 bg-[#0c0c0c] border border-[#282828] rounded-xl px-4 text-white outline-none"
          >

            <option>
              Transferencia
            </option>

            <option>
              Efectivo
            </option>

            <option>
              Tarjeta
            </option>

            <option>
              Otro
            </option>

          </select>

        </div>


        <div>

          <label className="text-gray-400 text-xs">
            Referencia / comprobante
          </label>

          <input
            type="text"
            value={
              reference
            }
            onChange={
              event =>
                setReference(
                  event.target.value
                )
            }
            className="mt-2 w-full h-11 bg-[#0c0c0c] border border-[#282828] rounded-xl px-4 text-white outline-none"
            placeholder="Opcional"
          />

        </div>


        {
          error &&
          (

            <p className="text-red-400 text-xs">
              {error}
            </p>

          )
        }


        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 px-4 text-gray-400 text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() =>
              onSave({
                amount:
                  Number(
                    amount
                  ),
                method,
                reference
              })
            }
            className="h-10 px-5 bg-[#00ff88] rounded-xl text-black font-semibold text-sm"
          >
            Registrar pago
          </button>

        </div>

      </div>

    </ModalShell>

  );

};


// ======================================================
// REASON
// ======================================================

const ReasonModal = ({
  title,
  description,
  buttonLabel,
  onClose,
  onConfirm,
  error,
  setError
}) => {

  const [
    reason,
    setReason
  ] = useState('');


  return (

    <ModalShell
      title={
        title
      }
      description={
        description
      }
      onClose={
        onClose
      }
    >

      <div className="p-5">

        <label className="text-gray-400 text-xs">
          Motivo
        </label>

        <textarea
          value={
            reason
          }
          onChange={
            event => {

              setReason(
                event.target.value
              );

              setError(
                ''
              );

            }
          }
          rows={4}
          className="mt-2 w-full bg-[#0c0c0c] border border-[#282828] rounded-xl p-4 text-white text-sm outline-none resize-none"
          placeholder="Ej. Falta de pago..."
        />


        {
          error &&
          (

            <p className="text-red-400 text-xs mt-2">
              {error}
            </p>

          )
        }


        <div className="flex justify-end gap-2 mt-5">

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 px-4 text-gray-400 text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() =>
              onConfirm(
                reason
              )
            }
            className="h-10 px-5 bg-red-500 text-white rounded-xl font-semibold text-sm"
          >
            {buttonLabel}
          </button>

        </div>

      </div>

    </ModalShell>

  );

};


// ======================================================
// CONFIRM
// ======================================================

const ConfirmModal = ({
  title,
  description,
  buttonLabel,
  onClose,
  onConfirm
}) => {

  return (

    <ModalShell
      title={
        title
      }
      description={
        description
      }
      onClose={
        onClose
      }
    >

      <div className="p-5">

        <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl p-4 flex gap-3">

          <AlertTriangle
            className="w-5 h-5 text-[#00ff88]"
          />

          <p className="text-gray-400 text-sm">
            Confirma la acción para continuar.
          </p>

        </div>


        <div className="flex justify-end gap-2 mt-5">

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 px-4 text-gray-400 text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            className="h-10 px-5 bg-[#00ff88] text-black rounded-xl font-semibold text-sm"
          >
            {buttonLabel}
          </button>

        </div>

      </div>

    </ModalShell>

  );

};


// ======================================================
// NOTE
// ======================================================

const NoteModal = ({
  onClose,
  onSave,
  error,
  setError
}) => {

  const [
    content,
    setContent
  ] = useState('');


  return (

    <ModalShell
      title="Agregar nota"
      description="Solo será visible para la administración NEXGYM."
      onClose={
        onClose
      }
    >

      <div className="p-5">

        <textarea
          value={
            content
          }
          onChange={
            event => {

              setContent(
                event.target.value
              );

              setError(
                ''
              );

            }
          }
          rows={5}
          className="w-full bg-[#0c0c0c] border border-[#282828] rounded-xl p-4 text-white text-sm outline-none resize-none"
          placeholder="Escribe una nota interna..."
        />


        {
          error &&
          (

            <p className="text-red-400 text-xs mt-2">
              {error}
            </p>

          )
        }


        <div className="flex justify-end gap-2 mt-5">

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 px-4 text-gray-400 text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() =>
              onSave(
                content
              )
            }
            className="h-10 px-5 bg-[#00ff88] text-black rounded-xl font-semibold text-sm"
          >
            Guardar nota
          </button>

        </div>

      </div>

    </ModalShell>

  );

};


export default NexgymGymDetailPage;