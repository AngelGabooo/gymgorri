// src/utils/gymSettings.js

export const GYM_SETTINGS_KEY =
  'gym_control_settings';

export const GYM_USERS_KEY =
  'gym_control_users';


// ======================================================
// CONFIGURACIÓN PREDETERMINADA
// ======================================================

export const DEFAULT_GYM_SETTINGS = {

  // ====================================================
  // IDENTIDAD
  // ====================================================

  gymName: 'GYM CONTROL FITNESS',

  shortName: 'GYM CONTROL',

  phone: '',

  email: '',

  whatsapp: '',

  address: '',

  colony: '',

  city: '',

  state: '',

  postalCode: '',

  logo: null,


  // ====================================================
  // SUSCRIPCIONES DE LOS MIEMBROS DEL GIMNASIO
  // ====================================================

  subscriptionPlans: {

    sevenDays: {
      id: '7dias',
      label: '7 días',
      days: 7,
      price: 150
    },

    fifteenDays: {
      id: '15dias',
      label: '15 días',
      days: 15,
      price: 300
    },

    monthly: {
      id: 'mensual',
      label: 'Mensual',
      days: 30,
      price: 500
    },

    annual: {
      id: 'anual',
      label: 'Anual',
      days: 365,
      price: 5000
    }

  },

  warningDays: 5,

  renewalConserveDays: true,


  // ====================================================
  // PROMOCIONES Y DESCUENTOS
  // ====================================================

  promotions: {

    student: {

      id: 'student',

      label: 'Estudiante',

      enabled: true,

      referenceRequired: false,

      plans: {

        '7dias': {
          enabled: true,
          type: 'percentage',
          value: 10
        },

        '15dias': {
          enabled: true,
          type: 'percentage',
          value: 10
        },

        mensual: {
          enabled: true,
          type: 'percentage',
          value: 15
        },

        anual: {
          enabled: true,
          type: 'percentage',
          value: 10
        }

      }

    },


    couple: {

      id: 'couple',

      label: 'Pareja',

      pricingScope: 'pair_total',

      enabled: true,

      referenceRequired: false,

      plans: {

        '7dias': {
          enabled: true,
          type: 'fixed_price',
          value: 130
        },

        '15dias': {
          enabled: true,
          type: 'fixed_price',
          value: 270
        },

        mensual: {
          enabled: true,
          type: 'fixed_price',
          value: 450
        },

        anual: {
          enabled: true,
          type: 'fixed_price',
          value: 4500
        }

      }

    },


    agreement: {

      id: 'agreement',

      label: 'Convenio',

      enabled: true,

      referenceRequired: true,

      plans: {

        '7dias': {
          enabled: true,
          type: 'percentage',
          value: 10
        },

        '15dias': {
          enabled: true,
          type: 'percentage',
          value: 10
        },

        mensual: {
          enabled: true,
          type: 'percentage',
          value: 15
        },

        anual: {
          enabled: true,
          type: 'percentage',
          value: 15
        }

      }

    },


    courtesy: {

      id: 'courtesy',

      label: 'Cortesía',

      enabled: true,

      referenceRequired: true,

      plans: {

        '7dias': {
          enabled: true,
          type: 'fixed_price',
          value: 0
        },

        '15dias': {
          enabled: true,
          type: 'fixed_price',
          value: 0
        },

        mensual: {
          enabled: true,
          type: 'fixed_price',
          value: 0
        },

        anual: {
          enabled: true,
          type: 'fixed_price',
          value: 0
        }

      }

    }

  },


  // ====================================================
  // RETENCIÓN
  // ====================================================

  retention: {

    enabled: true,

    followUpDays: 7,

    riskDays: 15,

    inactiveDays: 30,

    includeNeverAttended: true

  },


  // ====================================================
  // WHATSAPP
  // ====================================================

  whatsappSettings: {

    enabled: true,

    defaultCountryCode: '52',

    templates: {

      renewal: {
        enabled: true,
        message:
          'Hola {nombre} 👋\n\nTe saludamos de {gimnasio}. Si deseas renovar tu membresía {plan}, podemos ayudarte por este medio.\n\n¡Te esperamos para seguir entrenando! 💪'
      },

      expiring: {
        enabled: true,
        message:
          'Hola {nombre} 👋\n\nTe recordamos que tu membresía {plan} en {gimnasio} vence el {fechaVencimiento} ({diasRestantes} días restantes).\n\nSi deseas renovarla, podemos ayudarte por este medio. 💪'
      },

      expired: {
        enabled: true,
        message:
          'Hola {nombre} 👋\n\nTu membresía en {gimnasio} ha finalizado. Nos dará mucho gusto tenerte nuevamente entrenando con nosotros.\n\nEscríbenos para realizar tu renovación. 💪'
      },

      inactive: {
        enabled: true,
        message:
          'Hola {nombre} 👋\n\nHemos notado que llevas {diasInactivo} días sin asistir a {gimnasio}. Tu membresía continúa activa y esperamos verte pronto nuevamente. 💪'
      },

      birthday: {
        enabled: true,
        message:
          '🎉 ¡Feliz cumpleaños, {nombre}! Todo el equipo de {gimnasio} te desea un excelente día. 🎂💪'
      },

      pendingPayment: {
        enabled: true,
        message:
          'Hola {nombre} 👋\n\nTe recordamos que tienes un saldo pendiente de {saldoPendiente} en {gimnasio}. Si ya realizaste el pago, puedes ignorar este mensaje.'
      },

      promotion: {
        enabled: true,
        message:
          'Hola {nombre} 👋\n\nTenemos una promoción disponible en {gimnasio}: {promocion}.\n\nEscríbenos para conocer los detalles y aprovecharla. 💪'
      },

      couple: {
        enabled: true,
        message:
          'Hola {nombre} 👋\n\nTu registro pertenece a la promoción de pareja de {gimnasio}. Pareja vinculada: {pareja}.\n\nSi necesitan renovar o consultar su promoción, podemos ayudarles por este medio.'
      }

    }

  },


  // ====================================================
  // CAPACIDAD
  // ====================================================

  capacity: 80,

  capacityWarning: 80,

  capacityCritical: 95,


  // ====================================================
  // PAGOS
  // ====================================================

  currency: 'MXN',

  paymentMethods: {

    efectivo: true,

    transferencia: true,

    tarjeta: true,

    otro: true

  },


  // ====================================================
  // RECIBOS
  // ====================================================

  receiptPrefix: 'PAY',

  memberPrefix: 'GYM',

  receiptMessage:
    'Gracias por entrenar con nosotros.',


  // ====================================================
  // CONTROL DE ACCESO
  // ====================================================

  qrPermanent: true,

  autoEntryExit: true,

  doubleScanProtection: true,

  scanInterval: 30,

  resultDisplayTime: 5,

  showPhotoAfterScan: true,


  // ====================================================
  // INFORMACIÓN PÚBLICA
  // ====================================================

  publicInfo: {

    name: true,

    photo: true,

    accessStatus: true,

    entryTime: true,

    expiryWarning: true

  },


  // ====================================================
  // SONIDOS
  // ====================================================

  sounds: {

    allowed: true,

    denied: true,

    volume: 70

  },


  // ====================================================
  // CÁMARA
  // ====================================================

  cameraDevice: 'default',


  // ====================================================
  // HORARIOS
  // ====================================================

  hours: {

    monday: {
      open: true,
      start: '05:00',
      end: '22:00'
    },

    tuesday: {
      open: true,
      start: '05:00',
      end: '22:00'
    },

    wednesday: {
      open: true,
      start: '05:00',
      end: '22:00'
    },

    thursday: {
      open: true,
      start: '05:00',
      end: '22:00'
    },

    friday: {
      open: true,
      start: '05:00',
      end: '22:00'
    },

    saturday: {
      open: true,
      start: '06:00',
      end: '20:00'
    },

    sunday: {
      open: true,
      start: '08:00',
      end: '14:00'
    }

  }

};


// ======================================================
// MERGE DE PLANES DE PROMOCIÓN
// ======================================================

const mergePromotionPlans = (
  defaultPromotion,
  storedPromotion = {}
) => {

  const result = {};


  Object.entries(
    defaultPromotion.plans || {}
  ).forEach(
    ([
      planId,
      defaultPlan
    ]) => {

      result[planId] = {

        ...defaultPlan,

        ...(
          storedPromotion
            ?.plans
            ?.[planId] ||
          {}
        )

      };

    }
  );


  return result;

};


// ======================================================
// MERGE DE PROMOCIONES
// ======================================================

const mergePromotions = (
  storedPromotions = {}
) => {

  const result = {};


  Object.entries(
    DEFAULT_GYM_SETTINGS.promotions
  ).forEach(
    ([
      key,
      defaultPromotion
    ]) => {

      const storedPromotion =
        storedPromotions?.[key] ||
        {};


      result[key] = {

        ...defaultPromotion,

        ...storedPromotion,

        plans:
          mergePromotionPlans(
            defaultPromotion,
            storedPromotion
          )

      };

    }
  );


  return result;

};


// ======================================================
// MERGE PROFUNDO
// ======================================================

const mergeSettings = (
  stored = {}
) => {

  return {

    ...DEFAULT_GYM_SETTINGS,

    ...stored,


    subscriptionPlans: {

      sevenDays: {
        ...DEFAULT_GYM_SETTINGS.subscriptionPlans.sevenDays,
        ...(stored.subscriptionPlans?.sevenDays || {})
      },

      fifteenDays: {
        ...DEFAULT_GYM_SETTINGS.subscriptionPlans.fifteenDays,
        ...(stored.subscriptionPlans?.fifteenDays || {})
      },

      monthly: {
        ...DEFAULT_GYM_SETTINGS.subscriptionPlans.monthly,
        ...(stored.subscriptionPlans?.monthly || {})
      },

      annual: {
        ...DEFAULT_GYM_SETTINGS.subscriptionPlans.annual,
        ...(stored.subscriptionPlans?.annual || {})
      }

    },


    promotions:
      mergePromotions(
        stored.promotions || {}
      ),


    retention: {

      ...DEFAULT_GYM_SETTINGS.retention,

      ...(stored.retention || {})

    },


    whatsappSettings: {

      ...DEFAULT_GYM_SETTINGS.whatsappSettings,

      ...(stored.whatsappSettings || {}),

      templates: {

        ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates,

        ...(stored.whatsappSettings?.templates || {}),

        renewal: {
          ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates.renewal,
          ...(stored.whatsappSettings?.templates?.renewal || {})
        },

        expiring: {
          ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates.expiring,
          ...(stored.whatsappSettings?.templates?.expiring || {})
        },

        expired: {
          ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates.expired,
          ...(stored.whatsappSettings?.templates?.expired || {})
        },

        inactive: {
          ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates.inactive,
          ...(stored.whatsappSettings?.templates?.inactive || {})
        },

        birthday: {
          ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates.birthday,
          ...(stored.whatsappSettings?.templates?.birthday || {})
        },

        pendingPayment: {
          ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates.pendingPayment,
          ...(stored.whatsappSettings?.templates?.pendingPayment || {})
        },

        promotion: {
          ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates.promotion,
          ...(stored.whatsappSettings?.templates?.promotion || {})
        },

        couple: {
          ...DEFAULT_GYM_SETTINGS.whatsappSettings.templates.couple,
          ...(stored.whatsappSettings?.templates?.couple || {})
        }

      }

    },


    paymentMethods: {

      ...DEFAULT_GYM_SETTINGS.paymentMethods,

      ...(stored.paymentMethods || {})

    },


    publicInfo: {

      ...DEFAULT_GYM_SETTINGS.publicInfo,

      ...(stored.publicInfo || {})

    },


    sounds: {

      ...DEFAULT_GYM_SETTINGS.sounds,

      ...(stored.sounds || {})

    },


    hours: {

      ...DEFAULT_GYM_SETTINGS.hours,

      ...(stored.hours || {})

    }

  };

};


// ======================================================
// OBTENER CONFIGURACIÓN
// ======================================================

export const getGymSettings =
  () => {

    try {

      const raw =
        localStorage.getItem(
          GYM_SETTINGS_KEY
        );


      if (!raw) {

        const initial =
          mergeSettings({});


        localStorage.setItem(
          GYM_SETTINGS_KEY,
          JSON.stringify(
            initial
          )
        );


        return initial;

      }


      const parsed =
        JSON.parse(
          raw
        );


      return mergeSettings(
        parsed
      );

    } catch (error) {

      console.error(
        'Error leyendo configuración:',
        error
      );


      return mergeSettings({});

    }

  };


// ======================================================
// GUARDAR CONFIGURACIÓN
// ======================================================

export const saveGymSettings = (
  settings
) => {

  const normalized =
    mergeSettings(
      settings
    );


  localStorage.setItem(
    GYM_SETTINGS_KEY,
    JSON.stringify(
      normalized
    )
  );


  window.dispatchEvent(
    new CustomEvent(
      'gym-settings-update',
      {
        detail:
          normalized
      }
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );


  return normalized;

};


// ======================================================
// RESTAURAR CONFIGURACIÓN
// ======================================================

export const resetGymSettings =
  () => {

    const restored =
      mergeSettings({});


    localStorage.setItem(
      GYM_SETTINGS_KEY,
      JSON.stringify(
        restored
      )
    );


    window.dispatchEvent(
      new CustomEvent(
        'gym-settings-update',
        {
          detail:
            restored
        }
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    return restored;

  };


// ======================================================
// OBTENER TODOS LOS USUARIOS
// ======================================================
//
// IMPORTANTE:
// Esta función sigue regresando TODOS los usuarios porque
// authService necesita buscar el correo globalmente.
//
// Para Settings usaremos getGymUsersByGymId().
//
// ======================================================

export const getGymUsers =
  () => {

    try {

      const raw =
        localStorage.getItem(
          GYM_USERS_KEY
        );


      if (!raw) {

        return [];

      }


      const parsed =
        JSON.parse(
          raw
        );


      return Array.isArray(
        parsed
      )
        ? parsed
        : [];

    } catch (error) {

      console.error(
        'Error leyendo usuarios:',
        error
      );


      return [];

    }

  };


// ======================================================
// GUARDAR TODOS LOS USUARIOS
// ======================================================

export const saveGymUsers = (
  users
) => {

  const safeUsers =
    Array.isArray(
      users
    )
      ? users
      : [];


  localStorage.setItem(
    GYM_USERS_KEY,
    JSON.stringify(
      safeUsers
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );


  return safeUsers;

};


// ======================================================
// OBTENER USUARIOS DE UN GIMNASIO
// ======================================================

export const getGymUsersByGymId = (
  gymId
) => {

  const users =
    getGymUsers();


  // ====================================================
  // COMPATIBILIDAD CON SISTEMA ANTERIOR
  // ====================================================

  if (!gymId) {

    return users;

  }


  return users.filter(
    user =>
      user.gymId ===
      gymId
  );

};


// ======================================================
// GUARDAR ÚNICAMENTE USUARIOS DE UN GIMNASIO
// ======================================================
//
// Esto evita que Power Gym pueda borrar o modificar
// accidentalmente usuarios de Titan Gym.
//
// ======================================================

export const saveGymUsersForGym = (
  gymId,
  gymUsers
) => {

  const safeUsers =
    Array.isArray(
      gymUsers
    )
      ? gymUsers
      : [];


  // ====================================================
  // COMPATIBILIDAD LEGACY
  // ====================================================

  if (!gymId) {

    return saveGymUsers(
      safeUsers
    );

  }


  const allUsers =
    getGymUsers();


  // Usuarios pertenecientes a otros gimnasios.
  const otherGymUsers =
    allUsers.filter(
      user =>
        user.gymId !==
        gymId
    );


  // Nos aseguramos de que todos los usuarios guardados
  // desde este gimnasio tengan el gymId correcto.
  const normalizedGymUsers =
    safeUsers.map(
      user => ({

        ...user,

        gymId

      })
    );


  return saveGymUsers([
    ...otherGymUsers,
    ...normalizedGymUsers
  ]);

};


// ======================================================
// COMPROBAR SI UN CORREO YA EXISTE
// ======================================================
//
// El correo es ÚNICO a nivel global.
// No permitimos:
//
// Power Gym -> empleado@gmail.com
// Titan Gym -> empleado@gmail.com
//
// porque el login utiliza el correo para identificar
// una única cuenta.
//
// ======================================================

export const isGymUserEmailTaken = (
  email,
  excludeUserId = null
) => {

  const normalizedEmail =
    String(
      email || ''
    )
      .trim()
      .toLowerCase();


  if (!normalizedEmail) {

    return false;

  }


  return getGymUsers().some(
    user =>
      user.id !==
        excludeUserId &&
      String(
        user.email || ''
      )
        .trim()
        .toLowerCase() ===
      normalizedEmail
  );

};


// ======================================================
// CREAR ID USUARIO
// ======================================================

export const createGymUserId =
  () => {

    if (
      window.crypto?.randomUUID
    ) {

      return `USR-${window.crypto.randomUUID()}`;

    }


    return (
      `USR-${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(
          2,
          8
        )
    );

  };