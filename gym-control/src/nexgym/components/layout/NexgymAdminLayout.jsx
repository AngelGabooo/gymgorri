// src/nexgym/components/layout/NexgymAdminLayout.jsx

import React, {
  useEffect,
  useState
} from 'react';

import {
  Outlet,
  useLocation,
  useNavigate
} from 'react-router-dom';

import NexgymSidebar from './NexgymSidebar';
import NexgymHeader from './NexgymHeader';

import {
  getCurrentNexgymAdminSession
} from '../../services/nexgymAdminAuthService';


// ======================================================
// LAYOUT
// ======================================================

const NexgymAdminLayout = () => {

  const location =
    useLocation();


  const navigate =
    useNavigate();


  const [
    admin,
    setAdmin
  ] = useState(
    getCurrentNexgymAdminSession()
  );


  // ======================================================
  // ESCUCHAR CAMBIOS DE SESIÓN
  // ======================================================

  useEffect(
    () => {

      const syncAdmin =
        () => {

          const currentAdmin =
            getCurrentNexgymAdminSession();


          setAdmin(
            currentAdmin
          );


          /*
           * Si desapareció la sesión mientras estamos
           * dentro del panel, regresar al login.
           */

          if (!currentAdmin) {

            navigate(
              '/nexgym/login',
              {
                replace:
                  true
              }
            );

          }

        };


      window.addEventListener(
        'nexgym-admin-auth-update',
        syncAdmin
      );


      window.addEventListener(
        'storage',
        syncAdmin
      );


      return () => {

        window.removeEventListener(
          'nexgym-admin-auth-update',
          syncAdmin
        );


        window.removeEventListener(
          'storage',
          syncAdmin
        );

      };

    },
    [
      navigate
    ]
  );


  // ======================================================
  // HEADER SEGÚN RUTA
  // ======================================================

  const getHeaderInfo =
    () => {

      const path =
        location.pathname;


      if (
        path.startsWith(
          '/nexgym/dashboard'
        )
      ) {

        return {

          title:
            'Dashboard',

          subtitle:
            'Resumen general de NEXGYM'

        };

      }


      if (
        path ===
        '/nexgym/gyms/new'
      ) {

        return {

          title:
            'Nuevo gimnasio',

          subtitle:
            'Registra un nuevo cliente en NEXGYM'

        };

      }


      if (
        path.startsWith(
          '/nexgym/gyms'
        )
      ) {

        return {

          title:
            'Gimnasios',

          subtitle:
            'Administra todos los gimnasios registrados'

        };

      }


      if (
        path.startsWith(
          '/nexgym/subscriptions'
        )
      ) {

        return {

          title:
            'Suscripciones',

          subtitle:
            'Gestiona suscripciones, vencimientos y estados'

        };

      }


      if (
        path.startsWith(
          '/nexgym/billing'
        )
      ) {

        return {

          title:
            'Pagos',

          subtitle:
            'Consulta pagos e ingresos de NEXGYM'

        };

      }


      if (
        path.startsWith(
          '/nexgym/support'
        )
      ) {

        return {

          title:
            'Soporte',

          subtitle:
            'Administra solicitudes y tickets de clientes'

        };

      }


      if (
        path.startsWith(
          '/nexgym/activity'
        )
      ) {

        return {

          title:
            'Actividad',

          subtitle:
            'Consulta la actividad administrativa del sistema'

        };

      }


      if (
        path.startsWith(
          '/nexgym/settings'
        )
      ) {

        return {

          title:
            'Configuración',

          subtitle:
            'Configura las opciones generales de NEXGYM'

        };

      }


      if (
        path.startsWith(
          '/nexgym/test'
        )
      ) {

        return {

          title:
            'Pruebas',

          subtitle:
            'Área de prueba del panel NEXGYM'

        };

      }


      return {

        title:
          'NEXGYM',

        subtitle:
          'Centro de administración'

      };

    };


  const headerInfo =
    getHeaderInfo();


  // ======================================================
  // SIN SESIÓN
  // ======================================================

  if (!admin) {

    return null;

  }


  return (

    <div
      className="
        h-screen
        bg-[#070707]
        flex
        overflow-hidden
      "
    >


      {/* ================================================== */}
      {/* SIDEBAR */}
      {/* ================================================== */}

      <NexgymSidebar
        admin={
          admin
        }
      />


      {/* ================================================== */}
      {/* ÁREA PRINCIPAL */}
      {/* ================================================== */}

      <div
        className="
          flex-1
          min-w-0
          h-screen
          flex
          flex-col
          overflow-hidden
        "
      >


        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <NexgymHeader
          title={
            headerInfo.title
          }
          subtitle={
            headerInfo.subtitle
          }
          admin={
            admin
          }
        />


        {/* ================================================== */}
        {/* CONTENIDO */}
        {/* ================================================== */}

        <main
          className="
            flex-1
            min-h-0
            bg-[#0a0a0a]
            overflow-y-auto
          "
        >

          <Outlet />

        </main>


      </div>

    </div>

  );

};


export default NexgymAdminLayout;