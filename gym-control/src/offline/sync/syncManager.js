// src/offline/sync/syncManager.js

import {
  getPendingSyncItems,
  getFailedSyncItems,
  markSyncItemProcessing,
  markSyncItemSynced,
  markSyncItemFailed,
  recoverProcessingSyncItems,
  getSyncQueueCounts,
  clearSyncedQueueItems
} from './syncQueue.js';

import {
  isOnline,
  subscribeToNetworkStatus
} from '../network/networkService.js';


// ======================================================
// EVENTOS
// ======================================================

export const SYNC_MANAGER_EVENT =
  'nexgym-sync-manager-update';


// ======================================================
// ESTADO INTERNO
// ======================================================

let initialized =
  false;


let syncing =
  false;


let unsubscribeNetwork =
  null;


// ======================================================
// HANDLERS DE SINCRONIZACIÓN
// ======================================================
//
// Cada entidad tendrá posteriormente un handler.
//
// Ejemplo:
//
// member
// payment
// subscription_history
//
// Cuando conectemos Supabase registraremos:
//
// registerSyncHandler(
//   'member',
//   async item => {
//      ...
//   }
// );
//
// ======================================================

const syncHandlers =
  new Map();


// ======================================================
// ESTADO DEL MANAGER
// ======================================================

let syncManagerState = {

  initialized:
    false,

  syncing:
    false,

  lastSyncStartedAt:
    null,

  lastSyncCompletedAt:
    null,

  lastSyncError:
    null,

  processed:
    0,

  succeeded:
    0,

  failed:
    0,

  skipped:
    0

};


// ======================================================
// OBTENER ESTADO
// ======================================================

export const getSyncManagerState =
  () => {

    return {
      ...syncManagerState
    };

  };


// ======================================================
// NOTIFICAR
// ======================================================

const dispatchSyncManagerUpdate =
  async () => {

    let counts = {

      pending:
        0,

      processing:
        0,

      synced:
        0,

      failed:
        0,

      total:
        0

    };


    try {

      counts =
        await getSyncQueueCounts();

    } catch (error) {

      console.warn(
        'No se pudieron obtener conteos de syncQueue:',
        error
      );

    }


    window.dispatchEvent(
      new CustomEvent(
        SYNC_MANAGER_EVENT,
        {
          detail: {

            manager:
              getSyncManagerState(),

            queue:
              counts

          }
        }
      )
    );

  };


// ======================================================
// REGISTRAR HANDLER
// ======================================================

export const registerSyncHandler =
  (
    entity,
    handler
  ) => {

    const cleanEntity =
      String(
        entity ||
        ''
      ).trim();


    if (!cleanEntity) {

      throw new Error(
        'Debes indicar la entidad del handler.'
      );

    }


    if (
      typeof handler !==
      'function'
    ) {

      throw new Error(
        `El handler de ${cleanEntity} debe ser una función.`
      );

    }


    syncHandlers.set(
      cleanEntity,
      handler
    );


    console.log(
      `🔌 Sync handler registrado: ${cleanEntity}`
    );


    return true;

  };


// ======================================================
// ELIMINAR HANDLER
// ======================================================

export const unregisterSyncHandler =
  (
    entity
  ) => {

    return syncHandlers.delete(
      String(
        entity ||
        ''
      ).trim()
    );

  };


// ======================================================
// VER SI EXISTE HANDLER
// ======================================================

export const hasSyncHandler =
  (
    entity
  ) => {

    return syncHandlers.has(
      String(
        entity ||
        ''
      ).trim()
    );

  };


// ======================================================
// OBTENER ENTIDADES REGISTRADAS
// ======================================================

export const getRegisteredSyncEntities =
  () => {

    return Array.from(
      syncHandlers.keys()
    );

  };


// ======================================================
// PROCESAR UNA OPERACIÓN
// ======================================================

const processSyncItem =
  async (
    item
  ) => {

    if (
      !item?.id
    ) {

      return {

        success:
          false,

        skipped:
          true,

        reason:
          'invalid_item'

      };

    }


    // ==================================================
    // SIN INTERNET
    // ==================================================

    if (
      !isOnline()
    ) {

      return {

        success:
          false,

        skipped:
          true,

        reason:
          'offline'

      };

    }


    // ==================================================
    // BUSCAR HANDLER
    // ==================================================

    const handler =
      syncHandlers.get(
        item.entity
      );


    /*
     * IMPORTANTE:
     *
     * Si todavía no existe integración con Supabase,
     * NO debemos marcar la operación como sincronizada.
     *
     * Se queda pending.
     */

    if (
      !handler
    ) {

      console.log(
        `⏳ Sin handler remoto para "${item.entity}". Se mantiene pendiente.`,
        {
          entityId:
            item.entityId,

          operation:
            item.operation
        }
      );


      return {

        success:
          false,

        skipped:
          true,

        reason:
          'handler_not_registered'

      };

    }


    // ==================================================
    // MARCAR PROCESSING
    // ==================================================

    const processingItem =
      await markSyncItemProcessing(
        item.id
      );


    if (
      !processingItem
    ) {

      return {

        success:
          false,

        skipped:
          true,

        reason:
          'item_not_found'

      };

    }


    try {

      // ==================================================
      // EJECUTAR HANDLER REAL
      // ==================================================

      const result =
        await handler(
          processingItem
        );


      // ==================================================
      // VALIDAR RESPUESTA
      // ==================================================
      //
      // El handler debe devolver:
      //
      // {
      //   success: true
      // }
      //
      // No basta con que la Promise termine.
      //
      // ==================================================

      if (
        !result ||
        result.success !==
        true
      ) {

        const message =
          result?.message ||
          'El servidor no confirmó la sincronización.';


        throw new Error(
          message
        );

      }


      // ==================================================
      // MARCAR SYNCED
      // ==================================================

      await markSyncItemSynced(
        processingItem.id
      );


      return {

        success:
          true,

        skipped:
          false,

        result

      };

    } catch (error) {

      // ==================================================
      // ERROR
      // ==================================================

      await markSyncItemFailed(
        processingItem.id,
        error
      );


      return {

        success:
          false,

        skipped:
          false,

        error

      };

    }

  };


// ======================================================
// SINCRONIZAR PENDIENTES
// ======================================================

export const synchronizePendingItems =
  async (
    options = {}
  ) => {

    const {

      gymId =
        null,

      clearSynced =
        false

    } = options;


    // ==================================================
    // EVITAR DOS SINCRONIZACIONES SIMULTÁNEAS
    // ==================================================

    if (
      syncing
    ) {

      console.log(
        '⏳ Ya existe una sincronización en proceso.'
      );


      return {

        success:
          false,

        reason:
          'already_syncing'

      };

    }


    // ==================================================
    // SIN INTERNET
    // ==================================================

    if (
      !isOnline()
    ) {

      console.log(
        '📴 Sincronización omitida: no hay conexión.'
      );


      return {

        success:
          false,

        reason:
          'offline'

      };

    }


    syncing =
      true;


    const startedAt =
      new Date()
        .toISOString();


    syncManagerState = {

      ...syncManagerState,

      syncing:
        true,

      lastSyncStartedAt:
        startedAt,

      lastSyncError:
        null,

      processed:
        0,

      succeeded:
        0,

      failed:
        0,

      skipped:
        0

    };


    await dispatchSyncManagerUpdate();


    try {

      // ==================================================
      // RECUPERAR PROCESSING VIEJOS
      // ==================================================

      await recoverProcessingSyncItems();


      // ==================================================
      // LEER PENDIENTES
      // ==================================================

      const pendingItems =
        await getPendingSyncItems(
          gymId
        );


      if (
        pendingItems.length ===
        0
      ) {

        console.log(
          '✅ No hay operaciones pendientes de sincronización.'
        );


        syncManagerState = {

          ...syncManagerState,

          syncing:
            false,

          lastSyncCompletedAt:
            new Date()
              .toISOString()

        };


        syncing =
          false;


        await dispatchSyncManagerUpdate();


        return {

          success:
            true,

          pending:
            0,

          processed:
            0,

          succeeded:
            0,

          failed:
            0,

          skipped:
            0

        };

      }


      console.log(
        `🔄 Procesando ${pendingItems.length} operación(es) pendiente(s)...`
      );


      // ==================================================
      // PROCESAR EN ORDEN
      // ==================================================
      //
      // Usamos for...of intencionalmente.
      //
      // Así respetamos el orden:
      //
      // miembro
      // pago
      // suscripción
      //
      // y evitamos carreras innecesarias.
      //
      // ==================================================

      for (
        const item of
        pendingItems
      ) {

        // =================================================
        // INTERNET SE PERDIÓ A MEDIA SINCRONIZACIÓN
        // =================================================

        if (
          !isOnline()
        ) {

          console.warn(
            '📴 Se perdió internet durante la sincronización.'
          );


          break;

        }


        const result =
          await processSyncItem(
            item
          );


        syncManagerState = {

          ...syncManagerState,

          processed:
            syncManagerState.processed +
            1

        };


        if (
          result.success
        ) {

          syncManagerState = {

            ...syncManagerState,

            succeeded:
              syncManagerState.succeeded +
              1

          };

        } else if (
          result.skipped
        ) {

          syncManagerState = {

            ...syncManagerState,

            skipped:
              syncManagerState.skipped +
              1

          };

        } else {

          syncManagerState = {

            ...syncManagerState,

            failed:
              syncManagerState.failed +
              1

          };

        }


        await dispatchSyncManagerUpdate();

      }


      // ==================================================
      // LIMPIAR SYNCED OPCIONALMENTE
      // ==================================================

      if (
        clearSynced
      ) {

        await clearSyncedQueueItems();

      }


      syncManagerState = {

        ...syncManagerState,

        syncing:
          false,

        lastSyncCompletedAt:
          new Date()
            .toISOString()

      };


      syncing =
        false;


      await dispatchSyncManagerUpdate();


      console.log(
        '✅ Ciclo de sincronización terminado:',
        {
          processed:
            syncManagerState.processed,

          succeeded:
            syncManagerState.succeeded,

          failed:
            syncManagerState.failed,

          skipped:
            syncManagerState.skipped
        }
      );


      return {

        success:
          true,

        ...getSyncManagerState()

      };

    } catch (error) {

      console.error(
        '❌ Error general del syncManager:',
        error
      );


      syncManagerState = {

        ...syncManagerState,

        syncing:
          false,

        lastSyncError:
          error instanceof Error
            ? error.message
            : String(
                error
              ),

        lastSyncCompletedAt:
          new Date()
            .toISOString()

      };


      syncing =
        false;


      await dispatchSyncManagerUpdate();


      return {

        success:
          false,

        error

      };

    }

  };


// ======================================================
// REINTENTAR OPERACIONES FALLIDAS
// ======================================================

export const synchronizeFailedItems =
  async (
    gymId =
      null
  ) => {

    if (
      !isOnline()
    ) {

      return {

        success:
          false,

        reason:
          'offline'

      };

    }


    const failed =
      await getFailedSyncItems(
        gymId
      );


    if (
      failed.length ===
      0
    ) {

      return {

        success:
          true,

        processed:
          0

      };

    }


    /*
     * Las funciones de syncQueue permiten resetear failed,
     * pero aquí no las ejecutamos automáticamente todavía.
     *
     * Cuando conectemos Supabase añadiremos el reintento
     * controlado.
     */

    return {

      success:
        true,

      processed:
        0,

      failedItems:
        failed

    };

  };


// ======================================================
// CUANDO REGRESA INTERNET
// ======================================================

const handleNetworkStatusChange =
  async (
    status
  ) => {

    if (
      status?.online !==
      true
    ) {

      console.log(
        '📴 syncManager en espera.'
      );


      return;

    }


    console.log(
      '🌐 Internet recuperado. Revisando operaciones pendientes...'
    );


    /*
     * Si todavía no hay handlers remotos,
     * synchronizePendingItems simplemente dejará
     * los registros pending.
     *
     * No se perderá nada.
     */

    await synchronizePendingItems();

  };


// ======================================================
// INICIALIZAR
// ======================================================

export const initializeSyncManager =
  async () => {

    if (
      initialized
    ) {

      return getSyncManagerState();

    }


    initialized =
      true;


    // ==================================================
    // RECUPERAR OPERACIONES INTERRUMPIDAS
    // ==================================================

    try {

      const recovered =
        await recoverProcessingSyncItems();


      if (
        recovered >
        0
      ) {

        console.log(
          `🔄 ${recovered} operación(es) recuperada(s) al iniciar.`
        );

      }

    } catch (error) {

      console.error(
        'Error recuperando operaciones pendientes:',
        error
      );

    }


    // ==================================================
    // ESCUCHAR INTERNET
    // ==================================================

    unsubscribeNetwork =
      subscribeToNetworkStatus(
        handleNetworkStatusChange
      );


    syncManagerState = {

      ...syncManagerState,

      initialized:
        true

    };


    console.log(
      '🔄 syncManager inicializado.'
    );


    await dispatchSyncManagerUpdate();


    /*
     * Si abrimos el sistema con internet, revisamos
     * inmediatamente la cola.
     */

    if (
      isOnline()
    ) {

      await synchronizePendingItems();

    }


    return getSyncManagerState();

  };


// ======================================================
// DETENER
// ======================================================

export const destroySyncManager =
  () => {

    if (
      typeof unsubscribeNetwork ===
      'function'
    ) {

      unsubscribeNetwork();

    }


    unsubscribeNetwork =
      null;


    initialized =
      false;


    syncing =
      false;


    syncManagerState = {

      ...syncManagerState,

      initialized:
        false,

      syncing:
        false

    };


    console.log(
      '🔒 syncManager detenido.'
    );

  };


// ======================================================
// SUSCRIBIR COMPONENTES REACT
// ======================================================

export const subscribeToSyncManager =
  (
    callback
  ) => {

    if (
      typeof callback !==
      'function'
    ) {

      throw new Error(
        'subscribeToSyncManager necesita una función.'
      );

    }


    const handler =
      event => {

        callback(
          event.detail
        );

      };


    window.addEventListener(
      SYNC_MANAGER_EVENT,
      handler
    );


    return () => {

      window.removeEventListener(
        SYNC_MANAGER_EVENT,
        handler
      );

    };

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

const syncManager = {

  initialize:
    initializeSyncManager,

  destroy:
    destroySyncManager,

  synchronize:
    synchronizePendingItems,

  synchronizeFailed:
    synchronizeFailedItems,

  registerHandler:
    registerSyncHandler,

  unregisterHandler:
    unregisterSyncHandler,

  hasHandler:
    hasSyncHandler,

  getHandlers:
    getRegisteredSyncEntities,

  getState:
    getSyncManagerState,

  subscribe:
    subscribeToSyncManager

};


export default syncManager;