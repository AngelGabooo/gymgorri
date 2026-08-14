import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronRight,
  QrCode,
  CreditCard,
  UserPlus,
  X
} from 'lucide-react';
import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';

const RegisterMemberPage = () => {
  const navigate = useNavigate();
  
  // Estado para el contador de miembros (simulado)
  const [memberCounter, setMemberCounter] = useState(0);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    profilePhoto: null,
    profilePhotoUrl: null
  });
  const [errors, setErrors] = useState({});
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Obtener fecha actual
  const getCurrentDate = () => {
    const now = new Date();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = now.getDate().toString().padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Generar ID secuencial
  const generateMemberId = (counter) => {
    const paddedNumber = counter.toString().padStart(5, '0');
    return `GYM-${paddedNumber}`;
  };

  // Cargar el contador desde localStorage (para persistencia)
  useEffect(() => {
    const savedCounter = localStorage.getItem('gymMemberCounter');
    if (savedCounter) {
      setMemberCounter(parseInt(savedCounter));
    } else {
      // Si no hay contador, iniciar en 0
      localStorage.setItem('gymMemberCounter', '0');
    }
  }, []);

  const memberId = generateMemberId(memberCounter + 1);
  const registrationDate = getCurrentDate();

  // Lista de imágenes disponibles en public/img/
  const profileImages = [
    '/img/profile1.png',
    '/img/profile2.png',
    '/img/profile3.png',
    '/img/profile4.png',
    '/img/profile5.png',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Función para seleccionar imagen aleatoria
  const handleRandomPhoto = () => {
    const randomIndex = Math.floor(Math.random() * profileImages.length);
    const selectedImage = profileImages[randomIndex];
    setFormData(prev => ({ 
      ...prev, 
      profilePhotoUrl: selectedImage,
      profilePhoto: null
    }));
  };

  // Función para subir imagen manualmente
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ 
          ...prev, 
          profilePhotoUrl: event.target.result,
          profilePhoto: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para eliminar foto
  const handleRemovePhoto = () => {
    setFormData(prev => ({ 
      ...prev, 
      profilePhotoUrl: null,
      profilePhoto: null
    }));
  };

// En handleSubmit, asegurar que la foto se pasa correctamente
const handleSubmit = (e) => {
  e.preventDefault();
  const newErrors = {};
  if (!formData.firstName) newErrors.firstName = 'El nombre es obligatorio';
  if (!formData.lastName) newErrors.lastName = 'Los apellidos son obligatorios';
  if (!formData.phone) newErrors.phone = 'Ingresa un número de teléfono válido';
  if (formData.email && !formData.email.includes('@')) {
    newErrors.email = 'Ingresa un correo electrónico válido';
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // Incrementar el contador
  const newCounter = memberCounter + 1;
  setMemberCounter(newCounter);
  localStorage.setItem('gymMemberCounter', newCounter.toString());

  // Redirigir al Paso 2 con los datos del miembro - INCLUYENDO LA FOTO
  navigate('/members/register/subscription', { 
    state: { 
      memberData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        id: generateMemberId(newCounter),
        registrationDate: registrationDate,
        profilePhoto: formData.profilePhotoUrl // <-- PASAR LA FOTO AQUÍ
      }
    }
  });
};

  const handleCancel = () => {
    if (Object.values(formData).some(value => value !== '' && value !== null)) {
      setShowDiscardModal(true);
    } else {
      navigate('/members');
    }
  };

  const steps = [
    { number: 1, label: 'Datos personales', icon: User, completed: false, current: true },
    { number: 2, label: 'Suscripción', icon: CreditCard, completed: false },
    { number: 3, label: 'Código QR', icon: QrCode, completed: false },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
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
              <span className="text-white">Registrar miembro</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Registrar nuevo miembro</h1>
                <p className="text-gray-400">Agrega una nueva persona al gimnasio y prepara su acceso.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
                >
                  <Check size={18} />
                  Guardar y continuar
                </button>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <React.Fragment key={step.number}>
                      <div className="flex items-center gap-2">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                          ${step.current ? 'bg-[#00ff88] text-black ring-2 ring-[#00ff88] ring-offset-2 ring-offset-[#111111]' : 
                            step.completed ? 'bg-[#00ff88] text-black' : 
                            'bg-[#1a1a1a] text-gray-500'}
                        `}>
                          {step.completed ? <Check size={16} /> : step.number}
                        </div>
                        <span className={`
                          text-sm font-medium
                          ${step.current ? 'text-white' : 
                            step.completed ? 'text-[#00ff88]' : 
                            'text-gray-500'}
                        `}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="hidden sm:block w-12 h-px bg-[#2a2a2a]" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <p className="text-gray-500 text-xs">
                Paso 1 de 3 - Datos personales
              </p>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Primero registra los datos del miembro. Después podrás activar su suscripción y generar su código QR.
            </p>
          </div>

          {/* Formulario y resumen en grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Formulario principal */}
            <div className="xl:col-span-2 space-y-6">
              <form onSubmit={handleSubmit}>
                {/* Foto del miembro */}
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-white font-bold mb-1">Foto del miembro</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Esta fotografía ayudará a identificar a la persona durante el control de acceso.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-32 h-32 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">
                      {formData.profilePhotoUrl ? (
                        <img 
                          src={formData.profilePhotoUrl} 
                          alt="Foto de perfil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={48} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="file"
                          id="file-upload"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label 
                          htmlFor="file-upload"
                          className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Upload size={16} />
                          Subir fotografía
                        </label>
                        <button 
                          type="button"
                          onClick={handleRandomPhoto}
                          className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
                        >
                          <Camera size={16} />
                          Usar foto aleatoria
                        </button>
                        {formData.profilePhotoUrl && (
                          <button 
                            type="button"
                            onClick={handleRemovePhoto}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                          >
                            <X size={16} />
                            Eliminar
                          </button>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-2">JPG o PNG · Máximo 5 MB</p>
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
                        placeholder="Ej. Carlos"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full bg-[#1a1a1a] border ${errors.firstName ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors`}
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
                        placeholder="Ej. Hernández López"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full bg-[#1a1a1a] border ${errors.lastName ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors`}
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
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
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
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                        <option value="prefer-not">Prefiero no especificar</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-white font-bold mb-4">Información de contacto</h3>
                  <div className="grid grid-cols-1 gap-4">
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
                          placeholder="961 123 4567"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`flex-1 bg-[#1a1a1a] border ${errors.phone ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors`}
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
                          placeholder="correo@ejemplo.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full bg-[#1a1a1a] border ${errors.email ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors`}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-white text-sm font-medium mb-1 block">
                        Contacto de emergencia
                      </label>
                      <input
                        type="text"
                        name="emergencyContact"
                        placeholder="Ej. María Hernández"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium mb-1 block">
                        Teléfono de emergencia
                      </label>
                      <input
                        type="text"
                        name="emergencyPhone"
                        placeholder="961 000 0000"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Opcional</p>
                </div>

                {/* Información del miembro */}
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-white font-bold mb-4">Información del miembro</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white text-sm font-medium mb-1 block">
                        ID del miembro
                      </label>
                      <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5">
                        <span className="text-[#00ff88] font-mono">{memberId}</span>
                        <span className="text-gray-500 text-xs ml-auto">Generado automáticamente</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium mb-1 block">
                        Fecha de registro
                      </label>
                      <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5">
                        <span className="text-gray-300">{registrationDate}</span>
                        <span className="text-gray-500 text-xs ml-auto">Generada automáticamente</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span className="text-white text-sm font-medium">Registrado</span>
                      <span className="text-gray-500 text-xs ml-auto">Sin suscripción activa</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">Este miembro todavía no tiene una suscripción activa.</p>
                  </div>
                </div>

                {/* Notas adicionales */}
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold">Notas adicionales</h3>
                    <span className="text-gray-500 text-xs">Opcional</span>
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

                {/* Botones inferiores */}
                <div className="flex flex-col items-end gap-3 pt-4">
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white transition-colors"
                    >
                      Guardar sin suscripción
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
                    >
                      Guardar y continuar
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Continuarás con la configuración de la suscripción.
                  </p>
                </div>
              </form>
            </div>

            {/* Panel lateral de resumen */}
            <div className="xl:col-span-1">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">
                <h3 className="text-white font-bold mb-4">Resumen del miembro</h3>
                
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">
                    {formData.profilePhotoUrl ? (
                      <img 
                        src={formData.profilePhotoUrl} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={36} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">
                      {formData.firstName || formData.lastName ? 
                        `${formData.firstName} ${formData.lastName}`.trim() : 
                        'Nuevo miembro'
                      }
                    </p>
                    <p className="text-gray-500 text-sm font-mono">{memberId}</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#1a1a1a] pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Estado</span>
                    <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
                      Sin suscripción
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Fecha de registro</span>
                    <span className="text-white text-sm">{registrationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Teléfono</span>
                    <span className="text-white text-sm">{formData.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Correo</span>
                    <span className="text-white text-sm truncate max-w-[120px]">{formData.email || '—'}</span>
                  </div>
                </div>

                <div className="border-t border-[#1a1a1a] pt-4 mt-4">
                  <h4 className="text-white text-sm font-medium mb-3">¿Qué sigue?</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Después de guardar al miembro podrás activar su suscripción de 30 días.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#00ff88]/10 flex items-center justify-center">
                        <UserPlus size={14} className="text-[#00ff88]" />
                      </div>
                      <span className="text-gray-300 text-sm">Registrar miembro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <ChevronRight size={14} className="text-gray-500" />
                      </div>
                      <span className="text-gray-500 text-sm">Activar suscripción</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <ChevronRight size={14} className="text-gray-500" />
                      </div>
                      <span className="text-gray-500 text-sm">Generar QR</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <ChevronRight size={14} className="text-gray-500" />
                      </div>
                      <span className="text-gray-500 text-sm">Listo para acceder</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                Los datos que ingresaste todavía no han sido guardados.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDiscardModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Seguir editando
                </button>
                <button 
                  onClick={() => navigate('/members')}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterMemberPage;