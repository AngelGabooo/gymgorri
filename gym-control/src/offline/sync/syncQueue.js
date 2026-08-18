// src/offline/sync/syncQueue.js

import db, {
  openNexgymDatabase
} from '../db/nexgymDatabase';


// ======================================================
// ESTADOS
// ======================================================

export const SYNC_STATUS = {

  PENDING:
    'pending',

  PROCESSING:
    'processing',

  SYNCED:
    'synced',

  FAILED:
    'failed'

};


// ======================================================
// OPERACIONES
// ======================================================

export const SYNC_OPERATIONS = {

  CREATE:
    'create',

  UPDATE:
    'update',

  DELETE:
    'delete'

};


// ======================================================
// CREAR ID
// ======================================================

const createSyncId =
  () => {

    if (
      window.crypto?.randomUUID
    ) {

      return `sync_${window.crypto.randomUUID()}`;

    }


    return (
      `sync_${Date.now()}_` +
      Math.random()
        .toString(36)
        .substring(
          2,
          10
        )
    );

  };


// ======================================================
// NORMALIZAR TEXTO
// ======================================================

const normalizeText =
  (
    value
  ) => {

    return String(
      value || ''
    ).trim();

  };


// ======================================================
// AGREGAR OPERACIÓN A COLA
// ======================================================

export const addToSyncQueue =
  async ({
    gymId,
    entity,
    entityId,
    operation,
    payload = null,
    metadata = null
  }) => {

    await openNexgymDatabase();


    const cleanGymId =
      normalizeText(
        gymId
      );


    const cleanEntity =
      normalizeText(
        entity
      );


    const cleanEntityId =
      normalizeText(
        entityId
      );


    const cleanOperation =
      normalizeText(
        operation
      );


    if (!cleanGymId) {

      throw new Error(
        'syncQueue necesita gymId.'
      );

    }


    if (!cleanEntity) {

      throw new Error(
        'syncQueue necesita entity.'
      );

    }


    if (!cleanEntityId) {

      throw new Error(
        'syncQueue necesita entityId.'
      );

    }


    if (
      !Object.values(
        SYNC_OPERATIONS
      ).includes(
        cleanOperation
      )
    ) {

      throw new Error(
        `Operación de sincronización inválida: ${cleanOperation}`
      );

    }


    const now =
      new Date()
        .toISOString();


    // ==================================================
    // EVITAR DUPLICADOS INNECESARIOS
    // ==================================================
    //
    // Si hay una operación pendiente para la misma
    // entidad, podemos reutilizarla en ciertos casos.
    //
    // Ejemplo:
    //
    // UPDATE miembro
    // UPDATE miembro
    // UPDATE miembro
    //
    // No necesitamos tres peticiones.
    //
    // Nos quedamos con la última información.
    //
    // ==================================================

    const existingPending =
      await db.syncQueue
        .where(
          '[gymId+status]'
        )
        .equals([
          cleanGymId,
          SYNC_STATUS.PENDING
        ])
        .filter(
          item =>
            item.entity ===
              cleanEntity &&
            item.entityId ===
              cleanEntityId
        )
        .toArray();


    // ==================================================
    // SI YA EXISTE CREATE PENDIENTE
    // ==================================================

    const pendingCreate =
      existingPending.find(
        item =>
          item.operation ===
          SYNC_OPERATIONS.CREATE
      );


    /*
     * Si el registro todavía ni siquiera ha llegado
     * al servidor y luego lo actualizamos:
     *
     * CREATE + UPDATE
     *
     * se convierte simplemente en:
     *
     * CREATE con el payload más reciente.
     */

    if (
      pendingCreate &&
      cleanOperation ===
      SYNC_OPERATIONS.UPDATE
    ) {

      const updated = {

        ...pendingCreate,

        payload,

        metadata,

        updatedAt:
          now,

        lastError:
          null

      };


      await db.syncQueue.put(
        updated
      );


      dispatchQueueUpdate();


      return updated;

    }


    // ==================================================
    // SI HAY UPDATE PENDIENTE
    // ==================================================

    const pendingUpdate =
      existingPending.find(
        item =>
          item.operation ===
          SYNC_OPERATIONS.UPDATE
      );


    /*
     * Varias actualizaciones del mismo registro:
     *
     * UPDATE
     * UPDATE
     * UPDATE
     *
     * => conservar solo la última.
     */

    if (
      pendingUpdate &&
      cleanOperation ===
      SYNC_OPERATIONS.UPDATE
    ) {

      const updated = {

        ...pendingUpdate,

        payload,

        metadata,

        updatedAt:
          now,

        lastError:
          null

      };


      await db.syncQueue.put(
        updated
      );


      dispatchQueueUpdate();


      return updated;

    }


    // ==================================================
    // CREATE + DELETE SIN HABER SINCRONIZADO
    // ==================================================
    //
    // Si un registro se creó offline y luego el usuario
    // lo eliminó antes de recuperar internet:
    //
    // servidor nunca conoció ese registro.
    //
    // Podemos cancelar ambas operaciones.
    //
    // ==================================================

    if (
      pendingCreate &&
      cleanOperation ===
      SYNC_OPERATIONS.DELETE
    ) {

      await db.syncQueue.delete(
        pendingCreate.id
      );


      /*
       * También quitamos cualquier UPDATE pendiente
       * relacionado.
       */

      for (
        const item of
        existingPending
      ) {

        if (
          item.id !==
            pendingCreate.id
        ) {

          await db.syncQueue.delete(
            item.id
          );

        }

      }


      dispatchQueueUpdate();


      return {

        cancelled:
          true,

        reason:
          'create_deleted_before_sync',

        entity:
          cleanEntity,

        entityId:
          cleanEntityId

      };

    }


    // ==================================================
    // CREAR NUEVO REGISTRO DE COLA
    // ==================================================

    const queueItem = {

      id:
        createSyncId(),

      gymId:
        cleanGymId,

      entity:
        cleanEntity,

      entityId:
        cleanEntityId,

      operation:
        cleanOperation,

      payload,

      metadata,

      status:
        SYNC_STATUS.PENDING,

      attempts:
        0,

      maxAttempts:
        5,

      lastError:
        null,

      createdAt:
        now,

      updatedAt:
        now,

      processedAt:
        null,

      syncedAt:
        null

    };


    await db.syncQueue.add(
      queueItem
    );


    console.log(
      '📥 Operación agregada a syncQueue:',
      {
        entity:
          queueItem.entity,

        operation:
          queueItem.operation,

        entityId:
          queueItem.entityId
      }
    );


    dispatchQueueUpdate();


    return queueItem;

  };


// ======================================================
// OBTENER TODA LA COLA
// ======================================================

export const getSyncQueue =
  async () => {

    await openNexgymDatabase();


    return db.syncQueue
      .orderBy(
        'createdAt'
      )
      .toArray();

  };


// ======================================================
// OBTENER PENDIENTES
// ======================================================

export const getPendingSyncItems =
  async (
    gymId = null
  ) => {

    await openNexgymDatabase();


    if (
      gymId
    ) {

      return db.syncQueue
        .where(
          '[gymId+status]'
        )
        .equals([
          String(
            gymId
          ),
          SYNC_STATUS.PENDING
        ])
        .sortBy(
          'createdAt'
        );

    }


    return db.syncQueue
      .where(
        'status'
      )
      .equals(
        SYNC_STATUS.PENDING
      )
      .sortBy(
        'createdAt'
      );

  };


// ======================================================
// OBTENER FALLIDOS
// ======================================================

export const getFailedSyncItems =
  async (
    gymId = null
  ) => {

    await openNexgymDatabase();


    let items =
      await db.syncQueue
        .where(
          'status'
        )
        .equals(
          SYNC_STATUS.FAILED
        )
        .toArray();


    if (
      gymId
    ) {

      items =
        items.filter(
          item =>
            item.gymId ===
            gymId
        );

    }


    return items.sort(
      (
        a,
        b
      ) =>
        new Date(
          a.createdAt
        ) -
        new Date(
          b.createdAt
        )
    );

  };


// ======================================================
// OBTENER POR ID
// ======================================================

export const getSyncQueueItemById =
  async (
    id
  ) => {

    await openNexgymDatabase();


    return (
      await db.syncQueue.get(
        id
      )
    ) || null;

  };


// ======================================================
// MARCAR COMO PROCESSING
// ======================================================

export const markSyncItemProcessing =
  async (
    id
  ) => {

    await openNexgymDatabase();


    const item =
      await db.syncQueue.get(
        id
      );


    if (!item) {

      return null;

    }


    const updated = {

      ...item,

      status:
        SYNC_STATUS.PROCESSING,

      attempts:
        Number(
          item.attempts ||
          0
        ) + 1,

      updatedAt:
        new Date()
          .toISOString(),

      processedAt:
        new Date()
          .toISOString()

    };


    await db.syncQueue.put(
      updated
    );


    dispatchQueueUpdate();


    return updated;

  };


// ======================================================
// MARCAR SINCRONIZADO
// ======================================================

export const markSyncItemSynced =
  async (
    id
  ) => {

    await openNexgymDatabase();


    const item =
      await db.syncQueue.get(
        id
      );


    if (!item) {

      return null;

    }


    const now =
      new Date()
        .toISOString();


    const updated = {

      ...item,

      status:
        SYNC_STATUS.SYNCED,

      lastError:
        null,

      updatedAt:
        now,

      syncedAt:
        now

    };


    await db.syncQueue.put(
      updated
    );


    console.log(
      '✅ Operación sincronizada:',
      {
        entity:
          updated.entity,

        entityId:
          updated.entityId,

        operation:
          updated.operation
      }
    );


    dispatchQueueUpdate();


    return updated;

  };


// ======================================================
// MARCAR ERROR
// ======================================================

export const markSyncItemFailed =
  async (
    id,
    error
  ) => {

    await openNexgymDatabase();


    const item =
      await db.syncQueue.get(
        id
      );


    if (!item) {

      return null;

    }


    const attempts =
      Number(
        item.attempts ||
        0
      );


    const maxAttempts =
      Number(
        item.maxAttempts ||
        5
      );


    const finalStatus =
      attempts >=
      maxAttempts
        ? SYNC_STATUS.FAILED
        : SYNC_STATUS.PENDING;


    const updated = {

      ...item,

      status:
        finalStatus,

      lastError:
        error instanceof Error
          ? error.message
          : String(
              error ||
              'Error desconocido'
            ),

      updatedAt:
        new Date()
          .toISOString()

    };


    await db.syncQueue.put(
      updated
    );


    console.error(
      '❌ Error sincronizando operación:',
      {
        entity:
          updated.entity,

        entityId:
          updated.entityId,

        attempt:
          attempts,

        maxAttempts,

        status:
          finalStatus,

        error:
          updated.lastError
      }
    );


    dispatchQueueUpdate();


    return updated;

  };


// ======================================================
// REINTENTAR FALLIDO
// ======================================================

export const retrySyncItem =
  async (
    id
  ) => {

    await openNexgymDatabase();


    const item =
      await db.syncQueue.get(
        id
      );


    if (!item) {

      return null;

    }


    const updated = {

      ...item,

      status:
        SYNC_STATUS.PENDING,

      attempts:
        0,

      lastError:
        null,

      updatedAt:
        new Date()
          .toISOString(),

      processedAt:
        null,

      syncedAt:
        null

    };


    await db.syncQueue.put(
      updated
    );


    dispatchQueueUpdate();


    return updated;

  };


// ======================================================
// REINTENTAR TODOS LOS FALLIDOS
// ======================================================

export const retryAllFailedSyncItems =
  async (
    gymId = null
  ) => {

    const failed =
      await getFailedSyncItems(
        gymId
      );


    for (
      const item of
      failed
    ) {

      await retrySyncItem(
        item.id
      );

    }


    dispatchQueueUpdate();


    return failed.length;

  };


// ======================================================
// ELIMINAR ITEM
// ======================================================

export const removeSyncQueueItem =
  async (
    id
  ) => {

    await openNexgymDatabase();


    await db.syncQueue.delete(
      id
    );


    dispatchQueueUpdate();


    return true;

  };


// ======================================================
// LIMPIAR SINCRONIZADOS
// ======================================================

export const clearSyncedQueueItems =
  async () => {

    await openNexgymDatabase();


    const synced =
      await db.syncQueue
        .where(
          'status'
        )
        .equals(
          SYNC_STATUS.SYNCED
        )
        .primaryKeys();


    if (
      synced.length >
      0
    ) {

      await db.syncQueue.bulkDelete(
        synced
      );

    }


    dispatchQueueUpdate();


    return synced.length;

  };


// ======================================================
// LIMPIAR TODA LA COLA
// ======================================================
//
// SOLO PARA DESARROLLO / PRUEBAS.
//
// No usar automáticamente.
//
// ======================================================

export const clearEntireSyncQueue =
  async () => {

    await openNexgymDatabase();


    await db.syncQueue.clear();


    dispatchQueueUpdate();


    return true;

  };


// ======================================================
// CONTAR POR ESTADO
// ======================================================

export const getSyncQueueCounts =
  async () => {

    await openNexgymDatabase();


    const [
      pending,
      processing,
      synced,
      failed
    ] =
      await Promise.all([

        db.syncQueue
          .where(
            'status'
          )
          .equals(
            SYNC_STATUS.PENDING
          )
          .count(),

        db.syncQueue
          .where(
            'status'
          )
          .equals(
            SYNC_STATUS.PROCESSING
          )
          .count(),

        db.syncQueue
          .where(
            'status'
          )
          .equals(
            SYNC_STATUS.SYNCED
          )
          .count(),

        db.syncQueue
          .where(
            'status'
          )
          .equals(
            SYNC_STATUS.FAILED
          )
          .count()

      ]);


    return {

      pending,

      processing,

      synced,

      failed,

      total:
        pending +
        processing +
        synced +
        failed

    };

  };


// ======================================================
// DEVOLVER PROCESSING A PENDING
// ======================================================
//
// Si el navegador se cerró mientras una operación estaba
// en "processing", al iniciar otra vez no debe quedar
// bloqueada para siempre.
//
// ======================================================

export const recoverProcessingSyncItems =
  async () => {

    await openNexgymDatabase();


    const processing =
      await db.syncQueue
        .where(
          'status'
        )
        .equals(
          SYNC_STATUS.PROCESSING
        )
        .toArray();


    if (
      processing.length ===
      0
    ) {

      return 0;

    }


    const now =
      new Date()
        .toISOString();


    const recovered =
      processing.map(
        item => ({

          ...item,

          status:
            SYNC_STATUS.PENDING,

          updatedAt:
            now,

          processedAt:
            null

        })
      );


    await db.syncQueue.bulkPut(
      recovered
    );


    console.log(
      `🔄 ${recovered.length} operación(es) de sincronización recuperada(s).`
    );


    dispatchQueueUpdate();


    return recovered.length;

  };


// ======================================================
// EVENTO DE CAMBIO
// ======================================================

export const SYNC_QUEUE_UPDATE_EVENT =
  'nexgym-sync-queue-update';


const dispatchQueueUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        SYNC_QUEUE_UPDATE_EVENT
      )
    );

  };


// ======================================================
// SUSCRIBIRSE
// ======================================================

export const subscribeToSyncQueue =
  (
    callback
  ) => {

    if (
      typeof callback !==
      'function'
    ) {

      throw new Error(
        'subscribeToSyncQueue necesita una función.'
      );

    }


    const handler =
      async () => {

        const counts =
          await getSyncQueueCounts();


        callback(
          counts
        );

      };


    window.addEventListener(
      SYNC_QUEUE_UPDATE_EVENT,
      handler
    );


    return () => {

      window.removeEventListener(
        SYNC_QUEUE_UPDATE_EVENT,
        handler
      );

    };

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

const syncQueue = {

  add:
    addToSyncQueue,

  getAll:
    getSyncQueue,

  getPending:
    getPendingSyncItems,

  getFailed:
    getFailedSyncItems,

  getById:
    getSyncQueueItemById,

  markProcessing:
    markSyncItemProcessing,

  markSynced:
    markSyncItemSynced,

  markFailed:
    markSyncItemFailed,

  retry:
    retrySyncItem,

  retryAll:
    retryAllFailedSyncItems,

  remove:
    removeSyncQueueItem,

  clearSynced:
    clearSyncedQueueItems,

  counts:
    getSyncQueueCounts,

  recover:
    recoverProcessingSyncItems,

  subscribe:
    subscribeToSyncQueue

};


export default syncQueue;