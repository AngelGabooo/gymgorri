// src/offline/repositories/cashMovementRepository.js

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

export const OFFLINE_CASH_MOVEMENTS_UPDATE_EVENT =
  'nexgym-offline-cash-movements-update';


// ======================================================
// EVENTOS
// ======================================================

const dispatchUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_CASH_MOVEMENTS_UPDATE_EVENT
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

const validateMovement =
  movement => {

    if (!movement) {

      throw new Error(
        'No se recibió el movimiento de caja.'
      );

    }


    if (!movement.id) {

      throw new Error(
        'El movimiento de caja no contiene ID.'
      );

    }


    if (!movement.gymId) {

      throw new Error(
        'El movimiento de caja no contiene gymId.'
      );

    }


    if (!movement.shiftId) {

      throw new Error(
        'El movimiento de caja no contiene shiftId.'
      );

    }


    return true;

  };


// ======================================================
// PREPARAR
// ======================================================

const prepareMovement =
  (
    movement,
    syncStatus =
      'pending'
  ) => {

    const now =
      new Date()
        .toISOString();


    return {

      ...movement,

      id:
        String(
          movement.id
        ),

      gymId:
        String(
          movement.gymId
        ),

      shiftId:
        String(
          movement.shiftId
        ),

      syncStatus,

      localUpdatedAt:
        now,

      updatedAt:
        movement.updatedAt ||
        now

    };

  };


// ======================================================
// GUARDAR
// ======================================================

export const saveOfflineCashMovement =
  async (
    movement,
    options = {}
  ) => {

    const {

      queueSync =
        true,

      operation =
        SYNC_OPERATIONS.CREATE

    } = options;


    validateMovement(
      movement
    );


    await openNexgymDatabase();


    const prepared =
      prepareMovement(
        movement,
        queueSync
          ? 'pending'
          : 'synced'
      );


    const existing =
      await db.cashMovements.get([
        prepared.gymId,
        prepared.id
      ]);


    const realOperation =
      existing
        ? SYNC_OPERATIONS.UPDATE
        : operation;


    await db.cashMovements.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId:
          prepared.gymId,

        entity:
          'cash_movement',

        entityId:
          prepared.id,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'cashMovementRepository',

          shiftId:
            prepared.shiftId,

          type:
            prepared.type,

          local:
            true

        }

      });

    }


    dispatchUpdate();


    console.log(
      '💵 Movimiento de caja guardado offline:',
      {

        movementId:
          prepared.id,

        type:
          prepared.type,

        amount:
          prepared.amount,

        shiftId:
          prepared.shiftId,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// TODOS
// ======================================================

export const getOfflineCashMovements =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.cashMovements
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
// POR TURNO
// ======================================================

export const getOfflineCashMovementsByShift =
  async (
    gymId,
    shiftId
  ) => {

    if (
      !gymId ||
      !shiftId
    ) {

      return [];

    }


    await openNexgymDatabase();


    return db.cashMovements
      .where(
        '[gymId+shiftId]'
      )
      .equals([
        String(
          gymId
        ),
        String(
          shiftId
        )
      ])
      .toArray();

  };


// ======================================================
// DESDE SERVIDOR
// ======================================================

export const saveCashMovementFromServer =
  async (
    movement
  ) => {

    validateMovement(
      movement
    );


    await openNexgymDatabase();


    const prepared =
      prepareMovement(
        movement,
        'synced'
      );


    await db.cashMovements.put(
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
    saveOfflineCashMovement,

  getAll:
    getOfflineCashMovements,

  getByShift:
    getOfflineCashMovementsByShift,

  saveFromServer:
    saveCashMovementFromServer

};