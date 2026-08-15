// src/components/Members/Profile/EditMemberPage.jsx

import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  User,
  Mail,
  Phone,
  Calendar,
  Upload,
  Camera,
  Check,
  AlertCircle,
  Lock,
  Save,
  Trash2,
  XCircle,
  UserX,
  ArrowLeft
} from 'lucide-react';

import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';

import {
  getMemberById,
  saveMember
} from '../../../utils/memberId';


// ======================================================
// FORMATEAR FECHA
// ======================================================

const formatRegistrationDate = (value) => {

  if (!value) {
    return 'Fecha no disponible';
  }

  const date = new Date(value);

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
      year: 'numeric'
    }
  ).format(date);

};


// ======================================================
// PARSEAR FECHA DE SUSCRIPCIÓN
// ======================================================

const MONTHS = {
  ene: 0,
  enero: 0,
  feb: 1,
  febrero: 1,
  mar: 2,
  marzo: 2,
  abr: 3,
  abril: 3,
  may: 4,
  mayo: 4,
  jun: 5,
  junio: 5,
  jul: 6,
  julio: 6,
  ago: 7,
  agosto: 7,
  sep: 8,
  sept: 8,
  septiembre: 8,
  oct: 9,
  octubre: 9,
  nov: 10,
  noviembre: 10,
  dic: 11,
  diciembre: 11
};


const parseGymDate = (value) => {

  if (!value) {
    return null;
  }

  const direct =
    new Date(value);

  if (
    !Number.isNaN(
      direct.getTime()
    )
  ) {
    return direct;
  }

  const parts =
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\./g, '')
      .split(/\s+/);

  if (
    parts.length !== 3
  ) {
    return null;
  }

  const day =
    Number(parts[0]);

  const month =
    MONTHS[parts[1]];

  const year =
    Number(parts[2]);

  if (
    Number.isNaN(day) ||
    month === undefined ||
    Number.isNaN(year)
  ) {
    return null;
  }

  return new Date(
    year,
    month,
    day,
    23,
    59,
    59
  );

};


// ======================================================
// COMPONENTE
// ======================================================

const EditMemberPage = () => {

  const navigate =
    useNavigate();

  const {
    id
  } = useParams();

  const topRef =
    useRef(null);

  const fileInputRef =
    useRef(null);


  // ======================================================
  // MIEMBRO ORIGINAL
  // ======================================================

  const [
    memberData,
    setMemberData
  ] = useState(null);


  const [
    originalData,
    setOriginalData
  ] = useState(null);


  // ======================================================
  // FORMULARIO
  // ======================================================

  const [
    formData,
    setFormData
  ] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    profilePhoto: null
  });


  const [
    errors,
    setErrors
  ] = useState({});


  const [
    hasChanges,
    setHasChanges
  ] = useState(false);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    isSaving,
    setIsSaving
  ] = useState(false);


  const [
    showSuccessToast,
    setShowSuccessToast
  ] = useState(false);


  const [
    showDiscardModal,
    setShowDiscardModal
  ] = useState(false);


  const [
    showBlockModal,
    setShowBlockModal
  ] = useState(false);


  const [
    showDeactivateModal,
    setShowDeactivateModal
  ] = useState(false);


  const [
    blockReason,
    setBlockReason
  ] = useState('');


  const [
    deactivateReason,
    setDeactivateReason
  ] = useState('');


  // ======================================================
  // CARGAR MIEMBRO DESDE LOCALSTORAGE
  // ======================================================

  useEffect(
    () => {

      const member =
        getMemberById(id);

      if (!member) {

        console.error(
          '❌ Miembro no encontrado:',
          id
        );

        setLoading(false);

        return;

      }


      console.log(
        '✏️ Miembro cargado para editar:',
        member
      );


      setMemberData(
        member
      );


      const editableData = {

        firstName:
          member.firstName ||
          '',

        lastName:
          member.lastName ||
          '',

        birthDate:
          member.birthDate ||
          '',

        gender:
          member.gender ||
          '',

        phone:
          member.phone ||
          '',

        email:
          member.email ||
          '',

        emergencyContact:
          member.emergencyContact ||
          '',

        emergencyPhone:
          member.emergencyPhone ||
          '',

        notes:
          member.notes ||
          '',

        profilePhoto:
          member.profilePhoto ||
          null

      };


      setFormData(
        editableData
      );


      setOriginalData(
        editableData
      );


      setLoading(false);

    },
    [id]
  );


  // ======================================================
  // SCROLL ARRIBA
  // ======================================================

  useEffect(
    () => {

      if (
        topRef.current
      ) {

        topRef.current.scrollIntoView({
          behavior:
            'smooth'
        });

      }

    },
    []
  );


  // ======================================================
  // DETECTAR CAMBIOS
  // ======================================================

  useEffect(
    () => {

      if (
        !originalData
      ) {

        setHasChanges(
          false
        );

        return;

      }


      const changed =
        Object.keys(
          formData
        ).some(
          key =>
            formData[key] !==
            originalData[key]
        );


      setHasChanges(
        changed
      );

    },
    [
      formData,
      originalData
    ]
  );


  // ======================================================
  // DATOS DERIVADOS
  // ======================================================

  const subscriptionData =
    memberData?.subscription ||
    {
      plan: '',
      days: 0,
      startDate: '',
      endDate: '',
      paymentMethod: '',
      amount: '0.00',
      status: 'inactive'
    };


  const fullName =
    `${formData.firstName || ''} ${formData.lastName || ''}`
      .trim() ||
    'Nuevo miembro';


  const memberId =
    memberData?.id ||
    id ||
    'GYM-00000';


  // ======================================================
  // INPUTS
  // ======================================================

  const handleInputChange = (
    e
  ) => {

    const {
      name,
      value
    } = e.target;


    setFormData(
      previous => ({
        ...previous,
        [name]:
          value
      })
    );


    if (
      errors[name]
    ) {

      setErrors(
        previous => ({
          ...previous,
          [name]:
            ''
        })
      );

    }

  };


  // ======================================================
  // FOTO
  // ======================================================

  const handleFileChange = (
    e
  ) => {

    const file =
      e.target.files?.[0];


    if (!file) {
      return;
    }


    const maxSize =
      5 *
      1024 *
      1024;


    if (
      file.size >
      maxSize
    ) {

      alert(
        'La fotografía no puede superar los 5 MB.'
      );

      return;

    }


    const reader =
      new FileReader();


    reader.onload = (
      event
    ) => {

      setFormData(
        previous => ({
          ...previous,

          profilePhoto:
            event.target.result
        })
      );

    };


    reader.readAsDataURL(
      file
    );

  };


  const handleRemovePhoto =
    () => {

      setFormData(
        previous => ({
          ...previous,

          profilePhoto:
            null
        })
      );

    };


  // ======================================================
  // VALIDACIÓN
  // ======================================================

  const validateForm =
    () => {

      const newErrors = {};


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


      const phoneDigits =
        formData.phone
          .replace(
            /\D/g,
            ''
          );


      if (
        phoneDigits.length <
        10
      ) {

        newErrors.phone =
          'Ingresa un teléfono válido';

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


      setErrors(
        newErrors
      );


      return (
        Object.keys(
          newErrors
        ).length ===
        0
      );

    };


  // ======================================================
  // GUARDAR CAMBIOS EN LOCALSTORAGE
  // ======================================================

  const handleSave =
    () => {

      if (
        !validateForm()
      ) {

        return;

      }


      if (
        !memberData
      ) {

        return;

      }


      setIsSaving(
        true
      );


      try {

        const updatedMember = {

          // Mantener absolutamente todo:
          // suscripción, QR, PIN, rostro, etc.
          ...memberData,


          // Solamente sustituimos los campos editables.
          ...formData,


          id:
            memberData.id,

          updatedAt:
            new Date()
              .toISOString()

        };


        saveMember(
          updatedMember
        );


        console.log(
          '✅ Miembro actualizado:',
          updatedMember
        );


        setMemberData(
          updatedMember
        );


        setOriginalData({
          ...formData
        });


        setHasChanges(
          false
        );


        setShowSuccessToast(
          true
        );


        setTimeout(
          () => {

            setShowSuccessToast(
              false
            );


            navigate(
              `/members/${memberId}`
            );

          },
          1200
        );

      } catch (
        error
      ) {

        console.error(
          '❌ Error actualizando miembro:',
          error
        );


        alert(
          'No se pudieron guardar los cambios.'
        );

      } finally {

        setIsSaving(
          false
        );

      }

    };


  // ======================================================
  // CANCELAR
  // ======================================================

  const handleCancel =
    () => {

      if (
        hasChanges
      ) {

        setShowDiscardModal(
          true
        );

        return;

      }


      navigate(
        `/members/${memberId}`
      );

    };


  const handleDiscard =
    () => {

      setShowDiscardModal(
        false
      );


      navigate(
        `/members/${memberId}`
      );

    };


  // ======================================================
  // CAMPOS MODIFICADOS
  // ======================================================

  const getModifiedFields =
    () => {

      if (
        !originalData
      ) {

        return {};

      }


      const modified = {};


      Object.keys(
        formData
      ).forEach(
        key => {

          if (
            formData[key] !==
            originalData[key]
          ) {

            modified[key] = {

              old:
                originalData[key],

              new:
                formData[key]

            };

          }

        }
      );


      return modified;

    };


  const modifiedFields =
    getModifiedFields();


  const fieldLabels = {

    firstName:
      'Nombre',

    lastName:
      'Apellidos',

    birthDate:
      'Fecha de nacimiento',

    gender:
      'Género',

    phone:
      'Teléfono',

    email:
      'Correo electrónico',

    emergencyContact:
      'Contacto de emergencia',

    emergencyPhone:
      'Teléfono de emergencia',

    notes:
      'Notas',

    profilePhoto:
      'Fotografía'

  };


  // ======================================================
  // DÍAS RESTANTES
  // ======================================================

  const calculateDaysRemaining =
    () => {

      if (
        !subscriptionData.endDate
      ) {

        return 0;

      }


      const endDate =
        parseGymDate(
          subscriptionData.endDate
        );


      if (
        !endDate
      ) {

        return 0;

      }


      const today =
        new Date();


      today.setHours(
        0,
        0,
        0,
        0
      );


      const diff =
        Math.ceil(
          (
            endDate.getTime() -
            today.getTime()
          ) /
          (
            1000 *
            60 *
            60 *
            24
          )
        );


      return Math.max(
        0,
        diff
      );

    };


  const daysRemaining =
    calculateDaysRemaining();


  // ======================================================
  // BLOQUEAR / DESBLOQUEAR
  // ======================================================

  const handleConfirmBlock =
    () => {

      if (
        !blockReason.trim()
      ) {

        alert(
          'Debes escribir un motivo.'
        );

        return;

      }


      try {

        const updatedMember = {

          ...memberData,

          accessBlocked:
            true,

          blockReason:
            blockReason.trim(),

          blockedAt:
            new Date()
              .toISOString(),

          updatedAt:
            new Date()
              .toISOString()

        };


        saveMember(
          updatedMember
        );


        setMemberData(
          updatedMember
        );


        setShowBlockModal(
          false
        );


        setBlockReason(
          ''
        );


        alert(
          'Acceso bloqueado correctamente.'
        );

      } catch (
        error
      ) {

        console.error(
          error
        );

        alert(
          'No se pudo bloquear al miembro.'
        );

      }

    };


  const handleUnblock =
    () => {

      try {

        const updatedMember = {

          ...memberData,

          accessBlocked:
            false,

          blockReason:
            '',

          blockedAt:
            null,

          updatedAt:
            new Date()
              .toISOString()

        };


        saveMember(
          updatedMember
        );


        setMemberData(
          updatedMember
        );


        alert(
          'Acceso habilitado correctamente.'
        );

      } catch (
        error
      ) {

        console.error(
          error
        );

      }

    };


  // ======================================================
  // DAR DE BAJA
  // ======================================================

  const handleDeactivate =
    () => {

      if (
        !deactivateReason
      ) {

        alert(
          'Selecciona el motivo de la baja.'
        );

        return;

      }


      try {

        const updatedMember = {

          ...memberData,

          status:
            'inactive',

          accessBlocked:
            true,

          deactivationReason:
            deactivateReason,

          deactivatedAt:
            new Date()
              .toISOString(),

          updatedAt:
            new Date()
              .toISOString()

        };


        saveMember(
          updatedMember
        );


        setMemberData(
          updatedMember
        );


        setShowDeactivateModal(
          false
        );


        alert(
          'Miembro dado de baja correctamente.'
        );


        navigate(
          '/members'
        );

      } catch (
        error
      ) {

        console.error(
          error
        );

      }

    };


  // ======================================================
  // LOADING
  // ======================================================

  if (
    loading
  ) {

    return (

      <div className="min-h-screen bg-[#0a0a0a] flex">

        <Sidebar
          activePage="Miembros"
        />


        <div className="flex-1">

          <Header />


          <div className="p-10 flex items-center justify-center">

            <div className="text-center">

              <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-3" />


              <p className="text-gray-400">
                Cargando miembro...
              </p>

            </div>

          </div>

        </div>

      </div>

    );

  }


  // ======================================================
  // NO ENCONTRADO
  // ======================================================

  if (
    !memberData
  ) {

    return (

      <div className="min-h-screen bg-[#0a0a0a] flex">

        <Sidebar
          activePage="Miembros"
        />


        <div className="flex-1">

          <Header />


          <main className="p-6">

            <div className="bg-[#111111] border border-red-500/20 rounded-xl p-10 text-center">

              <XCircle
                size={48}
                className="text-red-400 mx-auto mb-4"
              />


              <h2 className="text-white text-xl font-bold">
                Miembro no encontrado
              </h2>


              <p className="text-gray-400 mt-2">
                No encontramos el miembro con ID {id}.
              </p>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/members'
                  )
                }
                className="mt-6 px-5 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold"
              >

                Volver a miembros

              </button>

            </div>

          </main>

        </div>

      </div>

    );

  }


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div
      className="min-h-screen bg-[#0a0a0a] flex"
      ref={
        topRef
      }
    >

      <Sidebar
        activePage="Miembros"
      />


      <div className="flex-1 lg:ml-0">

        <Header />


        <main className="p-6 pb-28">


          {/* ================================================= */}
          {/* BREADCRUMB */}
          {/* ================================================= */}

          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">

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


            <button
              type="button"
              onClick={() =>
                navigate(
                  `/members/${memberId}`
                )
              }
              className="hover:text-white transition-colors"
            >
              {
                fullName
              }
            </button>


            <span>
              /
            </span>


            <span className="text-white">
              Editar
            </span>

          </div>


          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div>

              <h1 className="text-2xl font-bold text-white">
                Editar miembro
              </h1>


              <p className="text-gray-400">
                Actualiza la información personal y de contacto del miembro.
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
                  handleSave
                }
                disabled={
                  !hasChanges ||
                  isSaving
                }
                className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >

                {
                  isSaving
                    ? (

                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />

                    )
                    : (

                      <Save
                        size={18}
                      />

                    )
                }

                Guardar cambios

              </button>

            </div>

          </div>


          {/* ================================================= */}
          {/* RESUMEN */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 mb-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">

                  {
                    formData.profilePhoto
                      ? (

                        <img
                          src={
                            formData.profilePhoto
                          }
                          alt={
                            fullName
                          }
                          className="w-full h-full object-cover"
                        />

                      )
                      : (

                        <User
                          size={24}
                          className="text-gray-500"
                        />

                      )
                  }

                </div>


                <div>

                  <h3 className="text-white font-semibold">
                    {
                      fullName
                    }
                  </h3>


                  <p className="text-gray-500 text-sm font-mono">
                    {
                      memberId
                    }
                  </p>

                </div>

              </div>


              <div className="flex flex-wrap items-center gap-2">

                {
                  subscriptionData.status ===
                  'active'
                    ? (

                      <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full font-medium flex items-center gap-1">

                        <Check
                          size={12}
                        />

                        Suscripción activa

                      </span>

                    )
                    : (

                      <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-full">
                        Sin suscripción
                      </span>

                    )
                }


                {
                  memberData.accessBlocked
                    ? (

                      <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">
                        Acceso bloqueado
                      </span>

                    )
                    : (

                      <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full">
                        Acceso permitido
                      </span>

                    )
                }

              </div>


              <div className="text-sm text-gray-400 ml-auto">

                Miembro desde{' '}

                {
                  formatRegistrationDate(
                    memberData.registrationDate
                  )
                }

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* GRID */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

            <div className="xl:col-span-3 space-y-6">


              {/* ================================================= */}
              {/* FOTOGRAFÍA */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-1">
                  Fotografía
                </h3>


                <p className="text-gray-400 text-sm mb-4">
                  Esta fotografía se utiliza para identificar al miembro durante el control de acceso.
                </p>


                <div className="flex flex-col sm:flex-row items-center gap-6">

                  <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">

                    {
                      formData.profilePhoto
                        ? (

                          <img
                            src={
                              formData.profilePhoto
                            }
                            alt="Foto del miembro"
                            className="w-full h-full object-cover"
                          />

                        )
                        : (

                          <User
                            size={40}
                            className="text-gray-500"
                          />

                        )
                    }

                  </div>


                  <div className="flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
                    >

                      <Upload
                        size={16}
                      />

                      Cambiar fotografía

                    </button>


                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={
                        handleFileChange
                      }
                      className="hidden"
                    />


                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          'La captura mediante cámara la conectaremos posteriormente.'
                        )
                      }
                      className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
                    >

                      <Camera
                        size={16}
                      />

                      Usar cámara

                    </button>


                    {
                      formData.profilePhoto &&
                      (

                        <button
                          type="button"
                          onClick={
                            handleRemovePhoto
                          }
                          className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                        >

                          <Trash2
                            size={16}
                          />

                          Eliminar

                        </button>

                      )
                    }

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* INFORMACIÓN PERSONAL */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-4">
                  Información personal
                </h3>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">

                      Nombre{' '}

                      <span className="text-red-400">
                        *
                      </span>

                    </label>


                    <input
                      type="text"
                      name="firstName"
                      value={
                        formData.firstName
                      }
                      onChange={
                        handleInputChange
                      }
                      className={`w-full bg-[#1a1a1a] border ${
                        errors.firstName
                          ? 'border-red-500'
                          : 'border-[#2a2a2a]'
                      } rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
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

                      Apellidos{' '}

                      <span className="text-red-400">
                        *
                      </span>

                    </label>


                    <input
                      type="text"
                      name="lastName"
                      value={
                        formData.lastName
                      }
                      onChange={
                        handleInputChange
                      }
                      className={`w-full bg-[#1a1a1a] border ${
                        errors.lastName
                          ? 'border-red-500'
                          : 'border-[#2a2a2a]'
                      } rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
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
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
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
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
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

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-4">
                  Información de contacto
                </h3>


                <div className="space-y-4">

                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">

                      Teléfono{' '}

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
                        value={
                          formData.phone
                        }
                        onChange={
                          handleInputChange
                        }
                        className={`flex-1 bg-[#1a1a1a] border ${
                          errors.phone
                            ? 'border-red-500'
                            : 'border-[#2a2a2a]'
                        } rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />


                      <input
                        type="email"
                        name="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleInputChange
                        }
                        className={`w-full bg-[#1a1a1a] border ${
                          errors.email
                            ? 'border-red-500'
                            : 'border-[#2a2a2a]'
                        } rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
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

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* EMERGENCIA */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-4">
                  Contacto de emergencia
                </h3>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">
                      Nombre del contacto
                    </label>


                    <input
                      type="text"
                      name="emergencyContact"
                      value={
                        formData.emergencyContact
                      }
                      onChange={
                        handleInputChange
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                    />

                  </div>


                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">
                      Teléfono de emergencia
                    </label>


                    <div className="relative">

                      <Phone
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />


                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={
                          formData.emergencyPhone
                        }
                        onChange={
                          handleInputChange
                        }
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                      />

                    </div>

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* NOTAS */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <div className="flex items-center justify-between mb-2">

                  <h3 className="text-white font-bold">
                    Notas
                  </h3>


                  <span className="text-gray-500 text-xs">
                    Solo visible para personal autorizado
                  </span>

                </div>


                <textarea
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Agrega información importante sobre este miembro..."
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none resize-none"
                />

              </div>


              {/* ================================================= */}
              {/* SISTEMA */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <div className="flex items-center gap-2 mb-4">

                  <Lock
                    size={18}
                    className="text-gray-500"
                  />


                  <h3 className="text-white font-bold">
                    Información del sistema
                  </h3>


                  <span className="text-gray-500 text-xs">
                    No editable
                  </span>

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <div>

                    <p className="text-gray-400 text-sm">
                      ID del miembro
                    </p>


                    <p className="text-[#00ff88] font-mono">
                      {
                        memberId
                      }
                    </p>

                  </div>


                  <div>

                    <p className="text-gray-400 text-sm">
                      Fecha de registro
                    </p>


                    <p className="text-white">

                      {
                        formatRegistrationDate(
                          memberData.registrationDate
                        )
                      }

                    </p>

                  </div>


                  <div>

                    <p className="text-gray-400 text-sm">
                      Código QR
                    </p>


                    <p className="text-white font-mono">

                      {
                        memberData.access?.qr?.configured
                          ? 'Configurado'
                          : 'No configurado'
                      }

                    </p>

                  </div>


                  <div>

                    <p className="text-gray-400 text-sm">
                      Estado de suscripción
                    </p>


                    <p
                      className={
                        subscriptionData.status ===
                        'active'
                          ? 'text-[#00ff88]'
                          : 'text-gray-400'
                      }
                    >

                      {
                        subscriptionData.status ===
                        'active'
                          ? 'Activa'
                          : 'Sin suscripción'
                      }

                    </p>

                  </div>


                  <div>

                    <p className="text-gray-400 text-sm">
                      Fecha de vencimiento
                    </p>


                    <p className="text-white">

                      {
                        subscriptionData.endDate ||
                        'No disponible'
                      }

                    </p>

                  </div>


                  <div>

                    <p className="text-gray-400 text-sm">
                      Reconocimiento facial
                    </p>


                    <p
                      className={
                        memberData.access?.face?.enrolled
                          ? 'text-[#00ff88]'
                          : 'text-gray-400'
                      }
                    >

                      {
                        memberData.access?.face?.enrolled
                          ? 'Registrado'
                          : 'No registrado'
                      }

                    </p>

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* ADMINISTRACIÓN */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-4">
                  Administración del miembro
                </h3>


                <div className="space-y-4">

                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      <div>

                        <p className="text-white font-medium">

                          {
                            memberData.accessBlocked
                              ? 'Desbloquear acceso'
                              : 'Bloquear acceso'
                          }

                        </p>


                        <p className="text-gray-400 text-sm">

                          {
                            memberData.accessBlocked
                              ? 'Permite nuevamente el ingreso del miembro.'
                              : 'Impide temporalmente que el miembro pueda ingresar.'
                          }

                        </p>


                        {
                          memberData.accessBlocked &&
                          memberData.blockReason &&
                          (

                            <p className="text-red-400 text-xs mt-2">

                              Motivo:{' '}

                              {
                                memberData.blockReason
                              }

                            </p>

                          )
                        }

                      </div>


                      {
                        memberData.accessBlocked
                          ? (

                            <button
                              type="button"
                              onClick={
                                handleUnblock
                              }
                              className="px-4 py-2 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl text-[#00ff88] hover:bg-[#00ff88]/20"
                            >
                              Desbloquear acceso
                            </button>

                          )
                          : (

                            <button
                              type="button"
                              onClick={() =>
                                setShowBlockModal(
                                  true
                                )
                              }
                              className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20"
                            >
                              Bloquear acceso
                            </button>

                          )
                      }

                    </div>

                  </div>


                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      <div>

                        <p className="text-white font-medium">
                          Dar de baja
                        </p>


                        <p className="text-gray-400 text-sm">
                          Marca al miembro como inactivo sin eliminar su historial.
                        </p>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          setShowDeactivateModal(
                            true
                          )
                        }
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20"
                      >
                        Dar de baja miembro
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* ================================================= */}
            {/* RESUMEN LATERAL */}
            {/* ================================================= */}

            <div className="xl:col-span-1">

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">

                <h3 className="text-white font-bold mb-4">
                  Resumen
                </h3>


                <div className="flex flex-col items-center text-center mb-4">

                  <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden mb-3">

                    {
                      formData.profilePhoto
                        ? (

                          <img
                            src={
                              formData.profilePhoto
                            }
                            alt={
                              fullName
                            }
                            className="w-full h-full object-cover"
                          />

                        )
                        : (

                          <User
                            size={32}
                            className="text-gray-500"
                          />

                        )
                    }

                  </div>


                  <p className="text-white font-bold">
                    {
                      fullName
                    }
                  </p>


                  <p className="text-gray-500 text-sm font-mono">
                    {
                      memberId
                    }
                  </p>


                  <div className="mt-2">

                    <span
                      className={`px-3 py-0.5 rounded-full text-xs ${
                        memberData.accessBlocked
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-[#00ff88]/10 text-[#00ff88]'
                      }`}
                    >

                      {
                        memberData.accessBlocked
                          ? 'Bloqueado'
                          : 'Activo'
                      }

                    </span>

                  </div>

                </div>


                <div className="space-y-2 text-sm border-t border-[#1a1a1a] pt-4">

                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Suscripción
                    </span>


                    <span className="text-white capitalize">
                      {
                        subscriptionData.plan ||
                        'Sin plan'
                      }
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Vencimiento
                    </span>


                    <span className="text-white">
                      {
                        subscriptionData.endDate ||
                        'No disponible'
                      }
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Días restantes
                    </span>


                    <span
                      className={
                        daysRemaining <=
                        5
                          ? 'text-yellow-500'
                          : 'text-white'
                      }
                    >

                      {
                        daysRemaining
                      }

                      {' '}días

                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      QR
                    </span>


                    <span
                      className={
                        memberData.access?.qr?.enabled
                          ? 'text-[#00ff88]'
                          : 'text-gray-500'
                      }
                    >

                      {
                        memberData.access?.qr?.enabled
                          ? 'Habilitado'
                          : 'No configurado'
                      }

                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Rostro
                    </span>


                    <span
                      className={
                        memberData.access?.face?.enrolled
                          ? 'text-[#00ff88]'
                          : 'text-gray-500'
                      }
                    >

                      {
                        memberData.access?.face?.enrolled
                          ? 'Registrado'
                          : 'No registrado'
                      }

                    </span>

                  </div>

                </div>


                {
                  hasChanges &&
                  Object.keys(
                    modifiedFields
                  ).length >
                    0 &&
                  (

                    <div className="border-t border-[#1a1a1a] pt-4 mt-4">

                      <p className="text-yellow-500 text-sm font-medium mb-3">
                        Cambios sin guardar
                      </p>


                      <div className="space-y-2">

                        {
                          Object.keys(
                            modifiedFields
                          ).map(
                            key => (

                              <div
                                key={
                                  key
                                }
                                className="text-xs"
                              >

                                <p className="text-gray-400">
                                  {
                                    fieldLabels[key] ||
                                    key
                                  }
                                </p>


                                {
                                  key !==
                                  'profilePhoto' &&
                                  (

                                    <div className="flex items-center gap-2 flex-wrap">

                                      <span className="text-gray-500 line-through">
                                        {
                                          modifiedFields[key].old ||
                                          '—'
                                        }
                                      </span>


                                      <span className="text-[#00ff88]">
                                        →
                                      </span>


                                      <span className="text-white">
                                        {
                                          modifiedFields[key].new ||
                                          '—'
                                        }
                                      </span>

                                    </div>

                                  )
                                }

                              </div>

                            )
                          )
                        }

                      </div>

                    </div>

                  )
                }

              </div>

            </div>

          </div>

        </main>

      </div>


      {/* ================================================= */}
      {/* BARRA GUARDAR */}
      {/* ================================================= */}

      {
        hasChanges &&
        (

          <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1a1a1a] p-4 z-40 lg:ml-64">

            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <AlertCircle
                  size={20}
                  className="text-yellow-500"
                />


                <span className="text-white font-medium">
                  Tienes cambios sin guardar
                </span>

              </div>


              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowDiscardModal(
                      true
                    )
                  }
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-red-500 hover:text-red-400"
                >
                  Descartar
                </button>


                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    isSaving
                  }
                  className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2 disabled:opacity-50"
                >

                  <Save
                    size={18}
                  />

                  Guardar cambios

                </button>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* TOAST */}
      {/* ================================================= */}

      {
        showSuccessToast &&
        (

          <div className="fixed top-20 right-4 bg-[#111111] border border-[#00ff88] rounded-xl p-4 shadow-2xl z-50 max-w-sm">

            <div className="flex items-start gap-3">

              <div className="w-8 h-8 rounded-full bg-[#00ff88]/10 flex items-center justify-center">

                <Check
                  size={16}
                  className="text-[#00ff88]"
                />

              </div>


              <div>

                <p className="text-white font-bold">
                  Cambios guardados
                </p>


                <p className="text-gray-400 text-sm">
                  La información fue actualizada en el almacenamiento local.
                </p>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* MODAL DESCARTAR */}
      {/* ================================================= */}

      {
        showDiscardModal &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <AlertCircle
                  size={42}
                  className="text-yellow-500 mx-auto mb-4"
                />


                <h2 className="text-white text-xl font-bold mb-2">
                  ¿Descartar cambios?
                </h2>


                <p className="text-gray-400 mb-6">
                  Realizaste modificaciones que todavía no han sido guardadas.
                </p>


                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowDiscardModal(
                        false
                      )
                    }
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white"
                  >
                    Seguir editando
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleDiscard
                    }
                    className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl"
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
      {/* MODAL BLOQUEAR */}
      {/* ================================================= */}

      {
        showBlockModal &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <Lock
                  size={42}
                  className="text-red-400 mx-auto mb-4"
                />


                <h2 className="text-white text-xl font-bold mb-2">
                  Bloquear acceso
                </h2>


                <p className="text-gray-400 text-sm mb-4">

                  {
                    fullName
                  }

                  {' '}no podrá ingresar utilizando QR, PIN o reconocimiento facial.

                </p>


                <div className="text-left mb-6">

                  <label className="text-white text-sm font-medium mb-1 block">
                    Motivo *
                  </label>


                  <textarea
                    value={
                      blockReason
                    }
                    onChange={
                      e =>
                        setBlockReason(
                          e.target.value
                        )
                    }
                    placeholder="Escribe el motivo..."
                    rows={3}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none resize-none"
                  />

                </div>


                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() => {

                      setShowBlockModal(
                        false
                      );

                      setBlockReason(
                        ''
                      );

                    }}
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white"
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleConfirmBlock
                    }
                    className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl"
                  >
                    Bloquear acceso
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* MODAL BAJA */}
      {/* ================================================= */}

      {
        showDeactivateModal &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <UserX
                  size={42}
                  className="text-red-400 mx-auto mb-4"
                />


                <h2 className="text-white text-xl font-bold mb-2">
                  Dar de baja miembro
                </h2>


                <p className="text-gray-400 text-sm mb-4">
                  El historial será conservado, pero el miembro quedará inactivo y con acceso bloqueado.
                </p>


                <div className="text-left mb-6">

                  <label className="text-white text-sm font-medium mb-1 block">
                    Motivo *
                  </label>


                  <select
                    value={
                      deactivateReason
                    }
                    onChange={
                      e =>
                        setDeactivateReason(
                          e.target.value
                        )
                    }
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                  >

                    <option value="">
                      Seleccionar motivo
                    </option>

                    <option value="Solicitud del miembro">
                      Solicitud del miembro
                    </option>

                    <option value="Cambio de gimnasio">
                      Cambio de gimnasio
                    </option>

                    <option value="Inactividad">
                      Inactividad
                    </option>

                    <option value="Otro">
                      Otro
                    </option>

                  </select>

                </div>


                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowDeactivateModal(
                        false
                      )
                    }
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white"
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleDeactivate
                    }
                    className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl"
                  >
                    Confirmar baja
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

};


export default EditMemberPage;