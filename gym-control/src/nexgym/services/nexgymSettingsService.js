// src/nexgym/services/nexgymSettingsService.js

import {
  supabase
} from '../../lib/supabaseClient.js';


// ======================================================
// STORAGE CACHE
// ======================================================
//
// Seguimos conservando una copia local únicamente como
// cache y compatibilidad.
//
// Supabase será la fuente real de configuración.
//
// ======================================================

export const NEXGYM_SETTINGS_KEY =
  'nexgym_platform_settings';


// ======================================================
// ID GLOBAL
// ======================================================

const SETTINGS_ID =
  'global';


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

    ...(stored || {}),

    paymentMethods: {

      ...DEFAULT_NEXGYM_SETTINGS
        .paymentMethods,

      ...(stored?.paymentMethods || {})

    },

    notifications: {

      ...DEFAULT_NEXGYM_SETTINGS
        .notifications,

      ...(stored?.notifications || {})

    }

  };

};


// ======================================================
// NORMALIZAR NÚMEROS
// ======================================================

const normalizeNonNegativeNumber = (
  value,
  fallback = 0
) => {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return fallback;

  }


  return Math.max(
    0,
    number
  );

};


// ======================================================
// NORMALIZAR SETTINGS
// ======================================================

const normalizeSettings = (
  settings = {}
) => {

  const merged =
    mergeSettings(
      settings
    );


  return {

    ...merged,

    platformName:
      String(
        merged.platformName ||
        'NEXGYM'
      ).trim() ||
      'NEXGYM',

    companyName:
      String(
        merged.companyName ||
        'NEXGYM'
      ).trim() ||
      'NEXGYM',

    supportEmail:
      String(
        merged.supportEmail ||
        ''
      ).trim(),

    supportPhone:
      String(
        merged.supportPhone ||
        ''
      ).trim(),

    whatsapp:
      String(
        merged.whatsapp ||
        ''
      ).trim(),

    defaultMonthlyPrice:
      normalizeNonNegativeNumber(
        merged.defaultMonthlyPrice,
        799
      ),

    currency:
      String(
        merged.currency ||
        'MXN'
      )
        .trim()
        .toUpperCase() ||
      'MXN',

    graceDays:
      Math.floor(
        normalizeNonNegativeNumber(
          merged.graceDays,
          3
        )
      ),

    autoPastDue:
      Boolean(
        merged.autoPastDue
      ),

    autoSuspend:
      Boolean(
        merged.autoSuspend
      ),

    defaultTrialDays:
      Math.floor(
        normalizeNonNegativeNumber(
          merged.defaultTrialDays,
          0
        )
      ),

    paymentMethods: {

      cash:
        Boolean(
          merged.paymentMethods
            ?.cash
        ),

      transfer:
        Boolean(
          merged.paymentMethods
            ?.transfer
        ),

      card:
        Boolean(
          merged.paymentMethods
            ?.card
        )

    },

    notifications: {

      paymentDue:
        Boolean(
          merged.notifications
            ?.paymentDue
        ),

      trialEnding:
        Boolean(
          merged.notifications
            ?.trialEnding
        ),

      newTicket:
        Boolean(
          merged.notifications
            ?.newTicket
        ),

      suspendedClient:
        Boolean(
          merged.notifications
            ?.suspendedClient
        )

    }

  };

};


// ======================================================
// NORMALIZAR DESDE SUPABASE
// ======================================================

const normalizeRemoteSettings = (
  row
) => {

  if (
    !row
  ) {

    return normalizeSettings();

  }


  return normalizeSettings({

    platformName:
      row.platform_name,

    companyName:
      row.company_name,

    supportEmail:
      row.support_email,

    supportPhone:
      row.support_phone,

    whatsapp:
      row.whatsapp,

    defaultMonthlyPrice:
      row.default_monthly_price,

    currency:
      row.currency,

    graceDays:
      row.grace_days,

    autoPastDue:
      row.auto_past_due,

    autoSuspend:
      row.auto_suspend,

    defaultTrialDays:
      row.default_trial_days,

    paymentMethods:
      row.payment_methods,

    notifications:
      row.notifications

  });

};


// ======================================================
// CONVERTIR A SUPABASE
// ======================================================

const toRemotePayload = (
  settings,
  userId = null
) => {

  const normalized =
    normalizeSettings(
      settings
    );


  return {

    id:
      SETTINGS_ID,

    platform_name:
      normalized.platformName,

    company_name:
      normalized.companyName,

    support_email:
      normalized.supportEmail,

    support_phone:
      normalized.supportPhone,

    whatsapp:
      normalized.whatsapp,

    default_monthly_price:
      normalized.defaultMonthlyPrice,

    currency:
      normalized.currency,

    grace_days:
      normalized.graceDays,

    auto_past_due:
      normalized.autoPastDue,

    auto_suspend:
      normalized.autoSuspend,

    default_trial_days:
      normalized.defaultTrialDays,

    payment_methods:
      normalized.paymentMethods,

    notifications:
      normalized.notifications,

    updated_by:
      userId ||
      null

  };

};


// ======================================================
// GUARDAR CACHE
// ======================================================

const saveCache = (
  settings
) => {

  const normalized =
    normalizeSettings(
      settings
    );


  try {

    localStorage.setItem(
      NEXGYM_SETTINGS_KEY,
      JSON.stringify(
        normalized
      )
    );

  } catch (
    error
  ) {

    console.warn(
      '⚠️ No se pudo guardar cache de configuración:',
      error
    );

  }


  return normalized;

};


// ======================================================
// EVENTO
// ======================================================

const emitSettingsUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        'nexgym-settings-update'
      )
    );

  };


// ======================================================
// OBTENER CACHE SÍNCRONO
// ======================================================
//
// IMPORTANTE:
// Se conserva síncrono para no romper componentes
// existentes que todavía llaman:
//
// getNexgymSettings()
//
// ======================================================

export const getNexgymSettings =
  () => {

    try {

      const raw =
        localStorage.getItem(
          NEXGYM_SETTINGS_KEY
        );


      if (
        !raw
      ) {

        return saveCache(
          DEFAULT_NEXGYM_SETTINGS
        );

      }


      const parsed =
        JSON.parse(
          raw
        );


      return normalizeSettings(
        parsed
      );

    } catch (
      error
    ) {

      console.error(
        'Error leyendo cache NEXGYM:',
        error
      );


      return normalizeSettings();

    }

  };


// ======================================================
// CARGAR CONFIGURACIÓN DESDE SUPABASE
// ======================================================

export const loadNexgymSettings =
  async () => {

    try {

      const {
        data,
        error
      } =
        await supabase

          .from(
            'nexgym_platform_settings'
          )

          .select(
            `
              id,
              platform_name,
              company_name,
              support_email,
              support_phone,
              whatsapp,
              default_monthly_price,
              currency,
              grace_days,
              auto_past_due,
              auto_suspend,
              default_trial_days,
              payment_methods,
              notifications,
              updated_by,
              created_at,
              updated_at
            `
          )

          .eq(
            'id',
            SETTINGS_ID
          )

          .maybeSingle();


      if (
        error
      ) {

        console.error(
          '❌ Error cargando configuración NEXGYM:',
          error
        );


        return {

          success:
            false,

          settings:
            getNexgymSettings(),

          message:
            error.message ||
            'No se pudo cargar la configuración.'

        };

      }


      // ==================================================
      // SI NO EXISTE, CREAR DEFAULT
      // ==================================================

      if (
        !data
      ) {

        const result =
          await saveNexgymSettings(
            DEFAULT_NEXGYM_SETTINGS
          );


        return result;

      }


      const settings =
        normalizeRemoteSettings(
          data
        );


      saveCache(
        settings
      );


      console.log(
        '☁️ Configuración NEXGYM cargada desde Supabase:',
        settings
      );


      return {

        success:
          true,

        settings,

        row:
          data

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error inesperado cargando configuración:',
        error
      );


      return {

        success:
          false,

        settings:
          getNexgymSettings(),

        message:
          error?.message ||
          'No se pudo cargar la configuración.'

      };

    }

  };


// ======================================================
// GUARDAR CONFIGURACIÓN EN SUPABASE
// ======================================================

export const saveNexgymSettings =
  async (
    settings
  ) => {

    try {

      const normalized =
        normalizeSettings(
          settings
        );


      const {
        data:
          sessionData,
        error:
          sessionError
      } =
        await supabase.auth
          .getSession();


      if (
        sessionError
      ) {

        return {

          success:
            false,

          settings:
            normalized,

          message:
            'No se pudo comprobar la sesión administrativa.'

        };

      }


      const userId =
        sessionData
          ?.session
          ?.user
          ?.id ||
        null;


      if (
        !userId
      ) {

        return {

          success:
            false,

          settings:
            normalized,

          message:
            'La sesión del Super Administrador expiró.'

        };

      }


      const payload =
        toRemotePayload(
          normalized,
          userId
        );


      const {
        data,
        error
      } =
        await supabase

          .from(
            'nexgym_platform_settings'
          )

          .upsert(
            payload,
            {
              onConflict:
                'id'
            }
          )

          .select(
            `
              id,
              platform_name,
              company_name,
              support_email,
              support_phone,
              whatsapp,
              default_monthly_price,
              currency,
              grace_days,
              auto_past_due,
              auto_suspend,
              default_trial_days,
              payment_methods,
              notifications,
              updated_by,
              created_at,
              updated_at
            `
          )

          .single();


      if (
        error
      ) {

        console.error(
          '❌ Error guardando configuración:',
          error
        );


        return {

          success:
            false,

          settings:
            normalized,

          message:
            error.message ||
            'No se pudo guardar la configuración.'

        };

      }


      const savedSettings =
        normalizeRemoteSettings(
          data
        );


      saveCache(
        savedSettings
      );


      emitSettingsUpdate();


      console.log(
        '✅ Configuración NEXGYM guardada en Supabase:',
        savedSettings
      );


      return {

        success:
          true,

        settings:
          savedSettings,

        row:
          data,

        message:
          'Configuración guardada correctamente.'

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error inesperado guardando configuración:',
        error
      );


      return {

        success:
          false,

        settings:
          normalizeSettings(
            settings
          ),

        message:
          error?.message ||
          'No se pudo guardar la configuración.'

      };

    }

  };


// ======================================================
// RESTAURAR VALORES
// ======================================================

export const resetNexgymSettings =
  async () => {

    try {

      const defaults =
        normalizeSettings(
          DEFAULT_NEXGYM_SETTINGS
        );


      const result =
        await saveNexgymSettings(
          defaults
        );


      if (
        !result.success
      ) {

        return result;

      }


      return {

        ...result,

        message:
          'Configuración restaurada correctamente.'

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error restaurando configuración:',
        error
      );


      return {

        success:
          false,

        settings:
          getNexgymSettings(),

        message:
          error?.message ||
          'No se pudieron restaurar los valores.'

      };

    }

  };


// ======================================================
// EXPORT
// ======================================================

export default {

  NEXGYM_SETTINGS_KEY,

  DEFAULT_NEXGYM_SETTINGS,

  getNexgymSettings,

  loadNexgymSettings,

  saveNexgymSettings,

  resetNexgymSettings

};