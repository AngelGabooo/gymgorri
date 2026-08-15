// src/components/Layout/Header.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  createPortal
} from 'react-dom';

import {
  Bell,
  CalendarDays,
  ChevronDown,
  Clock3,
  CreditCard,
  LogOut,
  QrCode,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Users,
  X,
  Zap,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

import {
  useNavigate
} from 'react-router-dom';

import {
  useGymSettings
} from '../../context/GymSettingsContext';

import {
  canAccess,
  changeCurrentUserPassword,
  getCurrentSession,
  getRoleLabel,
  logoutGymUser
} from '../../services/authService';


// ======================================================
// MESES EN ESPAÑOL
// ======================================================

const MONTH_MAP = {
  ene: 0,
  enero: 0,

  feb: 1,
  febrero: 1,

  mar: 2,
  marzo: 2,

  abr: 3,
  abril: 3,

  may: 4,
  mayo: 4,

  jun: 5,
  junio: 5,

  jul: 6,
  julio: 6,

  ago: 7,
  agosto: 7,

  sep: 8,
  sept: 8,
  septiembre: 8,

  oct: 9,
  octubre: 9,

  nov: 10,
  noviembre: 10,

  dic: 11,
  diciembre: 11
};


// ======================================================
// CONVERTIR FECHA
// ======================================================

const parseSubscriptionDate = (
  value
) => {

  if (!value) {
    return null;
  }


  // ====================================================
  // SI YA VIENE EN ISO
  // ====================================================

  const directDate =
    new Date(
      value
    );


  if (
    !Number.isNaN(
      directDate.getTime()
    )
  ) {

    return directDate;

  }


  // ====================================================
  // FORMATO:
  // 14 sep 2026
  // 14 septiembre 2026
  // ====================================================

  const normalized =
    String(
      value
    )
      .trim()
      .toLowerCase()
      .replace(
        /,/g,
        ''
      );


  const parts =
    normalized.split(
      /\s+/
    );


  if (
    parts.length <
    3
  ) {

    return null;

  }


  const day =
    Number(
      parts[0]
    );


  const monthName =
    parts[1];


  const year =
    Number(
      parts[2]
    );


  const month =
    MONTH_MAP[
      monthName
    ];


  if (
    Number.isNaN(day) ||
    Number.isNaN(year) ||
    month === undefined
  ) {

    return null;

  }


  return new Date(
    year,
    month,
    day,
    23,
    59,
    59
  );

};


// ======================================================
// DIFERENCIA DE DÍAS
// ======================================================

const getDaysRemaining = (
  endDate
) => {

  const end =
    parseSubscriptionDate(
      endDate
    );


  if (!end) {
    return null;
  }


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  end.setHours(
    23,
    59,
    59,
    999
  );


  const difference =
    end.getTime() -
    today.getTime();


  return Math.ceil(
    difference /
    (
      1000 *
      60 *
      60 *
      24
    )
  );

};


// ======================================================
// FORMATEAR FECHA
// ======================================================

const formatExpirationDate = (
  value
) => {

  const date =
    parseSubscriptionDate(
      value
    );


  if (!date) {

    return (
      value ||
      'Sin fecha'
    );

  }


  return date.toLocaleDateString(
    'es-MX',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric'
    }
  );

};


// ======================================================
// HEADER
// ======================================================

const Header = ({
  subtitle =
    'Resumen general y actividad del gimnasio'
}) => {

  const navigate =
    useNavigate();


  const {
    settings
  } = useGymSettings();


  // ======================================================
  // ESTADOS
  // ======================================================

  const [
    currentTime,
    setCurrentTime
  ] = useState(
    new Date()
  );


  const [
    notificationOpen,
    setNotificationOpen
  ] = useState(
    false
  );


  const [
    profileOpen,
    setProfileOpen
  ] = useState(
    false
  );


  const [
    members,
    setMembers
  ] = useState([]);


  const [
    session,
    setSession
  ] = useState(
    () =>
      getCurrentSession()
  );


  const [
    passwordModalOpen,
    setPasswordModalOpen
  ] = useState(false);


  const [
    currentPassword,
    setCurrentPassword
  ] = useState('');


  const [
    newPassword,
    setNewPassword
  ] = useState('');


  const [
    confirmPassword,
    setConfirmPassword
  ] = useState('');


  const [
    showCurrentPassword,
    setShowCurrentPassword
  ] = useState(false);


  const [
    showNewPassword,
    setShowNewPassword
  ] = useState(false);


  const [
    passwordError,
    setPasswordError
  ] = useState('');


  const [
    passwordSuccess,
    setPasswordSuccess
  ] = useState('');


  const [
    passwordSaving,
    setPasswordSaving
  ] = useState(false);


  const headerRef =
    useRef(null);


  // ======================================================
  // CARGAR MIEMBROS
  // ======================================================

  const loadMembers =
    () => {

      try {

        const raw =
          localStorage.getItem(
            'gym_control_members'
          );


        if (!raw) {

          setMembers([]);

          return;

        }


        const parsed =
          JSON.parse(
            raw
          );


        setMembers(
          Array.isArray(
            parsed
          )
            ? parsed
            : []
        );

      } catch (error) {

        console.error(
          'Error cargando miembros en Header:',
          error
        );


        setMembers([]);

      }

    };


  // ======================================================
  // ESCUCHAR CAMBIOS
  // ======================================================

  useEffect(
    () => {

      loadMembers();

      setSession(
        getCurrentSession()
      );


      const refresh =
        () => {

          loadMembers();

          setSession(
            getCurrentSession()
          );

        };


      window.addEventListener(
        'gym-storage-update',
        refresh
      );


      window.addEventListener(
        'gym-auth-update',
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
          'gym-auth-update',
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
  // RELOJ EN TIEMPO REAL
  // ======================================================

  useEffect(
    () => {

      const interval =
        setInterval(
          () => {

            setCurrentTime(
              new Date()
            );

          },
          1000
        );


      return () =>
        clearInterval(
          interval
        );

    },
    []
  );


  // ======================================================
  // CERRAR AL HACER CLICK AFUERA
  // ======================================================

  useEffect(
    () => {

      const handleClickOutside =
        event => {

          if (
            headerRef.current &&
            !headerRef.current.contains(
              event.target
            )
          ) {

            setNotificationOpen(
              false
            );


            setProfileOpen(
              false
            );

          }

        };


      document.addEventListener(
        'mousedown',
        handleClickOutside
      );


      return () => {

        document.removeEventListener(
          'mousedown',
          handleClickOutside
        );

      };

    },
    []
  );


  // ======================================================
  // DATOS DEL GYM
  // ======================================================

  const gymName =
    settings?.shortName ||
    settings?.gymName ||
    'GYM CONTROL';


  const gymLogo =
    settings?.logo ||
    '/img/crede.png';


  const displayName =
    session?.name ||
    'Usuario';


  const firstName =
    String(
      displayName
    )
      .trim()
      .split(/\s+/)[0] ||
    'Usuario';


  const roleLabel =
    getRoleLabel(
      session?.role
    );


  const initials =
    String(
      displayName
    )
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        part =>
          part?.[0] ||
          ''
      )
      .join('')
      .toUpperCase() ||
    'U';


  const canOpenSettings =
    canAccess(
      'settings'
    );


  const canOpenMembers =
    canAccess(
      'members'
    );


  // ======================================================
  // SALUDO
  // ======================================================

  const greeting =
    useMemo(
      () => {

        const hour =
          currentTime.getHours();


        if (
          hour >= 5 &&
          hour < 12
        ) {

          return 'Buenos días';

        }


        if (
          hour >= 12 &&
          hour < 19
        ) {

          return 'Buenas tardes';

        }


        return 'Buenas noches';

      },
      [
        currentTime
      ]
    );


  // ======================================================
  // FECHA
  // ======================================================

  const dateString =
    useMemo(
      () => {

        return currentTime.toLocaleDateString(
          'es-MX',
          {
            weekday:
              'long',

            day:
              'numeric',

            month:
              'long',

            year:
              'numeric'
          }
        );

      },
      [
        currentTime
      ]
    );


  // ======================================================
  // HORA CON SEGUNDOS
  // ======================================================

  const timeString =
    useMemo(
      () => {

        return currentTime.toLocaleTimeString(
          'es-MX',
          {
            hour:
              '2-digit',

            minute:
              '2-digit',

            second:
              '2-digit',

            hour12:
              true
          }
        );

      },
      [
        currentTime
      ]
    );


  // ======================================================
  // DÍAS DE ADVERTENCIA DESDE SETTINGS
  // ======================================================

  const warningDays =
    Number(
      settings?.warningDays ??
      5
    );


  // ======================================================
  // GENERAR ALERTAS DE SUSCRIPCIONES
  // ======================================================

  const subscriptionAlerts =
    useMemo(
      () => {

        const alerts = [];


        members.forEach(
          member => {

            const subscription =
              member?.subscription;


            if (
              !subscription ||
              !subscription.endDate
            ) {

              return;

            }


            const remaining =
              getDaysRemaining(
                subscription.endDate
              );


            if (
              remaining ===
              null
            ) {

              return;

            }


            const fullName =
              `${member.firstName || ''} ${member.lastName || ''}`
                .trim() ||
              'Miembro';


            // =============================================
            // VENCIDA
            // =============================================

            if (
              remaining <
              0
            ) {

              alerts.push({

                id:
                  `expired-${member.id}`,

                memberId:
                  member.id,

                memberName:
                  fullName,

                type:
                  'expired',

                days:
                  Math.abs(
                    remaining
                  ),

                endDate:
                  subscription.endDate,

                plan:
                  subscription.planLabel ||
                  subscription.plan ||
                  'Suscripción'

              });


              return;

            }


            // =============================================
            // POR VENCER
            // =============================================

            if (
              remaining <=
              warningDays
            ) {

              alerts.push({

                id:
                  `expiring-${member.id}`,

                memberId:
                  member.id,

                memberName:
                  fullName,

                type:
                  'expiring',

                days:
                  remaining,

                endDate:
                  subscription.endDate,

                plan:
                  subscription.planLabel ||
                  subscription.plan ||
                  'Suscripción'

              });

            }

          }
        );


        // VENCIDAS PRIMERO
        return alerts.sort(
          (
            a,
            b
          ) => {

            if (
              a.type ===
                b.type
            ) {

              return (
                a.days -
                b.days
              );

            }


            return (
              a.type ===
              'expired'
                ? -1
                : 1
            );

          }
        );

      },
      [
        members,
        warningDays
      ]
    );


  // ======================================================
  // ESTADÍSTICAS DE ALERTAS
  // ======================================================

  const expiredCount =
    subscriptionAlerts.filter(
      alert =>
        alert.type ===
        'expired'
    ).length;


  const expiringCount =
    subscriptionAlerts.filter(
      alert =>
        alert.type ===
        'expiring'
    ).length;


  // ======================================================
  // ABRIR MIEMBRO
  // ======================================================

  const openMember =
    memberId => {

      setNotificationOpen(
        false
      );


      navigate(
        `/members/${memberId}`
      );

    };


  // ======================================================
  // CAMBIAR CONTRASEÑA
  // ======================================================

  const handleChangePassword =
    async event => {
      event.preventDefault();

      setPasswordError('');
      setPasswordSuccess('');

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        setPasswordError(
          'Completa todos los campos.'
        );
        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setPasswordError(
          'Las nuevas contraseñas no coinciden.'
        );
        return;
      }

      try {
        setPasswordSaving(true);

        const result =
          await changeCurrentUserPassword({
            currentPassword,
            newPassword
          });

        if (!result.success) {
          setPasswordError(
            result.message
          );
          return;
        }

        setPasswordSuccess(
          result.message
        );

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(
          () => {
            setPasswordModalOpen(false);
            setPasswordSuccess('');
          },
          1200
        );
      } catch (error) {
        console.error(
          'Error cambiando contraseña:',
          error
        );

        setPasswordError(
          'No se pudo cambiar la contraseña.'
        );
      } finally {
        setPasswordSaving(false);
      }
    };


  // ======================================================
  // CERRAR SESIÓN
  // ======================================================

  const handleLogout =
    () => {
      logoutGymUser();

      navigate(
        '/login',
        {
          replace: true
        }
      );
    };


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <header
      ref={
        headerRef
      }
      className="
        relative
        z-30
        bg-[#090909]/95
        backdrop-blur-xl
        border-b
        border-white/[0.06]
      "
    >

      {/* ================================================= */}
      {/* LÍNEA SUPERIOR */}
      {/* ================================================= */}

      <div
        className="
          absolute
          top-0
          left-0
          right-0
          h-[1px]
          bg-gradient-to-r
          from-transparent
          via-[#00ff88]/40
          to-transparent
        "
      />


      <div
        className="
          min-h-[100px]
          px-5
          lg:px-7
          flex
          items-center
          justify-between
          gap-5
        "
      >

        {/* ================================================= */}
        {/* SALUDO */}
        {/* ================================================= */}

        <div
          className="
            flex
            items-center
            gap-4
            min-w-0
          "
        >

          <div
            className="
              hidden
              xl:flex
              w-12
              h-12
              rounded-2xl
              bg-[#00ff88]/10
              border
              border-[#00ff88]/20
              items-center
              justify-center
              relative
            "
          >

            <Zap
              size={22}
              className="text-[#00ff88]"
            />


            <span
              className="
                absolute
                -right-1
                -top-1
                w-3
                h-3
                rounded-full
                bg-[#00ff88]
                border-[3px]
                border-[#090909]
              "
            />

          </div>


          <div className="min-w-0">

            <div
              className="
                flex
                items-center
                gap-2
                mb-1
              "
            >

              <span
                className="
                  relative
                  flex
                  h-2
                  w-2
                "
              >

                <span
                  className="
                    animate-ping
                    absolute
                    inline-flex
                    h-full
                    w-full
                    rounded-full
                    bg-[#00ff88]
                    opacity-50
                  "
                />


                <span
                  className="
                    relative
                    inline-flex
                    rounded-full
                    h-2
                    w-2
                    bg-[#00ff88]
                  "
                />

              </span>


              <span
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.18em]
                  text-gray-500
                  font-semibold
                "
              >
                Sistema operativo
              </span>

            </div>


            <h1
              className="
                text-white
                text-2xl
                lg:text-[28px]
                leading-tight
                font-bold
                tracking-tight
              "
            >

              {greeting},{' '}

              <span className="text-[#00ff88]">
                {firstName}
              </span>

            </h1>


            <p
              className="
                hidden
                sm:block
                text-gray-500
                text-xs
                mt-1
              "
            >
              {subtitle}
            </p>

          </div>

        </div>


        {/* ================================================= */}
        {/* ACCIONES */}
        {/* ================================================= */}

        <div
          className="
            flex
            items-center
            gap-2
            lg:gap-3
          "
        >

          {/* ================================================= */}
          {/* ACCESO RÁPIDO */}
          {/* ================================================= */}

          <button
            type="button"
            onClick={() =>
              navigate(
                '/access'
              )
            }
            className="
              hidden
              lg:flex
              h-11
              items-center
              gap-2
              px-4
              rounded-xl
              bg-[#00ff88]/10
              border
              border-[#00ff88]/20
              text-[#00ff88]
              hover:bg-[#00ff88]
              hover:text-black
              transition-all
            "
          >

            <QrCode
              size={17}
            />

            <span
              className="
                text-xs
                font-semibold
              "
            >
              Acceso
            </span>

          </button>


          {/* ================================================= */}
          {/* NOTIFICACIONES REALES */}
          {/* ================================================= */}

          <div className="relative">

            <button
              type="button"
              onClick={() => {

                setNotificationOpen(
                  previous =>
                    !previous
                );


                setProfileOpen(
                  false
                );

              }}
              className="
                relative
                w-11
                h-11
                rounded-xl
                border
                border-white/[0.06]
                bg-[#111111]
                flex
                items-center
                justify-center
                text-gray-500
                hover:text-white
                hover:border-[#00ff88]/30
                transition-all
              "
              title="Notificaciones"
            >

              <Bell
                size={19}
              />


              {/* CONTADOR */}

              {
                subscriptionAlerts.length >
                0 &&
                (

                  <span
                    className="
                      absolute
                      -top-1.5
                      -right-1.5
                      min-w-[20px]
                      h-5
                      px-1.5
                      rounded-full
                      bg-red-500
                      border-[3px]
                      border-[#090909]
                      text-white
                      text-[9px]
                      font-bold
                      flex
                      items-center
                      justify-center
                    "
                  >

                    {
                      subscriptionAlerts.length >
                      99
                        ? '99+'
                        : subscriptionAlerts.length
                    }

                  </span>

                )
              }

            </button>


            {/* ================================================= */}
            {/* PANEL DE NOTIFICACIONES */}
            {/* ================================================= */}

            {
              notificationOpen &&
              (

                <div
                  className="
                    absolute
                    right-0
                    top-[56px]
                    w-[400px]
                    max-w-[calc(100vw-32px)]
                    bg-[#101010]
                    border
                    border-[#252525]
                    rounded-2xl
                    shadow-[0_30px_80px_rgba(0,0,0,0.65)]
                    overflow-hidden
                  "
                >

                  {/* HEADER */}

                  <div
                    className="
                      px-5
                      py-4
                      border-b
                      border-[#202020]
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                    >

                      <div>

                        <p
                          className="
                            text-white
                            font-semibold
                            text-sm
                          "
                        >
                          Suscripciones
                        </p>


                        <p
                          className="
                            text-gray-600
                            text-[11px]
                            mt-0.5
                          "
                        >
                          Vencimientos que requieren atención
                        </p>

                      </div>


                      {
                        subscriptionAlerts.length >
                        0 &&
                        (

                          <span
                            className="
                              px-2.5
                              py-1
                              rounded-full
                              bg-red-500/10
                              text-red-400
                              text-[10px]
                              font-bold
                            "
                          >

                            {subscriptionAlerts.length}

                          </span>

                        )
                      }

                    </div>


                    {/* RESUMEN */}

                    {
                      subscriptionAlerts.length >
                      0 &&
                      (

                        <div
                          className="
                            grid
                            grid-cols-2
                            gap-2
                            mt-4
                          "
                        >

                          <div
                            className="
                              bg-red-500/5
                              border
                              border-red-500/15
                              rounded-xl
                              p-3
                            "
                          >

                            <p
                              className="
                                text-red-400
                                text-xl
                                font-bold
                              "
                            >
                              {expiredCount}
                            </p>

                            <p
                              className="
                                text-gray-500
                                text-[10px]
                              "
                            >
                              Vencidas
                            </p>

                          </div>


                          <div
                            className="
                              bg-yellow-500/5
                              border
                              border-yellow-500/15
                              rounded-xl
                              p-3
                            "
                          >

                            <p
                              className="
                                text-yellow-400
                                text-xl
                                font-bold
                              "
                            >
                              {expiringCount}
                            </p>

                            <p
                              className="
                                text-gray-500
                                text-[10px]
                              "
                            >
                              Por vencer
                            </p>

                          </div>

                        </div>

                      )
                    }

                  </div>


                  {/* ================================================= */}
                  {/* SIN ALERTAS */}
                  {/* ================================================= */}

                  {
                    subscriptionAlerts.length ===
                    0
                      ? (

                        <div
                          className="
                            px-6
                            py-10
                            text-center
                          "
                        >

                          <div
                            className="
                              w-14
                              h-14
                              mx-auto
                              rounded-2xl
                              bg-[#00ff88]/10
                              flex
                              items-center
                              justify-center
                              mb-4
                            "
                          >

                            <ShieldCheck
                              size={26}
                              className="text-[#00ff88]"
                            />

                          </div>


                          <p
                            className="
                              text-white
                              text-sm
                              font-semibold
                            "
                          >
                            Todo está al día
                          </p>


                          <p
                            className="
                              text-gray-500
                              text-xs
                              mt-1
                            "
                          >
                            No existen suscripciones vencidas ni próximas a vencer.
                          </p>

                        </div>

                      )
                      : (

                        /* ============================================= */
                        /* LISTA DE ALERTAS */
                        /* ============================================= */

                        <div
                          className="
                            max-h-[430px]
                            overflow-y-auto
                            p-2
                          "
                        >

                          {
                            subscriptionAlerts.map(
                              alert => {

                                const expired =
                                  alert.type ===
                                  'expired';


                                return (

                                  <button
                                    type="button"
                                    key={
                                      alert.id
                                    }
                                    onClick={() =>
                                      openMember(
                                        alert.memberId
                                      )
                                    }
                                    className="
                                      group
                                      w-full
                                      flex
                                      gap-3
                                      p-3
                                      rounded-xl
                                      hover:bg-[#181818]
                                      transition-colors
                                      text-left
                                    "
                                  >

                                    {/* ICONO */}

                                    <div
                                      className={`
                                        w-10
                                        h-10
                                        shrink-0
                                        rounded-xl
                                        flex
                                        items-center
                                        justify-center

                                        ${
                                          expired
                                            ? 'bg-red-500/10'
                                            : 'bg-yellow-500/10'
                                        }
                                      `}
                                    >

                                      {
                                        expired
                                          ? (

                                            <TriangleAlert
                                              size={18}
                                              className="text-red-400"
                                            />

                                          )
                                          : (

                                            <Clock3
                                              size={18}
                                              className="text-yellow-400"
                                            />

                                          )
                                      }

                                    </div>


                                    {/* INFORMACIÓN */}

                                    <div
                                      className="
                                        flex-1
                                        min-w-0
                                      "
                                    >

                                      <div
                                        className="
                                          flex
                                          items-start
                                          justify-between
                                          gap-2
                                        "
                                      >

                                        <p
                                          className="
                                            text-white
                                            text-sm
                                            font-semibold
                                            truncate
                                          "
                                        >
                                          {alert.memberName}
                                        </p>


                                        <span
                                          className={`
                                            shrink-0
                                            px-2
                                            py-0.5
                                            rounded-full
                                            text-[9px]
                                            font-bold

                                            ${
                                              expired
                                                ? 'bg-red-500/10 text-red-400'
                                                : 'bg-yellow-500/10 text-yellow-400'
                                            }
                                          `}
                                        >

                                          {
                                            expired
                                              ? 'VENCIDA'
                                              : 'POR VENCER'
                                          }

                                        </span>

                                      </div>


                                      <p
                                        className="
                                          text-gray-500
                                          text-[11px]
                                          mt-1
                                        "
                                      >

                                        {
                                          expired
                                            ? (
                                              alert.days === 1
                                                ? 'Venció hace 1 día'
                                                : `Venció hace ${alert.days} días`
                                            )
                                            : alert.days === 0
                                              ? 'Vence hoy'
                                              : alert.days === 1
                                                ? 'Vence mañana'
                                                : `Vence en ${alert.days} días`
                                        }

                                      </p>


                                      <div
                                        className="
                                          flex
                                          items-center
                                          gap-2
                                          mt-2
                                        "
                                      >

                                        <CreditCard
                                          size={11}
                                          className="text-gray-600"
                                        />


                                        <span
                                          className="
                                            text-gray-600
                                            text-[10px]
                                          "
                                        >
                                          {alert.plan}
                                        </span>


                                        <span
                                          className="
                                            w-1
                                            h-1
                                            rounded-full
                                            bg-gray-700
                                          "
                                        />


                                        <span
                                          className="
                                            text-gray-600
                                            text-[10px]
                                          "
                                        >
                                          {formatExpirationDate(
                                            alert.endDate
                                          )}
                                        </span>

                                      </div>

                                    </div>

                                  </button>

                                );

                              }
                            )
                          }

                        </div>

                      )
                  }


                  {/* ================================================= */}
                  {/* FOOTER */}
                  {/* ================================================= */}

                  <div
                    className="
                      border-t
                      border-[#202020]
                      p-2
                    "
                  >

                    <button
                      type="button"
                      onClick={() => {

                        setNotificationOpen(
                          false
                        );


                        navigate(
                          '/subscriptions'
                        );

                      }}
                      className="
                        w-full
                        py-2.5
                        rounded-xl
                        text-[#00ff88]
                        hover:bg-[#00ff88]/5
                        text-xs
                        font-semibold
                        transition-colors
                      "
                    >
                      Ver todas las suscripciones
                    </button>

                  </div>

                </div>

              )
            }

          </div>


          {/* ================================================= */}
          {/* FECHA Y HORA */}
          {/* ================================================= */}

          <div
            className="
              hidden
              xl:flex
              items-center
              h-11
              bg-[#111111]
              border
              border-white/[0.06]
              rounded-xl
              overflow-hidden
            "
          >

            {/* FECHA */}

            <div
              className="
                flex
                items-center
                gap-2
                px-3
                border-r
                border-[#242424]
              "
            >

              <CalendarDays
                size={15}
                className="text-[#00ff88]"
              />


              <span
                className="
                  text-gray-400
                  text-[11px]
                  capitalize
                  whitespace-nowrap
                "
              >
                {dateString}
              </span>

            </div>


            {/* HORA */}

            <div
              className="
                flex
                items-center
                gap-2
                px-3
                min-w-[142px]
              "
            >

              <Clock3
                size={15}
                className="text-[#00ff88]"
              />


              <span
                className="
                  text-white
                  text-xs
                  font-mono
                  font-bold
                  tracking-wide
                  whitespace-nowrap
                "
              >
                {timeString}
              </span>

            </div>

          </div>


          {/* ================================================= */}
          {/* PERFIL */}
          {/* ================================================= */}

          <div className="relative">

            <button
              type="button"
              onClick={() => {

                setProfileOpen(
                  previous =>
                    !previous
                );


                setNotificationOpen(
                  false
                );

              }}
              className="
                flex
                items-center
                gap-2
                pl-1
                pr-2
                py-1
                rounded-xl
                hover:bg-[#141414]
                border
                border-transparent
                hover:border-[#242424]
                transition-all
              "
            >

              <div
                className="
                  relative
                  w-10
                  h-10
                  rounded-xl
                  overflow-hidden
                  border
                  border-[#00ff88]/30
                  bg-[#111111]
                "
              >

                <div className="w-full h-full bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] text-xs font-black">
                  {initials}
                </div>


                <span
                  className="
                    absolute
                    right-0
                    bottom-0
                    w-2.5
                    h-2.5
                    rounded-full
                    bg-[#00ff88]
                    border-2
                    border-[#090909]
                  "
                />

              </div>


              <ChevronDown
                size={14}
                className={`
                  hidden
                  2xl:block
                  text-gray-600
                  transition-transform

                  ${
                    profileOpen
                      ? 'rotate-180'
                      : ''
                  }
                `}
              />

            </button>


            {
              profileOpen &&
              (

                <div
                  className="
                    absolute
                    right-0
                    top-[56px]
                    w-64
                    bg-[#101010]
                    border
                    border-[#252525]
                    rounded-2xl
                    shadow-2xl
                    overflow-hidden
                  "
                >

                  <div
                    className="
                      p-4
                      border-b
                      border-[#202020]
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >

                      <div
                        className="
                          w-10
                          h-10
                          rounded-xl
                          bg-[#00ff88]/10
                          flex
                          items-center
                          justify-center
                        "
                      >

                        <ShieldCheck
                          size={19}
                          className="text-[#00ff88]"
                        />

                      </div>


                      <div
                        className="
                          min-w-0
                        "
                      >

                        <p
                          className="
                            text-white
                            text-sm
                            font-semibold
                          "
                        >
                          {displayName}
                        </p>


                        <p
                          className="
                            text-gray-600
                            text-[10px]
                            truncate
                          "
                        >
                          {roleLabel}
                          {session?.email ? ` · ${session.email}` : ''}
                        </p>

                      </div>

                    </div>

                  </div>


                  <div className="p-2">

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        setPasswordError('');
                        setPasswordSuccess('');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordModalOpen(true);
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-gray-400
                        hover:text-white
                        hover:bg-[#181818]
                        transition-colors
                      "
                    >
                      <KeyRound size={16} />

                      <span className="text-xs">
                        Cambiar contraseña
                      </span>
                    </button>


                    {canOpenSettings && (

                    <button
                      type="button"
                      onClick={() => {

                        setProfileOpen(
                          false
                        );


                        navigate(
                          '/settings'
                        );

                      }}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-gray-400
                        hover:text-white
                        hover:bg-[#181818]
                        transition-colors
                      "
                    >

                      <Settings
                        size={16}
                      />

                      <span className="text-xs">
                        Configuración
                      </span>

                    </button>

                    )}



                    {canOpenMembers && (

                    <button
                      type="button"
                      onClick={() => {

                        setProfileOpen(
                          false
                        );


                        navigate(
                          '/members'
                        );

                      }}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-gray-400
                        hover:text-white
                        hover:bg-[#181818]
                        transition-colors
                      "
                    >

                      <Users
                        size={16}
                      />

                      <span className="text-xs">
                        Miembros
                      </span>

                    </button>

                    )}


                  </div>


                  <div
                    className="
                      border-t
                      border-[#202020]
                      p-2
                    "
                  >

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-red-400
                        hover:bg-red-500/10
                        transition-colors
                      "
                    >

                      <LogOut
                        size={16}
                      />

                      <span
                        className="
                          text-xs
                          font-medium
                        "
                      >
                        Cerrar sesión
                      </span>

                    </button>

                  </div>

                </div>

              )
            }

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* MODAL CAMBIAR CONTRASEÑA */}
      {/* Se renderiza en document.body para evitar que el  */}
      {/* backdrop-blur del Header recorte el modal fixed.   */}
      {/* ================================================= */}

      {passwordModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Cambiar contraseña"
          >
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
              <button
                type="button"
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => {
                  if (!passwordSaving) {
                    setPasswordModalOpen(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }
                }}
                aria-label="Cerrar"
              />

              <form
                onSubmit={handleChangePassword}
                className="relative z-10 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-[#262626] bg-[#101010] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
              >
                <div className="sticky top-0 z-20 p-6 border-b border-[#202020] bg-[#101010] flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[#00ff88] text-[10px] font-bold tracking-[0.16em] uppercase">
                      Seguridad
                    </p>

                    <h3 className="text-white text-xl font-bold mt-1">
                      Cambiar contraseña
                    </h3>

                    <p className="text-gray-500 text-xs mt-1">
                      Actualiza la contraseña de {displayName}.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={passwordSaving}
                    onClick={() => {
                      setPasswordModalOpen(false);
                      setPasswordError('');
                      setPasswordSuccess('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-9 h-9 shrink-0 rounded-xl bg-[#181818] border border-[#282828] text-gray-500 hover:text-white hover:border-[#00ff88]/30 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-white text-xs font-medium block mb-2">
                      Contraseña actual
                    </label>

                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={event => {
                          setCurrentPassword(event.target.value);
                          setPasswordError('');
                          setPasswordSuccess('');
                        }}
                        className="w-full bg-[#181818] border border-[#292929] rounded-xl px-4 pr-11 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88]/50"
                        placeholder="Ingresa tu contraseña actual"
                        autoComplete="current-password"
                        autoFocus
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(previous => !previous)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                        aria-label={showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showCurrentPassword
                          ? <EyeOff size={17} />
                          : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-white text-xs font-medium block mb-2">
                      Nueva contraseña
                    </label>

                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={event => {
                          setNewPassword(event.target.value);
                          setPasswordError('');
                          setPasswordSuccess('');
                        }}
                        className="w-full bg-[#181818] border border-[#292929] rounded-xl px-4 pr-11 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88]/50"
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword(previous => !previous)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                        aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showNewPassword
                          ? <EyeOff size={17} />
                          : <Eye size={17} />}
                      </button>
                    </div>

                    <p className="text-gray-600 text-[11px] mt-1.5">
                      Debe tener al menos 8 caracteres y ser diferente a la contraseña actual.
                    </p>
                  </div>

                  <div>
                    <label className="text-white text-xs font-medium block mb-2">
                      Confirmar nueva contraseña
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={event => {
                        setConfirmPassword(event.target.value);
                        setPasswordError('');
                        setPasswordSuccess('');
                      }}
                      className="w-full bg-[#181818] border border-[#292929] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88]/50"
                      placeholder="Repite la nueva contraseña"
                      autoComplete="new-password"
                    />
                  </div>

                  {passwordError && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-xs">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 px-4 py-3 text-[#00ff88] text-xs flex items-center gap-2">
                      <CheckCircle2 size={15} />
                      {passwordSuccess}
                    </div>
                  )}

                  <div className="pt-1 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={passwordSaving}
                      onClick={() => {
                        setPasswordModalOpen(false);
                        setPasswordError('');
                        setPasswordSuccess('');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="py-3 rounded-xl bg-[#181818] border border-[#292929] text-gray-300 font-semibold hover:border-[#00ff88]/30 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="py-3 rounded-xl bg-[#00ff88] text-black font-bold hover:bg-[#00e879] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordSaving ? 'Guardando...' : 'Actualizar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

    </header>

  );

};


export default Header;