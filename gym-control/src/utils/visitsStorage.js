// src/utils/visitsStorage.js

import {
  getCurrentGymContext
} from './memberId.js';

import {
  saveOfflineVisit
} from '../offline/repositories/visitRepository.js';

import {
  saveOfflineVisitAttendance
} from '../offline/repositories/visitAttendanceRepository.js';


const VISITS_KEY =
  'gym_control_visits';

const VISIT_ATTENDANCE_KEY =
  'gym_control_visit_attendance';


// ======================================================
// LEER ARRAY
// ======================================================

const readArray = (
  key
) => {

  try {

    const raw =
      localStorage.getItem(
        key
      );


    if (!raw) {

      return [];

    }


    const parsed =
      JSON.parse(
        raw
      );


    return Array.isArray(
      parsed
    )
      ? parsed
      : [];

  } catch (error) {

    console.error(
      `Error leyendo ${key}:`,
      error
    );


    return [];

  }

};


// ======================================================
// GUARDAR ARRAY
// ======================================================

const saveArray = (
  key,
  data
) => {

  localStorage.setItem(
    key,
    JSON.stringify(
      Array.isArray(
        data
      )
        ? data
        : []
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
// CONTEXTO
// ======================================================

const getVisitGymContext =
  () => {

    return getCurrentGymContext();

  };


// ======================================================
// NORMALIZAR VISITA
// ======================================================

const normalizeVisitForCurrentGym = (
  visit
) => {

  const {
    gymId,
    gymCode,
    gymName
  } =
    getVisitGymContext();


  if (!gymId) {

    return {
      ...visit
    };

  }


  if (
    visit?.gymId &&
    visit.gymId !==
      gymId
  ) {

    throw new Error(
      'La visita pertenece a otro gimnasio.'
    );

  }


  return {

    ...visit,

    gymId,

    gymCode:
      gymCode ||
      visit?.gymCode ||
      null,

    gymName:
      gymName ||
      visit?.gymName ||
      null

  };

};


// ======================================================
// TODAS LAS VISITAS SIN FILTRAR
// ======================================================

export const getAllStoredVisits =
  () => {

    return readArray(
      VISITS_KEY
    );

  };


// ======================================================
// VISITAS DEL GYM ACTUAL
// ======================================================

export const getStoredVisits =
  () => {

    const visits =
      getAllStoredVisits();


    const {
      gymId
    } =
      getVisitGymContext();


    if (!gymId) {

      return visits;

    }


    return visits.filter(
      visit =>
        visit?.gymId ===
          gymId
    );

  };


// ======================================================
// GUARDAR VISITA
// ======================================================

export const saveVisit = (
  visit
) => {

  if (
    !visit?.id
  ) {

    throw new Error(
      'La visita no contiene un ID válido.'
    );

  }


  const normalizedVisit =
    normalizeVisitForCurrentGym(
      visit
    );


  const allVisits =
    getAllStoredVisits();


  const {
    gymId
  } =
    getVisitGymContext();


  const index =
    allVisits.findIndex(
      item => {

        if (gymId) {

          return (
            item.id ===
              normalizedVisit.id &&
            item.gymId ===
              gymId
          );

        }


        return (
          item.id ===
          normalizedVisit.id
        );

      }
    );


  if (
    index >=
    0
  ) {

    allVisits[
      index
    ] = {

      ...allVisits[
        index
      ],

      ...normalizedVisit

    };

  } else {

    allVisits.push(
      normalizedVisit
    );

  }


  // ====================================================
  // LOCALSTORAGE
  // ====================================================

  saveArray(
    VISITS_KEY,
    allVisits
  );


  // ====================================================
  // INDEXEDDB + SYNCQUEUE
  // ====================================================

  if (
    normalizedVisit.gymId
  ) {

    void saveOfflineVisit(
      normalizedVisit
    )
      .then(
        saved => {

          console.log(
            '✅ Visita respaldada en IndexedDB:',
            {

              gymId:
                saved.gymId,

              visitId:
                saved.id,

              syncStatus:
                saved.syncStatus

            }
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo respaldar la visita en IndexedDB:',
            error
          );

        }
      );

  }


  return normalizedVisit;

};


// ======================================================
// BUSCAR VISITA POR ID
// ======================================================

export const getVisitById = (
  visitId
) => {

  return (
    getStoredVisits().find(
      visit =>
        visit.id ===
        visitId
    ) ||
    null
  );

};


// ======================================================
// BUSCAR VISITA POR QR
// ======================================================

export const getVisitByQRToken = (
  visitId,
  token
) => {

  if (
    !visitId ||
    !token
  ) {

    return null;

  }


  return (
    getStoredVisits().find(
      visit =>
        visit.id ===
          visitId &&

        visit
          ?.access
          ?.qr
          ?.enabled ===
          true &&

        visit
          ?.access
          ?.qr
          ?.token ===
          token
    ) ||
    null
  );

};


// ======================================================
// BUSCAR VISITA POR PIN
// ======================================================

export const getVisitByPinHash = (
  pinHash
) => {

  if (!pinHash) {

    return null;

  }


  return (
    getStoredVisits().find(
      visit =>

        visit
          ?.access
          ?.pin
          ?.enabled ===
          true &&

        visit
          ?.access
          ?.pin
          ?.configured !==
          false &&

        visit
          ?.access
          ?.pin
          ?.pinHash ===
          pinHash
    ) ||
    null
  );

};


// ======================================================
// VISITAS CON ROSTRO
// ======================================================

export const getVisitsWithFace =
  () => {

    return getStoredVisits().filter(
      visit =>

        visit
          ?.access
          ?.face
          ?.enabled ===
          true &&

        visit
          ?.access
          ?.face
          ?.enrolled ===
          true &&

        Array.isArray(
          visit
            ?.access
            ?.face
            ?.embeddings
        ) &&

        visit
          .access
          .face
          .embeddings
          .length >
          0
    );

  };


// ======================================================
// TODAS LAS ASISTENCIAS SIN FILTRO
// ======================================================

export const getAllVisitAttendance =
  () => {

    return readArray(
      VISIT_ATTENDANCE_KEY
    );

  };


// ======================================================
// ASISTENCIAS DEL GYM ACTUAL
// ======================================================

export const getVisitAttendance =
  () => {

    const records =
      getAllVisitAttendance();


    const {
      gymId
    } =
      getVisitGymContext();


    if (!gymId) {

      return records;

    }


    return records.filter(
      record =>
        record?.gymId ===
          gymId
    );

  };


// ======================================================
// GUARDAR ASISTENCIAS
// ======================================================

export const saveVisitAttendance = (
  records
) => {

  const safeRecords =
    Array.isArray(
      records
    )
      ? records
      : [];


  const {
    gymId
  } =
    getVisitGymContext();


  // ====================================================
  // LEGACY
  // ====================================================

  if (!gymId) {

    saveArray(
      VISIT_ATTENDANCE_KEY,
      safeRecords
    );


    return safeRecords;

  }


  // ====================================================
  // NO BORRAR REGISTROS DE OTROS GYMS
  // ====================================================

  const allRecords =
    getAllVisitAttendance();


  const otherGymRecords =
    allRecords.filter(
      record =>
        record?.gymId !==
          gymId
    );


  const normalized =
    safeRecords.map(
      record => ({

        ...record,

        gymId:
          record.gymId ||
          gymId

      })
    );


  saveArray(
    VISIT_ATTENDANCE_KEY,
    [
      ...otherGymRecords,
      ...normalized
    ]
  );


  return normalized;

};


// ======================================================
// ASISTENCIA ABIERTA
// ======================================================

export const getOpenVisitAttendance = (
  visitId
) => {

  if (!visitId) {

    return null;

  }


  return (
    getVisitAttendance().find(
      record =>
        (
          record.visitId ===
            visitId ||

          record.visitorId ===
            visitId ||

          record.memberId ===
            visitId
        ) &&

        record.status ===
          'inside' &&

        !record.exitAt
    ) ||
    null
  );

};


// ======================================================
// ID ASISTENCIA
// ======================================================

const createVisitAttendanceId =
  () => {

    if (
      window.crypto?.randomUUID
    ) {

      return `VATT-${window.crypto.randomUUID()}`;

    }


    return (
      `VATT-${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(
          2,
          9
        )
    );

  };


// ======================================================
// NOMBRE
// ======================================================

const getVisitFullName = (
  visit
) => {

  return (
    `${visit?.firstName || ''} ${visit?.lastName || ''}`
      .trim() ||

    visit?.name ||

    'Visita'
  );

};


// ======================================================
// REGISTRAR ENTRADA / SALIDA
// ======================================================

export const registerVisitMovement = ({
  visit,
  method
}) => {

  if (
    !visit?.id
  ) {

    throw new Error(
      'No se recibió una visita válida.'
    );

  }


  const normalizedVisit =
    normalizeVisitForCurrentGym(
      visit
    );


  const attendance =
    getVisitAttendance();


  const now =
    new Date()
      .toISOString();


  const {
    gymId,
    gymCode,
    gymName
  } =
    getVisitGymContext();


  const openRecord =
    attendance.find(
      record =>
        (
          record.visitId ===
            normalizedVisit.id ||

          record.visitorId ===
            normalizedVisit.id ||

          record.memberId ===
            normalizedVisit.id
        ) &&

        record.status ===
          'inside' &&

        !record.exitAt
    );


  // ====================================================
  // SALIDA
  // ====================================================

  if (
    openRecord
  ) {

    const entryDate =
      new Date(
        openRecord.entryAt
      );


    const durationMinutes =
      Number.isNaN(
        entryDate.getTime()
      )
        ? 0
        : Math.max(
            0,
            Math.round(
              (
                new Date(
                  now
                ).getTime() -
                entryDate.getTime()
              ) /
              60000
            )
          );


    let updatedRecord =
      null;


    const updatedAttendance =
      attendance.map(
        record => {

          if (
            record.id !==
            openRecord.id
          ) {

            return record;

          }


          updatedRecord = {

            ...record,

            gymId:
              record.gymId ||
              gymId ||
              null,

            gymCode:
              record.gymCode ||
              gymCode ||
              null,

            gymName:
              record.gymName ||
              gymName ||
              null,

            exitAt:
              now,

            exitMethod:
              method,

            status:
              'completed',

            durationMinutes,

            updatedAt:
              now

          };


          return updatedRecord;

        }
      );


    saveVisitAttendance(
      updatedAttendance
    );


    saveVisit({

      ...normalizedVisit,

      isInside:
        false,

      lastAccessAt:
        now,

      lastVisit:
        now,

      updatedAt:
        now

    });


    if (
      updatedRecord?.gymId
    ) {

      void saveOfflineVisitAttendance(
        updatedRecord
      )
        .then(
          saved => {

            console.log(
              '✅ Salida de visita respaldada offline:',
              saved
            );

          }
        )
        .catch(
          error => {

            console.error(
              '❌ Error respaldando salida de visita:',
              error
            );

          }
        );

    }


    return {

      type:
        'exit',

      attendanceId:
        openRecord.id,

      time:
        now,

      durationMinutes

    };

  }


  // ====================================================
  // ENTRADA
  // ====================================================

  const attendanceRecord = {

    id:
      createVisitAttendanceId(),

    gymId:
      gymId ||
      normalizedVisit.gymId ||
      null,

    gymCode:
      gymCode ||
      normalizedVisit.gymCode ||
      null,

    gymName:
      gymName ||
      normalizedVisit.gymName ||
      null,

    visitId:
      normalizedVisit.id,

    visitorId:
      normalizedVisit.id,

    memberId:
      normalizedVisit.id,

    visitName:
      getVisitFullName(
        normalizedVisit
      ),

    visitorName:
      getVisitFullName(
        normalizedVisit
      ),

    memberName:
      getVisitFullName(
        normalizedVisit
      ),

    profilePhoto:
      normalizedVisit.profilePhoto ||
      normalizedVisit.profilePhotoUrl ||
      null,

    method,

    entryMethod:
      method,

    entryAt:
      now,

    exitAt:
      null,

    exitMethod:
      null,

    status:
      'inside',

    durationMinutes:
      0,

    createdAt:
      now,

    updatedAt:
      now

  };


  attendance.unshift(
    attendanceRecord
  );


  saveVisitAttendance(
    attendance
  );


  saveVisit({

    ...normalizedVisit,

    isInside:
      true,

    lastAccessAt:
      now,

    lastVisit:
      now,

    updatedAt:
      now

  });


  if (
    attendanceRecord.gymId
  ) {

    void saveOfflineVisitAttendance(
      attendanceRecord
    )
      .then(
        saved => {

          console.log(
            '✅ Entrada de visita respaldada offline:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ Error respaldando entrada de visita:',
            error
          );

        }
      );

  }


  return {

    type:
      'entry',

    attendanceId:
      attendanceRecord.id,

    time:
      now,

    durationMinutes:
      0

  };

};


// ======================================================
// CREAR ID DE VISITA
// ======================================================

export const createVisitId =
  () => {

    const visits =
      getStoredVisits();


    let highest =
      0;


    visits.forEach(
      visit => {

        const match =
          String(
            visit.id ||
            ''
          ).match(
            /^VIS-(\d{5})$/
          );


        if (
          match
        ) {

          highest =
            Math.max(
              highest,
              Number(
                match[1]
              )
            );

        }

      }
    );


    const next =
      highest +
      1;


    return `VIS-${String(
      next
    ).padStart(
      5,
      '0'
    )}`;

  };


// ======================================================
// TOKEN QR
// ======================================================

export const createVisitToken =
  () => {

    if (
      window.crypto?.randomUUID
    ) {

      return `VQR-${window.crypto.randomUUID()}`;

    }


    return (
      `VQR-${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(
          2
        )
    );

  };


// ======================================================
// ID FACIAL
// ======================================================

export const createVisitFaceId =
  () => {

    if (
      window.crypto?.randomUUID
    ) {

      return `VFACE-${window.crypto.randomUUID()}`;

    }


    return (
      `VFACE-${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(
          2
        )
    );

  };