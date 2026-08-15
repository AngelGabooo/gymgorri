// src/services/authService.js

import {
  getGymUsers,
  saveGymUsers,
  createGymUserId
} from '../utils/gymSettings';

import {
  hashValue
} from '../utils/memberId';


// ======================================================
// STORAGE
// ======================================================

const SESSION_KEY =
  'gym_control_session';

const AUTH_KEY =
  'isAuthenticated';


// ======================================================
// PERMISOS DEL SISTEMA
// ======================================================

export const PERMISSION_OPTIONS = [

  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Resumen general del gimnasio.'
  },

  {
    id: 'members',
    label: 'Miembros',
    description: 'Consultar, registrar y administrar miembros.'
  },

  {
    id: 'subscriptions',
    label: 'Suscripciones',
    description: 'Consultar y renovar suscripciones.'
  },

  {
    id: 'access',
    label: 'Control de acceso',
    description: 'Utilizar QR, PIN y reconocimiento facial.'
  },

  {
    id: 'attendance',
    label: 'Asistencias',
    description: 'Consultar entradas, salidas y permanencia.'
  },

  {
    id: 'retention',
    label: 'Retención',
    description:
      'Consultar miembros con suscripción activa que han dejado de asistir.'
  },

  {
    id: 'visits',
    label: 'Visitas',
    description: 'Registrar y consultar visitantes.'
  },


  {
    id: 'sales',
    label: 'Realizar ventas',
    description: 'Cobrar productos desde el punto de venta.'
  },

  {
    id: 'sales_history',
    label: 'Historial de ventas',
    description: 'Consultar ventas realizadas, productos vendidos y detalles de cobro.'
  },

  {
    id: 'products',
    label: 'Productos',
    description: 'Consultar el catálogo, precios y existencias de productos.'
  },

  {
    id: 'inventory',
    label: 'Administrar inventario',
    description: 'Crear y editar productos, registrar entradas, salidas y modificar existencias.'
  },

  {
    id: 'inventory_history',
    label: 'Historial de inventario',
    description: 'Consultar entradas, salidas, ventas, devoluciones y ajustes de inventario.'
  },

  {
    id: 'product_analytics',
    label: 'Rendimiento de productos',
    description: 'Consultar costos, ganancias, margen, rotación y productos más vendidos.'
  },

  {
    id: 'payments',
    label: 'Pagos',
    description: 'Consultar pagos e ingresos.'
  },

  {
    id: 'reports',
    label: 'Reportes',
    description: 'Consultar estadísticas y reportes.'
  },

  {
    id: 'settings',
    label: 'Configuración',
    description: 'Modificar configuración general y usuarios.'
  }

];


// ======================================================
// TODOS LOS PERMISOS
// ======================================================

export const ALL_PERMISSIONS =
  PERMISSION_OPTIONS.map(
    item =>
      item.id
  );


// ======================================================
// PERMISOS PREDETERMINADOS RECEPCIÓN
// ======================================================

export const DEFAULT_RECEPTION_PERMISSIONS = [
  'dashboard',
  'access'
];


// ======================================================
// ETIQUETA DE ROL
// ======================================================

export const getRoleLabel = (
  role
) => {

  const labels = {

    owner:
      'Dueño',

    admin:
      'Administrador',

    reception:
      'Encargado / Recepción'

  };


  return (
    labels[role] ||
    'Usuario'
  );

};


// ======================================================
// NORMALIZAR PERMISOS
// ======================================================

export const normalizePermissions = (
  role,
  permissions
) => {

  if (
    role ===
    'owner'
  ) {

    return [
      ...ALL_PERMISSIONS
    ];

  }


  if (
    role ===
    'admin'
  ) {

    return [
      ...ALL_PERMISSIONS
    ];

  }


  const source =
    Array.isArray(
      permissions
    )
      ? permissions
      : DEFAULT_RECEPTION_PERMISSIONS;


  return [
    ...new Set(
      source.filter(
        permission =>
          ALL_PERMISSIONS.includes(
            permission
          )
      )
    )
  ];

};


// ======================================================
// ASEGURAR USUARIO PRINCIPAL
// ======================================================

export const ensureDefaultOwnerUser =
  async () => {

    const users =
      getGymUsers();


    // ==================================================
    // SI YA EXISTEN USUARIOS
    // ==================================================

    if (
      Array.isArray(
        users
      ) &&
      users.length >
      0
    ) {

      let changed =
        false;


      const normalizedUsers =
        users.map(
          (
            user,
            index
          ) => {

            let role =
              user.role;


            // ============================================
            // COMPATIBILIDAD CON USUARIOS ANTIGUOS
            // ============================================

            if (!role) {

              role =
                index === 0
                  ? 'owner'
                  : 'reception';

              changed =
                true;

            }


            const permissions =
              normalizePermissions(
                role,
                user.permissions
              );


            if (
              !Array.isArray(
                user.permissions
              )
            ) {

              changed =
                true;

            }


            return {

              ...user,

              role,

              permissions,

              status:
                user.status ||
                'active'

            };

          }
        );


      if (
        changed
      ) {

        saveGymUsers(
          normalizedUsers
        );

      }


      return normalizedUsers;

    }


    // ==================================================
    // CREAR DUEÑO INICIAL
    // ==================================================

    const now =
      new Date()
        .toISOString();


    const passwordHash =
      await hashValue(
        'Admin123!'
      );


    const owner = {

      id:
        createGymUserId(),

      name:
        'Administrador Principal',

      email:
        'admin@gymcontrol.local',

      passwordHash,

      role:
        'owner',

      permissions: [
        ...ALL_PERMISSIONS
      ],

      status:
        'active',

      createdAt:
        now,

      updatedAt:
        now,

      lastAccessAt:
        null,

      passwordUpdatedAt:
        null

    };


    saveGymUsers([
      owner
    ]);


    return [
      owner
    ];

  };


// ======================================================
// INICIAR SESIÓN
// ======================================================

export const authenticateGymUser =
  async (
    email,
    password
  ) => {

    try {

      // ==================================================
      // ASEGURAR USUARIO PRINCIPAL
      // ==================================================

      await ensureDefaultOwnerUser();


      const normalizedEmail =
        String(
          email ||
          ''
        )
          .trim()
          .toLowerCase();


      const normalizedPassword =
        String(
          password ||
          ''
        );


      // ==================================================
      // VALIDAR CAMPOS
      // ==================================================

      if (
        !normalizedEmail ||
        !normalizedPassword
      ) {

        return {

          success:
            false,

          code:
            'EMPTY_FIELDS',

          message:
            'Ingresa tu correo y contraseña.'

        };

      }


      const users =
        getGymUsers();


      // ==================================================
      // BUSCAR USUARIO
      // ==================================================

      const user =
        users.find(
          item =>
            String(
              item.email ||
              ''
            )
              .trim()
              .toLowerCase() ===
            normalizedEmail
        );


      // ==================================================
      // USUARIO NO EXISTE
      // ==================================================

      if (!user) {

        return {

          success:
            false,

          code:
            'USER_NOT_FOUND',

          message:
            'Este correo no está autorizado para ingresar.'

        };

      }


      // ==================================================
      // USUARIO DESACTIVADO
      // ==================================================

      if (
        user.status !==
        'active'
      ) {

        return {

          success:
            false,

          code:
            'USER_INACTIVE',

          message:
            'Este usuario está desactivado.'

        };

      }


      // ==================================================
      // VALIDAR CONTRASEÑA
      // ==================================================

      const passwordHash =
        await hashValue(
          normalizedPassword
        );


      if (
        passwordHash !==
        user.passwordHash
      ) {

        return {

          success:
            false,

          code:
            'INVALID_PASSWORD',

          message:
            'La contraseña es incorrecta.'

        };

      }


      // ==================================================
      // CREAR SESIÓN
      // ==================================================

      const now =
        new Date()
          .toISOString();


      const role =
        user.role ||
        'reception';


      const permissions =
        normalizePermissions(
          role,
          user.permissions
        );


      const session = {

        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        role,

        permissions,

        loginAt:
          now

      };


      // ==================================================
      // ACTUALIZAR ÚLTIMO ACCESO
      // ==================================================

      const updatedUsers =
        users.map(
          item => {

            if (
              item.id !==
              user.id
            ) {

              return item;

            }


            return {

              ...item,

              role,

              permissions,

              lastAccessAt:
                now,

              updatedAt:
                now

            };

          }
        );


      saveGymUsers(
        updatedUsers
      );


      // ==================================================
      // GUARDAR AUTENTICACIÓN
      // ==================================================

      localStorage.setItem(
        AUTH_KEY,
        'true'
      );


      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(
          session
        )
      );


      window.dispatchEvent(
        new Event(
          'gym-auth-update'
        )
      );


      window.dispatchEvent(
        new Event(
          'gym-storage-update'
        )
      );


      return {

        success:
          true,

        user: {

          ...user,

          role,

          permissions,

          lastAccessAt:
            now

        },

        session

      };

    } catch (error) {

      console.error(
        'Error iniciando sesión:',
        error
      );


      return {

        success:
          false,

        code:
          'LOGIN_ERROR',

        message:
          'No se pudo iniciar sesión.'

      };

    }

  };


// ======================================================
// OBTENER SESIÓN ACTUAL
// ======================================================

export const getCurrentSession =
  () => {

    try {

      const authenticated =
        localStorage.getItem(
          AUTH_KEY
        );


      if (
        authenticated !==
        'true'
      ) {

        return null;

      }


      const rawSession =
        localStorage.getItem(
          SESSION_KEY
        );


      if (
        !rawSession
      ) {

        return null;

      }


      const session =
        JSON.parse(
          rawSession
        );


      if (
        !session?.id
      ) {

        logoutGymUser();

        return null;

      }


      // ==================================================
      // COMPROBAR QUE SIGA EXISTIENDO
      // ==================================================

      const users =
        getGymUsers();


      const user =
        users.find(
          item =>
            item.id ===
            session.id
        );


      if (!user) {

        logoutGymUser();

        return null;

      }


      // ==================================================
      // COMPROBAR QUE SIGA ACTIVO
      // ==================================================

      if (
        user.status !==
        'active'
      ) {

        logoutGymUser();

        return null;

      }


      const role =
        user.role ||
        session.role ||
        'reception';


      const permissions =
        normalizePermissions(
          role,
          user.permissions ||
          session.permissions
        );


      return {

        ...session,

        id:
          user.id,

        name:
          user.name ||
          session.name,

        email:
          user.email ||
          session.email,

        role,

        permissions

      };

    } catch (error) {

      console.error(
        'Error obteniendo sesión:',
        error
      );


      return null;

    }

  };


// ======================================================
// ESTÁ AUTENTICADO
// ======================================================

export const isAuthenticated =
  () => {

    return Boolean(
      getCurrentSession()
    );

  };


// ======================================================
// COMPROBAR PERMISO
// ======================================================

export const canAccess =
  (
    permission
  ) => {

    if (
      !permission
    ) {

      return true;

    }


    const session =
      getCurrentSession();


    if (!session) {

      return false;

    }


    // ==================================================
    // DUEÑO
    // ==================================================

    if (
      session.role ===
      'owner'
    ) {

      return true;

    }


    // ==================================================
    // ADMINISTRADOR
    // ==================================================

    if (
      session.role ===
      'admin'
    ) {

      return true;

    }


    // ==================================================
    // ENCARGADO / RECEPCIÓN
    // ==================================================

    return (
      Array.isArray(
        session.permissions
      ) &&
      session.permissions.includes(
        permission
      )
    );

  };


// ======================================================
// OBTENER PRIMERA RUTA PERMITIDA
// ======================================================

export const getFirstAllowedRoute =
  (
    receivedSession
  ) => {

    const session =
      receivedSession ||
      getCurrentSession();


    if (!session) {

      return '/login';

    }


    if (
      session.role ===
      'owner' ||
      session.role ===
      'admin'
    ) {

      return '/dashboard';

    }


    const permissions =
      normalizePermissions(
        session.role,
        session.permissions
      );


    const routes = [

      {
        permission:
          'dashboard',

        path:
          '/dashboard'
      },

      {
        permission:
          'access',

        path:
          '/access'
      },

      {
        permission:
          'members',

        path:
          '/members'
      },

      {
        permission:
          'subscriptions',

        path:
          '/subscriptions'
      },

      {
        permission:
          'attendance',

        path:
          '/attendance'
      },

      {
        permission:
          'retention',

        path:
          '/retention'
      },

      {
        permission:
          'visits',

        path:
          '/visits'
      },


      {
        permission:
          'sales',

        path:
          '/sales'
      },

      {
        permission:
          'sales_history',

        path:
          '/sales/history'
      },

      {
        permission:
          'products',

        path:
          '/sales/products'
      },

      {
        permission:
          'payments',

        path:
          '/payments'
      },

      {
        permission:
          'reports',

        path:
          '/reports'
      },

      {
        permission:
          'settings',

        path:
          '/settings'
      }

    ];


    const availableRoute =
      routes.find(
        route =>
          permissions.includes(
            route.permission
          )
      );


    if (
      availableRoute
    ) {

      return availableRoute.path;

    }


    return '/login';

  };


// ======================================================
// OBTENER USUARIO ACTUAL COMPLETO
// ======================================================

export const getCurrentUser =
  () => {

    const session =
      getCurrentSession();


    if (!session) {

      return null;

    }


    const users =
      getGymUsers();


    return (
      users.find(
        user =>
          user.id ===
          session.id
      ) ||
      null
    );

  };


// ======================================================
// REFRESCAR SESIÓN ACTUAL
// ======================================================

export const refreshCurrentSession =
  () => {

    const session =
      getCurrentSession();


    if (!session) {

      return null;

    }


    const users =
      getGymUsers();


    const user =
      users.find(
        item =>
          item.id ===
          session.id
      );


    if (!user) {

      logoutGymUser();

      return null;

    }


    if (
      user.status !==
      'active'
    ) {

      logoutGymUser();

      return null;

    }


    const role =
      user.role ||
      'reception';


    const permissions =
      normalizePermissions(
        role,
        user.permissions
      );


    const updatedSession = {

      ...session,

      name:
        user.name,

      email:
        user.email,

      role,

      permissions

    };


    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(
        updatedSession
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-auth-update'
      )
    );


    return updatedSession;

  };


// ======================================================
// CAMBIAR CONTRASEÑA DEL USUARIO ACTUAL
// ======================================================

export const changeCurrentUserPassword =
  async (
    currentPassword,
    newPassword
  ) => {

    try {

      // ==================================================
      // OBTENER SESIÓN
      // ==================================================

      const session =
        getCurrentSession();


      if (!session) {

        return {

          success:
            false,

          code:
            'NO_SESSION',

          message:
            'No existe una sesión activa.'

        };

      }


      // ==================================================
      // NORMALIZAR CONTRASEÑAS
      // ==================================================

      const current =
        String(
          currentPassword ||
          ''
        );


      const next =
        String(
          newPassword ||
          ''
        );


      // ==================================================
      // CAMPOS VACÍOS
      // ==================================================

      if (
        !current ||
        !next
      ) {

        return {

          success:
            false,

          code:
            'EMPTY_FIELDS',

          message:
            'Completa todos los campos.'

        };

      }


      // ==================================================
      // LONGITUD MÍNIMA
      // ==================================================

      if (
        next.length <
        8
      ) {

        return {

          success:
            false,

          code:
            'PASSWORD_TOO_SHORT',

          message:
            'La nueva contraseña debe tener al menos 8 caracteres.'

        };

      }


      // ==================================================
      // NO PERMITIR LA MISMA CONTRASEÑA
      // ==================================================

      if (
        current ===
        next
      ) {

        return {

          success:
            false,

          code:
            'SAME_PASSWORD',

          message:
            'La nueva contraseña debe ser diferente a la actual.'

        };

      }


      // ==================================================
      // BUSCAR USUARIO
      // ==================================================

      const users =
        getGymUsers();


      const userIndex =
        users.findIndex(
          user =>
            user.id ===
            session.id
        );


      if (
        userIndex ===
        -1
      ) {

        return {

          success:
            false,

          code:
            'USER_NOT_FOUND',

          message:
            'No se encontró el usuario de la sesión actual.'

        };

      }


      const currentUser =
        users[
          userIndex
        ];


      // ==================================================
      // VALIDAR CONTRASEÑA ACTUAL
      // ==================================================

      const currentHash =
        await hashValue(
          current
        );


      if (
        currentHash !==
        currentUser.passwordHash
      ) {

        return {

          success:
            false,

          code:
            'INVALID_CURRENT_PASSWORD',

          message:
            'La contraseña actual es incorrecta.'

        };

      }


      // ==================================================
      // GENERAR NUEVO HASH
      // ==================================================

      const newHash =
        await hashValue(
          next
        );


      if (
        newHash ===
        currentUser.passwordHash
      ) {

        return {

          success:
            false,

          code:
            'SAME_PASSWORD',

          message:
            'La nueva contraseña debe ser diferente a la actual.'

        };

      }


      // ==================================================
      // ACTUALIZAR USUARIO
      // ==================================================

      const now =
        new Date()
          .toISOString();


      const updatedUser = {

        ...currentUser,

        passwordHash:
          newHash,

        passwordUpdatedAt:
          now,

        updatedAt:
          now

      };


      const updatedUsers =
        users.map(
          (
            user,
            index
          ) =>
            index ===
            userIndex
              ? updatedUser
              : user
        );


      saveGymUsers(
        updatedUsers
      );


      // ==================================================
      // REFRESCAR SESIÓN
      // ==================================================

      refreshCurrentSession();


      // ==================================================
      // NOTIFICAR CAMBIOS
      // ==================================================

      window.dispatchEvent(
        new Event(
          'gym-auth-update'
        )
      );


      window.dispatchEvent(
        new Event(
          'gym-storage-update'
        )
      );


      return {

        success:
          true,

        code:
          'PASSWORD_UPDATED',

        message:
          'Contraseña actualizada correctamente.'

      };

    } catch (error) {

      console.error(
        'Error cambiando contraseña:',
        error
      );


      return {

        success:
          false,

        code:
          'PASSWORD_UPDATE_ERROR',

        message:
          'No se pudo cambiar la contraseña.'

      };

    }

  };


// ======================================================
// CERRAR SESIÓN
// ======================================================

export const logoutGymUser =
  () => {

    localStorage.removeItem(
      AUTH_KEY
    );


    localStorage.removeItem(
      SESSION_KEY
    );


    window.dispatchEvent(
      new Event(
        'gym-auth-update'
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );

  };