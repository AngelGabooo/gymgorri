// src/services/blacklistService.js


// ======================================================
// STORAGE
// ======================================================

export const BLACKLIST_KEY =
  'gym_control_blacklist';

const SESSION_KEY =
  'gym_control_session';

const AUTH_KEY =
  'isAuthenticated';


// ======================================================
// OBTENER CONTEXTO ACTUAL
// ======================================================

const getCurrentGymContext = () => {

  try {

    if (
      localStorage.getItem(
        AUTH_KEY
      ) !==
      'true'
    ) {

      return {
        gymId: null,
        gymCode: null,
        gymName: null
      };

    }


    const raw =
      localStorage.getItem(
        SESSION_KEY
      );


    if (!raw) {

      return {
        gymId: null,
        gymCode: null,
        gymName: null
      };

    }


    const session =
      JSON.parse(
        raw
      );


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

  } catch (error) {

    console.error(
      'Error leyendo contexto del gimnasio en lista negra:',
      error
    );


    return {
      gymId: null,
      gymCode: null,
      gymName: null
    };

  }

};


// ======================================================
// NORMALIZADORES
// ======================================================

const normalizeText = (
  value = ''
) =>

  String(
    value
  )
    .trim()
    .toLowerCase()
    .normalize(
      'NFD'
    )
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );


const normalizePhone = (
  value = ''
) =>

  String(
    value
  )
    .replace(
      /\D/g,
      ''
    );


const normalizeEmail = (
  value = ''
) =>

  String(
    value
  )
    .trim()
    .toLowerCase();


// ======================================================
// CREAR ID
// ======================================================

const createId = () => {

  if (
    window.crypto?.randomUUID
  ) {

    return `BLK-${window.crypto.randomUUID()}`;

  }


  return (
    `BLK-${Date.now()}-` +
    Math.random()
      .toString(36)
      .substring(
        2,
        9
      )
  );

};


// ======================================================
// CREAR ID DE EVENTO
// ======================================================

const createEventId = () => {

  return (
    `EVT-${Date.now()}-` +
    Math.random()
      .toString(36)
      .substring(
        2,
        7
      )
  );

};


// ======================================================
// NORMALIZAR ACTOR
// ======================================================

const normalizeActor = (
  actor = null
) => {

  if (!actor) {

    return null;

  }


  return {

    id:
      actor.id ||
      actor.userId ||
      null,

    name:
      actor.name ||
      actor.fullName ||
      actor.email ||
      'Usuario',

    email:
      actor.email ||
      '',

    role:
      actor.role ||
      '',

    gymId:
      actor.gymId ||
      null

  };

};


// ======================================================
// LEER TODOS LOS REGISTROS
// ======================================================

const getAllBlacklist = () => {

  try {

    const raw =
      localStorage.getItem(
        BLACKLIST_KEY
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
      'Error leyendo lista negra:',
      error
    );


    return [];

  }

};


// ======================================================
// GUARDAR TODOS LOS REGISTROS
// ======================================================

const saveAllBlacklist = (
  records
) => {

  const safeRecords =
    Array.isArray(
      records
    )
      ? records
      : [];


  localStorage.setItem(
    BLACKLIST_KEY,
    JSON.stringify(
      safeRecords
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-blacklist-update'
    )
  );


  return safeRecords;

};


// ======================================================
// OBTENER LISTA NEGRA DEL GIMNASIO ACTUAL
// ======================================================

export const getBlacklist = () => {

  const records =
    getAllBlacklist();


  const {
    gymId
  } =
    getCurrentGymContext();


  // Legacy
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
// GUARDAR LISTA NEGRA DEL GIMNASIO ACTUAL
// ======================================================

export const saveBlacklist = (
  records
) => {

  const safeRecords =
    Array.isArray(
      records
    )
      ? records
      : [];


  const {
    gymId,
    gymCode,
    gymName
  } =
    getCurrentGymContext();


  // ====================================================
  // LEGACY
  // ====================================================

  if (!gymId) {

    return saveAllBlacklist(
      safeRecords
    );

  }


  const allRecords =
    getAllBlacklist();


  const otherGyms =
    allRecords.filter(
      record =>
        record?.gymId !==
        gymId
    );


  const normalized =
    safeRecords.map(
      record => ({

        ...record,

        gymId,

        gymCode:
          record?.gymCode ||
          gymCode ||
          null,

        gymName:
          record?.gymName ||
          gymName ||
          null

      })
    );


  saveAllBlacklist([
    ...otherGyms,
    ...normalized
  ]);


  return normalized;

};


// ======================================================
// REGISTROS ACTIVOS
// ======================================================

export const getActiveBlacklist = () =>

  getBlacklist()
    .filter(
      record =>
        record?.status !==
        'cleared'
    );


// ======================================================
// COMPARAR REGISTRO CON MIEMBRO
// ======================================================

const recordMatchesMember = (
  record,
  member
) => {

  if (
    !record ||
    !member
  ) {

    return false;

  }


  if (
    record.previousMemberId ===
    member.id
  ) {

    return true;

  }


  const memberPhone =
    normalizePhone(
      member.phone
    );


  const recordPhone =
    normalizePhone(
      record.phone
    );


  if (
    memberPhone &&
    recordPhone &&
    memberPhone ===
    recordPhone
  ) {

    return true;

  }


  const memberEmail =
    normalizeEmail(
      member.email
    );


  const recordEmail =
    normalizeEmail(
      record.email
    );


  if (
    memberEmail &&
    recordEmail &&
    memberEmail ===
    recordEmail
  ) {

    return true;

  }


  return false;

};


// ======================================================
// BUSCAR REGISTRO DEL MIEMBRO
// ======================================================

export const findBlacklistRecordByMember = (
  member
) => {

  if (!member) {

    return null;

  }


  return (
    getBlacklist().find(
      record =>
        recordMatchesMember(
          record,
          member
        )
    ) ||
    null
  );

};


// ======================================================
// AGREGAR / ACTUALIZAR LISTA NEGRA
// ======================================================

export const addMemberToBlacklist = ({
  member,
  reason,
  source = 'deleted',
  actor = null,
  notes = ''
}) => {

  if (!member?.id) {

    throw new Error(
      'No se recibió un miembro válido para la lista negra.'
    );

  }


  const cleanReason =
    String(
      reason ||
      ''
    ).trim();


  if (!cleanReason) {

    throw new Error(
      'Debes indicar un motivo para agregar al miembro a la lista negra.'
    );

  }


  const {
    gymId,
    gymCode,
    gymName
  } =
    getCurrentGymContext();


  // ====================================================
  // SEGURIDAD
  // ====================================================

  if (
    gymId &&
    member?.gymId &&
    member.gymId !==
    gymId
  ) {

    throw new Error(
      'No puedes agregar a lista negra un miembro de otro gimnasio.'
    );

  }


  const records =
    getBlacklist();


  const now =
    new Date()
      .toISOString();


  const existingIndex =
    records.findIndex(
      record =>
        recordMatchesMember(
          record,
          member
        )
    );


  const previousRecord =
    existingIndex >=
    0
      ? records[
          existingIndex
        ]
      : null;


  const previousHistory =
    Array.isArray(
      previousRecord?.history
    )
      ? previousRecord.history
      : [];


  const historyEvent = {

    id:
      createEventId(),

    type:
      source ===
      'blocked'
        ? 'blocked'
        : source ===
          'deleted'
          ? 'deleted'
          : source,

    source,

    reason:
      cleanReason,

    notes:
      String(
        notes ||
        ''
      ).trim(),

    date:
      now,

    actor:
      normalizeActor(
        actor
      )

  };


  const entry = {

    ...(previousRecord || {}),

    id:
      previousRecord?.id ||
      createId(),

    gymId:
      member?.gymId ||
      gymId ||
      null,

    gymCode:
      member?.gymCode ||
      gymCode ||
      null,

    gymName:
      member?.gymName ||
      gymName ||
      null,

    previousMemberId:
      member.id,

    firstName:
      member.firstName ||
      '',

    lastName:
      member.lastName ||
      '',

    fullName:
      `${member.firstName || ''} ${member.lastName || ''}`
        .trim(),

    phone:
      member.phone ||
      '',

    email:
      member.email ||
      '',

    birthDate:
      member.birthDate ||
      '',

    profilePhoto:
      member.profilePhoto ||
      member.profilePhotoUrl ||
      previousRecord?.profilePhoto ||
      null,

    reason:
      cleanReason,

    notes:
      String(
        notes ||
        ''
      ).trim(),

    source,

    status:
      'active',

    addedAt:
      previousRecord?.addedAt ||
      now,

    updatedAt:
      now,

    addedBy:
      previousRecord?.addedBy ||
      normalizeActor(
        actor
      ),

    lastActionBy:
      normalizeActor(
        actor
      ),

    clearedAt:
      null,

    clearedNote:
      '',

    clearedBy:
      null,

    history: [
      ...previousHistory,
      historyEvent
    ],

    lastMemberSnapshot: {

      id:
        member.id,

      gymId:
        member?.gymId ||
        gymId ||
        null,

      firstName:
        member.firstName ||
        '',

      lastName:
        member.lastName ||
        '',

      phone:
        member.phone ||
        '',

      email:
        member.email ||
        '',

      profilePhoto:
        member.profilePhoto ||
        member.profilePhotoUrl ||
        null,

      registrationDate:
        member.registrationDate ||
        member.createdAt ||
        null,

      status:
        member.status ||
        '',

      accessBlocked:
        member.accessBlocked ===
        true,

      blockReason:
        member.blockReason ||
        '',

      blockedAt:
        member.blockedAt ||
        null,

      promotionProfile:
        member.promotionProfile ||
        null

    }

  };


  if (
    existingIndex >=
    0
  ) {

    records[
      existingIndex
    ] =
      entry;

  } else {

    records.unshift(
      entry
    );

  }


  saveBlacklist(
    records
  );


  return entry;

};


// ======================================================
// MARCAR REGISTRO COMO RESUELTO
// ======================================================

export const clearBlacklistRecord = ({
  blacklistId,
  actor = null,
  note = ''
}) => {

  const records =
    getBlacklist();


  const index =
    records.findIndex(
      record =>
        record.id ===
        blacklistId
    );


  if (
    index <
    0
  ) {

    throw new Error(
      'No se encontró el registro de lista negra.'
    );

  }


  const now =
    new Date()
      .toISOString();


  const previousHistory =
    Array.isArray(
      records[
        index
      ]?.history
    )
      ? records[
          index
        ].history
      : [];


  records[
    index
  ] = {

    ...records[
      index
    ],

    status:
      'cleared',

    clearedAt:
      now,

    clearedNote:
      String(
        note ||
        ''
      ).trim(),

    clearedBy:
      normalizeActor(
        actor
      ),

    updatedAt:
      now,

    history: [
      ...previousHistory,
      {

        id:
          createEventId(),

        type:
          'cleared',

        source:
          'unblocked',

        reason:
          String(
            note ||
            'Bloqueo retirado'
          ).trim(),

        date:
          now,

        actor:
          normalizeActor(
            actor
          )

      }
    ]

  };


  saveBlacklist(
    records
  );


  return records[
    index
  ];

};


// ======================================================
// RESOLVER POR MIEMBRO
// ======================================================

export const clearBlacklistByMember = ({
  member,
  actor = null,
  note = 'Bloqueo retirado por administrador'
}) => {

  if (!member?.id) {

    return null;

  }


  const records =
    getBlacklist();


  const index =
    records.findIndex(
      record =>
        record?.status !==
          'cleared' &&
        recordMatchesMember(
          record,
          member
        )
    );


  if (
    index <
    0
  ) {

    return null;

  }


  return clearBlacklistRecord({

    blacklistId:
      records[
        index
      ].id,

    actor,

    note

  });

};


// ======================================================
// REACTIVAR REGISTRO
// ======================================================

export const reactivateBlacklistRecord = ({
  blacklistId,
  actor = null,
  reason = ''
}) => {

  const records =
    getBlacklist();


  const index =
    records.findIndex(
      record =>
        record.id ===
        blacklistId
    );


  if (
    index <
    0
  ) {

    throw new Error(
      'No se encontró el registro de lista negra.'
    );

  }


  const now =
    new Date()
      .toISOString();


  const cleanReason =
    String(
      reason ||
      records[
        index
      ].reason ||
      ''
    ).trim();


  const previousHistory =
    Array.isArray(
      records[
        index
      ]?.history
    )
      ? records[
          index
        ].history
      : [];


  records[
    index
  ] = {

    ...records[
      index
    ],

    status:
      'active',

    reason:
      cleanReason,

    updatedAt:
      now,

    reactivatedBy:
      normalizeActor(
        actor
      ),

    clearedAt:
      null,

    clearedNote:
      '',

    clearedBy:
      null,

    history: [
      ...previousHistory,
      {

        id:
          createEventId(),

        type:
          'reactivated',

        source:
          'reactivated',

        reason:
          cleanReason,

        date:
          now,

        actor:
          normalizeActor(
            actor
          )

      }
    ]

  };


  saveBlacklist(
    records
  );


  return records[
    index
  ];

};


// ======================================================
// BUSCAR COINCIDENCIAS
// ======================================================

export const findBlacklistMatches = ({
  firstName = '',
  lastName = '',
  phone = '',
  email = ''
} = {}) => {

  const active =
    getActiveBlacklist();


  const inputPhone =
    normalizePhone(
      phone
    );


  const inputEmail =
    normalizeEmail(
      email
    );


  const inputFullName =
    normalizeText(
      `${firstName} ${lastName}`
    );


  return active
    .map(
      record => {

        const matchedBy =
          [];

        let score =
          0;


        const recordPhone =
          normalizePhone(
            record?.phone
          );


        const recordEmail =
          normalizeEmail(
            record?.email
          );


        const recordName =
          normalizeText(
            record?.fullName ||
            `${record?.firstName || ''} ${record?.lastName || ''}`
          );


        if (
          inputPhone &&
          recordPhone &&
          inputPhone ===
          recordPhone
        ) {

          matchedBy.push(
            'teléfono'
          );


          score +=
            100;

        }


        if (
          inputEmail &&
          recordEmail &&
          inputEmail ===
          recordEmail
        ) {

          matchedBy.push(
            'correo'
          );


          score +=
            100;

        }


        if (
          inputFullName &&
          recordName &&
          inputFullName ===
          recordName
        ) {

          matchedBy.push(
            'nombre'
          );


          score +=
            35;

        }


        return {

          ...record,

          matchedBy,

          matchScore:
            score

        };

      }
    )
    .filter(
      record =>
        record.matchScore >
        0
    )
    .sort(
      (
        a,
        b
      ) =>
        b.matchScore -
        a.matchScore
    );

};


// ======================================================
// COINCIDENCIA FUERTE
// ======================================================

export const hasStrongBlacklistMatch = (
  matches = []
) =>

  Array.isArray(
    matches
  ) &&

  matches.some(
    match =>
      Number(
        match.matchScore ||
        0
      ) >=
      100
  );