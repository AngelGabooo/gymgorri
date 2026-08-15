// src/components/Sales/SalesPage.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ScanBarcode,
  User,
  Users,
  Banknote,
  CreditCard,
  Landmark,
  Package,
  ReceiptText,
  TriangleAlert,
  Boxes,
  History,
  X,
  CheckCircle2
} from 'lucide-react';

import {
  useNavigate
} from 'react-router-dom';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import ProductStatCard from './ProductStatCard';

import {
  getProducts,
  findProductByBarcode,
  getLowStockProducts
} from '../../services/productService';

import {
  createSale,
  getSales,
  getSalesSummary
} from '../../services/salesService';

import {
  getStoredMembers
} from '../../utils/memberId';

const SalesPage = () => {
  const navigate = useNavigate();
  const barcodeRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [customerMode, setCustomerMode] = useState('general');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [received, setReceived] = useState('');
  const [reference, setReference] = useState('');
  const [discount, setDiscount] = useState('');
  const [error, setError] = useState('');
  const [lastSale, setLastSale] = useState(null);

  const load = () => {
    setProducts(getProducts());
    setSales(getSales());
    setMembers(getStoredMembers());
  };

  useEffect(() => {
    load();

    const refresh = () => load();

    window.addEventListener('gym-storage-update', refresh);
    window.addEventListener('gym-sales-update', refresh);

    return () => {
      window.removeEventListener('gym-storage-update', refresh);
      window.removeEventListener('gym-sales-update', refresh);
    };
  }, []);

  const summary = useMemo(
    () => getSalesSummary(sales),
    [sales]
  );

  const availableProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products
      .filter(product => product.status !== 'inactive')
      .filter(product => {
        if (!term) return true;

        return [
          product.name,
          product.category,
          product.sku,
          product.barcode
        ]
          .join(' ')
          .toLowerCase()
          .includes(term);
      });
  }, [products, search]);

  const memberResults = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();

    if (!term) return [];

    return members
      .filter(member => member.status !== 'inactive')
      .filter(member =>
        [
          member.id,
          member.firstName,
          member.lastName,
          member.phone
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      )
      .slice(0, 6);
  }, [members, memberSearch]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const discountAmount = Math.max(
    0,
    Math.min(Number(discount || 0), subtotal)
  );

  const total = Math.max(0, subtotal - discountAmount);

  const change =
    paymentMethod === 'efectivo'
      ? Math.max(0, Number(received || 0) - total)
      : 0;

  const money = value =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(value || 0));

  const addProduct = product => {
    setError('');

    if (Number(product.stock || 0) <= 0) {
      setError(`${product.name} está agotado.`);
      return;
    }

    setCart(previous => {
      const existing = previous.find(item => item.productId === product.id);

      if (existing) {
        if (existing.quantity + 1 > Number(product.stock || 0)) {
          setError(`No hay más stock disponible de ${product.name}.`);
          return previous;
        }

        return previous.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1
              }
            : item
        );
      }

      return [
        ...previous,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: Number(product.price || 0),
          stock: Number(product.stock || 0)
        }
      ];
    });
  };

  const setQuantity = (productId, nextQuantity) => {
    const qty = Number(nextQuantity);

    setCart(previous =>
      previous
        .map(item => {
          if (item.productId !== productId) return item;

          if (qty <= 0) return null;

          if (qty > item.stock) {
            setError(`Stock máximo disponible: ${item.stock}`);
            return item;
          }

          return {
            ...item,
            quantity: qty
          };
        })
        .filter(Boolean)
    );
  };

  const removeItem = productId => {
    setCart(previous =>
      previous.filter(item => item.productId !== productId)
    );
  };

  const scanBarcode = event => {
    if (event.key !== 'Enter') return;

    event.preventDefault();

    const product = findProductByBarcode(barcode);

    if (!product) {
      setError('No se encontró un producto con ese código de barras.');
      setBarcode('');
      return;
    }

    addProduct(product);
    setBarcode('');
  };

  const completeSale = () => {
    try {
      setError('');

      const sale = createSale({
        items: cart,
        customer:
          customerMode === 'member' && selectedMember
            ? {
                type: 'member',
                memberId: selectedMember.id,
                memberName:
                  `${selectedMember.firstName || ''} ${selectedMember.lastName || ''}`.trim(),
                phone: selectedMember.phone || ''
              }
            : null,
        paymentMethod,
        received: Number(received || 0),
        reference,
        discount: discountAmount
      });

      setLastSale(sale);
      setCart([]);
      setSelectedMember(null);
      setMemberSearch('');
      setCustomerMode('general');
      setPaymentMethod('efectivo');
      setReceived('');
      setReference('');
      setDiscount('');
      load();
    } catch (saleError) {
      setError(saleError?.message || 'No se pudo registrar la venta.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Ventas" />

      <div className="flex-1 min-w-0">
        <Header />

        <main className="p-6 space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h1 className="text-white text-2xl font-black">
                Venta de productos
              </h1>
              <p className="text-gray-500 mt-1">
                Punto de venta para bebidas, suplementos, ropa y accesorios.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/sales/products')}
                className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#292929] text-white flex items-center gap-2"
              >
                <Boxes size={17} />
                Productos
              </button>

              <button
                type="button"
                onClick={() => navigate('/sales/history')}
                className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#292929] text-white flex items-center gap-2"
              >
                <History size={17} />
                Historial
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <ProductStatCard
              title="Ventas hoy"
              value={money(summary.todayIncome)}
              subtitle={`${summary.todayCount} operaciones`}
              icon={Banknote}
            />

            <ProductStatCard
              title="Productos vendidos"
              value={summary.productsSoldToday}
              subtitle="Hoy"
              icon={Package}
              tone="blue"
            />

            <ProductStatCard
              title="Ganancia estimada"
              value={money(summary.todayProfit)}
              subtitle="Ventas de hoy"
              icon={ReceiptText}
              tone="green"
            />

            <ProductStatCard
              title="Stock bajo"
              value={getLowStockProducts().length}
              subtitle="Productos"
              icon={TriangleAlert}
              tone={
                getLowStockProducts().length > 0
                  ? 'yellow'
                  : 'green'
              }
            />
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-[1fr_430px] gap-6">
            <div className="space-y-5">
              <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                    />

                    <input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <ScanBarcode
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00ff88]"
                    />

                    <input
                      ref={barcodeRef}
                      value={barcode}
                      onChange={event => setBarcode(event.target.value)}
                      onKeyDown={scanBarcode}
                      placeholder="Escanear código de barras y Enter..."
                      className="w-full bg-[#191919] border border-[#00ff88]/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {availableProducts.length === 0 ? (
                <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl py-16 text-center">
                  <Package
                    size={48}
                    className="text-gray-700 mx-auto mb-3"
                  />
                  <p className="text-white font-bold">
                    No hay productos disponibles
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/sales/products')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#00ff88] text-black font-bold"
                  >
                    Registrar productos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {availableProducts.map(product => {
                    const low =
                      Number(product.stock || 0) <=
                      Number(product.minStock || 0);

                    return (
                      <button
                        type="button"
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="text-left bg-[#111111] border border-[#1d1d1d] rounded-xl p-4 hover:border-[#00ff88]/30 hover:bg-[#141414] transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                            <Package
                              size={18}
                              className="text-[#00ff88]"
                            />
                          </div>

                          <span
                            className={`text-xs font-bold ${
                              Number(product.stock || 0) <= 0
                                ? 'text-red-400'
                                : low
                                  ? 'text-yellow-400'
                                  : 'text-gray-500'
                            }`}
                          >
                            Stock {product.stock || 0}
                          </span>
                        </div>

                        <p className="text-white font-bold mt-4">
                          {product.name}
                        </p>

                        <p className="text-gray-600 text-xs mt-1">
                          {product.category}
                        </p>

                        <div className="flex items-center justify-between gap-3 mt-4">
                          <span className="text-[#00ff88] text-lg font-black">
                            {money(product.price)}
                          </span>

                          <span className="w-8 h-8 rounded-lg bg-[#00ff88]/10 text-[#00ff88] flex items-center justify-center">
                            <Plus size={16} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl overflow-hidden h-fit 2xl:sticky 2xl:top-6">
              <div className="p-5 border-b border-[#1d1d1d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart
                    size={19}
                    className="text-[#00ff88]"
                  />
                  <h2 className="text-white font-black">
                    Carrito
                  </h2>
                </div>

                <span className="text-gray-600 text-xs">
                  {cart.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )} artículos
                </span>
              </div>

              <div className="p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="py-10 text-center">
                    <ShoppingCart
                      size={38}
                      className="text-gray-700 mx-auto mb-3"
                    />
                    <p className="text-gray-500 text-sm">
                      Agrega productos para comenzar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {cart.map(item => (
                      <div
                        key={item.productId}
                        className="rounded-xl bg-[#171717] border border-[#242424] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white text-sm font-semibold">
                              {item.name}
                            </p>
                            <p className="text-[#00ff88] text-sm font-bold mt-1">
                              {money(item.unitPrice * item.quantity)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-[#202020] text-gray-300 flex items-center justify-center"
                          >
                            <Minus size={14} />
                          </button>

                          <div className="flex-1 text-center text-white font-black">
                            {item.quantity}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-[#202020] text-gray-300 flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-[#242424] pt-4">
                  <p className="text-white text-sm font-bold mb-3">
                    Cliente
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode('general');
                        setSelectedMember(null);
                        setMemberSearch('');
                      }}
                      className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 ${
                        customerMode === 'general'
                          ? 'bg-[#00ff88]/10 border-[#00ff88]/25 text-[#00ff88]'
                          : 'bg-[#191919] border-[#292929] text-gray-500'
                      }`}
                    >
                      <Users size={16} />
                      General
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerMode('member')}
                      className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 ${
                        customerMode === 'member'
                          ? 'bg-[#00ff88]/10 border-[#00ff88]/25 text-[#00ff88]'
                          : 'bg-[#191919] border-[#292929] text-gray-500'
                      }`}
                    >
                      <User size={16} />
                      Miembro
                    </button>
                  </div>

                  {customerMode === 'member' && (
                    <div className="relative mt-3">
                      {selectedMember ? (
                        <div className="rounded-xl bg-[#171717] border border-[#00ff88]/20 p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-white text-sm font-bold">
                              {selectedMember.firstName}{' '}
                              {selectedMember.lastName}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {selectedMember.id}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedMember(null)}
                            className="w-8 h-8 rounded-lg bg-[#202020] text-gray-400 flex items-center justify-center"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            value={memberSearch}
                            onChange={event =>
                              setMemberSearch(event.target.value)
                            }
                            placeholder="Buscar miembro..."
                            className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none"
                          />

                          {memberResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-[#151515] border border-[#292929] rounded-xl overflow-hidden shadow-xl">
                              {memberResults.map(member => (
                                <button
                                  type="button"
                                  key={member.id}
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setMemberSearch('');
                                  }}
                                  className="w-full p-3 text-left hover:bg-[#1d1d1d] border-b border-[#242424] last:border-b-0"
                                >
                                  <p className="text-white text-sm font-semibold">
                                    {member.firstName}{' '}
                                    {member.lastName}
                                  </p>
                                  <p className="text-gray-600 text-xs">
                                    {member.id} · {member.phone || 'Sin teléfono'}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#242424] pt-4">
                  <p className="text-white text-sm font-bold mb-3">
                    Método de pago
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: 'efectivo',
                        label: 'Efectivo',
                        icon: Banknote
                      },
                      {
                        id: 'tarjeta',
                        label: 'Tarjeta',
                        icon: CreditCard
                      },
                      {
                        id: 'transferencia',
                        label: 'Transfer.',
                        icon: Landmark
                      }
                    ].map(method => (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 ${
                          paymentMethod === method.id
                            ? 'bg-[#00ff88]/10 border-[#00ff88]/25 text-[#00ff88]'
                            : 'bg-[#191919] border-[#292929] text-gray-500'
                        }`}
                      >
                        <method.icon size={16} />
                        {method.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'efectivo' ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-500 text-xs block mb-1">
                          Recibido
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={received}
                          onChange={event => setReceived(event.target.value)}
                          className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-gray-500 text-xs block mb-1">
                          Cambio
                        </label>
                        <div className="w-full bg-[#151515] border border-[#242424] rounded-xl px-3 py-2.5 text-[#00ff88] font-black">
                          {money(change)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="text-gray-500 text-xs block mb-1">
                        Referencia
                      </label>
                      <input
                        value={reference}
                        onChange={event => setReference(event.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-gray-500 text-xs block mb-1">
                    Descuento de venta
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={event => setDiscount(event.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                  />
                </div>

                <div className="rounded-xl bg-[#171717] border border-[#242424] p-4 space-y-2">
                  <Row label="Subtotal" value={money(subtotal)} />
                  <Row label="Descuento" value={`-${money(discountAmount)}`} />

                  <div className="border-t border-[#292929] pt-3 mt-3">
                    <Row
                      label="TOTAL"
                      value={money(total)}
                      strong
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={completeSale}
                  disabled={cart.length === 0}
                  className="w-full py-3.5 rounded-xl bg-[#00ff88] text-black font-black disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cobrar {money(total)}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {lastSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLastSale(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md bg-[#111111] border border-[#242424] rounded-2xl p-7 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2
                size={31}
                className="text-[#00ff88]"
              />
            </div>

            <h2 className="text-white text-2xl font-black">
              Venta registrada
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              {lastSale.folio}
            </p>

            <p className="text-[#00ff88] text-3xl font-black mt-5">
              {money(lastSale.total)}
            </p>

            {lastSale.paymentMethod === 'efectivo' && (
              <p className="text-gray-400 text-sm mt-2">
                Cambio: {money(lastSale.change)}
              </p>
            )}

            <button
              type="button"
              onClick={() => setLastSale(null)}
              className="w-full mt-6 py-3 rounded-xl bg-[#00ff88] text-black font-black"
            >
              Nueva venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({
  label,
  value,
  strong = false
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className={strong ? 'text-white font-black' : 'text-gray-500 text-sm'}>
      {label}
    </span>
    <span
      className={
        strong
          ? 'text-[#00ff88] text-xl font-black'
          : 'text-white text-sm font-bold'
      }
    >
      {value}
    </span>
  </div>
);

export default SalesPage;
