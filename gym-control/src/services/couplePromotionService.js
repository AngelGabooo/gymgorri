// src/services/couplePromotionService.js

import {
  getNextMemberIds
} from '../utils/memberId';


// ======================================================
// CREAR ID DE GRUPO PARA LA PAREJA
// ======================================================

export const createCoupleGroupId = () => {

  if (
    window.crypto?.randomUUID
  ) {

    return `COUPLE-${window.crypto.randomUUID()}`;

  }


  return (
    `COUPLE-${Date.now()}-` +
    Math.random()
      .toString(36)
      .substring(
        2,
        10
      )
  );

};


// ======================================================
// OBTENER DOS IDS CONSECUTIVOS
// ======================================================
//
// memberId.js ya trabaja con el gymId actual.
//
// Por lo tanto:
//
// Power Gym:
//
// GYM-00001
// GYM-00002
//
// Titan Gym:
//
// GYM-00001
// GYM-00002
//
// ======================================================

export const getNextCoupleMemberIds = () => {

  const ids =
    getNextMemberIds(
      2
    );


  if (
    !Array.isArray(
      ids
    ) ||
    ids.length !==
    2
  ) {

    throw new Error(
      'No se pudieron generar los IDs para la pareja.'
    );

  }


  return ids;

};


// ======================================================
// DIVIDIR EL TOTAL DE LA PAREJA ENTRE DOS
// ======================================================

export const splitCoupleTotal = (
  total
) => {

  const cents =
    Math.round(
      Number(
        total ||
        0
      ) *
      100
    );


  const firstCents =
    Math.floor(
      cents /
      2
    );


  const secondCents =
    cents -
    firstCents;


  return [

    firstCents /
      100,

    secondCents /
      100

  ];

};


// ======================================================
// CREAR VÍNCULO ENTRE LOS DOS MIEMBROS
// ======================================================

export const linkCoupleMembers = ({
  members,
  groupId
}) => {

  if (
    !Array.isArray(
      members
    ) ||
    members.length !==
    2
  ) {

    throw new Error(
      'La promoción de pareja requiere exactamente dos miembros.'
    );

  }


  if (!groupId) {

    throw new Error(
      'No se recibió un ID válido para el grupo de pareja.'
    );

  }


  const [
    first,
    second
  ] =
    members;


  if (
    !first?.id ||
    !second?.id
  ) {

    throw new Error(
      'Ambas personas deben contar con un ID de miembro.'
    );

  }


  return [

    {
      ...first,

      registrationCategory:
        'couple',

      promotionProfile: {

        id:
          'couple',

        label:
          'Pareja',

        groupId,

        partnerMemberId:
          second.id,

        partnerName:
          `${second.firstName || ''} ${second.lastName || ''}`
            .trim()

      }
    },


    {
      ...second,

      registrationCategory:
        'couple',

      promotionProfile: {

        id:
          'couple',

        label:
          'Pareja',

        groupId,

        partnerMemberId:
          first.id,

        partnerName:
          `${first.firstName || ''} ${first.lastName || ''}`
            .trim()

      }
    }

  ];

};