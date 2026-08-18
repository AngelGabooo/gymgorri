// src/utils/deleteMemberPermanently.js

import {
  getStoredMembers,
  getAllStoredMembers,
  getCurrentGymContext,
  saveAllStoredMembers
} from './memberId';

import {
  addMemberToBlacklist
} from '../services/blacklistService';


// ======================================================
// CLAVES RELACIONADAS
// ======================================================

const RELATED_ARRAY_KEYS = [

  'gym_control_attendance',

  'gym_control_payments',

  'gym_control_subscription_history',

  'gym_control_access_history',

  'gym_control_access_logs'

];


// ======================================================
// TEMPORALES
// ======================================================

const TEMPORARY_KEYS = [

  'gym_control_current_member',

  'gym_control_pending_member',

  'gym_control_registration_member',

  'gym_control_last_member'

];


// ======================================================
// LEER ARRAY
// ======================================================

const readArray = (
  key
) => {

  try {

    const raw =
      localStorage.getItem(
        key
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
      `Error leyendo ${key}:`,
      error
    );


    return [];

  }

};


// ======================================================
// GUARDAR ARRAY
// ======================================================

const saveArray = (
  key,
  data
) => {

  localStorage.setItem(
    key,
    JSON.stringify(
      Array.isArray(
        data
      )
        ? data
        : []
    )
  );

};


// ======================================================
// OBTENER GYM ID DEL REGISTRO
// ======================================================

const getRecordGymId = (
  record
) => {

  return (

    record?.gymId ||

    record?.member?.gymId ||

    record?.memberSnapshot?.gymId ||

    null

  );

};


// ======================================================
// PERTENECE AL MIEMBRO
// ======================================================

const belongsToMember = (
  record,
  memberId
) => {

  if (!record) {

    return false;

  }


  return (

    record.memberId ===
      memberId ||

    record.member?.id ===
      memberId ||

    record.member?.memberId ===
      memberId ||

    record.userId ===
      memberId ||

    record.idMember ===
      memberId

  );

};


// ======================================================
// PERTENECE AL GIMNASIO
// ======================================================

const belongsToGym = (
  record,
  gymId
) => {

  // ====================================================
  // LEGACY
  // ====================================================

  if (!gymId) {

    return true;

  }


  return (
    getRecordGymId(
      record
    ) ===
    gymId
  );

};


// ======================================================
// DEBE ELIMINARSE
// ======================================================

const shouldDeleteRelatedRecord = (
  record,
  memberId,
  gymId
) => {

  if (
    !belongsToMember(
      record,
      memberId
    )
  ) {

    return false;

  }


  // ====================================================
  // MULTI-GIMNASIO
  // ====================================================
  //
  // Si tenemos gymId solamente eliminamos registros que
  // estén explícitamente asociados a ese gimnasio.
  //
  // Esto evita borrar accidentalmente información de otro.
  //
  // ====================================================

  if (gymId) {

    return belongsToGym(
      record,
      gymId
    );

  }


  return true;

};


// ======================================================
// ELIMINAR MIEMBRO
// ======================================================

export const deleteMemberPermanently = (
  memberId,
  options = {}
) => {

  const {

    reason = '',

    actor = null,

    addToBlacklist = true,

    blacklistNotes = ''

  } =
    options;


  // ====================================================
  // VALIDAR ID
  // ====================================================

  if (!memberId) {

    throw new Error(
      'No se recibió un ID de miembro válido.'
    );

  }


  const {
    gymId
  } =
    getCurrentGymContext();


  // ====================================================
  // BUSCAR MIEMBRO SOLO EN EL GIMNASIO ACTUAL
  // ====================================================

  const scopedMembers =
    getStoredMembers();


  const member =
    scopedMembers.find(
      item =>
        item.id ===
        memberId
    );


  if (!member) {

    throw new Error(
      'El miembro no existe o pertenece a otro gimnasio.'
    );

  }


  // ====================================================
  // VALIDAR MOTIVO
  // ====================================================

  const cleanReason =
    String(
      reason ||
      ''
    ).trim();


  if (
    addToBlacklist &&
    !cleanReason
  ) {

    throw new Error(
      'Debes indicar el motivo de eliminación antes de continuar.'
    );

  }


  // ====================================================
  // LISTA NEGRA PRIMERO
  // ====================================================

  let blacklistRecord =
    null;


  if (
    addToBlacklist
  ) {

    blacklistRecord =
      addMemberToBlacklist({

        member,

        reason:
          cleanReason,

        actor,

        source:
          'deleted',

        notes:
          blacklistNotes

      });


    if (
      !blacklistRecord?.id
    ) {

      throw new Error(
        'No se pudo guardar el antecedente en la lista negra. La eliminación fue cancelada.'
      );

    }

  }


  // ====================================================
  // ELIMINAR SOLO AL MIEMBRO DEL GIMNASIO ACTUAL
  // ====================================================

  const allMembers =
    getAllStoredMembers();


  const remainingMembers =
    allMembers.filter(
      item => {

        // ==================================================
        // MULTI-GIMNASIO
        // ==================================================

        if (gymId) {

          return !(
            item.id ===
              memberId &&
            item.gymId ===
              gymId
          );

        }


        // ==================================================
        // LEGACY
        // ==================================================

        return (
          item.id !==
          memberId
        );

      }
    );


  saveAllStoredMembers(
    remainingMembers
  );


  // ====================================================
  // ELIMINAR REGISTROS RELACIONADOS
  // ====================================================

  RELATED_ARRAY_KEYS.forEach(
    key => {

      const raw =
        localStorage.getItem(
          key
        );


      if (
        raw ===
        null
      ) {

        return;

      }


      const records =
        readArray(
          key
        );


      const remainingRecords =
        records.filter(
          record =>
            !shouldDeleteRelatedRecord(
              record,
              memberId,
              gymId
            )
        );


      saveArray(
        key,
        remainingRecords
      );

    }
  );


  // ====================================================
  // LIMPIAR TEMPORALES
  // ====================================================

  TEMPORARY_KEYS.forEach(
    key => {

      try {

        const raw =
          localStorage.getItem(
            key
          );


        if (!raw) {

          return;

        }


        const parsed =
          JSON.parse(
            raw
          );


        const sameMember =
          parsed?.id ===
            memberId ||
          parsed?.memberId ===
            memberId;


        if (!sameMember) {

          return;

        }


        // ================================================
        // LEGACY
        // ================================================

        if (!gymId) {

          localStorage.removeItem(
            key
          );


          return;

        }


        // ================================================
        // MULTI-GIMNASIO
        // ================================================

        const temporaryGymId =

          parsed?.gymId ||

          parsed?.member?.gymId ||

          null;


        if (
          temporaryGymId ===
          gymId
        ) {

          localStorage.removeItem(
            key
          );

        }

      } catch (error) {

        console.warn(
          `No se pudo revisar ${key}:`,
          error
        );

      }

    }
  );


  // ====================================================
  // NO TOCAR CONTADORES
  // ====================================================
  //
  // El contador del gimnasio se conserva.
  //
  // Si se elimina GYM-00005,
  // el siguiente seguirá siendo GYM-00006.
  //
  // ====================================================


  // ====================================================
  // NOTIFICAR
  // ====================================================

  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-blacklist-update'
    )
  );


  // ====================================================
  // RESULTADO
  // ====================================================

  return {

    success:
      true,

    gymId:
      gymId ||
      member?.gymId ||
      null,

    memberId,

    deletedMember:
      member,

    remainingMembers:
      getStoredMembers()
        .length,

    blacklistRecord

  };

};


export default deleteMemberPermanently;