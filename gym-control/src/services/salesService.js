// src/services/salesService.js

import {
  getProductById
} from './productService.js';

import {
  registerInventoryMovement
} from './inventoryService.js';

import {
  getOpenCashShiftForCurrentUser
} from './cashService.js';

import {
  getCurrentGymContext
} from '../utils/memberId.js';

import {
  saveOfflineSale
} from '../offline/repositories/saleRepository.js';


// ======================================================
// STORAGE
// ======================================================

export const SALES_KEY =
  'gym_control_sales';


// ======================================================
// SESIÓN
// ======================================================

const getSession =
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

    } catch (error) {

      console.error(
        'Error leyendo sesión para ventas:',
        error
      );


      return null;

    }

  };


// ======================================================
// CONTEXTO DEL GYM
// ======================================================

const getSalesGymContext =
  () => {

    try {

      return (
        getCurrentGymContext() ||
        {}
      );

    } catch (error) {

      console.error(
        'Error obteniendo contexto del gimnasio para ventas:',
        error
      );


      return {};

    }

  };


// ======================================================
// CREAR ID
// ======================================================

const createId =
  (
    prefix = 'SALE'
  ) => {

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
// LEER TODAS SIN FILTRAR
// ======================================================
//
// SOLO LECTURA.
//
// ======================================================

export const getAllStoredSales =
  () => {

    try {

      const raw =
        localStorage.getItem(
          SALES_KEY
        );


      if (
        !raw
      ) {

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
        'Error leyendo ventas:',
        error
      );


      return [];

    }

  };


// ======================================================
// GUARDAR VENTAS
// ======================================================

const saveSales =
  (
    sales
  ) => {

    localStorage.setItem(
      SALES_KEY,
      JSON.stringify(
        Array.isArray(
          sales
        )
          ? sales
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
        'gym-sales-update'
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-cash-update'
      )
    );

  };


// ======================================================
// VENTAS DEL GIMNASIO ACTUAL
// ======================================================
//
// SOLO LECTURA.
//
// Esta función ya no migra datos,
// no escribe localStorage
// y no dispara eventos.
//
// ======================================================

export const getSales =
  () => {

    const sales =
      getAllStoredSales();


    const {
      gymId
    } =
      getSalesGymContext();


    if (
      !gymId
    ) {

      return sales;

    }


    return sales.filter(
      sale =>
        !sale?.gymId ||
        sale.gymId ===
          gymId
    );

  };


// ======================================================
// VENTA POR ID
// ======================================================

export const getSaleById =
  (
    saleId
  ) => {

    if (
      !saleId
    ) {

      return null;

    }


    return (
      getSales().find(
        sale =>
          sale.id ===
          saleId
      ) ||
      null
    );

  };


// ======================================================
// NORMALIZAR ACTOR
// ======================================================

const normalizeActor =
  (
    actor
  ) => {

    if (
      !actor
    ) {

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
// CREAR VENTA
// ======================================================

export const createSale =
  ({
    items,
    customer = null,
    paymentMethod = 'efectivo',
    received = 0,
    reference = '',
    notes = '',
    discount = 0
  }) => {

    // ==================================================
    // VALIDAR CARRITO
    // ==================================================

    if (
      !Array.isArray(
        items
      ) ||
      items.length ===
        0
    ) {

      throw new Error(
        'Agrega al menos un producto al carrito.'
      );

    }


    // ==================================================
    // SESIÓN
    // ==================================================

    const session =
      getSession();


    if (
      !session?.id
    ) {

      throw new Error(
        'No existe una sesión válida para registrar la venta.'
      );

    }


    // ==================================================
    // GIMNASIO
    // ==================================================

    const {
      gymId,
      gymCode,
      gymName
    } =
      getSalesGymContext();


    if (
      !gymId
    ) {

      throw new Error(
        'No se pudo determinar el gimnasio actual.'
      );

    }


    // ==================================================
    // TURNO DE CAJA
    // ==================================================

    const openCashShift =
      getOpenCashShiftForCurrentUser();


    if (
      !openCashShift
    ) {

      throw new Error(
        'Debes abrir tu turno de caja antes de registrar una venta.'
      );

    }


    if (
      openCashShift.gymId &&
      openCashShift.gymId !==
        gymId
    ) {

      throw new Error(
        'El turno de caja pertenece a otro gimnasio.'
      );

    }


    // ==================================================
    // NORMALIZAR PRODUCTOS
    // ==================================================

    const normalizedItems =
      items.map(
        item => {

          const product =
            getProductById(
              item.productId
            );


          if (
            !product
          ) {

            throw new Error(
              `No se encontró el producto ${item.productId}.`
            );

          }


          if (
            product.gymId &&
            product.gymId !==
              gymId
          ) {

            throw new Error(
              `${product.name} pertenece a otro gimnasio.`
            );

          }


          if (
            product.status ===
            'inactive'
          ) {

            throw new Error(
              `${product.name} está desactivado.`
            );

          }


          const quantity =
            Number(
              item.quantity ||
              0
            );


          if (
            !Number.isFinite(
              quantity
            ) ||
            quantity <=
              0
          ) {

            throw new Error(
              `Cantidad inválida para ${product.name}.`
            );

          }


          const availableStock =
            Number(
              product.stock ||
              0
            );


          if (
            quantity >
            availableStock
          ) {

            throw new Error(
              `Stock insuficiente de ${product.name}. Disponible: ${availableStock}.`
            );

          }


          const unitPrice =
            Number(
              item.unitPrice ??
              product.price ??
              0
            );


          const unitCost =
            Number(
              product.cost ||
              0
            );


          if (
            !Number.isFinite(
              unitPrice
            ) ||
            unitPrice <
              0
          ) {

            throw new Error(
              `Precio inválido para ${product.name}.`
            );

          }


          const subtotal =
            unitPrice *
            quantity;


          return {

            productId:
              product.id,

            name:
              product.name,

            category:
              product.category ||
              'Otros',

            sku:
              product.sku ||
              '',

            barcode:
              product.barcode ||
              '',

            quantity,

            unitPrice,

            unitCost,

            subtotal

          };

        }
      );


    // ==================================================
    // SUBTOTAL
    // ==================================================

    const subtotal =
      normalizedItems.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.subtotal ||
            0
          ),
        0
      );


    // ==================================================
    // DESCUENTO
    // ==================================================

    const numericDiscount =
      Number(
        discount ||
        0
      );


    const discountAmount =
      Math.max(
        0,
        Math.min(
          Number.isFinite(
            numericDiscount
          )
            ? numericDiscount
            : 0,
          subtotal
        )
      );


    // ==================================================
    // TOTAL
    // ==================================================

    const total =
      Math.max(
        0,
        subtotal -
        discountAmount
      );


    // ==================================================
    // MÉTODO DE PAGO
    // ==================================================

    const normalizedMethod =
      String(
        paymentMethod ||
        'efectivo'
      )
        .trim()
        .toLowerCase();


    const receivedAmount =
      normalizedMethod ===
        'efectivo'
        ? Number(
            received ||
            0
          )
        : total;


    if (
      normalizedMethod ===
        'efectivo' &&
      (
        !Number.isFinite(
          receivedAmount
        ) ||
        receivedAmount <
          total
      )
    ) {

      throw new Error(
        'El efectivo recibido es menor al total de la venta.'
      );

    }


    // ==================================================
    // CAMBIO
    // ==================================================

    const change =
      normalizedMethod ===
        'efectivo'
        ? Math.max(
            0,
            receivedAmount -
            total
          )
        : 0;


    // ==================================================
    // ID / FECHA
    // ==================================================

    const now =
      new Date()
        .toISOString();


    const saleId =
      createId(
        'SALE'
      );


    // ==================================================
    // DESCONTAR INVENTARIO
    // ==================================================
    //
    // Esto genera:
    //
    // product UPDATE
    // inventory_movement CREATE
    // IndexedDB
    // syncQueue
    //
    // ==================================================

    normalizedItems.forEach(
      item => {

        registerInventoryMovement({

          productId:
            item.productId,

          type:
            'sale',

          quantity:
            item.quantity,

          reason:
            `Venta ${saleId}`,

          referenceId:
            saleId,

          actor:
            session

        });

      }
    );


    // ==================================================
    // COSTO ESTIMADO
    // ==================================================

    const estimatedCost =
      normalizedItems.reduce(
        (
          sum,
          item
        ) =>
          sum +
          (
            Number(
              item.unitCost ||
              0
            ) *
            Number(
              item.quantity ||
              0
            )
          ),
        0
      );


    // ==================================================
    // VENTA
    // ==================================================

    const sale = {

      id:
        saleId,

      gymId,

      gymCode:
        gymCode ||
        null,

      gymName:
        gymName ||
        null,

      folio:
        `VTA-${String(
          Date.now()
        ).slice(
          -8
        )}`,

      cashShiftId:
        openCashShift.id,

      cashEmployeeId:
        openCashShift.employee?.id ||
        session.id,

      customer:
        customer
          ? {

              type:
                customer.type ||
                'member',

              memberId:
                customer.memberId ||
                customer.id ||
                '',

              memberName:
                customer.memberName ||
                `${customer.firstName || ''} ${customer.lastName || ''}`
                  .trim() ||
                'Miembro',

              phone:
                customer.phone ||
                ''

            }
          : {

              type:
                'general',

              memberId:
                '',

              memberName:
                'Venta general',

              phone:
                ''

            },

      items:
        normalizedItems,

      itemCount:
        normalizedItems.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.quantity ||
              0
            ),
          0
        ),

      subtotal,

      discount:
        discountAmount,

      total,

      estimatedCost,

      estimatedProfit:
        total -
        estimatedCost,

      paymentMethod:
        normalizedMethod,

      received:
        receivedAmount,

      change,

      reference:
        String(
          reference ||
          ''
        ).trim(),

      notes:
        String(
          notes ||
          ''
        ).trim(),

      status:
        'completed',

      createdAt:
        now,

      updatedAt:
        now,

      createdBy:
        normalizeActor(
          session
        )

    };


    // ==================================================
    // LOCALSTORAGE
    // ==================================================

    const allSales =
      getAllStoredSales();


    allSales.unshift(
      sale
    );


    saveSales(
      allSales
    );


    // ==================================================
    // INDEXEDDB + SYNCQUEUE
    // ==================================================

    void saveOfflineSale(
      sale
    )
      .then(
        saved => {

          console.log(
            '✅ Venta respaldada en IndexedDB:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo respaldar la venta en IndexedDB:',
            error
          );

        }
      );


    return sale;

  };


// ======================================================
// CANCELAR VENTA
// ======================================================

export const cancelSale =
  (
    saleId,
    reason = ''
  ) => {

    const current =
      getSaleById(
        saleId
      );


    if (
      !current
    ) {

      throw new Error(
        'No se encontró la venta.'
      );

    }


    if (
      current.status ===
      'cancelled'
    ) {

      return current;

    }


    const session =
      getSession();


    const {
      gymId
    } =
      getSalesGymContext();


    if (
      !gymId
    ) {

      throw new Error(
        'No se pudo determinar el gimnasio actual.'
      );

    }


    // ==================================================
    // DEVOLVER INVENTARIO
    // ==================================================

    (
      Array.isArray(
        current.items
      )
        ? current.items
        : []
    ).forEach(
      item => {

        registerInventoryMovement({

          productId:
            item.productId,

          type:
            'return',

          quantity:
            item.quantity,

          reason:
            `Cancelación de ${current.folio}`,

          referenceId:
            saleId,

          actor:
            session

        });

      }
    );


    // ==================================================
    // ACTUALIZAR VENTA
    // ==================================================

    const now =
      new Date()
        .toISOString();


    const cancelledSale = {

      ...current,

      gymId,

      status:
        'cancelled',

      cancelledAt:
        now,

      cancellationReason:
        String(
          reason ||
          ''
        ).trim(),

      cancelledBy:
        normalizeActor(
          session
        ),

      updatedAt:
        now

    };


    // ==================================================
    // LOCALSTORAGE
    // ==================================================

    const allSales =
      getAllStoredSales();


    const index =
      allSales.findIndex(
        item =>
          item.id ===
            saleId &&
        (
          !item.gymId ||
          item.gymId ===
            gymId
        )
      );


    if (
      index <
      0
    ) {

      throw new Error(
        'No se encontró la venta almacenada.'
      );

    }


    allSales[
      index
    ] =
      cancelledSale;


    saveSales(
      allSales
    );


    // ==================================================
    // INDEXEDDB + SYNCQUEUE
    // ==================================================

    void saveOfflineSale(
      cancelledSale
    )
      .then(
        saved => {

          console.log(
            '✅ Cancelación de venta respaldada offline:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo respaldar la cancelación:',
            error
          );

        }
      );


    return cancelledSale;

  };


// ======================================================
// RESUMEN
// ======================================================

export const getSalesSummary =
  (
    sales = getSales()
  ) => {

    const completed =
      (
        Array.isArray(
          sales
        )
          ? sales
          : []
      )
        .filter(
          item =>
            item.status !==
            'cancelled'
        );


    const today =
      new Date();


    // ==================================================
    // HOY
    // ==================================================

    const isToday =
      value => {

        const date =
          new Date(
            value
          );


        return (
          !Number.isNaN(
            date.getTime()
          ) &&
          date.getDate() ===
            today.getDate() &&
          date.getMonth() ===
            today.getMonth() &&
          date.getFullYear() ===
            today.getFullYear()
        );

      };


    // ==================================================
    // MES ACTUAL
    // ==================================================

    const isThisMonth =
      value => {

        const date =
          new Date(
            value
          );


        return (
          !Number.isNaN(
            date.getTime()
          ) &&
          date.getMonth() ===
            today.getMonth() &&
          date.getFullYear() ===
            today.getFullYear()
        );

      };


    const todaySales =
      completed.filter(
        item =>
          isToday(
            item.createdAt
          )
      );


    const monthSales =
      completed.filter(
        item =>
          isThisMonth(
            item.createdAt
          )
      );


    // ==================================================
    // SUMAS
    // ==================================================

    const sum =
      list =>
        list.reduce(
          (
            totalValue,
            sale
          ) =>
            totalValue +
            Number(
              sale.total ||
              0
            ),
          0
        );


    const profit =
      list =>
        list.reduce(
          (
            totalValue,
            sale
          ) =>
            totalValue +
            Number(
              sale.estimatedProfit ||
              0
            ),
          0
        );


    // ==================================================
    // RESULTADO
    // ==================================================

    return {

      totalSales:
        completed.length,

      todayCount:
        todaySales.length,

      monthCount:
        monthSales.length,

      todayIncome:
        sum(
          todaySales
        ),

      monthIncome:
        sum(
          monthSales
        ),

      todayProfit:
        profit(
          todaySales
        ),

      monthProfit:
        profit(
          monthSales
        ),

      productsSoldToday:
        todaySales.reduce(
          (
            sumValue,
            sale
          ) =>
            sumValue +
            Number(
              sale.itemCount ||
              0
            ),
          0
        ),

      productsSoldMonth:
        monthSales.reduce(
          (
            sumValue,
            sale
          ) =>
            sumValue +
            Number(
              sale.itemCount ||
              0
            ),
          0
        )

    };

  };


// ======================================================
// DEFAULT
// ======================================================

const salesService = {

  getAllStoredSales,

  getSales,

  getSaleById,

  createSale,

  cancelSale,

  getSalesSummary

};


export default salesService;
