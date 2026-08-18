// src/nexgym/services/nexgymSettingsService.js


// ======================================================
// STORAGE
// ======================================================

export const NEXGYM_SETTINGS_KEY =
  'nexgym_platform_settings';


// ======================================================
// DEFAULT
// ======================================================

export const DEFAULT_NEXGYM_SETTINGS = {

  platformName:
    'NEXGYM',

  companyName:
    'NEXGYM',

  supportEmail:
    '',

  supportPhone:
    '',

  whatsapp:
    '',

  defaultMonthlyPrice:
    799,

  currency:
    'MXN',

  graceDays:
    3,

  autoPastDue:
    true,

  autoSuspend:
    false,

  defaultTrialDays:
    0,

  paymentMethods: {

    cash:
      true,

    transfer:
      true,

    card:
      false

  },

  notifications: {

    paymentDue:
      true,

    trialEnding:
      true,

    newTicket:
      true,

    suspendedClient:
      true

  }

};


// ======================================================
// MERGE
// ======================================================

const mergeSettings = (
  stored = {}
) => {

  return {

    ...DEFAULT_NEXGYM_SETTINGS,

    ...stored,

    paymentMethods: {

      ...DEFAULT_NEXGYM_SETTINGS.paymentMethods,

      ...(stored.paymentMethods || {})

    },

    notifications: {

      ...DEFAULT_NEXGYM_SETTINGS.notifications,

      ...(stored.notifications || {})

    }

  };

};


// ======================================================
// OBTENER
// ======================================================

export const getNexgymSettings =
  () => {

    try {

      const raw =
        localStorage.getItem(
          NEXGYM_SETTINGS_KEY
        );


      if (!raw) {

        const initial =
          mergeSettings();


        localStorage.setItem(
          NEXGYM_SETTINGS_KEY,
          JSON.stringify(
            initial
          )
        );


        return initial;

      }


      return mergeSettings(
        JSON.parse(
          raw
        )
      );

    } catch (error) {

      console.error(
        'Error leyendo configuración NEXGYM:',
        error
      );


      return mergeSettings();

    }

  };


// ======================================================
// GUARDAR
// ======================================================

export const saveNexgymSettings =
  (
    settings
  ) => {

    const normalized =
      mergeSettings(
        settings
      );


    localStorage.setItem(
      NEXGYM_SETTINGS_KEY,
      JSON.stringify(
        normalized
      )
    );


    window.dispatchEvent(
      new Event(
        'nexgym-settings-update'
      )
    );


    return normalized;

  };


// ======================================================
// RESET
// ======================================================

export const resetNexgymSettings =
  () => {

    const settings =
      mergeSettings();


    localStorage.setItem(
      NEXGYM_SETTINGS_KEY,
      JSON.stringify(
        settings
      )
    );


    window.dispatchEvent(
      new Event(
        'nexgym-settings-update'
      )
    );


    return settings;

  };