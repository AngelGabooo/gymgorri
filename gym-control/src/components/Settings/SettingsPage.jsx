import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Building,
  Users,
  CreditCard,
  QrCode,
  Clock,
  Receipt,
  UserCog,
  Mail,
  Phone,
  MapPin,
  Image,
  Upload,
  X,
  Check,
  AlertCircle,
  Eye,
  Edit,
  MoreVertical,
  Search,
  Filter,
  Plus,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  Save,
  Shield,
  Camera,
  Volume2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  Copy,
  ChevronRight,
  ArrowLeft,
  CircleDot,
  User,
  LogOut,
  BarChart3,
  LayoutDashboard,
  UserCheck,
  UserX,
  Clock as ClockIcon
} from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import SettingsStatCard from './Cards/SettingsStatCard';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [showSaveBar, setShowSaveBar] = useState(false);
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Datos de configuración - TODOS VACÍOS
  const [settings, setSettings] = useState({
    gymName: '',
    shortName: '',
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    colony: '',
    city: '',
    state: '',
    postalCode: '',
    logo: null,
    subscriptionPrice: '0.00',
    subscriptionDuration: 30,
    warningDays: 5,
    renewalConserveDays: true,
    capacity: 0,
    capacityWarning: 80,
    capacityCritical: 95,
    currency: 'MXN',
    paymentMethods: {
      efectivo: true,
      transferencia: true,
      tarjeta: true,
      otro: true,
    },
    receiptPrefix: 'PAY',
    memberPrefix: 'GYM',
    receiptMessage: '',
    qrPermanent: true,
    autoEntryExit: true,
    doubleScanProtection: true,
    scanInterval: 30,
    resultDisplayTime: 4,
    showPhotoAfterScan: true,
    publicInfo: {
      name: true,
      photo: true,
      accessStatus: true,
      entryTime: true,
      expiryWarning: true,
    },
    sounds: {
      allowed: true,
      denied: true,
      volume: 70,
    },
    cameraDevice: 'default',
    hours: {
      monday: { open: true, start: '05:00', end: '22:00' },
      tuesday: { open: true, start: '05:00', end: '22:00' },
      wednesday: { open: true, start: '05:00', end: '22:00' },
      thursday: { open: true, start: '05:00', end: '22:00' },
      friday: { open: true, start: '05:00', end: '22:00' },
      saturday: { open: true, start: '06:00', end: '20:00' },
      sunday: { open: true, start: '08:00', end: '14:00' },
    },
  });

  // Usuarios del sistema - VACÍOS
  const [users] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('Todos');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'suscripciones', label: 'Suscripciones' },
    { id: 'acceso', label: 'Control de acceso' },
    { id: 'horarios', label: 'Horarios y capacidad' },
    { id: 'recibos', label: 'Recibos y pagos' },
    { id: 'usuarios', label: 'Usuarios del sistema' },
  ];

  const userFilters = ['Todos', 'Administradores', 'Recepción', 'Activos', 'Inactivos'];

  const isEmpty = users.length === 0;

  const handleSave = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    setShowSuccessToast(true);
    setShowSaveBar(false);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setShowSaveBar(true);
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setShowSaveBar(true);
  };

  const renderGeneralTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        {/* Logo */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Logo del gimnasio</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl flex items-center justify-center overflow-hidden">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building size={48} className="text-gray-500" />
              )}
            </div>
            <div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2">
                  <Upload size={16} />
                  Cambiar logo
                </button>
                <button className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">PNG, JPG o SVG · Recomendado fondo transparente.</p>
            </div>
          </div>
        </div>

        {/* Identidad */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Identidad</h3>
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Nombre del gimnasio</label>
              <input
                type="text"
                name="gymName"
                value={settings.gymName}
                onChange={handleInputChange}
                placeholder="Ej. GYM CONTROL FITNESS"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Nombre corto</label>
              <input
                type="text"
                name="shortName"
                value={settings.shortName}
                onChange={handleInputChange}
                placeholder="Ej. GYM CONTROL"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
              <p className="text-gray-500 text-xs mt-1">Utilizado en credenciales, recibos y pantallas de acceso.</p>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Información de contacto</h3>
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Teléfono</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="phone"
                  value={settings.phone}
                  onChange={handleInputChange}
                  placeholder="+52 961 123 4567"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Correo electrónico</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleInputChange}
                  placeholder="contacto@gymcontrol.com"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">WhatsApp</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="whatsapp"
                  value={settings.whatsapp}
                  onChange={handleInputChange}
                  placeholder="+52 961 123 4567"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Dirección</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-white text-sm font-medium mb-1 block">Dirección</label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleInputChange}
                placeholder="Av. Central Norte 125"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Colonia</label>
              <input
                type="text"
                name="colony"
                value={settings.colony}
                onChange={handleInputChange}
                placeholder="Centro"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Ciudad</label>
              <input
                type="text"
                name="city"
                value={settings.city}
                onChange={handleInputChange}
                placeholder="Tuxtla Gutiérrez"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Estado</label>
              <input
                type="text"
                name="state"
                value={settings.state}
                onChange={handleInputChange}
                placeholder="Chiapas"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Código postal</label>
              <input
                type="text"
                name="postalCode"
                value={settings.postalCode}
                onChange={handleInputChange}
                placeholder="29000"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview lateral */}
      <div className="xl:col-span-1">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">
          <h3 className="text-white font-bold mb-4">Vista previa</h3>
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-[#00ff88] rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-black font-bold">💪</span>
              </div>
              <p className="text-white font-bold text-sm">{settings.shortName || 'GYM CONTROL'}</p>
              <p className="text-gray-400 text-xs">Credencial QR</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
              <p className="text-white font-bold text-sm">{settings.shortName || 'GYM CONTROL'}</p>
              <p className="text-gray-400 text-xs">{settings.address || 'Dirección'}</p>
              <p className="text-gray-400 text-xs">{settings.phone || 'Teléfono'}</p>
              <p className="text-gray-500 text-[10px] mt-1">Recibo</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
              <p className="text-white font-bold text-sm">GYM CONTROL</p>
              <p className="text-gray-400 text-xs">Bienvenido</p>
              <p className="text-gray-500 text-[10px]">Escanea tu código QR</p>
              <p className="text-gray-500 text-[10px] mt-1">Terminal de acceso</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuscripcionesTab = () => (
    <div className="space-y-6">
      {/* Plan principal */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Suscripción mensual</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white text-sm font-medium mb-1 block">Precio</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                name="subscriptionPrice"
                value={settings.subscriptionPrice}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-8 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="text-white text-sm font-medium mb-1 block">Duración</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="subscriptionDuration"
                value={settings.subscriptionDuration}
                onChange={handleInputChange}
                className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
              <span className="text-gray-400">días</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">Duración estándar de la suscripción mensual.</p>
          </div>
        </div>
      </div>

      {/* Advertencia de vencimiento */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Advertencia de vencimiento</h3>
        <div>
          <label className="text-white text-sm font-medium mb-1 block">Avisar cuando falten</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="warningDays"
              value={settings.warningDays}
              onChange={handleInputChange}
              className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
            />
            <span className="text-gray-400">días</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Los miembros se mostrarán como "Por vencer" cuando resten {settings.warningDays} días o menos.
          </p>
        </div>
      </div>

      {/* Comportamiento de renovación */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Comportamiento de renovación</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Conservar días restantes</p>
              <p className="text-gray-400 text-sm">Si el miembro renueva antes de vencer, los nuevos días comienzan al finalizar el periodo actual.</p>
            </div>
            <button
              onClick={() => handleToggle('renewalConserveDays')}
              className={`w-12 h-6 rounded-full transition-all duration-200 ${settings.renewalConserveDays ? 'bg-[#00ff88]' : 'bg-[#2a2a2a]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-all duration-200 ${settings.renewalConserveDays ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <p className="text-gray-400 text-sm">Cuando una suscripción vencida se renueva, el nuevo periodo comienza desde la fecha de renovación.</p>
          </div>
        </div>
      </div>

      {/* Estados */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Estados de suscripción</h3>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full font-medium">Activa</span>
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full font-medium">Por vencer</span>
          <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs rounded-full font-medium">Vencida</span>
          <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-full font-medium">Sin suscripción</span>
          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">Bloqueada</span>
        </div>
      </div>
    </div>
  );

  const renderAccesoTab = () => (
    <div className="space-y-6">
      {/* QR */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Código QR de miembros</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">QR permanente</p>
            <p className="text-gray-400 text-sm">Cada miembro utiliza el mismo código durante toda su permanencia en el gimnasio.</p>
          </div>
          <button
            onClick={() => handleToggle('qrPermanent')}
            className={`w-12 h-6 rounded-full transition-all duration-200 ${settings.qrPermanent ? 'bg-[#00ff88]' : 'bg-[#2a2a2a]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-all duration-200 ${settings.qrPermanent ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Entrada y salida */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Entrada y salida automática</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Detectar automáticamente entrada y salida</p>
            <p className="text-gray-400 text-sm">Si el miembro está fuera, el siguiente escaneo registra entrada. Si está dentro, registra salida.</p>
          </div>
          <button
            onClick={() => handleToggle('autoEntryExit')}
            className={`w-12 h-6 rounded-full transition-all duration-200 ${settings.autoEntryExit ? 'bg-[#00ff88]' : 'bg-[#2a2a2a]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-all duration-200 ${settings.autoEntryExit ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Protección contra doble escaneo */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Protección contra doble escaneo</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Evitar doble lectura accidental</p>
              <p className="text-gray-400 text-sm">Evita registrar una salida accidental inmediatamente después de una entrada.</p>
            </div>
            <button
              onClick={() => handleToggle('doubleScanProtection')}
              className={`w-12 h-6 rounded-full transition-all duration-200 ${settings.doubleScanProtection ? 'bg-[#00ff88]' : 'bg-[#2a2a2a]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-all duration-200 ${settings.doubleScanProtection ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div>
            <label className="text-white text-sm font-medium mb-1 block">Tiempo mínimo entre escaneos</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="scanInterval"
                value={settings.scanInterval}
                onChange={handleInputChange}
                className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
              <span className="text-gray-400">segundos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiempo de resultado */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Tiempo de resultado</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="resultDisplayTime"
            value={settings.resultDisplayTime}
            onChange={handleInputChange}
            className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
          />
          <span className="text-gray-400">segundos</span>
        </div>
        <p className="text-gray-500 text-xs mt-1">Después, la terminal volverá automáticamente al escáner.</p>
      </div>

      {/* Foto del miembro */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Mostrar fotografía después del escaneo</p>
            <p className="text-gray-400 text-sm">Ayuda al personal y al cliente a confirmar la identidad.</p>
          </div>
          <button
            onClick={() => handleToggle('showPhotoAfterScan')}
            className={`w-12 h-6 rounded-full transition-all duration-200 ${settings.showPhotoAfterScan ? 'bg-[#00ff88]' : 'bg-[#2a2a2a]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-all duration-200 ${settings.showPhotoAfterScan ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Información pública */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Información visible en la terminal</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-gray-300 text-sm">
            <input type="checkbox" checked className="text-[#00ff88]" />
            Nombre
          </label>
          <label className="flex items-center gap-2 text-gray-300 text-sm">
            <input type="checkbox" checked className="text-[#00ff88]" />
            Fotografía
          </label>
          <label className="flex items-center gap-2 text-gray-300 text-sm">
            <input type="checkbox" checked className="text-[#00ff88]" />
            Estado del acceso
          </label>
          <label className="flex items-center gap-2 text-gray-300 text-sm">
            <input type="checkbox" checked className="text-[#00ff88]" />
            Hora de entrada/salida
          </label>
          <label className="flex items-center gap-2 text-gray-300 text-sm">
            <input type="checkbox" checked className="text-[#00ff88]" />
            Aviso de vencimiento
          </label>
        </div>
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-500 text-xs">⚠️ Protección de privacidad</p>
          <p className="text-gray-400 text-xs">No se mostrarán teléfono, correo, historial, pagos ni notas administrativas.</p>
        </div>
      </div>

      {/* Sonidos y cámara */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Sonidos</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Sonido de acceso permitido</span>
              <button className="w-10 h-5 rounded-full bg-[#00ff88]">
                <div className="w-4 h-4 rounded-full bg-white translate-x-5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Sonido de acceso no disponible</span>
              <button className="w-10 h-5 rounded-full bg-[#00ff88]">
                <div className="w-4 h-4 rounded-full bg-white translate-x-5" />
              </button>
            </div>
            <div>
              <label className="text-gray-300 text-sm block mb-1">Volumen</label>
              <input type="range" min="0" max="100" value="70" className="w-full accent-[#00ff88]" />
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Cámara</h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-300 text-sm block mb-1">Dispositivo de cámara</label>
              <select className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors">
                <option>Cámara predeterminada</option>
                <option>Cámara trasera</option>
                <option>Cámara frontal</option>
              </select>
            </div>
            <button className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2">
              <Camera size={16} />
              Probar cámara
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
              <span className="text-[#00ff88] text-sm">Disponible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview del terminal */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Vista previa del control de acceso</h3>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 max-w-sm mx-auto">
          <div className="text-center">
            <p className="text-white font-bold text-sm">GYM CONTROL</p>
            <p className="text-gray-400 text-xs">Bienvenido</p>
            <p className="text-gray-500 text-xs">Escanea tu código QR</p>
            <div className="w-16 h-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg mx-auto mt-2 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-[#00ff88] rounded" />
            </div>
          </div>
        </div>
        <button className="mt-4 text-[#00ff88] text-sm hover:underline">Abrir vista previa</button>
      </div>
    </div>
  );

  const renderHorariosTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Horarios */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Horario del gimnasio</h3>
        <div className="space-y-4">
          {[
            { key: 'monday', label: 'Lunes' },
            { key: 'tuesday', label: 'Martes' },
            { key: 'wednesday', label: 'Miércoles' },
            { key: 'thursday', label: 'Jueves' },
            { key: 'friday', label: 'Viernes' },
            { key: 'saturday', label: 'Sábado' },
            { key: 'sunday', label: 'Domingo' },
          ].map((day) => {
            const dayData = settings.hours[day.key];
            return (
              <div key={day.key} className="flex items-center gap-3 p-2 bg-[#1a1a1a] rounded-lg">
                <button
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      hours: {
                        ...prev.hours,
                        [day.key]: { ...prev.hours[day.key], open: !prev.hours[day.key].open }
                      }
                    }));
                    setShowSaveBar(true);
                  }}
                  className={`w-8 h-4 rounded-full transition-all duration-200 ${dayData.open ? 'bg-[#00ff88]' : 'bg-[#2a2a2a]'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-all duration-200 ${dayData.open ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-white text-sm w-20">{day.label}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={dayData.start}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        hours: {
                          ...prev.hours,
                          [day.key]: { ...prev.hours[day.key], start: e.target.value }
                        }
                      }));
                      setShowSaveBar(true);
                    }}
                    className="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1 text-white text-sm focus:border-[#00ff88] focus:outline-none transition-colors"
                  />
                  <span className="text-gray-500 text-xs">—</span>
                  <input
                    type="time"
                    value={dayData.end}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        hours: {
                          ...prev.hours,
                          [day.key]: { ...prev.hours[day.key], end: e.target.value }
                        }
                      }));
                      setShowSaveBar(true);
                    }}
                    className="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1 text-white text-sm focus:border-[#00ff88] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Capacidad */}
      <div className="space-y-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Capacidad</h3>
          <div>
            <label className="text-white text-sm font-medium mb-1 block">Capacidad máxima</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="capacity"
                value={settings.capacity}
                onChange={handleInputChange}
                className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
              <span className="text-gray-400">personas</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">Utilizada en indicadores de ocupación y reportes.</p>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Alerta de capacidad</h3>
          <div className="space-y-3">
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Avisar al llegar a</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="capacityWarning"
                  value={settings.capacityWarning}
                  onChange={handleInputChange}
                  className="w-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                />
                <span className="text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Estado crítico</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="capacityCritical"
                  value={settings.capacityCritical}
                  onChange={handleInputChange}
                  className="w-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                />
                <span className="text-gray-400">%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-[#1a1a1a] rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">0 / {settings.capacity || 80}</span>
              <span className="text-gray-400">0% ocupado</span>
            </div>
            <div className="mt-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-[#00ff88] rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecibosTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Moneda</h3>
          <select className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors">
            <option>MXN — Peso mexicano</option>
            <option>USD — Dólar americano</option>
            <option>EUR — Euro</option>
          </select>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Métodos de pago</h3>
          <div className="space-y-2">
            {['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'].map((method) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{method}</span>
                <button className="w-10 h-5 rounded-full bg-[#00ff88]">
                  <div className="w-4 h-4 rounded-full bg-white translate-x-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Información para recibos</h3>
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Nombre comercial</label>
              <input
                type="text"
                name="receiptName"
                value={settings.gymName}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Teléfono</label>
              <input
                type="text"
                value={settings.phone}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Dirección</label>
              <input
                type="text"
                value={settings.address}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Mensaje final</label>
              <input
                type="text"
                name="receiptMessage"
                value={settings.receiptMessage}
                onChange={handleInputChange}
                placeholder="Gracias por entrenar con nosotros."
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Folios</h3>
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Prefijo de pagos</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="receiptPrefix"
                  value={settings.receiptPrefix}
                  onChange={handleInputChange}
                  className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                />
                <span className="text-gray-400 text-sm">Ej: PAY-00873</span>
              </div>
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-500 text-xs">⚠️ No cambiar si ya existen registros</p>
              </div>
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-1 block">Prefijo de miembros</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="memberPrefix"
                  value={settings.memberPrefix}
                  onChange={handleInputChange}
                  className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                />
                <span className="text-gray-400 text-sm">Ej: GYM-00301</span>
              </div>
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-500 text-xs">⚠️ No cambiar si ya existen registros</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Preview del recibo</h3>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div className="text-center">
              <p className="text-white font-bold text-sm">{settings.shortName || 'GYM CONTROL'}</p>
              <p className="text-gray-400 text-xs">PAY-00000</p>
              <div className="border-t border-[#2a2a2a] my-2" />
              <p className="text-white text-sm">Carlos Hernández</p>
              <p className="text-gray-400 text-xs">Renovación mensual</p>
              <p className="text-[#00ff88] font-bold">$0.00 MXN</p>
              <div className="border-t border-[#2a2a2a] my-2" />
              <p className="text-gray-500 text-xs">Pagado</p>
            </div>
          </div>
          <button className="mt-3 text-[#00ff88] text-sm hover:underline">Vista previa completa</button>
        </div>
      </div>
    </div>
  );

  const renderUsuariosTab = () => (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SettingsStatCard title="Usuarios" value={users.length} icon={Users} color="gray" />
        <SettingsStatCard title="Administradores" value={0} icon={UserCog} color="green" />
        <SettingsStatCard title="Recepcionistas" value={0} icon={UserCheck} color="blue" />
        <SettingsStatCard title="Activos ahora" value={0} icon={CircleDot} color="green" />
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-10 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {userFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setUserFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                userFilter === filter ? 'bg-[#00ff88] text-black font-bold' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
              }`}
            >
              {filter}
            </button>
          ))}
          <button
            onClick={() => setShowUserDrawer(true)}
            className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Agregar usuario
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {isEmpty ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[#1a1a1a] rounded-full">
                <Users size={48} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">No hay usuarios registrados</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Agrega tu primer usuario para comenzar a gestionar el sistema.
            </p>
            <button
              onClick={() => setShowUserDrawer(true)}
              className="px-6 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              Agregar usuario
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Usuario</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Rol</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Correo</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Último acceso</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Estado</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {/* Los datos se mostrarán aquí cuando existan */}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actividad administrativa */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Actividad administrativa reciente</h3>
          <button className="text-[#00ff88] text-sm hover:underline">Ver actividad</button>
        </div>
        <div className="text-center py-8">
          <ClockIcon size={36} className="text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No hay actividad reciente</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Configuración" />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <Header />
        
        <main className="p-6 space-y-6 max-w-full">
          {/* Título */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div>
              <h1 className="text-2xl font-bold text-white">Configuración</h1>
              <p className="text-gray-400">Administra la información, reglas y usuarios del sistema.</p>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Guardar cambios
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#1a1a1a] overflow-x-auto">
            <div className="flex flex-nowrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'text-[#00ff88] border-[#00ff88]' 
                      : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido de tabs */}
          <div className="w-full">
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'suscripciones' && renderSuscripcionesTab()}
            {activeTab === 'acceso' && renderAccesoTab()}
            {activeTab === 'horarios' && renderHorariosTab()}
            {activeTab === 'recibos' && renderRecibosTab()}
            {activeTab === 'usuarios' && renderUsuariosTab()}
          </div>
        </main>
      </div>

      {/* Barra sticky de cambios sin guardar */}
      {showSaveBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1a1a1a] p-4 z-40 lg:ml-72">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-yellow-500" />
              <span className="text-white font-medium">Tienes cambios sin guardar</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveBar(false)}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-red-500 hover:text-red-400 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer - Agregar usuario */}
      {showUserDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowUserDrawer(false)} />
          <div className="relative w-full max-w-lg h-full bg-[#111111] border-l border-[#1a1a1a] shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Nuevo usuario</h2>
                  <p className="text-gray-400 text-sm">Agrega un nuevo usuario al sistema.</p>
                </div>
                <button
                  onClick={() => setShowUserDrawer(false)}
                  className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-1 block">Nombre</label>
                  <input
                    type="text"
                    placeholder="Ej. María López"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-1 block">Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="maria@gymcontrol.com"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-1 block">Contraseña temporal</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="••••••••••"
                      className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                    />
                    <button className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors">
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Rol</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-4 bg-[#1a1a1a] border-2 border-[#00ff88] rounded-xl text-white hover:border-[#00ff88] transition-colors">
                      <div className="text-center">
                        <p className="font-bold">Administrador</p>
                        <p className="text-gray-400 text-xs mt-1">Acceso completo</p>
                      </div>
                    </button>
                    <button className="p-4 bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88]/50 transition-colors">
                      <div className="text-center">
                        <p className="font-bold">Recepción</p>
                        <p className="text-gray-400 text-xs mt-1">Acceso limitado</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <p className="text-gray-400 text-sm">
                    <span className="text-[#00ff88] font-medium">Administrador:</span> Acceso completo al sistema, configuración, usuarios, pagos y reportes.
                  </p>
                </div>

                <button className="w-full py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors">
                  Crear usuario
                </button>
              </div>
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
              <h2 className="text-white text-xl font-bold mb-2">Confirmar cambio</h2>
              <p className="text-gray-400 text-sm mb-6">
                Esta configuración afectará futuros registros. Los registros históricos no se modificarán.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors"
                >
                  Guardar cambios
                </button>
              </div>
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
              <p className="text-white font-bold">Configuración actualizada</p>
              <p className="text-gray-400 text-sm">Los cambios fueron guardados correctamente.</p>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes slide-in-right {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;