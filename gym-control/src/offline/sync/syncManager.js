// src/offline/sync/syncManager.js

import {
  getPendingSyncItems,
  getFailedSyncItems,
  markSyncItemProcessing,
  markSyncItemSynced,
  markSyncItemFailed,
  recoverProcessingSyncItems,
  getSyncQueueCounts,
  clearSyncedQueueItems,
  SYNC_QUEUE_UPDATE_EVENT
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
// SESIÓN LOCAL
// ======================================================
//
// Evitamos importar authService para no crear ciclos.
// La sesión ya contiene gymId cuando el login cloud
// fue exitoso.
//
// ======================================================

const SESSION_KEY =
  'gym_control_session';

const AUTH_KEY =
  'isAuthenticated';


const getSessionSnapshot =
  () => {

    try {

      if (
        localStorage.getItem(
          AUTH_KEY
        ) !==
        'true'
      ) {

        return null;

      }


      const raw =
        localStorage.getItem(
          SESSION_KEY
        );


      if (!raw) {

        return null;

      }


      const parsed =
        JSON.parse(
          raw
        );


      return (
        parsed &&
        typeof parsed ===
          'object'
      )
        ? parsed
        : null;

    } catch (
      error
    ) {

      console.warn(
        '⚠️ No se pudo leer la sesión para sincronización:',
        error
      );


      return null;

    }

  };


const getCurrentGymId =
  () => {

    const session =
      getSessionSnapshot();


    return session?.gymId
      ? String(
          session.gymId
        )
      : null;

  };


// ======================================================
// ESTADO INTERNO
// ======================================================

let initialized =
  false;

let syncing =
  false;

let unsubscribeNetwork =
  null;

let queueUpdateHandler =
  null;

let queueSyncTimer =
  null;


// ======================================================
// HANDLERS
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

  activeGymId:
    null,

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

    } catch (
      error
    ) {

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
// ENTIDADES REGISTRADAS
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
    item,
    activeGymId
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
    // AISLAMIENTO POR GIMNASIO
    // ==================================================

    if (
      !activeGymId ||
      String(
        item.gymId
      ) !==
      String(
        activeGymId
      )
    ) {

      console.warn(
        '🔒 Operación omitida porque no pertenece al gimnasio actual:',
        {
          itemGymId:
            item.gymId,

          activeGymId,

          entity:
            item.entity,

          entityId:
            item.entityId
        }
      );


      return {

        success:
          false,

        skipped:
          true,

        reason:
          'different_gym'

      };

    }


    const handler =
      syncHandlers.get(
        item.entity
      );


    if (!handler) {

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


    const processingItem =
      await markSyncItemProcessing(
        item.id
      );


    if (!processingItem) {

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

      const result =
        await handler(
          processingItem
        );


      if (
        !result ||
        result.success !==
          true
      ) {

        throw new Error(
          result?.message ||
          'El servidor no confirmó la sincronización.'
        );

      }


      await markSyncItemSynced(
        processingItem.id
      );


      console.log(
        `✅ ${processingItem.entity} sincronizado:`,
        {
          entityId:
            processingItem.entityId,

          operation:
            processingItem.operation
        }
      );


      return {

        success:
          true,

        skipped:
          false,

        result

      };

    } catch (
      error
    ) {

      await markSyncItemFailed(
        processingItem.id,
        error
      );


      console.error(
        `❌ Error sincronizando ${processingItem.entity}:`,
        {
          entityId:
            processingItem.entityId,

          operation:
            processingItem.operation,

          error
        }
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

    const requestedGymId =
      options?.gymId
        ? String(
            options.gymId
          )
        : null;


    const activeGymId =
      requestedGymId ||
      getCurrentGymId();


    const clearSynced =
      options?.clearSynced ===
      true;


    if (
      syncing
    ) {

      return {

        success:
          false,

        reason:
          'already_syncing'

      };

    }


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


    // ==================================================
    // NO SINCRONIZAR SIN GYM ACTUAL
    // ==================================================

    if (
      !activeGymId
    ) {

      console.log(
        '🔐 syncManager en espera: todavía no hay gimnasio autenticado.'
      );


      return {

        success:
          false,

        skipped:
          true,

        reason:
          'no_active_gym'

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

      activeGymId,

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

      await recoverProcessingSyncItems();


      const pendingItems =
        await getPendingSyncItems(
          activeGymId
        );


      if (
        pendingItems.length ===
        0
      ) {

        syncing =
          false;


        syncManagerState = {

          ...syncManagerState,

          syncing:
            false,

          activeGymId,

          lastSyncCompletedAt:
            new Date()
              .toISOString()

        };


        await dispatchSyncManagerUpdate();


        console.log(
          `✅ No hay operaciones pendientes para el gimnasio ${activeGymId}.`
        );


        return {

          success:
            true,

          gymId:
            activeGymId,

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
        `🔄 Procesando ${pendingItems.length} operación(es) pendiente(s) del gimnasio ${activeGymId}...`
      );


      for (
        const item of
        pendingItems
      ) {

        if (
          !isOnline()
        ) {

          console.warn(
            '📴 Se perdió internet durante la sincronización.'
          );


          break;

        }


        // Si el usuario cambió de gimnasio/sesión durante
        // el ciclo, detenemos inmediatamente.
        const currentGymId =
          getCurrentGymId();


        if (
          !currentGymId ||
          String(
            currentGymId
          ) !==
          String(
            activeGymId
          )
        ) {

          console.warn(
            '🔒 La sesión cambió durante la sincronización. Ciclo detenido.'
          );


          break;

        }


        const result =
          await processSyncItem(
            item,
            activeGymId
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


      if (
        clearSynced
      ) {

        // La función actual limpia todos los synced.
        // No la usamos automáticamente para preservar
        // historial local de la cola.
        await clearSyncedQueueItems();

      }


      syncing =
        false;


      syncManagerState = {

        ...syncManagerState,

        syncing:
          false,

        activeGymId,

        lastSyncCompletedAt:
          new Date()
            .toISOString()

      };


      await dispatchSyncManagerUpdate();


      console.log(
        '✅ Ciclo de sincronización terminado:',
        {
          gymId:
            activeGymId,

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

    } catch (
      error
    ) {

      console.error(
        '❌ Error general del syncManager:',
        error
      );


      syncing =
        false;


      syncManagerState = {

        ...syncManagerState,

        syncing:
          false,

        activeGymId,

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


      await dispatchSyncManagerUpdate();


      return {

        success:
          false,

        error

      };

    }

  };


// ======================================================
// FALLIDOS
// ======================================================
//
// Por seguridad seguimos sin convertir failed -> pending
// automáticamente. Así evitamos ciclos infinitos.
//
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


    const activeGymId =
      gymId ||
      getCurrentGymId();


    if (
      !activeGymId
    ) {

      return {

        success:
          false,

        reason:
          'no_active_gym'

      };

    }


    const failed =
      await getFailedSyncItems(
        activeGymId
      );


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
// PROGRAMAR SINCRONIZACIÓN DE COLA
// ======================================================
//
// syncQueue ya emite NEXGYM_SYNC_QUEUE_UPDATE.
// Escuchamos ese evento para que una operación nueva se
// intente subir sin tener que recargar la página.
//
// Debounce corto:
// múltiples operaciones creadas juntas (miembro + pago +
// suscripción) se procesan en un solo ciclo.
//
// ======================================================

const scheduleQueueSynchronization =
  () => {

    if (
      queueSyncTimer
    ) {

      window.clearTimeout(
        queueSyncTimer
      );

    }


    queueSyncTimer =
      window.setTimeout(
        async () => {

          queueSyncTimer =
            null;


          if (
            !isOnline()
          ) {

            return;

          }


          const gymId =
            getCurrentGymId();


          if (!gymId) {

            return;

          }


          await synchronizePendingItems({
            gymId
          });

        },
        350
      );

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


    const gymId =
      getCurrentGymId();


    if (!gymId) {

      console.log(
        '🌐 Internet recuperado, pero todavía no hay gimnasio autenticado.'
      );


      return;

    }


    console.log(
      '🌐 Internet recuperado. Revisando operaciones pendientes...',
      {
        gymId
      }
    );


    await synchronizePendingItems({
      gymId
    });

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

    } catch (
      error
    ) {

      console.error(
        'Error recuperando operaciones pendientes:',
        error
      );

    }


    unsubscribeNetwork =
      subscribeToNetworkStatus(
        handleNetworkStatusChange
      );


    queueUpdateHandler =
      () => {

        scheduleQueueSynchronization();

      };


    window.addEventListener(
      SYNC_QUEUE_UPDATE_EVENT,
      queueUpdateHandler
    );


    syncManagerState = {

      ...syncManagerState,

      initialized:
        true,

      activeGymId:
        getCurrentGymId()

    };


    console.log(
      '🔄 syncManager inicializado.',
      {
        gymId:
          getCurrentGymId(),

        handlers:
          getRegisteredSyncEntities()
      }
    );


    await dispatchSyncManagerUpdate();


    if (
      isOnline()
    ) {

      const gymId =
        getCurrentGymId();


      if (
        gymId
      ) {

        await synchronizePendingItems({
          gymId
        });

      } else {

        console.log(
          '🔐 syncManager listo; sincronización pendiente hasta iniciar sesión.'
        );

      }

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


    if (
      queueUpdateHandler
    ) {

      window.removeEventListener(
        SYNC_QUEUE_UPDATE_EVENT,
        queueUpdateHandler
      );

    }


    queueUpdateHandler =
      null;


    if (
      queueSyncTimer
    ) {

      window.clearTimeout(
        queueSyncTimer
      );

      queueSyncTimer =
        null;

    }


    initialized =
      false;

    syncing =
      false;


    syncManagerState = {

      ...syncManagerState,

      initialized:
        false,

      syncing:
        false,

      activeGymId:
        null

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
