// src/components/Access/AccessControlPage.jsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';

import { useNavigate } from 'react-router-dom';

import QRScanner from './QRScanner';
import ErrorBoundary from './ErrorBoundary';

import {
  QrCode,
  Scan,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Shield,
  Camera,
  ArrowLeft
} from 'lucide-react';

import {
  getMemberByQRToken
} from '../../utils/memberId';


// ======================================================
// COMPONENTE
// ======================================================

const AccessControlPage = () => {

  const navigate =
    useNavigate();


  // ====================================================
  // ESTADOS
  // ====================================================

  const [
    currentTime,
    setCurrentTime
  ] = useState(
    new Date()
  );


  const [
    scanStatus,
    setScanStatus
  ] = useState(
    'waiting'
  );


  const [
    memberData,
    setMemberData
  ] = useState(
    null
  );


  const [
    countdown,
    setCountdown
  ] = useState(0);


  const [
    isEntry,
    setIsEntry
  ] = useState(true);


  const [
    scannerLine,
    setScannerLine
  ] = useState(0);


  const [
    cameraError,
    setCameraError
  ] = useState(false);


  const [
    isCameraReady,
    setIsCameraReady
  ] = useState(false);


  const [
    isProcessing,
    setIsProcessing
  ] = useState(false);


  const [
    qrData,
    setQrData
  ] = useState(null);


  const [
    facingMode,
    setFacingMode
  ] = useState(
    'environment'
  );


  const lastScanRef =
    useRef(null);


  const scannerKeyRef =
    useRef(0);


  // ====================================================
  // HORA
  // ====================================================

  useEffect(() => {

    const timer =
      setInterval(
        () => {

          setCurrentTime(
            new Date()
          );

        },
        1000
      );


    return () =>
      clearInterval(timer);

  }, []);


  // ====================================================
  // LÍNEA DE ESCÁNER
  // ====================================================

  useEffect(() => {

    if (
      scanStatus !== 'waiting' &&
      scanStatus !== 'scanning'
    ) {

      return;

    }


    const interval =
      setInterval(
        () => {

          setScannerLine(
            (previous) =>
              (
                previous +
                2
              ) %
              100
          );

        },
        50
      );


    return () =>
      clearInterval(
        interval
      );

  }, [
    scanStatus
  ]);


  // ====================================================
  // CÁMARA READY
  // ====================================================

  const handleCameraReady =
    useCallback(() => {

      setIsCameraReady(
        true
      );


      setCameraError(
        false
      );

    }, []);


  // ====================================================
  // ERROR CÁMARA
  // ====================================================

  const handleCameraError =
    useCallback(
      (error) => {

        console.error(
          'Error de cámara:',
          error
        );


        setCameraError(
          true
        );


        setIsCameraReady(
          false
        );

      },
      []
    );


  // ====================================================
  // CALCULAR ESTADO DE SUSCRIPCIÓN
  // ====================================================

  const getSubscriptionState = (
    member
  ) => {

    if (
      member?.accessBlocked
    ) {

      return {
        status: 'blocked',
        daysRemaining: 0
      };

    }


    const subscription =
      member?.subscription;


    if (
      !subscription ||
      subscription.status !==
        'active'
    ) {

      return {
        status: 'expired',
        daysRemaining: 0
      };

    }


    const endDateRaw =
      subscription.endDate;


    if (!endDateRaw) {

      return {
        status: 'active',
        daysRemaining: null
      };

    }


    const endDate =
      new Date(
        endDateRaw
      );


    if (
      Number.isNaN(
        endDate.getTime()
      )
    ) {

      return {
        status: 'active',
        daysRemaining: null
      };

    }


    const now =
      new Date();


    const difference =
      endDate.getTime() -
      now.getTime();


    const daysRemaining =
      Math.ceil(
        difference /
        (
          1000 *
          60 *
          60 *
          24
        )
      );


    if (
      daysRemaining <
      0
    ) {

      return {
        status: 'expired',
        daysRemaining: 0
      };

    }


    if (
      daysRemaining <=
      5
    ) {

      return {
        status: 'warning',
        daysRemaining
      };

    }


    return {
      status: 'active',
      daysRemaining
    };

  };


  // ====================================================
  // PROCESAR QR REAL
  // ====================================================

  const processQRData =
    useCallback(
      (rawData) => {

        try {

          let decoded;


          // ==============================================
          // QR DEBE SER JSON
          // ==============================================

          try {

            decoded =
              JSON.parse(
                rawData
              );

          } catch {

            console.warn(
              'QR inválido:',
              rawData
            );


            setMemberData(
              null
            );


            setScanStatus(
              'unrecognized'
            );


            setCountdown(
              4
            );


            return;

          }


          // ==============================================
          // VALIDAR ESTRUCTURA
          // ==============================================

          if (
            decoded?.type !==
              'GYM_CONTROL_ACCESS' ||
            !decoded?.memberId ||
            !decoded?.token
          ) {

            console.warn(
              'QR con formato inválido:',
              decoded
            );


            setMemberData(
              null
            );


            setScanStatus(
              'unrecognized'
            );


            setCountdown(
              4
            );


            return;

          }


          const memberId =
            decoded.memberId;


          const token =
            decoded.token;


          // ==============================================
          // BUSCAR ID + TOKEN
          // ==============================================

          const member =
            getMemberByQRToken(
              memberId,
              token
            );


          // ==============================================
          // NO EXISTE
          // ==============================================

          if (!member) {

            console.warn(
              'QR no pertenece a ningún miembro:',
              memberId
            );


            setMemberData(
              null
            );


            setScanStatus(
              'unrecognized'
            );


            setCountdown(
              4
            );


            return;

          }


          // ==============================================
          // ESTADO DE SUSCRIPCIÓN
          // ==============================================

          const subscriptionState =
            getSubscriptionState(
              member
            );


          const fullName =
            `${
              member.firstName ||
              ''
            } ${
              member.lastName ||
              ''
            }`.trim() ||
            'Miembro';


          const currentlyInside =
            Boolean(
              member.isInside
            );


          const entering =
            !currentlyInside;


          const endDate =
            member
              ?.subscription
              ?.endDate ||
            'No disponible';


          // ==============================================
          // MOSTRAR MIEMBRO
          // ==============================================

          setMemberData({

            ...member,

            name:
              fullName,

            status:
              subscriptionState.status,

            daysRemaining:
              subscriptionState.daysRemaining,

            expiryDate:
              endDate,

            entryTime:
              new Date()
                .toLocaleTimeString(
                  'es-MX',
                  {
                    hour:
                      '2-digit',

                    minute:
                      '2-digit'
                  }
                )

          });


          setIsEntry(
            entering
          );


          // ==============================================
          // ESTADO VISUAL
          // ==============================================

          if (
            subscriptionState.status ===
            'active'
          ) {

            setScanStatus(
              'success'
            );

          } else if (
            subscriptionState.status ===
            'warning'
          ) {

            setScanStatus(
              'warning'
            );

          } else {

            setScanStatus(
              'error'
            );

          }


          setCountdown(
            4
          );


          // ==============================================
          // ACTUALIZAR ENTRADA/SALIDA
          //
          // Posteriormente esto debe ir al backend.
          // =================================================

          if (
            subscriptionState.status ===
              'active' ||
            subscriptionState.status ===
              'warning'
          ) {

            try {

              const members =
                JSON.parse(
                  localStorage.getItem(
                    'gym_control_members'
                  ) ||
                  '[]'
                );


              const updated =
                members.map(
                  (storedMember) => {

                    if (
                      storedMember.id !==
                      member.id
                    ) {

                      return storedMember;

                    }


                    return {

                      ...storedMember,

                      isInside:
                        entering,

                      lastAccessAt:
                        new Date()
                          .toISOString()

                    };

                  }
                );


              localStorage.setItem(
                'gym_control_members',
                JSON.stringify(
                  updated
                )
              );

            } catch (error) {

              console.error(
                'Error actualizando acceso:',
                error
              );

            }

          }

        } catch (error) {

          console.error(
            'Error procesando QR:',
            error
          );


          setMemberData(
            null
          );


          setScanStatus(
            'unrecognized'
          );


          setCountdown(
            4
          );

        }

      },
      []
    );


  // ====================================================
  // ESCANEO
  // ====================================================

  const handleScan =
    useCallback(
      (data) => {

        if (
          !data ||
          isProcessing
        ) {

          return;

        }


        const now =
          Date.now();


        if (
          lastScanRef.current &&
          now -
            lastScanRef.current <
            3000
        ) {

          return;

        }


        lastScanRef.current =
          now;


        setIsProcessing(
          true
        );


        setScanStatus(
          'scanning'
        );


        setQrData(
          data
        );


        setTimeout(
          () => {

            processQRData(
              data
            );


            setIsProcessing(
              false
            );

          },
          700
        );

      },
      [
        isProcessing,
        processQRData
      ]
    );


  // ====================================================
  // RESET AUTOMÁTICO
  // ====================================================

  useEffect(() => {

    if (
      countdown >
        0 &&
      scanStatus !==
        'waiting' &&
      scanStatus !==
        'scanning'
    ) {

      const timer =
        setTimeout(
          () => {

            setCountdown(
              (previous) =>
                previous - 1
            );

          },
          1000
        );


      return () =>
        clearTimeout(timer);

    }


    if (
      countdown ===
        0 &&
      scanStatus !==
        'waiting' &&
      scanStatus !==
        'scanning'
    ) {

      const timer =
        setTimeout(
          () => {

            setScanStatus(
              'waiting'
            );


            setMemberData(
              null
            );


            setQrData(
              null
            );


            setIsProcessing(
              false
            );

          },
          500
        );


      return () =>
        clearTimeout(timer);

    }

  }, [
    countdown,
    scanStatus
  ]);


  // ====================================================
  // CAMBIAR CÁMARA
  // ====================================================

  const toggleCamera =
    () => {

      setFacingMode(
        (previous) =>
          previous ===
          'environment'
            ? 'user'
            : 'environment'
      );


      setIsCameraReady(
        false
      );


      setCameraError(
        false
      );


      scannerKeyRef.current +=
        1;

    };


  // ====================================================
  // STATUS
  // ====================================================

  const getStatusDisplay =
    () => {

      switch (
        scanStatus
      ) {

        case 'waiting':

          return {
            icon:
              <QrCode
                size={64}
                className="text-gray-500"
              />,

            title:
              'Listo para escanear',

            subtitle:
              'Acerca tu código QR',

            color:
              'text-[#00ff88]'
          };


        case 'scanning':

          return {
            icon:
              <div className="
                w-12 h-12
                border-4
                border-[#00ff88]
                border-t-transparent
                rounded-full
                animate-spin
              " />,

            title:
              'Código detectado',

            subtitle:
              'Validando acceso...',

            color:
              'text-[#00ff88]'
          };


        case 'success':

          return {
            icon:
              <CheckCircle
                size={64}
                className="text-[#00ff88]"
              />,

            title:
              'ACCESO PERMITIDO',

            subtitle:
              `¡Bienvenido, ${
                memberData?.name ||
                'Miembro'
              }!`,

            color:
              'text-[#00ff88]'
          };


        case 'warning':

          return {
            icon:
              <CheckCircle
                size={64}
                className="text-yellow-500"
              />,

            title:
              'ACCESO PERMITIDO',

            subtitle:
              `¡Bienvenido, ${
                memberData?.name ||
                'Miembro'
              }!`,

            color:
              'text-yellow-500'
          };


        case 'error':

          return {
            icon:
              <XCircle
                size={64}
                className="text-red-500"
              />,

            title:
              'ACCESO NO DISPONIBLE',

            subtitle:
              memberData?.name ||
              'Miembro',

            color:
              'text-red-500'
          };


        case 'unrecognized':

          return {
            icon:
              <AlertCircle
                size={64}
                className="text-yellow-500"
              />,

            title:
              'Código no reconocido',

            subtitle:
              'El QR no pertenece a un miembro registrado',

            color:
              'text-yellow-500'
          };


        default:

          return {
            icon:
              <QrCode
                size={64}
                className="text-gray-500"
              />,

            title:
              'Listo para escanear',

            subtitle:
              'Acerca tu código QR',

            color:
              'text-[#00ff88]'
          };

      }

    };


  const statusDisplay =
    getStatusDisplay();


  // ====================================================
  // SCANNER
  // ====================================================

  const renderScanner =
    () => (

      <div className="
        relative
        w-80 h-80
        bg-black
        border-2
        border-[#2a2a2a]
        rounded-2xl
        overflow-hidden
      ">

        <div className="
          absolute
          inset-0
          z-0
        ">
          <ErrorBoundary>
            <QRScanner
              key={`${scannerKeyRef.current}-${facingMode}`}
              onScan={handleScan}
              onError={handleCameraError}
              onReady={handleCameraReady}
              facingMode={facingMode}
            />
          </ErrorBoundary>
        </div>


        <div className="
          absolute
          top-5 left-5
          w-16 h-16
          border-t-4
          border-l-4
          border-[#00ff88]
          rounded-tl-xl
          z-20
          pointer-events-none
        " />


        <div className="
          absolute
          top-5 right-5
          w-16 h-16
          border-t-4
          border-r-4
          border-[#00ff88]
          rounded-tr-xl
          z-20
          pointer-events-none
        " />


        <div className="
          absolute
          bottom-5 left-5
          w-16 h-16
          border-b-4
          border-l-4
          border-[#00ff88]
          rounded-bl-xl
          z-20
          pointer-events-none
        " />


        <div className="
          absolute
          bottom-5 right-5
          w-16 h-16
          border-b-4
          border-r-4
          border-[#00ff88]
          rounded-br-xl
          z-20
          pointer-events-none
        " />


        {(
          scanStatus ===
            'waiting' ||
          scanStatus ===
            'scanning'
        ) && (
          <div
            className="
              absolute
              left-8 right-8
              h-[2px]
              bg-[#00ff88]
              shadow-[0_0_15px_rgba(0,255,136,0.8)]
              z-20
              pointer-events-none
            "
            style={{
              top:
                `${scannerLine}%`
            }}
          />
        )}


        <button
          type="button"
          onClick={
            toggleCamera
          }
          className="
            absolute
            bottom-3 left-3
            bg-black/80
            backdrop-blur-sm
            p-2
            rounded-lg
            hover:bg-black
            z-30
          "
          title="Cambiar cámara"
        >
          <Camera
            size={18}
            className="text-white"
          />
        </button>


        {scanStatus ===
          'waiting' && (
          <div className="
            absolute
            bottom-3
            left-0 right-0
            text-center
            pointer-events-none
            z-20
          ">
            <span className="
              inline-block
              bg-black/80
              text-gray-200
              text-xs
              px-4 py-2
              rounded-lg
            ">
              Coloca el QR dentro del recuadro
            </span>
          </div>
        )}
      </div>

    );


  // ====================================================
  // SUCCESS
  // ====================================================

  const renderSuccessContent =
    () => (

      <div className="
        text-center
        max-w-md
        mx-auto
      ">
        <div className="
          mb-4
          animate-bounce-in
        ">
          <div className="
            w-24 h-24
            rounded-full
            bg-[#00ff88]/10
            flex items-center
            justify-center
            mx-auto
          ">
            {statusDisplay.icon}
          </div>
        </div>


        <h1
          className={`
            text-4xl
            font-bold
            ${statusDisplay.color}
            mb-2
          `}
        >
          {statusDisplay.title}
        </h1>


        <p className="
          text-white
          text-xl
          mb-1
        ">
          {statusDisplay.subtitle}
        </p>


        {memberData && (
          <>
            <div className="
              flex
              items-center
              justify-center
              gap-3
              my-4
            ">
              <div className="
                w-16 h-16
                rounded-full
                bg-[#1a1a1a]
                border-2
                border-[#2a2a2a]
                flex items-center
                justify-center
                overflow-hidden
              ">
                {memberData.profilePhoto ? (
                  <img
                    src={
                      memberData.profilePhoto
                    }
                    alt={
                      memberData.name
                    }
                    className="
                      w-full h-full
                      object-cover
                    "
                  />
                ) : (
                  <User
                    size={32}
                    className="
                      text-gray-400
                    "
                  />
                )}
              </div>


              <div className="
                text-left
              ">
                <p className="
                  text-white
                  font-medium
                ">
                  {memberData.name}
                </p>

                <p className="
                  text-[#00ff88]
                  text-sm
                  font-mono
                ">
                  {memberData.id}
                </p>

                <p className="
                  text-gray-400
                  text-sm
                ">
                  {isEntry
                    ? 'Entrada registrada'
                    : 'Salida registrada'}
                </p>
              </div>
            </div>


            <div className="
              bg-[#1a1a1a]
              rounded-xl
              p-4
              mb-4
            ">
              <div className="
                flex items-center
                justify-between
                text-sm
              ">
                <span className="
                  text-gray-400
                ">
                  Hora
                </span>

                <span className="
                  text-white
                  font-medium
                ">
                  {memberData.entryTime}
                </span>
              </div>


              <div className="
                flex items-center
                justify-between
                text-sm
                mt-1
              ">
                <span className="
                  text-gray-400
                ">
                  Estado
                </span>

                <span className="
                  text-[#00ff88]
                ">
                  ✓ Suscripción activa
                </span>
              </div>
            </div>


            {scanStatus ===
              'warning' && (
              <div className="
                bg-yellow-500/10
                border
                border-yellow-500/20
                rounded-xl
                p-4
                mb-4
              ">
                <div className="
                  flex items-center
                  gap-2
                  mb-1
                ">
                  <Calendar
                    size={16}
                    className="
                      text-yellow-500
                    "
                  />

                  <span className="
                    text-yellow-500
                    font-medium
                  ">
                    Tu suscripción vence pronto
                  </span>
                </div>

                <p className="
                  text-gray-300
                  text-sm
                ">
                  Te quedan{' '}

                  <span className="
                    text-yellow-500
                    font-bold
                  ">
                    {memberData.daysRemaining} días
                  </span>
                  {' '}de acceso.
                </p>

                <p className="
                  text-gray-400
                  text-xs
                  mt-1
                ">
                  Vence: {memberData.expiryDate}
                </p>
              </div>
            )}
          </>
        )}


        <div className="mt-4">
          <div className="
            flex items-center
            justify-center
            gap-2
            text-sm
            text-gray-400
          ">
            <span>
              Preparando siguiente acceso...
            </span>

            <div className="
              w-24 h-1
              bg-[#1a1a1a]
              rounded-full
              overflow-hidden
            ">
              <div
                className="
                  h-full
                  bg-[#00ff88]
                  rounded-full
                  transition-all
                  duration-1000
                "
                style={{
                  width:
                    `${
                      (
                        (
                          4 -
                          countdown
                        ) /
                        4
                      ) *
                      100
                    }%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

    );


  // ====================================================
  // ERROR
  // ====================================================

  const renderErrorContent =
    () => (

      <div className="
        text-center
        max-w-md
        mx-auto
      ">
        <div className="
          mb-4
          animate-bounce-in
        ">
          <div className="
            w-24 h-24
            rounded-full
            bg-red-500/10
            flex items-center
            justify-center
            mx-auto
          ">
            {statusDisplay.icon}
          </div>
        </div>


        <h1
          className={`
            text-4xl
            font-bold
            ${statusDisplay.color}
            mb-2
          `}
        >
          {statusDisplay.title}
        </h1>


        <p className="
          text-white
          text-xl
        ">
          {statusDisplay.subtitle}
        </p>


        <div className="
          bg-red-500/10
          border
          border-red-500/20
          rounded-xl
          p-4
          mt-4
        ">
          <p className="
            text-gray-300
            text-sm
          ">
            La suscripción no permite ingresar en este momento.
          </p>

          <div className="
            flex items-center
            gap-2
            mt-3
            justify-center
          ">
            <Shield
              size={18}
              className="
                text-gray-400
              "
            />

            <span className="
              text-gray-300
              text-sm
            ">
              Acércate a recepción
            </span>
          </div>
        </div>
      </div>

    );


  // ====================================================
  // NO RECONOCIDO
  // ====================================================

  const renderUnrecognizedContent =
    () => (

      <div className="
        text-center
        max-w-md
        mx-auto
      ">
        <div className="
          mb-4
          animate-bounce-in
        ">
          <div className="
            w-24 h-24
            rounded-full
            bg-yellow-500/10
            flex items-center
            justify-center
            mx-auto
          ">
            {statusDisplay.icon}
          </div>
        </div>


        <h1
          className={`
            text-3xl
            font-bold
            ${statusDisplay.color}
            mb-2
          `}
        >
          {statusDisplay.title}
        </h1>


        <p className="
          text-gray-300
          text-lg
          mb-2
        ">
          {statusDisplay.subtitle}
        </p>


        <p className="
          text-gray-400
          text-sm
          mb-4
        ">
          Intenta nuevamente o solicita ayuda en recepción.
        </p>


        <button
          onClick={() => {
            setScanStatus(
              'waiting'
            );

            setMemberData(
              null
            );

            setQrData(
              null
            );

            setIsProcessing(
              false
            );
          }}
          className="
            px-6 py-2
            bg-[#00ff88]
            text-black
            rounded-xl
            font-bold
            hover:bg-[#00cc6a]
          "
        >
          Intentar nuevamente
        </button>
      </div>

    );


  // ====================================================
  // RENDER
  // ====================================================

  return (

    <div className="
      min-h-screen
      bg-[#0a0a0a]
      flex flex-col
    ">

      {/* HEADER */}

      <header className="
        px-6 py-4
        border-b
        border-[#1a1a1a]

        flex items-center
        justify-between
        flex-wrap gap-2

        bg-[#0a0a0a]
      ">
        <div className="
          flex items-center
          gap-3
        ">
          <button
            onClick={() =>
              navigate(
                '/dashboard'
              )
            }
            className="
              p-2
              bg-[#1a1a1a]
              border
              border-[#2a2a2a]
              rounded-xl
              text-gray-400
              hover:border-[#00ff88]
              hover:text-white
            "
          >
            <ArrowLeft size={20} />
          </button>


          <div>
            <h1 className="
              text-white
              text-lg
              font-bold
            ">
              GYM CONTROL
            </h1>

            <p className="
              text-gray-500
              text-xs
            ">
              Smart Access
            </p>
          </div>
        </div>


        <div className="
          flex items-center
          gap-4
        ">
          <div className="
            text-right
          ">
            <p className="
              text-white
              font-medium
            ">
              {currentTime.toLocaleTimeString(
                'es-MX',
                {
                  hour:
                    '2-digit',

                  minute:
                    '2-digit'
                }
              )}
            </p>

            <p className="
              text-gray-400
              text-xs
            ">
              {currentTime.toLocaleDateString(
                'es-MX',
                {
                  weekday:
                    'long',

                  day:
                    'numeric',

                  month:
                    'long'
                }
              )}
            </p>
          </div>


          <div className="
            flex items-center
            gap-2
          ">
            <span
              className={`
                w-2 h-2
                rounded-full

                ${
                  !cameraError &&
                  isCameraReady

                    ? `
                      bg-[#00ff88]
                      animate-pulse
                    `

                    : `
                      bg-yellow-500
                    `
                }
              `}
            />

            <span
              className={
                !cameraError &&
                isCameraReady
                  ? 'text-[#00ff88] text-xs'
                  : 'text-yellow-500 text-xs'
              }
            >
              {!cameraError &&
              isCameraReady
                ? 'Sistema disponible'
                : 'Iniciando...'}
            </span>
          </div>
        </div>
      </header>


      {/* CONTENIDO */}

      <main className="
        flex-1

        flex flex-col
        items-center
        justify-center

        p-6

        bg-gradient-to-b
        from-[#0a0a0a]
        to-[#0d0d0d]
      ">

        {(
          scanStatus ===
            'waiting' ||
          scanStatus ===
            'scanning'
        ) ? (
          <>
            <div className="
              text-center
              mb-8
            ">
              <h1 className="
                text-4xl
                font-bold
                text-white
                mb-2
              ">
                Bienvenido
              </h1>

              <p className="
                text-gray-300
                text-lg
              ">
                Escanea tu código QR para registrar tu acceso
              </p>

              <p className="
                text-gray-500
                text-sm
              ">
                Acerca tu código al lector.
              </p>
            </div>


            {renderScanner()}


            <div className="
              mt-6

              flex items-center
              gap-2

              text-gray-400
              text-sm
            ">
              <Scan size={18} />

              <span>
                También puedes acercar tu credencial al lector
              </span>
            </div>


            {qrData &&
              scanStatus ===
                'scanning' && (
                <p className="
                  text-gray-500
                  text-xs
                  mt-4
                ">
                  Validando código...
                </p>
              )}
          </>

        ) : scanStatus ===
            'success' ||
          scanStatus ===
            'warning' ? (

          renderSuccessContent()

        ) : scanStatus ===
          'error' ? (

          renderErrorContent()

        ) : (

          renderUnrecognizedContent()

        )}

      </main>


      {/* FOOTER */}

      <footer className="
        px-6 py-3

        border-t
        border-[#1a1a1a]

        flex items-center
        justify-between
        flex-wrap gap-2

        bg-[#0a0a0a]
      ">
        <div className="
          flex items-center
          gap-2
        ">
          <Shield
            size={16}
            className="
              text-gray-500
            "
          />

          <span className="
            text-gray-400
            text-xs
          ">
            Acceso seguro
          </span>

          <span className="
            text-gray-500
            text-xs
          ">
            •
          </span>

          <span className="
            text-gray-500
            text-xs
          ">
            El QR se valida contra el miembro registrado y su token de acceso.
          </span>
        </div>

        <span className="
          text-gray-500
          text-xs
        ">
          GYM CONTROL © 2026
        </span>
      </footer>


      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }

          60% {
            transform: scale(1.1);
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation:
            bounce-in
            0.5s
            ease-out
            forwards;
        }
      `}</style>

    </div>

  );
};


export default AccessControlPage;