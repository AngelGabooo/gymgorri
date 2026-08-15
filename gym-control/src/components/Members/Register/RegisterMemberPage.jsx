// src/components/Members/Register/RegisterMemberPage.jsx

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  User,
  Mail,
  Calendar,
  Upload,
  Camera,
  Check,
  AlertCircle,
  ChevronRight,
  QrCode,
  CreditCard,
  UserPlus,
  X,
  GraduationCap,
  HeartHandshake,
  Building2,
  Gift,
  BadgePercent
} from 'lucide-react';

import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';

import {
  getNextMemberId
} from '../../../utils/memberId';

import {
  findBlacklistMatches
} from '../../../services/blacklistService';

import {
  getCurrentSession
} from '../../../services/authService';


const RegisterMemberPage = () => {

  const navigate = useNavigate();


  // ======================================================
  // ID DEL MIEMBRO
  // ======================================================

  // El ID solamente se consulta.
  // Todavía NO se confirma hasta terminar todo el registro.
  const [memberId] = useState(
    () => getNextMemberId()
  );


  // ======================================================
  // FORMULARIO
  // ======================================================

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


  // ======================================================
  // FECHA DE REGISTRO
  // ======================================================

  const [registrationDateMode, setRegistrationDateMode] =
    useState('automatic');

  const [manualRegistrationDate, setManualRegistrationDate] =
    useState('');


  const getTodayInputValue = () => {

    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        '0'
      );

    return `${year}-${month}-${day}`;

  };


  const formatRegistrationDate = (
    value
  ) => {

    if (!value) {
      return 'Selecciona una fecha';
    }

    const date =
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(
            `${value}T12:00:00`
          )
        : new Date(
            value
          );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 'Fecha no válida';
    }

    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ];

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );

    const month =
      months[
        date.getMonth()
      ];

    const year =
      date.getFullYear();

    return `${day} ${month} ${year}`;

  };


  const selectedRegistrationDate =
    registrationDateMode === 'manual'
      ? manualRegistrationDate
      : getTodayInputValue();


  const registrationDate =
    formatRegistrationDate(
      selectedRegistrationDate
    );


  const getRegistrationDateISO =
    () => {

      if (
        registrationDateMode ===
        'automatic'
      ) {

        return new Date()
          .toISOString();

      }


      if (
        !manualRegistrationDate
      ) {

        return null;

      }


      const manualDate =
        new Date(
          `${manualRegistrationDate}T12:00:00`
        );


      if (
        Number.isNaN(
          manualDate.getTime()
        )
      ) {

        return null;

      }


      return manualDate
        .toISOString();

    };

  const [
    showDiscardModal,
    setShowDiscardModal
  ] = useState(false);


  // ======================================================
  // TIPO DE REGISTRO / PROMOCIÓN
  // ======================================================

  const [registrationType, setRegistrationType] = useState('regular');

  const [promotionReference, setPromotionReference] = useState('');


  const [blacklistMatches, setBlacklistMatches] = useState([]);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const blacklistBypassRef = useRef(false);

  const currentSession = getCurrentSession();
  const canAuthorizeBlacklist =
    currentSession?.role === 'owner' ||
    currentSession?.role === 'admin';

  const registrationOptions = [
    {
      id: 'regular',
      label: 'Regular',
      description: 'Registro normal sin promoción.',
      icon: User
    },
    {
      id: 'student',
      label: 'Estudiante',
      description: 'Aplicará automáticamente el beneficio para estudiantes.',
      icon: GraduationCap
    },
    {
      id: 'couple',
      label: 'Pareja',
      description: 'Registra dos personas al mismo tiempo y las vincula.',
      icon: HeartHandshake
    },
    {
      id: 'agreement',
      label: 'Convenio',
      description: 'Beneficio para empresa, escuela o institución.',
      icon: Building2
    },
    {
      id: 'courtesy',
      label: 'Cortesía',
      description: 'Suscripción autorizada sin cobro.',
      icon: Gift
    }
  ];




  // ======================================================
  // FOTOS DE PRUEBA
  // ======================================================

  const profileImages = [
    '/img/profile1.png',
    '/img/profile2.png',
    '/img/profile3.png',
    '/img/profile4.png',
    '/img/profile5.png',
  ];


  // ======================================================
  // CAMBIOS DE INPUTS
  // ======================================================

  const handleInputChange = (
    e
  ) => {

    const {
      name,
      value
    } = e.target;


    setFormData(
      prev => ({
        ...prev,
        [name]: value
      })
    );


    // Limpiar el error del campo
    // cuando el usuario comience a corregirlo.
    if (
      errors[
        name
      ]
    ) {

      setErrors(
        prev => ({
          ...prev,
          [name]: ''
        })
      );

    }

  };


  // ======================================================
  // FOTO ALEATORIA
  // ======================================================

  const handleRandomPhoto = () => {

    const randomIndex =
      Math.floor(
        Math.random() *
        profileImages.length
      );


    const selectedImage =
      profileImages[
        randomIndex
      ];


    setFormData(
      prev => ({
        ...prev,

        profilePhotoUrl:
          selectedImage,

        profilePhoto:
          null
      })
    );

  };


  // ======================================================
  // SUBIR FOTO
  // ======================================================

  const handleFileUpload = (
    e
  ) => {

    const file =
      e.target.files?.[0];


    if (
      !file
    ) {

      return;

    }


    // Máximo 5 MB
    const maxSize =
      5 *
      1024 *
      1024;


    if (
      file.size >
      maxSize
    ) {

      alert(
        'La imagen no puede superar los 5 MB.'
      );

      e.target.value =
        '';

      return;

    }


    const reader =
      new FileReader();


    reader.onload = (
      event
    ) => {

      setFormData(
        prev => ({
          ...prev,

          profilePhotoUrl:
            event.target.result,

          profilePhoto:
            file
        })
      );

    };


    reader.readAsDataURL(
      file
    );

  };


  // ======================================================
  // ELIMINAR FOTO
  // ======================================================

  const handleRemovePhoto =
    () => {

      setFormData(
        prev => ({
          ...prev,

          profilePhotoUrl:
            null,

          profilePhoto:
            null
        })
      );

    };


  // ======================================================
  // VALIDAR TELÉFONO
  // ======================================================

  const isValidPhone = (
    value
  ) => {

    const digits =
      String(
        value || ''
      ).replace(
        /\D/g,
        ''
      );


    return (
      digits.length >= 10
    );

  };


  // ======================================================
  // CONTINUAR AL PASO 2
  // ======================================================

  const handleSubmit = (
    e
  ) => {

    e?.preventDefault();


    const newErrors = {};


    // La promoción de pareja utiliza un flujo especial
    // porque deben registrarse dos personas en la misma operación.
    if (registrationType === 'couple') {
      navigate('/members/register/couple');
      return;
    }


    // ======================================================
    // VALIDACIONES
    // ======================================================

    if (
      !formData
        .firstName
        .trim()
    ) {

      newErrors.firstName =
        'El nombre es obligatorio';

    }


    if (
      !formData
        .lastName
        .trim()
    ) {

      newErrors.lastName =
        'Los apellidos son obligatorios';

    }


    if (
      !formData
        .phone
        .trim() ||
      !isValidPhone(
        formData.phone
      )
    ) {

      newErrors.phone =
        'Ingresa un número de teléfono válido';

    }


    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {

      newErrors.email =
        'Ingresa un correo electrónico válido';

    }


    if (
      (registrationType === 'agreement' || registrationType === 'courtesy') &&
      !promotionReference.trim()
    ) {

      newErrors.promotionReference =
        registrationType === 'courtesy'
          ? 'Escribe el motivo o autorización de la cortesía'
          : 'Escribe el nombre de la empresa, escuela o institución';

    }


    // ======================================================
    // VALIDAR FECHA DE REGISTRO MANUAL
    // ======================================================

    if (
      registrationDateMode ===
      'manual'
    ) {

      if (
        !manualRegistrationDate
      ) {

        newErrors.registrationDate =
          'Selecciona la fecha de registro del miembro';

      } else {

        const selectedDate =
          new Date(
            `${manualRegistrationDate}T12:00:00`
          );

        const today =
          new Date(
            `${getTodayInputValue()}T23:59:59`
          );


        if (
          Number.isNaN(
            selectedDate.getTime()
          )
        ) {

          newErrors.registrationDate =
            'La fecha seleccionada no es válida';

        } else if (
          selectedDate >
          today
        ) {

          newErrors.registrationDate =
            'La fecha de registro no puede ser futura';

        }

      }

    }


    if (
      Object.keys(
        newErrors
      ).length >
      0
    ) {

      setErrors(
        newErrors
      );

      return;

    }


    const matches =
      findBlacklistMatches({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email
      });


    if (
      matches.length > 0 &&
      !blacklistBypassRef.current
    ) {

      setBlacklistMatches(matches);
      setShowBlacklistModal(true);
      return;

    }


    blacklistBypassRef.current = false;
    setErrors({});


    // ======================================================
    // PREPARAR DATOS COMPLETOS
    // ======================================================
    //
    // Quitamos el objeto File porque localStorage
    // no puede guardar correctamente un File.
    //
    // Solamente conservamos profilePhotoUrl
    // convertido en profilePhoto.
    //
    // ======================================================

    const {
      profilePhoto,
      profilePhotoUrl,
      ...personalData
    } = formData;


    const now =
      new Date()
        .toISOString();


    const resolvedRegistrationDate =
      getRegistrationDateISO();


    const memberData = {

      ...personalData,


      // ====================================================
      // IDENTIFICACIÓN
      // ====================================================

      id:
        memberId,


      // ====================================================
      // FOTO
      // ====================================================

      profilePhoto:
        profilePhotoUrl ||
        null,


      // ====================================================
      // FECHAS
      // ====================================================

      // Fecha histórica del miembro.
      // Puede ser la fecha actual o una fecha anterior
      // seleccionada manualmente por el encargado.
      registrationDate:
        resolvedRegistrationDate,

      registrationDateMode,

      // createdAt SIEMPRE conserva cuándo fue creado
      // realmente el registro dentro del sistema.
      createdAt:
        now,

      updatedAt:
        now,


      // ====================================================
      // TIPO DE REGISTRO / PROMOCIÓN
      // ====================================================

      registrationCategory:
        registrationType,

      promotionProfile:
        registrationType === 'regular'
          ? null
          : {
              id: registrationType,
              label:
                registrationOptions.find(option => option.id === registrationType)?.label ||
                registrationType,
              reference:
                promotionReference.trim()
            },


      // ====================================================
      // ESTADO INICIAL
      // ====================================================

      status:
        'pending_subscription',

      accessBlocked:
        false,

    };


    console.log(
      '👤 Datos completos Paso 1:',
      memberData
    );


    // ======================================================
    // PASAR AL PASO 2
    // ======================================================

    navigate(
      '/members/register/subscription',
      {

        state: {

          memberData,

          promotionContext:
            registrationType === 'regular'
              ? null
              : {
                  id: registrationType,
                  label:
                    registrationOptions.find(option => option.id === registrationType)?.label ||
                    registrationType,
                  reference:
                    promotionReference.trim(),
                  locked: true
                }

        }

      }
    );

  };


  // ======================================================
  // CANCELAR
  // ======================================================

  const handleCancel =
    () => {

      const hasData =
        Object.values(
          formData
        ).some(
          value =>
            value !== '' &&
            value !== null
        ) ||
        registrationDateMode ===
          'manual' ||
        Boolean(
          manualRegistrationDate
        );


      if (
        hasData
      ) {

        setShowDiscardModal(
          true
        );

      } else {

        navigate(
          '/members'
        );

      }

    };


  // ======================================================
  // PASOS
  // ======================================================

  const steps = [

    {
      number: 1,
      label:
        'Datos personales',
      icon:
        User,
      completed:
        false,
      current:
        true
    },

    {
      number: 2,
      label:
        'Suscripción',
      icon:
        CreditCard,
      completed:
        false
    },

    {
      number: 3,
      label:
        'Código QR',
      icon:
        QrCode,
      completed:
        false
    },

  ];


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Miembros"
      />


      <div className="flex-1 lg:ml-0">

        <Header />


        <main className="p-6">


          {/* ================================================= */}
          {/* BREADCRUMB / HEADER */}
          {/* ================================================= */}

          <div className="mb-6">

            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/members'
                  )
                }
                className="hover:text-white transition-colors"
              >
                Miembros
              </button>


              <span>
                /
              </span>


              <span className="text-white">
                Registrar miembro
              </span>

            </div>


            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <h1 className="text-2xl font-bold text-white">
                  Registrar nuevo miembro
                </h1>


                <p className="text-gray-400">
                  Agrega una nueva persona al gimnasio y prepara su acceso.
                </p>

              </div>


              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white transition-colors"
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  onClick={
                    handleSubmit
                  }
                  className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
                >

                  <Check
                    size={18}
                  />

                  Guardar y continuar

                </button>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* STEPPER */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mb-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                {
                  steps.map(
                    (
                      step,
                      index
                    ) => {

                      const Icon =
                        step.icon;


                      return (

                        <React.Fragment
                          key={
                            step.number
                          }
                        >

                          <div className="flex items-center gap-2">

                            <div
                              className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold

                                ${
                                  step.current
                                    ? 'bg-[#00ff88] text-black ring-2 ring-[#00ff88] ring-offset-2 ring-offset-[#111111]'
                                    : step.completed
                                      ? 'bg-[#00ff88] text-black'
                                      : 'bg-[#1a1a1a] text-gray-500'
                                }
                              `}
                            >

                              {
                                step.completed
                                  ? (
                                    <Check
                                      size={
                                        16
                                      }
                                    />
                                  )
                                  : step.number
                              }

                            </div>


                            <span
                              className={`
                                text-sm font-medium

                                ${
                                  step.current
                                    ? 'text-white'
                                    : step.completed
                                      ? 'text-[#00ff88]'
                                      : 'text-gray-500'
                                }
                              `}
                            >
                              {
                                step.label
                              }
                            </span>

                          </div>


                          {
                            index <
                              steps.length -
                                1 &&
                            (

                              <div className="hidden sm:block w-12 h-px bg-[#2a2a2a]" />

                            )
                          }

                        </React.Fragment>

                      );

                    }
                  )
                }

              </div>


              <p className="text-gray-500 text-xs">
                Paso 1 de 3 - Datos personales
              </p>

            </div>


            <p className="text-gray-500 text-sm mt-3">
              Primero registra los datos del miembro. Después podrás activar su suscripción y generar sus métodos de acceso.
            </p>

          </div>


          {/* ================================================= */}
          {/* TIPO DE REGISTRO */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mb-6">

            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center shrink-0">
                <BadgePercent size={19} className="text-[#00ff88]" />
              </div>

              <div>
                <h3 className="text-white font-bold">
                  Tipo de registro
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Selecciona si el miembro entra como cliente regular o mediante una promoción.
                </p>
              </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              {registrationOptions.map(option => {
                const Icon = option.icon;
                const selected = registrationType === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setRegistrationType(option.id);
                      setPromotionReference('');
                      setErrors(previous => ({
                        ...previous,
                        promotionReference: ''
                      }));
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? 'border-[#00ff88] bg-[#00ff88]/10'
                        : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? 'bg-[#00ff88] text-black' : 'bg-[#111111] text-gray-500'}`}>
                        <Icon size={18} />
                      </div>

                      {selected && <Check size={17} className="text-[#00ff88]" />}
                    </div>

                    <p className="text-white font-bold text-sm">
                      {option.label}
                    </p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>


            {registrationType === 'couple' && (
              <div className="mt-4 p-4 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">
                    La promoción de pareja registra a dos personas juntas
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Cada persona tendrá su propio ID, QR, PIN, biometría, asistencias e historial.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/members/register/couple')}
                  className="px-4 py-2 rounded-xl bg-[#00ff88] text-black font-bold whitespace-nowrap flex items-center gap-2"
                >
                  Registrar las 2 personas
                  <ChevronRight size={17} />
                </button>
              </div>
            )}


            {(registrationType === 'agreement' || registrationType === 'courtesy') && (
              <div className="mt-4">
                <label className="text-white text-sm font-medium mb-1 block">
                  {registrationType === 'courtesy'
                    ? 'Motivo / autorización de cortesía'
                    : 'Empresa, escuela o institución del convenio'}
                  <span className="text-red-400"> *</span>
                </label>

                <input
                  type="text"
                  value={promotionReference}
                  onChange={event => {
                    setPromotionReference(event.target.value);
                    setErrors(previous => ({
                      ...previous,
                      promotionReference: ''
                    }));
                  }}
                  placeholder={
                    registrationType === 'courtesy'
                      ? 'Ej. Autorizada por administración'
                      : 'Ej. UPChiapas / Empresa ABC'
                  }
                  className={`w-full bg-[#1a1a1a] border ${errors.promotionReference ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none`}
                />

                {errors.promotionReference && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.promotionReference}
                  </p>
                )}
              </div>
            )}

          </div>


          {/* ================================================= */}
          {/* CONTENIDO */}
          {/* ================================================= */}

          <div className={`${registrationType === 'couple' ? 'hidden' : 'grid'} grid-cols-1 xl:grid-cols-3 gap-6`}> 


            {/* ================================================= */}
            {/* FORMULARIO */}
            {/* ================================================= */}

            <div className="xl:col-span-2 space-y-6">

              <form
                onSubmit={
                  handleSubmit
                }
              >


                {/* ================================================= */}
                {/* FOTO */}
                {/* ================================================= */}

                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                  <h3 className="text-white font-bold mb-1">
                    Foto del miembro
                  </h3>


                  <p className="text-gray-400 text-sm mb-4">
                    Esta fotografía ayudará a identificar a la persona durante el control de acceso.
                  </p>


                  <div className="flex flex-col sm:flex-row items-center gap-6">

                    <div className="w-32 h-32 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">

                      {
                        formData.profilePhotoUrl
                          ? (

                            <img
                              src={
                                formData.profilePhotoUrl
                              }
                              alt="Foto de perfil"
                              className="w-full h-full object-cover"
                            />

                          )
                          : (

                            <User
                              size={48}
                              className="text-gray-500"
                            />

                          )
                      }

                    </div>


                    <div className="flex-1">

                      <div className="flex flex-wrap gap-2">

                        <input
                          type="file"
                          id="file-upload"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={
                            handleFileUpload
                          }
                          className="hidden"
                        />


                        <label
                          htmlFor="file-upload"
                          className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2 cursor-pointer"
                        >

                          <Upload
                            size={16}
                          />

                          Subir fotografía

                        </label>


                        <button
                          type="button"
                          onClick={
                            handleRandomPhoto
                          }
                          className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
                        >

                          <Camera
                            size={16}
                          />

                          Usar foto aleatoria

                        </button>


                        {
                          formData.profilePhotoUrl &&
                          (

                            <button
                              type="button"
                              onClick={
                                handleRemovePhoto
                              }
                              className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                            >

                              <X
                                size={16}
                              />

                              Eliminar

                            </button>

                          )
                        }

                      </div>


                      <p className="text-gray-500 text-xs mt-2">
                        JPG, PNG o WEBP · Máximo 5 MB
                      </p>

                    </div>

                  </div>

                </div>


                {/* ================================================= */}
                {/* INFORMACIÓN PERSONAL */}
                {/* ================================================= */}

                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mt-6">

                  <h3 className="text-white font-bold mb-4">
                    Información personal
                  </h3>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">

                        Nombre

                        <span className="text-red-400">
                          *
                        </span>

                      </label>


                      <input
                        type="text"
                        name="firstName"
                        placeholder="Ej. Carlos"
                        value={
                          formData.firstName
                        }
                        onChange={
                          handleInputChange
                        }
                        className={`
                          w-full bg-[#1a1a1a] border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors

                          ${
                            errors.firstName
                              ? 'border-red-500'
                              : 'border-[#2a2a2a]'
                          }
                        `}
                      />


                      {
                        errors.firstName &&
                        (

                          <p className="text-red-400 text-xs mt-1">
                            {
                              errors.firstName
                            }
                          </p>

                        )
                      }

                    </div>


                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">

                        Apellidos

                        <span className="text-red-400">
                          *
                        </span>

                      </label>


                      <input
                        type="text"
                        name="lastName"
                        placeholder="Ej. Hernández López"
                        value={
                          formData.lastName
                        }
                        onChange={
                          handleInputChange
                        }
                        className={`
                          w-full bg-[#1a1a1a] border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors

                          ${
                            errors.lastName
                              ? 'border-red-500'
                              : 'border-[#2a2a2a]'
                          }
                        `}
                      />


                      {
                        errors.lastName &&
                        (

                          <p className="text-red-400 text-xs mt-1">
                            {
                              errors.lastName
                            }
                          </p>

                        )
                      }

                    </div>

                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">
                        Fecha de nacimiento
                      </label>


                      <div className="relative">

                        <Calendar
                          size={18}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                        />


                        <input
                          type="date"
                          name="birthDate"
                          value={
                            formData.birthDate
                          }
                          onChange={
                            handleInputChange
                          }
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
                        value={
                          formData.gender
                        }
                        onChange={
                          handleInputChange
                        }
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        <option value="male">
                          Masculino
                        </option>

                        <option value="female">
                          Femenino
                        </option>

                        <option value="other">
                          Otro
                        </option>

                        <option value="prefer-not">
                          Prefiero no especificar
                        </option>

                      </select>

                    </div>

                  </div>

                </div>


                {/* ================================================= */}
                {/* CONTACTO */}
                {/* ================================================= */}

                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mt-6">

                  <h3 className="text-white font-bold mb-4">
                    Información de contacto
                  </h3>


                  <div className="grid grid-cols-1 gap-4">

                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">

                        Teléfono

                        <span className="text-red-400">
                          *
                        </span>

                      </label>


                      <div className="flex gap-2">

                        <div className="w-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-center">
                          +52
                        </div>


                        <input
                          type="tel"
                          name="phone"
                          placeholder="961 123 4567"
                          value={
                            formData.phone
                          }
                          onChange={
                            handleInputChange
                          }
                          className={`
                            flex-1 bg-[#1a1a1a] border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors

                            ${
                              errors.phone
                                ? 'border-red-500'
                                : 'border-[#2a2a2a]'
                            }
                          `}
                        />

                      </div>


                      {
                        errors.phone &&
                        (

                          <p className="text-red-400 text-xs mt-1">
                            {
                              errors.phone
                            }
                          </p>

                        )
                      }

                    </div>


                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">
                        Correo electrónico
                      </label>


                      <div className="relative">

                        <Mail
                          size={18}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                        />


                        <input
                          type="email"
                          name="email"
                          placeholder="correo@ejemplo.com"
                          value={
                            formData.email
                          }
                          onChange={
                            handleInputChange
                          }
                          className={`
                            w-full bg-[#1a1a1a] border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors

                            ${
                              errors.email
                                ? 'border-red-500'
                                : 'border-[#2a2a2a]'
                            }
                          `}
                        />

                      </div>


                      {
                        errors.email &&
                        (

                          <p className="text-red-400 text-xs mt-1">
                            {
                              errors.email
                            }
                          </p>

                        )
                      }


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
                        value={
                          formData.emergencyContact
                        }
                        onChange={
                          handleInputChange
                        }
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                      />

                    </div>


                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">
                        Teléfono de emergencia
                      </label>


                      <input
                        type="tel"
                        name="emergencyPhone"
                        placeholder="961 000 0000"
                        value={
                          formData.emergencyPhone
                        }
                        onChange={
                          handleInputChange
                        }
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                      />

                    </div>

                  </div>


                  <p className="text-gray-500 text-xs mt-2">
                    Opcional
                  </p>

                </div>


                {/* ================================================= */}
                {/* INFORMACIÓN DEL MIEMBRO */}
                {/* ================================================= */}

                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mt-6">

                  <h3 className="text-white font-bold mb-4">
                    Información del miembro
                  </h3>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">
                        ID del miembro
                      </label>


                      <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5">

                        <span className="text-[#00ff88] font-mono">
                          {
                            memberId
                          }
                        </span>


                        <span className="text-gray-500 text-xs ml-auto">
                          Generado automáticamente
                        </span>

                      </div>

                    </div>


                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">
                        Fecha de registro
                      </label>


                      <div className="grid grid-cols-2 gap-2 mb-3">

                        <button
                          type="button"
                          onClick={() => {

                            setRegistrationDateMode(
                              'automatic'
                            );

                            setManualRegistrationDate(
                              ''
                            );

                            setErrors(
                              previous => ({
                                ...previous,
                                registrationDate:
                                  ''
                              })
                            );

                          }}
                          className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                            registrationDateMode === 'automatic'
                              ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]'
                              : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#00ff88]/40'
                          }`}
                        >
                          Automática
                        </button>


                        <button
                          type="button"
                          onClick={() => {

                            setRegistrationDateMode(
                              'manual'
                            );

                            if (
                              !manualRegistrationDate
                            ) {

                              setManualRegistrationDate(
                                getTodayInputValue()
                              );

                            }

                          }}
                          className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                            registrationDateMode === 'manual'
                              ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]'
                              : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#00ff88]/40'
                          }`}
                        >
                          Manual
                        </button>

                      </div>


                      {
                        registrationDateMode ===
                          'automatic'
                          ? (

                            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5">

                              <Calendar
                                size={17}
                                className="text-[#00ff88]"
                              />

                              <span className="text-gray-300">
                                {
                                  registrationDate
                                }
                              </span>


                              <span className="text-gray-500 text-xs ml-auto">
                                Hoy
                              </span>

                            </div>

                          )
                          : (

                            <>

                              <div className="relative">

                                <Calendar
                                  size={18}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00ff88] pointer-events-none"
                                />


                                <input
                                  type="date"
                                  value={
                                    manualRegistrationDate
                                  }
                                  max={
                                    getTodayInputValue()
                                  }
                                  onChange={
                                    event => {

                                      setManualRegistrationDate(
                                        event.target.value
                                      );

                                      setErrors(
                                        previous => ({
                                          ...previous,
                                          registrationDate:
                                            ''
                                        })
                                      );

                                    }
                                  }
                                  className={`w-full bg-[#1a1a1a] border rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none transition-colors ${
                                    errors.registrationDate
                                      ? 'border-red-500'
                                      : 'border-[#2a2a2a]'
                                  }`}
                                />

                              </div>


                              {
                                errors.registrationDate &&
                                (

                                  <p className="text-red-400 text-xs mt-1">
                                    {
                                      errors.registrationDate
                                    }
                                  </p>

                                )
                              }


                              <p className="text-gray-500 text-xs mt-1">
                                Úsala para miembros que ya habían pagado o iniciado antes de migrar al nuevo sistema.
                              </p>

                            </>

                          )
                      }

                    </div>

                  </div>


                  <div className="mt-4 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">

                    <div className="flex items-center gap-2">

                      <span className="w-2 h-2 bg-gray-500 rounded-full" />

                      <span className="text-white text-sm font-medium">
                        Registro en proceso
                      </span>


                      <span className="text-gray-500 text-xs ml-auto">
                        Sin suscripción activa
                      </span>

                    </div>


                    <p className="text-gray-500 text-xs mt-1">
                      El miembro se guardará definitivamente cuando completes los tres pasos.
                    </p>

                  </div>

                </div>


                {/* ================================================= */}
                {/* NOTAS */}
                {/* ================================================= */}

                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mt-6">

                  <div className="flex items-center justify-between mb-2">

                    <h3 className="text-white font-bold">
                      Notas adicionales
                    </h3>


                    <span className="text-gray-500 text-xs">
                      Opcional
                    </span>

                  </div>


                  <textarea
                    name="notes"
                    placeholder="Agrega información importante sobre este miembro..."
                    value={
                      formData.notes
                    }
                    onChange={
                      handleInputChange
                    }
                    rows={3}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors resize-none"
                  />

                </div>


                {/* ================================================= */}
                {/* BOTÓN INFERIOR */}
                {/* ================================================= */}

                <div className="flex flex-col items-end gap-3 pt-6">

                  <div className="flex gap-3 w-full sm:w-auto">

                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
                    >

                      Guardar y continuar

                      <ChevronRight
                        size={18}
                      />

                    </button>

                  </div>


                  <p className="text-gray-500 text-xs">
                    Continuarás con la configuración de la suscripción.
                  </p>

                </div>

              </form>

            </div>


            {/* ================================================= */}
            {/* RESUMEN LATERAL */}
            {/* ================================================= */}

            <div className="xl:col-span-1">

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">

                <h3 className="text-white font-bold mb-4">
                  Resumen del miembro
                </h3>


                <div className="flex flex-col items-center text-center mb-4">

                  <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">

                    {
                      formData.profilePhotoUrl
                        ? (

                          <img
                            src={
                              formData.profilePhotoUrl
                            }
                            alt="Foto de perfil"
                            className="w-full h-full object-cover"
                          />

                        )
                        : (

                          <User
                            size={36}
                            className="text-gray-500"
                          />

                        )
                    }

                  </div>


                  <div>

                    <p className="text-white font-bold text-lg">

                      {
                        formData.firstName ||
                        formData.lastName

                          ? `${formData.firstName} ${formData.lastName}`.trim()

                          : 'Nuevo miembro'
                      }

                    </p>


                    <p className="text-gray-500 text-sm font-mono">
                      {
                        memberId
                      }
                    </p>

                  </div>

                </div>


                <div className="space-y-3 border-t border-[#1a1a1a] pt-4">

                  <div className="flex justify-between">

                    <span className="text-gray-400 text-sm">
                      Estado
                    </span>


                    <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
                      En registro
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400 text-sm">
                      Fecha de registro
                    </span>


                    <div className="text-right">

                      <span className="text-white text-sm block">
                        {
                          registrationDate
                        }
                      </span>

                      <span className={`text-[10px] ${
                        registrationDateMode === 'manual'
                          ? 'text-yellow-500'
                          : 'text-gray-500'
                      }`}>
                        {
                          registrationDateMode === 'manual'
                            ? 'Fecha manual'
                            : 'Fecha automática'
                        }
                      </span>

                    </div>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400 text-sm">
                      Teléfono
                    </span>


                    <span className="text-white text-sm">
                      {
                        formData.phone ||
                        '—'
                      }
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400 text-sm">
                      Correo
                    </span>


                    <span className="text-white text-sm truncate max-w-[140px]">
                      {
                        formData.email ||
                        '—'
                      }
                    </span>

                  </div>

                </div>


                <div className="border-t border-[#1a1a1a] pt-4 mt-4">

                  <h4 className="text-white text-sm font-medium mb-3">
                    ¿Qué sigue?
                  </h4>


                  <p className="text-gray-400 text-sm mb-3">
                    Después continuarás con la suscripción y posteriormente configurarás los métodos de acceso.
                  </p>


                  <div className="space-y-2">


                    <div className="flex items-center gap-2">

                      <div className="w-6 h-6 rounded-full bg-[#00ff88]/10 flex items-center justify-center">

                        <UserPlus
                          size={14}
                          className="text-[#00ff88]"
                        />

                      </div>


                      <span className="text-gray-300 text-sm">
                        Registrar datos
                      </span>

                    </div>


                    <div className="flex items-center gap-2">

                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center">

                        <ChevronRight
                          size={14}
                          className="text-gray-500"
                        />

                      </div>


                      <span className="text-gray-500 text-sm">
                        Activar suscripción
                      </span>

                    </div>


                    <div className="flex items-center gap-2">

                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center">

                        <ChevronRight
                          size={14}
                          className="text-gray-500"
                        />

                      </div>


                      <span className="text-gray-500 text-sm">
                        Generar QR y PIN
                      </span>

                    </div>


                    <div className="flex items-center gap-2">

                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center">

                        <ChevronRight
                          size={14}
                          className="text-gray-500"
                        />

                      </div>


                      <span className="text-gray-500 text-sm">
                        Registrar rostro
                      </span>

                    </div>


                    <div className="flex items-center gap-2">

                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center">

                        <ChevronRight
                          size={14}
                          className="text-gray-500"
                        />

                      </div>


                      <span className="text-gray-500 text-sm">
                        Miembro listo para acceder
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>


      {/* ================================================= */}
      {/* MODAL DESCARTAR */}
      {/* ================================================= */}

      {
        showDiscardModal &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">

                  <AlertCircle
                    size={32}
                    className="text-yellow-500"
                  />

                </div>


                <h2 className="text-white text-xl font-bold mb-2">
                  ¿Descartar cambios?
                </h2>


                <p className="text-gray-400 mb-6">
                  Los datos que ingresaste todavía no han sido guardados.
                </p>


                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowDiscardModal(
                        false
                      )
                    }
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors"
                  >
                    Seguir editando
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        '/members'
                      )
                    }
                    className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    Descartar
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* ADVERTENCIA LISTA NEGRA */}
      {/* ================================================= */}

      {
        showBlacklistModal &&
        blacklistMatches.length > 0 &&
        (
          <div className="fixed inset-0 z-[9500] flex items-center justify-center p-4">

            <button
              type="button"
              aria-label="Cerrar advertencia"
              onClick={() => setShowBlacklistModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-[4px]"
            />

            <div className="relative w-full max-w-2xl bg-[#101010] border border-red-500/25 rounded-[26px] shadow-[0_35px_120px_rgba(0,0,0,0.85)] overflow-hidden">

              <div className="h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />

              <div className="p-7 sm:p-8">

                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
                  <AlertCircle size={30} className="text-red-400" />
                </div>

                <h2 className="text-white text-2xl font-black">
                  Coincidencia en lista negra
                </h2>

                <p className="text-gray-400 text-sm mt-2 leading-6">
                  Encontramos antecedentes que coinciden con los datos ingresados. Revisa la información antes de continuar con un nuevo registro.
                </p>

                <div className="space-y-3 mt-6 max-h-[320px] overflow-y-auto pr-1">

                  {blacklistMatches.map(match => (
                    <div
                      key={match.id}
                      className="rounded-xl bg-red-500/5 border border-red-500/15 p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                        <div className="flex items-start gap-3 min-w-0">

                          <div className="w-14 h-14 rounded-xl bg-[#1a1a1a] border border-red-500/20 overflow-hidden shrink-0 flex items-center justify-center">

                            {
                              match.profilePhoto ||
                              match.lastMemberSnapshot?.profilePhoto
                                ? (

                                  <img
                                    src={
                                      match.profilePhoto ||
                                      match.lastMemberSnapshot?.profilePhoto
                                    }
                                    alt={
                                      match.fullName ||
                                      'Antecedente'
                                    }
                                    className="w-full h-full object-cover"
                                  />

                                )
                                : (

                                  <User
                                    size={24}
                                    className="text-gray-600"
                                  />

                                )
                            }

                          </div>


                          <div className="min-w-0">

                            <p className="text-white font-bold">
                              {match.fullName || `${match.firstName || ''} ${match.lastName || ''}`.trim() || 'Persona registrada'}
                            </p>

                            <p className="text-gray-500 text-xs font-mono mt-1">
                              ID anterior: {match.previousMemberId || '—'}
                            </p>

                            <p className="text-gray-600 text-[11px] mt-1">
                              Agregado: {
                                match.addedAt
                                  ? new Intl.DateTimeFormat(
                                      'es-MX',
                                      {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }
                                    ).format(
                                      new Date(
                                        match.addedAt
                                      )
                                    )
                                  : 'Sin fecha'
                              }
                            </p>

                            <p className="text-gray-600 text-[11px] mt-0.5">
                              Por: {match.addedBy?.name || 'Sistema'}
                            </p>

                          </div>

                        </div>


                        <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[11px] font-bold whitespace-nowrap self-start">
                          Coincide por {match.matchedBy?.join(', ') || 'datos personales'}
                        </span>

                      </div>


                      <div className="mt-3">

                        <p className="text-gray-500 text-[11px] uppercase tracking-wider">
                          Motivo anterior
                        </p>

                        <p className="text-gray-300 text-sm mt-1">
                          {match.reason || 'Sin motivo registrado'}
                        </p>

                      </div>


                      {
                        match.notes &&
                        (

                          <div className="mt-3">

                            <p className="text-gray-500 text-[11px] uppercase tracking-wider">
                              Notas
                            </p>

                            <p className="text-gray-400 text-sm mt-1">
                              {match.notes}
                            </p>

                          </div>

                        )
                      }
                    </div>
                  ))}

                </div>

                {!canAuthorizeBlacklist && (
                  <div className="mt-5 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                    <p className="text-yellow-500 text-sm font-semibold">
                      Se requiere autorización
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Un encargado no puede ignorar esta advertencia. Debe solicitar al dueño o a un administrador que continúe el registro.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBlacklistModal(false);
                      navigate('/members');
                    }}
                    className="flex-1 px-5 py-3 bg-[#191919] border border-[#2a2a2a] rounded-xl text-white font-medium hover:border-[#3a3a3a]"
                  >
                    Cancelar registro
                  </button>

                  {canAuthorizeBlacklist && (
                    <button
                      type="button"
                      onClick={() => {
                        blacklistBypassRef.current = true;
                        setShowBlacklistModal(false);
                        handleSubmit();
                      }}
                      className="flex-1 px-5 py-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 font-bold hover:bg-red-500/20"
                    >
                      Continuar bajo autorización
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        )
      }

    </div>

  );

};


export default RegisterMemberPage;