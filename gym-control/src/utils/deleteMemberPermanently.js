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

import db, {
  openNexgymDatabase
} from '../offline/db/nexgymDatabase.js';

import {
  addToSyncQueue,
  SYNC_OPERATIONS
} from '../offline/sync/syncQueue.js';


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
// ELIMINAR DE INDEXEDDB (OFFLINE)
// ======================================================
//
// IMPORTANTE:
//
// Sin esto, el pull puede "revivir" al miembro porque
// el registro sigue existiendo en IndexedDB y el
// hydrate lo vuelve a copiar a localStorage.
//
// ======================================================

const deleteMemberFromIndexedDB =
  async (
    gymId,
    memberId
  ) => {

    if (!gymId || !memberId) {

      return;

    }


    try {

      await openNexgymDatabase();


      // ==================================================
      // BORRAR MIEMBRO
      // ==================================================

      await db.members.delete([
        String(gymId),
        String(memberId)
      ]);


      // ==================================================
      // BORRAR REGISTROS RELACIONADOS
      // ==================================================

      await db.memberSubscriptions
        .where({
          gymId: String(gymId),
          memberId: String(memberId)
        })
        .delete();


      await db.memberPayments
        .where({
          gymId: String(gymId),
          memberId: String(memberId)
        })
        .delete();


      await db.attendance
        .where({
          gymId: String(gymId),
          memberId: String(memberId)
        })
        .delete();


      await db.accessLogs
        .where({
          gymId: String(gymId),
          memberId: String(memberId)
        })
        .delete();


      console.log(
        '🗑️ Miembro y registros relacionados borrados de IndexedDB:',
        {
          gymId,
          memberId
        }
      );

    } catch (error) {

      // No bloqueamos la eliminación si IndexedDB falla.
      // El DELETE en Supabase y la limpieza de localStorage
      // ya se hicieron.

      console.error(
        '❌ No se pudo borrar el miembro de IndexedDB:',
        error
      );

    }

  };


// ======================================================
// ENCOLAR DELETE EN SYNCQUEUE
// ======================================================
//
// Esto hace que el DELETE llegue a Supabase.
// Sin esto, el miembro se borra localmente pero
// reaparece al recargar porque el pull lo trae de nuevo.
//
// ======================================================

const enqueueMemberDelete =
  async (
    gymId,
    memberId
  ) => {

    if (!gymId || !memberId) {

      return;

    }


    try {

      await addToSyncQueue({

        gymId,

        entity:
          'member',

        entityId:
          String(memberId),

        operation:
          SYNC_OPERATIONS.DELETE,

        payload:
          null,

        metadata: {
          reason:
            'permanent_delete'
        }

      });


      console.log(
        '📥 DELETE encolado en syncQueue:',
        {
          gymId,
          memberId
        }
      );

    } catch (error) {

      console.error(
        '❌ No se pudo encolar el DELETE del miembro:',
        error
      );

    }

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
  // ELIMINAR REGISTROS RELACIONADOS DE LOCALSTORAGE
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
  // ELIMINAR DE INDEXEDDB (OFFLINE)
  // ====================================================
  //
  // No hacemos await porque la firma actual es síncrona
  // (varias pantallas la llaman sin await).
  //
  // IndexedDB y syncQueue se actualizan en paralelo.
  //
  // ====================================================

  const resolvedGymId =
    gymId ||
    member?.gymId ||
    null;


  if (resolvedGymId) {

    void deleteMemberFromIndexedDB(
      resolvedGymId,
      memberId
    );


    void enqueueMemberDelete(
      resolvedGymId,
      memberId
    );

  } else {

    console.warn(
      '⚠️ Miembro eliminado en modo legacy (sin gymId). No se tocó IndexedDB ni syncQueue.'
    );

  }


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
      resolvedGymId,

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