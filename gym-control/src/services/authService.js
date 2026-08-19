// src/services/authService.js

import {
  getGymUsers,
  saveGymUsers,
  createGymUserId
} from '../utils/gymSettings';

import {
  hashValue
} from '../utils/memberId';

import {
  supabase
} from '../lib/supabaseClient.js';


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
// NORMALIZAR ROL DE SUPABASE
// ======================================================


// ======================================================
// AVISO DE RENOVACIÓN
// ======================================================
//
// No requiere columnas nuevas en Supabase.
// Se activa cuando:
//
// 1. La suscripción está marcada como "past_due".
// 2. Faltan 7 días o menos para next_payment_date.
// 3. La fecha de pago ya venció.
//
// ======================================================

const buildRenewalNotice = (
  subscription,
  gym
) => {

  const nextPaymentDate =
    subscription?.next_payment_date ||
    gym?.subscription_next_payment_date ||
    null;


  const subscriptionStatus =
    subscription?.status ||
    gym?.subscription_status ||
    'active';


  if (
    !nextPaymentDate
  ) {

    return null;

  }


  const paymentDate =
    String(
      nextPaymentDate
    ).length === 10
      ? new Date(
          `${nextPaymentDate}T12:00:00`
        )
      : new Date(
          nextPaymentDate
        );


  if (
    Number.isNaN(
      paymentDate.getTime()
    )
  ) {

    return null;

  }


  const today =
    new Date();


  const todayAtNoon =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0,
      0
    );


  const paymentAtNoon =
    new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      paymentDate.getDate(),
      12,
      0,
      0,
      0
    );


  const millisecondsPerDay =
    1000 *
    60 *
    60 *
    24;


  const daysRemaining =
    Math.ceil(
      (
        paymentAtNoon.getTime() -
        todayAtNoon.getTime()
      ) /
      millisecondsPerDay
    );


  const manuallyMarked =
    subscriptionStatus ===
    'past_due';


  const shouldNotify =
    manuallyMarked ||
    daysRemaining <=
      7;


  if (
    !shouldNotify
  ) {

    return null;

  }


  let title =
    'Tu suscripción necesita renovación';


  let message =
    `Tu próximo pago está programado para el ${nextPaymentDate}.`;


  let severity =
    'warning';


  if (
    daysRemaining <
    0
  ) {

    const overdueDays =
      Math.abs(
        daysRemaining
      );


    title =
      'Tu suscripción está pendiente de renovación';


    message =
      overdueDays ===
      1
        ? `Tu fecha de renovación venció ayer (${nextPaymentDate}). Contacta a soporte para regularizar el servicio.`
        : `Tu fecha de renovación venció hace ${overdueDays} días (${nextPaymentDate}). Contacta a soporte para regularizar el servicio.`;


    severity =
      'danger';

  } else if (
    daysRemaining ===
    0
  ) {

    title =
      'Tu suscripción vence hoy';


    message =
      `Tu renovación está programada para hoy (${nextPaymentDate}). Contacta a soporte para renovar el servicio.`;


    severity =
      'danger';

  } else if (
    daysRemaining ===
    1
  ) {

    title =
      'Tu suscripción vence mañana';


    message =
      `Tu renovación está programada para mañana (${nextPaymentDate}). Te recomendamos contactar a soporte.`;

  } else {

    title =
      'Tu suscripción está próxima a renovarse';


    message =
      `Faltan ${daysRemaining} días para tu próxima renovación (${nextPaymentDate}). Te recomendamos contactar a soporte con anticipación.`;

  }


  if (
    manuallyMarked &&
    daysRemaining >
      7
  ) {

    title =
      'Renovación próxima';


    message =
      `El administrador marcó tu cuenta para renovación. Tu próximo pago está programado para el ${nextPaymentDate}. Contacta a soporte para más información.`;

  }


  return {

    active:
      true,

    title,

    message,

    severity,

    nextPaymentDate,

    daysRemaining,

    manuallyMarked

  };

};


const normalizeCloudRole = (
  role
) => {

  if (
    role === 'employee'
  ) {

    return 'reception';

  }


  if (
    role === 'owner' ||
    role === 'admin' ||
    role === 'reception'
  ) {

    return role;

  }


  return 'reception';

};


// ======================================================
// GUARDAR / ACTUALIZAR USUARIO CLOUD EN CACHE LOCAL
// ======================================================
//
// El resto de GYM CONTROL todavía utiliza getGymUsers()
// de manera síncrona.
//
// Por eso conservamos una copia local del usuario de
// Supabase. Supabase sigue siendo la fuente de verdad
// para autenticación y vínculo con el gimnasio.
//
// ======================================================

const cacheCloudGymUser = (
  cloudUser
) => {

  const users =
    getGymUsers();


  const list =
    Array.isArray(
      users
    )
      ? users
      : [];


  const index =
    list.findIndex(
      user =>
        user.id === cloudUser.id ||
        (
          cloudUser.authUserId &&
          user.authUserId ===
            cloudUser.authUserId
        ) ||
        String(
          user.email ||
          ''
        )
          .trim()
          .toLowerCase() ===
        String(
          cloudUser.email ||
          ''
        )
          .trim()
          .toLowerCase()
    );


  let nextUsers;


  if (
    index ===
    -1
  ) {

    nextUsers = [
      ...list,
      cloudUser
    ];

  } else {

    nextUsers =
      list.map(
        (
          user,
          userIndex
        ) =>
          userIndex ===
          index
            ? {
                ...user,
                ...cloudUser
              }
            : user
      );

  }


  saveGymUsers(
    nextUsers
  );


  return cloudUser;

};


// ======================================================
// AUTENTICAR USUARIO CLOUD DE GIMNASIO
// ======================================================

const authenticateCloudGymUser =
  async (
    normalizedEmail,
    normalizedPassword
  ) => {

    // ==================================================
    // 1. SUPABASE AUTH
    // ==================================================

    const {
      data:
        authData,

      error:
        authError
    } =
      await supabase.auth
        .signInWithPassword({

          email:
            normalizedEmail,

          password:
            normalizedPassword

        });


    if (
      authError
    ) {

      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          authError.status === 400
            ? 'INVALID_CREDENTIALS'
            : 'SUPABASE_AUTH_ERROR',

        message:
          authError.status === 400
            ? 'La cuenta no está registrada o las credenciales son incorrectas. Verifica tus datos o contacta a soporte.'
            : (
                authError.message ||
                'No se pudo iniciar sesión. Intenta nuevamente o contacta a soporte.'
              ),

        authError

      };

    }


    const authUser =
      authData?.user ||
      null;


    if (
      !authUser?.id
    ) {

      await supabase.auth
        .signOut();

      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          'AUTH_USER_NOT_FOUND',

        message:
          'Supabase no devolvió el usuario autenticado.'

      };

    }


    // ==================================================
    // 2. VÍNCULO GYM_USERS
    // ==================================================

    const {
      data:
        gymUser,

      error:
        gymUserError
    } =
      await supabase

        .from(
          'gym_users'
        )

        .select(
          `
            id,
            user_id,
            gym_id,
            name,
            email,
            role,
            status,
            permissions,
            must_change_password,
            last_access_at,
            created_at,
            updated_at
          `
        )

        .eq(
          'user_id',
          authUser.id
        )

        .maybeSingle();


    if (
      gymUserError
    ) {

      console.error(
        '❌ Error consultando gym_users:',
        gymUserError
      );


      await supabase.auth
        .signOut();


      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          'GYM_USER_QUERY_ERROR',

        message:
          'No se pudo comprobar la autorización de esta cuenta.'

      };

    }


    if (
      !gymUser?.id ||
      !gymUser?.gym_id
    ) {

      await supabase.auth
        .signOut();


      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          'GYM_USER_NOT_LINKED',

        message:
          'Este correo no está vinculado a ningún gimnasio.'

      };

    }


    // ==================================================
    // 3. ESTADO DEL USUARIO
    // ==================================================

    if (
      gymUser.status !==
      'active'
    ) {

      await supabase.auth
        .signOut();


      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          gymUser.status ===
          'suspended'
            ? 'USER_SUSPENDED'
            : 'USER_INACTIVE',

        message:
          gymUser.status ===
          'suspended'
            ? 'Esta cuenta está suspendida. Contacta al administrador o a soporte para recuperar el acceso.'
            : 'Esta cuenta está desactivada. Contacta al administrador o a soporte si necesitas recuperar el acceso.'

      };

    }


    // ==================================================
    // 4. GIMNASIO
    // ==================================================

    const {
      data:
        gym,

      error:
        gymError
    } =
      await supabase

        .from(
          'gyms'
        )

        .select(
          `
            id,
            gym_code,
            name,
            status,
            subscription_status,
            subscription_next_payment_date,
            trial_active,
            trial_start_date,
            trial_end_date,
            created_at,
            updated_at
          `
        )

        .eq(
          'id',
          gymUser.gym_id
        )

        .maybeSingle();


    if (
      gymError
    ) {

      console.error(
        '❌ Error consultando gimnasio:',
        gymError
      );


      await supabase.auth
        .signOut();


      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          'GYM_QUERY_ERROR',

        message:
          'No se pudo comprobar el estado del gimnasio.'

      };

    }


    if (
      !gym?.id
    ) {

      await supabase.auth
        .signOut();


      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          'GYM_NOT_FOUND',

        message:
          'El gimnasio asociado a esta cuenta no existe.'

      };

    }


    // ==================================================
    // 5. SUSCRIPCIÓN
    // ==================================================

    const {
      data:
        subscription,

      error:
        subscriptionError
    } =
      await supabase

        .from(
          'gym_subscriptions'
        )

        .select(
          `
            id,
            gym_id,
            status,
            billing_cycle,
            regular_price,
            discount,
            final_price,
            start_date,
            next_payment_date,
            trial_start_date,
            trial_end_date,
            created_at,
            updated_at
          `
        )

        .eq(
          'gym_id',
          gym.id
        )

        .order(
          'created_at',
          {
            ascending:
              false
          }
        )

        .limit(
          1
        )

        .maybeSingle();


    if (
      subscriptionError
    ) {

      console.warn(
        '⚠️ No se pudo consultar gym_subscriptions:',
        subscriptionError
      );

    }


    const gymStatus =
      subscription?.status ||
      gym.subscription_status ||
      gym.status ||
      'active';


    // ==================================================
    // 6. BLOQUEOS
    // ==================================================

    if (
      gym.status ===
        'inactive'
    ) {

      await supabase.auth
        .signOut();


      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          'GYM_INACTIVE',

        message:
          'La cuenta de este gimnasio está desactivada. Contacta a soporte para revisar el estado del servicio.'

      };

    }


    if (
      gym.status ===
        'suspended' ||
      gymStatus ===
        'suspended'
    ) {

      await supabase.auth
        .signOut();


      return {

        success:
          false,

        cloudAttempted:
          true,

        code:
          'GYM_SUSPENDED',

        message:
          'La cuenta de este gimnasio está suspendida temporalmente. Contacta a soporte para conocer el motivo y recuperar el acceso.'

      };

    }


    // ==================================================
    // 7. ROL Y PERMISOS
    // ==================================================

    const role =
      normalizeCloudRole(
        gymUser.role
      );


    const permissions =
      normalizePermissions(
        role,
        gymUser.permissions
      );


    const now =
      new Date()
        .toISOString();


    const renewalNotice =
      buildRenewalNotice(
        subscription,
        gym
      );


    // ==================================================
    // 8. USUARIO COMPATIBLE CON GYM CONTROL
    // ==================================================

    const cachedUser = {

      id:
        gymUser.id,

      authUserId:
        authUser.id,

      source:
        'supabase',

      isCloudUser:
        true,

      gymId:
        gym.id,

      gymCode:
        gym.gym_code ||
        null,

      gymName:
        gym.name ||
        null,

      gymStatus,

      renewalNotice,

      subscriptionNextPaymentDate:
        subscription?.next_payment_date ||
        gym.subscription_next_payment_date ||
        null,

      name:
        gymUser.name ||
        authUser.user_metadata
          ?.name ||
        normalizedEmail,

      email:
        gymUser.email ||
        authUser.email ||
        normalizedEmail,

      passwordHash:
        null,

      role,

      permissions,

      status:
        gymUser.status,

      mustChangePassword:
        Boolean(
          gymUser.must_change_password
        ),

      createdAt:
        gymUser.created_at ||
        now,

      updatedAt:
        now,

      lastAccessAt:
        now,

      passwordUpdatedAt:
        null

    };


    cacheCloudGymUser(
      cachedUser
    );


    // ==================================================
    // 9. SESIÓN LOCAL DE LA APP
    // ==================================================

    const session = {

      id:
        cachedUser.id,

      authUserId:
        authUser.id,

      source:
        'supabase',

      isCloudUser:
        true,

      gymId:
        cachedUser.gymId,

      gymCode:
        cachedUser.gymCode,

      gymName:
        cachedUser.gymName,

      name:
        cachedUser.name,

      email:
        cachedUser.email,

      role,

      permissions,

      gymStatus,

      renewalNotice,

      subscriptionNextPaymentDate:
        cachedUser.subscriptionNextPaymentDate,

      mustChangePassword:
        cachedUser.mustChangePassword,

      loginAt:
        now

    };


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
    // 10. LAST ACCESS EN SUPABASE
    // ==================================================

    const {
      error:
        lastAccessError
    } =
      await supabase

        .from(
          'gym_users'
        )

        .update({

          last_access_at:
            now

        })

        .eq(
          'id',
          gymUser.id
        );


    if (
      lastAccessError
    ) {

      console.warn(
        '⚠️ No se pudo actualizar last_access_at:',
        lastAccessError
      );

    }


    // Cache local anterior.
    updateNexgymLastConnection(
      gym.id,
      now
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


    console.log(
      '✅ Usuario de gimnasio autenticado con Supabase:',
      {
        userId:
          authUser.id,

        gymUserId:
          gymUser.id,

        gymId:
          gym.id,

        gymCode:
          gym.gym_code,

        role
      }
    );


    return {

      success:
        true,

      cloudAttempted:
        true,

      user:
        cachedUser,

      session,

      renewalNotice

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


      // ==================================================
      // 1. INTENTAR SUPABASE PRIMERO
      // ==================================================
      //
      // Las cuentas creadas desde NEXGYM viven en:
      //
      // auth.users
      // gym_users
      //
      // Por eso Supabase debe ser la primera fuente.
      //
      // ==================================================

      const cloudResult =
        await authenticateCloudGymUser(
          normalizedEmail,
          normalizedPassword
        );


      if (
        cloudResult.success
      ) {

        return cloudResult;

      }


      // ==================================================
      // 2. COMPATIBILIDAD LEGACY
      // ==================================================
      //
      // Solo intentamos el sistema local si realmente
      // existe ese correo en getGymUsers().
      //
      // Esto conserva instalaciones anteriores sin impedir
      // el acceso a las cuentas nuevas de Supabase.
      //
      // ==================================================

      const users =
        getGymUsers();


      const userIndex =
        users.findIndex(
          item =>
            String(
              item.email ||
              ''
            )
              .trim()
              .toLowerCase() ===
            normalizedEmail &&
            !item.isCloudUser &&
            item.source !==
              'supabase'
        );


      if (
        userIndex ===
        -1
      ) {

        return {

          success:
            false,

          code:
            cloudResult.code ||
            'USER_NOT_FOUND',

          message:
            cloudResult.message ||
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
      // USUARIO LOCAL DESACTIVADO
      // ==================================================

      if (
        user.status !==
        'active'
      ) {

        return {

          success:
            false,

          code:
            user.status ===
            'suspended'
              ? 'USER_SUSPENDED'
              : 'USER_INACTIVE',

          message:
            user.status ===
            'suspended'
              ? 'Esta cuenta está suspendida. Contacta al administrador o a soporte para recuperar el acceso.'
              : 'Esta cuenta está desactivada. Contacta al administrador o a soporte si necesitas recuperar el acceso.'

        };

      }


      // ==================================================
      // ESTADO DEL SERVICIO LOCAL
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

          success:
            false,

          code:
            'GYM_SUSPENDED',

          message:
            'La cuenta de este gimnasio está suspendida temporalmente. Contacta a soporte para conocer el motivo y recuperar el acceso.'

        };

      }


      // ==================================================
      // PASSWORD LOCAL LEGACY
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

        source:
          'local',

        isCloudUser:
          false,

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

        success:
          true,

        user:
          updatedUser,

        session

      };

    } catch (
      error
    ) {

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
          error?.message ||
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


    // Cerrar también la sesión Supabase si existe.
    //
    // No hacemos await porque esta función se utiliza
    // síncronamente en varias partes de la aplicación.

    supabase.auth
      .signOut()
      .catch(
        error => {

          console.warn(
            '⚠️ No se pudo cerrar sesión Supabase:',
            error
          );

        }
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

          success:
            false,

          code:
            'NO_SESSION',

          message:
            'No existe una sesión activa.'

        };

      }


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
            'No se encontró el usuario.'

        };

      }


      const user =
        users[
          userIndex
        ];


      // ==================================================
      // USUARIO CLOUD
      // ==================================================

      if (
        user.isCloudUser ||
        user.source ===
          'supabase' ||
        session.isCloudUser ||
        session.source ===
          'supabase'
      ) {

        // Primero validamos la contraseña actual.
        const {
          error:
            signInError
        } =
          await supabase.auth
            .signInWithPassword({

              email:
                session.email,

              password:
                current

            });


        if (
          signInError
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


        const {
          error:
            updatePasswordError
        } =
          await supabase.auth
            .updateUser({

              password:
                next

            });


        if (
          updatePasswordError
        ) {

          console.error(
            '❌ Error actualizando contraseña Supabase:',
            updatePasswordError
          );


          return {

            success:
              false,

            code:
              'SUPABASE_PASSWORD_UPDATE_ERROR',

            message:
              updatePasswordError.message ||
              'No se pudo cambiar la contraseña.'

          };

        }


        const now =
          new Date()
            .toISOString();


        const updatedUser = {

          ...user,

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


        const {
          error:
            gymUserUpdateError
        } =
          await supabase

            .from(
              'gym_users'
            )

            .update({

              must_change_password:
                false,

              updated_at:
                now

            })

            .eq(
              'id',
              user.id
            );


        if (
          gymUserUpdateError
        ) {

          console.warn(
            '⚠️ Contraseña cambiada, pero no se pudo actualizar must_change_password:',
            gymUserUpdateError
          );

        }


        const updatedSession = {

          ...session,

          mustChangePassword:
            false

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

      }


      // ==================================================
      // USUARIO LOCAL LEGACY
      // ==================================================

      const currentHash =
        await hashValue(
          current
        );


      if (
        currentHash !==
        user.passwordHash
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

        success:
          true,

        code:
          'PASSWORD_UPDATED',

        message:
          'Contraseña actualizada correctamente.'

      };

    } catch (
      error
    ) {

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
          error?.message ||
          'No se pudo cambiar la contraseña.'

      };

    }

  };