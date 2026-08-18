// src/utils/gymScopedStorage.js

// ======================================================
// NEXGYM - STORAGE LOCAL AISLADO POR GIMNASIO
// ======================================================
//
// Objetivo:
//
// - impedir que un gimnasio lea datos locales de otro;
// - conservar compatibilidad con las llaves existentes;
// - agregar gymId automáticamente al guardar;
// - ignorar registros legacy sin gymId cuando hay sesión;
// - preservar registros válidos de otros gimnasios.
//
// IMPORTANTE:
// Este archivo NO reemplaza IndexedDB ni Supabase.
// Solamente hace segura la capa legacy de localStorage.
//
// ======================================================


// ======================================================
// SESIÓN
// ======================================================

const SESSION_KEY =
  'gym_control_session';

const AUTH_KEY =
  'isAuthenticated';


// ======================================================
// OBTENER SESIÓN ACTUAL
// ======================================================

export const getLocalGymSession =
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

    } catch (error) {

      console.error(
        '❌ Error leyendo sesión local del gimnasio:',
        error
      );


      return null;

    }

  };


// ======================================================
// GYM ID ACTUAL
// ======================================================

export const getActiveGymId =
  () => {

    const session =
      getLocalGymSession();


    return session?.gymId
      ? String(
          session.gymId
        )
      : null;

  };


// ======================================================
// NORMALIZAR GYM ID
// ======================================================

const cleanGymId =
  value => {

    if (
      value === null ||
      value === undefined
    ) {

      return null;

    }


    const text =
      String(
        value
      ).trim();


    return text ||
      null;

  };


// ======================================================
// LEER ARRAY SIN FILTRO
// ======================================================

export const readRawLocalArray =
  key => {

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
        `❌ Error leyendo ${key}:`,
        error
      );


      return [];

    }

  };


// ======================================================
// EXTRAER GYM ID DE REGISTRO
// ======================================================

export const getRecordGymId =
  record => {

    if (
      !record ||
      typeof record !==
        'object'
    ) {

      return null;

    }


    return cleanGymId(
      record.gymId ||
      record.gym_id ||
      record.gym?.id ||
      record.metadata?.gymId ||
      record.metadata?.gym_id ||
      null
    );

  };


// ======================================================
// FILTRAR REGISTROS DEL GYM ACTUAL
// ======================================================

export const filterRecordsForGym =
  (
    records,
    gymId =
      getActiveGymId()
  ) => {

    const safeRecords =
      Array.isArray(
        records
      )
        ? records
        : [];


    const activeGymId =
      cleanGymId(
        gymId
      );


    // En una pantalla protegida nunca debemos entregar
    // datos globales si todavía no podemos identificar gymId.
    if (!activeGymId) {

      return [];

    }


    return safeRecords.filter(
      record =>
        getRecordGymId(
          record
        ) ===
        activeGymId
    );

  };


// ======================================================
// ALIAS SEMÁNTICO
// ======================================================

export const filterRecordsForCurrentGym =
  records => {

    return filterRecordsForGym(
      records,
      getActiveGymId()
    );

  };


// ======================================================
// LEER ARRAY AISLADO
// ======================================================

export const readGymScopedArray =
  (
    key,
    gymId =
      getActiveGymId()
  ) => {

    return filterRecordsForGym(
      readRawLocalArray(
        key
      ),
      gymId
    );

  };


// ======================================================
// ESTAMPAR GYM ID
// ======================================================

export const stampRecordWithGymId =
  (
    record,
    gymId =
      getActiveGymId()
  ) => {

    const activeGymId =
      cleanGymId(
        gymId
      );


    if (!activeGymId) {

      throw new Error(
        'No existe un gymId activo para guardar el registro.'
      );

    }


    if (
      !record ||
      typeof record !==
        'object' ||
      Array.isArray(
        record
      )
    ) {

      throw new Error(
        'El registro local no es válido.'
      );

    }


    const recordGymId =
      getRecordGymId(
        record
      );


    if (
      recordGymId &&
      recordGymId !==
        activeGymId
    ) {

      throw new Error(
        'Se intentó guardar un registro perteneciente a otro gimnasio.'
      );

    }


    return {

      ...record,

      gymId:
        activeGymId

    };

  };


// ======================================================
// GUARDAR ARRAY AISLADO
// ======================================================
//
// data representa SOLO los registros del gimnasio actual.
// Los registros válidos de otros gimnasios se preservan.
// Los registros legacy sin gymId se descartan al guardar.
//
// ======================================================

export const saveGymScopedArray =
  (
    key,
    data,
    gymId =
      getActiveGymId()
  ) => {

    const activeGymId =
      cleanGymId(
        gymId
      );


    if (!activeGymId) {

      throw new Error(
        `No se pudo guardar ${key}: no existe un gimnasio autenticado.`
      );

    }


    const safeData =
      Array.isArray(
        data
      )
        ? data
        : [];


    const normalizedCurrentGym =
      safeData.map(
        record =>
          stampRecordWithGymId(
            record,
            activeGymId
          )
      );


    const existing =
      readRawLocalArray(
        key
      );


    // Conservamos únicamente datos bien identificados
    // pertenecientes a OTROS gimnasios.
    //
    // Los datos legacy sin gymId son descartados para que
    // jamás vuelvan a aparecer por coincidencia de memberId.
    const otherGyms =
      existing.filter(
        record => {

          const recordGymId =
            getRecordGymId(
              record
            );


          return (
            recordGymId &&
            recordGymId !==
              activeGymId
          );

        }
      );


    const merged = [
      ...normalizedCurrentGym,
      ...otherGyms
    ];


    localStorage.setItem(
      key,
      JSON.stringify(
        merged
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    return normalizedCurrentGym;

  };


// ======================================================
// ELIMINAR SOLO DATOS DEL GYM ACTUAL DE UNA LLAVE
// ======================================================

export const clearCurrentGymFromLocalArray =
  (
    key,
    gymId =
      getActiveGymId()
  ) => {

    const activeGymId =
      cleanGymId(
        gymId
      );


    if (!activeGymId) {

      return 0;

    }


    const existing =
      readRawLocalArray(
        key
      );


    const remaining =
      existing.filter(
        record =>
          getRecordGymId(
            record
          ) !==
          activeGymId
      );


    const removed =
      existing.length -
      remaining.length;


    localStorage.setItem(
      key,
      JSON.stringify(
        remaining
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    return removed;

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

export default {

  getSession:
    getLocalGymSession,

  getGymId:
    getActiveGymId,

  readRaw:
    readRawLocalArray,

  read:
    readGymScopedArray,

  save:
    saveGymScopedArray,

  filter:
    filterRecordsForCurrentGym,

  filterByGym:
    filterRecordsForGym,

  stamp:
    stampRecordWithGymId,

  clearCurrentGym:
    clearCurrentGymFromLocalArray

};
