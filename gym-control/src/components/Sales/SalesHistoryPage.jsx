// src/components/Sales/SalesHistoryPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Search,
  ReceiptText,
  Eye,
  CalendarDays,
  Banknote,
  Package
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import ProductStatCard from './ProductStatCard';
import SaleDetailModal from './SaleDetailModal';

import {
  getSales,
  getSalesSummary
} from '../../services/salesService';

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  const load = () => {
    setSales(getSales());
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return sales;

    return sales.filter(sale =>
      [
        sale.folio,
        sale.customer?.memberName,
        sale.customer?.memberId,
        sale.paymentMethod,
        ...(sale.items || []).map(item => item.name)
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [sales, search]);

  const money = value =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(value || 0));

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Ventas" />

      <div className="flex-1 min-w-0">
        <Header />

        <main className="p-6 space-y-6">
          <div>
            <h1 className="text-white text-2xl font-black">
              Historial de ventas
            </h1>
            <p className="text-gray-500 mt-1">
              Consulta todas las ventas de productos.
            </p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <ProductStatCard
              title="Ventas hoy"
              value={money(summary.todayIncome)}
              subtitle={`${summary.todayCount} operaciones`}
              icon={Banknote}
            />

            <ProductStatCard
              title="Ventas del mes"
              value={money(summary.monthIncome)}
              subtitle={`${summary.monthCount} operaciones`}
              icon={CalendarDays}
              tone="blue"
            />

            <ProductStatCard
              title="Productos vendidos"
              value={summary.productsSoldMonth}
              subtitle="Este mes"
              icon={Package}
              tone="yellow"
            />

            <ProductStatCard
              title="Ganancia estimada"
              value={money(summary.monthProfit)}
              subtitle="Este mes"
              icon={ReceiptText}
              tone="green"
            />
          </div>

          <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1d1d1d]">
              <div className="relative max-w-xl">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Buscar folio, cliente o producto..."
                  className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <ReceiptText
                  size={46}
                  className="text-gray-700 mx-auto mb-3"
                />
                <p className="text-white font-bold">
                  Todavía no hay ventas
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Las ventas aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-[#0d0d0d]">
                    <tr>
                      {[
                        'Folio',
                        'Fecha',
                        'Cliente',
                        'Productos',
                        'Método',
                        'Total',
                        'Estado',
                        ''
                      ].map(label => (
                        <th
                          key={label}
                          className="px-4 py-3 text-left text-gray-500 text-[11px] uppercase tracking-wider"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map(sale => (
                      <tr
                        key={sale.id}
                        className="border-t border-[#1d1d1d] hover:bg-white/[0.015]"
                      >
                        <td className="px-4 py-4 text-white font-mono text-sm">
                          {sale.folio}
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-sm">
                          {new Date(sale.createdAt).toLocaleString('es-MX')}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-white text-sm font-semibold">
                            {sale.customer?.memberName || 'Venta general'}
                          </p>
                          <p className="text-gray-600 text-xs">
                            {sale.customer?.memberId || 'Público general'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-gray-400">
                          {sale.itemCount || 0}
                        </td>
                        <td className="px-4 py-4 text-gray-400 capitalize">
                          {sale.paymentMethod}
                        </td>
                        <td className="px-4 py-4 text-[#00ff88] font-black">
                          {money(sale.total)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              sale.status === 'cancelled'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-[#00ff88]/10 text-[#00ff88]'
                            }`}
                          >
                            {sale.status === 'cancelled'
                              ? 'Cancelada'
                              : 'Completada'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
                            className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#292929] text-gray-300 hover:text-white flex items-center justify-center"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <SaleDetailModal
        open={Boolean(selectedSale)}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
};

export default SalesHistoryPage;
