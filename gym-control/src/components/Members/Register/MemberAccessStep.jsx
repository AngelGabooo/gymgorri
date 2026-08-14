// src/components/Members/Register/MemberAccessStep.jsx

import React, { useEffect, useMemo, useState } from 'react';

import {
  QrCode,
  KeyRound,
  ScanFace,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Camera,
  AlertTriangle,
  User,
  BadgeCheck,
  LockKeyhole
} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';

import {
  getNextMemberId,
  confirmMemberId
} from '../../../utils/memberId';


const MemberAccessStep = ({
  memberData = {},
  subscriptionData = {},
  onBack,
  onComplete
}) => {

  // =====================================================
  // ID DEL MIEMBRO
  // =====================================================

  const [memberId] = useState(() => {
    return memberData?.id || getNextMemberId();
  });


  // =====================================================
  // PIN
  // =====================================================

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showPin, setShowPin] = useState(false);

  const [pinConfigured, setPinConfigured] =
    useState(false);

  const [pinError, setPinError] =
    useState('');


  // =====================================================
  // BIOMETRÍA
  // =====================================================

  const [faceRegistered, setFaceRegistered] =
    useState(false);

  const [showFaceModal, setShowFaceModal] =
    useState(false);

  const [biometricConsent, setBiometricConsent] =
    useState(false);

  const [faceStep, setFaceStep] =
    useState(0);

  const [isFaceProcessing, setIsFaceProcessing] =
    useState(false);


  // =====================================================
  // GUARDADO
  // =====================================================

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState('');

  const [saved, setSaved] =
    useState(false);


  // =====================================================
  // DATOS VISUALES
  // =====================================================

  const fullName = useMemo(() => {

    const firstName =
      memberData?.firstName ||
      memberData?.name ||
      '';

    const lastName =
      memberData?.lastName ||
      '';

    return (
      `${firstName} ${lastName}`.trim() ||
      'Nuevo miembro'
    );

  }, [memberData]);


  const subscriptionActive =
    subscriptionData?.status === 'active';


  // =====================================================
  // QR
  // =====================================================

  const qrValue = useMemo(() => {

    return JSON.stringify({
      id: memberId
    });

  }, [memberId]);


  // =====================================================
  // CONFIGURAR PIN
  // =====================================================

  const handleConfigurePin = () => {

    setPinError('');


    if (!pin) {

      setPinError(
        'Ingresa un PIN de acceso.'
      );

      return;

    }


    if (!/^\d{6}$/.test(pin)) {

      setPinError(
        'El PIN debe contener exactamente 6 números.'
      );

      return;

    }


    if (pin !== confirmPin) {

      setPinError(
        'Los PIN no coinciden.'
      );

      return;

    }


    // En producción:
    // NO guardar PIN directamente.
    // El backend deberá recibirlo y generar un hash.

    setPinConfigured(true);

  };


  // =====================================================
  // ELIMINAR PIN
  // =====================================================

  const handleRemovePin = () => {

    setPin('');
    setConfirmPin('');
    setPinConfigured(false);
    setPinError('');

  };


  // =====================================================
  // ABRIR REGISTRO FACIAL
  // =====================================================

  const handleOpenFaceRegister = () => {

    setFaceStep(0);

    setBiometricConsent(false);

    setShowFaceModal(true);

  };


  // =====================================================
  // REGISTRO FACIAL
  // =====================================================

  const handleFaceCapture = () => {

    if (!biometricConsent) {
      return;
    }


    setIsFaceProcessing(true);


    // =================================================
    // POR AHORA SIMULAMOS EL PROCESO DE ENROLAMIENTO.
    //
    // Posteriormente este punto se conectará con:
    //
    // FaceScanner
    // +
    // motor de reconocimiento facial
    // +
    // backend
    //
    // NO estamos guardando fotografías biométricas
    // en localStorage.
    // =================================================

    setTimeout(() => {

      if (faceStep < 2) {

        setFaceStep(prev => prev + 1);

        setIsFaceProcessing(false);

        return;

      }


      setFaceRegistered(true);

      setIsFaceProcessing(false);

      setShowFaceModal(false);

    }, 900);

  };


  // =====================================================
  // INFORMACIÓN DEL PASO DEL ROSTRO
  // =====================================================

  const faceInstructions = [
    {
      title: 'Mira de frente',
      description:
        'Mantén tu rostro centrado y mira directamente hacia la cámara.'
    },
    {
      title: 'Gira ligeramente a la izquierda',
      description:
        'Mantén el rostro visible y gira suavemente hacia tu izquierda.'
    },
    {
      title: 'Gira ligeramente a la derecha',
      description:
        'Mantén el rostro visible y gira suavemente hacia tu derecha.'
    }
  ];


  // =====================================================
  // GUARDAR MIEMBRO
  // =====================================================

  const handleSaveMember = async () => {

    if (isSaving) return;


    setSaveError('');
    setIsSaving(true);


    try {

      // ===============================================
      // ESTRUCTURA FINAL DEL REGISTRO
      // ===============================================

      const finalMember = {

        ...memberData,

        id: memberId,

        status:
          memberData?.status ||
          'active',

        accessBlocked: false,

        subscription: {
          ...subscriptionData
        },

        access: {

          qr: {
            enabled: true,
            configured: true,
            value: memberId
          },

          pin: {
            enabled: pinConfigured,
            configured: pinConfigured,

            /**
             * IMPORTANTE
             *
             * En la versión real NO mandaremos
             * esto a la BD como texto plano.
             *
             * Se enviará al backend:
             *
             * pin
             *
             * y el backend almacenará:
             *
             * pinHash
             */
            pin:
              pinConfigured
                ? pin
                : null
          },

          face: {
            enabled: faceRegistered,
            enrolled: faceRegistered,

            biometricTemplateId:
              faceRegistered
                ? `FACE-${memberId}`
                : null,

            enrolledAt:
              faceRegistered
                ? new Date().toISOString()
                : null
          }

        },

        registrationDate:
          memberData?.registrationDate ||
          new Date().toISOString(),

        createdAt:
          memberData?.createdAt ||
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()

      };


      console.log(
        'MIEMBRO A GUARDAR:',
        finalMember
      );


      // ===============================================
      // TEMPORAL: GUARDAR EN LOCALSTORAGE
      // ===============================================

      const existingMembers = JSON.parse(
        localStorage.getItem(
          'gym_control_members'
        ) || '[]'
      );


      const alreadyExists =
        existingMembers.some(
          member =>
            member.id === memberId
        );


      if (alreadyExists) {

        throw new Error(
          `Ya existe un miembro con el ID ${memberId}.`
        );

      }


      existingMembers.push(
        finalMember
      );


      localStorage.setItem(
        'gym_control_members',
        JSON.stringify(existingMembers)
      );


      // SOLO AQUÍ confirmamos el consecutivo.
      confirmMemberId(memberId);


      setSaved(true);


      // ===============================================
      // DEVOLVER DATOS AL PADRE
      // ===============================================

      if (onComplete) {

        onComplete(
          finalMember
        );

      }


    } catch (error) {

      console.error(
        'Error guardando miembro:',
        error
      );


      setSaveError(
        error?.message ||
        'No pudimos guardar el miembro.'
      );


    } finally {

      setIsSaving(false);

    }

  };


  // =====================================================
  // SI YA SE GUARDÓ
  // =====================================================

  if (saved) {

    return (

      <div
        className="
          bg-[#111111]
          border
          border-[#00ff88]/30
          rounded-2xl
          p-8
          text-center
        "
      >

        <div
          className="
            w-20
            h-20
            mx-auto
            rounded-full

            bg-[#00ff88]/10

            flex
            items-center
            justify-center

            mb-5
          "
        >

          <BadgeCheck
            size={42}
            className="text-[#00ff88]"
          />

        </div>


        <h2
          className="
            text-white
            text-2xl
            font-bold
          "
        >
          Miembro registrado
        </h2>


        <p
          className="
            text-gray-400
            mt-2
          "
        >
          El registro se completó correctamente.
        </p>


        <div
          className="
            inline-flex
            mt-5

            bg-[#00ff88]/10
            border
            border-[#00ff88]/20

            px-5
            py-2

            rounded-xl

            text-[#00ff88]
            font-mono
            font-bold
            text-lg
          "
        >
          {memberId}
        </div>

      </div>

    );

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="space-y-6">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div>

        <h2
          className="
            text-white
            text-2xl
            font-bold
          "
        >
          Credencial y métodos de acceso
        </h2>


        <p
          className="
            text-gray-400
            mt-1
          "
        >
          Configura las formas en las que el miembro
          podrá ingresar al gimnasio.
        </p>

      </div>


      {/* ================================================= */}
      {/* INFORMACIÓN DEL MIEMBRO */}
      {/* ================================================= */}

      <div
        className="
          bg-[#111111]
          border
          border-[#1f1f1f]

          rounded-2xl

          p-5

          flex
          items-center
          justify-between

          gap-4
          flex-wrap
        "
      >

        <div
          className="
            flex
            items-center
            gap-4
          "
        >

          <div
            className="
              w-14
              h-14

              bg-[#1a1a1a]

              rounded-full

              border
              border-[#2a2a2a]

              flex
              items-center
              justify-center
            "
          >

            <User
              size={26}
              className="text-gray-500"
            />

          </div>


          <div>

            <p
              className="
                text-white
                font-semibold
              "
            >
              {fullName}
            </p>


            <p
              className="
                text-[#00ff88]
                font-mono
                text-sm
              "
            >
              {memberId}
            </p>

          </div>

        </div>


        <div
          className={`
            px-3
            py-1.5
            rounded-full
            text-xs
            font-semibold

            ${
              subscriptionActive
                ? 'bg-[#00ff88]/10 text-[#00ff88]'
                : 'bg-yellow-500/10 text-yellow-400'
            }
          `}
        >

          {subscriptionActive
            ? 'Suscripción activa'
            : 'Suscripción pendiente'}

        </div>

      </div>


      {/* ================================================= */}
      {/* CREDENCIAL / QR */}
      {/* ================================================= */}

      <div
        className="
          bg-[#111111]

          border
          border-[#1f1f1f]

          rounded-2xl

          p-6
        "
      >

        <div
          className="
            flex
            items-start
            justify-between

            gap-4
            flex-wrap
          "
        >

          <div>

            <h3
              className="
                text-white
                font-bold
                text-lg
              "
            >
              Credencial digital
            </h3>


            <p
              className="
                text-gray-400
                text-sm
                mt-1
              "
            >
              El código QR se genera automáticamente
              utilizando el ID del miembro.
            </p>

          </div>


          <span
            className="
              px-3
              py-1

              bg-[#00ff88]/10
              text-[#00ff88]

              border
              border-[#00ff88]/20

              rounded-full

              text-xs
              font-semibold
            "
          >
            Activo
          </span>

        </div>


        <div
          className="
            mt-6

            flex
            flex-col
            md:flex-row

            items-center

            gap-6
          "
        >

          <div
            className="
              bg-white

              p-4

              rounded-2xl

              shadow-[0_0_30px_rgba(0,255,136,0.08)]
            "
          >

            <QRCodeSVG
              value={qrValue}
              size={150}
              level="H"
              includeMargin={false}
            />

          </div>


          <div className="flex-1">

            <p
              className="
                text-gray-500
                text-xs
                uppercase
                tracking-wider
              "
            >
              ID DE MIEMBRO
            </p>


            <p
              className="
                text-[#00ff88]
                text-2xl
                font-mono
                font-bold
                mt-1
              "
            >
              {memberId}
            </p>


            <div
              className="
                mt-4

                flex
                items-center
                gap-2

                text-gray-400
                text-sm
              "
            >

              <ShieldCheck
                size={17}
                className="text-[#00ff88]"
              />

              Código personal e intransferible.

            </div>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* MÉTODOS DE ACCESO */}
      {/* ================================================= */}

      <div
        className="
          bg-[#111111]

          border
          border-[#1f1f1f]

          rounded-2xl

          p-6
        "
      >

        <h3
          className="
            text-white
            font-bold
            text-lg
          "
        >
          Métodos de acceso
        </h3>


        <p
          className="
            text-gray-400
            text-sm
            mt-1
            mb-6
          "
        >
          El miembro puede utilizar uno o varios métodos
          para identificarse al ingresar.
        </p>


        <div
          className="
            grid

            grid-cols-1
            md:grid-cols-3

            gap-4
          "
        >


          {/* ================================================= */}
          {/* QR */}
          {/* ================================================= */}

          <div
            className="
              bg-[#171717]

              border
              border-[#00ff88]/30

              rounded-2xl

              p-5
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div
                className="
                  w-11
                  h-11

                  rounded-xl

                  bg-[#00ff88]/10

                  flex
                  items-center
                  justify-center
                "
              >

                <QrCode
                  size={22}
                  className="text-[#00ff88]"
                />

              </div>


              <CheckCircle2
                size={20}
                className="text-[#00ff88]"
              />

            </div>


            <h4
              className="
                text-white
                font-semibold
                mt-5
              "
            >
              Código QR
            </h4>


            <p
              className="
                text-[#00ff88]
                text-xs
                mt-1
                font-semibold
              "
            >
              ACTIVADO
            </p>


            <p
              className="
                text-gray-500
                text-xs
                mt-3
              "
            >
              Se genera automáticamente junto con
              la credencial.
            </p>

          </div>


          {/* ================================================= */}
          {/* PIN */}
          {/* ================================================= */}

          <div
            className={`
              bg-[#171717]

              border

              rounded-2xl

              p-5

              transition-all

              ${
                pinConfigured
                  ? 'border-[#00ff88]/30'
                  : 'border-[#2a2a2a]'
              }
            `}
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div
                className="
                  w-11
                  h-11

                  rounded-xl

                  bg-[#00ff88]/10

                  flex
                  items-center
                  justify-center
                "
              >

                <KeyRound
                  size={22}
                  className="text-[#00ff88]"
                />

              </div>


              {pinConfigured ? (

                <CheckCircle2
                  size={20}
                  className="text-[#00ff88]"
                />

              ) : (

                <Circle
                  size={20}
                  className="text-gray-600"
                />

              )}

            </div>


            <h4
              className="
                text-white
                font-semibold
                mt-5
              "
            >
              PIN
            </h4>


            <p
              className={`
                text-xs
                mt-1
                font-semibold

                ${
                  pinConfigured
                    ? 'text-[#00ff88]'
                    : 'text-gray-500'
                }
              `}
            >
              {pinConfigured
                ? 'CONFIGURADO'
                : 'SIN CONFIGURAR'}
            </p>


            {!pinConfigured ? (

              <div className="mt-4 space-y-3">

                <div className="relative">

                  <input
                    type={
                      showPin
                        ? 'text'
                        : 'password'
                    }
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {

                      const value =
                        e.target.value.replace(
                          /\D/g,
                          ''
                        );

                      setPin(value);

                      setPinError('');

                    }}
                    placeholder="PIN de 6 dígitos"
                    className="
                      w-full

                      bg-[#101010]

                      border
                      border-[#2a2a2a]

                      rounded-xl

                      px-4
                      py-2.5
                      pr-10

                      text-white

                      outline-none

                      focus:border-[#00ff88]
                    "
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowPin(
                        prev => !prev
                      )
                    }
                    className="
                      absolute

                      right-3
                      top-1/2

                      -translate-y-1/2

                      text-gray-500

                      hover:text-white
                    "
                  >

                    {showPin ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}

                  </button>

                </div>


                <input
                  type={
                    showPin
                      ? 'text'
                      : 'password'
                  }
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => {

                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ''
                      );

                    setConfirmPin(value);

                    setPinError('');

                  }}
                  placeholder="Confirmar PIN"
                  className="
                    w-full

                    bg-[#101010]

                    border
                    border-[#2a2a2a]

                    rounded-xl

                    px-4
                    py-2.5

                    text-white

                    outline-none

                    focus:border-[#00ff88]
                  "
                />


                {pinError && (

                  <p
                    className="
                      text-red-400
                      text-xs
                    "
                  >
                    {pinError}
                  </p>

                )}


                <button
                  type="button"
                  onClick={
                    handleConfigurePin
                  }
                  className="
                    w-full

                    bg-[#00ff88]

                    text-black

                    font-bold
                    text-sm

                    rounded-xl

                    py-2.5

                    hover:bg-[#00cc6a]

                    transition
                  "
                >
                  Configurar PIN
                </button>

              </div>

            ) : (

              <button
                type="button"
                onClick={handleRemovePin}
                className="
                  mt-4

                  text-gray-400
                  text-xs

                  hover:text-white
                "
              >
                Cambiar PIN
              </button>

            )}

          </div>


          {/* ================================================= */}
          {/* ROSTRO */}
          {/* ================================================= */}

          <div
            className={`
              bg-[#171717]

              border

              rounded-2xl

              p-5

              ${
                faceRegistered
                  ? 'border-[#00ff88]/30'
                  : 'border-[#2a2a2a]'
              }
            `}
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div
                className="
                  w-11
                  h-11

                  rounded-xl

                  bg-[#00ff88]/10

                  flex
                  items-center
                  justify-center
                "
              >

                <ScanFace
                  size={23}
                  className="text-[#00ff88]"
                />

              </div>


              {faceRegistered ? (

                <CheckCircle2
                  size={20}
                  className="text-[#00ff88]"
                />

              ) : (

                <Circle
                  size={20}
                  className="text-gray-600"
                />

              )}

            </div>


            <h4
              className="
                text-white
                font-semibold
                mt-5
              "
            >
              Reconocimiento facial
            </h4>


            <p
              className={`
                text-xs
                mt-1
                font-semibold

                ${
                  faceRegistered
                    ? 'text-[#00ff88]'
                    : 'text-gray-500'
                }
              `}
            >

              {faceRegistered
                ? 'REGISTRADO'
                : 'SIN REGISTRAR'}

            </p>


            <p
              className="
                text-gray-500
                text-xs
                mt-3
              "
            >
              Permite identificar al miembro utilizando
              la cámara del acceso.
            </p>


            <button
              type="button"
              onClick={
                handleOpenFaceRegister
              }
              className={`
                w-full

                mt-4

                rounded-xl

                py-2.5

                font-semibold
                text-sm

                border

                transition

                ${
                  faceRegistered
                    ? 'border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5'
                    : 'border-[#2a2a2a] text-white hover:border-[#00ff88]'
                }
              `}
            >

              {faceRegistered
                ? 'Actualizar rostro'
                : 'Registrar rostro'}

            </button>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* ERROR GUARDADO */}
      {/* ================================================= */}

      {saveError && (

        <div
          className="
            flex
            items-center
            gap-3

            bg-red-500/10

            border
            border-red-500/20

            rounded-xl

            p-4
          "
        >

          <AlertTriangle
            size={20}
            className="text-red-400"
          />


          <p
            className="
              text-red-300
              text-sm
            "
          >
            {saveError}
          </p>

        </div>

      )}


      {/* ================================================= */}
      {/* BOTONES */}
      {/* ================================================= */}

      <div
        className="
          flex
          items-center
          justify-between

          gap-4
        "
      >

        <button
          type="button"
          onClick={onBack}
          className="
            px-6
            py-3

            bg-[#171717]

            border
            border-[#2a2a2a]

            text-gray-300

            rounded-xl

            hover:border-[#00ff88]

            transition
          "
        >
          Atrás
        </button>


        <button
          type="button"
          onClick={handleSaveMember}
          disabled={isSaving}
          className="
            px-7
            py-3

            bg-[#00ff88]

            text-black

            font-bold

            rounded-xl

            flex
            items-center
            gap-2

            hover:bg-[#00cc6a]

            hover:shadow-[0_0_25px_rgba(0,255,136,0.25)]

            transition

            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >

          {isSaving ? (

            <>
              <RefreshCw
                size={18}
                className="animate-spin"
              />

              Guardando...
            </>

          ) : (

            <>
              <ShieldCheck size={18} />

              Finalizar registro
            </>

          )}

        </button>

      </div>


      {/* ================================================= */}
      {/* MODAL REGISTRO FACIAL */}
      {/* ================================================= */}

      {showFaceModal && (

        <div
          className="
            fixed
            inset-0
            z-[100]

            bg-black/80
            backdrop-blur-sm

            flex
            items-center
            justify-center

            p-4
          "
        >

          <div
            className="
              w-full
              max-w-[520px]

              bg-[#111111]

              border
              border-[#2a2a2a]

              rounded-3xl

              p-7

              shadow-2xl
            "
          >


            <div className="text-center">

              <div
                className="
                  w-16
                  h-16

                  mx-auto

                  rounded-2xl

                  bg-[#00ff88]/10

                  flex
                  items-center
                  justify-center
                "
              >

                <ScanFace
                  size={32}
                  className="text-[#00ff88]"
                />

              </div>


              <h2
                className="
                  text-white
                  text-xl
                  font-bold

                  mt-4
                "
              >
                Registrar reconocimiento facial
              </h2>


              <p
                className="
                  text-gray-400
                  text-sm
                  mt-2
                "
              >
                Registra el rostro de {fullName} para
                utilizarlo como método de acceso.
              </p>

            </div>


            {/* CÁMARA PLACEHOLDER */}

            <div
              className="
                relative

                mt-6

                aspect-video

                bg-black

                border
                border-[#2a2a2a]

                rounded-2xl

                overflow-hidden

                flex
                items-center
                justify-center
              "
            >

              <Camera
                size={52}
                className="text-gray-700"
              />


              <div
                className="
                  absolute

                  w-36
                  h-48

                  border-2
                  border-[#00ff88]

                  rounded-[50%]

                  shadow-[0_0_30px_rgba(0,255,136,0.18)]
                "
              />


              <div
                className="
                  absolute
                  bottom-4

                  bg-black/70

                  px-4
                  py-2

                  rounded-full

                  text-xs
                  text-gray-300
                "
              >
                {faceInstructions[faceStep].title}
              </div>

            </div>


            {/* PROGRESO */}

            <div
              className="
                grid
                grid-cols-3

                gap-2

                mt-5
              "
            >

              {faceInstructions.map(
                (item, index) => (

                  <div
                    key={item.title}
                    className={`
                      h-1.5

                      rounded-full

                      ${
                        index <= faceStep
                          ? 'bg-[#00ff88]'
                          : 'bg-[#272727]'
                      }
                    `}
                  />

                )
              )}

            </div>


            <p
              className="
                text-gray-400
                text-sm
                text-center

                mt-4
              "
            >
              {faceInstructions[faceStep].description}
            </p>


            {/* CONSENTIMIENTO */}

            <label
              className="
                flex
                items-start
                gap-3

                mt-6

                bg-[#171717]

                border
                border-[#2a2a2a]

                p-4

                rounded-xl

                cursor-pointer
              "
            >

              <input
                type="checkbox"
                checked={biometricConsent}
                onChange={(e) =>
                  setBiometricConsent(
                    e.target.checked
                  )
                }
                className="
                  mt-1

                  accent-[#00ff88]
                "
              />


              <div>

                <p
                  className="
                    text-white
                    text-sm
                    font-medium
                  "
                >
                  Consentimiento biométrico
                </p>


                <p
                  className="
                    text-gray-500
                    text-xs
                    mt-1
                  "
                >
                  El miembro autoriza el uso de sus
                  datos biométricos exclusivamente
                  para validar su acceso al gimnasio.
                </p>

              </div>

            </label>


            {/* BOTONES */}

            <div
              className="
                flex
                gap-3

                mt-6
              "
            >

              <button
                type="button"
                onClick={() =>
                  setShowFaceModal(false)
                }
                className="
                  flex-1

                  border
                  border-[#2a2a2a]

                  bg-[#171717]

                  text-gray-300

                  rounded-xl

                  py-3

                  hover:border-[#00ff88]

                  transition
                "
              >
                Cancelar
              </button>


              <button
                type="button"
                onClick={handleFaceCapture}
                disabled={
                  !biometricConsent ||
                  isFaceProcessing
                }
                className="
                  flex-1

                  bg-[#00ff88]

                  text-black

                  font-bold

                  rounded-xl

                  py-3

                  flex
                  items-center
                  justify-center
                  gap-2

                  disabled:opacity-40
                  disabled:cursor-not-allowed
                "
              >

                {isFaceProcessing ? (

                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />

                    Procesando...
                  </>

                ) : (

                  <>
                    <ScanFace size={18} />

                    {faceStep === 2
                      ? 'Finalizar'
                      : 'Capturar'}
                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};

export default MemberAccessStep;