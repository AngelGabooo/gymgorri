// src/offline/repositories/visitRepository.js

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

export const OFFLINE_VISITS_UPDATE_EVENT =
  'nexgym-offline-visits-update';


// ======================================================
// VALIDAR
// ======================================================

const validateVisit = (
  visit
) => {

  if (!visit) {

    throw new Error(
      'No se recibió la visita.'
    );

  }


  if (!visit.id) {

    throw new Error(
      'La visita no contiene ID.'
    );

  }


  if (!visit.gymId) {

    throw new Error(
      'La visita no contiene gymId.'
    );

  }


  return true;

};


// ======================================================
// EVENTO
// ======================================================

const dispatchUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_VISITS_UPDATE_EVENT
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-visits-update'
      )
    );

  };


// ======================================================
// PREPARAR
// ======================================================

const prepareVisit = (
  visit,
  syncStatus = 'pending'
) => {

  const now =
    new Date()
      .toISOString();


  return {

    ...visit,

    id:
      String(
        visit.id
      ),

    gymId:
      String(
        visit.gymId
      ),

    syncStatus,

    localUpdatedAt:
      now,

    updatedAt:
      visit.updatedAt ||
      now

  };

};


// ======================================================
// GUARDAR
// ======================================================

export const saveOfflineVisit =
  async (
    visit,
    options = {}
  ) => {

    const {

      queueSync =
        true,

      operation =
        SYNC_OPERATIONS.UPDATE

    } = options;


    validateVisit(
      visit
    );


    await openNexgymDatabase();


    const gymId =
      String(
        visit.gymId
      );


    const visitId =
      String(
        visit.id
      );


    const existing =
      await db.visits.get([
        gymId,
        visitId
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      prepareVisit(
        visit,
        queueSync
          ? 'pending'
          : 'synced'
      );


    await db.visits.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'visit',

        entityId:
          visitId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'visitRepository',

          local:
            true

        }

      });

    }


    dispatchUpdate();


    console.log(
      '👤 Visita guardada offline:',
      {

        gymId,

        visitId,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// OBTENER VISITAS
// ======================================================

export const getOfflineVisits =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.visits
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

export const getOfflineVisitById =
  async (
    gymId,
    visitId
  ) => {

    if (
      !gymId ||
      !visitId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.visits.get([
        String(
          gymId
        ),

        String(
          visitId
        )
      ])
    ) || null;

  };


// ======================================================
// ACTUALIZAR
// ======================================================

export const updateOfflineVisit =
  async (
    gymId,
    visitId,
    changes
  ) => {

    const current =
      await getOfflineVisitById(
        gymId,
        visitId
      );


    if (!current) {

      throw new Error(
        'No se encontró la visita en IndexedDB.'
      );

    }


    return saveOfflineVisit(
      {

        ...current,

        ...changes,

        gymId:
          current.gymId,

        id:
          current.id,

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
// ELIMINAR
// ======================================================

export const deleteOfflineVisit =
  async (
    gymId,
    visitId
  ) => {

    if (
      !gymId ||
      !visitId
    ) {

      throw new Error(
        'gymId y visitId son obligatorios.'
      );

    }


    await openNexgymDatabase();


    const cleanGymId =
      String(
        gymId
      );


    const cleanVisitId =
      String(
        visitId
      );


    const existing =
      await getOfflineVisitById(
        cleanGymId,
        cleanVisitId
      );


    if (!existing) {

      return {

        success:
          true,

        alreadyDeleted:
          true

      };

    }


    await db.visits.delete([
      cleanGymId,
      cleanVisitId
    ]);


    await addToSyncQueue({

      gymId:
        cleanGymId,

      entity:
        'visit',

      entityId:
        cleanVisitId,

      operation:
        SYNC_OPERATIONS.DELETE,

      payload: {

        id:
          cleanVisitId,

        gymId:
          cleanGymId

      },

      metadata: {

        source:
          'visitRepository'

      }

    });


    dispatchUpdate();


    return {

      success:
        true,

      visit:
        existing

    };

  };


// ======================================================
// SERVIDOR
// ======================================================

export const saveVisitFromServer =
  async (
    visit
  ) => {

    validateVisit(
      visit
    );


    await openNexgymDatabase();


    const prepared =
      prepareVisit(
        visit,
        'synced'
      );


    await db.visits.put(
      prepared
    );


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// EXPORT
// ======================================================

const visitRepository = {

  save:
    saveOfflineVisit,

  getAll:
    getOfflineVisits,

  getById:
    getOfflineVisitById,

  update:
    updateOfflineVisit,

  delete:
    deleteOfflineVisit,

  saveFromServer:
    saveVisitFromServer

};


export default visitRepository;