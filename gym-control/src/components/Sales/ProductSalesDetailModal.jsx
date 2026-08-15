// src/components/Sales/ProductSalesDetailModal.jsx

import React from 'react';

import {
  X,
  Package,
  TrendingUp,
  Coins,
  ShoppingBag,
  CalendarDays,
  UserRound,
  ReceiptText
} from 'lucide-react';

import {
  getProductSalesHistory
} from '../../services/productAnalyticsService';


const ProductSalesDetailModal = ({
  open,
  onClose,
  product,
  period = 'month',
  currency = 'MXN'
}) => {

  if (
    !open ||
    !product
  ) {
    return null;
  }


  const history =
    getProductSalesHistory({
      productId:
        product.productId,
      period
    });


  const money = (
    value
  ) =>
    new Intl.NumberFormat(
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
      Number(
        value ||
        0
      )
    );


  const formatDate = (
    value
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
      return value || '—';
    }


    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(
      date
    );

  };


  return (

    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">

      <button
        type="button"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />


      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#111111] border border-[#242424] rounded-2xl shadow-2xl">

        <div className="p-6 border-b border-[#1f1f1f] flex items-start justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">

              <Package
                size={22}
                className="text-[#00ff88]"
              />

            </div>


            <div>

              <h2 className="text-white text-xl font-black">
                {product.name}
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Rendimiento e historial de ventas
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#292929] text-gray-400 hover:text-white flex items-center justify-center"
          >

            <X
              size={18}
            />

          </button>

        </div>


        <div className="p-6 space-y-6">

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">

            <Metric
              icon={
                ShoppingBag
              }
              label="Unidades vendidas"
              value={
                product.unitsSold
              }
            />

            <Metric
              icon={
                Coins
              }
              label="Ingresos"
              value={
                money(
                  product.revenue
                )
              }
            />

            <Metric
              icon={
                TrendingUp
              }
              label="Ganancia"
              value={
                money(
                  product.profit
                )
              }
              green
            />

            <Metric
              icon={
                ReceiptText
              }
              label="Margen"
              value={`${product.margin || 0}%`}
            />

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <SmallInfo
              label="Stock actual"
              value={
                product.deleted
                  ? 'Producto eliminado'
                  : `${product.currentStock} unidades`
              }
            />

            <SmallInfo
              label="Promedio diario"
              value={`${product.averageDailyUnits || 0} unidades`}
            />

            <SmallInfo
              label="Stock estimado"
              value={
                product.deleted
                  ? '—'
                  : product.estimatedStockDays ===
                    null
                    ? 'Sin consumo suficiente'
                    : `${product.estimatedStockDays} días`
              }
            />

          </div>


          <div className="bg-[#151515] border border-[#242424] rounded-xl overflow-hidden">

            <div className="p-5 border-b border-[#242424]">

              <h3 className="text-white font-black">
                Historial de ventas
              </h3>

              <p className="text-gray-600 text-xs mt-1">
                Cada operación donde se vendió este producto.
              </p>

            </div>


            {
              history.length ===
              0
                ? (

                  <div className="py-14 text-center">

                    <ReceiptText
                      size={38}
                      className="text-gray-700 mx-auto mb-3"
                    />

                    <p className="text-gray-500 text-sm">
                      No hay ventas en este periodo.
                    </p>

                  </div>

                )
                : (

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[800px]">

                      <thead className="bg-[#101010]">

                        <tr>

                          {
                            [
                              'Fecha',
                              'Folio',
                              'Cliente',
                              'Cantidad',
                              'Ingreso',
                              'Costo',
                              'Ganancia'
                            ].map(
                              label => (

                                <th
                                  key={
                                    label
                                  }
                                  className="px-4 py-3 text-left text-gray-500 text-[10px] uppercase tracking-wider"
                                >
                                  {label}
                                </th>

                              )
                            )
                          }

                        </tr>

                      </thead>


                      <tbody>

                        {
                          history.map(
                            (
                              item,
                              index
                            ) => (

                              <tr
                                key={`${item.saleId}-${index}`}
                                className="border-t border-[#222222]"
                              >

                                <td className="px-4 py-3 text-gray-400 text-xs">

                                  <div className="flex items-center gap-1.5">

                                    <CalendarDays
                                      size={13}
                                    />

                                    {
                                      formatDate(
                                        item.createdAt
                                      )
                                    }

                                  </div>

                                </td>


                                <td className="px-4 py-3 text-white font-mono text-xs">
                                  {item.folio}
                                </td>


                                <td className="px-4 py-3">

                                  <div className="flex items-center gap-2">

                                    <UserRound
                                      size={14}
                                      className="text-gray-600"
                                    />

                                    <div>

                                      <p className="text-white text-xs font-semibold">
                                        {
                                          item.customer?.memberName ||
                                          'Venta general'
                                        }
                                      </p>

                                      <p className="text-gray-700 text-[10px]">
                                        {
                                          item.customer?.memberId ||
                                          'Público general'
                                        }
                                      </p>

                                    </div>

                                  </div>

                                </td>


                                <td className="px-4 py-3 text-white font-black">
                                  {item.quantity}
                                </td>


                                <td className="px-4 py-3 text-white font-semibold">
                                  {
                                    money(
                                      item.revenue
                                    )
                                  }
                                </td>


                                <td className="px-4 py-3 text-gray-500">
                                  {
                                    money(
                                      item.cost
                                    )
                                  }
                                </td>


                                <td className="px-4 py-3 text-[#00ff88] font-black">
                                  {
                                    money(
                                      item.profit
                                    )
                                  }
                                </td>

                              </tr>

                            )
                          )
                        }

                      </tbody>

                    </table>

                  </div>

                )
            }

          </div>

        </div>

      </div>

    </div>

  );

};


const Metric = ({
  icon: Icon,
  label,
  value,
  green = false
}) => (

  <div className="rounded-xl bg-[#171717] border border-[#242424] p-4">

    <Icon
      size={17}
      className={
        green
          ? 'text-[#00ff88]'
          : 'text-gray-500'
      }
    />

    <p className="text-gray-600 text-[10px] uppercase tracking-wider mt-3">
      {label}
    </p>

    <p
      className={`font-black text-lg mt-1 ${
        green
          ? 'text-[#00ff88]'
          : 'text-white'
      }`}
    >
      {value}
    </p>

  </div>

);


const SmallInfo = ({
  label,
  value
}) => (

  <div className="rounded-xl bg-[#151515] border border-[#242424] p-4">

    <p className="text-gray-600 text-[10px] uppercase tracking-wider">
      {label}
    </p>

    <p className="text-white text-sm font-bold mt-1">
      {value}
    </p>

  </div>

);


export default ProductSalesDetailModal;
