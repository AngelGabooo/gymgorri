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

const NEXGYM_GYMS_KEY =
  'nexgym_gyms';


// ======================================================
// PERMISOS
// ======================================================

export const PERMISSION_OPTIONS = [

  {
    id: 'dashboard',
    label: 'Dashboard',
    description:
      'Resumen general del gimnasio.'
  },

  {
    id: 'members',
    label: 'Miembros',
    description:
      'Consultar, registrar y administrar miembros.'
  },

  {
    id: 'subscriptions',
    label: 'Suscripciones',
    description:
      'Consultar y renovar suscripciones.'
  },

  {
    id: 'access',
    label: 'Control de acceso',
    description:
      'Utilizar QR, PIN y reconocimiento facial.'
  },

  {
    id: 'attendance',
    label: 'Asistencias',
    description:
      'Consultar entradas, salidas y permanencia.'
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
    description:
      'Registrar y consultar visitantes.'
  },

  {
    id: 'sales',
    label: 'Realizar ventas',
    description:
      'Cobrar productos desde el punto de venta.'
  },

  {
    id: 'sales_history',
    label: 'Historial de ventas',
    description:
      'Consultar ventas realizadas.'
  },

  {
    id: 'products',
    label: 'Productos',
    description:
      'Consultar catálogo, precios y existencias.'
  },

  {
    id: 'inventory',
    label: 'Administrar inventario',
    description:
      'Crear y editar productos y existencias.'
  },

  {
    id: 'inventory_history',
    label: 'Historial de inventario',
    description:
      'Consultar movimientos de inventario.'
  },

  {
    id: 'product_analytics',
    label: 'Rendimiento de productos',
    description:
      'Consultar rendimiento y ganancias de productos.'
  },

  {
    id: 'payments',
    label: 'Pagos',
    description:
      'Consultar pagos e ingresos.'
  },

  {
    id: 'cash',
    label: 'Caja',
    description:
      'Administrar caja, gastos y retiros.'
  },

  {
    id: 'reports',
    label: 'Reportes',
    description:
      'Consultar estadísticas y reportes.'
  },

  {
    id: 'settings',
    label: 'Configuración',
    description:
      'Modificar configuración general y usuarios.'
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

  // Dueño y administrador tienen acceso completo.
  if (
    role === 'owner' ||
    role === 'admin'
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
// OBTENER GIMNASIO NEXGYM
// ======================================================

const getNexgymGymById = (
  gymId
) => {

  if (!gymId) {

    return null;

  }


  try {

    const parsed =
      JSON.parse(
        localStorage.getItem(
          NEXGYM_GYMS_KEY
        ) ||
        '[]'
      );


    if (
      !Array.isArray(
        parsed
      )
    ) {

      return null;

    }


    return (
      parsed.find(
        gym =>
          gym.id ===
          gymId
      ) ||
      null
    );

  } catch (error) {

    console.error(
      'Error leyendo gimnasio NEXGYM:',
      error
    );


    return null;

  }

};


// ======================================================
// OBTENER ESTADO ACTUAL DEL GIMNASIO
// ======================================================

const getGymServiceStatus = (
  user
) => {

  if (
    !user?.gymId
  ) {

    return (
      user?.gymStatus ||
      null
    );

  }


  const gym =
    getNexgymGymById(
      user.gymId
    );


  return (
    gym?.subscription?.status ||
    user.gymStatus ||
    null
  );

};


// ======================================================
// ACTUALIZAR ÚLTIMA CONEXIÓN DEL GIMNASIO
// ======================================================

const updateNexgymLastConnection = (
  gymId,
  date
) => {

  if (!gymId) {

    return;

  }


  try {

    const gyms =
      JSON.parse(
        localStorage.getItem(
          NEXGYM_GYMS_KEY
        ) ||
        '[]'
      );


    if (
      !Array.isArray(
        gyms
      )
    ) {

      return;

    }


    const updatedGyms =
      gyms.map(
        gym => {

          if (
            gym.id !==
            gymId
          ) {

            return gym;

          }


          return {

            ...gym,

            lastConnectionAt:
              date,

            access: {

              ...(gym.access || {}),

              lastLoginAt:
                date

            },

            updatedAt:
              date

          };

        }
      );


    localStorage.setItem(
      NEXGYM_GYMS_KEY,
      JSON.stringify(
        updatedGyms
      )
    );


    window.dispatchEvent(
      new Event(
        'nexgym-gyms-update'
      )
    );

  } catch (error) {

    console.error(
      'No se pudo actualizar la conexión del gimnasio:',
      error
    );

  }

};


// ======================================================
// SINCRONIZAR DATOS DEL GIMNASIO EN UN USUARIO
// ======================================================

const normalizeUserGymData = (
  user
) => {

  if (
    !user?.gymId
  ) {

    return user;

  }


  const gym =
    getNexgymGymById(
      user.gymId
    );


  if (!gym) {

    return user;

  }


  return {

    ...user,

    gymCode:
      gym.gymCode ||
      user.gymCode ||
      null,

    gymName:
      gym.name ||
      user.gymName ||
      null,

    gymStatus:
      gym.subscription?.status ||
      user.gymStatus ||
      null

  };

};


// ======================================================
// ASEGURAR USUARIO PRINCIPAL
// ======================================================
//
// Esta cuenta únicamente se crea para mantener
// compatibilidad con instalaciones anteriores.
//
// Los gimnasios creados desde NEXGYM tendrán su propio
// usuario owner con gymId.
//
// ======================================================

export const ensureDefaultOwnerUser =
  async () => {

    const users =
      getGymUsers();


    // ==================================================
    // YA EXISTEN USUARIOS
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


      const normalized =
        users.map(
          (
            originalUser,
            index
          ) => {

            let user =
              normalizeUserGymData(
                originalUser
              );


            const role =
              user.role ||
              (
                index === 0
                  ? 'owner'
                  : 'reception'
              );


            const permissions =
              normalizePermissions(
                role,
                user.permissions
              );


            if (
              !user.role ||
              !Array.isArray(
                user.permissions
              ) ||
              user.role !==
                role ||
              JSON.stringify(
                user.permissions
              ) !==
              JSON.stringify(
                permissions
              ) ||
              user !==
                originalUser
            ) {

              changed = true;

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


      if (changed) {

        saveGymUsers(
          normalized
        );

      }


      return normalized;

    }


    // ==================================================
    // CUENTA LEGACY
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

      gymId:
        null,

      gymCode:
        null,

      gymName:
        null,

      gymStatus:
        null,

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

      mustChangePassword:
        false,

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
// AUTENTICAR
// ======================================================

export const authenticateGymUser =
  async (
    email,
    password
  ) => {

    try {

      await ensureDefaultOwnerUser();


      const normalizedEmail =
        String(
          email || ''
        )
          .trim()
          .toLowerCase();


      const normalizedPassword =
        String(
          password || ''
        );


      if (
        !normalizedEmail ||
        !normalizedPassword
      ) {

        return {

          success: false,

          code:
            'EMPTY_FIELDS',

          message:
            'Ingresa tu correo y contraseña.'

        };

      }


      const users =
        getGymUsers();


      const userIndex =
        users.findIndex(
          item =>
            String(
              item.email || ''
            )
              .trim()
              .toLowerCase() ===
            normalizedEmail
        );


      if (
        userIndex ===
        -1
      ) {

        return {

          success: false,

          code:
            'USER_NOT_FOUND',

          message:
            'Este correo no está autorizado para ingresar.'

        };

      }


      const originalUser =
        users[
          userIndex
        ];


      const user =
        normalizeUserGymData(
          originalUser
        );


      // ==================================================
      // USUARIO DESACTIVADO
      // ==================================================

      if (
        user.status !==
        'active'
      ) {

        return {

          success: false,

          code:
            'USER_INACTIVE',

          message:
            'Este usuario está desactivado.'

        };

      }


      // ==================================================
      // ESTADO DEL SERVICIO NEXGYM
      // ==================================================

      const gymStatus =
        getGymServiceStatus(
          user
        );


      if (
        gymStatus ===
        'suspended'
      ) {

        return {

          success: false,

          code:
            'GYM_SUSPENDED',

          message:
            'El servicio NEXGYM de este gimnasio se encuentra suspendido.'

        };

      }


      // ==================================================
      // PASSWORD
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

          success: false,

          code:
            'INVALID_PASSWORD',

          message:
            'La contraseña es incorrecta.'

        };

      }


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


      // ==================================================
      // SESIÓN
      // ==================================================

      const session = {

        id:
          user.id,

        gymId:
          user.gymId ||
          null,

        gymCode:
          user.gymCode ||
          null,

        gymName:
          user.gymName ||
          null,

        name:
          user.name,

        email:
          user.email,

        role,

        permissions,

        gymStatus,

        mustChangePassword:
          Boolean(
            user.mustChangePassword
          ),

        loginAt:
          now

      };


      // ==================================================
      // ACTUALIZAR USUARIO
      // ==================================================

      const updatedUser = {

        ...user,

        role,

        permissions,

        gymStatus,

        lastAccessAt:
          now,

        updatedAt:
          now

      };


      const updatedUsers =
        users.map(
          (
            item,
            index
          ) =>
            index ===
            userIndex
              ? updatedUser
              : item
        );


      saveGymUsers(
        updatedUsers
      );


      // ==================================================
      // GUARDAR SESIÓN
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


      // ==================================================
      // ACTUALIZAR CONEXIÓN
      // ==================================================

      if (
        user.gymId
      ) {

        updateNexgymLastConnection(
          user.gymId,
          now
        );

      }


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

        success: true,

        user:
          updatedUser,

        session

      };

    } catch (error) {

      console.error(
        'Error iniciando sesión:',
        error
      );


      return {

        success: false,

        code:
          'LOGIN_ERROR',

        message:
          'No se pudo iniciar sesión.'

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


// ======================================================
// OBTENER SESIÓN
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


      const storedSession =
        JSON.parse(
          rawSession
        );


      if (
        !storedSession?.id
      ) {

        logoutGymUser();

        return null;

      }


      const users =
        getGymUsers();


      const originalUser =
        users.find(
          item =>
            item.id ===
            storedSession.id
        );


      if (
        !originalUser
      ) {

        logoutGymUser();

        return null;

      }


      const user =
        normalizeUserGymData(
          originalUser
        );


      if (
        user.status !==
        'active'
      ) {

        logoutGymUser();

        return null;

      }


      const gymStatus =
        getGymServiceStatus(
          user
        );


      if (
        gymStatus ===
        'suspended'
      ) {

        logoutGymUser();

        return null;

      }


      const role =
        user.role ||
        storedSession.role ||
        'reception';


      const permissions =
        normalizePermissions(
          role,
          user.permissions ||
          storedSession.permissions
        );


      const session = {

        ...storedSession,

        id:
          user.id,

        gymId:
          user.gymId ||
          storedSession.gymId ||
          null,

        gymCode:
          user.gymCode ||
          storedSession.gymCode ||
          null,

        gymName:
          user.gymName ||
          storedSession.gymName ||
          null,

        name:
          user.name ||
          storedSession.name,

        email:
          user.email ||
          storedSession.email,

        role,

        permissions,

        gymStatus,

        mustChangePassword:
          Boolean(
            user.mustChangePassword
          )

      };


      return session;

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
// PUEDE ACCEDER
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


    if (
      !session
    ) {

      return false;

    }


    if (
      session.role ===
        'owner' ||
      session.role ===
        'admin'
    ) {

      return true;

    }


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
// PRIMERA RUTA PERMITIDA
// ======================================================

export const getFirstAllowedRoute =
  (
    receivedSession
  ) => {

    const session =
      receivedSession ||
      getCurrentSession();


    if (
      !session
    ) {

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
        permission: 'dashboard',
        path: '/dashboard'
      },

      {
        permission: 'access',
        path: '/access'
      },

      {
        permission: 'members',
        path: '/members'
      },

      {
        permission: 'subscriptions',
        path: '/subscriptions'
      },

      {
        permission: 'attendance',
        path: '/attendance'
      },

      {
        permission: 'retention',
        path: '/retention'
      },

      {
        permission: 'visits',
        path: '/visits'
      },

      {
        permission: 'cash',
        path: '/cash'
      },

      {
        permission: 'sales',
        path: '/sales'
      },

      {
        permission: 'sales_history',
        path: '/sales/history'
      },

      {
        permission: 'products',
        path: '/sales/products'
      },

      {
        permission: 'payments',
        path: '/payments'
      },

      {
        permission: 'reports',
        path: '/reports'
      },

      {
        permission: 'settings',
        path: '/settings'
      }

    ];


    const route =
      routes.find(
        item =>
          permissions.includes(
            item.permission
          )
      );


    return (
      route?.path ||
      '/login'
    );

  };


// ======================================================
// USUARIO ACTUAL
// ======================================================

export const getCurrentUser =
  () => {

    const session =
      getCurrentSession();


    if (
      !session
    ) {

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


    if (
      !user
    ) {

      return null;

    }


    return normalizeUserGymData(
      user
    );

  };


// ======================================================
// REFRESCAR SESIÓN
// ======================================================

export const refreshCurrentSession =
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


      const current =
        JSON.parse(
          rawSession
        );


      if (
        !current?.id
      ) {

        logoutGymUser();

        return null;

      }


      const users =
        getGymUsers();


      const userIndex =
        users.findIndex(
          item =>
            item.id ===
            current.id
        );


      if (
        userIndex ===
        -1
      ) {

        logoutGymUser();

        return null;

      }


      const originalUser =
        users[
          userIndex
        ];


      const user =
        normalizeUserGymData(
          originalUser
        );


      const gymStatus =
        getGymServiceStatus(
          user
        );


      if (
        user.status !==
          'active' ||
        gymStatus ===
          'suspended'
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

        ...current,

        id:
          user.id,

        gymId:
          user.gymId ||
          null,

        gymCode:
          user.gymCode ||
          null,

        gymName:
          user.gymName ||
          null,

        name:
          user.name,

        email:
          user.email,

        role,

        permissions,

        gymStatus,

        mustChangePassword:
          Boolean(
            user.mustChangePassword
          )

      };


      // ==================================================
      // SINCRONIZAR USUARIO
      // ==================================================

      const updatedUser = {

        ...user,

        role,

        permissions,

        gymStatus

      };


      const updatedUsers =
        users.map(
          (
            item,
            index
          ) =>
            index ===
            userIndex
              ? updatedUser
              : item
        );


      saveGymUsers(
        updatedUsers
      );


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

    } catch (error) {

      console.error(
        'Error refrescando sesión:',
        error
      );


      return null;

    }

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

      const session =
        getCurrentSession();


      if (
        !session
      ) {

        return {

          success: false,

          code:
            'NO_SESSION',

          message:
            'No existe una sesión activa.'

        };

      }


      const current =
        String(
          currentPassword || ''
        );


      const next =
        String(
          newPassword || ''
        );


      if (
        !current ||
        !next
      ) {

        return {

          success: false,

          code:
            'EMPTY_FIELDS',

          message:
            'Completa todos los campos.'

        };

      }


      if (
        next.length <
        8
      ) {

        return {

          success: false,

          code:
            'PASSWORD_TOO_SHORT',

          message:
            'La nueva contraseña debe tener al menos 8 caracteres.'

        };

      }


      if (
        current ===
        next
      ) {

        return {

          success: false,

          code:
            'SAME_PASSWORD',

          message:
            'La nueva contraseña debe ser diferente a la actual.'

        };

      }


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

          success: false,

          code:
            'USER_NOT_FOUND',

          message:
            'No se encontró el usuario.'

        };

      }


      const user =
        users[
          userIndex
        ];


      const currentHash =
        await hashValue(
          current
        );


      if (
        currentHash !==
        user.passwordHash
      ) {

        return {

          success: false,

          code:
            'INVALID_CURRENT_PASSWORD',

          message:
            'La contraseña actual es incorrecta.'

        };

      }


      const newHash =
        await hashValue(
          next
        );


      const now =
        new Date()
          .toISOString();


      const updatedUser = {

        ...user,

        passwordHash:
          newHash,

        mustChangePassword:
          false,

        passwordUpdatedAt:
          now,

        updatedAt:
          now

      };


      const updatedUsers =
        users.map(
          (
            item,
            index
          ) =>
            index ===
            userIndex
              ? updatedUser
              : item
        );


      saveGymUsers(
        updatedUsers
      );


      refreshCurrentSession();


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

        success: true,

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

        success: false,

        code:
          'PASSWORD_UPDATE_ERROR',

        message:
          'No se pudo cambiar la contraseña.'

      };

    }

  };