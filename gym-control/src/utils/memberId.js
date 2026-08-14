// src/utils/memberId.js

const MEMBER_COUNTER_KEY =
  'gym_control_member_counter';

const MEMBERS_STORAGE_KEY =
  'gym_control_members';


// ======================================================
// OBTENER MIEMBROS
// ======================================================

export const getStoredMembers = () => {
  try {
    const data =
      localStorage.getItem(
        MEMBERS_STORAGE_KEY
      );

    if (!data) {
      return [];
    }

    const parsed =
      JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {
    console.error(
      'Error leyendo miembros:',
      error
    );

    return [];
  }
};


// ======================================================
// GENERAR SIGUIENTE ID
// ======================================================

export const getNextMemberId = () => {
  const members =
    getStoredMembers();


  let highest = -1;


  members.forEach((member) => {
    const match =
      String(
        member?.id || ''
      ).match(
        /^GYM-(\d{5})$/
      );


    if (match) {
      highest =
        Math.max(
          highest,
          Number(match[1])
        );
    }
  });


  const counterValue =
    localStorage.getItem(
      MEMBER_COUNTER_KEY
    );


  if (counterValue !== null) {
    const numericCounter =
      Number(counterValue);


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


  const next =
    highest + 1;


  return `GYM-${String(next).padStart(
    5,
    '0'
  )}`;
};


// ======================================================
// CONFIRMAR ID
// ======================================================

export const confirmMemberId = (
  memberId
) => {
  const numeric =
    Number(
      String(memberId)
        .replace(
          'GYM-',
          ''
        )
    );


  if (
    Number.isNaN(numeric)
  ) {
    console.error(
      'ID inválido:',
      memberId
    );

    return;
  }


  localStorage.setItem(
    MEMBER_COUNTER_KEY,
    String(numeric)
  );
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
    Date.now().toString(36) +
    '-' +
    Math.random()
      .toString(36)
      .substring(2)
  );
};


// ======================================================
// SHA-256
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
      String(value)
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
      (byte) =>
        byte
          .toString(16)
          .padStart(2, '0')
    )
    .join('');
};


// ======================================================
// PIN AUTOMÁTICO ÚNICO
// ======================================================
//
// RegisterQRPage espera:
//
// {
//    pin,
//    pinHash
// }
//
// ======================================================

export const generateUniquePin =
  async () => {

    const members =
      getStoredMembers();


    // Como guardamos pinHash y no el PIN plano,
    // verificamos la unicidad mediante su hash.
    const existingHashes =
      new Set(
        members
          .map(
            (member) =>
              member
                ?.access
                ?.pin
                ?.pinHash
          )
          .filter(Boolean)
      );


    let attempts = 0;


    while (
      attempts <
      100
    ) {
      attempts += 1;


      const random =
        new Uint32Array(1);


      window.crypto.getRandomValues(
        random
      );


      const pin =
        String(
          random[0] %
          1000000
        ).padStart(
          6,
          '0'
        );


      const pinHash =
        await hashValue(pin);


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


  const members =
    getStoredMembers();


  const index =
    members.findIndex(
      (item) =>
        item.id === member.id
    );


  if (index >= 0) {
    members[index] =
      member;
  } else {
    members.push(member);
  }


  localStorage.setItem(
    MEMBERS_STORAGE_KEY,
    JSON.stringify(
      members
    )
  );


  confirmMemberId(
    member.id
  );


  return member;
};


// ======================================================
// BUSCAR MIEMBRO
// ======================================================

export const getMemberById = (
  memberId
) => {
  return (
    getStoredMembers().find(
      (member) =>
        member.id ===
        memberId
    ) || null
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
      (member) =>
        member.id ===
          memberId &&
        member
          ?.access
          ?.qr
          ?.enabled === true &&
        member
          ?.access
          ?.qr
          ?.token === token
    ) || null
  );
};