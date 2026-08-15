// src/services/whatsappService.js

import {
  getCurrentSession
} from './authService';


export const WHATSAPP_HISTORY_KEY =
  'gym_control_whatsapp_history';


// ======================================================
// TIPOS DE MENSAJE
// ======================================================

export const WHATSAPP_TEMPLATE_TYPES = [
  {
    id: 'renewal',
    label: 'Renovación'
  },
  {
    id: 'expiring',
    label: 'Suscripción por vencer'
  },
  {
    id: 'expired',
    label: 'Suscripción vencida'
  },
  {
    id: 'inactive',
    label: 'Cliente inactivo'
  },
  {
    id: 'birthday',
    label: 'Cumpleaños'
  },
  {
    id: 'pendingPayment',
    label: 'Pago pendiente'
  },
  {
    id: 'promotion',
    label: 'Promoción'
  },
  {
    id: 'couple',
    label: 'Promoción de pareja'
  },
  {
    id: 'custom',
    label: 'Mensaje personalizado'
  }
];


// ======================================================
// UTILIDADES
// ======================================================

const createId = () => {

  if (
    window.crypto?.randomUUID
  ) {
    return `WA-${window.crypto.randomUUID()}`;
  }


  return (
    `WA-${Date.now()}-` +
    Math.random()
      .toString(36)
      .substring(2, 9)
  );

};


const normalizeDigits = (
  value = ''
) =>
  String(value)
    .replace(/\D/g, '');


export const normalizeWhatsAppPhone = (
  value,
  defaultCountryCode = '52'
) => {

  let digits =
    normalizeDigits(
      value
    );


  if (!digits) {
    return '';
  }


  // 00 + prefijo internacional
  if (
    digits.startsWith('00')
  ) {
    digits =
      digits.slice(2);
  }


  // Número mexicano típico de 10 dígitos.
  if (
    digits.length === 10 &&
    defaultCountryCode
  ) {
    digits =
      `${normalizeDigits(defaultCountryCode)}${digits}`;
  }


  return digits;

};


const parseGymDate = (
  value
) => {

  if (!value) {
    return null;
  }


  const direct =
    new Date(
      value
    );


  if (
    !Number.isNaN(
      direct.getTime()
    )
  ) {
    return direct;
  }


  const months = {
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


  const parts =
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\./g, '')
      .split(/\s+/);


  if (
    parts.length !== 3
  ) {
    return null;
  }


  const day =
    Number(parts[0]);

  const month =
    months[parts[1]];

  const year =
    Number(parts[2]);


  if (
    Number.isNaN(day) ||
    month === undefined ||
    Number.isNaN(year)
  ) {
    return null;
  }


  return new Date(
    year,
    month,
    day,
    23,
    59,
    59
  );

};


const formatDate = (
  value
) => {

  const date =
    parseGymDate(
      value
    );


  if (!date) {
    return value || '—';
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }
  ).format(
    date
  );

};


export const getDaysRemaining = (
  endDate
) => {

  const expiration =
    parseGymDate(
      endDate
    );


  if (!expiration) {
    return null;
  }


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  expiration.setHours(
    23,
    59,
    59,
    999
  );


  return Math.ceil(
    (
      expiration.getTime() -
      today.getTime()
    ) /
    (
      1000 *
      60 *
      60 *
      24
    )
  );

};


const formatMoney = (
  value,
  currency = 'MXN'
) => {

  const amount =
    Number(
      value ||
      0
    );


  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency:
        currency === 'USD'
          ? 'USD'
          : 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0
  );

};


// ======================================================
// CONTEXTO DEL MIEMBRO
// ======================================================

export const buildWhatsAppContext = ({
  member,
  settings,
  extras = {}
}) => {

  const subscription =
    member?.subscription ||
    {};


  const fullName =
    `${member?.firstName || ''} ${member?.lastName || ''}`
      .trim();


  const daysRemaining =
    extras.daysRemaining ??
    getDaysRemaining(
      subscription.endDate
    );


  const promotion =
    extras.promotion ||
    member?.promotionProfile?.label ||
    subscription?.promotion?.label ||
    '';


  return {
    nombre:
      member?.firstName ||
      '',

    apellido:
      member?.lastName ||
      '',

    nombreCompleto:
      fullName ||
      'Miembro',

    gimnasio:
      settings?.shortName ||
      settings?.gymName ||
      'GYM CONTROL',

    plan:
      subscription?.planLabel ||
      subscription?.plan ||
      extras.plan ||
      'suscripción',

    precio:
      formatMoney(
        extras.price ??
        subscription?.amount ??
        0,
        settings?.currency ||
        'MXN'
      ),

    fechaVencimiento:
      formatDate(
        subscription?.endDate ||
        extras.endDate
      ),

    diasRestantes:
      daysRemaining === null
        ? ''
        : String(
            daysRemaining
          ),

    promocion:
      promotion,

    idMiembro:
      member?.id ||
      '',

    telefono:
      member?.phone ||
      '',

    saldoPendiente:
      formatMoney(
        extras.pendingAmount ||
        0,
        settings?.currency ||
        'MXN'
      ),

    pareja:
      member?.promotionProfile?.partnerName ||
      extras.partnerName ||
      '',

    diasInactivo:
      String(
        extras.inactiveDays ??
        member?.retention?.daysWithoutAttendance ??
        ''
      )
  };

};


// ======================================================
// REEMPLAZAR VARIABLES
// ======================================================

export const renderWhatsAppTemplate = (
  template = '',
  context = {}
) => {

  return String(
    template ||
    ''
  ).replace(
    /\{([a-zA-ZÁÉÍÓÚáéíóúÑñ]+)\}/g,
    (
      match,
      key
    ) => {

      if (
        Object.prototype.hasOwnProperty.call(
          context,
          key
        )
      ) {
        return String(
          context[key] ??
          ''
        );
      }


      return match;

    }
  );

};


// ======================================================
// CONFIGURACIÓN DE PLANTILLA
// ======================================================

export const getWhatsAppTemplateConfig = (
  settings,
  type
) => {

  return (
    settings
      ?.whatsappSettings
      ?.templates
      ?.[type] ||
    null
  );

};


// ======================================================
// CREAR MENSAJE
// ======================================================

export const buildWhatsAppMessage = ({
  member,
  settings,
  type = 'renewal',
  extras = {},
  customMessage = ''
}) => {

  if (
    type === 'custom'
  ) {
    return String(
      customMessage ||
      ''
    ).trim();
  }


  const templateConfig =
    getWhatsAppTemplateConfig(
      settings,
      type
    );


  const context =
    buildWhatsAppContext({
      member,
      settings,
      extras
    });


  return renderWhatsAppTemplate(
    templateConfig?.message ||
    '',
    context
  ).trim();

};


// ======================================================
// HISTORIAL
// ======================================================

export const getWhatsAppHistory = () => {

  try {

    const raw =
      localStorage.getItem(
        WHATSAPP_HISTORY_KEY
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
      'Error leyendo historial de WhatsApp:',
      error
    );


    return [];

  }

};


export const saveWhatsAppHistory = (
  history
) => {

  const safe =
    Array.isArray(
      history
    )
      ? history
      : [];


  localStorage.setItem(
    WHATSAPP_HISTORY_KEY,
    JSON.stringify(
      safe
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-whatsapp-update'
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );


  return safe;

};


export const getMemberWhatsAppHistory = (
  memberId
) => {

  return getWhatsAppHistory()
    .filter(
      item =>
        item.memberId ===
        memberId
    )
    .sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    );

};


// ======================================================
// ABRIR WHATSAPP Y REGISTRAR CONTACTO
// ======================================================

export const openMemberWhatsApp = ({
  member,
  settings,
  type = 'renewal',
  message,
  extras = {}
}) => {

  if (
    settings
      ?.whatsappSettings
      ?.enabled ===
    false
  ) {

    return {
      success: false,
      reason: 'disabled',
      message:
        'WhatsApp está desactivado desde Configuración.'
    };

  }


  const phone =
    normalizeWhatsAppPhone(
      member?.phone,
      settings
        ?.whatsappSettings
        ?.defaultCountryCode ||
      '52'
    );


  if (!phone) {

    return {
      success: false,
      reason: 'no_phone',
      message:
        'El miembro no tiene un teléfono válido.'
    };

  }


  const finalMessage =
    String(
      message ||
      buildWhatsAppMessage({
        member,
        settings,
        type,
        extras
      })
    ).trim();


  if (!finalMessage) {

    return {
      success: false,
      reason: 'no_message',
      message:
        'El mensaje está vacío.'
    };

  }


  const url =
    `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`;


  const session =
    getCurrentSession();


  const history =
    getWhatsAppHistory();


  const record = {
    id:
      createId(),

    memberId:
      member?.id ||
      '',

    memberName:
      `${member?.firstName || ''} ${member?.lastName || ''}`
        .trim(),

    phone,

    type,

    message:
      finalMessage,

    createdAt:
      new Date()
        .toISOString(),

    openedAt:
      new Date()
        .toISOString(),

    sentBy:
      session
        ? {
            id:
              session.id ||
              session.userId ||
              null,

            name:
              session.name ||
              session.email ||
              'Usuario',

            email:
              session.email ||
              '',

            role:
              session.role ||
              ''
          }
        : null
  };


  history.unshift(
    record
  );


  saveWhatsAppHistory(
    history
  );


  window.open(
    url,
    '_blank',
    'noopener,noreferrer'
  );


  return {
    success: true,
    url,
    record
  };

};


// ======================================================
// SUGERIR TIPO DE MENSAJE
// ======================================================

export const getSuggestedWhatsAppType = (
  member
) => {

  const subscription =
    member?.subscription ||
    {};


  const remaining =
    getDaysRemaining(
      subscription.endDate
    );


  if (
    subscription.status ===
      'expired' ||
    (
      remaining !== null &&
      remaining < 0
    )
  ) {
    return 'expired';
  }


  if (
    remaining !== null &&
    remaining >= 0 &&
    remaining <= 5
  ) {
    return 'expiring';
  }


  return 'renewal';

};
