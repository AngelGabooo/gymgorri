// src/utils/deleteMemberPermanently.js

import {
  getStoredMembers
} from './memberId';

import {
  addMemberToBlacklist
} from '../services/blacklistService';


const MEMBERS_STORAGE_KEY =
  'gym_control_members';


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

  } = options;


  // ====================================================
  // VALIDAR ID
  // ====================================================

  if (!memberId) {

    throw new Error(
      'No se recibió un ID de miembro válido.'
    );

  }


  // ====================================================
  // BUSCAR MIEMBRO
  // ====================================================

  const members =
    getStoredMembers();


  const member =
    members.find(
      item =>
        item.id ===
        memberId
    );


  if (!member) {

    throw new Error(
      'El miembro ya no existe en el almacenamiento local.'
    );

  }


  // ====================================================
  // VALIDAR MOTIVO
  // ====================================================

  const cleanReason =
    String(
      reason || ''
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
  // PRIMERO GUARDAMOS EL ANTECEDENTE
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
  // ELIMINAR MIEMBRO
  // ====================================================

  const remainingMembers =
    members.filter(
      item =>
        item.id !==
        memberId
    );


  localStorage.setItem(
    MEMBERS_STORAGE_KEY,
    JSON.stringify(
      remainingMembers
    )
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
        raw === null
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
            !belongsToMember(
              record,
              memberId
            )
        );


      localStorage.setItem(
        key,
        JSON.stringify(
          remainingRecords
        )
      );

    }
  );


  // ====================================================
  // LIMPIAR TEMPORALES
  // ====================================================

  const temporaryKeys = [

    'gym_control_current_member',

    'gym_control_pending_member',

    'gym_control_registration_member',

    'gym_control_last_member'

  ];


  temporaryKeys.forEach(
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


        if (

          parsed?.id ===
            memberId ||

          parsed?.memberId ===
            memberId

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
  // NO TOCAR CONTADOR
  // ====================================================
  //
  // gym_control_member_counter se conserva.
  //
  // Un ID eliminado jamás vuelve a utilizarse.
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

    memberId,

    deletedMember:
      member,

    remainingMembers:
      remainingMembers.length,

    blacklistRecord

  };

};


export default deleteMemberPermanently;