// src/offline/repositories/attendanceRepository.js

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

export const OFFLINE_ATTENDANCE_UPDATE_EVENT =
  'nexgym-offline-attendance-update';


// ======================================================
// VALIDAR
// ======================================================

const validateAttendance = (
  record
) => {

  if (!record) {

    throw new Error(
      'No se recibió la asistencia.'
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


  if (!record.memberId) {

    throw new Error(
      'La asistencia no contiene memberId.'
    );

  }


  return true;

};


// ======================================================
// NOTIFICAR
// ======================================================

const dispatchAttendanceUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_ATTENDANCE_UPDATE_EVENT
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

const prepareAttendance = (
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
      String(
        record.memberId
      ),

    personType:
      record.personType ||
      'member',

    syncStatus,

    localUpdatedAt:
      now,

    updatedAt:
      record.updatedAt ||
      now

  };

};


// ======================================================
// GUARDAR ASISTENCIA
// ======================================================

export const saveOfflineAttendance =
  async (
    record,
    options = {}
  ) => {

    const {
      queueSync = true,
      operation = SYNC_OPERATIONS.UPDATE
    } = options;


    validateAttendance(
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
      await db.attendance.get([
        gymId,
        attendanceId
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      prepareAttendance(
        record,
        queueSync
          ? 'pending'
          : 'synced'
      );


    await db.attendance.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'attendance',

        entityId:
          attendanceId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'attendanceRepository',

          local:
            true,

          memberId:
            prepared.memberId,

          personType:
            prepared.personType,

          status:
            prepared.status

        }

      });

    }


    dispatchAttendanceUpdate();


    console.log(
      '🕒 Asistencia guardada offline:',
      {
        gymId,
        attendanceId,
        memberId:
          prepared.memberId,
        status:
          prepared.status,
        operation:
          realOperation
      }
    );


    return prepared;

  };


// ======================================================
// OBTENER TODAS LAS ASISTENCIAS DEL GYM
// ======================================================

export const getOfflineAttendance =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.attendance
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
// OBTENER ASISTENCIA POR ID
// ======================================================

export const getOfflineAttendanceById =
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
      await db.attendance.get([
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
// OBTENER ASISTENCIAS DE UN MIEMBRO
// ======================================================

export const getOfflineAttendanceByMember =
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


    return db.attendance
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
// OBTENER ASISTENCIA ABIERTA
// ======================================================

export const getOfflineOpenAttendance =
  async (
    gymId,
    memberId
  ) => {

    const records =
      await getOfflineAttendanceByMember(
        gymId,
        memberId
      );


    return (
      records.find(
        record =>
          record.status ===
            'inside' &&
          !record.exitAt
      ) ||
      null
    );

  };


// ======================================================
// ACTUALIZAR
// ======================================================

export const updateOfflineAttendance =
  async (
    gymId,
    attendanceId,
    changes
  ) => {

    const current =
      await getOfflineAttendanceById(
        gymId,
        attendanceId
      );


    if (!current) {

      throw new Error(
        'No se encontró la asistencia en IndexedDB.'
      );

    }


    const updated = {

      ...current,

      ...changes,

      gymId:
        current.gymId,

      id:
        current.id,

      memberId:
        current.memberId,

      updatedAt:
        new Date()
          .toISOString()

    };


    return saveOfflineAttendance(
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
// ELIMINAR
// ======================================================

export const deleteOfflineAttendance =
  async (
    gymId,
    attendanceId,
    options = {}
  ) => {

    const {
      queueSync = true
    } = options;


    if (
      !gymId ||
      !attendanceId
    ) {

      throw new Error(
        'gymId y attendanceId son obligatorios.'
      );

    }


    await openNexgymDatabase();


    const cleanGymId =
      String(
        gymId
      );


    const cleanAttendanceId =
      String(
        attendanceId
      );


    const existing =
      await getOfflineAttendanceById(
        cleanGymId,
        cleanAttendanceId
      );


    if (!existing) {

      return {
        success:
          true,

        alreadyDeleted:
          true
      };

    }


    await db.attendance.delete([
      cleanGymId,
      cleanAttendanceId
    ]);


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId:
          cleanGymId,

        entity:
          'attendance',

        entityId:
          cleanAttendanceId,

        operation:
          SYNC_OPERATIONS.DELETE,

        payload: {
          id:
            cleanAttendanceId,

          gymId:
            cleanGymId,

          memberId:
            existing.memberId
        },

        metadata: {
          source:
            'attendanceRepository'
        }

      });

    }


    dispatchAttendanceUpdate();


    return {
      success:
        true,

      attendance:
        existing
    };

  };


// ======================================================
// GUARDAR DESDE SERVIDOR
// ======================================================

export const saveAttendanceFromServer =
  async (
    record
  ) => {

    validateAttendance(
      record
    );


    await openNexgymDatabase();


    const prepared =
      prepareAttendance(
        record,
        'synced'
      );


    await db.attendance.put(
      prepared
    );


    dispatchAttendanceUpdate();


    return prepared;

  };


// ======================================================
// GUARDAR VARIOS DESDE SERVIDOR
// ======================================================

export const saveAttendanceListFromServer =
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
            record?.gymId &&
            record?.memberId
        )
        .map(
          record =>
            prepareAttendance(
              record,
              'synced'
            )
        );


    if (
      prepared.length >
      0
    ) {

      await db.attendance.bulkPut(
        prepared
      );

    }


    dispatchAttendanceUpdate();


    return prepared;

  };


// ======================================================
// CONTAR PERSONAS DENTRO
// ======================================================

export const countOfflinePeopleInside =
  async (
    gymId
  ) => {

    const records =
      await getOfflineAttendance(
        gymId
      );


    const openByMember =
      new Map();


    records.forEach(
      record => {

        if (
          record.status ===
            'inside' &&
          !record.exitAt
        ) {

          openByMember.set(
            record.memberId,
            record
          );

        }

      }
    );


    return openByMember.size;

  };


// ======================================================
// EXPORT
// ======================================================

const attendanceRepository = {

  save:
    saveOfflineAttendance,

  getAll:
    getOfflineAttendance,

  getById:
    getOfflineAttendanceById,

  getByMember:
    getOfflineAttendanceByMember,

  getOpen:
    getOfflineOpenAttendance,

  update:
    updateOfflineAttendance,

  delete:
    deleteOfflineAttendance,

  saveFromServer:
    saveAttendanceFromServer,

  saveManyFromServer:
    saveAttendanceListFromServer,

  countInside:
    countOfflinePeopleInside

};


export default attendanceRepository;