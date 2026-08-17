// src/services/salesService.js

import {
  getProductById
} from './productService';

import {
  registerInventoryMovement
} from './inventoryService';

import {
  getOpenCashShiftForCurrentUser
} from './cashService';

export const SALES_KEY =
  'gym_control_sales';


const getSession = () => {
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


const createId = (
  prefix = 'SALE'
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


export const getSales = () => {
  try {
    const raw =
      localStorage.getItem(
        SALES_KEY
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
      'Error leyendo ventas:',
      error
    );

    return [];

  }
};


const saveSales = (
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


export const createSale = ({
  items,
  customer = null,
  paymentMethod = 'efectivo',
  received = 0,
  reference = '',
  notes = '',
  discount = 0
}) => {

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


  const session =
    getSession();


  if (
    !session?.id
  ) {

    throw new Error(
      'No existe una sesión válida para registrar la venta.'
    );

  }


  const openCashShift =
    getOpenCashShiftForCurrentUser();


  if (
    !openCashShift
  ) {

    throw new Error(
      'Debes abrir tu turno de caja antes de registrar una venta.'
    );

  }


  const normalizedItems =
    items.map(
      item => {

        const product =
          getProductById(
            item.productId
          );


        if (!product) {

          throw new Error(
            `No se encontró el producto ${item.productId}.`
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


        if (
          quantity >
          Number(
            product.stock ||
            0
          )
        ) {

          throw new Error(
            `Stock insuficiente de ${product.name}. Disponible: ${product.stock || 0}.`
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


  const discountAmount =
    Math.max(
      0,
      Math.min(
        Number(
          discount ||
          0
        ),
        subtotal
      )
    );


  const total =
    Math.max(
      0,
      subtotal -
      discountAmount
    );


  const receivedAmount =
    paymentMethod ===
      'efectivo'
      ? Number(
          received ||
          0
        )
      : total;


  if (
    paymentMethod ===
      'efectivo' &&
    receivedAmount <
      total
  ) {

    throw new Error(
      'El efectivo recibido es menor al total de la venta.'
    );

  }


  const change =
    paymentMethod ===
      'efectivo'
      ? Math.max(
          0,
          receivedAmount -
          total
        )
      : 0;


  const now =
    new Date()
      .toISOString();


  const saleId =
    createId(
      'SALE'
    );


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


  const estimatedCost =
    normalizedItems.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.unitCost ||
          0
        ) *
        Number(
          item.quantity ||
          0
        ),
      0
    );


  const sale = {

    id:
      saleId,

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

    paymentMethod,

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

    createdBy:
      {
        id:
          session.id ||
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
  };


  const sales =
    getSales();

  sales.unshift(
    sale
  );

  saveSales(
    sales
  );


  return sale;

};


export const cancelSale = (
  saleId,
  reason = ''
) => {

  const sales =
    getSales();


  const index =
    sales.findIndex(
      item =>
        item.id ===
        saleId
    );


  if (
    index <
    0
  ) {

    throw new Error(
      'No se encontró la venta.'
    );

  }


  if (
    sales[
      index
    ].status ===
    'cancelled'
  ) {

    return sales[
      index
    ];

  }


  const session =
    getSession();


  sales[
    index
  ].items.forEach(
    item => {

      registerInventoryMovement({
        productId:
          item.productId,

        type:
          'return',

        quantity:
          item.quantity,

        reason:
          `Cancelación de ${sales[index].folio}`,

        referenceId:
          saleId,

        actor:
          session
      });

    }
  );


  sales[
    index
  ] = {

    ...sales[
      index
    ],

    status:
      'cancelled',

    cancelledAt:
      new Date()
        .toISOString(),

    cancellationReason:
      String(
        reason ||
        ''
      ).trim(),

    cancelledBy:
      session
        ? {
            id:
              session.id ||
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


  saveSales(
    sales
  );


  return sales[
    index
  ];

};


export const getSalesSummary = (
  sales =
    getSales()
) => {

  const completed =
    sales.filter(
      item =>
        item.status !==
        'cancelled'
    );


  const today =
    new Date();


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


  const sum =
    list =>
      list.reduce(
        (
          total,
          sale
        ) =>
          total +
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
          total,
          sale
        ) =>
          total +
          Number(
            sale.estimatedProfit ||
            0
          ),
        0
      );


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
