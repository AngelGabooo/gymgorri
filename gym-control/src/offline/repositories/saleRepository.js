// src/offline/repositories/saleRepository.js

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

export const OFFLINE_SALES_UPDATE_EVENT =
  'nexgym-offline-sales-update';


// ======================================================
// EVENTOS
// ======================================================

const dispatchUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_SALES_UPDATE_EVENT
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


    window.dispatchEvent(
      new Event(
        'gym-cash-update'
      )
    );

  };


// ======================================================
// VALIDAR
// ======================================================

const validateSale =
  sale => {

    if (!sale) {

      throw new Error(
        'No se recibió la venta.'
      );

    }


    if (!sale.id) {

      throw new Error(
        'La venta no contiene ID.'
      );

    }


    if (!sale.gymId) {

      throw new Error(
        'La venta no contiene gymId.'
      );

    }


    return true;

  };


// ======================================================
// PREPARAR
// ======================================================

const prepareSale =
  (
    sale,
    syncStatus =
      'pending'
  ) => {

    const now =
      new Date()
        .toISOString();


    return {

      ...sale,

      id:
        String(
          sale.id
        ),

      gymId:
        String(
          sale.gymId
        ),

      cashShiftId:
        sale.cashShiftId
          ? String(
              sale.cashShiftId
            )
          : null,

      syncStatus,

      localUpdatedAt:
        now,

      updatedAt:
        sale.updatedAt ||
        now

    };

  };


// ======================================================
// GUARDAR
// ======================================================

export const saveOfflineSale =
  async (
    sale,
    options = {}
  ) => {

    const {

      queueSync =
        true,

      operation =
        SYNC_OPERATIONS.UPDATE

    } = options;


    validateSale(
      sale
    );


    await openNexgymDatabase();


    const gymId =
      String(
        sale.gymId
      );


    const saleId =
      String(
        sale.id
      );


    const existing =
      await db.sales.get([
        gymId,
        saleId
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      prepareSale(
        sale,
        queueSync
          ? 'pending'
          : 'synced'
      );


    await db.sales.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'sale',

        entityId:
          saleId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'saleRepository',

          cashShiftId:
            prepared.cashShiftId,

          local:
            true

        }

      });

    }


    dispatchUpdate();


    console.log(
      '🧾 Venta guardada offline:',
      {

        gymId,

        saleId,

        folio:
          prepared.folio,

        total:
          prepared.total,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// OBTENER TODAS
// ======================================================

export const getOfflineSales =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.sales
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

export const getOfflineSaleById =
  async (
    gymId,
    saleId
  ) => {

    if (
      !gymId ||
      !saleId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.sales.get([
        String(
          gymId
        ),
        String(
          saleId
        )
      ])
    ) || null;

  };


// ======================================================
// POR TURNO
// ======================================================

export const getOfflineSalesByShift =
  async (
    gymId,
    cashShiftId
  ) => {

    if (
      !gymId ||
      !cashShiftId
    ) {

      return [];

    }


    await openNexgymDatabase();


    return db.sales
      .where(
        '[gymId+cashShiftId]'
      )
      .equals([
        String(
          gymId
        ),
        String(
          cashShiftId
        )
      ])
      .toArray();

  };


// ======================================================
// ACTUALIZAR
// ======================================================

export const updateOfflineSale =
  async (
    gymId,
    saleId,
    changes
  ) => {

    const current =
      await getOfflineSaleById(
        gymId,
        saleId
      );


    if (!current) {

      throw new Error(
        'No se encontró la venta en IndexedDB.'
      );

    }


    return saveOfflineSale(
      {

        ...current,

        ...changes,

        id:
          current.id,

        gymId:
          current.gymId,

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
// DESDE SERVIDOR
// ======================================================

export const saveSaleFromServer =
  async (
    sale
  ) => {

    validateSale(
      sale
    );


    await openNexgymDatabase();


    const prepared =
      prepareSale(
        sale,
        'synced'
      );


    await db.sales.put(
      prepared
    );


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// MUCHAS DESDE SERVIDOR
// ======================================================

export const saveSalesFromServer =
  async (
    sales
  ) => {

    const safe =
      Array.isArray(
        sales
      )
        ? sales
        : [];


    await openNexgymDatabase();


    const prepared =
      safe
        .filter(
          sale =>
            sale?.id &&
            sale?.gymId
        )
        .map(
          sale =>
            prepareSale(
              sale,
              'synced'
            )
        );


    if (
      prepared.length >
      0
    ) {

      await db.sales.bulkPut(
        prepared
      );

    }


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// EXPORT
// ======================================================

export default {

  save:
    saveOfflineSale,

  getAll:
    getOfflineSales,

  getById:
    getOfflineSaleById,

  getByShift:
    getOfflineSalesByShift,

  update:
    updateOfflineSale,

  saveFromServer:
    saveSaleFromServer,

  saveManyFromServer:
    saveSalesFromServer

};