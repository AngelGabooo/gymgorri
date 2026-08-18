// src/utils/subscriptionDateUtils.js

// ======================================================
// NEXGYM - FECHAS DE SUSCRIPCIÓN
// ======================================================
//
// REGLA COMERCIAL OFICIAL:
//
// 7 días:
//   18 ago -> 25 ago, vence 11:59:59 p. m.
//
// 15 días:
//   18 ago -> 02 sep, vence 11:59:59 p. m.
//
// Mensual:
//   18 ago -> 18 sep, vence 11:59:59 p. m.
//
// Anual:
//   18 ago 2026 -> 18 ago 2027, vence 11:59:59 p. m.
//
// IMPORTANTE:
// El plan mensual conserva el mismo día del mes siguiente.
// El anual conserva el mismo día del año siguiente.
// Los planes de 7 y 15 días suman exactamente su duración.
//
// ======================================================


const DAY_MS =
  24 *
  60 *
  60 *
  1000;


const MONTHS = {
  ene: 0,
  enero: 0,

  feb: 1,
  febrero: 1,

  mar: 2,
  marzo: 2,

  abr: 3,
  abril: 3,

  may: 4,
  mayo: 4,

  jun: 5,
  junio: 5,

  jul: 6,
  julio: 6,

  ago: 7,
  agosto: 7,

  sep: 8,
  sept: 8,
  septiembre: 8,

  oct: 9,
  octubre: 9,

  nov: 10,
  noviembre: 10,

  dic: 11,
  diciembre: 11
};


const SHORT_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic'
];


// ======================================================
// CLONAR FECHA
// ======================================================

const cloneValidDate = (
  value
) => {

  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {

    return new Date(
      value
    );

  }


  return null;

};


// ======================================================
// PARSEAR FECHA
// ======================================================

export const parseSubscriptionDate = (
  value
) => {

  if (!value) {

    return null;

  }


  const cloned =
    cloneValidDate(
      value
    );


  if (cloned) {

    return cloned;

  }


  const text =
    String(
      value
    )
      .trim();


  if (!text) {

    return null;

  }


  // ----------------------------------------------------
  // YYYY-MM-DD
  // ----------------------------------------------------

  const isoDateOnly =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );


  if (
    isoDateOnly
  ) {

    const [
      ,
      year,
      month,
      day
    ] =
      isoDateOnly;


    const parsed =
      new Date(
        Number(
          year
        ),
        Number(
          month
        ) -
          1,
        Number(
          day
        ),
        12,
        0,
        0,
        0
      );


    return Number.isNaN(
      parsed.getTime()
    )
      ? null
      : parsed;

  }


  // ----------------------------------------------------
  // ISO / timestamp
  // ----------------------------------------------------

  const direct =
    new Date(
      text
    );


  if (
    !Number.isNaN(
      direct.getTime()
    )
  ) {

    return direct;

  }


  // ----------------------------------------------------
  // "18 ago 2026"
  // "18 agosto 2026"
  // ----------------------------------------------------

  const parts =
    text
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/,/g, '')
      .replace(/\s+/g, ' ')
      .split(' ');


  if (
    parts.length !==
    3
  ) {

    return null;

  }


  const day =
    Number(
      parts[0]
    );

  const month =
    MONTHS[
      parts[1]
    ];

  const year =
    Number(
      parts[2]
    );


  if (
    Number.isNaN(
      day
    ) ||
    month ===
      undefined ||
    Number.isNaN(
      year
    )
  ) {

    return null;

  }


  const parsed =
    new Date(
      year,
      month,
      day,
      12,
      0,
      0,
      0
    );


  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;

};


// ======================================================
// INICIO DEL DÍA
// ======================================================

export const startOfSubscriptionDay = (
  value
) => {

  const date =
    parseSubscriptionDate(
      value
    );


  if (!date) {

    return null;

  }


  date.setHours(
    0,
    0,
    0,
    0
  );


  return date;

};


// ======================================================
// FIN DEL DÍA - 11:59:59.999 p. m.
// ======================================================

export const endOfSubscriptionDay = (
  value
) => {

  const date =
    parseSubscriptionDate(
      value
    );


  if (!date) {

    return null;

  }


  date.setHours(
    23,
    59,
    59,
    999
  );


  return date;

};


// ======================================================
// SUMAR MESES CONSERVANDO EL DÍA
// ======================================================
//
// 31 ene + 1 mes -> último día válido de febrero.
//
// ======================================================

const addCalendarMonths = (
  value,
  months
) => {

  const date =
    parseSubscriptionDate(
      value
    );


  if (!date) {

    return null;

  }


  const originalDay =
    date.getDate();


  date.setDate(
    1
  );


  date.setMonth(
    date.getMonth() +
    Number(
      months ||
      0
    )
  );


  const lastDay =
    new Date(
      date.getFullYear(),
      date.getMonth() +
        1,
      0
    )
      .getDate();


  date.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );


  return date;

};


// ======================================================
// SUMAR AÑOS CONSERVANDO EL DÍA
// ======================================================

const addCalendarYears = (
  value,
  years
) => {

  const date =
    parseSubscriptionDate(
      value
    );


  if (!date) {

    return null;

  }


  const originalMonth =
    date.getMonth();

  const originalDay =
    date.getDate();


  date.setDate(
    1
  );


  date.setFullYear(
    date.getFullYear() +
    Number(
      years ||
      0
    )
  );


  date.setMonth(
    originalMonth
  );


  const lastDay =
    new Date(
      date.getFullYear(),
      originalMonth +
        1,
      0
    )
      .getDate();


  date.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );


  return date;

};


// ======================================================
// CALCULAR VENCIMIENTO
// ======================================================

export const calculateSubscriptionEndDate = (
  startValue,
  plan
) => {

  const start =
    parseSubscriptionDate(
      startValue
    );


  if (!start) {

    throw new Error(
      'La fecha de inicio de la suscripción no es válida.'
    );

  }


  start.setHours(
    12,
    0,
    0,
    0
  );


  const planId =
    String(
      plan?.id ||
      plan?.planId ||
      ''
    )
      .trim()
      .toLowerCase();


  let end =
    null;


  // ====================================================
  // MENSUAL
  // 18 AGO -> 18 SEP
  // ====================================================

  if (
    planId ===
      'mensual' ||
    planId ===
      'monthly'
  ) {

    end =
      addCalendarMonths(
        start,
        1
      );

  }

  // ====================================================
  // ANUAL
  // 18 AGO 2026 -> 18 AGO 2027
  // ====================================================

  else if (
    planId ===
      'anual' ||
    planId ===
      'annual' ||
    planId ===
      'yearly'
  ) {

    end =
      addCalendarYears(
        start,
        1
      );

  }

  // ====================================================
  // PLANES POR DÍAS
  // 18 AGO + 7  -> 25 AGO
  // 18 AGO + 15 -> 02 SEP
  // ====================================================

  else {

    const days =
      Math.max(
        0,
        Number(
          plan?.days ||
          0
        )
      );


    end =
      new Date(
        start
      );


    end.setDate(
      end.getDate() +
      days
    );

  }


  if (!end) {

    throw new Error(
      'No se pudo calcular la fecha de vencimiento.'
    );

  }


  end.setHours(
    23,
    59,
    59,
    999
  );


  return end;

};


// ======================================================
// FORMATEAR FECHA CORTA
// ======================================================

export const formatSubscriptionDate = (
  value
) => {

  const date =
    parseSubscriptionDate(
      value
    );


  if (!date) {

    return '';

  }


  const day =
    String(
      date.getDate()
    )
      .padStart(
        2,
        '0'
      );


  const month =
    SHORT_MONTHS[
      date.getMonth()
    ];


  const year =
    date.getFullYear();


  return (
    `${day} ${month} ${year}`
  );

};


// ======================================================
// SUSCRIPCIÓN ACTIVA
// ======================================================

export const isSubscriptionActiveAt = (
  endValue,
  now = new Date()
) => {

  const end =
    endOfSubscriptionDay(
      endValue
    );


  if (!end) {

    return false;

  }


  return (
    now.getTime() <=
    end.getTime()
  );

};


// ======================================================
// DÍAS RESTANTES PARA MOSTRAR EN UI
// ======================================================
//
// Esta función respeta la duración comercial del plan.
//
// Ejemplo mensual:
// 18 ago, plan.days = 30 -> muestra 30.
// La fecha de vencimiento puede ser 18 sep por la regla
// comercial de "mismo día del mes siguiente".
//
// En el último día puede mostrar 0 aunque el acceso siga
// válido hasta las 11:59:59 p. m.; "0" significa que ya no
// quedan días completos después del día actual.
//
// ======================================================

export const getSubscriptionDaysRemaining = ({
  startDate,
  endDate,
  planDays = 0,
  now = new Date()
} = {}) => {

  const end =
    endOfSubscriptionDay(
      endDate
    );


  if (
    !end ||
    now.getTime() >
      end.getTime()
  ) {

    return 0;

  }


  const start =
    startOfSubscriptionDay(
      startDate
    );


  const today =
    startOfSubscriptionDay(
      now
    );


  const configuredDays =
    Math.max(
      0,
      Number(
        planDays ||
        0
      )
    );


  if (
    start &&
    today &&
    configuredDays >
      0
  ) {

    const elapsed =
      Math.max(
        0,
        Math.floor(
          (
            today.getTime() -
            start.getTime()
          ) /
          DAY_MS
        )
      );


    return Math.max(
      0,
      configuredDays -
      elapsed
    );

  }


  // Fallback para registros antiguos que no tengan days/startDate.
  const remainingMs =
    end.getTime() -
    now.getTime();


  return Math.max(
    0,
    Math.ceil(
      remainingMs /
      DAY_MS
    )
  );

};


// ======================================================
// EXPORT DEFAULT
// ======================================================

export default {

  parse:
    parseSubscriptionDate,

  startOfDay:
    startOfSubscriptionDay,

  endOfDay:
    endOfSubscriptionDay,

  calculateEndDate:
    calculateSubscriptionEndDate,

  format:
    formatSubscriptionDate,

  isActive:
    isSubscriptionActiveAt,

  getDaysRemaining:
    getSubscriptionDaysRemaining

};
