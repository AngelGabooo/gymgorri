// src/nexgym/components/layout/NexgymHeader.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  Bell,
  Search,
  ChevronDown,
  ShieldCheck,
  Settings,
  LogOut,
  Building2,
  CreditCard,
  WalletCards,
  Headphones,
  Activity,
  X,
  Clock3,
  UserRound,
  ExternalLink
} from 'lucide-react';

import {
  useNavigate
} from 'react-router-dom';

import {
  getNexgymGyms,
  getNexgymActivity
} from '../../services/nexgymGymService';

import {
  logoutNexgymAdmin
} from '../../services/nexgymAdminAuthService';


// ======================================================
// INICIALES
// ======================================================

const getInitials = (
  name
) => {

  return String(
    name || 'Administrador'
  )
    .split(' ')
    .filter(Boolean)
    .slice(
      0,
      2
    )
    .map(
      word =>
        word[0]
    )
    .join('')
    .toUpperCase();

};


// ======================================================
// FECHA
// ======================================================

const formatDateTime = (
  value
) => {

  if (!value) {

    return '';

  }


  try {

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

  } catch {

    return '';

  }

};


// ======================================================
// HEADER
// ======================================================

const NexgymHeader = ({
  title = 'Dashboard',
  subtitle = 'Resumen general de NEXGYM',
  admin = null
}) => {

  const navigate =
    useNavigate();


  const profileRef =
    useRef(null);


  const notificationRef =
    useRef(null);


  const searchRef =
    useRef(null);


  const name =
    admin?.name ||
    'Super Administrador';


  const [
    search,
    setSearch
  ] = useState('');


  const [
    gyms,
    setGyms
  ] = useState([]);


  const [
    activity,
    setActivity
  ] = useState([]);


  const [
    profileOpen,
    setProfileOpen
  ] = useState(false);


  const [
    notificationsOpen,
    setNotificationsOpen
  ] = useState(false);


  const [
    searchOpen,
    setSearchOpen
  ] = useState(false);


  // ======================================================
  // CARGAR DATOS
  // ======================================================

  const loadData =
    () => {

      try {

        setGyms(
          getNexgymGyms()
        );


        setActivity(
          getNexgymActivity()
        );

      } catch (error) {

        console.error(
          'Error cargando datos del header NEXGYM:',
          error
        );

      }

    };


  useEffect(
    () => {

      loadData();


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
  // CERRAR MENÚS AL HACER CLICK AFUERA
  // ======================================================

  useEffect(
    () => {

      const handleOutsideClick =
        event => {

          if (
            profileRef.current &&
            !profileRef.current.contains(
              event.target
            )
          ) {

            setProfileOpen(
              false
            );

          }


          if (
            notificationRef.current &&
            !notificationRef.current.contains(
              event.target
            )
          ) {

            setNotificationsOpen(
              false
            );

          }


          if (
            searchRef.current &&
            !searchRef.current.contains(
              event.target
            )
          ) {

            setSearchOpen(
              false
            );

          }

        };


      const handleEscape =
        event => {

          if (
            event.key ===
            'Escape'
          ) {

            setProfileOpen(
              false
            );

            setNotificationsOpen(
              false
            );

            setSearchOpen(
              false
            );

          }

        };


      document.addEventListener(
        'mousedown',
        handleOutsideClick
      );


      document.addEventListener(
        'keydown',
        handleEscape
      );


      return () => {

        document.removeEventListener(
          'mousedown',
          handleOutsideClick
        );


        document.removeEventListener(
          'keydown',
          handleEscape
        );

      };

    },
    []
  );


  // ======================================================
  // OPCIONES GLOBALES
  // ======================================================

  const menuResults = [

    {
      id:
        'dashboard',

      label:
        'Dashboard',

      description:
        'Resumen general',

      path:
        '/nexgym/dashboard',

      icon:
        Activity
    },

    {
      id:
        'gyms',

      label:
        'Gimnasios',

      description:
        'Clientes registrados',

      path:
        '/nexgym/gyms',

      icon:
        Building2
    },

    {
      id:
        'subscriptions',

      label:
        'Suscripciones',

      description:
        'Control de rentas',

      path:
        '/nexgym/subscriptions',

      icon:
        CreditCard
    },

    {
      id:
        'billing',

      label:
        'Pagos',

      description:
        'Historial de cobros',

      path:
        '/nexgym/billing',

      icon:
        WalletCards
    },

    {
      id:
        'support',

      label:
        'Soporte',

      description:
        'Tickets de clientes',

      path:
        '/nexgym/support',

      icon:
        Headphones
    },

    {
      id:
        'activity',

      label:
        'Actividad',

      description:
        'Historial administrativo',

      path:
        '/nexgym/activity',

      icon:
        Activity
    },

    {
      id:
        'settings',

      label:
        'Configuración',

      description:
        'Opciones de NEXGYM',

      path:
        '/nexgym/settings',

      icon:
        Settings
    }

  ];


  // ======================================================
  // RESULTADOS BUSCADOR
  // ======================================================

  const searchResults =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {

          return [];

        }


        const sectionResults =
          menuResults.filter(
            item =>

              item.label
                .toLowerCase()
                .includes(
                  query
                ) ||

              item.description
                .toLowerCase()
                .includes(
                  query
                )

          );


        const gymResults =
          gyms
            .filter(
              gym => {

                return (

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

                  gym.owner
                    ?.name
                    ?.toLowerCase()
                    .includes(
                      query
                    ) ||

                  gym.access
                    ?.email
                    ?.toLowerCase()
                    .includes(
                      query
                    )

                );

              }
            )
            .slice(
              0,
              6
            )
            .map(
              gym => ({

                id:
                  gym.id,

                label:
                  gym.name,

                description:
                  `${gym.gymCode || ''} · ${gym.owner?.name || 'Sin propietario'}`,

                path:
                  `/nexgym/gyms/${gym.id}`,

                icon:
                  Building2

              })
            );


        return [
          ...sectionResults,
          ...gymResults
        ].slice(
          0,
          8
        );

      },
      [
        search,
        gyms
      ]
    );


  // ======================================================
  // NOTIFICACIONES
  // ======================================================

  const notifications =
    useMemo(
      () => {

        return activity
          .slice(
            0,
            6
          );

      },
      [
        activity
      ]
    );


  // ======================================================
  // IR AL LOGIN DEL GIMNASIO
  // ======================================================

  const handleOpenGymLogin =
    () => {

      /*
       * Abrimos en otra pestaña para conservar
       * tu sesión de Super Admin.
       */

      window.open(
        '/login',
        '_blank',
        'noopener,noreferrer'
      );

  };


  // ======================================================
  // NAVEGAR BUSCADOR
  // ======================================================

  const handleSearchNavigate =
    path => {

      setSearch('');

      setSearchOpen(
        false
      );


      navigate(
        path
      );

    };


  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout =
    () => {

      try {

        logoutNexgymAdmin();


        setProfileOpen(
          false
        );


        navigate(
          '/nexgym/login',
          {
            replace:
              true
          }
        );

      } catch (error) {

        console.error(
          'Error cerrando sesión NEXGYM:',
          error
        );


        localStorage.removeItem(
          'nexgym_admin_authenticated'
        );

        localStorage.removeItem(
          'nexgym_admin_session'
        );


        window.location.replace(
          '/nexgym/login'
        );

      }

    };


  return (

    <header
      className="
        h-20
        flex-shrink-0
        border-b
        border-[#1b1b1b]
        bg-[#0a0a0a]
        flex
        items-center
        justify-between
        px-8
        relative
        z-40
      "
    >


      {/* ================================================== */}
      {/* TÍTULO */}
      {/* ================================================== */}

      <div className="min-w-0">

        <h2 className="text-white text-xl font-semibold truncate">
          {title}
        </h2>

        <p className="text-gray-500 text-sm mt-0.5 truncate">
          {subtitle}
        </p>

      </div>


      {/* ================================================== */}
      {/* ACCIONES */}
      {/* ================================================== */}

      <div className="flex items-center gap-3">


        {/* ================================================== */}
        {/* PROBAR SISTEMA DEL GIMNASIO */}
        {/* ================================================== */}

        <button
          type="button"
          onClick={
            handleOpenGymLogin
          }
          className="
            hidden
            xl:flex
            h-10
            items-center
            justify-center
            gap-2
            px-4
            rounded-xl
            bg-[#00ff88]/10
            border
            border-[#00ff88]/20
            text-[#00ff88]
            text-sm
            font-medium
            hover:bg-[#00ff88]/15
            hover:border-[#00ff88]/30
            transition-all
          "
          title="Abrir el login normal del gimnasio en otra pestaña"
        >

          <ExternalLink
            className="w-4 h-4"
          />

          Probar sistema

        </button>


        {/* ================================================== */}
        {/* BUSCADOR */}
        {/* ================================================== */}

        <div
          ref={
            searchRef
          }
          className="relative hidden lg:block"
        >

          <div
            className="
              flex
              items-center
              gap-2
              bg-[#111111]
              border
              border-[#202020]
              rounded-xl
              px-4
              h-10
              w-[300px]
              focus-within:border-[#00ff88]/30
              transition-all
            "
          >

            <Search
              className="w-4 h-4 text-gray-500 flex-shrink-0"
            />


            <input
              type="text"
              value={
                search
              }
              onFocus={() =>
                setSearchOpen(
                  true
                )
              }
              onChange={
                event => {

                  setSearch(
                    event.target.value
                  );

                  setSearchOpen(
                    true
                  );

                }
              }
              placeholder="Buscar cliente o módulo..."
              className="
                w-full
                bg-transparent
                outline-none
                text-sm
                text-white
                placeholder:text-gray-600
              "
            />


            {
              search &&
              (

                <button
                  type="button"
                  onClick={() => {

                    setSearch('');

                    setSearchOpen(
                      false
                    );

                  }}
                  className="text-gray-600 hover:text-white"
                >

                  <X
                    className="w-4 h-4"
                  />

                </button>

              )
            }

          </div>


          {
            searchOpen &&
            search.trim() &&
            (

              <div
                className="
                  absolute
                  top-[48px]
                  right-0
                  w-[360px]
                  bg-[#111111]
                  border
                  border-[#252525]
                  rounded-2xl
                  shadow-2xl
                  overflow-hidden
                  z-[100]
                "
              >

                {
                  searchResults.length >
                  0
                    ? (

                      <div className="p-2">

                        {
                          searchResults.map(
                            result => {

                              const Icon =
                                result.icon;


                              return (

                                <button
                                  key={`${result.id}-${result.path}`}
                                  type="button"
                                  onClick={() =>
                                    handleSearchNavigate(
                                      result.path
                                    )
                                  }
                                  className="
                                    w-full
                                    text-left
                                    p-3
                                    rounded-xl
                                    flex
                                    items-center
                                    gap-3
                                    hover:bg-[#181818]
                                    transition-all
                                  "
                                >

                                  <div
                                    className="
                                      w-9
                                      h-9
                                      rounded-xl
                                      bg-[#00ff88]/10
                                      flex
                                      items-center
                                      justify-center
                                      flex-shrink-0
                                    "
                                  >

                                    <Icon
                                      className="w-4 h-4 text-[#00ff88]"
                                    />

                                  </div>


                                  <div className="min-w-0">

                                    <p className="text-white text-sm font-medium truncate">
                                      {result.label}
                                    </p>

                                    <p className="text-gray-600 text-xs mt-0.5 truncate">
                                      {result.description}
                                    </p>

                                  </div>

                                </button>

                              );

                            }
                          )
                        }

                      </div>

                    )
                    : (

                      <div className="p-6 text-center">

                        <Search
                          className="w-7 h-7 text-gray-800 mx-auto"
                        />

                        <p className="text-gray-500 text-sm mt-3">
                          Sin resultados
                        </p>

                      </div>

                    )
                }

              </div>

            )
          }

        </div>


        {/* ================================================== */}
        {/* NOTIFICACIONES */}
        {/* ================================================== */}

        <div
          ref={
            notificationRef
          }
          className="relative"
        >

          <button
            type="button"
            onClick={() => {

              setNotificationsOpen(
                previous =>
                  !previous
              );

              setProfileOpen(
                false
              );

            }}
            className="
              relative
              w-10
              h-10
              rounded-xl
              bg-[#111111]
              border
              border-[#202020]
              flex
              items-center
              justify-center
              text-gray-400
              hover:text-white
              hover:bg-[#161616]
              transition-all
            "
          >

            <Bell
              className="w-[18px] h-[18px]"
            />


            {
              notifications.length >
              0 &&
              (

                <span
                  className="
                    absolute
                    top-2
                    right-2
                    w-2
                    h-2
                    rounded-full
                    bg-[#00ff88]
                    ring-2
                    ring-[#111111]
                  "
                />

              )
            }

          </button>


          {
            notificationsOpen &&
            (

              <div
                className="
                  absolute
                  right-0
                  top-[48px]
                  w-[380px]
                  bg-[#111111]
                  border
                  border-[#252525]
                  rounded-2xl
                  shadow-2xl
                  overflow-hidden
                  z-[100]
                "
              >

                <div className="px-5 py-4 border-b border-[#202020]">

                  <p className="text-white text-sm font-semibold">
                    Notificaciones
                  </p>

                  <p className="text-gray-600 text-xs mt-1">
                    Actividad reciente de NEXGYM
                  </p>

                </div>


                {
                  notifications.length >
                  0
                    ? (

                      <div className="max-h-[360px] overflow-y-auto">

                        {
                          notifications.map(
                            item => (

                              <button
                                key={
                                  item.id
                                }
                                type="button"
                                onClick={() => {

                                  setNotificationsOpen(
                                    false
                                  );

                                  navigate(
                                    '/nexgym/activity'
                                  );

                                }}
                                className="
                                  w-full
                                  text-left
                                  px-5
                                  py-4
                                  border-b
                                  border-[#1b1b1b]
                                  last:border-b-0
                                  hover:bg-[#161616]
                                "
                              >

                                <p className="text-white text-sm">
                                  {item.title}
                                </p>

                                <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                  {item.description}
                                </p>

                                <p className="text-gray-700 text-[10px] mt-2 flex items-center gap-1">

                                  <Clock3
                                    className="w-3 h-3"
                                  />

                                  {
                                    formatDateTime(
                                      item.date
                                    )
                                  }

                                </p>

                              </button>

                            )
                          )
                        }

                      </div>

                    )
                    : (

                      <div className="py-10 text-center">

                        <Bell
                          className="w-8 h-8 text-gray-800 mx-auto"
                        />

                        <p className="text-gray-600 text-sm mt-3">
                          Sin notificaciones
                        </p>

                      </div>

                    )
                }


                <button
                  type="button"
                  onClick={() => {

                    setNotificationsOpen(
                      false
                    );

                    navigate(
                      '/nexgym/activity'
                    );

                  }}
                  className="
                    w-full
                    h-11
                    border-t
                    border-[#202020]
                    text-[#00ff88]
                    text-xs
                    font-medium
                    hover:bg-[#161616]
                  "
                >
                  Ver toda la actividad
                </button>

              </div>

            )
          }

        </div>


        {/* ================================================== */}
        {/* PERFIL */}
        {/* ================================================== */}

        <div
          ref={
            profileRef
          }
          className="relative"
        >

          <button
            type="button"
            onClick={() => {

              setProfileOpen(
                previous =>
                  !previous
              );

              setNotificationsOpen(
                false
              );

            }}
            className="
              flex
              items-center
              gap-3
              h-11
              px-2
              pr-3
              rounded-xl
              border
              border-transparent
              hover:border-[#222222]
              hover:bg-[#111111]
              transition-all
            "
          >

            <div
              className="
                w-9
                h-9
                rounded-full
                bg-[#00ff88]/10
                border
                border-[#00ff88]/20
                text-[#00ff88]
                flex
                items-center
                justify-center
                text-xs
                font-semibold
              "
            >
              {getInitials(name)}
            </div>


            <div className="hidden md:block text-left">

              <p className="text-white text-sm font-medium leading-none">
                {name}
              </p>

              <div className="flex items-center gap-1 mt-1">

                <ShieldCheck
                  className="w-3 h-3 text-[#00ff88]"
                />

                <p className="text-gray-500 text-xs">
                  Super Admin
                </p>

              </div>

            </div>


            <ChevronDown
              className={`
                w-4
                h-4
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
                  top-[50px]
                  w-[270px]
                  bg-[#111111]
                  border
                  border-[#252525]
                  rounded-2xl
                  shadow-2xl
                  overflow-hidden
                  z-[100]
                "
              >

                <div className="p-4 border-b border-[#202020]">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        w-10
                        h-10
                        rounded-full
                        bg-[#00ff88]/10
                        flex
                        items-center
                        justify-center
                      "
                    >

                      <UserRound
                        className="w-5 h-5 text-[#00ff88]"
                      />

                    </div>


                    <div className="min-w-0">

                      <p className="text-white text-sm font-medium truncate">
                        {name}
                      </p>

                      <p className="text-gray-600 text-xs truncate mt-1">
                        {admin?.email || 'Super Administrador'}
                      </p>

                    </div>

                  </div>

                </div>


                <div className="p-2">

                  <button
                    type="button"
                    onClick={() => {

                      setProfileOpen(
                        false
                      );

                      handleOpenGymLogin();

                    }}
                    className="
                      w-full
                      flex
                      items-center
                      gap-3
                      px-3
                      py-2.5
                      rounded-xl
                      text-[#00ff88]
                      hover:bg-[#00ff88]/5
                      text-sm
                    "
                  >

                    <ExternalLink
                      className="w-4 h-4"
                    />

                    Probar sistema del gym

                  </button>


                  <button
                    type="button"
                    onClick={() => {

                      setProfileOpen(
                        false
                      );

                      navigate(
                        '/nexgym/settings'
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
                      text-sm
                    "
                  >

                    <Settings
                      className="w-4 h-4"
                    />

                    Configuración

                  </button>


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
                      hover:text-red-300
                      hover:bg-red-500/5
                      text-sm
                    "
                  >

                    <LogOut
                      className="w-4 h-4"
                    />

                    Cerrar sesión

                  </button>

                </div>

              </div>

            )
          }

        </div>

      </div>

    </header>

  );

};


export default NexgymHeader;