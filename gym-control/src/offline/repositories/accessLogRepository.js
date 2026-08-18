// src/offline/repositories/accessLogRepository.js

import db, {
  openNexgymDatabase
} from '../db/nexgymDatabase.js';

import {
  addToSyncQueue,
  SYNC_OPERATIONS
} from '../sync/syncQueue.js';


// ======================================================
// EVENTO
// ======================================================

export const OFFLINE_ACCESS_LOG_UPDATE_EVENT =
  'nexgym-offline-access-log-update';


// ======================================================
// VALIDAR
// ======================================================

const validateAccessLog = (
  record
) => {

  if (!record) {

    throw new Error(
      'No se recibió el log de acceso.'
    );

  }


  if (!record.id) {

    throw new Error(
      'El log de acceso no contiene ID.'
    );

  }


  if (!record.gymId) {

    throw new Error(
      'El log de acceso no contiene gymId.'
    );

  }


  return true;

};


// ======================================================
// NOTIFICAR
// ======================================================

const dispatchAccessLogUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_ACCESS_LOG_UPDATE_EVENT
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );

  };


// ======================================================
// PREPARAR
// ======================================================

const prepareAccessLog = (
  record,
  syncStatus = 'pending'
) => {

  const now =
    new Date()
      .toISOString();


  return {

    ...record,

    id:
      String(
        record.id
      ),

    gymId:
      String(
        record.gymId
      ),

    memberId:
      record.memberId
        ? String(
            record.memberId
          )
        : null,

    syncStatus,

    localUpdatedAt:
      now,

    updatedAt:
      record.updatedAt ||
      now

  };

};


// ======================================================
// GUARDAR LOG
// ======================================================

export const saveOfflineAccessLog =
  async (
    record,
    options = {}
  ) => {

    const {
      queueSync = true,
      operation = SYNC_OPERATIONS.CREATE
    } = options;


    validateAccessLog(
      record
    );


    await openNexgymDatabase();


    const gymId =
      String(
        record.gymId
      );


    const accessLogId =
      String(
        record.id
      );


    const existing =
      await db.accessLogs.get([
        gymId,
        accessLogId
      ]);


    const realOperation =
      existing
        ? (
            operation ===
              SYNC_OPERATIONS.CREATE
              ? SYNC_OPERATIONS.UPDATE
              : operation
          )
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      prepareAccessLog(
        record,
        queueSync
          ? 'pending'
          : 'synced'
      );


    await db.accessLogs.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'access_log',

        entityId:
          accessLogId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'accessLogRepository',

          local:
            true,

          memberId:
            prepared.memberId,

          result:
            prepared.result ||
            null,

          method:
            prepared.method ||
            null

        }

      });

    }


    dispatchAccessLogUpdate();


    console.log(
      '🛡️ Log de acceso guardado offline:',
      {
        gymId,
        accessLogId,
        memberId:
          prepared.memberId,
        result:
          prepared.result,
        operation:
          realOperation
      }
    );


    return prepared;

  };


// ======================================================
// OBTENER LOGS DEL GYM
// ======================================================

export const getOfflineAccessLogs =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.accessLogs
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
// LOG POR ID
// ======================================================

export const getOfflineAccessLogById =
  async (
    gymId,
    accessLogId
  ) => {

    if (
      !gymId ||
      !accessLogId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.accessLogs.get([
        String(
          gymId
        ),
        String(
          accessLogId
        )
      ])
    ) || null;

  };


// ======================================================
// LOGS DE UN MIEMBRO
// ======================================================

export const getOfflineAccessLogsByMember =
  async (
    gymId,
    memberId
  ) => {

    if (
      !gymId ||
      !memberId
    ) {

      return [];

    }


    await openNexgymDatabase();


    return db.accessLogs
      .where(
        '[gymId+memberId]'
      )
      .equals([
        String(
          gymId
        ),
        String(
          memberId
        )
      ])
      .toArray();

  };


// ======================================================
// GUARDAR DESDE SERVIDOR
// ======================================================

export const saveAccessLogFromServer =
  async (
    record
  ) => {

    validateAccessLog(
      record
    );


    await openNexgymDatabase();


    const prepared =
      prepareAccessLog(
        record,
        'synced'
      );


    await db.accessLogs.put(
      prepared
    );


    dispatchAccessLogUpdate();


    return prepared;

  };


// ======================================================
// GUARDAR VARIOS DESDE SERVIDOR
// ======================================================

export const saveAccessLogsFromServer =
  async (
    records
  ) => {

    const safeRecords =
      Array.isArray(
        records
      )
        ? records
        : [];


    await openNexgymDatabase();


    const prepared =
      safeRecords
        .filter(
          record =>
            record?.id &&
            record?.gymId
        )
        .map(
          record =>
            prepareAccessLog(
              record,
              'synced'
            )
        );


    if (
      prepared.length >
      0
    ) {

      await db.accessLogs.bulkPut(
        prepared
      );

    }


    dispatchAccessLogUpdate();


    return prepared;

  };


// ======================================================
// EXPORT
// ======================================================

const accessLogRepository = {

  save:
    saveOfflineAccessLog,

  getAll:
    getOfflineAccessLogs,

  getById:
    getOfflineAccessLogById,

  getByMember:
    getOfflineAccessLogsByMember,

  saveFromServer:
    saveAccessLogFromServer,

  saveManyFromServer:
    saveAccessLogsFromServer

};


export default accessLogRepository;