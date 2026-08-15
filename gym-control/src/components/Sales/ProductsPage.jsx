// src/components/Sales/ProductsPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Search,
  Plus,
  Package,
  Boxes,
  TriangleAlert,
  Pencil,
  Trash2,
  PackagePlus,
  TrendingUp,
  ShoppingBag,
  Coins,
  ReceiptText,
  Eye,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  SlidersHorizontal,
  Clock3
} from 'lucide-react';

import {
  getProducts,
  deleteProduct
} from '../../services/productService';

import {
  getProductSalesAnalytics,
  getInventoryAnalyticsHistory
} from '../../services/productAnalyticsService';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

import {
  useGymSettings
} from '../../context/GymSettingsContext';

import {
  canAccess
} from '../../services/authService';

import ProductFormModal from './ProductFormModal';
import InventoryMovementModal from './InventoryMovementModal';
import ProductStatCard from './ProductStatCard';
import ProductSalesDetailModal from './ProductSalesDetailModal';


const PERIODS = [
  {
    id: 'today',
    label: 'Hoy'
  },
  {
    id: '7d',
    label: '7 días'
  },
  {
    id: '30d',
    label: '30 días'
  },
  {
    id: 'month',
    label: 'Este mes'
  },
  {
    id: 'previousMonth',
    label: 'Mes anterior'
  },
  {
    id: 'all',
    label: 'Histórico'
  }
];


const ProductsPage = () => {

  const {
    settings
  } = useGymSettings();


  const currency =
    settings?.currency ===
      'USD'
      ? 'USD'
      : 'MXN';


  // ======================================================
  // PERMISOS DEL MÓDULO
  // ======================================================

  const canManageInventory =
    canAccess(
      'inventory'
    );


  const canViewInventoryHistory =
    canAccess(
      'inventory_history'
    );


  const canViewProductAnalytics =
    canAccess(
      'product_analytics'
    );


  const [
    products,
    setProducts
  ] = useState([]);


  const [
    search,
    setSearch
  ] = useState('');


  const [
    activeTab,
    setActiveTab
  ] = useState(
    'inventory'
  );


  const [
    period,
    setPeriod
  ] = useState(
    'month'
  );


  const [
    formOpen,
    setFormOpen
  ] = useState(false);


  const [
    inventoryOpen,
    setInventoryOpen
  ] = useState(false);


  const [
    selectedProduct,
    setSelectedProduct
  ] = useState(null);


  const [
    salesDetail,
    setSalesDetail
  ] = useState(null);


  const [
    refreshToken,
    setRefreshToken
  ] = useState(0);


  // ======================================================
  // CARGAR
  // ======================================================

  const load = () => {

    setProducts(
      getProducts()
    );


    setRefreshToken(
      previous =>
        previous + 1
    );

  };


  useEffect(
    () => {

      load();


      const refresh =
        () =>
          load();


      window.addEventListener(
        'gym-storage-update',
        refresh
      );


      window.addEventListener(
        'gym-sales-update',
        refresh
      );


      return () => {

        window.removeEventListener(
          'gym-storage-update',
          refresh
        );


        window.removeEventListener(
          'gym-sales-update',
          refresh
        );

      };

    },
    []
  );


  // ======================================================
  // DATOS DE INVENTARIO
  // ======================================================

  const filtered =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        if (!term) {
          return products;
        }


        return products.filter(
          product =>
            [
              product.name,
              product.category,
              product.sku,
              product.barcode
            ]
              .join(' ')
              .toLowerCase()
              .includes(
                term
              )
        );

      },
      [
        products,
        search
      ]
    );


  const lowStock =
    products.filter(
      item =>
        Number(
          item.stock ||
          0
        ) <=
        Number(
          item.minStock ||
          0
        )
    );


  const stockValue =
    products.reduce(
      (
        sum,
        item
      ) =>
        sum +
        (
          Number(
            item.cost ||
            0
          ) *
          Number(
            item.stock ||
            0
          )
        ),
      0
    );


  // ======================================================
  // ANALÍTICA
  // ======================================================

  const analytics =
    useMemo(
      () =>
        getProductSalesAnalytics({
          period
        }),
      [
        period,
        refreshToken
      ]
    );


  const performanceProducts =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        if (!term) {
          return analytics.products;
        }


        return analytics.products.filter(
          item =>
            [
              item.name,
              item.category,
              item.sku,
              item.barcode
            ]
              .join(' ')
              .toLowerCase()
              .includes(
                term
              )
        );

      },
      [
        analytics.products,
        search
      ]
    );


  const movements =
    useMemo(
      () => {

        const records =
          getInventoryAnalyticsHistory({
            period
          });


        const term =
          search
            .trim()
            .toLowerCase();


        if (!term) {
          return records;
        }


        return records.filter(
          movement =>
            [
              movement.productName,
              movement.type,
              movement.reason,
              movement.referenceId,
              movement.actor?.name
            ]
              .join(' ')
              .toLowerCase()
              .includes(
                term
              )
        );

      },
      [
        period,
        search,
        refreshToken
      ]
    );


  // ======================================================
  // FORMATO
  // ======================================================

  const formatMoney = (
    value
  ) =>
    new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency,
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

    if (!value) {
      return 'Nunca';
    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
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


  // ======================================================
  // ACCIONES
  // ======================================================

  const edit = (
    product
  ) => {

    setSelectedProduct(
      product
    );


    setFormOpen(
      true
    );

  };


  const inventory = (
    product
  ) => {

    setSelectedProduct(
      product
    );


    setInventoryOpen(
      true
    );

  };


  const remove = (
    product
  ) => {

    const accepted =
      window.confirm(
        `¿Eliminar ${product.name}? Esta acción elimina el producto del catálogo, pero conserva su historial de ventas.`
      );


    if (!accepted) {
      return;
    }


    try {

      deleteProduct(
        product.id
      );


      load();

    } catch (error) {

      window.alert(
        error?.message ||
        'No se pudo eliminar el producto.'
      );

    }

  };


  // ======================================================
  // MOVIMIENTOS
  // ======================================================

  const getMovementMeta = (
    type
  ) => {

    const map = {
      entry: {
        label: 'Entrada',
        icon: ArrowDownToLine,
        classes:
          'bg-[#00ff88]/10 text-[#00ff88]'
      },

      sale: {
        label: 'Venta',
        icon: ShoppingBag,
        classes:
          'bg-blue-500/10 text-blue-400'
      },

      exit: {
        label: 'Salida',
        icon: ArrowUpFromLine,
        classes:
          'bg-red-500/10 text-red-400'
      },

      return: {
        label: 'Devolución',
        icon: RotateCcw,
        classes:
          'bg-purple-500/10 text-purple-400'
      },

      adjustment: {
        label: 'Ajuste',
        icon: SlidersHorizontal,
        classes:
          'bg-yellow-500/10 text-yellow-400'
      }
    };


    return (
      map[type] ||
      {
        label:
          type ||
          'Movimiento',

        icon:
          Boxes,

        classes:
          'bg-gray-500/10 text-gray-400'
      }
    );

  };


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Productos"
      />


      <div className="flex-1 min-w-0">

        <Header />


        <main className="p-6 space-y-6">

          {/* HEADER */}

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2 text-gray-600 text-xs mb-2">

                <span>
                  Ventas
                </span>

                <span>
                  /
                </span>

                <span className="text-gray-400">
                  Productos
                </span>

              </div>


              <h1 className="text-white text-2xl font-black">
                Productos, inventario y rendimiento
              </h1>


              <p className="text-gray-500 mt-1">
                Controla existencias y descubre qué productos generan más ventas y ganancias.
              </p>

            </div>


            {
              canManageInventory &&
              (

                <button
                  type="button"
                  onClick={() => {

                    setSelectedProduct(
                      null
                    );


                    setFormOpen(
                      true
                    );

                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#00ff88] text-black font-black flex items-center justify-center gap-2"
                >

                  <Plus
                    size={18}
                  />

                  Nuevo producto

                </button>

              )
            }

          </div>


          {/* TABS */}

          <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-2 flex flex-wrap gap-2">

            {
              [
                {
                  id:
                    'inventory',

                  label:
                    'Productos e inventario',

                  icon:
                    Boxes,

                  visible:
                    true
                },

                {
                  id:
                    'performance',

                  label:
                    'Rendimiento de ventas',

                  icon:
                    TrendingUp,

                  visible:
                    canViewProductAnalytics
                },

                {
                  id:
                    'movements',

                  label:
                    'Historial de movimientos',

                  icon:
                    ReceiptText,

                  visible:
                    canViewInventoryHistory
                }
              ]
                .filter(
                  tab =>
                    tab.visible
                )
                .map(
                tab => {

                  const Icon =
                    tab.icon;


                  const active =
                    activeTab ===
                    tab.id;


                  return (

                    <button
                      type="button"
                      key={
                        tab.id
                      }
                      onClick={() =>
                        setActiveTab(
                          tab.id
                        )
                      }
                      className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                        active
                          ? 'bg-[#00ff88] text-black'
                          : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'
                      }`}
                    >

                      <Icon
                        size={16}
                      />

                      {tab.label}

                    </button>

                  );

                }
              )
            }

          </div>


          {/* ================================================= */}
          {/* INVENTARIO */}
          {/* ================================================= */}

          {
            activeTab ===
              'inventory' &&
            (

              <>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

                  <ProductStatCard
                    title="Productos"
                    value={
                      products.length
                    }
                    subtitle="Registrados"
                    icon={
                      Package
                    }
                  />


                  <ProductStatCard
                    title="Stock total"
                    value={
                      products.reduce(
                        (
                          sum,
                          item
                        ) =>
                          sum +
                          Number(
                            item.stock ||
                            0
                          ),
                        0
                      )
                    }
                    subtitle="Unidades disponibles"
                    icon={
                      Boxes
                    }
                    tone="blue"
                  />


                  <ProductStatCard
                    title="Stock bajo"
                    value={
                      lowStock.length
                    }
                    subtitle="Requieren atención"
                    icon={
                      TriangleAlert
                    }
                    tone={
                      lowStock.length >
                      0
                        ? 'yellow'
                        : 'green'
                    }
                  />


                  <ProductStatCard
                    title="Valor inventario"
                    value={
                      formatMoney(
                        stockValue
                      )
                    }
                    subtitle="Según costo"
                    icon={
                      PackagePlus
                    }
                    tone="gray"
                  />

                </div>


                <SearchBar
                  search={
                    search
                  }
                  setSearch={
                    setSearch
                  }
                  placeholder="Buscar producto, SKU o código de barras..."
                />


                <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl overflow-hidden">

                  {
                    filtered.length ===
                    0
                      ? (

                        <Empty
                          icon={
                            Package
                          }
                          title="No hay productos para mostrar"
                          text="Registra el primer producto para comenzar."
                        />

                      )
                      : (

                        <div className="overflow-x-auto">

                          <table className="w-full min-w-[1050px]">

                            <thead className="bg-[#0d0d0d]">

                              <tr className="text-left">

                                {
                                  [
                                    'Producto',
                                    'Categoría',
                                    ...(
                                      canManageInventory ||
                                      canViewProductAnalytics
                                        ? [
                                            'Costo'
                                          ]
                                        : []
                                    ),
                                    'Precio',
                                    ...(
                                      canManageInventory ||
                                      canViewProductAnalytics
                                        ? [
                                            'Ganancia/u.'
                                          ]
                                        : []
                                    ),
                                    'Stock',
                                    'Mínimo',
                                    'Estado',
                                    ...(
                                      canManageInventory
                                        ? [
                                            'Acciones'
                                          ]
                                        : []
                                    )
                                  ].map(
                                    label => (

                                      <th
                                        key={
                                          label
                                        }
                                        className="px-4 py-3 text-gray-500 text-[11px] uppercase tracking-wider"
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
                                filtered.map(
                                  product => {

                                    const isLow =
                                      Number(
                                        product.stock ||
                                        0
                                      ) <=
                                      Number(
                                        product.minStock ||
                                        0
                                      );


                                    const unitProfit =
                                      Number(
                                        product.price ||
                                        0
                                      ) -
                                      Number(
                                        product.cost ||
                                        0
                                      );


                                    return (

                                      <tr
                                        key={
                                          product.id
                                        }
                                        className="border-t border-[#1d1d1d] hover:bg-white/[0.015]"
                                      >

                                        <td className="px-4 py-4">

                                          <p className="text-white font-semibold">
                                            {product.name}
                                          </p>

                                          <p className="text-gray-600 text-xs mt-1">
                                            {
                                              product.sku ||
                                              'Sin SKU'
                                            }

                                            {
                                              product.barcode
                                                ? ` · ${product.barcode}`
                                                : ''
                                            }
                                          </p>

                                        </td>


                                        <td className="px-4 py-4 text-gray-400 text-sm">
                                          {product.category}
                                        </td>


                                        {
                                          (
                                            canManageInventory ||
                                            canViewProductAnalytics
                                          ) &&
                                          (

                                            <td className="px-4 py-4 text-gray-400 text-sm">
                                              {
                                                formatMoney(
                                                  product.cost
                                                )
                                              }
                                            </td>

                                          )
                                        }


                                        <td className="px-4 py-4 text-white font-bold">
                                          {
                                            formatMoney(
                                              product.price
                                            )
                                          }
                                        </td>


                                        {
                                          (
                                            canManageInventory ||
                                            canViewProductAnalytics
                                          ) &&
                                          (

                                            <td className="px-4 py-4 text-[#00ff88] font-black">
                                              {
                                                formatMoney(
                                                  unitProfit
                                                )
                                              }
                                            </td>

                                          )
                                        }


                                        <td className="px-4 py-4">

                                          <span
                                            className={
                                              isLow
                                                ? 'text-yellow-400 font-black'
                                                : 'text-white font-black'
                                            }
                                          >
                                            {
                                              product.stock ||
                                              0
                                            }
                                          </span>

                                        </td>


                                        <td className="px-4 py-4 text-gray-500">
                                          {
                                            product.minStock ||
                                            0
                                          }
                                        </td>


                                        <td className="px-4 py-4">

                                          <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                              product.status ===
                                                'inactive'
                                                ? 'bg-gray-500/10 text-gray-500'
                                                : isLow
                                                  ? 'bg-yellow-500/10 text-yellow-400'
                                                  : 'bg-[#00ff88]/10 text-[#00ff88]'
                                            }`}
                                          >
                                            {
                                              product.status ===
                                                'inactive'
                                                ? 'Descontinuado'
                                                : isLow
                                                  ? 'Stock bajo'
                                                  : 'Disponible'
                                            }
                                          </span>

                                        </td>


                                        {
                                          canManageInventory &&
                                          (

                                        <td className="px-4 py-4">

                                          <div className="flex items-center gap-2">

                                            <button
                                              type="button"
                                              onClick={() =>
                                                inventory(
                                                  product
                                                )
                                              }
                                              title="Inventario"
                                              className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center"
                                            >
                                              <Boxes
                                                size={16}
                                              />
                                            </button>


                                            <button
                                              type="button"
                                              onClick={() =>
                                                edit(
                                                  product
                                                )
                                              }
                                              title="Editar"
                                              className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#292929] text-gray-300 hover:text-white flex items-center justify-center"
                                            >
                                              <Pencil
                                                size={16}
                                              />
                                            </button>


                                            <button
                                              type="button"
                                              onClick={() =>
                                                remove(
                                                  product
                                                )
                                              }
                                              title="Eliminar"
                                              className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"
                                            >
                                              <Trash2
                                                size={16}
                                              />
                                            </button>

                                          </div>

                                        </td>

                                          )
                                        }

                                      </tr>

                                    );

                                  }
                                )
                              }

                            </tbody>

                          </table>

                        </div>

                      )
                  }

                </div>

              </>

            )
          }


          {/* ================================================= */}
          {/* RENDIMIENTO */}
          {/* ================================================= */}

          {
            activeTab ===
              'performance' &&
            canViewProductAnalytics &&
            (

              <>

                <PeriodSelector
                  period={
                    period
                  }
                  setPeriod={
                    setPeriod
                  }
                />


                <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">

                  <ProductStatCard
                    title="Ingresos"
                    value={
                      formatMoney(
                        analytics.totals.revenue
                      )
                    }
                    subtitle={
                      analytics.range.label
                    }
                    icon={
                      Coins
                    }
                  />


                  <ProductStatCard
                    title="Ganancia estimada"
                    value={
                      formatMoney(
                        analytics.totals.profit
                      )
                    }
                    subtitle={`${analytics.totals.margin}% margen`}
                    icon={
                      TrendingUp
                    }
                    tone="green"
                  />


                  <ProductStatCard
                    title="Unidades vendidas"
                    value={
                      analytics.totals.units
                    }
                    subtitle={`${analytics.totals.transactions} ventas`}
                    icon={
                      ShoppingBag
                    }
                    tone="blue"
                  />


                  <ProductStatCard
                    title="Ticket promedio"
                    value={
                      formatMoney(
                        analytics.totals.averageTicket
                      )
                    }
                    subtitle="Por operación"
                    icon={
                      ReceiptText
                    }
                    tone="gray"
                  />


                  <ProductStatCard
                    title="Por reabastecer"
                    value={
                      analytics.reorder.length
                    }
                    subtitle="Stock bajo o alta rotación"
                    icon={
                      TriangleAlert
                    }
                    tone={
                      analytics.reorder.length >
                      0
                        ? 'yellow'
                        : 'green'
                    }
                  />

                </div>


                {/* RANKINGS */}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                  <RankingCard
                    title="Productos más vendidos"
                    subtitle="Ranking por unidades"
                    items={
                      analytics.topSold
                    }
                    value={item =>
                      `${item.unitsSold} vendidos`
                    }
                    secondary={item =>
                      formatMoney(
                        item.revenue
                      )
                    }
                    onOpen={
                      setSalesDetail
                    }
                  />


                  <RankingCard
                    title="Productos más rentables"
                    subtitle="Ranking por ganancia"
                    items={
                      analytics.topProfitable
                    }
                    value={item =>
                      formatMoney(
                        item.profit
                      )
                    }
                    secondary={item =>
                      `${item.margin}% margen`
                    }
                    onOpen={
                      setSalesDetail
                    }
                  />

                </div>


                {/* ALERTAS DE ROTACIÓN */}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                  <AlertList
                    title="Reabastecer pronto"
                    emptyText="No hay productos con riesgo de agotarse."
                    items={
                      analytics.reorder
                    }
                    icon={
                      TriangleAlert
                    }
                    renderLine={
                      item =>
                        item.estimatedStockDays !==
                          null
                          ? `Stock para aprox. ${item.estimatedStockDays} días`
                          : `Stock actual: ${item.currentStock}`
                    }
                    accent="yellow"
                    onOpen={
                      setSalesDetail
                    }
                  />


                  <AlertList
                    title="Baja rotación"
                    emptyText="No hay productos estancados en este periodo."
                    items={
                      analytics.stagnant
                    }
                    icon={
                      Clock3
                    }
                    renderLine={
                      item =>
                        item.lastSaleAt
                          ? `Última venta hace ${item.daysSinceLastSale} días`
                          : 'Sin ventas registradas'
                    }
                    accent="gray"
                    onOpen={
                      setSalesDetail
                    }
                  />

                </div>


                <SearchBar
                  search={
                    search
                  }
                  setSearch={
                    setSearch
                  }
                  placeholder="Buscar producto en el análisis..."
                />


                {/* TABLA DE RENDIMIENTO */}

                <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl overflow-hidden">

                  {
                    performanceProducts.length ===
                    0
                      ? (

                        <Empty
                          icon={
                            TrendingUp
                          }
                          title="No hay ventas en este periodo"
                          text="Cuando registres ventas, el rendimiento aparecerá aquí."
                        />

                      )
                      : (

                        <div className="overflow-x-auto">

                          <table className="w-full min-w-[1250px]">

                            <thead className="bg-[#0d0d0d]">

                              <tr>

                                {
                                  [
                                    'Producto',
                                    'Vendidos',
                                    'Ventas',
                                    'Ingresos',
                                    'Costo',
                                    'Ganancia',
                                    'Margen',
                                    'Prom./día',
                                    'Stock',
                                    'Rotación',
                                    'Detalle'
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
                                performanceProducts.map(
                                  item => (

                                    <tr
                                      key={
                                        item.productId
                                      }
                                      className="border-t border-[#1d1d1d] hover:bg-white/[0.015]"
                                    >

                                      <td className="px-4 py-4">

                                        <p className="text-white font-semibold text-sm">
                                          {item.name}
                                        </p>

                                        <p className="text-gray-600 text-xs mt-1">
                                          {item.category}

                                          {
                                            item.deleted
                                              ? ' · Producto eliminado'
                                              : ''
                                          }
                                        </p>

                                      </td>


                                      <td className="px-4 py-4 text-white font-black">
                                        {item.unitsSold}
                                      </td>


                                      <td className="px-4 py-4 text-gray-400">
                                        {item.salesCount}
                                      </td>


                                      <td className="px-4 py-4 text-white font-bold">
                                        {
                                          formatMoney(
                                            item.revenue
                                          )
                                        }
                                      </td>


                                      <td className="px-4 py-4 text-gray-500">
                                        {
                                          formatMoney(
                                            item.cost
                                          )
                                        }
                                      </td>


                                      <td className="px-4 py-4 text-[#00ff88] font-black">
                                        {
                                          formatMoney(
                                            item.profit
                                          )
                                        }
                                      </td>


                                      <td className="px-4 py-4 text-gray-300 font-semibold">
                                        {item.margin}%
                                      </td>


                                      <td className="px-4 py-4 text-gray-400">
                                        {
                                          item.averageDailyUnits
                                        }
                                      </td>


                                      <td className="px-4 py-4">

                                        {
                                          item.deleted
                                            ? (
                                              <span className="text-gray-600 text-xs">
                                                —
                                              </span>
                                            )
                                            : (
                                              <span
                                                className={
                                                  item.lowStock
                                                    ? 'text-yellow-400 font-black'
                                                    : 'text-white font-black'
                                                }
                                              >
                                                {
                                                  item.currentStock
                                                }
                                              </span>
                                            )
                                        }

                                      </td>


                                      <td className="px-4 py-4">

                                        <RotationBadge
                                          rotation={
                                            item.rotation
                                          }
                                        />

                                      </td>


                                      <td className="px-4 py-4">

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSalesDetail(
                                              item
                                            )
                                          }
                                          className="w-9 h-9 rounded-lg bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20 flex items-center justify-center"
                                          title="Ver historial"
                                        >
                                          <Eye
                                            size={16}
                                          />
                                        </button>

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

              </>

            )
          }


          {/* ================================================= */}
          {/* MOVIMIENTOS */}
          {/* ================================================= */}

          {
            activeTab ===
              'movements' &&
            canViewInventoryHistory &&
            (

              <>

                <PeriodSelector
                  period={
                    period
                  }
                  setPeriod={
                    setPeriod
                  }
                />


                <SearchBar
                  search={
                    search
                  }
                  setSearch={
                    setSearch
                  }
                  placeholder="Buscar producto, motivo, referencia o usuario..."
                />


                <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl overflow-hidden">

                  {
                    movements.length ===
                    0
                      ? (

                        <Empty
                          icon={
                            ReceiptText
                          }
                          title="No hay movimientos en este periodo"
                          text="Las entradas, salidas, ventas y devoluciones aparecerán aquí."
                        />

                      )
                      : (

                        <div className="overflow-x-auto">

                          <table className="w-full min-w-[1000px]">

                            <thead className="bg-[#0d0d0d]">

                              <tr>

                                {
                                  [
                                    'Fecha',
                                    'Producto',
                                    'Movimiento',
                                    'Cantidad',
                                    'Stock anterior',
                                    'Stock nuevo',
                                    'Motivo / referencia',
                                    'Usuario'
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
                                movements.map(
                                  movement => {

                                    const meta =
                                      getMovementMeta(
                                        movement.type
                                      );


                                    const Icon =
                                      meta.icon;


                                    return (

                                      <tr
                                        key={
                                          movement.id
                                        }
                                        className="border-t border-[#1d1d1d]"
                                      >

                                        <td className="px-4 py-4 text-gray-500 text-xs">
                                          {
                                            formatDate(
                                              movement.createdAt
                                            )
                                          }
                                        </td>


                                        <td className="px-4 py-4 text-white font-semibold text-sm">
                                          {
                                            movement.productName
                                          }
                                        </td>


                                        <td className="px-4 py-4">

                                          <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.classes}`}
                                          >

                                            <Icon
                                              size={13}
                                            />

                                            {meta.label}

                                          </span>

                                        </td>


                                        <td
                                          className={`px-4 py-4 font-black ${
                                            Number(
                                              movement.quantity
                                            ) >
                                            0
                                              ? 'text-[#00ff88]'
                                              : 'text-red-400'
                                          }`}
                                        >
                                          {
                                            Number(
                                              movement.quantity
                                            ) >
                                            0
                                              ? '+'
                                              : ''
                                          }

                                          {
                                            movement.quantity
                                          }
                                        </td>


                                        <td className="px-4 py-4 text-gray-500">
                                          {
                                            movement.previousStock
                                          }
                                        </td>


                                        <td className="px-4 py-4 text-white font-bold">
                                          {
                                            movement.newStock
                                          }
                                        </td>


                                        <td className="px-4 py-4">

                                          <p className="text-gray-400 text-xs">
                                            {
                                              movement.reason ||
                                              'Sin motivo'
                                            }
                                          </p>

                                          {
                                            movement.referenceId &&
                                            (
                                              <p className="text-gray-700 font-mono text-[10px] mt-1">
                                                {
                                                  movement.referenceId
                                                }
                                              </p>
                                            )
                                          }

                                        </td>


                                        <td className="px-4 py-4 text-gray-500 text-xs">
                                          {
                                            movement.actor?.name ||
                                            'Sistema'
                                          }
                                        </td>

                                      </tr>

                                    );

                                  }
                                )
                              }

                            </tbody>

                          </table>

                        </div>

                      )
                  }

                </div>

              </>

            )
          }

        </main>

      </div>


      {/* MODALES EXISTENTES */}

      <ProductFormModal
        open={
          canManageInventory &&
          formOpen
        }
        onClose={() => {

          setFormOpen(
            false
          );


          setSelectedProduct(
            null
          );

        }}
        product={
          selectedProduct
        }
        onSaved={
          load
        }
      />


      <InventoryMovementModal
        open={
          canManageInventory &&
          inventoryOpen
        }
        onClose={() => {

          setInventoryOpen(
            false
          );


          setSelectedProduct(
            null
          );

        }}
        product={
          selectedProduct
        }
        onSaved={
          load
        }
      />


      {/* NUEVO: DETALLE DE RENDIMIENTO */}

      <ProductSalesDetailModal
        open={
          canViewProductAnalytics &&
          Boolean(
            salesDetail
          )
        }
        onClose={() =>
          setSalesDetail(
            null
          )
        }
        product={
          salesDetail
        }
        period={
          period
        }
        currency={
          currency
        }
      />

    </div>

  );

};


// ======================================================
// COMPONENTES INTERNOS
// ======================================================

const SearchBar = ({
  search,
  setSearch,
  placeholder
}) => (

  <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-4">

    <div className="relative max-w-xl">

      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
      />


      <input
        value={
          search
        }
        onChange={
          event =>
            setSearch(
              event.target.value
            )
        }
        placeholder={
          placeholder
        }
        className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none"
      />

    </div>

  </div>

);


const PeriodSelector = ({
  period,
  setPeriod
}) => (

  <div className="flex flex-wrap gap-2">

    {
      PERIODS.map(
        item => (

          <button
            type="button"
            key={
              item.id
            }
            onClick={() =>
              setPeriod(
                item.id
              )
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              period ===
                item.id
                ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]'
                : 'bg-[#111111] border-[#242424] text-gray-500 hover:text-white'
            }`}
          >
            {item.label}
          </button>

        )
      )
    }

  </div>

);


const RankingCard = ({
  title,
  subtitle,
  items,
  value,
  secondary,
  onOpen
}) => (

  <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl overflow-hidden">

    <div className="p-5 border-b border-[#1d1d1d]">

      <h3 className="text-white font-black">
        {title}
      </h3>

      <p className="text-gray-600 text-xs mt-1">
        {subtitle}
      </p>

    </div>


    {
      items.length ===
      0
        ? (

          <div className="py-10 text-center text-gray-600 text-sm">
            Sin ventas en el periodo.
          </div>

        )
        : (

          <div className="divide-y divide-[#1d1d1d]">

            {
              items.map(
                (
                  item,
                  index
                ) => (

                  <button
                    type="button"
                    key={
                      item.productId
                    }
                    onClick={() =>
                      onOpen(
                        item
                      )
                    }
                    className="w-full p-4 hover:bg-white/[0.015] flex items-center gap-4 text-left"
                  >

                    <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-gray-500 font-black text-xs flex items-center justify-center">
                      {
                        index +
                        1
                      }
                    </div>


                    <div className="flex-1 min-w-0">

                      <p className="text-white text-sm font-semibold truncate">
                        {item.name}
                      </p>

                      <p className="text-gray-600 text-xs mt-0.5">
                        {item.category}
                      </p>

                    </div>


                    <div className="text-right">

                      <p className="text-[#00ff88] text-sm font-black">
                        {
                          value(
                            item
                          )
                        }
                      </p>

                      <p className="text-gray-600 text-xs mt-0.5">
                        {
                          secondary(
                            item
                          )
                        }
                      </p>

                    </div>

                  </button>

                )
              )
            }

          </div>

        )
    }

  </div>

);


const AlertList = ({
  title,
  emptyText,
  items,
  icon: Icon,
  renderLine,
  accent,
  onOpen
}) => (

  <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl overflow-hidden">

    <div className="p-5 border-b border-[#1d1d1d] flex items-center gap-2">

      <Icon
        size={17}
        className={
          accent ===
            'yellow'
            ? 'text-yellow-400'
            : 'text-gray-500'
        }
      />

      <h3 className="text-white font-black">
        {title}
      </h3>

    </div>


    {
      items.length ===
      0
        ? (

          <div className="p-8 text-center text-gray-600 text-sm">
            {emptyText}
          </div>

        )
        : (

          <div className="divide-y divide-[#1d1d1d]">

            {
              items
                .slice(
                  0,
                  6
                )
                .map(
                  item => (

                    <button
                      type="button"
                      key={
                        item.productId
                      }
                      onClick={() =>
                        onOpen(
                          item
                        )
                      }
                      className="w-full p-4 hover:bg-white/[0.015] text-left"
                    >

                      <div className="flex items-center justify-between gap-4">

                        <div>

                          <p className="text-white text-sm font-semibold">
                            {item.name}
                          </p>

                          <p className="text-gray-600 text-xs mt-1">
                            {
                              renderLine(
                                item
                              )
                            }
                          </p>

                        </div>


                        <span className="text-gray-500 text-xs">
                          Stock {
                            item.currentStock
                          }
                        </span>

                      </div>

                    </button>

                  )
                )
            }

          </div>

        )
    }

  </div>

);


const RotationBadge = ({
  rotation
}) => {

  const classes = {
    Alta:
      'bg-[#00ff88]/10 text-[#00ff88]',

    Media:
      'bg-blue-500/10 text-blue-400',

    Baja:
      'bg-yellow-500/10 text-yellow-400',

    'Sin ventas':
      'bg-gray-500/10 text-gray-500'
  };


  return (

    <span
      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
        classes[rotation] ||
        classes['Sin ventas']
      }`}
    >
      {rotation}
    </span>

  );

};


const Empty = ({
  icon: Icon,
  title,
  text
}) => (

  <div className="py-16 text-center">

    <Icon
      size={46}
      className="text-gray-700 mx-auto mb-3"
    />

    <p className="text-white font-bold">
      {title}
    </p>

    <p className="text-gray-600 text-sm mt-1">
      {text}
    </p>

  </div>

);


export default ProductsPage;
