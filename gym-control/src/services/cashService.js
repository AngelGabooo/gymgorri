// src/services/cashService.js

import {
  getCurrentGymContext
} from '../utils/memberId.js';

import {
  saveOfflineCashShift
} from '../offline/repositories/cashShiftRepository.js';

import {
  saveOfflineCashMovement
} from '../offline/repositories/cashMovementRepository.js';


// ======================================================
// STORAGE
// ======================================================

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

const readArray =
  key => {

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
// GUARDAR
// ======================================================

const saveArray =
  (
    key,
    records
  ) => {

    localStorage.setItem(
      key,
      JSON.stringify(
        Array.isArray(
          records
        )
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


// ======================================================
// ID
// ======================================================

const createId =
  prefix => {

    if (
      window.crypto?.randomUUID
    ) {

      return `${prefix}-${window.crypto.randomUUID()}`;

    }


    return (
      `${prefix}-${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(
          2,
          8
        )
    );

  };


// ======================================================
// ACTOR
// ======================================================

const normalizeActor =
  actor => {

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


// ======================================================
// SESIÓN
// ======================================================

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


// ======================================================
// CONTEXTO
// ======================================================

const getCashGymContext =
  () => {

    try {

      return (
        getCurrentGymContext() ||
        {}
      );

    } catch (error) {

      console.error(
        'Error obteniendo contexto del gimnasio para caja:',
        error
      );


      return {};

    }

  };


// ======================================================
// CANTIDAD
// ======================================================

const parseAmount =
  value => {

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


// ======================================================
// MÉTODO
// ======================================================

const normalizeMethod =
  value =>
    String(
      value ||
      ''
    )
      .trim()
      .toLowerCase();


const isCashMethod =
  method =>
    normalizeMethod(
      method
    ) ===
    'efectivo';


// ======================================================
// PERIODO DEL TURNO
// ======================================================

const isWithinShift =
  (
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
// GYM DEL REGISTRO
// ======================================================

const belongsToCurrentGym =
  record => {

    const {
      gymId
    } =
      getCashGymContext();


    if (!gymId) {

      return true;

    }


    /*
     * Compatibilidad con registros anteriores
     * creados antes del modo multi-gym.
     */

    if (
      !record?.gymId
    ) {

      return true;

    }


    return (
      record.gymId ===
      gymId
    );

  };


// ======================================================
// MIGRAR TURNOS LEGACY
// ======================================================

const migrateLegacyShifts =
  shifts => {

    const {
      gymId,
      gymCode,
      gymName
    } =
      getCashGymContext();


    if (!gymId) {

      return shifts;

    }


    let changed =
      false;


    const migrated =
      shifts.map(
        shift => {

          if (
            shift?.gymId
          ) {

            return shift;

          }


          changed =
            true;


          return {

            ...shift,

            gymId,

            gymCode:
              gymCode ||
              null,

            gymName:
              gymName ||
              null,

            updatedAt:
              shift.updatedAt ||
              shift.createdAt ||
              new Date()
                .toISOString()

          };

        }
      );


    if (
      changed
    ) {

      saveArray(
        CASH_SHIFTS_KEY,
        migrated
      );

    }


    return migrated;

  };


// ======================================================
// MIGRAR MOVIMIENTOS LEGACY
// ======================================================

const migrateLegacyMovements =
  movements => {

    const {
      gymId,
      gymCode,
      gymName
    } =
      getCashGymContext();


    if (!gymId) {

      return movements;

    }


    let changed =
      false;


    const migrated =
      movements.map(
        movement => {

          if (
            movement?.gymId
          ) {

            return movement;

          }


          changed =
            true;


          return {

            ...movement,

            gymId,

            gymCode:
              gymCode ||
              null,

            gymName:
              gymName ||
              null,

            updatedAt:
              movement.updatedAt ||
              movement.createdAt ||
              new Date()
                .toISOString()

          };

        }
      );


    if (
      changed
    ) {

      saveArray(
        CASH_MOVEMENTS_KEY,
        migrated
      );

    }


    return migrated;

  };


// ======================================================
// TURNOS
// ======================================================

export const getCashShifts =
  () => {

    const shifts =
      migrateLegacyShifts(
        readArray(
          CASH_SHIFTS_KEY
        )
      );


    const {
      gymId
    } =
      getCashGymContext();


    if (!gymId) {

      return shifts;

    }


    return shifts.filter(
      shift =>
        shift.gymId ===
        gymId
    );

  };


// ======================================================
// MOVIMIENTOS
// ======================================================

export const getCashMovements =
  () => {

    const movements =
      migrateLegacyMovements(
        readArray(
          CASH_MOVEMENTS_KEY
        )
      );


    const {
      gymId
    } =
      getCashGymContext();


    if (!gymId) {

      return movements;

    }


    return movements.filter(
      movement =>
        movement.gymId ===
        gymId
    );

  };


// ======================================================
// TURNO ABIERTO POR USUARIO
// ======================================================

export const getOpenCashShiftForUser =
  userId => {

    if (!userId) {

      return null;

    }


    return (
      getCashShifts().find(
        shift =>
          shift.status ===
            'open' &&
          shift.employee?.id ===
            userId
      ) ||
      null
    );

  };


// ======================================================
// TURNO ACTUAL
// ======================================================

export const getOpenCashShiftForCurrentUser =
  () => {

    const session =
      getStoredSession();


    return getOpenCashShiftForUser(
      session?.id
    );

  };


// ======================================================
// ABRIR CAJA
// ======================================================

export const openCashShift =
  ({
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


    const {
      gymId,
      gymCode,
      gymName
    } =
      getCashGymContext();


    if (!gymId) {

      throw new Error(
        'No se pudo determinar el gimnasio actual.'
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

      gymId,

      gymCode:
        gymCode ||
        null,

      gymName:
        gymName ||
        null,

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


    const allShifts =
      readArray(
        CASH_SHIFTS_KEY
      );


    allShifts.unshift(
      shift
    );


    saveArray(
      CASH_SHIFTS_KEY,
      allShifts
    );


    void saveOfflineCashShift(
      shift
    )
      .then(
        saved => {

          console.log(
            '✅ Apertura de caja respaldada offline:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo respaldar la apertura de caja:',
            error
          );

        }
      );


    return shift;

  };


// ======================================================
// MOVIMIENTOS MANUALES
// ======================================================

export const createCashMovement =
  ({
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


    const {
      gymId,
      gymCode,
      gymName
    } =
      getCashGymContext();


    if (!gymId) {

      throw new Error(
        'No se pudo determinar el gimnasio actual.'
      );

    }


    const now =
      new Date()
        .toISOString();


    const movement = {

      id:
        createId(
          'CASHMOV'
        ),

      gymId,

      gymCode:
        gymCode ||
        null,

      gymName:
        gymName ||
        null,

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
        now,

      updatedAt:
        now

    };


    const allMovements =
      readArray(
        CASH_MOVEMENTS_KEY
      );


    allMovements.unshift(
      movement
    );


    saveArray(
      CASH_MOVEMENTS_KEY,
      allMovements
    );


    void saveOfflineCashMovement(
      movement
    )
      .then(
        saved => {

          console.log(
            '✅ Movimiento de caja respaldado offline:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo respaldar el movimiento de caja:',
            error
          );

        }
      );


    return movement;

  };


// ======================================================
// PERTENECE AL TURNO
// ======================================================

const belongsToShift =
  (
    record,
    shift
  ) => {

    if (
      !record ||
      !shift?.id
    ) {

      return false;

    }


    if (
      !belongsToCurrentGym(
        record
      )
    ) {

      return false;

    }


    // ==================================================
    // VÍNCULO EXPLÍCITO
    // ==================================================

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


    return true;

  };


// ======================================================
// PAGOS DEL TURNO
// ======================================================

export const getShiftPayments =
  shift => {

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


// ======================================================
// VENTAS DEL TURNO
// ======================================================

export const getShiftSales =
  shift => {

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


// ======================================================
// MOVIMIENTOS DEL TURNO
// ======================================================

export const getShiftMovements =
  shift => {

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

export const calculateCashShiftSummary =
  shift => {

    if (!shift?.id) {

      return {

        openingCash:
          0,

        memberships: {

          total:
            0,

          cash:
            0,

          cashReceived:
            0,

          changeGiven:
            0,

          cashNet:
            0,

          count:
            0

        },

        sales: {

          total:
            0,

          cash:
            0,

          cashReceived:
            0,

          changeGiven:
            0,

          cashNet:
            0,

          count:
            0,

          itemCount:
            0,

          products:
            []

        },

        otherIncome:
          0,

        expenses:
          0,

        withdrawals:
          0,

        expectedCash:
          0,

        cashFlow: {

          received:
            0,

          changeGiven:
            0,

          netSalesAndMemberships:
            0

        },

        paymentMethods:
          {}

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


    // ==================================================
    // MEMBRESÍAS
    // ==================================================

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


    const cashMembershipPayments =
      payments.filter(
        payment =>
          isCashMethod(
            payment.paymentMethod ||
            payment.method
          )
      );


    const membershipsCash =
      cashMembershipPayments.reduce(
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


    const membershipsCashReceived =
      cashMembershipPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum +
          parseAmount(
            payment.receivedAmount ??
            payment.received ??
            payment.amount
          ),
        0
      );


    const membershipsChangeGiven =
      cashMembershipPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum +
          parseAmount(
            payment.change ??
            payment.changeAmount ??
            0
          ),
        0
      );


    const membershipsCashNet =
      membershipsCashReceived -
      membershipsChangeGiven;


    // ==================================================
    // VENTAS
    // ==================================================

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


    const cashSales =
      sales.filter(
        sale =>
          isCashMethod(
            sale.paymentMethod
          )
      );


    const salesCash =
      cashSales.reduce(
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


    const salesCashReceived =
      cashSales.reduce(
        (
          sum,
          sale
        ) =>
          sum +
          parseAmount(
            sale.received ??
            sale.receivedAmount ??
            sale.total
          ),
        0
      );


    const salesChangeGiven =
      cashSales.reduce(
        (
          sum,
          sale
        ) =>
          sum +
          parseAmount(
            sale.change ??
            sale.changeAmount ??
            0
          ),
        0
      );


    const salesCashNet =
      salesCashReceived -
      salesChangeGiven;


    // ==================================================
    // PRODUCTOS VENDIDOS
    // ==================================================

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


    // ==================================================
    // MOVIMIENTOS
    // ==================================================

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


    // ==================================================
    // EFECTIVO ESPERADO
    // ==================================================

    const openingCash =
      parseAmount(
        shift.openingCash
      );


    const totalCashReceived =
      membershipsCashReceived +
      salesCashReceived;


    const totalChangeGiven =
      membershipsChangeGiven +
      salesChangeGiven;


    const netSalesAndMemberships =
      membershipsCashNet +
      salesCashNet;


    const expectedCash =
      openingCash +
      totalCashReceived -
      totalChangeGiven +
      otherIncome -
      expenses -
      withdrawals;


    // ==================================================
    // MÉTODOS DE PAGO
    // ==================================================

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

        cashReceived:
          membershipsCashReceived,

        changeGiven:
          membershipsChangeGiven,

        cashNet:
          membershipsCashNet,

        count:
          payments.length

      },

      salesSummary: {

        total:
          salesTotal,

        cash:
          salesCash,

        cashReceived:
          salesCashReceived,

        changeGiven:
          salesChangeGiven,

        cashNet:
          salesCashNet,

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

      cashFlow: {

        received:
          totalCashReceived,

        changeGiven:
          totalChangeGiven,

        netSalesAndMemberships

      },

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

export const closeCashShift =
  ({
    shiftId,
    countedCash,
    notes = '',
    actor = null
  }) => {

    const currentShifts =
      getCashShifts();


    const current =
      currentShifts.find(
        shift =>
          shift.id ===
          shiftId
      );


    if (!current) {

      throw new Error(
        'No se encontró el turno de caja.'
      );

    }


    if (
      current.status !==
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
      current.employee?.id &&
      employee?.id &&
      current.employee.id !==
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
        current
      );


    const now =
      new Date()
        .toISOString();


    const closed = {

      ...current,

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
          summary.salesSummary,

        soldProducts:
          summary.salesSummary?.products ||
          [],

        otherIncome:
          summary.otherIncome,

        expenses:
          summary.expenses,

        withdrawals:
          summary.withdrawals,

        cashFlow:
          summary.cashFlow,

        cashReceived:
          summary.cashFlow?.received ||
          0,

        changeGiven:
          summary.cashFlow?.changeGiven ||
          0,

        netSalesAndMemberships:
          summary.cashFlow?.netSalesAndMemberships ||
          0,

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


    // ==================================================
    // LOCALSTORAGE
    // ==================================================

    const allShifts =
      readArray(
        CASH_SHIFTS_KEY
      );


    const index =
      allShifts.findIndex(
        shift =>
          shift.id ===
            shiftId &&
          shift.gymId ===
            current.gymId
      );


    if (
      index <
      0
    ) {

      throw new Error(
        'No se encontró el turno almacenado.'
      );

    }


    allShifts[
      index
    ] =
      closed;


    saveArray(
      CASH_SHIFTS_KEY,
      allShifts
    );


    // ==================================================
    // INDEXEDDB + SYNCQUEUE
    // ==================================================

    void saveOfflineCashShift(
      closed
    )
      .then(
        saved => {

          console.log(
            '✅ Cierre de caja respaldado offline:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo respaldar el cierre de caja:',
            error
          );

        }
      );


    return closed;

  };


// ======================================================
// RESUMEN HISTÓRICO POR EMPLEADO
// ======================================================

export const getEmployeeCashSummary =
  userId => {

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


// ======================================================
// EXPORT
// ======================================================

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