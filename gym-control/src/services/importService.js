// src/services/importService.js

import * as XLSX from 'xlsx';


// ======================================================
// CLAVES DEL SISTEMA
// ======================================================

const STORAGE_KEYS = {

  MEMBERS:
    'gym_control_members',

  ATTENDANCE:
    'gym_control_attendance',

  PAYMENTS:
    'gym_control_payments',

  SUBSCRIPTION_HISTORY:
    'gym_control_subscription_history',

  BLACKLIST:
    'gym_control_blacklist',

  MEMBER_COUNTER:
    'gym_control_member_counter'

};


// ======================================================
// LEER ARRAY
// ======================================================

const readArray = (
  key
) => {

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
      `Error leyendo ${key}:`,
      error
    );


    return [];

  }

};


// ======================================================
// GUARDAR ARRAY
// ======================================================

const writeArray = (
  key,
  data
) => {

  localStorage.setItem(
    key,
    JSON.stringify(
      Array.isArray(
        data
      )
        ? data
        : []
    )
  );

};


// ======================================================
// TEXTO SEGURO
// ======================================================

const text = (
  value
) => {

  if (
    value === null ||
    value === undefined
  ) {

    return '';

  }


  return String(
    value
  ).trim();

};


// ======================================================
// BOOLEAN
// ======================================================

const bool = (
  value
) => {

  if (
    value === true
  ) {

    return true;

  }


  const normalized =
    text(
      value
    ).toLowerCase();


  return [
    'true',
    '1',
    'si',
    'sí',
    'yes',
    'verdadero'
  ].includes(
    normalized
  );

};


// ======================================================
// NÚMERO SEGURO
// ======================================================

const num = (
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


  const cleaned =
    String(
      value
    )
      .trim()
      .replace(
        /\s/g,
        ''
      )
      .replace(
        /[$€£MXNUSD]/gi,
        ''
      )
      .replace(
        /,/g,
        ''
      );


  const result =
    Number(
      cleaned
    );


  return Number.isFinite(
    result
  )
    ? result
    : 0;

};


// ======================================================
// FECHA A ISO
// ======================================================

const toISO = (
  value
) => {

  if (!value) {

    return null;

  }


  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {

    return value.toISOString();

  }


  if (
    typeof value ===
    'number'
  ) {

    const parsed =
      XLSX.SSF.parse_date_code(
        value
      );


    if (parsed) {

      const date =
        new Date(
          parsed.y,
          parsed.m - 1,
          parsed.d,
          parsed.H || 0,
          parsed.M || 0,
          Math.floor(
            parsed.S ||
            0
          )
        );


      return date.toISOString();

    }

  }


  const stringValue =
    text(
      value
    );


  const mysqlMatch =
    stringValue.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );


  if (mysqlMatch) {

    const [
      ,
      year,
      month,
      day,
      hour = '0',
      minute = '0',
      second = '0'
    ] = mysqlMatch;


    const date =
      new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      return date.toISOString();

    }

  }


  const latinMatch =
    stringValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );


  if (latinMatch) {

    const [
      ,
      day,
      month,
      year,
      hour = '0',
      minute = '0',
      second = '0'
    ] = latinMatch;


    const date =
      new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      return date.toISOString();

    }

  }


  const date =
    new Date(
      stringValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date.toISOString();

};


// ======================================================
// LEER HOJA
// ======================================================

const getSheetRows = (
  workbook,
  sheetName
) => {

  const sheet =
    workbook.Sheets[
      sheetName
    ];


  if (!sheet) {

    return [];

  }


  return XLSX.utils.sheet_to_json(
    sheet,
    {
      defval:
        '',

      raw:
        false
    }
  );

};


// ======================================================
// PLAN LABEL
// ======================================================

const getPlanLabel = (
  plan
) => {

  const normalized =
    text(
      plan
    ).toLowerCase();


  const labels = {

    '7dias':
      '7 días',

    '7 días':
      '7 días',

    '15dias':
      '15 días',

    '15 días':
      '15 días',

    mensual:
      'Mensual',

    anual:
      'Anual'

  };


  return (
    labels[
      normalized
    ] ||
    text(
      plan
    )
  );

};


// ======================================================
// MÉTODO DE ACCESO
// ======================================================

const normalizeAccessMethod = (
  method
) => {

  const normalized =
    text(
      method
    )
      .toLowerCase()
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );


  if (
    normalized === 'face' ||
    normalized === 'rostro' ||
    normalized === 'facial' ||
    normalized === 'biometria' ||
    normalized === 'biometrico'
  ) {

    return 'face';

  }


  if (
    normalized === 'pin' ||
    normalized === 'codigo'
  ) {

    return 'pin';

  }


  if (
    normalized ===
    'manual'
  ) {

    return 'manual';

  }


  return 'qr';

};


// ======================================================
// MÉTODO DE PAGO
// ======================================================

const normalizePaymentMethod = (
  method
) => {

  const normalized =
    text(
      method
    )
      .toLowerCase()
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );


  if (
    normalized.includes(
      'tarjeta'
    ) ||
    normalized ===
      'card'
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


  if (
    normalized.includes(
      'efectivo'
    ) ||
    normalized ===
      'cash'
  ) {

    return 'efectivo';

  }


  return 'otro';

};


// ======================================================
// GENERADOR DE IDS
// ======================================================

const createNextMemberIdGenerator = (
  existingMembers
) => {

  let highest =
    -1;


  existingMembers.forEach(
    member => {

      const match =
        String(
          member?.id ||
          ''
        ).match(
          /^GYM-(\d{5})$/
        );


      if (match) {

        highest =
          Math.max(
            highest,
            Number(
              match[1]
            )
          );

      }

    }
  );


  const counter =
    Number(
      localStorage.getItem(
        STORAGE_KEYS.MEMBER_COUNTER
      )
    );


  if (
    Number.isFinite(
      counter
    )
  ) {

    highest =
      Math.max(
        highest,
        counter
      );

  }


  return () => {

    highest +=
      1;


    return `GYM-${String(
      highest
    ).padStart(
      5,
      '0'
    )}`;

  };

};


// ======================================================
// NORMALIZAR MIEMBRO
// ======================================================

const normalizeMemberRow = (
  row
) => {

  const firstName =
    text(
      row.Nombre ||
      row.firstName ||
      row.NombreMiembro
    );


  const lastName =
    text(
      row.Apellidos ||
      row.lastName
    );


  const plan =
    text(
      row.Plan ||
      row.plan
    ).toLowerCase();


  const status =
    text(
      row.EstadoDemo ||
      row.Estado ||
      row.status
    );


  const errors =
    [];


  if (!firstName) {

    errors.push(
      'Falta nombre'
    );

  }


  if (!lastName) {

    errors.push(
      'Faltan apellidos'
    );

  }


  return {

    sourceId:
      text(
        row.IDOrigen ||
        row.ID ||
        row.id
      ),

    firstName,

    lastName,

    phone:
      text(
        row.Telefono ||
        row.phone
      ),

    email:
      text(
        row.Correo ||
        row.email
      ),

    birthDate:
      toISO(
        row.FechaNacimiento ||
        row.birthDate
      ),

    gender:
      text(
        row.Genero ||
        row.gender
      ),

    registrationType:
      text(
        row.TipoRegistro ||
        'regular'
      ),

    promotion:
      text(
        row.Promocion
      ),

    coupleId:
      text(
        row.ParejaID
      ),

    plan,

    planLabel:
      text(
        row.PlanLabel
      ) ||
      getPlanLabel(
        plan
      ),

    days:
      num(
        row.Dias
      ),

    startDate:
      toISO(
        row.FechaInicio
      ),

    endDate:
      toISO(
        row.FechaFin
      ),

    subscriptionStatus:
      text(
        row.SubscriptionStatus
      ),

    paymentMethod:
      text(
        row.MetodoPago
      ),

    originalAmount:
      num(
        row.MontoOriginal
      ),

    discountAmount:
      num(
        row.Descuento
      ),

    amount:
      num(
        row.MontoPagado
      ),

    status:
      status ||
      'Activo',

    accessBlocked:
      bool(
        row.Bloqueado
      ),

    blockReason:
      text(
        row.MotivoBloqueo
      ),

    lastVisit:
      toISO(
        row.UltimaVisita
      ),

    isInside:
      bool(
        row.DentroGym
      ),

    notes:
      text(
        row.Notas
      ),

    qrToken:
      text(
        row.QRTokenDemo
      ),

    demoPin:
      text(
        row.PINDemo
      ),

    pinHash:
      text(
        row.PINHashSHA256
      ),

    validation: {

      valid:
        errors.length ===
        0,

      errors

    }

  };

};


// ======================================================
// LEER EXCEL
// ======================================================

export const parseExcelFile =
  async (
    file
  ) => {

    if (!file) {

      throw new Error(
        'No se recibió ningún archivo.'
      );

    }


    const buffer =
      await file.arrayBuffer();


    const workbook =
      XLSX.read(
        buffer,
        {

          type:
            'array',

          cellDates:
            true

        }
      );


    const members =
      getSheetRows(
        workbook,
        'Miembros'
      ).map(
        normalizeMemberRow
      );


    const workbookData = {

      attendance:
        getSheetRows(
          workbook,
          'Asistencias'
        ),

      payments:
        getSheetRows(
          workbook,
          'Pagos'
        ),

      subscriptions:
        getSheetRows(
          workbook,
          'HistorialSuscripciones'
        ),

      blacklist:
        getSheetRows(
          workbook,
          'ListaNegra'
        )

    };


    Object.defineProperty(
      members,
      '__gymWorkbook',
      {

        value:
          workbookData,

        enumerable:
          false,

        writable:
          false

      }
    );


    return members;

  };


// ======================================================
// IMPORTAR
// ======================================================

export const importMembers = (
  rows,
  {
    skipDuplicates = true
  } = {}
) => {

  if (
    !Array.isArray(
      rows
    )
  ) {

    throw new Error(
      'Los datos de importación no son válidos.'
    );

  }


  const currentMembers =
    readArray(
      STORAGE_KEYS.MEMBERS
    );


  const getNextId =
    createNextMemberIdGenerator(
      currentMembers
    );


  const sourceIdMap =
    {};


  const importedMembers =
    [];


  let imported =
    0;


  let skipped =
    0;


  let errors =
    0;


  // ====================================================
  // MIEMBROS
  // ====================================================

  rows.forEach(
    row => {

      if (
        !row?.validation?.valid
      ) {

        errors +=
          1;

        return;

      }


      const duplicate =
        [
          ...currentMembers,
          ...importedMembers
        ].some(
          member => {

            const sameEmail =
              row.email &&
              String(
                member?.email ||
                ''
              ).toLowerCase() ===
                row.email.toLowerCase();


            const samePhone =
              row.phone &&
              String(
                member?.phone ||
                ''
              )
                .replace(
                  /\D/g,
                  ''
                ) ===
                row.phone.replace(
                  /\D/g,
                  ''
                );


            return (
              sameEmail ||
              samePhone
            );

          }
        );


      if (
        duplicate &&
        skipDuplicates
      ) {

        skipped +=
          1;

        return;

      }


      const id =
        getNextId();


      if (
        row.sourceId
      ) {

        sourceIdMap[
          row.sourceId
        ] =
          id;

      }


      const hasSubscription =
        Boolean(
          row.plan &&
          row.endDate
        );


      const rowStatus =
        text(
          row.status
        ).toLowerCase();


      const subscriptionStatus =
        rowStatus.includes(
          'vencid'
        )
          ? 'expired'
          : 'active';


      const member = {

        id,

        firstName:
          row.firstName,

        lastName:
          row.lastName,

        phone:
          row.phone,

        email:
          row.email,

        birthDate:
          row.birthDate,

        gender:
          row.gender,


        status:
          'active',

        accessBlocked:
          row.accessBlocked,

        blockReason:
          row.blockReason,


        subscription:
          hasSubscription
            ? {

                plan:
                  row.plan,

                planId:
                  row.plan,

                planLabel:
                  row.planLabel,

                name:
                  row.planLabel,

                days:
                  row.days,

                durationDays:
                  row.days,

                startDate:
                  row.startDate,

                endDate:
                  row.endDate,

                status:
                  subscriptionStatus,

                paymentMethod:
                  normalizePaymentMethod(
                    row.paymentMethod
                  ),

                amount:
                  Number(
                    row.amount ||
                    0
                  ).toFixed(
                    2
                  ),

                originalAmount:
                  Number(
                    row.originalAmount ||
                    0
                  ).toFixed(
                    2
                  ),

                discountAmount:
                  Number(
                    row.discountAmount ||
                    0
                  ).toFixed(
                    2
                  ),

                promotion:
                  row.promotion
                    ? {

                        label:
                          row.promotion,

                        type:
                          row.registrationType

                      }
                    : null

              }
            : null,


        registrationCategory:
          row.registrationType,


        promotionProfile:
          row.promotion ||
          row.coupleId
            ? {

                id:
                  row.registrationType,

                type:
                  row.registrationType,

                label:
                  row.promotion ||
                  row.registrationType,

                groupId:
                  row.coupleId ||
                  null

              }
            : null,


        access: {

          qr: {

            enabled:
              true,

            configured:
              true,

            token:
              row.qrToken ||
              `DEMO-${id}`

          },


          pin: {

            enabled:
              Boolean(
                row.pinHash
              ),

            configured:
              Boolean(
                row.pinHash
              ),

            pinHash:
              row.pinHash ||
              ''

          },


          face: {

            enabled:
              false,

            enrolled:
              false,

            embeddings:
              []

          }

        },


        demoPin:
          row.demoPin ||
          '',


        isInside:
          row.isInside,

        lastVisit:
          row.lastVisit,

        lastAccessAt:
          row.lastVisit,


        notes:
          row.notes,


        registrationDate:
          row.startDate ||
          new Date().toISOString(),

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()

      };


      importedMembers.push(
        member
      );


      imported +=
        1;

    }
  );


  const finalMembers = [
    ...currentMembers,
    ...importedMembers
  ];


  writeArray(
    STORAGE_KEYS.MEMBERS,
    finalMembers
  );


  // ====================================================
  // CONTADOR
  // ====================================================

  const highest =
    finalMembers.reduce(
      (
        currentHighest,
        member
      ) => {

        const match =
          String(
            member?.id ||
            ''
          ).match(
            /^GYM-(\d{5})$/
          );


        if (!match) {

          return currentHighest;

        }


        return Math.max(
          currentHighest,
          Number(
            match[1]
          )
        );

      },
      -1
    );


  localStorage.setItem(
    STORAGE_KEYS.MEMBER_COUNTER,
    String(
      highest
    )
  );


  const extra =
    rows.__gymWorkbook ||
    {};


  // ====================================================
  // ASISTENCIAS
  // ====================================================

  const attendance =
    (
      extra.attendance ||
      []
    )
      .map(
        row => {

          const sourceId =
            text(
              row.IDOrigenMiembro
            );


          const memberId =
            sourceIdMap[
              sourceId
            ] ||
            text(
              row.IDMiembro
            );


          if (!memberId) {

            return null;

          }


          const entryAt =
            toISO(
              row.Entrada
            );


          const exitAt =
            toISO(
              row.Salida
            );


          return {

            id:
              text(
                row.IDAsistencia
              ) ||
              `ATT-${Date.now()}-${Math.random()}`,

            memberId,

            memberName:
              text(
                row.Miembro
              ),

            profilePhoto:
              null,

            method:
              normalizeAccessMethod(
                row.Metodo
              ),

            entryAt,

            exitAt,

            status:
              exitAt
                ? 'completed'
                : 'inside',

            durationMinutes:
              num(
                row.DuracionMinutos
              ),

            exitMethod:
              normalizeAccessMethod(
                row.MetodoSalida ||
                row.Metodo
              ),

            createdAt:
              toISO(
                row.CreadoEn
              ) ||
              entryAt,

            updatedAt:
              exitAt ||
              entryAt

          };

        }
      )
      .filter(
        Boolean
      );


  writeArray(
    STORAGE_KEYS.ATTENDANCE,
    [
      ...readArray(
        STORAGE_KEYS.ATTENDANCE
      ),
      ...attendance
    ]
  );


  // ====================================================
  // SINCRONIZAR DENTRO DEL GYM
  // ====================================================

  const synchronizedMembers =
    readArray(
      STORAGE_KEYS.MEMBERS
    ).map(
      member => {

        const memberAttendance =
          attendance
            .filter(
              item =>
                item.memberId ===
                member.id
            )
            .sort(
              (
                a,
                b
              ) =>
                new Date(
                  b.entryAt ||
                  0
                ) -
                new Date(
                  a.entryAt ||
                  0
                )
            );


        if (
          memberAttendance.length ===
          0
        ) {

          return member;

        }


        const latest =
          memberAttendance[
            0
          ];


        const inside =
          memberAttendance.some(
            item =>
              item.status ===
                'inside' &&
              !item.exitAt
          );


        return {

          ...member,

          isInside:
            inside,

          lastVisit:
            latest.entryAt ||
            member.lastVisit,

          lastAccessAt:
            latest.entryAt ||
            member.lastAccessAt,

          updatedAt:
            new Date().toISOString()

        };

      }
    );


  writeArray(
    STORAGE_KEYS.MEMBERS,
    synchronizedMembers
  );


  // ====================================================
  // PAGOS
  // ====================================================

  const payments =
    (
      extra.payments ||
      []
    )
      .map(
        row => {

          const sourceId =
            text(
              row.IDOrigenMiembro
            );


          const memberId =
            sourceIdMap[
              sourceId
            ] ||
            text(
              row.IDMiembro
            );


          if (!memberId) {

            return null;

          }


          const concept =
            text(
              row.Concepto
            ) ||
            'Suscripción';


          const paymentMethod =
            normalizePaymentMethod(
              row.MetodoPago ||
              row.Metodo
            );


          const paymentDate =
            toISO(
              row.CreadoEn ||
              row.Fecha
            ) ||
            new Date().toISOString();


          const isRenewal =
            text(
              row.Tipo
            ).toLowerCase() ===
              'subscription_renewal' ||
            concept
              .toLowerCase()
              .includes(
                'renov'
              );


          const amount =
            num(
              row.Monto
            );


          return {

            id:
              text(
                row.IDPago
              ) ||
              `PAY-${Date.now()}-${Math.random()}`,

            memberId,

            memberName:
              text(
                row.Miembro
              ),

            concept,

            type:
              isRenewal
                ? 'subscription_renewal'
                : (
                    text(
                      row.Tipo
                    ) ||
                    'subscription_initial'
                  ),

            source:
              isRenewal
                ? 'renewal'
                : 'registration',

            plan:
              text(
                row.Plan
              ),

            planLabel:
              text(
                row.PlanLabel
              ) ||
              getPlanLabel(
                row.Plan
              ),

            promotion:
              text(
                row.Promocion
              )
                ? {

                    label:
                      text(
                        row.Promocion
                      )

                  }
                : null,

            originalAmount:
              num(
                row.MontoOriginal ||
                row.Monto
              ),

            discountAmount:
              num(
                row.Descuento
              ),

            amount,

            method:
              paymentMethod,

            paymentMethod,

            receivedAmount:
              num(
                row.MontoRecibido ||
                row.Recibido ||
                row.Monto
              ),

            change:
              num(
                row.Cambio
              ),

            status:
              text(
                row.Estado
              ).toLowerCase() ||
              'completed',

            reference:
              text(
                row.Referencia
              ),

            notes:
              text(
                row.Notas
              ),

            createdAt:
              paymentDate,

            date:
              paymentDate,

            paidAt:
              paymentDate

          };

        }
      )
      .filter(
        Boolean
      );


  writeArray(
    STORAGE_KEYS.PAYMENTS,
    [
      ...readArray(
        STORAGE_KEYS.PAYMENTS
      ),
      ...payments
    ]
  );


  // ====================================================
  // HISTORIAL SUSCRIPCIONES
  // ====================================================

  const subscriptions =
    (
      extra.subscriptions ||
      []
    )
      .map(
        row => {

          const sourceId =
            text(
              row.IDOrigenMiembro
            );


          const memberId =
            sourceIdMap[
              sourceId
            ] ||
            text(
              row.IDMiembro
            );


          if (!memberId) {

            return null;

          }


          return {

            id:
              text(
                row.ID
              ) ||
              `SUB-${Date.now()}-${Math.random()}`,

            memberId,

            memberName:
              text(
                row.Miembro
              ),

            type:
              text(
                row.Tipo
              ),

            source:
              'import',

            plan:
              text(
                row.Plan
              ),

            planLabel:
              text(
                row.PlanLabel
              ) ||
              getPlanLabel(
                row.Plan
              ),

            days:
              num(
                row.Dias
              ),

            startDate:
              toISO(
                row.FechaInicio
              ),

            endDate:
              toISO(
                row.FechaFin
              ),

            amount:
              num(
                row.Monto
              ),

            paymentMethod:
              normalizePaymentMethod(
                row.MetodoPago
              ),

            promotion:
              text(
                row.Promocion
              ),

            status:
              text(
                row.Estado
              ).toLowerCase(),

            createdAt:
              toISO(
                row.FechaInicio
              ) ||
              new Date().toISOString()

          };

        }
      )
      .filter(
        Boolean
      );


  writeArray(
    STORAGE_KEYS.SUBSCRIPTION_HISTORY,
    [
      ...readArray(
        STORAGE_KEYS.SUBSCRIPTION_HISTORY
      ),
      ...subscriptions
    ]
  );


  // ====================================================
  // LISTA NEGRA
  // ====================================================

  const importedBlacklist =
    (
      extra.blacklist ||
      []
    ).map(
      row => {

        const sourceId =
          text(
            row.IDOrigenMiembro
          );


        const memberId =
          sourceIdMap[
            sourceId
          ] ||
          sourceId;


        return {

          id:
            text(
              row.IDBlacklist
            ) ||
            `BLK-${Date.now()}-${Math.random()}`,

          previousMemberId:
            memberId,

          firstName:
            text(
              row.Nombre
            ),

          lastName:
            text(
              row.Apellidos
            ),

          fullName:
            `${text(
              row.Nombre
            )} ${text(
              row.Apellidos
            )}`.trim(),

          phone:
            text(
              row.Telefono
            ),

          email:
            text(
              row.Correo
            ),

          reason:
            text(
              row.Motivo
            ) ||
            'Miembro bloqueado',

          notes:
            text(
              row.Notas
            ),

          source:
            text(
              row.Origen
            ) ||
            'blocked',

          status:
            text(
              row.Estado
            ).toLowerCase() ===
              'cleared'
              ? 'cleared'
              : 'active',

          addedAt:
            toISO(
              row.Fecha
            ) ||
            new Date().toISOString(),

          updatedAt:
            toISO(
              row.Fecha
            ) ||
            new Date().toISOString()

        };

      }
    );


  const currentBlacklist =
    [
      ...readArray(
        STORAGE_KEYS.BLACKLIST
      ),
      ...importedBlacklist
    ];


  // ====================================================
  // BLOQUEADOS ACTUALES
  // ====================================================

  readArray(
    STORAGE_KEYS.MEMBERS
  ).forEach(
    member => {

      if (
        member.accessBlocked !==
        true
      ) {

        return;

      }


      const exists =
        currentBlacklist.some(
          record =>
            record.previousMemberId ===
              member.id &&
            record.status !==
              'cleared'
        );


      if (exists) {

        return;

      }


      currentBlacklist.unshift(
        {

          id:
            `BLK-${Date.now()}-${Math.random()}`,

          previousMemberId:
            member.id,

          firstName:
            member.firstName ||
            '',

          lastName:
            member.lastName ||
            '',

          fullName:
            `${member.firstName || ''} ${member.lastName || ''}`.trim(),

          phone:
            member.phone ||
            '',

          email:
            member.email ||
            '',

          reason:
            member.blockReason ||
            'Miembro bloqueado',

          notes:
            'Registro importado para demostración.',

          source:
            'blocked',

          status:
            'active',

          addedAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString()

        }
      );

    }
  );


  writeArray(
    STORAGE_KEYS.BLACKLIST,
    currentBlacklist
  );


  // ====================================================
  // ACTUALIZAR SISTEMA
  // ====================================================

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


  window.dispatchEvent(
    new Event(
      'gym-attendance-update'
    )
  );


  window.dispatchEvent(
    new Event(
      'gym-payments-update'
    )
  );


  // ====================================================
  // RESULTADO
  // ====================================================

  return {

    imported,

    skipped,

    errors,

    attendance:
      attendance.length,

    payments:
      payments.length,

    subscriptions:
      subscriptions.length,

    blacklist:
      currentBlacklist.length

  };

};


// ======================================================
// EXPORT DEFAULT
// ======================================================

export default {

  parseExcelFile,

  importMembers

};