// src/offline/repositories/subscriptionRepository.js

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

export const OFFLINE_SUBSCRIPTIONS_UPDATE_EVENT =
  'nexgym-offline-subscriptions-update';


// ======================================================
// VALIDAR
// ======================================================

const validateSubscriptionRecord = (
  record
) => {

  if (!record) {

    throw new Error(
      'No se recibió el registro de suscripción.'
    );

  }


  if (!record.id) {

    throw new Error(
      'El registro de suscripción no contiene ID.'
    );

  }


  if (!record.gymId) {

    throw new Error(
      'El registro de suscripción no contiene gymId.'
    );

  }


  if (!record.memberId) {

    throw new Error(
      'El registro de suscripción no contiene memberId.'
    );

  }


  return true;

};


// ======================================================
// EVENTO
// ======================================================

const dispatchSubscriptionsUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_SUBSCRIPTIONS_UPDATE_EVENT
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

const prepareSubscriptionRecord = (
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

    syncStatus,

    localUpdatedAt:
      now,

    updatedAt:
      record.updatedAt ||
      now

  };

};


// ======================================================
// GUARDAR HISTORIAL
// ======================================================

export const saveOfflineSubscription =
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


    validateSubscriptionRecord(
      record
    );


    await openNexgymDatabase();


    const gymId =
      String(
        record.gymId
      );


    const subscriptionId =
      String(
        record.id
      );


    const existing =
      await db.memberSubscriptions.get([
        gymId,
        subscriptionId
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      prepareSubscriptionRecord(
        record,
        queueSync
          ? 'pending'
          : 'synced'
      );


    // ==================================================
    // INDEXEDDB
    // ==================================================

    await db.memberSubscriptions.put(
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
          'subscription_history',

        entityId:
          subscriptionId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'subscriptionRepository',

          memberId:
            prepared.memberId,

          paymentId:
            prepared.paymentId ||
            null

        }

      });

    }


    dispatchSubscriptionsUpdate();


    console.log(
      '📅 Suscripción guardada offline:',
      {

        gymId,

        subscriptionId,

        memberId:
          prepared.memberId,

        type:
          prepared.type,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// OBTENER HISTORIAL DEL GYM
// ======================================================

export const getOfflineSubscriptions =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.memberSubscriptions
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
// HISTORIAL DE UN MIEMBRO
// ======================================================

export const getOfflineSubscriptionsByMember =
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


    return db.memberSubscriptions
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
// BUSCAR POR ID
// ======================================================

export const getOfflineSubscriptionById =
  async (
    gymId,
    subscriptionId
  ) => {

    if (
      !gymId ||
      !subscriptionId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.memberSubscriptions.get([
        String(
          gymId
        ),

        String(
          subscriptionId
        )
      ])
    ) || null;

  };


// ======================================================
// ACTUALIZAR
// ======================================================

export const updateOfflineSubscription =
  async (
    gymId,
    subscriptionId,
    changes
  ) => {

    const current =
      await getOfflineSubscriptionById(
        gymId,
        subscriptionId
      );


    if (!current) {

      throw new Error(
        'No se encontró la suscripción en IndexedDB.'
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


    return saveOfflineSubscription(
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

export const deleteOfflineSubscription =
  async (
    gymId,
    subscriptionId,
    options = {}
  ) => {

    const {

      queueSync =
        true

    } = options;


    if (
      !gymId ||
      !subscriptionId
    ) {

      throw new Error(
        'gymId y subscriptionId son obligatorios.'
      );

    }


    await openNexgymDatabase();


    const cleanGymId =
      String(
        gymId
      );


    const cleanSubscriptionId =
      String(
        subscriptionId
      );


    const existing =
      await getOfflineSubscriptionById(
        cleanGymId,
        cleanSubscriptionId
      );


    if (!existing) {

      return {

        success:
          true,

        alreadyDeleted:
          true

      };

    }


    await db.memberSubscriptions.delete([
      cleanGymId,
      cleanSubscriptionId
    ]);


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId:
          cleanGymId,

        entity:
          'subscription_history',

        entityId:
          cleanSubscriptionId,

        operation:
          SYNC_OPERATIONS.DELETE,

        payload: {

          id:
            cleanSubscriptionId,

          gymId:
            cleanGymId,

          memberId:
            existing.memberId

        },

        metadata: {

          source:
            'subscriptionRepository',

          paymentId:
            existing.paymentId ||
            null

        }

      });

    }


    dispatchSubscriptionsUpdate();


    return {

      success:
        true,

      subscription:
        existing

    };

  };


// ======================================================
// GUARDAR DESDE SERVIDOR
// ======================================================

export const saveSubscriptionFromServer =
  async (
    record
  ) => {

    validateSubscriptionRecord(
      record
    );


    await openNexgymDatabase();


    const prepared =
      prepareSubscriptionRecord(
        record,
        'synced'
      );


    await db.memberSubscriptions.put(
      prepared
    );


    dispatchSubscriptionsUpdate();


    return prepared;

  };


// ======================================================
// GUARDAR MUCHAS
// ======================================================

export const saveSubscriptionsFromServer =
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
            prepareSubscriptionRecord(
              record,
              'synced'
            )
        );


    if (
      prepared.length >
      0
    ) {

      await db.memberSubscriptions.bulkPut(
        prepared
      );

    }


    dispatchSubscriptionsUpdate();


    return prepared;

  };


// ======================================================
// CONTAR
// ======================================================

export const countOfflineSubscriptions =
  async (
    gymId
  ) => {

    if (!gymId) {

      return 0;

    }


    await openNexgymDatabase();


    return db.memberSubscriptions
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

const subscriptionRepository = {

  save:
    saveOfflineSubscription,

  getAll:
    getOfflineSubscriptions,

  getByMember:
    getOfflineSubscriptionsByMember,

  getById:
    getOfflineSubscriptionById,

  update:
    updateOfflineSubscription,

  delete:
    deleteOfflineSubscription,

  saveFromServer:
    saveSubscriptionFromServer,

  saveManyFromServer:
    saveSubscriptionsFromServer,

  count:
    countOfflineSubscriptions

};


export default subscriptionRepository;