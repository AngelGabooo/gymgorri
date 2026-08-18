// src/nexgym/components/layout/NexgymSidebar.jsx

import React from 'react';

import {
  NavLink,
  useNavigate
} from 'react-router-dom';

import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Headphones,
  Activity,
  Settings,
  LogOut,
  Dumbbell,
  WalletCards,
  ShieldCheck
} from 'lucide-react';

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
// SIDEBAR
// ======================================================

const NexgymSidebar = ({
  admin = null
}) => {

  const navigate =
    useNavigate();


  const name =
    admin?.name ||
    'Super Administrador';


  // ======================================================
  // MENÚ
  // ======================================================

  const menuSections = [

    {
      title:
        'GENERAL',

      items: [

        {
          label:
            'Dashboard',

          icon:
            LayoutDashboard,

          path:
            '/nexgym/dashboard'
        },

        {
          label:
            'Gimnasios',

          icon:
            Building2,

          path:
            '/nexgym/gyms'
        }

      ]
    },


    {
      title:
        'NEGOCIO',

      items: [

        {
          label:
            'Suscripciones',

          icon:
            CreditCard,

          path:
            '/nexgym/subscriptions'
        },

        {
          label:
            'Pagos',

          icon:
            WalletCards,

          path:
            '/nexgym/billing'
        }

      ]
    },


    {
      title:
        'OPERACIÓN',

      items: [

        {
          label:
            'Soporte',

          icon:
            Headphones,

          path:
            '/nexgym/support'
        },

        {
          label:
            'Actividad',

          icon:
            Activity,

          path:
            '/nexgym/activity'
        }

      ]
    },


    {
      title:
        'SISTEMA',

      items: [

        {
          label:
            'Configuración',

          icon:
            Settings,

          path:
            '/nexgym/settings'
        }

      ]
    }

  ];


  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout =
    () => {

      try {

        logoutNexgymAdmin();


        navigate(
          '/nexgym/login',
          {
            replace:
              true
          }
        );


        /*
         * Actualizamos el estado global.
         */

        window.dispatchEvent(
          new Event(
            'nexgym-admin-auth-update'
          )
        );

      } catch (error) {

        console.error(
          'Error cerrando sesión:',
          error
        );


        /*
         * Respaldo si falla el servicio.
         */

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

    <aside
      className="
        w-[270px]
        h-screen
        sticky
        top-0
        flex-shrink-0
        bg-[#090909]
        border-r
        border-[#1b1b1b]
        flex
        flex-col
      "
    >


      {/* ================================================== */}
      {/* LOGO */}
      {/* ================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(
            '/nexgym/dashboard'
          )
        }
        className="
          h-20
          flex
          items-center
          px-6
          border-b
          border-[#1b1b1b]
          text-left
          hover:bg-[#0d0d0d]
          transition-all
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-[#00ff88]/10
              border
              border-[#00ff88]/20
              flex
              items-center
              justify-center
            "
          >

            <Dumbbell
              className="w-5 h-5 text-[#00ff88]"
            />

          </div>


          <div>

            <h1 className="text-white font-semibold text-lg tracking-wide">
              NEXGYM
            </h1>

            <p className="text-gray-500 text-xs">
              Centro de administración
            </p>

          </div>

        </div>

      </button>


      {/* ================================================== */}
      {/* MENÚ */}
      {/* ================================================== */}

      <div
        className="
          flex-1
          overflow-y-auto
          px-4
          py-6
        "
      >

        {
          menuSections.map(
            section => (

              <div
                key={
                  section.title
                }
                className="mb-7"
              >

                <p
                  className="
                    px-3
                    mb-2
                    text-[10px]
                    font-semibold
                    tracking-[0.18em]
                    text-gray-600
                  "
                >
                  {section.title}
                </p>


                <div className="space-y-1">

                  {
                    section.items.map(
                      item => {

                        const Icon =
                          item.icon;


                        return (

                          <NavLink
                            key={
                              item.path
                            }
                            to={
                              item.path
                            }
                            className={
                              ({
                                isActive
                              }) => `

                                flex
                                items-center
                                gap-3

                                px-3
                                py-2.5

                                rounded-xl
                                border

                                transition-all
                                duration-200

                                ${
                                  isActive
                                    ? `
                                      bg-[#00ff88]/10
                                      text-[#00ff88]
                                      border-[#00ff88]/10
                                    `
                                    : `
                                      text-gray-400
                                      border-transparent
                                      hover:text-white
                                      hover:bg-[#151515]
                                    `
                                }

                              `
                            }
                          >

                            <Icon
                              className="w-[18px] h-[18px]"
                            />

                            <span className="text-sm font-medium">
                              {item.label}
                            </span>

                          </NavLink>

                        );

                      }
                    )
                  }

                </div>

              </div>

            )
          )
        }

      </div>


      {/* ================================================== */}
      {/* USUARIO */}
      {/* ================================================== */}

      <div className="p-4 border-t border-[#1b1b1b]">

        <div
          className="
            bg-[#111111]
            border
            border-[#1d1d1d]
            rounded-2xl
            p-3
          "
        >

          <button
            type="button"
            onClick={() =>
              navigate(
                '/nexgym/settings'
              )
            }
            className="
              w-full
              flex
              items-center
              gap-3
              text-left
              rounded-xl
              hover:bg-[#161616]
              p-1
              transition-all
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-full
                bg-[#00ff88]/10
                border
                border-[#00ff88]/20
                flex
                items-center
                justify-center
                text-[#00ff88]
                font-semibold
                flex-shrink-0
              "
            >
              {getInitials(name)}
            </div>


            <div className="flex-1 min-w-0">

              <p className="text-white text-sm font-medium truncate">
                {name}
              </p>

              <div className="flex items-center gap-1 mt-1">

                <ShieldCheck
                  className="w-3 h-3 text-[#00ff88]"
                />

                <p className="text-gray-500 text-xs truncate">
                  Super Administrador
                </p>

              </div>

            </div>

          </button>


          {/* ================================================== */}
          {/* CERRAR SESIÓN */}
          {/* ================================================== */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="
              mt-3
              w-full
              flex
              items-center
              justify-center
              gap-2
              px-3
              py-2.5
              rounded-xl
              text-sm
              text-gray-400
              border
              border-transparent
              hover:text-red-400
              hover:border-red-500/10
              hover:bg-red-500/5
              transition-all
            "
          >

            <LogOut
              className="w-4 h-4"
            />

            Cerrar sesión

          </button>

        </div>

      </div>

    </aside>

  );

};


export default NexgymSidebar;