// src/services/cashService.js

export const CASH_SHIFTS_KEY =
  'gym_control_cash_shifts';

export const CASH_MOVEMENTS_KEY =
  'gym_control_cash_movements';

const PAYMENTS_KEY =
  'gym_control_payments';

const SALES_KEY =
  'gym_control_sales';


// ======================================================
// HELPERS
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


const saveArray = (
  key,
  records
) => {

  localStorage.setItem(
    key,
    JSON.stringify(
      Array.isArray(records)
        ? records
        : []
    )
  );

  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );

  window.dispatchEvent(
    new Event(
      'gym-cash-update'
    )
  );

};


const createId = (
  prefix
) => {

  if (
    window.crypto?.randomUUID
  ) {

    return `${prefix}-${window.crypto.randomUUID()}`;

  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;

};


const normalizeActor = (
  actor
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
      ''
  };

};


const getStoredSession =
  () => {

    try {

      const raw =
        localStorage.getItem(
          'gym_control_session'
        );

      return raw
        ? JSON.parse(
            raw
          )
        : null;

    } catch {

      return null;

    }

  };


const parseAmount = (
  value
) => {

  const number =
    Number(
      value ||
      0
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;

};


const normalizeMethod = (
  value
) =>
    String(
      value ||
      ''
    )
      .trim()
      .toLowerCase();


const isCashMethod = (
  method
) =>
    normalizeMethod(
      method
    ) ===
    'efectivo';


const isWithinShift = (
  value,
  shift
) => {

  if (
    !value ||
    !shift?.openedAt
  ) {
    return false;
  }

  const date =
    new Date(
      value
    );

  const start =
    new Date(
      shift.openedAt
    );

  const end =
    new Date(
      shift.closedAt ||
      new Date()
        .toISOString()
    );

  if (
    Number.isNaN(
      date.getTime()
    ) ||
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return false;
  }

  return (
    date >= start &&
    date <= end
  );

};


// ======================================================
// TURNOS
// ======================================================

export const getCashShifts =
  () =>
    readArray(
      CASH_SHIFTS_KEY
    );


export const getCashMovements =
  () =>
    readArray(
      CASH_MOVEMENTS_KEY
    );


export const getOpenCashShiftForUser =
  (
    userId
  ) => {

    if (!userId) {
      return null;
    }

    return (
      getCashShifts()
        .find(
          shift =>
            shift.status ===
              'open' &&
            shift.employee?.id ===
              userId
        ) ||
      null
    );

  };


export const getOpenCashShiftForCurrentUser =
  () => {

    const session =
      getStoredSession();

    return getOpenCashShiftForUser(
      session?.id
    );

  };


export const openCashShift = ({
  openingCash = 0,
  notes = '',
  actor = null
}) => {

  const employee =
    normalizeActor(
      actor ||
      getStoredSession()
    );

  if (
    !employee?.id
  ) {

    throw new Error(
      'No existe una sesión válida para abrir caja.'
    );

  }

  const existing =
    getOpenCashShiftForUser(
      employee.id
    );

  if (existing) {

    throw new Error(
      'Este usuario ya tiene un turno de caja abierto.'
    );

  }

  const numericOpening =
    parseAmount(
      openingCash
    );

  if (
    numericOpening <
    0
  ) {

    throw new Error(
      'El efectivo inicial no puede ser negativo.'
    );

  }

  const now =
    new Date()
      .toISOString();

  const shift = {
    id:
      createId(
        'SHIFT'
      ),

    employee,

    openedAt:
      now,

    closedAt:
      null,

    openingCash:
      numericOpening,

    countedCash:
      null,

    expectedCash:
      null,

    difference:
      null,

    notes:
      String(
        notes ||
        ''
      ).trim(),

    closingNotes:
      '',

    status:
      'open',

    closeSnapshot:
      null,

    createdAt:
      now,

    updatedAt:
      now
  };

  const shifts =
    getCashShifts();

  shifts.unshift(
    shift
  );

  saveArray(
    CASH_SHIFTS_KEY,
    shifts
  );

  return shift;

};


// ======================================================
// MOVIMIENTOS MANUALES
// ======================================================

export const createCashMovement = ({
  shiftId,
  type,
  amount,
  concept,
  notes = '',
  actor = null
}) => {

  const allowedTypes = [
    'expense',
    'withdrawal',
    'other_income'
  ];

  if (
    !allowedTypes.includes(
      type
    )
  ) {

    throw new Error(
      'Tipo de movimiento de caja no válido.'
    );

  }

  const shifts =
    getCashShifts();

  const shift =
    shifts.find(
      item =>
        item.id ===
        shiftId
    );

  if (
    !shift ||
    shift.status !==
      'open'
  ) {

    throw new Error(
      'El turno de caja no está abierto.'
    );

  }

  const numericAmount =
    parseAmount(
      amount
    );

  if (
    numericAmount <=
    0
  ) {

    throw new Error(
      'El monto debe ser mayor a cero.'
    );

  }

  const cleanConcept =
    String(
      concept ||
      ''
    ).trim();

  if (!cleanConcept) {

    throw new Error(
      'Escribe el concepto del movimiento.'
    );

  }

  const movement = {
    id:
      createId(
        'CASHMOV'
      ),

    shiftId:
      shift.id,

    employee:
      normalizeActor(
        actor ||
        getStoredSession()
      ),

    type,

    amount:
      numericAmount,

    concept:
      cleanConcept,

    notes:
      String(
        notes ||
        ''
      ).trim(),

    createdAt:
      new Date()
        .toISOString()
  };

  const movements =
    getCashMovements();

  movements.unshift(
    movement
  );

  saveArray(
    CASH_MOVEMENTS_KEY,
    movements
  );

  return movement;

};


// ======================================================
// TRANSACCIONES DEL TURNO
// ======================================================

const belongsToShift = (
  record,
  shift
) => {

  if (
    !record ||
    !shift?.id
  ) {
    return false;
  }


  // PRIORIDAD 1:
  // vínculo explícito con el turno.
  if (
    record.cashShiftId
  ) {

    return (
      String(
        record.cashShiftId
      ) ===
      String(
        shift.id
      )
    );

  }


  const recordDate =
    record.createdAt ||
    record.date ||
    null;


  if (
    !isWithinShift(
      recordDate,
      shift
    )
  ) {

    return false;

  }


  const recordEmployeeId =
    record.cashEmployeeId ||
    record?.createdBy?.id ||
    record?.employee?.id ||
    null;


  // PRIORIDAD 2:
  // mismo empleado y dentro del horario.
  if (
    recordEmployeeId
  ) {

    return (
      String(
        recordEmployeeId
      ) ===
      String(
        shift.employee?.id ||
        ''
      )
    );

  }


  // COMPATIBILIDAD:
  // registros antiguos sin empleado ni cashShiftId.
  // Si sucedieron dentro del rango exacto del turno,
  // los incluimos.
  return true;

};


export const getShiftPayments = (
  shift
) => {

  if (!shift?.id) {
    return [];
  }

  return readArray(
    PAYMENTS_KEY
  )
    .filter(
      payment =>
        payment.status !==
          'cancelled' &&
        payment.status !==
          'deleted' &&
        belongsToShift(
          payment,
          shift
        )
    );

};


export const getShiftSales = (
  shift
) => {

  if (!shift?.id) {
    return [];
  }

  return readArray(
    SALES_KEY
  )
    .filter(
      sale =>
        sale.status !==
          'cancelled' &&
        belongsToShift(
          sale,
          shift
        )
    );

};


export const getShiftMovements = (
  shift
) => {

  if (!shift?.id) {
    return [];
  }

  return getCashMovements()
    .filter(
      movement =>
        movement.shiftId ===
        shift.id
    );

};


// ======================================================
// RESUMEN DEL TURNO
// ======================================================

export const calculateCashShiftSummary = (
  shift
) => {

  if (!shift?.id) {

    return {
      openingCash: 0,

      memberships: {
        total: 0,
        cash: 0,
        count: 0
      },

      sales: {
        total: 0,
        cash: 0,
        count: 0,
        itemCount: 0,
        products: []
      },

      otherIncome: 0,
      expenses: 0,
      withdrawals: 0,

      expectedCash: 0,

      paymentMethods: {}
    };

  }

  const payments =
    getShiftPayments(
      shift
    );

  const sales =
    getShiftSales(
      shift
    );

  const movements =
    getShiftMovements(
      shift
    );


  const membershipsTotal =
    payments.reduce(
      (
        sum,
        payment
      ) =>
        sum +
        parseAmount(
          payment.amount
        ),
      0
    );


  const membershipsCash =
    payments
      .filter(
        payment =>
          isCashMethod(
            payment.paymentMethod ||
            payment.method
          )
      )
      .reduce(
        (
          sum,
          payment
        ) =>
          sum +
          parseAmount(
            payment.amount
          ),
        0
      );


  const salesTotal =
    sales.reduce(
      (
        sum,
        sale
      ) =>
        sum +
        parseAmount(
          sale.total
        ),
      0
    );


  const salesCash =
    sales
      .filter(
        sale =>
          isCashMethod(
            sale.paymentMethod
          )
      )
      .reduce(
        (
          sum,
          sale
        ) =>
          sum +
          parseAmount(
            sale.total
          ),
        0
      );


  const productsMap =
    new Map();


  sales.forEach(
    sale => {

      (
        Array.isArray(
          sale.items
        )
          ? sale.items
          : []
      ).forEach(
        item => {

          const key =
            item.productId ||
            item.name ||
            'producto';


          const current =
            productsMap.get(
              key
            ) ||
            {
              productId:
                item.productId ||
                '',

              name:
                item.name ||
                'Producto',

              quantity:
                0,

              revenue:
                0
            };


          current.quantity +=
            parseAmount(
              item.quantity
            );


          current.revenue +=
            parseAmount(
              item.subtotal ??
              (
                parseAmount(
                  item.unitPrice
                ) *
                parseAmount(
                  item.quantity
                )
              )
            );


          productsMap.set(
            key,
            current
          );

        }
      );

    }
  );


  const soldProducts =
    Array.from(
      productsMap.values()
    )
      .sort(
        (
          first,
          second
        ) =>
          second.quantity -
          first.quantity
      );


  const sumMovement =
    type =>
      movements
        .filter(
          movement =>
            movement.type ===
            type
        )
        .reduce(
          (
            sum,
            movement
          ) =>
            sum +
            parseAmount(
              movement.amount
            ),
          0
        );


  const otherIncome =
    sumMovement(
      'other_income'
    );

  const expenses =
    sumMovement(
      'expense'
    );

  const withdrawals =
    sumMovement(
      'withdrawal'
    );


  const openingCash =
    parseAmount(
      shift.openingCash
    );


  const expectedCash =
    openingCash +
    membershipsCash +
    salesCash +
    otherIncome -
    expenses -
    withdrawals;


  const paymentMethods =
    {};


  const addMethod =
    (
      method,
      amount,
      source
    ) => {

      const key =
        normalizeMethod(
          method
        ) ||
        'otro';

      if (
        !paymentMethods[
          key
        ]
      ) {

        paymentMethods[
          key
        ] = {
          method:
            key,

          memberships:
            0,

          sales:
            0,

          total:
            0
        };

      }

      paymentMethods[
        key
      ][source] +=
        parseAmount(
          amount
        );

      paymentMethods[
        key
      ].total +=
        parseAmount(
          amount
        );

    };


  payments.forEach(
    payment =>
      addMethod(
        payment.paymentMethod ||
        payment.method,
        payment.amount,
        'memberships'
      )
  );


  sales.forEach(
    sale =>
      addMethod(
        sale.paymentMethod,
        sale.total,
        'sales'
      )
  );


  return {
    openingCash,

    memberships: {
      total:
        membershipsTotal,

      cash:
        membershipsCash,

      count:
        payments.length
    },

    sales: {
      total:
        salesTotal,

      cash:
        salesCash,

      count:
        sales.length,

      itemCount:
        sales.reduce(
          (
            sum,
            sale
          ) =>
            sum +
            parseAmount(
              sale.itemCount
            ),
          0
        ),

      products:
        soldProducts
    },

    otherIncome,
    expenses,
    withdrawals,

    expectedCash,

    paymentMethods,

    payments,
    sales,
    movements,

    totalHandled:
      membershipsTotal +
      salesTotal +
      otherIncome
  };

};


// ======================================================
// CERRAR TURNO
// ======================================================

export const closeCashShift = ({
  shiftId,
  countedCash,
  notes = '',
  actor = null
}) => {

  const shifts =
    getCashShifts();

  const index =
    shifts.findIndex(
      shift =>
        shift.id ===
        shiftId
    );

  if (
    index <
    0
  ) {

    throw new Error(
      'No se encontró el turno de caja.'
    );

  }

  if (
    shifts[index].status !==
    'open'
  ) {

    throw new Error(
      'Este turno ya está cerrado.'
    );

  }

  const employee =
    normalizeActor(
      actor ||
      getStoredSession()
    );

  if (
    shifts[index].employee?.id &&
    employee?.id &&
    shifts[index].employee.id !==
      employee.id &&
    ![
      'owner',
      'admin'
    ].includes(
      employee.role
    )
  ) {

    throw new Error(
      'Solo el responsable del turno o un administrador puede cerrarlo.'
    );

  }

  const numericCounted =
    parseAmount(
      countedCash
    );

  if (
    numericCounted <
    0
  ) {

    throw new Error(
      'El efectivo contado no puede ser negativo.'
    );

  }

  const summary =
    calculateCashShiftSummary(
      shifts[index]
    );

  const now =
    new Date()
      .toISOString();

  const closed = {
    ...shifts[index],

    status:
      'closed',

    closedAt:
      now,

    countedCash:
      numericCounted,

    expectedCash:
      Number(
        summary.expectedCash.toFixed(
          2
        )
      ),

    difference:
      Number(
        (
          numericCounted -
          summary.expectedCash
        ).toFixed(
          2
        )
      ),

    closingNotes:
      String(
        notes ||
        ''
      ).trim(),

    closedBy:
      employee,

    closeSnapshot: {
      openingCash:
        summary.openingCash,

      memberships:
        summary.memberships,

      sales:
        summary.sales,

      soldProducts:
        summary.sales?.products ||
        [],

      otherIncome:
        summary.otherIncome,

      expenses:
        summary.expenses,

      withdrawals:
        summary.withdrawals,

      expectedCash:
        summary.expectedCash,

      totalHandled:
        summary.totalHandled,

      paymentMethods:
        summary.paymentMethods
    },

    updatedAt:
      now
  };

  shifts[index] =
    closed;

  saveArray(
    CASH_SHIFTS_KEY,
    shifts
  );

  return closed;

};


// ======================================================
// RESUMEN HISTÓRICO POR EMPLEADO
// ======================================================

export const getEmployeeCashSummary =
  (
    userId
  ) => {

    const shifts =
      getCashShifts()
        .filter(
          shift =>
            !userId ||
            shift.employee?.id ===
              userId
        );

    const closed =
      shifts.filter(
        shift =>
          shift.status ===
          'closed'
      );

    return {
      shiftCount:
        shifts.length,

      closedCount:
        closed.length,

      handled:
        closed.reduce(
          (
            sum,
            shift
          ) =>
            sum +
            parseAmount(
              shift.closeSnapshot?.totalHandled
            ),
          0
        ),

      differences:
        closed.reduce(
          (
            sum,
            shift
          ) =>
            sum +
            parseAmount(
              shift.difference
            ),
          0
        )
    };

  };


export default {
  CASH_SHIFTS_KEY,
  CASH_MOVEMENTS_KEY,
  getCashShifts,
  getCashMovements,
  getOpenCashShiftForUser,
  getOpenCashShiftForCurrentUser,
  openCashShift,
  createCashMovement,
  getShiftPayments,
  getShiftSales,
  getShiftMovements,
  calculateCashShiftSummary,
  closeCashShift,
  getEmployeeCashSummary
};
