import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Upload,
  Camera,
  Check,
  AlertCircle,
  X,
  Lock,
  Edit,
  UserCheck,
  UserX,
  CircleDot,
  Save,
  Trash2,
  Image,
  XCircle
} from 'lucide-react';
import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';

const EditMemberPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const topRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Obtener datos del miembro desde el perfil
  const memberData = location.state?.memberData || {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    id: 'GYM-00000',
    registrationDate: 'Fecha no disponible',
    birthDate: '',
    emergencyContact: '',
    emergencyPhone: '',
    gender: '',
    notes: ''
  };

  const subscriptionData = location.state?.subscriptionData || {
    plan: '',
    days: 0,
    startDate: '',
    endDate: '',
    paymentMethod: '',
    amount: '0.00',
    status: 'inactive'
  };

  const [formData, setFormData] = useState({
    firstName: memberData.firstName || '',
    lastName: memberData.lastName || '',
    birthDate: memberData.birthDate || '',
    gender: memberData.gender || '',
    phone: memberData.phone || '',
    email: memberData.email || '',
    emergencyContact: memberData.emergencyContact || '',
    emergencyPhone: memberData.emergencyPhone || '',
    notes: memberData.notes || '',
    profilePhoto: null
  });

  const [originalData] = useState({ ...formData });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'Nuevo miembro';
  const memberId = memberData.id || 'GYM-00000';

  // Verificar cambios
  useEffect(() => {
    const hasUnsavedChanges = Object.keys(formData).some(
      key => formData[key] !== originalData[key]
    );
    setHasChanges(hasUnsavedChanges);
  }, [formData, originalData]);

  // Scroll al inicio
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    if (!formData.lastName.trim()) newErrors.lastName = 'Los apellidos son obligatorios';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    // Simular guardado
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        // Actualizar datos en el estado original
        Object.keys(formData).forEach(key => {
          originalData[key] = formData[key];
        });
        // Volver al perfil con los datos actualizados
        navigate(`/members/${memberId}`, { 
          state: { 
            memberData: {
              ...memberData,
              firstName: formData.firstName,
              lastName: formData.lastName,
              birthDate: formData.birthDate,
              gender: formData.gender,
              phone: formData.phone,
              email: formData.email,
              emergencyContact: formData.emergencyContact,
              emergencyPhone: formData.emergencyPhone,
              notes: formData.notes
            },
            subscriptionData: subscriptionData
          }
        });
      }, 2000);
    }, 1500);
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowDiscardModal(true);
    } else {
      navigate(`/members/${memberId}`, { 
        state: { 
          memberData: memberData,
          subscriptionData: subscriptionData
        }
      });
    }
  };

  const handleDiscard = () => {
    setShowDiscardModal(false);
    navigate(`/members/${memberId}`, { 
      state: { 
        memberData: memberData,
        subscriptionData: subscriptionData
      }
    });
  };

  const getModifiedFields = () => {
    const modified = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== originalData[key]) {
        modified[key] = {
          old: originalData[key],
          new: formData[key]
        };
      }
    });
    return modified;
  };

  const modifiedFields = getModifiedFields();
  const fieldLabels = {
    firstName: 'Nombre',
    lastName: 'Apellidos',
    birthDate: 'Fecha de nacimiento',
    gender: 'Género',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    emergencyContact: 'Contacto de emergencia',
    emergencyPhone: 'Teléfono de emergencia',
    notes: 'Notas'
  };

  // Calcular días restantes
  const calculateDaysRemaining = () => {
    if (!subscriptionData.endDate || subscriptionData.endDate === 'Fecha no disponible') return 0;
    try {
      const parts = subscriptionData.endDate.split(' ');
      const day = parseInt(parts[0]);
      const month = parts[1];
      const year = parseInt(parts[2]);
      const monthMap = { 'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11 };
      const endDate = new Date(year, monthMap[month], day);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex" ref={topRef}>
      <Sidebar activePage="Miembros" />
      
      <div className="flex-1 lg:ml-0">
        <Header />
        
        <main className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <button onClick={() => navigate('/members')} className="hover:text-white transition-colors">
              Miembros
            </button>
            <span>/</span>
            <button 
              onClick={() => navigate(`/members/${memberId}`, { state: { memberData, subscriptionData } })}
              className="hover:text-white transition-colors"
            >
              {fullName}
            </button>
            <span>/</span>
            <span className="text-white">Editar</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Editar miembro</h1>
              <p className="text-gray-400">Actualiza la información personal y de contacto del miembro.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Guardar cambios
              </button>
            </div>
          </div>

          {/* Tarjeta resumen del miembro */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center">
                  <User size={24} className="text-gray-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{fullName}</h3>
                  <p className="text-gray-500 text-sm font-mono">{memberId}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {subscriptionData.status === 'active' ? (
                  <>
                    <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full font-medium flex items-center gap-1">
                      <Check size={12} />
                      Suscripción activa
                    </span>
                    <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full font-medium flex items-center gap-1">
                      <Check size={12} />
                      Acceso permitido
                    </span>
                  </>
                ) : (
                  <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-full font-medium flex items-center gap-1">
                    <XCircle size={12} />
                    Sin suscripción
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 ml-auto">
                Miembro desde {memberData.registrationDate}
              </div>
            </div>
          </div>

          {/* Formulario y panel lateral */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Formulario principal - 3 columnas */}
            <div className="xl:col-span-3 space-y-6">
              {/* Foto del miembro */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold mb-1">Fotografía</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Esta fotografía se utiliza para identificar al miembro durante el control de acceso.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">
                    {formData.profilePhoto ? (
                      <img 
                        src={URL.createObjectURL(formData.profilePhoto)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Cambiar fotografía
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2">
                      <Camera size={16} />
                      Usar cámara
                    </button>
                    <button className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2">
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              {/* Información personal */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold mb-4">Información personal</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">
                      Nombre <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full bg-[#1a1a1a] border ${errors.firstName ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors`}
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">
                      Apellidos <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full bg-[#1a1a1a] border ${errors.lastName ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors`}
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">
                      Fecha de nacimiento
                    </label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        name="birthDate"
                        placeholder="DD / MM / AAAA"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">
                      Género
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                      <option value="Prefiero no especificar">Prefiero no especificar</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold mb-4">Información de contacto</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">
                      Teléfono <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select className="w-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors">
                        <option>+52</option>
                        <option>+1</option>
                        <option>+34</option>
                      </select>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`flex-1 bg-[#1a1a1a] border ${errors.phone ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full bg-[#1a1a1a] border ${errors.email ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Utilizado para notificaciones y recuperación de información.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contacto de emergencia */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold mb-4">Contacto de emergencia</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">
                      Nombre del contacto
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-1 block">
                      Teléfono de emergencia
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">Opcional</p>
              </div>

              {/* Notas */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold">Notas</h3>
                  <span className="text-gray-500 text-xs">Solo visible para personal autorizado</span>
                </div>
                <textarea
                  name="notes"
                  placeholder="Agrega información importante sobre este miembro..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Información del sistema - NO EDITABLE */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 opacity-70">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={18} className="text-gray-500" />
                  <h3 className="text-white font-bold">Información del sistema</h3>
                  <span className="text-gray-500 text-xs">No editable</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  Esta información es administrada automáticamente por el sistema.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">ID del miembro</p>
                    <p className="text-[#00ff88] font-mono">{memberId}</p>
                    <span className="text-gray-500 text-xs">No editable</span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Fecha de registro</p>
                    <p className="text-white">{memberData.registrationDate}</p>
                    <span className="text-gray-500 text-xs">No editable</span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Código QR</p>
                    <p className="text-white font-mono">QR-{memberId}</p>
                    <span className="text-gray-500 text-xs">No editable desde esta sección</span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Estado de suscripción</p>
                    <p className={subscriptionData.status === 'active' ? 'text-[#00ff88]' : 'text-gray-400'}>
                      {subscriptionData.status === 'active' ? 'Activa' : 'Sin suscripción'}
                    </p>
                    <span className="text-gray-500 text-xs">Administrar desde Suscripciones</span>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-sm">Fecha de vencimiento</p>
                    <p className="text-white">{subscriptionData.endDate || 'No disponible'}</p>
                    <span className="text-gray-500 text-xs">Administrar desde Suscripciones</span>
                  </div>
                </div>
              </div>

              {/* Administración del miembro */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold mb-4">Administración del miembro</h3>
                <div className="space-y-4">
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Bloquear acceso</p>
                        <p className="text-gray-400 text-sm">Impide temporalmente que el miembro pueda ingresar utilizando su código QR.</p>
                      </div>
                      <button 
                        onClick={() => setShowBlockModal(true)}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Bloquear acceso
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Dar de baja</p>
                        <p className="text-gray-400 text-sm">Marca al miembro como inactivo sin eliminar su historial.</p>
                      </div>
                      <button 
                        onClick={() => setShowDeactivateModal(true)}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Dar de baja miembro
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel lateral - 1 columna */}
            <div className="xl:col-span-1">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">
                <h3 className="text-white font-bold mb-4">Resumen</h3>
                
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center mb-3">
                    <User size={32} className="text-gray-500" />
                  </div>
                  <p className="text-white font-bold">{fullName}</p>
                  <p className="text-gray-500 text-sm font-mono">{memberId}</p>
                  <div className="mt-2">
                    <span className="px-3 py-0.5 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full">
                      {subscriptionData.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-[#1a1a1a] pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Suscripción</span>
                    <span className="text-white">{subscriptionData.plan || 'Sin plan'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vencimiento</span>
                    <span className="text-white">{subscriptionData.endDate || 'No disponible'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Días restantes</span>
                    <span className={daysRemaining <= 5 ? 'text-yellow-500' : 'text-white'}>
                      {daysRemaining} días
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">QR</span>
                    <span className="text-[#00ff88]">Habilitado</span>
                  </div>
                </div>

                {/* Cambios sin guardar */}
                {hasChanges && Object.keys(modifiedFields).length > 0 && (
                  <div className="border-t border-[#1a1a1a] pt-4 mt-4">
                    <p className="text-yellow-500 text-sm font-medium mb-3">Cambios sin guardar</p>
                    <div className="space-y-2">
                      {Object.keys(modifiedFields).map(key => (
                        <div key={key} className="text-xs">
                          <p className="text-gray-400">{fieldLabels[key] || key}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 line-through">{modifiedFields[key].old || '—'}</span>
                            <span className="text-[#00ff88]">→</span>
                            <span className="text-white">{modifiedFields[key].new || '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra sticky de guardado */}
          {hasChanges && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1a1a1a] p-4 z-40 lg:ml-64">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-yellow-500" />
                  <span className="text-white font-medium">Tienes cambios sin guardar</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDiscardModal(true)}
                    className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-red-500 hover:text-red-400 transition-colors"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
                  >
                    <Save size={18} />
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast de éxito */}
          {showSuccessToast && (
            <div className="fixed top-20 right-4 bg-[#111111] border border-[#00ff88] rounded-xl p-4 shadow-2xl z-50 max-w-sm animate-slide-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-[#00ff88]" />
                </div>
                <div>
                  <p className="text-white font-bold">Cambios guardados</p>
                  <p className="text-gray-400 text-sm">La información fue actualizada correctamente.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de descartar cambios */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-yellow-500" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">¿Descartar cambios?</h2>
              <p className="text-gray-400 mb-6">
                Realizaste modificaciones que todavía no han sido guardadas.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDiscardModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Seguir editando
                </button>
                <button 
                  onClick={handleDiscard}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  Descartar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de bloquear acceso */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-red-400" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Bloquear acceso de {fullName}</h2>
              <p className="text-gray-400 text-sm mb-4">
                El miembro no podrá ingresar mediante su código QR hasta que un administrador retire el bloqueo.
              </p>
              <div className="text-left mb-6">
                <label className="text-white text-sm font-medium mb-1 block">
                  Motivo <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Escribe el motivo del bloqueo..."
                  rows="3"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (!blockReason.trim()) {
                      alert('Debes escribir un motivo');
                      return;
                    }
                    setShowBlockModal(false);
                    setBlockReason('');
                    alert('Acceso bloqueado correctamente');
                  }}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  Bloquear acceso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de dar de baja */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <UserX size={32} className="text-red-400" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Dar de baja miembro</h2>
              <p className="text-gray-400 text-sm mb-4">
                {fullName} dejará de aparecer entre los miembros activos. Su historial de suscripciones, pagos y asistencias será conservado.
              </p>
              <div className="text-left mb-6">
                <label className="text-white text-sm font-medium mb-1 block">
                  Motivo <span className="text-red-400">*</span>
                </label>
                <select className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors">
                  <option value="">Seleccionar motivo</option>
                  <option>Solicitud del miembro</option>
                  <option>Cambio de gimnasio</option>
                  <option>Inactividad</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeactivateModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setShowDeactivateModal(false);
                    alert('Miembro dado de baja correctamente');
                  }}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  Confirmar baja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditMemberPage;