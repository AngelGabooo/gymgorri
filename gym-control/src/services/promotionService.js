// src/services/promotionService.js

// ======================================================
// UTILIDADES
// ======================================================

const clamp = (
  value,
  min,
  max
) => {

  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );

};


const roundMoney = (
  value
) => {

  return Math.round(
    (
      Number(
        value ||
        0
      ) +
      Number.EPSILON
    ) *
    100
  ) /
  100;

};


// ======================================================
// OBTENER PROMOCIÓN
// ======================================================

export const getPromotionById = (
  settings,
  promotionId
) => {

  if (!promotionId) {
    return null;
  }

  const promotions =
    settings?.promotions ||
    {};

  return (
    Object.values(
      promotions
    ).find(
      promotion =>
        promotion?.id ===
        promotionId
    ) ||
    null
  );

};


// ======================================================
// PROMOCIONES DISPONIBLES PARA UN PLAN
// ======================================================

export const getAvailablePromotions = (
  settings,
  planId,
  options = {}
) => {

  const promotions =
    settings?.promotions ||
    {};

  const includeCouple =
    options?.includeCouple ===
    true;

  return Object.values(
    promotions
  ).filter(
    promotion => {

      // La promoción de pareja tiene un flujo propio porque
      // registra exactamente dos personas y el precio fijo
      // representa el total del combo, no el precio individual.
      if (
        promotion?.id ===
          'couple' &&
        !includeCouple
      ) {
        return false;
      }

      if (
        promotion?.enabled !==
        true
      ) {
        return false;
      }

      const planConfig =
        promotion
          ?.plans
          ?.[planId];

      return (
        planConfig?.enabled ===
        true
      );

    }
  );

};


// ======================================================
// CALCULAR PRECIO FINAL NORMAL (1 PERSONA)
// ======================================================

export const calculatePromotionPrice = ({
  settings,
  plan,
  promotionId
}) => {

  const originalPrice =
    roundMoney(
      Number(
        plan?.price ||
        0
      )
    );

  const noPromotion = {
    promotion: null,
    originalPrice,
    finalPrice: originalPrice,
    discountAmount: 0,
    discountPercent: 0,
    isCourtesy: false,
    applied: false,
    label: 'Sin promoción'
  };

  if (!promotionId) {
    return noPromotion;
  }

  const promotion =
    getPromotionById(
      settings,
      promotionId
    );

  if (
    !promotion ||
    promotion.enabled !== true
  ) {
    return noPromotion;
  }

  const planId =
    plan?.id;

  const planConfig =
    promotion
      ?.plans
      ?.[planId];

  if (
    !planConfig ||
    planConfig.enabled !== true
  ) {
    return noPromotion;
  }

  const type =
    planConfig.type ||
    promotion.type ||
    'percentage';

  const value =
    Number(
      planConfig.value ||
      0
    );

  let finalPrice =
    originalPrice;

  let discountAmount =
    0;

  let discountPercent =
    0;

  if (
    type ===
    'percentage'
  ) {

    discountPercent =
      clamp(
        value,
        0,
        100
      );

    discountAmount =
      roundMoney(
        originalPrice *
        (
          discountPercent /
          100
        )
      );

    finalPrice =
      roundMoney(
        originalPrice -
        discountAmount
      );

  } else if (
    type ===
    'fixed_price'
  ) {

    finalPrice =
      roundMoney(
        Math.max(
          0,
          value
        )
      );

    if (
      finalPrice >
      originalPrice
    ) {
      finalPrice =
        originalPrice;
    }

    discountAmount =
      roundMoney(
        originalPrice -
        finalPrice
      );

    discountPercent =
      originalPrice > 0
        ? roundMoney(
            (
              discountAmount /
              originalPrice
            ) *
            100
          )
        : 0;
  }

  const isCourtesy =
    promotion.id ===
      'courtesy' ||
    finalPrice ===
      0;

  return {
    promotion: {
      id: promotion.id,
      label: promotion.label,
      type,
      value,
      planId,
      pricingScope:
        promotion.pricingScope ||
        'per_person',
      referenceRequired:
        promotion.referenceRequired ===
        true
    },
    originalPrice,
    finalPrice,
    discountAmount,
    discountPercent,
    isCourtesy,
    applied:
      discountAmount > 0 ||
      isCourtesy,
    label:
      promotion.label
  };

};


// ======================================================
// CALCULAR PROMOCIÓN DE PAREJA
// ======================================================
//
// REGLA:
// - El precio base del plan sigue siendo POR PERSONA.
// - El valor configurado en Settings para Pareja cuando
//   es fixed_price representa EL TOTAL POR LAS 2 PERSONAS.
// - Si es porcentaje, se aplica sobre el total normal.
//
// Ejemplo:
// plan mensual = $550 por persona
// normal pareja = $1,100
// Settings Pareja mensual = $650 fixed_price
// total pareja = $650
// asignación contable = $325 por persona
// ======================================================

export const calculateCouplePromotionPrice = ({
  settings,
  plan,
  memberCount = 2
}) => {

  const count =
    Math.max(
      2,
      Number(
        memberCount ||
        2
      )
    );

  const promotion =
    getPromotionById(
      settings,
      'couple'
    );

  const originalPerPerson =
    roundMoney(
      Number(
        plan?.price ||
        0
      )
    );

  const originalTotal =
    roundMoney(
      originalPerPerson *
      count
    );

  const planConfig =
    promotion
      ?.plans
      ?.[plan?.id];

  const fallback = {
    promotion: null,
    memberCount: count,
    originalPerPerson,
    originalTotal,
    finalTotal: originalTotal,
    finalPerPerson:
      roundMoney(
        originalTotal /
        count
      ),
    discountTotal: 0,
    discountPerPerson: 0,
    discountPercent: 0,
    applied: false,
    isCourtesy: false
  };

  if (
    !promotion ||
    promotion.enabled !== true ||
    !planConfig ||
    planConfig.enabled !== true
  ) {
    return fallback;
  }

  const type =
    planConfig.type ||
    'fixed_price';

  const configuredValue =
    Number(
      planConfig.value ||
      0
    );

  let finalTotal =
    originalTotal;

  let discountTotal =
    0;

  let discountPercent =
    0;

  if (
    type ===
    'percentage'
  ) {

    discountPercent =
      clamp(
        configuredValue,
        0,
        100
      );

    discountTotal =
      roundMoney(
        originalTotal *
        (
          discountPercent /
          100
        )
      );

    finalTotal =
      roundMoney(
        originalTotal -
        discountTotal
      );

  } else {

    // IMPORTANTE:
    // fixed_price para Pareja = TOTAL DE LAS DOS PERSONAS.
    finalTotal =
      roundMoney(
        Math.max(
          0,
          configuredValue
        )
      );

    // Evitamos que una "promoción" suba el precio normal.
    if (
      finalTotal >
      originalTotal
    ) {
      finalTotal =
        originalTotal;
    }

    discountTotal =
      roundMoney(
        originalTotal -
        finalTotal
      );

    discountPercent =
      originalTotal > 0
        ? roundMoney(
            (
              discountTotal /
              originalTotal
            ) *
            100
          )
        : 0;
  }

  const finalPerPerson =
    roundMoney(
      finalTotal /
      count
    );

  const discountPerPerson =
    roundMoney(
      originalPerPerson -
      finalPerPerson
    );

  return {
    promotion: {
      id: 'couple',
      label:
        promotion.label ||
        'Pareja',
      type,
      value:
        configuredValue,
      planId:
        plan?.id,
      pricingScope:
        'pair_total',
      referenceRequired:
        promotion.referenceRequired ===
        true
    },
    memberCount: count,
    originalPerPerson,
    originalTotal,
    finalTotal,
    finalPerPerson,
    discountTotal,
    discountPerPerson,
    discountPercent,
    applied:
      discountTotal > 0,
    isCourtesy:
      finalTotal === 0
  };

};


// ======================================================
// SNAPSHOT NORMAL
// ======================================================

export const buildPromotionSnapshot = (
  pricing,
  reference =
    ''
) => {

  if (
    !pricing?.promotion
  ) {
    return null;
  }

  return {
    ...pricing.promotion,
    reference:
      String(
        reference ||
        ''
      ).trim(),
    originalAmount:
      Number(
        pricing.originalPrice ||
        0
      ).toFixed(2),
    discountAmount:
      Number(
        pricing.discountAmount ||
        0
      ).toFixed(2),
    finalAmount:
      Number(
        pricing.finalPrice ||
        0
      ).toFixed(2)
  };

};


// ======================================================
// SNAPSHOT PAREJA
// ======================================================

export const buildCouplePromotionSnapshot = (
  pricing,
  reference =
    ''
) => {

  if (
    !pricing?.promotion
  ) {
    return null;
  }

  return {
    ...pricing.promotion,
    reference:
      String(
        reference ||
        ''
      ).trim(),
    memberCount:
      Number(
        pricing.memberCount ||
        2
      ),
    originalPerPerson:
      Number(
        pricing.originalPerPerson ||
        0
      ).toFixed(2),
    originalTotal:
      Number(
        pricing.originalTotal ||
        0
      ).toFixed(2),
    finalPerPerson:
      Number(
        pricing.finalPerPerson ||
        0
      ).toFixed(2),
    finalTotal:
      Number(
        pricing.finalTotal ||
        0
      ).toFixed(2),
    discountPerPerson:
      Number(
        pricing.discountPerPerson ||
        0
      ).toFixed(2),
    discountTotal:
      Number(
        pricing.discountTotal ||
        0
      ).toFixed(2)
  };

};
