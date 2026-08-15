// src/services/couplePromotionService.js

import {
  getNextMemberId
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
// OBTENER DOS IDS CONSECUTIVOS SIN CONFIRMARLOS TODAVÍA
// ======================================================

export const getNextCoupleMemberIds = () => {

  const firstId =
    getNextMemberId();

  const match =
    String(
      firstId ||
      ''
    ).match(
      /^GYM-(\d{5})$/
    );

  if (!match) {
    throw new Error(
      'No se pudo generar el ID inicial de la pareja.'
    );
  }

  const firstNumber =
    Number(
      match[1]
    );

  const secondId =
    `GYM-${String(
      firstNumber + 1
    ).padStart(
      5,
      '0'
    )}`;

  return [
    firstId,
    secondId
  ];

};


// ======================================================
// DIVIDIR EL TOTAL DE LA PAREJA ENTRE DOS
// ======================================================
// Evita errores de centavos. Ejemplo $651 -> 325.50 + 325.50.
// Si hubiera un centavo impar, el segundo recibe la diferencia.
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
    members.length !== 2
  ) {
    throw new Error(
      'La promoción de pareja requiere exactamente dos miembros.'
    );
  }

  const [
    first,
    second
  ] = members;

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
          `${second.firstName || ''} ${second.lastName || ''}`.trim()
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
          `${first.firstName || ''} ${first.lastName || ''}`.trim()
      }
    }
  ];

};
