// src/offline/repositories/visitAttendanceRepository.js

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

export const OFFLINE_VISIT_ATTENDANCE_UPDATE_EVENT =
  'nexgym-offline-visit-attendance-update';


// ======================================================
// VALIDAR
// ======================================================

const validateRecord = (
  record
) => {

  if (!record) {

    throw new Error(
      'No se recibió la asistencia de visita.'
    );

  }


  if (!record.id) {

    throw new Error(
      'La asistencia no contiene ID.'
    );

  }


  if (!record.gymId) {

    throw new Error(
      'La asistencia no contiene gymId.'
    );

  }


  if (
    !record.visitId &&
    !record.visitorId
  ) {

    throw new Error(
      'La asistencia no contiene visitId.'
    );

  }


  return true;

};


// ======================================================
// EVENTO
// ======================================================

const dispatchUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_VISIT_ATTENDANCE_UPDATE_EVENT
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-visits-update'
      )
    );

  };


// ======================================================
// PREPARAR
// ======================================================

const prepareRecord = (
  record,
  syncStatus = 'pending'
) => {

  const now =
    new Date()
      .toISOString();


  const visitId =
    record.visitId ||
    record.visitorId;


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

    visitId:
      String(
        visitId
      ),

    visitorId:
      String(
        record.visitorId ||
        visitId
      ),

    syncStatus,

    localUpdatedAt:
      now,

    updatedAt:
      record.updatedAt ||
      now

  };

};


// ======================================================
// GUARDAR
// ======================================================

export const saveOfflineVisitAttendance =
  async (
    record,
    options = {}
  ) => {

    const {

      queueSync =
        true,

      operation =
        SYNC_OPERATIONS.UPDATE

    } = options;


    validateRecord(
      record
    );


    await openNexgymDatabase();


    const gymId =
      String(
        record.gymId
      );


    const attendanceId =
      String(
        record.id
      );


    const existing =
      await db.visitAttendance.get([
        gymId,
        attendanceId
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      prepareRecord(
        record,
        queueSync
          ? 'pending'
          : 'synced'
      );


    await db.visitAttendance.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'visit_attendance',

        entityId:
          attendanceId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'visitAttendanceRepository',

          visitId:
            prepared.visitId,

          local:
            true

        }

      });

    }


    dispatchUpdate();


    console.log(
      '🕒 Asistencia de visita guardada offline:',
      {

        gymId,

        attendanceId,

        visitId:
          prepared.visitId,

        status:
          prepared.status,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// TODAS DEL GYM
// ======================================================

export const getOfflineVisitAttendance =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.visitAttendance
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
// POR VISITA
// ======================================================

export const getOfflineVisitAttendanceByVisit =
  async (
    gymId,
    visitId
  ) => {

    if (
      !gymId ||
      !visitId
    ) {

      return [];

    }


    await openNexgymDatabase();


    return db.visitAttendance
      .where(
        '[gymId+visitId]'
      )
      .equals([
        String(
          gymId
        ),

        String(
          visitId
        )
      ])
      .toArray();

  };


// ======================================================
// POR ID
// ======================================================

export const getOfflineVisitAttendanceById =
  async (
    gymId,
    attendanceId
  ) => {

    if (
      !gymId ||
      !attendanceId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.visitAttendance.get([
        String(
          gymId
        ),

        String(
          attendanceId
        )
      ])
    ) || null;

  };


// ======================================================
// ACTUALIZAR
// ======================================================

export const updateOfflineVisitAttendance =
  async (
    gymId,
    attendanceId,
    changes
  ) => {

    const current =
      await getOfflineVisitAttendanceById(
        gymId,
        attendanceId
      );


    if (!current) {

      throw new Error(
        'No se encontró la asistencia de visita.'
      );

    }


    return saveOfflineVisitAttendance(
      {

        ...current,

        ...changes,

        gymId:
          current.gymId,

        id:
          current.id,

        visitId:
          current.visitId,

        updatedAt:
          new Date()
            .toISOString()

      },
      {

        queueSync:
          true,

        operation:
          SYNC_OPERATIONS.UPDATE

      }
    );

  };


// ======================================================
// SERVIDOR
// ======================================================

export const saveVisitAttendanceFromServer =
  async (
    record
  ) => {

    validateRecord(
      record
    );


    await openNexgymDatabase();


    const prepared =
      prepareRecord(
        record,
        'synced'
      );


    await db.visitAttendance.put(
      prepared
    );


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// EXPORT
// ======================================================

const repository = {

  save:
    saveOfflineVisitAttendance,

  getAll:
    getOfflineVisitAttendance,

  getByVisit:
    getOfflineVisitAttendanceByVisit,

  getById:
    getOfflineVisitAttendanceById,

  update:
    updateOfflineVisitAttendance,

  saveFromServer:
    saveVisitAttendanceFromServer

};


export default repository;