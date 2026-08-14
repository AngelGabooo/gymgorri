import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  User,
  CircleDot,
  ChevronRight,
  Plus,
  X,
  Check,
  AlertCircle,
  ArrowLeft,
  Wallet,
  FileText,
  Upload,
  Printer
} from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import PaymentStatCard from './Cards/PaymentStatCard';

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // TODOS LOS DATOS EN CERO - SIN DATOS PRECARGADOS
  const [stats] = useState({
    todayIncome: 0,
    monthIncome: 0,
    renewals: 0,
    averageTicket: 0,
  });

  const [payments] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [paymentForm, setPaymentForm] = useState({
    concept: 'renovacion',
    amount: '500.00',
    received: '0.00',
    change: '0.00',
    method: 'efectivo',
    reference: '',
    notes: '',
    receipt: null
  });

  const isEmpty = payments.length === 0;

  const filters = [
    { name: 'Todos', count: 0 },
    { name: 'Hoy', count: 0 },
    { name: 'Esta semana', count: 0 },
    { name: 'Este mes', count: 0 },
    { name: 'Renovaciones', count: 0 },
  ];

  // Métodos de pago
  const paymentMethods = [
    { id: 'efectivo', label: 'Efectivo', icon: Banknote },
    { id: 'transferencia', label: 'Transferencia', icon: CreditCard },
    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { id: 'otro', label: 'Otro', icon: Wallet },
  ];

  const handlePaymentMethodSelect = (method) => {
    setPaymentForm(prev => ({ ...prev, method }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setPaymentForm(prev => ({ ...prev, received: value }));
    // Calcular cambio
    const amountNum = parseFloat(value) || 0;
    const price = parseFloat(paymentForm.amount) || 0;
    const change = amountNum > price ? amountNum - price : 0;
    setPaymentForm(prev => ({ ...prev, change: change.toFixed(2) }));
  };

  const handleRegisterPayment = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setShowPaymentDrawer(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Pagos" />
      
      <div className="flex-1 lg:ml-0">
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Título y acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Pagos</h1>
              <p className="text-gray-400">Administra los cobros, renovaciones y movimientos registrados.</p>
            </div>
            <button 
              onClick={() => setShowPaymentDrawer(true)}
              className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
            >
              <Plus size={18} />
              Registrar pago
            </button>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <PaymentStatCard
              title="Ingresos de hoy"
              value={`$${stats.todayIncome.toLocaleString()} MXN`}
              subtitle="0 pagos registrados"
              icon={DollarSign}
              color="green"
              trend="Sin datos"
            />
            <PaymentStatCard
              title="Ingresos del mes"
              value={`$${stats.monthIncome.toLocaleString()} MXN`}
              subtitle="0 pagos"
              icon={TrendingUp}
              color="green"
              trend="Agosto 2026"
            />
            <PaymentStatCard
              title="Renovaciones del mes"
              value={stats.renewals}
              subtitle="Suscripciones renovadas"
              icon={Receipt}
              color="green"
            />
            <PaymentStatCard
              title="Ticket promedio"
              value={`$${stats.averageTicket.toLocaleString()} MXN`}
              subtitle="Promedio por pago"
              icon={Wallet}
              color="gray"
            />
          </div>

          {/* Resumen por método de pago */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-white font-bold mb-4">Métodos de pago — Este mes</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Efectivo', amount: '$0', count: '0 pagos', color: 'bg-[#00ff88]' },
                { label: 'Transferencia', amount: '$0', count: '0 pagos', color: 'bg-blue-500' },
                { label: 'Tarjeta', amount: '$0', count: '0 pagos', color: 'bg-purple-500' },
                { label: 'Otro', amount: '$0', count: '0 pagos', color: 'bg-gray-500' },
              ].map((method, index) => (
                <div key={index} className="bg-[#1a1a1a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${method.color}`} />
                    <span className="text-gray-400 text-sm">{method.label}</span>
                  </div>
                  <p className="text-white font-bold">{method.amount}</p>
                  <p className="text-gray-500 text-xs">{method.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfica de ingresos */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Ingresos</h3>
              <select className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm">
                <option>Este mes</option>
                <option>Hoy</option>
                <option>7 días</option>
                <option>30 días</option>
                <option>Personalizado</option>
              </select>
            </div>
            <div className="h-48 flex items-end gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[#1a1a1a] rounded-t-lg h-[2px]" />
                  <span className="text-gray-500 text-xs">
                    {['1 Ago', '5 Ago', '10 Ago', '15 Ago', '20 Ago', '25 Ago', '31 Ago'][i] || ''}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm text-center mt-2">Sin datos de ingresos</p>
          </div>

          {/* Historial de pagos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-xl">Historial de pagos</h2>
                <p className="text-gray-400 text-sm">Consulta todos los cobros registrados en el sistema.</p>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por miembro, ID, referencia o folio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-10 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2">
                  <Filter size={18} />
                  Filtros
                </button>
                <button className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2">
                  <Download size={18} />
                  Exportar
                </button>
                <button 
                  onClick={() => setShowPaymentDrawer(true)}
                  className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
                >
                  <Plus size={18} />
                  Registrar pago
                </button>
              </div>
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.map((filter) => (
                <button
                  key={filter.name}
                  onClick={() => setActiveFilter(filter.name)}
                  className={`
                    px-4 py-1.5 rounded-full text-sm transition-all duration-200
                    ${activeFilter === filter.name 
                      ? 'bg-[#00ff88] text-black font-bold' 
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                    }
                  `}
                >
                  {filter.name} <span className="text-xs opacity-70">({filter.count})</span>
                </button>
              ))}
            </div>

            {/* Tabla de pagos */}
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
              {isEmpty ? (
                <div className="text-center py-16">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-[#1a1a1a] rounded-full">
                      <Receipt size={48} className="text-gray-600" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">No hay pagos registrados</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                    Los pagos y renovaciones aparecerán aquí.
                  </p>
                  <button 
                    onClick={() => setShowPaymentDrawer(true)}
                    className="px-6 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2 mx-auto"
                  >
                    <Plus size={18} />
                    Registrar primer pago
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                      <tr>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Folio</th>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Miembro</th>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Fecha</th>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Concepto</th>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Periodo</th>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Método</th>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Monto</th>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Estado</th>
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Los datos se mostrarán aquí cuando existan */}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Paginación */}
            {!isEmpty && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <p className="text-gray-400 text-sm">Mostrando 1–0 de 0 pagos</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-400 text-sm hover:border-[#00ff88] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Anterior
                  </button>
                  <button className="px-3 py-1.5 bg-[#00ff88] text-black rounded-lg text-sm font-bold">1</button>
                  <button className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-400 text-sm hover:border-[#00ff88] transition-colors">
                    Siguiente
                  </button>
                  <select className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm">
                    <option>20 por página</option>
                    <option>50 por página</option>
                    <option>100 por página</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Drawer - Registrar pago */}
      {showPaymentDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowPaymentDrawer(false)}
          />
          
          {/* Drawer */}
          <div className="relative w-full max-w-lg h-full bg-[#111111] border-l border-[#1a1a1a] shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Registrar pago</h2>
                  <p className="text-gray-400 text-sm">Registra un nuevo cobro para un miembro.</p>
                </div>
                <button 
                  onClick={() => setShowPaymentDrawer(false)}
                  className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Seleccionar miembro */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
                <p className="text-gray-400 text-sm font-medium mb-2">Paso 1 — Seleccionar miembro</p>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o ID..."
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                  />
                </div>
                <div className="mt-4 text-center py-8">
                  <User size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Busca un miembro para registrar el pago</p>
                </div>
              </div>

              {/* Concepto */}
              <div className="mb-6">
                <label className="text-white text-sm font-medium mb-2 block">Concepto</label>
                <div className="grid grid-cols-1 gap-2">
                  <button className="p-3 bg-[#1a1a1a] border border-[#00ff88] rounded-xl text-white hover:border-[#00ff88] transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                        <Check size={16} className="text-[#00ff88]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Renovación de suscripción</p>
                        <p className="text-gray-400 text-xs">30 días · $500 MXN</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Renovación */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
                <h4 className="text-white font-medium mb-2">Renovación</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Periodo</span>
                    <span className="text-white">30 días</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Vencimiento actual</span>
                    <span className="text-yellow-500">No disponible</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Días restantes</span>
                    <span className="text-white">0 días</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-[#0d0d0d] rounded-lg">
                  <p className="text-gray-400 text-xs text-center">Selecciona un miembro para ver los detalles de renovación</p>
                </div>
              </div>

              {/* Monto */}
              <div className="mb-6">
                <label className="text-white text-sm font-medium mb-2 block">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="text"
                    value={paymentForm.amount}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-8 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">Precio configurado para suscripción mensual.</p>
              </div>

              {/* Método de pago */}
              <div className="mb-6">
                <label className="text-white text-sm font-medium mb-2 block">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handlePaymentMethodSelect(method.id)}
                      className={`
                        p-3 rounded-xl border-2 text-center transition-all duration-200
                        ${paymentForm.method === method.id 
                          ? 'border-[#00ff88] bg-[#00ff88]/10' 
                          : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/50'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center">
                        {paymentForm.method === method.id && (
                          <Check size={14} className="text-[#00ff88] mb-1" />
                        )}
                        <span className="text-white text-sm font-medium capitalize">{method.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Efectivo - Cambio */}
              {paymentForm.method === 'efectivo' && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-white text-sm font-medium mb-1 block">Monto recibido</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          value={paymentForm.received}
                          onChange={handleAmountChange}
                          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl pl-8 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white">${paymentForm.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Recibido</span>
                      <span className="text-white">${paymentForm.received || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t border-[#2a2a2a]">
                      <span className="text-gray-400 font-medium">Cambio</span>
                      <span className="text-[#00ff88] font-bold">${paymentForm.change}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transferencia / Tarjeta */}
              {(paymentForm.method === 'transferencia' || paymentForm.method === 'tarjeta') && (
                <div className="mb-6">
                  <label className="text-white text-sm font-medium mb-1 block">
                    {paymentForm.method === 'transferencia' ? 'Referencia' : 'Referencia de operación'}
                  </label>
                  <input
                    type="text"
                    placeholder={paymentForm.method === 'transferencia' ? 'Ej. 829104' : 'Ej. 472819'}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                  />
                  <div className="mt-3 border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 text-center hover:border-[#00ff88] transition-colors cursor-pointer">
                    <Upload size={24} className="text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Adjuntar comprobante</p>
                    <p className="text-gray-500 text-xs">JPG, PNG o PDF · Opcional</p>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div className="mb-6">
                <label className="text-white text-sm font-medium mb-2 block">Notas</label>
                <textarea
                  placeholder="Agrega información adicional sobre este pago..."
                  rows="3"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors resize-none"
                />
                <p className="text-gray-500 text-xs mt-1">Opcional</p>
              </div>

              {/* Resumen */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
                <h4 className="text-white font-medium mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Miembro</span>
                    <span className="text-white">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Concepto</span>
                    <span className="text-white">Renovación</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Método</span>
                    <span className="text-white capitalize">{paymentForm.method}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#2a2a2a]">
                    <span className="text-gray-400 font-medium">Total</span>
                    <span className="text-[#00ff88] font-bold">${paymentForm.amount} MXN</span>
                  </div>
                </div>
              </div>

              {/* Botón registrar */}
              <button 
                onClick={handleRegisterPayment}
                className="w-full py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Registrar pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-yellow-500" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Confirmar pago</h2>
              <div className="text-left space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Miembro</span>
                  <span className="text-white">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Concepto</span>
                  <span className="text-white">Renovación · 30 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monto</span>
                  <span className="text-[#00ff88] font-bold">${paymentForm.amount} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Método</span>
                  <span className="text-white capitalize">{paymentForm.method}</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Al confirmar se registrará el pago y la renovación de la suscripción.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmPayment}
                  className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300"
                >
                  Confirmar pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                <CheckCircle size={40} className="text-[#00ff88]" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">¡Pago registrado!</h2>
              <p className="text-gray-400 mb-4">
                El pago fue registrado correctamente.
              </p>
              <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
                <p className="text-[#00ff88] font-mono text-lg">PAY-00001</p>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Monto</span>
                  <span className="text-[#00ff88] font-medium">${paymentForm.amount} MXN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estado</span>
                  <span className="text-[#00ff88]">PAGADO</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center justify-center gap-2">
                  <Printer size={18} />
                  Imprimir recibo
                </button>
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowPaymentDrawer(false);
                  }}
                  className="w-full px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors"
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in-right {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PaymentsPage;