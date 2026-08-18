// src/offline/repositories/memberRepository.js

import db, {
  openNexgymDatabase
} from '../db/nexgymDatabase';

import {
  addToSyncQueue,
  SYNC_OPERATIONS
} from '../sync/syncQueue';


// ======================================================
// EVENTO
// ======================================================

export const OFFLINE_MEMBERS_UPDATE_EVENT =
  'nexgym-offline-members-update';


// ======================================================
// VALIDAR MIEMBRO
// ======================================================

const validateMember = (
  member
) => {

  if (!member) {
    throw new Error(
      'No se recibió el miembro.'
    );
  }


  if (!member.id) {
    throw new Error(
      'El miembro no tiene ID.'
    );
  }


  if (!member.gymId) {
    throw new Error(
      'El miembro no contiene gymId.'
    );
  }


  return true;

};


// ======================================================
// EVENTO
// ======================================================

const dispatchMembersUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_MEMBERS_UPDATE_EVENT
      )
    );

  };


// ======================================================
// PREPARAR MIEMBRO
// ======================================================

const prepareMember = (
  member,
  syncStatus = 'pending'
) => {

  const now =
    new Date()
      .toISOString();


  return {

    ...member,

    gymId:
      String(
        member.gymId
      ),

    id:
      String(
        member.id
      ),

    syncStatus,

    localUpdatedAt:
      now,

    updatedAt:
      member.updatedAt ||
      now

  };

};


// ======================================================
// GUARDAR MIEMBRO LOCAL
// ======================================================

export const saveOfflineMember =
  async (
    member,
    options = {}
  ) => {

    const {
      queueSync = true,
      operation = SYNC_OPERATIONS.UPDATE
    } = options;


    validateMember(
      member
    );


    await openNexgymDatabase();


    const gymId =
      String(
        member.gymId
      );


    const memberId =
      String(
        member.id
      );


    // ==================================================
    // BUSCAR EXISTENTE
    // ==================================================

    const existing =
      await db.members.get([
        gymId,
        memberId
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      prepareMember(
        member,
        queueSync
          ? 'pending'
          : 'synced'
      );


    // ==================================================
    // GUARDAR EN INDEXEDDB
    // ==================================================

    await db.members.put(
      prepared
    );


    // ==================================================
    // AGREGAR A COLA
    // ==================================================

    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'member',

        entityId:
          memberId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'memberRepository',

          local:
            true

        }

      });

    }


    dispatchMembersUpdate();


    console.log(
      '💾 Miembro guardado offline:',
      {
        gymId,
        memberId,
        operation:
          realOperation
      }
    );


    return prepared;

  };


// ======================================================
// OBTENER TODOS LOS MIEMBROS DE UN GYM
// ======================================================

export const getOfflineMembers =
  async (
    gymId
  ) => {

    if (!gymId) {
      return [];
    }


    await openNexgymDatabase();


    return db.members
      .where(
        'gymId'
      )
      .equals(
        String(
          gymId
        )
      )
      .toArray();

  };


// ======================================================
// OBTENER MIEMBRO POR ID
// ======================================================

export const getOfflineMemberById =
  async (
    gymId,
    memberId
  ) => {

    if (
      !gymId ||
      !memberId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.members.get([
        String(
          gymId
        ),
        String(
          memberId
        )
      ])
    ) || null;

  };


// ======================================================
// BUSCAR POR QR
// ======================================================

export const getOfflineMemberByQRToken =
  async (
    gymId,
    memberId,
    token
  ) => {

    if (
      !gymId ||
      !memberId ||
      !token
    ) {

      return null;

    }


    const member =
      await getOfflineMemberById(
        gymId,
        memberId
      );


    if (!member) {
      return null;
    }


    if (
      member
        ?.access
        ?.qr
        ?.enabled !==
        true
    ) {

      return null;

    }


    if (
      member
        ?.access
        ?.qr
        ?.token !==
        token
    ) {

      return null;

    }


    return member;

  };


// ======================================================
// ACTUALIZAR MIEMBRO
// ======================================================

export const updateOfflineMember =
  async (
    gymId,
    memberId,
    changes
  ) => {

    const current =
      await getOfflineMemberById(
        gymId,
        memberId
      );


    if (!current) {

      throw new Error(
        'No se encontró el miembro en IndexedDB.'
      );

    }


    const updated = {

      ...current,

      ...changes,

      gymId:
        current.gymId,

      id:
        current.id,

      updatedAt:
        new Date()
          .toISOString()

    };


    return saveOfflineMember(
      updated,
      {
        queueSync:
          true,

        operation:
          SYNC_OPERATIONS.UPDATE
      }
    );

  };


// ======================================================
// ELIMINAR MIEMBRO
// ======================================================

export const deleteOfflineMember =
  async (
    gymId,
    memberId,
    options = {}
  ) => {

    const {
      queueSync = true
    } = options;


    if (
      !gymId ||
      !memberId
    ) {

      throw new Error(
        'gymId y memberId son obligatorios.'
      );

    }


    await openNexgymDatabase();


    const cleanGymId =
      String(
        gymId
      );


    const cleanMemberId =
      String(
        memberId
      );


    const existing =
      await getOfflineMemberById(
        cleanGymId,
        cleanMemberId
      );


    if (!existing) {

      return {

        success:
          true,

        alreadyDeleted:
          true

      };

    }


    await db.members.delete([
      cleanGymId,
      cleanMemberId
    ]);


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId:
          cleanGymId,

        entity:
          'member',

        entityId:
          cleanMemberId,

        operation:
          SYNC_OPERATIONS.DELETE,

        payload: {

          id:
            cleanMemberId,

          gymId:
            cleanGymId

        },

        metadata: {

          source:
            'memberRepository'

        }

      });

    }


    dispatchMembersUpdate();


    console.log(
      '🗑️ Miembro eliminado de IndexedDB:',
      {
        gymId:
          cleanGymId,

        memberId:
          cleanMemberId
      }
    );


    return {

      success:
        true,

      member:
        existing

    };

  };


// ======================================================
// GUARDAR DESDE SERVIDOR
// ======================================================
//
// Cuando después Supabase nos mande datos:
//
// guardar en IndexedDB
// SIN volver a agregar a syncQueue.
//
// ======================================================

export const saveMemberFromServer =
  async (
    member
  ) => {

    validateMember(
      member
    );


    await openNexgymDatabase();


    const prepared =
      prepareMember(
        member,
        'synced'
      );


    await db.members.put(
      prepared
    );


    dispatchMembersUpdate();


    return prepared;

  };


// ======================================================
// GUARDAR MUCHOS DESDE SERVIDOR
// ======================================================

export const saveMembersFromServer =
  async (
    members
  ) => {

    const safeMembers =
      Array.isArray(
        members
      )
        ? members
        : [];


    if (
      safeMembers.length ===
      0
    ) {

      return [];

    }


    await openNexgymDatabase();


    const prepared =
      safeMembers
        .filter(
          member =>
            member?.id &&
            member?.gymId
        )
        .map(
          member =>
            prepareMember(
              member,
              'synced'
            )
        );


    if (
      prepared.length >
      0
    ) {

      await db.members.bulkPut(
        prepared
      );

    }


    dispatchMembersUpdate();


    return prepared;

  };


// ======================================================
// CONTAR MIEMBROS DEL GYM
// ======================================================

export const countOfflineMembers =
  async (
    gymId
  ) => {

    if (!gymId) {
      return 0;
    }


    await openNexgymDatabase();


    return db.members
      .where(
        'gymId'
      )
      .equals(
        String(
          gymId
        )
      )
      .count();

  };


// ======================================================
// BORRAR TODOS LOS MIEMBROS DE UN GYM LOCALMENTE
// ======================================================
//
// Útil para una futura resync completa.
//
// NO genera operaciones DELETE.
//
// ======================================================

export const clearOfflineMembersForGym =
  async (
    gymId
  ) => {

    if (!gymId) {
      return 0;
    }


    await openNexgymDatabase();


    const keys =
      await db.members
        .where(
          'gymId'
        )
        .equals(
          String(
            gymId
          )
        )
        .primaryKeys();


    if (
      keys.length >
      0
    ) {

      await db.members.bulkDelete(
        keys
      );

    }


    dispatchMembersUpdate();


    return keys.length;

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

const memberRepository = {

  save:
    saveOfflineMember,

  getAll:
    getOfflineMembers,

  getById:
    getOfflineMemberById,

  getByQR:
    getOfflineMemberByQRToken,

  update:
    updateOfflineMember,

  delete:
    deleteOfflineMember,

  saveFromServer:
    saveMemberFromServer,

  saveManyFromServer:
    saveMembersFromServer,

  count:
    countOfflineMembers,

  clearForGym:
    clearOfflineMembersForGym

};


export default memberRepository;