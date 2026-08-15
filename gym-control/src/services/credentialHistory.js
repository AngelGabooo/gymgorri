// src/utils/credentialHistory.js

export const CREDENTIAL_HISTORY_KEY =
  'gym_control_credential_history';


// ======================================================
// LEER HISTORIAL
// ======================================================

export const getCredentialHistory = () => {

  try {

    const raw =
      localStorage.getItem(
        CREDENTIAL_HISTORY_KEY
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
      'Error leyendo historial de credenciales:',
      error
    );

    return [];

  }

};


// ======================================================
// GUARDAR HISTORIAL
// ======================================================

const saveCredentialHistory = (
  records
) => {

  localStorage.setItem(
    CREDENTIAL_HISTORY_KEY,
    JSON.stringify(
      Array.isArray(records)
        ? records
        : []
    )
  );

  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );

  window.dispatchEvent(
    new Event(
      'gym-credential-history-update'
    )
  );

};


// ======================================================
// ID
// ======================================================

const createCredentialHistoryId =
  () => {

    if (
      window.crypto?.randomUUID
    ) {

      return `CRED-${window.crypto.randomUUID()}`;

    }

    return (
      `CRED-${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(2, 8)
    );

  };


// ======================================================
// NORMALIZAR ACTOR
// ======================================================

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
// REGISTRAR EVENTO
// ======================================================

export const addCredentialHistoryEvent = ({
  memberId,
  memberName = '',
  action,
  source = 'profile',
  actor = null,
  metadata = {}
}) => {

  if (
    !memberId ||
    !action
  ) {

    return null;

  }

  const records =
    getCredentialHistory();

  const now =
    new Date()
      .toISOString();

  const event = {
    id:
      createCredentialHistoryId(),

    memberId,

    memberName,

    action,

    source,

    actor:
      normalizeActor(
        actor
      ),

    metadata:
      metadata &&
      typeof metadata ===
        'object'
        ? metadata
        : {},

    createdAt:
      now
  };

  records.unshift(
    event
  );

  saveCredentialHistory(
    records
  );

  return event;

};


// ======================================================
// HISTORIAL DE UN MIEMBRO
// ======================================================

export const getCredentialHistoryByMember = (
  memberId
) => {

  if (!memberId) {
    return [];
  }

  return getCredentialHistory()
    .filter(
      record =>
        record.memberId ===
        memberId
    )
    .sort(
      (
        a,
        b
      ) =>
        new Date(
          b.createdAt ||
          0
        ) -
        new Date(
          a.createdAt ||
          0
        )
    );

};


// ======================================================
// ETIQUETAS
// ======================================================

export const getCredentialActionLabel = (
  action
) => {

  switch (
    String(
      action ||
      ''
    ).toLowerCase()
  ) {

    case 'generated':
      return 'Credencial generada';

    case 'qr_downloaded':
      return 'Código QR descargado';

    case 'credential_downloaded':
      return 'Credencial descargada';

    case 'credential_printed':
      return 'Credencial impresa';

    case 'qr_regenerated':
      return 'Código QR regenerado';

    case 'method_enabled':
      return 'Método de acceso habilitado';

    case 'method_disabled':
      return 'Método de acceso deshabilitado';

    default:
      return action ||
        'Movimiento de credencial';

  }

};


export default {
  CREDENTIAL_HISTORY_KEY,
  getCredentialHistory,
  addCredentialHistoryEvent,
  getCredentialHistoryByMember,
  getCredentialActionLabel
};
