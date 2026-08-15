// src/utils/visitsStorage.js

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
      Array.isArray(data)
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
// OBTENER VISITAS
// ======================================================

export const getStoredVisits =
  () => {

    return readArray(
      VISITS_KEY
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


  const visits =
    getStoredVisits();


  const index =
    visits.findIndex(
      item =>
        item.id ===
        visit.id
    );


  if (
    index >= 0
  ) {

    visits[index] = {

      ...visits[index],

      ...visit

    };

  } else {

    visits.push(
      visit
    );

  }


  saveArray(
    VISITS_KEY,
    visits
  );


  return visit;

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
// BUSCAR VISITA POR PIN HASH
// ======================================================

export const getVisitByPinHash = (
  pinHash
) => {

  if (
    !pinHash
  ) {

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
// OBTENER VISITAS CON BIOMETRÍA
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
// OBTENER ASISTENCIAS DE VISITAS
// ======================================================

export const getVisitAttendance =
  () => {

    return readArray(
      VISIT_ATTENDANCE_KEY
    );

  };


// ======================================================
// GUARDAR ASISTENCIAS DE VISITAS
// ======================================================

export const saveVisitAttendance = (
  records
) => {

  saveArray(
    VISIT_ATTENDANCE_KEY,
    records
  );


  return records;

};


// ======================================================
// BUSCAR ASISTENCIA ABIERTA
// ======================================================

export const getOpenVisitAttendance = (
  visitId
) => {

  if (
    !visitId
  ) {

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
// CREAR ID DE ASISTENCIA
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
// NOMBRE COMPLETO DE VISITA
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
// REGISTRAR ENTRADA / SALIDA DE VISITA
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


  const attendance =
    getVisitAttendance();


  const now =
    new Date()
      .toISOString();


  const openRecord =
    attendance.find(
      record =>
        (
          record.visitId ===
            visit.id ||

          record.visitorId ===
            visit.id ||

          record.memberId ===
            visit.id
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


    const updatedAttendance =
      attendance.map(
        record => {

          if (
            record.id !==
            openRecord.id
          ) {

            return record;

          }


          return {

            ...record,

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

        }
      );


    saveVisitAttendance(
      updatedAttendance
    );


    saveVisit({

      ...visit,

      isInside:
        false,

      lastAccessAt:
        now,

      lastVisit:
        now,

      updatedAt:
        now

    });


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

    visitId:
      visit.id,

    visitorId:
      visit.id,

    visitName:
      getVisitFullName(
        visit
      ),

    visitorName:
      getVisitFullName(
        visit
      ),

    memberName:
      getVisitFullName(
        visit
      ),

    profilePhoto:
      visit.profilePhoto ||
      visit.profilePhotoUrl ||
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

    ...visit,

    isInside:
      true,

    lastAccessAt:
      now,

    lastVisit:
      now,

    updatedAt:
      now

  });


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
// TOKEN QR DE VISITA
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
// ID BIOMÉTRICO DE VISITA
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