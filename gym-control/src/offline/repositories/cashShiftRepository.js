// src/offline/repositories/cashShiftRepository.js

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

export const OFFLINE_CASH_SHIFTS_UPDATE_EVENT =
  'nexgym-offline-cash-shifts-update';


// ======================================================
// EVENTOS
// ======================================================

const dispatchUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_CASH_SHIFTS_UPDATE_EVENT
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-cash-update'
      )
    );

  };


// ======================================================
// VALIDAR
// ======================================================

const validateShift =
  shift => {

    if (!shift) {

      throw new Error(
        'No se recibió el turno de caja.'
      );

    }


    if (!shift.id) {

      throw new Error(
        'El turno de caja no contiene ID.'
      );

    }


    if (!shift.gymId) {

      throw new Error(
        'El turno de caja no contiene gymId.'
      );

    }


    return true;

  };


// ======================================================
// PREPARAR
// ======================================================

const prepareShift =
  (
    shift,
    syncStatus =
      'pending'
  ) => {

    const now =
      new Date()
        .toISOString();


    return {

      ...shift,

      id:
        String(
          shift.id
        ),

      gymId:
        String(
          shift.gymId
        ),

      syncStatus,

      localUpdatedAt:
        now,

      updatedAt:
        shift.updatedAt ||
        now

    };

  };


// ======================================================
// GUARDAR
// ======================================================

export const saveOfflineCashShift =
  async (
    shift,
    options = {}
  ) => {

    const {

      queueSync =
        true,

      operation =
        SYNC_OPERATIONS.UPDATE

    } = options;


    validateShift(
      shift
    );


    await openNexgymDatabase();


    const prepared =
      prepareShift(
        shift,
        queueSync
          ? 'pending'
          : 'synced'
      );


    const existing =
      await db.cashShifts.get([
        prepared.gymId,
        prepared.id
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    await db.cashShifts.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId:
          prepared.gymId,

        entity:
          'cash_shift',

        entityId:
          prepared.id,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'cashShiftRepository',

          status:
            prepared.status,

          local:
            true

        }

      });

    }


    dispatchUpdate();


    console.log(
      '🏦 Turno de caja guardado offline:',
      {

        shiftId:
          prepared.id,

        status:
          prepared.status,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// TODOS
// ======================================================

export const getOfflineCashShifts =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.cashShifts
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
// POR ID
// ======================================================

export const getOfflineCashShiftById =
  async (
    gymId,
    shiftId
  ) => {

    if (
      !gymId ||
      !shiftId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.cashShifts.get([
        String(
          gymId
        ),
        String(
          shiftId
        )
      ])
    ) || null;

  };


// ======================================================
// ABIERTOS
// ======================================================

export const getOfflineOpenCashShifts =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.cashShifts
      .where(
        '[gymId+status]'
      )
      .equals([
        String(
          gymId
        ),
        'open'
      ])
      .toArray();

  };


// ======================================================
// DESDE SERVIDOR
// ======================================================

export const saveCashShiftFromServer =
  async (
    shift
  ) => {

    validateShift(
      shift
    );


    await openNexgymDatabase();


    const prepared =
      prepareShift(
        shift,
        'synced'
      );


    await db.cashShifts.put(
      prepared
    );


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// EXPORT
// ======================================================

export default {

  save:
    saveOfflineCashShift,

  getAll:
    getOfflineCashShifts,

  getById:
    getOfflineCashShiftById,

  getOpen:
    getOfflineOpenCashShifts,

  saveFromServer:
    saveCashShiftFromServer

};