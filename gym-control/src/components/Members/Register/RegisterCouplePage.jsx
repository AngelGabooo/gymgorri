// src/components/Members/Register/RegisterCouplePage.jsx

import React, {
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  HeartHandshake,
  Mail,
  Phone,
  Upload,
  User,
  Users,
  X
} from 'lucide-react';

import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';

import {
  createCoupleGroupId,
  getNextCoupleMemberIds,
  linkCoupleMembers
} from '../../../services/couplePromotionService';


const EMPTY_PERSON = {
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
};


const profileImages = [
  '/img/profile1.png',
  '/img/profile2.png',
  '/img/profile3.png',
  '/img/profile4.png',
  '/img/profile5.png'
];


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


  return digits.length >= 10;

};


const PersonForm = ({
  number,
  memberId,
  data,
  errors,
  onChange,
  onRandomPhoto,
  onFileUpload,
  onRemovePhoto
}) => {

  const fullName =
    `${data.firstName || ''} ${data.lastName || ''}`.trim();


  return (

    <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden">

      <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
            <User
              size={20}
              className="text-[#00ff88]"
            />
          </div>

          <div>
            <p className="text-white font-bold">
              Persona {number}
            </p>
            <p className="text-gray-500 text-xs font-mono">
              {memberId}
            </p>
          </div>

        </div>

        <span className="px-3 py-1 rounded-full bg-[#00ff88]/10 text-[#00ff88] text-xs font-semibold">
          {fullName || 'Pendiente'}
        </span>

      </div>


      <div className="p-5 space-y-5">

        <div>
          <p className="text-white text-sm font-semibold mb-1">
            Fotografía
          </p>
          <p className="text-gray-500 text-xs mb-3">
            Cada persona tendrá su propia foto, QR, PIN y biometría.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">

            <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] overflow-hidden flex items-center justify-center shrink-0">
              {
                data.profilePhotoUrl
                  ? (
                    <img
                      src={data.profilePhotoUrl}
                      alt={`Persona ${number}`}
                      className="w-full h-full object-cover"
                    />
                  )
                  : (
                    <User
                      size={38}
                      className="text-gray-600"
                    />
                  )
              }
            </div>

            <div className="flex flex-wrap gap-2">

              <label className="px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm cursor-pointer hover:border-[#00ff88] transition-colors flex items-center gap-2">
                <Upload size={15} />
                Subir foto

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileUpload}
                />
              </label>

              <button
                type="button"
                onClick={onRandomPhoto}
                className="px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm hover:border-[#00ff88] transition-colors flex items-center gap-2"
              >
                <Camera size={15} />
                Aleatoria
              </button>

              {
                data.profilePhotoUrl &&
                (
                  <button
                    type="button"
                    onClick={onRemovePhoto}
                    className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
                  >
                    <X size={15} />
                    Quitar
                  </button>
                )
              }

            </div>

          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="text-white text-sm font-medium mb-1 block">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={data.firstName}
              onChange={onChange}
              placeholder="Ej. Carlos"
              className={`w-full bg-[#1a1a1a] border ${errors.firstName ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
            />
            {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-1 block">
              Apellidos <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={data.lastName}
              onChange={onChange}
              placeholder="Ej. Hernández López"
              className={`w-full bg-[#1a1a1a] border ${errors.lastName ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
            />
            {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-1 block">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              name="birthDate"
              value={data.birthDate}
              onChange={onChange}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-1 block">
              Género
            </label>
            <select
              name="gender"
              value={data.gender}
              onChange={onChange}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="">Seleccionar</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
              <option value="prefer-not">Prefiero no especificar</option>
            </select>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-1 block">
              Teléfono <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                name="phone"
                value={data.phone}
                onChange={onChange}
                placeholder="961 123 4567"
                className={`w-full bg-[#1a1a1a] border ${errors.phone ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
              />
            </div>
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-1 block">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={onChange}
                placeholder="correo@ejemplo.com"
                className={`w-full bg-[#1a1a1a] border ${errors.email ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-1 block">
              Contacto de emergencia
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={data.emergencyContact}
              onChange={onChange}
              placeholder="Nombre del contacto"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-1 block">
              Teléfono de emergencia
            </label>
            <input
              type="text"
              name="emergencyPhone"
              value={data.emergencyPhone}
              onChange={onChange}
              placeholder="961 000 0000"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
            />
          </div>

        </div>


        <div>
          <label className="text-white text-sm font-medium mb-1 block">
            Notas
          </label>
          <textarea
            name="notes"
            rows="3"
            value={data.notes}
            onChange={onChange}
            placeholder="Información adicional..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none resize-none"
          />
        </div>

      </div>

    </div>

  );

};


const RegisterCouplePage = () => {

  const navigate =
    useNavigate();


  const [memberIds] =
    useState(
      () =>
        getNextCoupleMemberIds()
    );


  const [groupId] =
    useState(
      () =>
        createCoupleGroupId()
    );


  const [people, setPeople] =
    useState([
      { ...EMPTY_PERSON },
      { ...EMPTY_PERSON }
    ]);


  const [errors, setErrors] =
    useState([
      {},
      {}
    ]);


  const [showDiscardModal, setShowDiscardModal] =
    useState(false);


  const pairNames =
    useMemo(
      () =>
        people.map(
          person =>
            `${person.firstName || ''} ${person.lastName || ''}`.trim() ||
            'Pendiente'
        ),
      [people]
    );


  const updatePerson = (
    index,
    field,
    value
  ) => {

    setPeople(
      previous =>
        previous.map(
          (
            person,
            personIndex
          ) =>
            personIndex === index
              ? {
                  ...person,
                  [field]: value
                }
              : person
        )
    );


    setErrors(
      previous =>
        previous.map(
          (
            item,
            personIndex
          ) =>
            personIndex === index
              ? {
                  ...item,
                  [field]: ''
                }
              : item
        )
    );

  };


  const handleInputChange = (
    index,
    event
  ) => {

    const {
      name,
      value
    } = event.target;


    updatePerson(
      index,
      name,
      value
    );

  };


  const handleRandomPhoto = (
    index
  ) => {

    const selected =
      profileImages[
        Math.floor(
          Math.random() *
          profileImages.length
        )
      ];


    setPeople(
      previous =>
        previous.map(
          (
            person,
            personIndex
          ) =>
            personIndex === index
              ? {
                  ...person,
                  profilePhoto: null,
                  profilePhotoUrl: selected
                }
              : person
        )
    );

  };


  const handleFileUpload = (
    index,
    event
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      alert(
        'La imagen no puede superar los 5 MB.'
      );

      return;
    }


    const reader =
      new FileReader();


    reader.onload = (
      loadEvent
    ) => {

      setPeople(
        previous =>
          previous.map(
            (
              person,
              personIndex
            ) =>
              personIndex === index
                ? {
                    ...person,
                    profilePhoto: null,
                    profilePhotoUrl: loadEvent.target.result
                  }
                : person
          )
      );

    };


    reader.readAsDataURL(
      file
    );

  };


  const handleRemovePhoto = (
    index
  ) => {

    setPeople(
      previous =>
        previous.map(
          (
            person,
            personIndex
          ) =>
            personIndex === index
              ? {
                  ...person,
                  profilePhoto: null,
                  profilePhotoUrl: null
                }
              : person
        )
    );

  };


  const validatePerson = (
    person
  ) => {

    const result = {};


    if (
      !person.firstName.trim()
    ) {
      result.firstName =
        'El nombre es obligatorio';
    }


    if (
      !person.lastName.trim()
    ) {
      result.lastName =
        'Los apellidos son obligatorios';
    }


    if (
      !person.phone.trim() ||
      !isValidPhone(
        person.phone
      )
    ) {
      result.phone =
        'Ingresa un teléfono válido';
    }


    if (
      person.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        person.email
      )
    ) {
      result.email =
        'Ingresa un correo válido';
    }


    return result;

  };


  const handleContinue = () => {

    const validation =
      people.map(
        validatePerson
      );


    setErrors(
      validation
    );


    if (
      validation.some(
        item =>
          Object.keys(
            item
          ).length > 0
      )
    ) {
      return;
    }


    const now =
      new Date()
        .toISOString();


    const rawMembers =
      people.map(
        (
          person,
          index
        ) => {

          const {
            profilePhoto,
            profilePhotoUrl,
            ...personalData
          } = person;


          return {
            ...personalData,

            id:
              memberIds[index],

            profilePhoto:
              profilePhotoUrl ||
              null,

            registrationDate:
              now,

            createdAt:
              now,

            updatedAt:
              now,

            status:
              'pending_subscription',

            accessBlocked:
              false
          };

        }
      );


    const linkedMembers =
      linkCoupleMembers({
        members:
          rawMembers,
        groupId
      });


    navigate(
      '/members/register/couple/subscription',
      {
        state: {
          coupleData: {
            groupId,
            members:
              linkedMembers
          },

          promotionContext: {
            id:
              'couple',
            label:
              'Pareja',
            locked:
              true,
            groupId
          }
        }
      }
    );

  };


  const hasData =
    people.some(
      person =>
        Object.values(
          person
        ).some(
          value =>
            value !== '' &&
            value !== null
        )
    );


  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Miembros"
      />

      <div className="flex-1 lg:ml-0">

        <Header />

        <main className="p-6 space-y-6">

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button
              type="button"
              onClick={() => navigate('/members/register')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={15} />
              Registro
            </button>
            <span>/</span>
            <span className="text-white">
              Promoción de pareja
            </span>
          </div>


          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
                  <HeartHandshake
                    size={25}
                    className="text-[#00ff88]"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-black text-white">
                    Registrar promoción de pareja
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Captura a las dos personas antes de continuar con la suscripción.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (hasData) {
                    setShowDiscardModal(true);
                  } else {
                    navigate('/members/register');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:border-red-500/40 hover:text-red-400 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleContinue}
                className="px-5 py-2 rounded-xl bg-[#00ff88] text-black font-bold flex items-center gap-2 hover:bg-[#00cc6a] transition-colors"
              >
                Guardar ambos y continuar
                <ChevronRight size={18} />
              </button>
            </div>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <div className="bg-[#111111] border border-[#00ff88]/20 rounded-xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Grupo de pareja
              </p>
              <p className="text-[#00ff88] text-sm font-mono mt-1 break-all">
                {groupId}
              </p>
            </div>

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Persona 1
              </p>
              <p className="text-white font-semibold mt-1">
                {pairNames[0]}
              </p>
              <p className="text-gray-500 text-xs font-mono">
                {memberIds[0]}
              </p>
            </div>

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Persona 2
              </p>
              <p className="text-white font-semibold mt-1">
                {pairNames[1]}
              </p>
              <p className="text-gray-500 text-xs font-mono">
                {memberIds[1]}
              </p>
            </div>

          </div>


          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3">
            <Users
              size={20}
              className="text-blue-400 shrink-0 mt-0.5"
            />
            <p className="text-gray-300 text-sm leading-relaxed">
              Las dos personas se registrarán como miembros independientes, pero quedarán vinculadas por la misma promoción. Cada una tendrá su propio ID, QR, PIN, rostro, asistencias e historial.
            </p>
          </div>


          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">

            <PersonForm
              number={1}
              memberId={memberIds[0]}
              data={people[0]}
              errors={errors[0]}
              onChange={event => handleInputChange(0, event)}
              onRandomPhoto={() => handleRandomPhoto(0)}
              onFileUpload={event => handleFileUpload(0, event)}
              onRemovePhoto={() => handleRemovePhoto(0)}
            />

            <PersonForm
              number={2}
              memberId={memberIds[1]}
              data={people[1]}
              errors={errors[1]}
              onChange={event => handleInputChange(1, event)}
              onRandomPhoto={() => handleRandomPhoto(1)}
              onFileUpload={event => handleFileUpload(1, event)}
              onRemovePhoto={() => handleRemovePhoto(1)}
            />

          </div>


          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleContinue}
              className="px-6 py-3 bg-[#00ff88] text-black rounded-xl font-black hover:bg-[#00cc6a] transition-colors flex items-center gap-2"
            >
              <Check size={18} />
              Continuar con suscripción de pareja
            </button>
          </div>

        </main>

      </div>


      {showDiscardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-2xl p-7 text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle
                size={28}
                className="text-yellow-500"
              />
            </div>

            <h2 className="text-white text-xl font-bold">
              ¿Descartar las dos personas?
            </h2>

            <p className="text-gray-400 text-sm mt-2 mb-6">
              Ninguna persona ha sido guardada todavía. Si sales, se perderán los datos capturados.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white"
              >
                Seguir editando
              </button>

              <button
                type="button"
                onClick={() => navigate('/members/register')}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

};


export default RegisterCouplePage;
