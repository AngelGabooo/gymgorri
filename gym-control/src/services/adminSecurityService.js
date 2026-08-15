// src/services/adminSecurityService.js

const SECURITY_KEY =
  'gym_control_admin_security';

const AUDIT_KEY =
  'gym_control_admin_security_audit';

const DEFAULT_PROTECTIONS = {
  member_deactivate: true,
  blacklist_clear: true,
  blacklist_reactivate: true,
  regenerate_qr: true,
  regenerate_pin: true,
  payment_delete: true
};

const PBKDF2_ITERATIONS =
  120000;


// ======================================================
// HELPERS
// ======================================================

const toBase64 = (
  bytes
) => {

  let binary =
    '';

  bytes.forEach(
    byte => {
      binary +=
        String.fromCharCode(
          byte
        );
    }
  );

  return btoa(
    binary
  );

};


const fromBase64 = (
  value
) => {

  const binary =
    atob(
      value
    );

  return Uint8Array.from(
    binary,
    char =>
      char.charCodeAt(
        0
      )
  );

};


const createId =
  prefix => {

    if (
      window.crypto?.randomUUID
    ) {

      return `${prefix}-${window.crypto.randomUUID()}`;

    }

    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

  };


const normalizeActor = (
  actor
) => {

  if (!actor) {
    return null;
  }

  return {
    id:
      actor.id ||
      actor.userId ||
      null,

    name:
      actor.name ||
      actor.fullName ||
      actor.email ||
      'Usuario',

    email:
      actor.email ||
      '',

    role:
      actor.role ||
      ''
  };

};


// ======================================================
// CONFIGURACIÓN
// ======================================================

export const getAdminSecurityConfig =
  () => {

    try {

      const raw =
        localStorage.getItem(
          SECURITY_KEY
        );

      if (!raw) {

        return {
          configured: false,
          salt: '',
          passwordHash: '',
          iterations:
            PBKDF2_ITERATIONS,
          protections: {
            ...DEFAULT_PROTECTIONS
          },
          updatedAt: null,
          updatedBy: null
        };

      }

      const parsed =
        JSON.parse(
          raw
        );

      return {
        configured:
          Boolean(
            parsed?.configured &&
            parsed?.salt &&
            parsed?.passwordHash
          ),

        salt:
          parsed?.salt ||
          '',

        passwordHash:
          parsed?.passwordHash ||
          '',

        iterations:
          Number(
            parsed?.iterations ||
            PBKDF2_ITERATIONS
          ),

        protections: {
          ...DEFAULT_PROTECTIONS,
          ...(
            parsed?.protections ||
            {}
          )
        },

        updatedAt:
          parsed?.updatedAt ||
          null,

        updatedBy:
          parsed?.updatedBy ||
          null
      };

    } catch (error) {

      console.error(
        'Error leyendo configuración de seguridad:',
        error
      );

      return {
        configured: false,
        salt: '',
        passwordHash: '',
        iterations:
          PBKDF2_ITERATIONS,
        protections: {
          ...DEFAULT_PROTECTIONS
        },
        updatedAt: null,
        updatedBy: null
      };

    }

  };


// ======================================================
// DERIVAR HASH CON PBKDF2
// ======================================================

const derivePasswordHash =
  async (
    password,
    salt,
    iterations =
      PBKDF2_ITERATIONS
  ) => {

    if (
      !window.crypto?.subtle
    ) {

      throw new Error(
        'Este navegador no permite validar la contraseña de seguridad.'
      );

    }

    const encoder =
      new TextEncoder();

    const keyMaterial =
      await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(
          String(
            password
          )
        ),
        {
          name:
            'PBKDF2'
        },
        false,
        [
          'deriveBits'
        ]
      );

    const bits =
      await window.crypto.subtle.deriveBits(
        {
          name:
            'PBKDF2',

          hash:
            'SHA-256',

          salt,

          iterations
        },
        keyMaterial,
        256
      );

    return toBase64(
      new Uint8Array(
        bits
      )
    );

  };


// ======================================================
// GUARDAR / CAMBIAR CONTRASEÑA
// ======================================================

export const setAdminAuthorizationPassword =
  async ({
    password,
    actor = null,
    protections = null
  }) => {

    const cleanPassword =
      String(
        password ||
        ''
      );

    if (
      cleanPassword.length <
      4
    ) {

      throw new Error(
        'La contraseña administrativa debe tener al menos 4 caracteres.'
      );

    }

    const salt =
      new Uint8Array(
        16
      );

    window.crypto.getRandomValues(
      salt
    );

    const passwordHash =
      await derivePasswordHash(
        cleanPassword,
        salt,
        PBKDF2_ITERATIONS
      );

    const previous =
      getAdminSecurityConfig();

    const next = {
      configured:
        true,

      salt:
        toBase64(
          salt
        ),

      passwordHash,

      iterations:
        PBKDF2_ITERATIONS,

      protections: {
        ...DEFAULT_PROTECTIONS,
        ...previous.protections,
        ...(
          protections ||
          {}
        )
      },

      updatedAt:
        new Date()
          .toISOString(),

      updatedBy:
        normalizeActor(
          actor
        )
    };

    localStorage.setItem(
      SECURITY_KEY,
      JSON.stringify(
        next
      )
    );

    window.dispatchEvent(
      new Event(
        'gym-admin-security-update'
      )
    );

    addAdminSecurityAudit({
      action:
        'security_password_updated',

      result:
        'success',

      actor,

      details: {
        protections:
          next.protections
      }
    });

    return next;

  };


// ======================================================
// ACTUALIZAR QUÉ ACCIONES ESTÁN PROTEGIDAS
// ======================================================

export const updateAdminProtectionSettings =
  ({
    protections,
    actor = null
  }) => {

    const current =
      getAdminSecurityConfig();

    const next = {
      ...current,

      protections: {
        ...DEFAULT_PROTECTIONS,
        ...current.protections,
        ...(
          protections ||
          {}
        )
      },

      updatedAt:
        new Date()
          .toISOString(),

      updatedBy:
        normalizeActor(
          actor
        )
    };

    localStorage.setItem(
      SECURITY_KEY,
      JSON.stringify(
        next
      )
    );

    window.dispatchEvent(
      new Event(
        'gym-admin-security-update'
      )
    );

    addAdminSecurityAudit({
      action:
        'security_protections_updated',

      result:
        'success',

      actor,

      details: {
        protections:
          next.protections
      }
    });

    return next;

  };


// ======================================================
// VALIDAR CONTRASEÑA
// ======================================================

export const verifyAdminAuthorizationPassword =
  async (
    password
  ) => {

    const config =
      getAdminSecurityConfig();

    if (
      !config.configured
    ) {

      return {
        success: false,
        code:
          'NOT_CONFIGURED',
        message:
          'La contraseña administrativa todavía no está configurada.'
      };

    }

    const calculated =
      await derivePasswordHash(
        String(
          password ||
          ''
        ),
        fromBase64(
          config.salt
        ),
        config.iterations
      );

    const success =
      calculated ===
      config.passwordHash;

    return {
      success,

      code:
        success
          ? 'AUTHORIZED'
          : 'INVALID_PASSWORD',

      message:
        success
          ? 'Autorización confirmada.'
          : 'Contraseña administrativa incorrecta.'
    };

  };


// ======================================================
// SABER SI UNA ACCIÓN ESTÁ PROTEGIDA
// ======================================================

export const isAdminProtectionEnabled =
  action => {

    const config =
      getAdminSecurityConfig();

    return (
      config.protections?.[action] !==
      false
    );

  };


// ======================================================
// AUDITORÍA
// ======================================================

export const getAdminSecurityAudit =
  () => {

    try {

      const raw =
        localStorage.getItem(
          AUDIT_KEY
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
        'Error leyendo auditoría de seguridad:',
        error
      );

      return [];

    }

  };


export const addAdminSecurityAudit =
  ({
    action,
    result,
    actor = null,
    target = null,
    details = {}
  }) => {

    const records =
      getAdminSecurityAudit();

    const record = {
      id:
        createId(
          'SECAUD'
        ),

      action:
        action ||
        'unknown',

      result:
        result ||
        'unknown',

      actor:
        normalizeActor(
          actor
        ),

      target:
        target ||
        null,

      details:
        details &&
        typeof details ===
          'object'
          ? details
          : {},

      createdAt:
        new Date()
          .toISOString()
    };

    records.unshift(
      record
    );

    localStorage.setItem(
      AUDIT_KEY,
      JSON.stringify(
        records.slice(
          0,
          1000
        )
      )
    );

    window.dispatchEvent(
      new Event(
        'gym-admin-security-audit-update'
      )
    );

    return record;

  };


export const ADMIN_SECURITY_ACTIONS = {
  member_deactivate:
    'Dar de baja miembro',

  blacklist_clear:
    'Quitar de lista negra',

  blacklist_reactivate:
    'Reactivar alerta de lista negra',

  regenerate_qr:
    'Regenerar código QR',

  regenerate_pin:
    'Regenerar PIN',

  payment_delete:
    'Eliminar pago'
};


export default {
  getAdminSecurityConfig,
  setAdminAuthorizationPassword,
  updateAdminProtectionSettings,
  verifyAdminAuthorizationPassword,
  isAdminProtectionEnabled,
  getAdminSecurityAudit,
  addAdminSecurityAudit,
  ADMIN_SECURITY_ACTIONS
};
