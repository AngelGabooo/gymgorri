// src/services/productAnalyticsService.js

import {
  getProducts
} from './productService';

import {
  getSales
} from './salesService';

import {
  getInventoryMovements
} from './inventoryService';


// ======================================================
// FECHAS / PERIODOS
// ======================================================

const startOfDay = (
  value = new Date()
) => {

  const date =
    new Date(
      value
    );


  date.setHours(
    0,
    0,
    0,
    0
  );


  return date;

};


const endOfDay = (
  value = new Date()
) => {

  const date =
    new Date(
      value
    );


  date.setHours(
    23,
    59,
    59,
    999
  );


  return date;

};


const startOfMonth = (
  value = new Date()
) => {

  const date =
    new Date(
      value
    );


  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

};


const endOfMonth = (
  value = new Date()
) => {

  const date =
    new Date(
      value
    );


  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

};


export const getAnalyticsRange = (
  period = 'month'
) => {

  const now =
    new Date();


  if (
    period ===
    'today'
  ) {

    return {
      start:
        startOfDay(
          now
        ),

      end:
        endOfDay(
          now
        ),

      label:
        'Hoy'
    };

  }


  if (
    period ===
    '7d'
  ) {

    const start =
      startOfDay(
        now
      );


    start.setDate(
      start.getDate() -
      6
    );


    return {
      start,
      end:
        endOfDay(
          now
        ),

      label:
        'Últimos 7 días'
    };

  }


  if (
    period ===
    '30d'
  ) {

    const start =
      startOfDay(
        now
      );


    start.setDate(
      start.getDate() -
      29
    );


    return {
      start,
      end:
        endOfDay(
          now
        ),

      label:
        'Últimos 30 días'
    };

  }


  if (
    period ===
    'previousMonth'
  ) {

    const previous =
      new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );


    return {
      start:
        startOfMonth(
          previous
        ),

      end:
        endOfMonth(
          previous
        ),

      label:
        'Mes anterior'
    };

  }


  if (
    period ===
    'all'
  ) {

    return {
      start:
        null,

      end:
        null,

      label:
        'Histórico'
    };

  }


  return {
    start:
      startOfMonth(
        now
      ),

    end:
      endOfMonth(
        now
      ),

    label:
      'Este mes'
  };

};


const isInRange = (
  value,
  range
) => {

  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return false;

  }


  if (
    range.start &&
    date <
      range.start
  ) {

    return false;

  }


  if (
    range.end &&
    date >
      range.end
  ) {

    return false;

  }


  return true;

};


// ======================================================
// UTILIDADES
// ======================================================

const roundMoney = (
  value
) =>
  Math.round(
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


const daysBetween = (
  start,
  end
) => {

  const startDate =
    startOfDay(
      start
    );


  const endDate =
    startOfDay(
      end
    );


  return Math.max(
    1,
    Math.ceil(
      (
        endDate -
        startDate
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    ) +
    1
  );

};


const getPeriodDays = (
  range,
  sales
) => {

  if (
    range.start &&
    range.end
  ) {

    return daysBetween(
      range.start,
      range.end
    );

  }


  const dates =
    sales
      .map(
        sale =>
          new Date(
            sale.createdAt
          )
      )
      .filter(
        date =>
          !Number.isNaN(
            date.getTime()
          )
      );


  if (
    dates.length ===
    0
  ) {

    return 1;

  }


  dates.sort(
    (
      a,
      b
    ) =>
      a -
      b
  );


  return daysBetween(
    dates[0],
    new Date()
  );

};


// ======================================================
// HISTORIAL DE VENTAS DE UN PRODUCTO
// ======================================================

export const getProductSalesHistory = ({
  productId,
  period = 'all'
}) => {

  const range =
    getAnalyticsRange(
      period
    );


  const sales =
    getSales()
      .filter(
        sale =>
          sale.status !==
            'cancelled' &&
          isInRange(
            sale.createdAt,
            range
          )
      );


  const history =
    [];


  sales.forEach(
    sale => {

      (
        sale.items ||
        []
      ).forEach(
        item => {

          if (
            item.productId !==
            productId
          ) {

            return;

          }


          const quantity =
            Number(
              item.quantity ||
              0
            );


          const revenue =
            Number(
              item.subtotal ??
              (
                Number(
                  item.unitPrice ||
                  0
                ) *
                quantity
              )
            );


          const cost =
            Number(
              item.unitCost ||
              0
            ) *
            quantity;


          history.push({
            saleId:
              sale.id,

            folio:
              sale.folio ||
              sale.id,

            createdAt:
              sale.createdAt,

            customer:
              sale.customer ||
              null,

            paymentMethod:
              sale.paymentMethod ||
              '',

            quantity,

            unitPrice:
              Number(
                item.unitPrice ||
                0
              ),

            unitCost:
              Number(
                item.unitCost ||
                0
              ),

            revenue:
              roundMoney(
                revenue
              ),

            cost:
              roundMoney(
                cost
              ),

            profit:
              roundMoney(
                revenue -
                cost
              )
          });

        }
      );

    }
  );


  return history.sort(
    (
      a,
      b
    ) =>
      new Date(
        b.createdAt
      ) -
      new Date(
        a.createdAt
      )
  );

};


// ======================================================
// ANALÍTICA GENERAL POR PRODUCTO
// ======================================================

export const getProductSalesAnalytics = ({
  period = 'month'
} = {}) => {

  const range =
    getAnalyticsRange(
      period
    );


  const products =
    getProducts();


  const sales =
    getSales()
      .filter(
        sale =>
          sale.status !==
            'cancelled' &&
          isInRange(
            sale.createdAt,
            range
          )
      );


  const periodDays =
    getPeriodDays(
      range,
      sales
    );


  const productMap =
    new Map();


  // ====================================================
  // PRODUCTOS ACTUALES
  // ====================================================

  products.forEach(
    product => {

      productMap.set(
        product.id,
        {
          productId:
            product.id,

          name:
            product.name ||
            'Producto',

          category:
            product.category ||
            'Otros',

          sku:
            product.sku ||
            '',

          barcode:
            product.barcode ||
            '',

          currentStock:
            Number(
              product.stock ||
              0
            ),

          minStock:
            Number(
              product.minStock ||
              0
            ),

          currentPrice:
            Number(
              product.price ||
              0
            ),

          currentCost:
            Number(
              product.cost ||
              0
            ),

          status:
            product.status ||
            'active',

          deleted:
            false,

          unitsSold:
            0,

          salesCount:
            0,

          revenue:
            0,

          cost:
            0,

          profit:
            0,

          margin:
            0,

          averageUnitPrice:
            0,

          lastSaleAt:
            null,

          averageDailyUnits:
            0,

          estimatedStockDays:
            null,

          rotation:
            'Sin ventas'
        }
      );

    }
  );


  // ====================================================
  // SUMAR VENTAS
  // ====================================================

  sales.forEach(
    sale => {

      const seenProducts =
        new Set();


      (
        sale.items ||
        []
      ).forEach(
        item => {

          const productId =
            item.productId;


          if (!productId) {
            return;
          }


          if (
            !productMap.has(
              productId
            )
          ) {

            // El producto pudo haberse eliminado del catálogo,
            // pero su historial comercial se conserva.
            productMap.set(
              productId,
              {
                productId,

                name:
                  item.name ||
                  'Producto eliminado',

                category:
                  item.category ||
                  'Otros',

                sku:
                  item.sku ||
                  '',

                barcode:
                  item.barcode ||
                  '',

                currentStock:
                  0,

                minStock:
                  0,

                currentPrice:
                  Number(
                    item.unitPrice ||
                    0
                  ),

                currentCost:
                  Number(
                    item.unitCost ||
                    0
                  ),

                status:
                  'deleted',

                deleted:
                  true,

                unitsSold:
                  0,

                salesCount:
                  0,

                revenue:
                  0,

                cost:
                  0,

                profit:
                  0,

                margin:
                  0,

                averageUnitPrice:
                  0,

                lastSaleAt:
                  null,

                averageDailyUnits:
                  0,

                estimatedStockDays:
                  null,

                rotation:
                  'Sin ventas'
              }
            );

          }


          const analytics =
            productMap.get(
              productId
            );


          const quantity =
            Number(
              item.quantity ||
              0
            );


          const revenue =
            Number(
              item.subtotal ??
              (
                Number(
                  item.unitPrice ||
                  0
                ) *
                quantity
              )
            );


          const cost =
            Number(
              item.unitCost ||
              0
            ) *
            quantity;


          analytics.unitsSold +=
            quantity;


          analytics.revenue +=
            revenue;


          analytics.cost +=
            cost;


          analytics.profit +=
            revenue -
            cost;


          if (
            !analytics.lastSaleAt ||
            new Date(
              sale.createdAt
            ) >
            new Date(
              analytics.lastSaleAt
            )
          ) {

            analytics.lastSaleAt =
              sale.createdAt;

          }


          if (
            !seenProducts.has(
              productId
            )
          ) {

            analytics.salesCount +=
              1;


            seenProducts.add(
              productId
            );

          }

        }
      );

    }
  );


  // ====================================================
  // MÉTRICAS CALCULADAS
  // ====================================================

  const items =
    Array.from(
      productMap.values()
    )
      .map(
        item => {

          const revenue =
            roundMoney(
              item.revenue
            );


          const cost =
            roundMoney(
              item.cost
            );


          const profit =
            roundMoney(
              item.profit
            );


          const margin =
            revenue >
            0
              ? roundMoney(
                  (
                    profit /
                    revenue
                  ) *
                  100
                )
              : 0;


          const averageUnitPrice =
            item.unitsSold >
            0
              ? roundMoney(
                  revenue /
                  item.unitsSold
                )
              : 0;


          const averageDailyUnits =
            item.unitsSold >
            0
              ? roundMoney(
                  item.unitsSold /
                  periodDays
                )
              : 0;


          const estimatedStockDays =
            averageDailyUnits >
              0 &&
            !item.deleted
              ? roundMoney(
                  item.currentStock /
                  averageDailyUnits
                )
              : null;


          let rotation =
            'Sin ventas';


          if (
            item.unitsSold >
            0
          ) {

            if (
              averageDailyUnits >=
              3
            ) {

              rotation =
                'Alta';

            } else if (
              averageDailyUnits >=
              1
            ) {

              rotation =
                'Media';

            } else {

              rotation =
                'Baja';

            }

          }


          const daysSinceLastSale =
            item.lastSaleAt
              ? Math.max(
                  0,
                  Math.floor(
                    (
                      startOfDay(
                        new Date()
                      ) -
                      startOfDay(
                        new Date(
                          item.lastSaleAt
                        )
                      )
                    ) /
                    (
                      1000 *
                      60 *
                      60 *
                      24
                    )
                  )
                )
              : null;


          return {
            ...item,

            revenue,
            cost,
            profit,
            margin,
            averageUnitPrice,
            averageDailyUnits,
            estimatedStockDays,
            rotation,
            daysSinceLastSale,

            lowStock:
              !item.deleted &&
              item.currentStock <=
                item.minStock,

            reorderSoon:
              !item.deleted &&
              averageDailyUnits >
                0 &&
              estimatedStockDays !==
                null &&
              estimatedStockDays <=
                3,

            stagnant:
              !item.deleted &&
              (
                item.unitsSold ===
                  0 ||
                (
                  daysSinceLastSale !==
                    null &&
                  daysSinceLastSale >=
                    21
                )
              )
          };

        }
      );


  const sortedByUnits =
    [
      ...items
    ].sort(
      (
        a,
        b
      ) =>
        b.unitsSold -
        a.unitsSold
    );


  const sortedByProfit =
    [
      ...items
    ].sort(
      (
        a,
        b
      ) =>
        b.profit -
        a.profit
    );


  const totalRevenue =
    roundMoney(
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.revenue,
        0
      )
    );


  const totalCost =
    roundMoney(
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.cost,
        0
      )
    );


  const totalProfit =
    roundMoney(
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.profit,
        0
      )
    );


  const totalUnits =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.unitsSold,
      0
    );


  const transactionCount =
    sales.length;


  return {
    period,
    range,
    periodDays,

    totals: {
      revenue:
        totalRevenue,

      cost:
        totalCost,

      profit:
        totalProfit,

      units:
        totalUnits,

      transactions:
        transactionCount,

      averageTicket:
        transactionCount >
        0
          ? roundMoney(
              totalRevenue /
              transactionCount
            )
          : 0,

      margin:
        totalRevenue >
        0
          ? roundMoney(
              (
                totalProfit /
                totalRevenue
              ) *
              100
            )
          : 0
    },

    products:
      items.sort(
        (
          a,
          b
        ) =>
          b.revenue -
          a.revenue
      ),

    topSold:
      sortedByUnits
        .filter(
          item =>
            item.unitsSold >
            0
        )
        .slice(
          0,
          5
        ),

    topProfitable:
      sortedByProfit
        .filter(
          item =>
            item.profit >
            0
        )
        .slice(
          0,
          5
        ),

    stagnant:
      items
        .filter(
          item =>
            item.stagnant
        )
        .sort(
          (
            a,
            b
          ) =>
            (
              b.daysSinceLastSale ??
              999
            ) -
            (
              a.daysSinceLastSale ??
              999
            )
        ),

    reorder:
      items
        .filter(
          item =>
            item.lowStock ||
            item.reorderSoon
        )
        .sort(
          (
            a,
            b
          ) =>
            (
              a.estimatedStockDays ??
              999
            ) -
            (
              b.estimatedStockDays ??
              999
            )
        )
  };

};


// ======================================================
// MOVIMIENTOS DE INVENTARIO
// ======================================================

export const getInventoryAnalyticsHistory = ({
  period = 'month'
} = {}) => {

  const range =
    getAnalyticsRange(
      period
    );


  return getInventoryMovements()
    .filter(
      movement =>
        isInRange(
          movement.createdAt,
          range
        )
    )
    .sort(
      (
        a,
        b
      ) =>
        new Date(
          b.createdAt
        ) -
        new Date(
          a.createdAt
        )
    );

};
