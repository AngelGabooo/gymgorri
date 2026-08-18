// src/utils/memberId.js


// ======================================================
// STORAGE
// ======================================================

const MEMBER_COUNTER_KEY =
  'gym_control_member_counter';

const MEMBER_COUNTERS_KEY =
  'gym_control_member_counters';

export const MEMBERS_STORAGE_KEY =
  'gym_control_members';

const SESSION_KEY =
  'gym_control_session';

const AUTH_KEY =
  'isAuthenticated';


// ======================================================
// OBTENER SESIÓN SIN IMPORTAR authService
// ======================================================
//
// IMPORTANTE:
//
// authService importa hashValue desde este archivo.
//
// Por eso NO debemos importar authService aquí porque
// crearíamos una dependencia circular.
//
// ======================================================

const getSessionSnapshot = () => {

  try {

    const authenticated =
      localStorage.getItem(
        AUTH_KEY
      );


    if (
      authenticated !==
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
      typeof parsed === 'object'
    )
      ? parsed
      : null;

  } catch (error) {

    console.error(
      'Error leyendo sesión desde memberId:',
      error
    );


    return null;

  }

};


// ======================================================
// CONTEXTO DEL GIMNASIO ACTUAL
// ======================================================

export const getCurrentGymContext = () => {

  const session =
    getSessionSnapshot();


  return {

    gymId:
      session?.gymId ||
      null,

    gymCode:
      session?.gymCode ||
      null,

    gymName:
      session?.gymName ||
      null

  };

};


// ======================================================
// OBTENER TODOS LOS MIEMBROS SIN FILTRO
// ======================================================
//
// Esta función es principalmente para utilidades internas
// como eliminación permanente.
//
// Las pantallas normales deben usar getStoredMembers().
//
// ======================================================

export const getAllStoredMembers = () => {

  try {

    const data =
      localStorage.getItem(
        MEMBERS_STORAGE_KEY
      );


    if (!data) {

      return [];

    }


    const parsed =
      JSON.parse(
        data
      );


    return Array.isArray(
      parsed
    )
      ? parsed
      : [];

  } catch (error) {

    console.error(
      'Error leyendo todos los miembros:',
      error
    );


    return [];

  }

};


// ======================================================
// OBTENER MIEMBROS DEL GIMNASIO ACTUAL
// ======================================================

export const getStoredMembers = () => {

  const members =
    getAllStoredMembers();


  const {
    gymId
  } =
    getCurrentGymContext();


  // ====================================================
  // MODO LEGACY
  // ====================================================
  //
  // Si la instalación todavía no tiene gymId conservamos
  // el comportamiento anterior.
  //
  // ====================================================

  if (!gymId) {

    return members;

  }


  return members.filter(
    member =>
      member?.gymId ===
      gymId
  );

};


// ======================================================
// GUARDAR TODOS LOS MIEMBROS
// ======================================================

export const saveAllStoredMembers = (
  members
) => {

  const safeMembers =
    Array.isArray(
      members
    )
      ? members
      : [];


  localStorage.setItem(
    MEMBERS_STORAGE_KEY,
    JSON.stringify(
      safeMembers
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );


  return safeMembers;

};


// ======================================================
// OBTENER CONTADORES POR GIMNASIO
// ======================================================

const getMemberCounters = () => {

  try {

    const raw =
      localStorage.getItem(
        MEMBER_COUNTERS_KEY
      );


    if (!raw) {

      return {};

    }


    const parsed =
      JSON.parse(
        raw
      );


    return (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(
        parsed
      )
    )
      ? parsed
      : {};

  } catch (error) {

    console.error(
      'Error leyendo contadores de miembros:',
      error
    );


    return {};

  }

};


// ======================================================
// GUARDAR CONTADORES
// ======================================================

const saveMemberCounters = (
  counters
) => {

  localStorage.setItem(
    MEMBER_COUNTERS_KEY,
    JSON.stringify(
      counters || {}
    )
  );

};


// ======================================================
// CLAVE DEL CONTADOR ACTUAL
// ======================================================

const getCounterScopeKey = () => {

  const {
    gymId
  } =
    getCurrentGymContext();


  return (
    gymId ||
    '__legacy__'
  );

};


// ======================================================
// OBTENER NÚMERO MÁS ALTO UTILIZADO
// ======================================================

const getHighestMemberNumber = () => {

  const members =
    getStoredMembers();


  // Empezamos en 0 para que el primer ID sea:
  //
  // GYM-00001

  let highest = 0;


  members.forEach(
    member => {

      const match =
        String(
          member?.id ||
          ''
        ).match(
          /^GYM-(\d{5})$/
        );


      if (!match) {

        return;

      }


      highest =
        Math.max(
          highest,
          Number(
            match[1]
          )
        );

    }
  );


  const {
    gymId
  } =
    getCurrentGymContext();


  // ====================================================
  // MULTI-GIMNASIO
  // ====================================================

  if (gymId) {

    const counters =
      getMemberCounters();


    const storedCounter =
      Number(
        counters[
          getCounterScopeKey()
        ] ??
        0
      );


    if (
      !Number.isNaN(
        storedCounter
      )
    ) {

      highest =
        Math.max(
          highest,
          storedCounter
        );

    }


    return highest;

  }


  // ====================================================
  // LEGACY
  // ====================================================

  const counterValue =
    localStorage.getItem(
      MEMBER_COUNTER_KEY
    );


  if (
    counterValue !==
    null
  ) {

    const numericCounter =
      Number(
        counterValue
      );


    if (
      !Number.isNaN(
        numericCounter
      )
    ) {

      highest =
        Math.max(
          highest,
          numericCounter
        );

    }

  }


  return highest;

};


// ======================================================
// GENERAR SIGUIENTE ID
// ======================================================

export const getNextMemberId = () => {

  const highest =
    getHighestMemberNumber();


  const next =
    highest + 1;


  return `GYM-${String(
    next
  ).padStart(
    5,
    '0'
  )}`;

};


// ======================================================
// GENERAR VARIOS IDS CONSECUTIVOS
// ======================================================

export const getNextMemberIds = (
  quantity = 1
) => {

  const numericQuantity =
    Number(
      quantity
    );


  const safeQuantity =
    Number.isFinite(
      numericQuantity
    )
      ? Math.max(
          0,
          Math.floor(
            numericQuantity
          )
        )
      : 0;


  if (
    safeQuantity ===
    0
  ) {

    return [];

  }


  const highest =
    getHighestMemberNumber();


  const initial =
    highest + 1;


  return Array.from(
    {
      length:
        safeQuantity
    },
    (
      _,
      index
    ) => {

      const numericId =
        initial +
        index;


      return `GYM-${String(
        numericId
      ).padStart(
        5,
        '0'
      )}`;

    }
  );

};


// ======================================================
// CONFIRMAR ID
// ======================================================

export const confirmMemberId = (
  memberId
) => {

  const match =
    String(
      memberId ||
      ''
    ).match(
      /^GYM-(\d{5})$/
    );


  if (!match) {

    console.error(
      'ID inválido:',
      memberId
    );


    return;

  }


  const numeric =
    Number(
      match[1]
    );


  if (
    Number.isNaN(
      numeric
    )
  ) {

    return;

  }


  const {
    gymId
  } =
    getCurrentGymContext();


  // ====================================================
  // CONTADOR POR GIMNASIO
  // ====================================================

  if (gymId) {

    const counters =
      getMemberCounters();


    const scopeKey =
      getCounterScopeKey();


    const current =
      Number(
        counters[
          scopeKey
        ] ??
        0
      );


    if (
      Number.isNaN(
        current
      ) ||
      numeric >
      current
    ) {

      counters[
        scopeKey
      ] =
        numeric;


      saveMemberCounters(
        counters
      );

    }


    return;

  }


  // ====================================================
  // CONTADOR LEGACY
  // ====================================================

  const current =
    Number(
      localStorage.getItem(
        MEMBER_COUNTER_KEY
      ) ??
      0
    );


  if (
    Number.isNaN(
      current
    ) ||
    numeric >
    current
  ) {

    localStorage.setItem(
      MEMBER_COUNTER_KEY,
      String(
        numeric
      )
    );

  }

};


// ======================================================
// TOKEN ÚNICO
// ======================================================

export const createUniqueToken = () => {

  if (
    window.crypto &&
    window.crypto.randomUUID
  ) {

    return window.crypto.randomUUID();

  }


  return (
    Date.now()
      .toString(36) +
    '-' +
    Math.random()
      .toString(36)
      .substring(
        2
      )
  );

};


// ======================================================
// SHA-256
// ======================================================
//
// authService utiliza esta función.
// NO ELIMINAR.
//
// ======================================================

export const hashValue = async (
  value
) => {

  if (
    !window.crypto?.subtle
  ) {

    throw new Error(
      'Este navegador no permite generar hashes seguros.'
    );

  }


  const encoder =
    new TextEncoder();


  const encoded =
    encoder.encode(
      String(
        value
      )
    );


  const hashBuffer =
    await window.crypto.subtle.digest(
      'SHA-256',
      encoded
    );


  const hashArray =
    Array.from(
      new Uint8Array(
        hashBuffer
      )
    );


  return hashArray
    .map(
      byte =>
        byte
          .toString(
            16
          )
          .padStart(
            2,
            '0'
          )
    )
    .join('');

};


// ======================================================
// PIN AUTOMÁTICO ÚNICO
// ======================================================
//
// La comprobación se realiza únicamente contra miembros
// del gimnasio que inició sesión.
//
// ======================================================

export const generateUniquePin =
  async () => {

    const members =
      getStoredMembers();


    const existingHashes =
      new Set(
        members
          .map(
            member =>
              member
                ?.access
                ?.pin
                ?.pinHash
          )
          .filter(
            Boolean
          )
      );


    let attempts =
      0;


    while (
      attempts <
      100
    ) {

      attempts +=
        1;


      const random =
        new Uint32Array(
          1
        );


      if (
        window.crypto?.getRandomValues
      ) {

        window.crypto.getRandomValues(
          random
        );

      } else {

        random[0] =
          Math.floor(
            Math.random() *
            4294967295
          );

      }


      const pin =
        String(
          random[0] %
          1000000
        ).padStart(
          6,
          '0'
        );


      const pinHash =
        await hashValue(
          pin
        );


      if (
        !existingHashes.has(
          pinHash
        )
      ) {

        return {
          pin,
          pinHash
        };

      }

    }


    throw new Error(
      'No se pudo generar un PIN único.'
    );

  };


// ======================================================
// TOKEN QR ÚNICO
// ======================================================

export const generateUniqueQRToken =
  () => {

    return `QR-${createUniqueToken()}`;

  };


// ======================================================
// ID BIOMÉTRICO
// ======================================================

export const generateFaceId =
  () => {

    return `FACE-${createUniqueToken()}`;

  };


// ======================================================
// PREPARAR MIEMBRO PARA EL GIMNASIO ACTUAL
// ======================================================

const normalizeMemberForCurrentGym = (
  member
) => {

  const {
    gymId,
    gymCode,
    gymName
  } =
    getCurrentGymContext();


  // ====================================================
  // MODO LEGACY
  // ====================================================

  if (!gymId) {

    return {
      ...member
    };

  }


  // ====================================================
  // PROTECCIÓN
  // ====================================================

  if (
    member?.gymId &&
    member.gymId !==
    gymId
  ) {

    throw new Error(
      'No puedes guardar un miembro perteneciente a otro gimnasio.'
    );

  }


  return {

    ...member,

    gymId,

    gymCode:
      gymCode ||
      member?.gymCode ||
      null,

    gymName:
      gymName ||
      member?.gymName ||
      null

  };

};


// ======================================================
// GUARDAR MIEMBRO
// ======================================================

export const saveMember = (
  member
) => {

  if (
    !member ||
    !member.id
  ) {

    throw new Error(
      'El miembro no contiene un ID válido.'
    );

  }


  const normalizedMember =
    normalizeMemberForCurrentGym(
      member
    );


  const allMembers =
    getAllStoredMembers();


  const {
    gymId
  } =
    getCurrentGymContext();


  const index =
    allMembers.findIndex(
      item => {

        // Multi-gimnasio
        if (gymId) {

          return (
            item.id ===
              normalizedMember.id &&
            item.gymId ===
              gymId
          );

        }


        // Legacy
        return (
          item.id ===
          normalizedMember.id
        );

      }
    );


  if (
    index >=
    0
  ) {

    allMembers[
      index
    ] =
      normalizedMember;

  } else {

    allMembers.push(
      normalizedMember
    );

  }


  saveAllStoredMembers(
    allMembers
  );


  confirmMemberId(
    normalizedMember.id
  );


  return normalizedMember;

};


// ======================================================
// BUSCAR MIEMBRO
// ======================================================

export const getMemberById = (
  memberId
) => {

  if (!memberId) {

    return null;

  }


  return (
    getStoredMembers().find(
      member =>
        member.id ===
        memberId
    ) ||
    null
  );

};


// ======================================================
// BUSCAR MIEMBRO POR TOKEN QR
// ======================================================

export const getMemberByQRToken = (
  memberId,
  token
) => {

  if (
    !memberId ||
    !token
  ) {

    return null;

  }


  return (
    getStoredMembers().find(
      member =>
        member.id ===
          memberId &&
        member
          ?.access
          ?.qr
          ?.enabled ===
          true &&
        member
          ?.access
          ?.qr
          ?.token ===
          token
    ) ||
    null
  );

};