// src/utils/importValidators.js


// ======================================================
// TEXTO
// ======================================================

export const normalizeImportText = (
  value = ''
) => {

  return String(
    value ??
    ''
  ).trim();

};


// ======================================================
// TELÉFONO
// ======================================================

export const normalizeImportPhone = (
  value = ''
) => {

  return String(
    value ??
    ''
  ).replace(
    /\D/g,
    ''
  );

};


// ======================================================
// EMAIL
// ======================================================

export const normalizeImportEmail = (
  value = ''
) => {

  return String(
    value ??
    ''
  )
    .trim()
    .toLowerCase();

};


// ======================================================
// NÚMERO / DINERO
// ======================================================

export const normalizeImportNumber = (
  value
) => {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {

    return 0;

  }


  if (
    typeof value ===
    'number'
  ) {

    return Number.isFinite(
      value
    )
      ? value
      : 0;

  }


  let text =
    String(
      value
    )
      .trim()
      .replace(
        /[$€£]/g,
        ''
      )
      .replace(
        /\s/g,
        ''
      );


  /*
   * 1,250.50
   */
  if (
    text.includes(',') &&
    text.includes('.')
  ) {

    text =
      text.replace(
        /,/g,
        ''
      );

  } else if (
    text.includes(',') &&
    !text.includes('.')
  ) {

    /*
     * Si parece decimal:
     * 250,50
     */
    const parts =
      text.split(',');

    if (
      parts.length === 2 &&
      parts[1].length <= 2
    ) {

      text =
        `${parts[0]}.${parts[1]}`;

    } else {

      text =
        text.replace(
          /,/g,
          ''
        );

    }

  }


  const numeric =
    Number(
      text
    );


  return Number.isFinite(
    numeric
  )
    ? numeric
    : 0;

};


// ======================================================
// ESTADO
// ======================================================

export const normalizeStatus = (
  value = ''
) => {

  const status =
    String(
      value ||
      ''
    )
      .trim()
      .toLowerCase();


  const map = {

    activo:
      'active',

    activa:
      'active',

    active:
      'active',

    vigente:
      'active',

    vencido:
      'expired',

    vencida:
      'expired',

    expired:
      'expired',

    bloqueado:
      'blocked',

    bloqueada:
      'blocked',

    blocked:
      'blocked',

    inactivo:
      'inactive',

    inactiva:
      'inactive',

    inactive:
      'inactive',

    'sin suscripción':
      'no_subscription',

    'sin suscripcion':
      'no_subscription',

    'sin membresía':
      'no_subscription',

    'sin membresia':
      'no_subscription'

  };


  return (
    map[status] ||
    'active'
  );

};


// ======================================================
// BOOLEAN
// ======================================================

export const normalizeBoolean = (
  value
) => {

  if (
    typeof value ===
    'boolean'
  ) {

    return value;

  }


  const normalized =
    String(
      value ??
      ''
    )
      .trim()
      .toLowerCase();


  return [
    'true',
    '1',
    'si',
    'sí',
    'yes',
    'x',
    'dentro',
    'activo'
  ].includes(
    normalized
  );

};


// ======================================================
// MÉTODO DE PAGO
// ======================================================

export const normalizePaymentMethod = (
  value = ''
) => {

  const normalized =
    String(
      value ||
      ''
    )
      .trim()
      .toLowerCase();


  if (
    normalized.includes(
      'efect'
    )
  ) {

    return 'efectivo';

  }


  if (
    normalized.includes(
      'tarjet'
    ) ||
    normalized.includes(
      'card'
    )
  ) {

    return 'tarjeta';

  }


  if (
    normalized.includes(
      'transfer'
    )
  ) {

    return 'transferencia';

  }


  return 'otro';

};


// ======================================================
// FECHA
// ======================================================

export const parseImportDate = (
  value
) => {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {

    return null;

  }


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


  /*
   * Número serial de Excel.
   */
  if (
    typeof value ===
    'number' &&
    Number.isFinite(
      value
    )
  ) {

    const excelEpoch =
      Date.UTC(
        1899,
        11,
        30
      );


    const result =
      new Date(
        excelEpoch +
        value *
        86400000
      );


    return Number.isNaN(
      result.getTime()
    )
      ? null
      : result;

  }


  const text =
    String(
      value
    ).trim();


  /*
   * DD/MM/YYYY
   * DD-MM-YYYY
   */
  const spanish =
    text.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );


  if (
    spanish
  ) {

    const [
      ,
      day,
      month,
      year,
      hour = '12',
      minute = '00',
      second = '00'
    ] = spanish;


    const date =
      new Date(
        Number(
          year
        ),
        Number(
          month
        ) - 1,
        Number(
          day
        ),
        Number(
          hour
        ),
        Number(
          minute
        ),
        Number(
          second
        )
      );


    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;

  }


  const direct =
    new Date(
      text
    );


  return Number.isNaN(
    direct.getTime()
  )
    ? null
    : direct;

};


// ======================================================
// ISO
// ======================================================

export const toISOStringSafe = (
  value
) => {

  const date =
    parseImportDate(
      value
    );


  return date
    ? date.toISOString()
    : null;

};


// ======================================================
// VALIDAR EMAIL
// ======================================================

export const isValidImportEmail = (
  value
) => {

  if (!value) {
    return true;
  }


  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(
      value
    ).trim()
  );

};


// ======================================================
// VALIDAR MIEMBRO
// ======================================================

export const validateImportedMember = (
  row
) => {

  const errors = [];


  const firstName =
    normalizeImportText(
      row?.firstName
    );


  const lastName =
    normalizeImportText(
      row?.lastName
    );


  const phone =
    normalizeImportPhone(
      row?.phone
    );


  const email =
    normalizeImportEmail(
      row?.email
    );


  if (!firstName) {

    errors.push(
      'Falta nombre'
    );

  }


  if (!lastName) {

    errors.push(
      'Falta apellido'
    );

  }


  if (
    !phone &&
    !email
  ) {

    errors.push(
      'Debe tener teléfono o correo'
    );

  }


  if (
    email &&
    !isValidImportEmail(
      email
    )
  ) {

    errors.push(
      'Correo inválido'
    );

  }


  return {

    valid:
      errors.length ===
      0,

    errors

  };

};