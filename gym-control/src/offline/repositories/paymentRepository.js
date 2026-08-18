// src/offline/repositories/paymentRepository.js

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

export const OFFLINE_PAYMENTS_UPDATE_EVENT =
  'nexgym-offline-payments-update';


// ======================================================
// VALIDAR
// ======================================================

const validatePayment = (
  payment
) => {

  if (!payment) {

    throw new Error(
      'No se recibió el pago.'
    );

  }


  if (!payment.id) {

    throw new Error(
      'El pago no contiene ID.'
    );

  }


  if (!payment.gymId) {

    throw new Error(
      'El pago no contiene gymId.'
    );

  }


  return true;

};


// ======================================================
// EVENTO
// ======================================================

const dispatchPaymentsUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_PAYMENTS_UPDATE_EVENT
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

const preparePayment = (
  payment,
  syncStatus = 'pending'
) => {

  const now =
    new Date()
      .toISOString();


  return {

    ...payment,

    id:
      String(
        payment.id
      ),

    gymId:
      String(
        payment.gymId
      ),

    memberId:
      payment.memberId
        ? String(
            payment.memberId
          )
        : null,

    syncStatus,

    localUpdatedAt:
      now,

    updatedAt:
      payment.updatedAt ||
      now

  };

};


// ======================================================
// GUARDAR PAGO OFFLINE
// ======================================================

export const saveOfflinePayment =
  async (
    payment,
    options = {}
  ) => {

    const {

      queueSync =
        true,

      operation =
        SYNC_OPERATIONS.UPDATE

    } = options;


    validatePayment(
      payment
    );


    await openNexgymDatabase();


    const gymId =
      String(
        payment.gymId
      );


    const paymentId =
      String(
        payment.id
      );


    // ==================================================
    // BUSCAR SI YA EXISTE
    // ==================================================

    const existing =
      await db.memberPayments.get([
        gymId,
        paymentId
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      preparePayment(
        payment,
        queueSync
          ? 'pending'
          : 'synced'
      );


    // ==================================================
    // INDEXEDDB
    // ==================================================

    await db.memberPayments.put(
      prepared
    );


    // ==================================================
    // SYNC QUEUE
    // ==================================================

    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'payment',

        entityId:
          paymentId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'paymentRepository',

          local:
            true,

          memberId:
            prepared.memberId ||
            null

        }

      });

    }


    dispatchPaymentsUpdate();


    console.log(
      '💰 Pago guardado offline:',
      {

        gymId,

        paymentId,

        memberId:
          prepared.memberId,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// OBTENER PAGOS DE UN GIMNASIO
// ======================================================

export const getOfflinePayments =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.memberPayments
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
// PAGOS DE UN MIEMBRO
// ======================================================

export const getOfflinePaymentsByMember =
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


    return db.memberPayments
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
// PAGO POR ID
// ======================================================

export const getOfflinePaymentById =
  async (
    gymId,
    paymentId
  ) => {

    if (
      !gymId ||
      !paymentId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.memberPayments.get([
        String(
          gymId
        ),

        String(
          paymentId
        )
      ])
    ) || null;

  };


// ======================================================
// ACTUALIZAR
// ======================================================

export const updateOfflinePayment =
  async (
    gymId,
    paymentId,
    changes
  ) => {

    const current =
      await getOfflinePaymentById(
        gymId,
        paymentId
      );


    if (!current) {

      throw new Error(
        'No se encontró el pago en IndexedDB.'
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


    return saveOfflinePayment(
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

export const deleteOfflinePayment =
  async (
    gymId,
    paymentId,
    options = {}
  ) => {

    const {

      queueSync =
        true

    } = options;


    if (
      !gymId ||
      !paymentId
    ) {

      throw new Error(
        'gymId y paymentId son obligatorios.'
      );

    }


    await openNexgymDatabase();


    const cleanGymId =
      String(
        gymId
      );


    const cleanPaymentId =
      String(
        paymentId
      );


    const existing =
      await getOfflinePaymentById(
        cleanGymId,
        cleanPaymentId
      );


    if (!existing) {

      return {

        success:
          true,

        alreadyDeleted:
          true

      };

    }


    await db.memberPayments.delete([
      cleanGymId,
      cleanPaymentId
    ]);


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId:
          cleanGymId,

        entity:
          'payment',

        entityId:
          cleanPaymentId,

        operation:
          SYNC_OPERATIONS.DELETE,

        payload: {

          id:
            cleanPaymentId,

          gymId:
            cleanGymId,

          memberId:
            existing.memberId ||
            null

        },

        metadata: {

          source:
            'paymentRepository'

        }

      });

    }


    dispatchPaymentsUpdate();


    return {

      success:
        true,

      payment:
        existing

    };

  };


// ======================================================
// GUARDAR DESDE SERVIDOR
// ======================================================

export const savePaymentFromServer =
  async (
    payment
  ) => {

    validatePayment(
      payment
    );


    await openNexgymDatabase();


    const prepared =
      preparePayment(
        payment,
        'synced'
      );


    await db.memberPayments.put(
      prepared
    );


    dispatchPaymentsUpdate();


    return prepared;

  };


// ======================================================
// GUARDAR VARIOS DESDE SERVIDOR
// ======================================================

export const savePaymentsFromServer =
  async (
    payments
  ) => {

    const safePayments =
      Array.isArray(
        payments
      )
        ? payments
        : [];


    await openNexgymDatabase();


    const prepared =
      safePayments
        .filter(
          payment =>
            payment?.id &&
            payment?.gymId
        )
        .map(
          payment =>
            preparePayment(
              payment,
              'synced'
            )
        );


    if (
      prepared.length >
      0
    ) {

      await db.memberPayments.bulkPut(
        prepared
      );

    }


    dispatchPaymentsUpdate();


    return prepared;

  };


// ======================================================
// CONTAR
// ======================================================

export const countOfflinePayments =
  async (
    gymId
  ) => {

    if (!gymId) {

      return 0;

    }


    await openNexgymDatabase();


    return db.memberPayments
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
// EXPORT
// ======================================================

const paymentRepository = {

  save:
    saveOfflinePayment,

  getAll:
    getOfflinePayments,

  getByMember:
    getOfflinePaymentsByMember,

  getById:
    getOfflinePaymentById,

  update:
    updateOfflinePayment,

  delete:
    deleteOfflinePayment,

  saveFromServer:
    savePaymentFromServer,

  saveManyFromServer:
    savePaymentsFromServer,

  count:
    countOfflinePayments

};


export default paymentRepository;