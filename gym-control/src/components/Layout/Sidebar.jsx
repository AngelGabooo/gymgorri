// src/components/Layout/Sidebar.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  LayoutDashboard,
  Users,
  CreditCard,
  QrCode,
  Calendar,
  UserCheck,
  UserMinus,
  ShieldAlert,
  DollarSign,
  BarChart3,
  ShoppingCart,
  PackageSearch,
  History,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

import {
  getCurrentSession,
  getRoleLabel,
  logoutGymUser
} from '../../services/authService';

import {
  useGymSettings
} from '../../context/GymSettingsContext';


const Sidebar = ({
  activePage = 'Dashboard'
}) => {

  const navigate =
    useNavigate();


  const {
    settings
  } = useGymSettings();


  const [
    isMobileOpen,
    setIsMobileOpen
  ] = useState(false);


  const [
    session,
    setSession
  ] = useState(
    () =>
      getCurrentSession()
  );


  useEffect(
    () => {

      const refresh =
        () =>
          setSession(
            getCurrentSession()
          );


      window.addEventListener(
        'gym-auth-update',
        refresh
      );


      window.addEventListener(
        'gym-storage-update',
        refresh
      );


      window.addEventListener(
        'storage',
        refresh
      );


      return () => {

        window.removeEventListener(
          'gym-auth-update',
          refresh
        );


        window.removeEventListener(
          'gym-storage-update',
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


  const permissions =
    session?.permissions ||
    [];


  const allItems = [

    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      permission: 'dashboard'
    },

    {
      name: 'Miembros',
      icon: Users,
      path: '/members',
      permission: 'members'
    },

    {
      name: 'Lista negra',
      icon: ShieldAlert,
      path: '/members/blacklist',
      permission: 'members'
    },

    {
      name: 'Suscripciones',
      icon: CreditCard,
      path: '/subscriptions',
      permission: 'subscriptions'
    },

    {
      name: 'Control de acceso',
      icon: QrCode,
      path: '/access',
      permission: 'access'
    },

    {
      name: 'Asistencias',
      icon: Calendar,
      path: '/attendance',
      permission: 'attendance'
    },

    {
      name: 'Retención',
      icon: UserMinus,
      path: '/retention',
      permission: 'retention'
    },

    {
      name: 'Visitas',
      icon: UserCheck,
      path: '/visits',
      permission: 'visits'
    },


    {
      name: 'Ventas',
      icon: ShoppingCart,
      path: '/sales',
      permission: 'sales'
    },

    {
      name: 'Historial ventas',
      icon: History,
      path: '/sales/history',
      permission: 'sales_history'
    },

    {
      name: 'Productos',
      icon: PackageSearch,
      path: '/sales/products',
      permission: 'products'
    },

    {
      name: 'Pagos',
      icon: DollarSign,
      path: '/payments',
      permission: 'payments'
    },

    {
      name: 'Reportes',
      icon: BarChart3,
      path: '/reports',
      permission: 'reports'
    }

  ];


  const menuItems =
    useMemo(
      () =>
        allItems.filter(
          item =>
            session?.role ===
              'owner' ||
            session?.role ===
              'admin' ||
            permissions.includes(
              item.permission
            )
        ),
      [
        session?.role,
        permissions.join('|')
      ]
    );


  const canOpenSettings =
    session?.role ===
      'owner' ||
    session?.role ===
      'admin' ||
    permissions.includes(
      'settings'
    );


  const gymName =
    settings?.shortName ||
    settings?.gymName ||
    'GYM CONTROL';


  const gymLogo =
    settings?.logo ||
    '/img/crede.png';


  const handleLogout =
    () => {

      logoutGymUser();

      navigate(
        '/login',
        {
          replace:
            true
        }
      );

    };


  return (

    <>

      <button
        onClick={() =>
          setIsMobileOpen(
            previous =>
              !previous
          )
        }
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#1a1a1a] p-3 rounded-xl border border-[#2a2a2a]"
      >
        {
          isMobileOpen
            ? (
              <X
                size={24}
                className="text-white"
              />
            )
            : (
              <Menu
                size={24}
                className="text-white"
              />
            )
        }
      </button>


      {
        isMobileOpen &&
        (

          <div
            className="lg:hidden fixed inset-0 bg-black/70 z-40"
            onClick={() =>
              setIsMobileOpen(
                false
              )
            }
          />

        )
      }


      <div
        className={`
          fixed
          lg:static
          inset-y-0
          left-0
          z-40
          w-72
          bg-[#0d0d0d]
          border-r
          border-[#1a1a1a]
          flex
          flex-col
          transform
          transition-transform
          duration-300

          ${
            isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >

        <div className="p-8 border-b border-[#1a1a1a]">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">

              <img
                src={
                  gymLogo
                }
                alt={
                  gymName
                }
                className="w-full h-full object-contain"
              />

            </div>


            <div className="min-w-0">

              <h1 className="text-white text-xl font-bold tracking-wide truncate">
                {gymName}
              </h1>

              <p className="text-gray-500 text-xs tracking-wider mt-0.5">
                SMART GYM MANAGEMENT
              </p>

            </div>

          </div>

        </div>


        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">

          {
            menuItems.map(
              item => {

                const isActive =
                  item.name ===
                  activePage;


                return (

                  <button
                    key={
                      item.name
                    }
                    onClick={() => {

                      navigate(
                        item.path
                      );

                      setIsMobileOpen(
                        false
                      );

                    }}
                    className={`
                      w-full
                      flex
                      items-center
                      gap-4
                      px-5
                      py-3
                      rounded-xl
                      transition-all
                      duration-200

                      ${
                        isActive
                          ? 'bg-[#1a1a1a] text-white border-l-3 border-[#00ff88]'
                          : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                      }
                    `}
                  >

                    <item.icon
                      size={22}
                      className={
                        isActive
                          ? 'text-[#00ff88]'
                          : 'text-gray-500'
                      }
                    />

                    <span className="text-sm font-medium">
                      {item.name}
                    </span>


                    {
                      isActive &&
                      (

                        <span className="ml-auto w-2 h-2 bg-[#00ff88] rounded-full" />

                      )
                    }

                  </button>

                );

              }
            )
          }


          {
            canOpenSettings &&
            (

              <>

                <div className="border-t border-[#1a1a1a] my-6" />


                <button
                  onClick={() =>
                    navigate(
                      '/settings'
                    )
                  }
                  className={`
                    w-full
                    flex
                    items-center
                    gap-4
                    px-5
                    py-3
                    rounded-xl
                    transition-all
                    duration-200

                    ${
                      activePage ===
                        'Configuración'
                        ? 'bg-[#1a1a1a] text-white border-l-3 border-[#00ff88]'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                    }
                  `}
                >

                  <Settings
                    size={22}
                    className={
                      activePage ===
                        'Configuración'
                        ? 'text-[#00ff88]'
                        : 'text-gray-500'
                    }
                  />

                  <span className="text-sm font-medium">
                    Configuración
                  </span>

                </button>

              </>

            )
          }

        </nav>


        <div className="p-6 border-t border-[#1a1a1a]">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88] font-black">

              {
                String(
                  session?.name ||
                  'U'
                )
                  .trim()
                  .charAt(0)
                  .toUpperCase()
              }

            </div>


            <div className="flex-1 min-w-0">

              <p className="text-white text-sm font-medium truncate">
                {
                  session?.name ||
                  'Usuario'
                }
              </p>

              <p className="text-gray-500 text-[10px] truncate">
                {
                  getRoleLabel(
                    session?.role
                  )
                }
              </p>

            </div>


            <button
              onClick={
                handleLogout
              }
              className="text-gray-500 hover:text-red-500 transition-colors p-1"
              title="Cerrar sesión"
            >

              <LogOut
                size={20}
              />

            </button>

          </div>

        </div>

      </div>

    </>

  );

};


export default Sidebar;