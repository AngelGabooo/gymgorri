// src/components/Members/Profile/RenewSubscriptionPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Calendar,
  CreditCard,
  DollarSign,
  Upload,
  QrCode,
  User,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';

const RenewSubscriptionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const topRef = useRef(null);
  
  // Obtener datos del miembro desde el perfil
  const memberData = location.state?.memberData || {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    id: 'GYM-00000',
    registrationDate: 'Fecha no disponible'
  };

  const currentSubscription = location.state?.subscriptionData || {
    plan: '',
    days: 0,
    startDate: '',
    endDate: '',
    paymentMethod: '',
    amount: '0.00',
    status: 'inactive'
  };

  // Planes disponibles
  const plans = [
    { id: '7dias', label: '7 días', days: 7, price: 150 },
    { id: '15dias', label: '15 días', days: 15, price: 300 },
    { id: 'mensual', label: 'Mensual', days: 30, price: 500 },
    { id: 'anual', label: 'Anual', days: 365, price: 5000 },
  ];

  // Métodos de pago
  const paymentMethods = [
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'tarjeta', label: 'Tarjeta' },
    { id: 'transferencia', label: 'Transferencia' },
    { id: 'regalias', label: 'Regalías' },
  ];

  const [formData, setFormData] = useState({
    selectedPlan: currentSubscription.days > 0 ? 
      plans.find(p => p.days === currentSubscription.days)?.id || 'mensual' : 
      'mensual',
    startDate: new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/\./g, ''),
    endDate: '',
    paymentMethod: 'efectivo',
    amount: '500.00',
    change: '0.00',
    reference: '',
    notes: '',
    receipt: null
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [errors, setErrors] = useState({});

  const fullName = `${memberData.firstName} ${memberData.lastName}`.trim() || 'Nuevo miembro';
  const memberId = memberData.id || 'GYM-00000';

  // Calcular fecha de vencimiento basada en el plan seleccionado
  const calculateEndDate = (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return 'Fecha no disponible';
    
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + plan.days);
    return end.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/\./g, '');
  };

  // Efecto para actualizar fecha de vencimiento y monto cuando cambia el plan
  useEffect(() => {
    const plan = plans.find(p => p.id === formData.selectedPlan);
    if (plan) {
      setFormData(prev => ({
        ...prev,
        endDate: calculateEndDate(formData.selectedPlan),
        amount: plan.price.toFixed(2)
      }));
    }
  }, [formData.selectedPlan]);

  // Efecto para scroll al inicio
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Efecto para recalcular cambio
  useEffect(() => {
    if (formData.paymentMethod === 'efectivo') {
      const amountNum = parseFloat(formData.amount) || 0;
      const plan = plans.find(p => p.id === formData.selectedPlan);
      const price = plan ? plan.price : 0;
      const change = amountNum > price ? amountNum - price : 0;
      setFormData(prev => ({ ...prev, change: change.toFixed(2) }));
    }
  }, [formData.amount, formData.paymentMethod, formData.selectedPlan]);

  const handlePlanSelect = (planId) => {
    setFormData(prev => ({ ...prev, selectedPlan: planId }));
  };

  const handlePaymentMethodSelect = (method) => {
    setFormData(prev => ({ ...prev, paymentMethod: method }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, amount: value }));
  };

  const handleActivate = () => {
    const newErrors = {};
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Selecciona un método de pago';
    }
    if (formData.paymentMethod === 'efectivo' && (!formData.amount || parseFloat(formData.amount) < 0)) {
      newErrors.amount = 'Ingresa un monto válido';
    }
    if ((formData.paymentMethod === 'transferencia' || formData.paymentMethod === 'tarjeta') && !formData.reference) {
      newErrors.reference = 'Ingresa la referencia de la operación';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmRenewal = () => {
    setShowConfirmModal(false);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsActivated(true);
      
      setTimeout(() => {
        // Volver al perfil con los datos actualizados
        const selectedPlan = plans.find(p => p.id === formData.selectedPlan);
        navigate(`/members/${memberId}`, { 
          state: { 
            memberData: memberData,
            subscriptionData: {
              plan: selectedPlan?.label || 'Mensual',
              days: selectedPlan?.days || 30,
              startDate: formData.startDate,
              endDate: formData.endDate,
              paymentMethod: formData.paymentMethod,
              amount: formData.amount,
              status: 'active'
            }
          }
        });
      }, 1500);
    }, 2000);
  };

  const handleBack = () => {
    navigate(`/members/${memberId}`, { 
      state: { 
        memberData: memberData,
        subscriptionData: currentSubscription
      }
    });
  };

  const selectedPlanData = plans.find(p => p.id === formData.selectedPlan);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex" ref={topRef}>
      <Sidebar activePage="Miembros" />
      
      <div className="flex-1 lg:ml-0">
        <Header />
        
        <main className="p-6">
          {/* Breadcrumb y header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <button onClick={() => navigate('/members')} className="hover:text-white transition-colors">
                Miembros
              </button>
              <span>/</span>
              <button onClick={handleBack} className="hover:text-white transition-colors">
                {fullName}
              </button>
              <span>/</span>
              <span className="text-white">Renovar suscripción</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Renovar suscripción</h1>
                <p className="text-gray-400">Renueva la suscripción de {fullName} para continuar con el acceso al gimnasio.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleBack}
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Volver
                </button>
                <button 
                  onClick={handleActivate}
                  className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Renovar suscripción
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta de información del miembro */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center">
                  <User size={24} className="text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{fullName}</h3>
                    <span className="text-gray-500 text-sm font-mono">{memberId}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">{memberData.phone || 'Sin teléfono'}</span>
                    {memberData.email && (
                      <span className="text-gray-400">{memberData.email}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-yellow-500 text-sm font-medium">Renovación</span>
                </div>
                {currentSubscription.status === 'active' && (
                  <div className="px-3 py-1 bg-[#00ff88]/10 rounded-full">
                    <span className="text-[#00ff88] text-xs">Vence: {currentSubscription.endDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formulario y resumen en grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Formulario principal */}
            <div className="xl:col-span-2 space-y-6">
              {/* Configurar suscripción */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold mb-1">Configurar renovación</h3>
                <p className="text-gray-400 text-sm mb-6">Define el nuevo periodo de acceso al gimnasio.</p>

                {/* Selección de plan */}
                <div className="mb-6">
                  <label className="text-white text-sm font-medium mb-2 block">Selecciona un plan</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`
                          p-3 rounded-xl border-2 text-center transition-all duration-200
                          ${formData.selectedPlan === plan.id 
                            ? 'border-[#00ff88] bg-[#00ff88]/10' 
                            : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/50'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center">
                          {formData.selectedPlan === plan.id && (
                            <Check size={14} className="text-[#00ff88] mb-1" />
                          )}
                          <span className="text-white font-bold text-lg">{plan.label}</span>
                          <span className="text-[#00ff88] text-sm font-medium">{plan.days} días</span>
                          <span className="text-gray-400 text-xs mt-1">${plan.price} MXN</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duración y fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">Fecha de inicio</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">La renovación comienza hoy.</p>
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">Fecha de vencimiento</label>
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-white font-medium">{formData.endDate || 'Calculando...'}</span>
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                        {selectedPlanData ? `${selectedPlanData.days} días` : 'Automática'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visualización del período */}
                {selectedPlanData && (
                  <div className="mt-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                    <h4 className="text-white text-sm font-medium mb-3">Nuevo periodo de acceso</h4>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">INICIO</span>
                        <span className="text-[#00ff88] font-bold">{formData.startDate.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-4 my-2">
                        <div className="w-20 h-px bg-[#2a2a2a]" />
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-[#00ff88]" />
                          <span className="text-[#00ff88] font-medium">{selectedPlanData.days} DÍAS</span>
                        </div>
                        <div className="w-20 h-px bg-[#2a2a2a]" />
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">VENCIMIENTO</span>
                        <span className="text-yellow-500 font-bold">{formData.endDate?.toUpperCase() || 'Calculando...'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Registro de pago */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold mb-1">Información del pago</h3>
                <p className="text-gray-400 text-sm mb-6">Registra el pago correspondiente a la renovación.</p>

                {/* Costo */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Costo de renovación</p>
                      <p className="text-2xl font-bold text-white">${formData.amount} MXN</p>
                      <p className="text-gray-500 text-xs">{selectedPlanData?.label || 'Mensual'} · {selectedPlanData?.days || 30} días</p>
                    </div>
                    <div className="px-3 py-1 bg-[#00ff88]/10 rounded-full">
                      <span className="text-[#00ff88] text-xs font-medium">Renovación</span>
                    </div>
                  </div>
                </div>

                {/* Método de pago */}
                <div className="mb-4">
                  <label className="text-white text-sm font-medium mb-2 block">Método de pago</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                        className={`
                          p-3 rounded-xl border-2 text-center transition-all duration-200
                          ${formData.paymentMethod === method.id 
                            ? 'border-[#00ff88] bg-[#00ff88]/10' 
                            : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/50'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center">
                          {formData.paymentMethod === method.id && (
                            <Check size={14} className="text-[#00ff88] mb-1" />
                          )}
                          <span className="text-white text-sm font-medium capitalize">{method.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-red-400 text-xs mt-1">{errors.paymentMethod}</p>
                  )}
                </div>

                {/* Campos según método de pago */}
                {formData.paymentMethod === 'efectivo' && (
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">Monto recibido</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleAmountChange}
                        className={`w-full bg-[#1a1a1a] border ${errors.amount ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl pl-8 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors`}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
                    )}
                    {parseFloat(formData.amount) > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Cambio:</span>
                        <span className="text-white font-medium">${formData.change}</span>
                      </div>
                    )}
                  </div>
                )}

                {(formData.paymentMethod === 'transferencia' || formData.paymentMethod === 'tarjeta') && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-white text-sm font-medium mb-1 block">
                        {formData.paymentMethod === 'transferencia' ? 'Referencia de transferencia' : 'Referencia de operación'}
                      </label>
                      <input
                        type="text"
                        name="reference"
                        placeholder={formData.paymentMethod === 'transferencia' ? 'Ej. 839201' : 'Ej. 472819'}
                        value={formData.reference}
                        onChange={handleInputChange}
                        className={`w-full bg-[#1a1a1a] border ${errors.reference ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors`}
                      />
                      {errors.reference && (
                        <p className="text-red-400 text-xs mt-1">{errors.reference}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium mb-1 block">Adjuntar comprobante</label>
                      <div className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 text-center hover:border-[#00ff88] transition-colors cursor-pointer">
                        <Upload size={24} className="text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Haz clic para subir o arrastra un archivo</p>
                        <p className="text-gray-500 text-xs">JPG, PNG o PDF · Opcional</p>
                      </div>
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'regalias' && (
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">Código de regalía</label>
                    <input
                      type="text"
                      name="reference"
                      placeholder="Ingresa el código de regalía"
                      value={formData.reference}
                      onChange={handleInputChange}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-500 text-xs mt-1">Ingresa el código de regalía proporcionado por el gimnasio</p>
                  </div>
                )}

                {/* Fecha de pago */}
                <div className="mt-4">
                  <label className="text-white text-sm font-medium mb-1 block">Fecha del pago</label>
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <span className="text-white">{formData.startDate}</span>
                    <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                      Automática
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold">Notas</h3>
                  <span className="text-gray-500 text-xs">Opcional</span>
                </div>
                <textarea
                  name="notes"
                  placeholder="Agrega información adicional sobre esta renovación..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Panel lateral de resumen */}
            <div className="xl:col-span-1">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">
                <h3 className="text-white font-bold mb-4">Resumen de renovación</h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center">
                    <User size={24} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{fullName}</p>
                    <p className="text-gray-500 text-sm font-mono">{memberId}</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#1a1a1a] pt-4">
                  <div>
                    <p className="text-gray-400 text-xs font-medium mb-1">Suscripción actual</p>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Plan</span>
                        <span className="text-white">{currentSubscription.plan || 'Sin plan'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vence</span>
                        <span className="text-yellow-500">{currentSubscription.endDate || 'No disponible'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#1a1a1a] pt-3">
                    <p className="text-gray-400 text-xs font-medium mb-1">Nueva suscripción</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Plan</span>
                        <span className="text-[#00ff88] font-medium">{selectedPlanData?.label || 'Mensual'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duración</span>
                        <span className="text-white">{selectedPlanData?.days || 30} días</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Inicio</span>
                        <span className="text-white">{formData.startDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vencimiento</span>
                        <span className="text-yellow-500">{formData.endDate}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs font-medium mb-1">Pago</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monto</span>
                        <span className="text-white">${formData.amount} MXN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Método</span>
                        <span className="text-white capitalize">{formData.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1a1a1a] pt-4 mt-4">
                  <h4 className="text-white text-sm font-medium mb-2">Después de renovar</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span className="text-gray-400">Suscripción: <span className="text-[#00ff88]">RENOVADA</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span className="text-gray-400">Acceso: <span className="text-[#00ff88]">HABILITADO</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span className="text-gray-400">QR: <span className="text-[#00ff88]">PERMANECE IGUAL</span></span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                    <span className="text-[#00ff88]">✓ Suscripción renovada</span>
                    <ChevronRight size={14} className="text-gray-500" />
                    <span className="text-[#00ff88]">✓ Acceso continuo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones inferiores */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#1a1a1a]">
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Volver al perfil
            </button>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={handleActivate}
                className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Renovar suscripción
                <ChevronRight size={18} />
              </button>
              <p className="text-gray-500 text-xs">La renovación extenderá el acceso del miembro.</p>
            </div>
          </div>
        </main>
      </div>

      {/* Modales */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-yellow-500" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Confirmar renovación</h2>
              <div className="text-left space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Miembro</span>
                  <span className="text-white">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ID</span>
                  <span className="text-white font-mono">{memberId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white">{selectedPlanData?.label || 'Mensual'} — {selectedPlanData?.days || 30} días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Nuevo periodo</span>
                  <span className="text-white">{formData.startDate} → {formData.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monto</span>
                  <span className="text-white">${formData.amount} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Método</span>
                  <span className="text-white capitalize">{formData.paymentMethod}</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Al confirmar, la suscripción se renovará y el acceso continuará habilitado.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmRenewal}
                  className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300"
                >
                  Confirmar renovación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Renovando suscripción...</h2>
              <div className="space-y-2 text-left mt-4">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-[#00ff88]" />
                  <span className="text-gray-300 text-sm">Verificando miembro</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-300 text-sm">Registrando pago</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-500 text-sm">Renovando suscripción</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-500 text-sm">Actualizando acceso</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isActivated && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-[#00ff88]" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">¡Suscripción renovada!</h2>
              <p className="text-gray-400 text-sm mb-4">
                La suscripción de {fullName} ha sido renovada correctamente.
              </p>
              <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Nuevo periodo</span>
                  <span className="text-white">{formData.startDate} — {formData.endDate}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Estado</span>
                  <span className="text-[#00ff88] font-medium">ACTIVA</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Pago</span>
                  <span className="text-[#00ff88] font-medium">REGISTRADO</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-400">Volviendo al perfil...</span>
                <div className="w-4 h-4 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewSubscriptionPage;