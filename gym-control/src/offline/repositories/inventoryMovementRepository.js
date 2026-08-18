// src/offline/repositories/inventoryMovementRepository.js

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

export const OFFLINE_INVENTORY_UPDATE_EVENT =
  'nexgym-offline-inventory-update';


// ======================================================
// VALIDAR
// ======================================================

const validateMovement = (
  movement
) => {

  if (!movement) {

    throw new Error(
      'No se recibió el movimiento de inventario.'
    );

  }


  if (!movement.id) {

    throw new Error(
      'El movimiento no contiene ID.'
    );

  }


  if (!movement.gymId) {

    throw new Error(
      'El movimiento no contiene gymId.'
    );

  }


  if (!movement.productId) {

    throw new Error(
      'El movimiento no contiene productId.'
    );

  }


  return true;

};


// ======================================================
// EVENTOS
// ======================================================

const dispatchUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_INVENTORY_UPDATE_EVENT
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-sales-update'
      )
    );

  };


// ======================================================
// PREPARAR
// ======================================================

const prepareMovement = (
  movement,
  syncStatus = 'pending'
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

    productId:
      String(
        movement.productId
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

export const saveOfflineInventoryMovement =
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


    const gymId =
      String(
        movement.gymId
      );


    const movementId =
      String(
        movement.id
      );


    const existing =
      await db.inventoryMovements.get([
        gymId,
        movementId
      ]);


    const realOperation =
      existing
        ? SYNC_OPERATIONS.UPDATE
        : operation;


    const prepared =
      prepareMovement(
        movement,
        queueSync
          ? 'pending'
          : 'synced'
      );


    await db.inventoryMovements.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'inventory_movement',

        entityId:
          movementId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'inventoryMovementRepository',

          productId:
            prepared.productId,

          referenceId:
            prepared.referenceId ||
            null,

          local:
            true

        }

      });

    }


    dispatchUpdate();


    console.log(
      '📦 Movimiento de inventario guardado offline:',
      {

        gymId,

        movementId,

        productId:
          prepared.productId,

        type:
          prepared.type,

        quantity:
          prepared.quantity,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// TODOS DEL GYM
// ======================================================

export const getOfflineInventoryMovements =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.inventoryMovements
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
// POR PRODUCTO
// ======================================================

export const getOfflineInventoryMovementsByProduct =
  async (
    gymId,
    productId
  ) => {

    if (
      !gymId ||
      !productId
    ) {

      return [];

    }


    await openNexgymDatabase();


    return db.inventoryMovements
      .where(
        '[gymId+productId]'
      )
      .equals([
        String(
          gymId
        ),

        String(
          productId
        )
      ])
      .toArray();

  };


// ======================================================
// POR ID
// ======================================================

export const getOfflineInventoryMovementById =
  async (
    gymId,
    movementId
  ) => {

    if (
      !gymId ||
      !movementId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.inventoryMovements.get([
        String(
          gymId
        ),

        String(
          movementId
        )
      ])
    ) || null;

  };


// ======================================================
// DESDE SERVIDOR
// ======================================================

export const saveInventoryMovementFromServer =
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


    await db.inventoryMovements.put(
      prepared
    );


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// MUCHOS DESDE SERVIDOR
// ======================================================

export const saveInventoryMovementsFromServer =
  async (
    movements
  ) => {

    const safe =
      Array.isArray(
        movements
      )
        ? movements
        : [];


    await openNexgymDatabase();


    const prepared =
      safe
        .filter(
          movement =>
            movement?.id &&
            movement?.gymId &&
            movement?.productId
        )
        .map(
          movement =>
            prepareMovement(
              movement,
              'synced'
            )
        );


    if (
      prepared.length >
      0
    ) {

      await db.inventoryMovements.bulkPut(
        prepared
      );

    }


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// EXPORT
// ======================================================

const inventoryMovementRepository = {

  save:
    saveOfflineInventoryMovement,

  getAll:
    getOfflineInventoryMovements,

  getByProduct:
    getOfflineInventoryMovementsByProduct,

  getById:
    getOfflineInventoryMovementById,

  saveFromServer:
    saveInventoryMovementFromServer,

  saveManyFromServer:
    saveInventoryMovementsFromServer

};


export default inventoryMovementRepository;