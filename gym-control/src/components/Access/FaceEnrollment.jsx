// src/components/Access/FaceEnrollment.jsx

import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ScanFace,
  ShieldCheck,
  X
} from 'lucide-react';

import {
  detectFace,
  initializeFaceEngine
} from '../../services/faceService';


// ======================================================
// CONFIGURACIÓN
// ======================================================

const SCAN_DELAY = 500;
const REQUIRED_STABLE_FRAMES = 2;


// ======================================================
// COMPONENTE
// ======================================================

const FaceEnrollment = ({
  memberId,
  memberName,
  faceId,
  onComplete,
  onCancel
}) => {

  // ====================================================
  // REFERENCIAS
  // ====================================================

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const processingRef = useRef(false);
  const completedRef = useRef(false);

  const stepRef = useRef(0);
  const samplesRef = useRef([]);
  const stableRef = useRef(0);

  // Evita problemas del montaje doble de React
  const setupIdRef = useRef(0);


  // ====================================================
  // ESTADOS
  // ====================================================

  const [loading, setLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  const [consent, setConsent] = useState(false);

  const [instruction, setInstruction] = useState(
    'Activa el consentimiento biométrico para comenzar'
  );

  const [status, setStatus] = useState('waiting');

  const [faceDetected, setFaceDetected] = useState(false);

  const [samples, setSamples] = useState([]);
  const [step, setStep] = useState(0);

  const [stableFrames, setStableFrames] = useState(0);

  const [error, setError] = useState('');

  const [debugInfo, setDebugInfo] = useState(null);


  // ====================================================
  // PASOS
  // ====================================================

  const steps = [
    'Frente',
    'Izquierda',
    'Derecha'
  ];


  // ====================================================
  // LIMPIAR TIMER
  // ====================================================

  const clearScanTimer = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };


  // ====================================================
  // DETENER STREAM
  // ====================================================

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };


  // ====================================================
  // DETENER TODO
  // ====================================================

  const stopEverything = () => {
    clearScanTimer();
    stopStream();

    processingRef.current = false;

    setCameraReady(false);
  };


  // ====================================================
  // INICIAR CÁMARA
  // ====================================================

  const startCamera = async (setupId) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Este navegador no permite utilizar la cámara.'
      );
    }

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',

          width: {
            ideal: 1280
          },

          height: {
            ideal: 720
          }
        },

        audio: false
      });


    // Si React desmontó este efecto mientras
    // getUserMedia esperaba, descartamos el stream.
    if (setupId !== setupIdRef.current) {
      stream
        .getTracks()
        .forEach((track) => track.stop());

      return false;
    }


    // Cerramos cualquier stream anterior.
    stopStream();

    streamRef.current = stream;


    const video = videoRef.current;

    if (!video) {
      stream
        .getTracks()
        .forEach((track) => track.stop());

      return false;
    }


    video.srcObject = stream;


    await new Promise((resolve) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }

      video.onloadedmetadata = () => {
        resolve();
      };
    });


    if (setupId !== setupIdRef.current) {
      stream
        .getTracks()
        .forEach((track) => track.stop());

      return false;
    }


    await video.play();


    console.log('🎥 CÁMARA LISTA:', {
      readyState: video.readyState,
      width: video.videoWidth,
      height: video.videoHeight
    });


    setCameraReady(true);

    return true;
  };


  // ====================================================
  // INICIALIZACIÓN
  // ====================================================

  useEffect(() => {
    const setupId =
      setupIdRef.current + 1;

    setupIdRef.current = setupId;


    let cancelled = false;


    // MUY IMPORTANTE
    completedRef.current = false;
    processingRef.current = false;


    const initialize = async () => {
      try {
        setLoading(true);
        setCameraReady(false);
        setError('');

        console.log(
          '🧠 Preparando reconocimiento facial...'
        );


        await initializeFaceEngine();


        if (
          cancelled ||
          setupId !== setupIdRef.current
        ) {
          return;
        }


        const started =
          await startCamera(setupId);


        if (
          !started ||
          cancelled ||
          setupId !== setupIdRef.current
        ) {
          return;
        }


        completedRef.current = false;
        processingRef.current = false;


        setLoading(false);


        console.log(
          '✅ RECONOCIMIENTO FACIAL PREPARADO'
        );

      } catch (err) {
        console.error(
          '❌ Error inicializando biometría:',
          err
        );


        if (cancelled) {
          return;
        }


        setLoading(false);


        if (err?.name === 'NotAllowedError') {
          setError(
            'Debes permitir el acceso a la cámara.'
          );
        } else if (err?.name === 'NotFoundError') {
          setError(
            'No se encontró ninguna cámara.'
          );
        } else if (err?.name === 'NotReadableError') {
          setError(
            'La cámara está siendo utilizada por otra aplicación.'
          );
        } else {
          setError(
            err?.message ||
              'No se pudo iniciar la cámara.'
          );
        }
      }
    };


    initialize();


    return () => {
      cancelled = true;

      // Invalidar cualquier inicialización anterior
      if (setupIdRef.current === setupId) {
        setupIdRef.current += 1;
      }


      clearScanTimer();
      stopStream();

      processingRef.current = false;

      /*
       * IMPORTANTE:
       *
       * NO HACER AQUÍ:
       *
       * completedRef.current = true;
       *
       * React en desarrollo puede ejecutar un
       * setup -> cleanup -> setup adicional.
       * Eso era lo que bloqueaba tu escáner.
       */
    };
  }, []);


  // ====================================================
  // GEOMETRÍA
  // ====================================================

  const getGeometry = (face) => {
    if (!face) {
      return null;
    }


    let box = face?.boxRaw;
    let normalized = true;


    if (
      !Array.isArray(box) ||
      box.length < 4
    ) {
      box = face?.box;
      normalized = false;
    }


    if (
      !Array.isArray(box) ||
      box.length < 4
    ) {
      return null;
    }


    let [
      x,
      y,
      width,
      height
    ] = box.map((value) => Number(value) || 0);


    if (
      !normalized ||
      x > 1 ||
      y > 1 ||
      width > 1 ||
      height > 1
    ) {
      const videoWidth =
        videoRef.current?.videoWidth || 1;

      const videoHeight =
        videoRef.current?.videoHeight || 1;


      x /= videoWidth;
      y /= videoHeight;

      width /= videoWidth;
      height /= videoHeight;
    }


    return {
      x,
      y,
      width,
      height,

      centerX:
        x + width / 2,

      centerY:
        y + height / 2
    };
  };


  // ====================================================
  // ÁNGULOS
  // ====================================================

  const normalizeAngle = (value) => {
    let number =
      Number(value) || 0;


    // Si viene en grados, lo convertimos.
    if (
      Math.abs(number) >
      Math.PI * 2
    ) {
      number =
        number *
        Math.PI /
        180;
    }


    return number;
  };


  // ====================================================
  // ROTACIÓN DEL ROSTRO
  // ====================================================

  const getRotation = (face) => {
    const rotation =
      face?.rotation || {};

    const angle =
      rotation?.angle || rotation;


    return {
      yaw:
        normalizeAngle(
          angle?.yaw ??
          angle?.y ??
          0
        ),

      pitch:
        normalizeAngle(
          angle?.pitch ??
          angle?.x ??
          0
        ),

      roll:
        normalizeAngle(
          angle?.roll ??
          angle?.z ??
          0
        )
    };
  };


  // ====================================================
  // FALLAR POSICIÓN
  // ====================================================

  const failPosition = (
    message,
    type = 'warning'
  ) => {
    stableRef.current = 0;

    setStableFrames(0);

    setInstruction(message);
    setStatus(type);

    return false;
  };


  // ====================================================
  // EVALUAR ROSTRO
  // ====================================================

  const evaluateFace = (face) => {
    const geometry =
      getGeometry(face);


    if (!geometry) {
      return failPosition(
        'Coloca tu rostro dentro del marco'
      );
    }


    const rotation =
      getRotation(face);


    const {
      width,
      height,
      centerX,
      centerY
    } = geometry;


    const {
      yaw,
      pitch,
      roll
    } = rotation;


    setDebugInfo({
      width:
        width.toFixed(3),

      height:
        height.toFixed(3),

      centerX:
        centerX.toFixed(3),

      centerY:
        centerY.toFixed(3),

      yaw:
        yaw.toFixed(3),

      pitch:
        pitch.toFixed(3),

      roll:
        roll.toFixed(3),

      distance:
        typeof face?.distance === 'number'
          ? face.distance.toFixed(2)
          : '—'
    });


    console.log('📐 DATOS FACIALES:', {
      width,
      height,
      centerX,
      centerY,
      yaw,
      pitch,
      roll,
      distance: face?.distance
    });


    // ==================================================
    // DISTANCIA
    // ==================================================
    //
    // Primero usamos el tamaño de la caja.
    // Es más fácil de calibrar entre webcams.
    // ==================================================

    if (width < 0.14) {
      return failPosition(
        'Acércate un poco a la cámara'
      );
    }


    if (width > 0.47) {
      return failPosition(
        'Aléjate un poco de la cámara'
      );
    }


    // ==================================================
    // HORIZONTAL
    // ==================================================

    if (centerX < 0.32) {
      return failPosition(
        'Muévete un poco hacia tu izquierda'
      );
    }


    if (centerX > 0.68) {
      return failPosition(
        'Muévete un poco hacia tu derecha'
      );
    }


    // ==================================================
    // VERTICAL
    // ==================================================

    if (centerY < 0.27) {
      return failPosition(
        'Baja un poco el rostro'
      );
    }


    if (centerY > 0.73) {
      return failPosition(
        'Sube un poco el rostro'
      );
    }


    // ==================================================
    // INCLINACIÓN
    // ==================================================

    if (Math.abs(roll) > 0.65) {
      return failPosition(
        'Endereza un poco la cabeza'
      );
    }


    if (Math.abs(pitch) > 0.65) {
      return failPosition(
        'Mira al nivel de la cámara'
      );
    }


    const currentStep =
      stepRef.current;


    // ==================================================
    // PASO 0 - FRENTE
    // ==================================================

    if (currentStep === 0) {
      if (Math.abs(yaw) > 0.32) {
        return failPosition(
          'Mira directamente hacia la cámara',
          'info'
        );
      }
    }


    // ==================================================
    // PASO 1 - IZQUIERDA
    // ==================================================

    if (currentStep === 1) {
      if (yaw > -0.05) {
        return failPosition(
          'Gira lentamente tu rostro hacia la izquierda',
          'info'
        );
      }


      if (yaw < -0.8) {
        return failPosition(
          'Giraste demasiado. Regresa un poco'
        );
      }
    }


    // ==================================================
    // PASO 2 - DERECHA
    // ==================================================

    if (currentStep === 2) {
      if (yaw < 0.05) {
        return failPosition(
          'Gira lentamente tu rostro hacia la derecha',
          'info'
        );
      }


      if (yaw > 0.8) {
        return failPosition(
          'Giraste demasiado. Regresa un poco'
        );
      }
    }


    return true;
  };


  // ====================================================
  // GUARDAR MUESTRA
  // ====================================================

  const saveSample = (embedding) => {
    if (!embedding) {
      return;
    }


    const updated = [
      ...samplesRef.current,
      Array.from(embedding)
    ];


    samplesRef.current = updated;

    setSamples(updated);


    stableRef.current = 0;

    setStableFrames(0);


    console.log(
      `📸 CAPTURA ${updated.length}/3 GUARDADA`
    );


    // ==================================================
    // COMPLETO
    // ==================================================

    if (updated.length >= 3) {
      completedRef.current = true;

      clearScanTimer();


      setInstruction(
        'Rostro registrado correctamente'
      );

      setStatus('success');


      setTimeout(() => {
        stopEverything();


        onComplete?.({
          faceId,

          enrolled: true,

          embeddings: updated,

          samples:
            updated.length,

          enrolledAt:
            new Date().toISOString()
        });

      }, 700);


      return;
    }


    // ==================================================
    // SIGUIENTE ETAPA
    // ==================================================

    const nextStep =
      updated.length;


    stepRef.current =
      nextStep;

    setStep(nextStep);


    if (nextStep === 1) {
      setInstruction(
        'Muy bien. Ahora gira lentamente hacia tu izquierda'
      );
    } else {
      setInstruction(
        'Perfecto. Ahora gira lentamente hacia tu derecha'
      );
    }


    setStatus('info');
  };


  // ====================================================
  // LOOP FACIAL
  // ====================================================

  useEffect(() => {
    if (
      !cameraReady ||
      !consent
    ) {
      return;
    }


    console.log(
      '🚀 INICIANDO LOOP FACIAL'
    );


    completedRef.current = false;
    processingRef.current = false;

    stableRef.current = 0;

    setStableFrames(0);


    let cancelled = false;


    const scan = async () => {
      if (
        cancelled ||
        completedRef.current
      ) {
        return;
      }


      // No ejecutar dos inferencias a la vez
      if (processingRef.current) {
        scanTimeoutRef.current =
          setTimeout(
            scan,
            SCAN_DELAY
          );

        return;
      }


      const video =
        videoRef.current;


      if (
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        console.log(
          '⌛ Esperando frame de cámara...'
        );


        setInstruction(
          'Esperando imagen de la cámara...'
        );


        setStatus('info');


        scanTimeoutRef.current =
          setTimeout(
            scan,
            SCAN_DELAY
          );


        return;
      }


      processingRef.current = true;


      try {
        console.log(
          '🔎 ANALIZANDO ROSTRO...'
        );


        const detection =
          await detectFace(video);


        console.log(
          '📦 RESULTADO FACIAL:',
          detection
        );


        // ==============================================
        // SIN ROSTRO
        // ==============================================

        if (!detection.success) {
          setFaceDetected(false);

          stableRef.current = 0;

          setStableFrames(0);


          if (
            detection.reason ===
            'MULTIPLE_FACES'
          ) {
            setInstruction(
              'Debe aparecer una sola persona'
            );
          } else if (
            detection.reason ===
            'VIDEO_NOT_READY'
          ) {
            setInstruction(
              'Esperando cámara...'
            );
          } else {
            setInstruction(
              'No detecto tu rostro. Colócate frente a la cámara'
            );
          }


          setStatus('warning');

          return;
        }


        // ==============================================
        // ROSTRO DETECTADO
        // ==============================================

        setFaceDetected(true);


        console.log(
          '👤 ROSTRO DETECTADO'
        );


        // ==============================================
        // POSICIÓN
        // ==============================================

        const correctPosition =
          evaluateFace(
            detection.face
          );


        if (!correctPosition) {
          return;
        }


        // ==============================================
        // POSICIÓN CORRECTA
        // ==============================================

        stableRef.current += 1;


        setStableFrames(
          stableRef.current
        );


        console.log(
          `✅ ESTABLE ${stableRef.current}/${REQUIRED_STABLE_FRAMES}`
        );


        if (
          stableRef.current <
          REQUIRED_STABLE_FRAMES
        ) {
          setInstruction(
            'Perfecto... mantente quieto'
          );

          setStatus('good');

          return;
        }


        // ==============================================
        // CAPTURA
        // ==============================================

        setInstruction(
          'Capturando automáticamente...'
        );

        setStatus('good');


        const embedding =
          detection.embedding ||
          detection.descriptor;


        if (
          !embedding ||
          embedding.length === 0
        ) {
          stableRef.current = 0;

          setStableFrames(0);


          setInstruction(
            'Mantente quieto mientras preparo tu plantilla facial'
          );


          setStatus('info');

          return;
        }


        saveSample(
          embedding
        );

      } catch (err) {
        console.error(
          '❌ Error durante reconocimiento:',
          err
        );


        stableRef.current = 0;

        setStableFrames(0);


        setInstruction(
          'No pude analizar el rostro. Intenta nuevamente'
        );

        setStatus('warning');

      } finally {
        processingRef.current = false;


        if (
          !cancelled &&
          !completedRef.current
        ) {
          scanTimeoutRef.current =
            setTimeout(
              scan,
              SCAN_DELAY
            );
        }
      }
    };


    // Ejecutar inmediatamente.
    scan();


    return () => {
      cancelled = true;

      clearScanTimer();

      processingRef.current = false;
    };

  }, [
    cameraReady,
    consent
  ]);


  // ====================================================
  // CONSENTIMIENTO
  // ====================================================

  const handleConsent = (event) => {
    const checked =
      event.target.checked;


    setConsent(checked);

    stableRef.current = 0;

    setStableFrames(0);

    setError('');


    if (checked) {
      console.log(
        '▶️ CONSENTIMIENTO ACTIVADO'
      );


      setInstruction(
        'Buscando tu rostro...'
      );

      setStatus('info');

    } else {
      setInstruction(
        'Activa el consentimiento biométrico para comenzar'
      );

      setStatus('waiting');
    }
  };


  // ====================================================
  // CERRAR
  // ====================================================

  const handleClose = () => {
    completedRef.current = true;

    clearScanTimer();

    stopEverything();

    onCancel?.();
  };


  // ====================================================
  // COLORES
  // ====================================================

  const statusClasses = {
    waiting:
      'bg-black/80 text-white border-white/10',

    info:
      'bg-blue-500/20 text-blue-100 border-blue-500/40',

    warning:
      'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',

    good:
      'bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/50',

    success:
      'bg-[#00ff88] text-black border-[#00ff88]'
  };


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="
      fixed inset-0 z-[100]
      bg-black/85 backdrop-blur-sm
      flex items-center justify-center
      p-4 overflow-y-auto
    ">
      <div className="
        w-full max-w-2xl
        bg-[#111111]
        border border-[#2a2a2a]
        rounded-3xl
        p-6 sm:p-8
        shadow-2xl
      ">

        {/* HEADER */}

        <div className="
          flex items-start
          justify-between gap-4
        ">
          <div className="
            flex items-center gap-3
          ">
            <div className="
              w-12 h-12 rounded-xl
              bg-[#00ff88]/10
              flex items-center justify-center
            ">
              <ScanFace
                size={27}
                className="text-[#00ff88]"
              />
            </div>

            <div>
              <h2 className="
                text-white
                text-2xl
                font-bold
              ">
                Registro facial automático
              </h2>

              <p className="
                text-gray-400
                text-sm
                mt-1
              ">
                {memberName}

                {' · '}

                <span className="font-mono">
                  {memberId}
                </span>
              </p>
            </div>
          </div>


          <button
            type="button"
            onClick={handleClose}
            className="
              text-gray-500
              hover:text-white
              transition-colors
            "
          >
            <X size={23} />
          </button>
        </div>


        {/* CÁMARA */}

        <div className="
          relative
          aspect-video
          mt-6
          overflow-hidden
          rounded-2xl
          bg-black
          border border-[#2a2a2a]
        ">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="
              absolute inset-0
              w-full h-full
              object-cover
              scale-x-[-1]
            "
          />


          {/* MARCO FACIAL */}

          <div
            className={`
              absolute
              left-1/2 top-1/2
              -translate-x-1/2
              -translate-y-1/2

              w-[42%]
              h-[74%]
              max-w-[245px]

              rounded-[48%]
              border-2

              pointer-events-none

              transition-all
              duration-300

              ${
                faceDetected
                  ? `
                    border-[#00ff88]
                    shadow-[0_0_45px_rgba(0,255,136,.35)]
                  `
                  : `
                    border-white/25
                  `
              }
            `}
          />


          {/* LOADING */}

          {loading && (
            <div className="
              absolute inset-0
              bg-black
              flex flex-col
              items-center justify-center
            ">
              <Loader2
                size={40}
                className="
                  text-[#00ff88]
                  animate-spin
                "
              />

              <p className="
                text-gray-400
                text-sm
                mt-3
              ">
                Preparando reconocimiento facial...
              </p>
            </div>
          )}


          {/* MENSAJE */}

          {cameraReady &&
            !loading && (
              <div
                className={`
                  absolute
                  left-1/2 bottom-5
                  -translate-x-1/2

                  px-5 py-2.5

                  rounded-full
                  border

                  font-semibold
                  text-sm

                  whitespace-nowrap

                  backdrop-blur-lg

                  ${statusClasses[status]}
                `}
              >
                {instruction}
              </div>
            )}
        </div>


        {/* DEBUG */}

        {debugInfo && consent && (
          <div className="
            mt-3

            bg-black/30
            border border-[#222]
            rounded-lg

            px-3 py-2

            text-center
            text-[10px]
            text-gray-500
            font-mono
          ">
            W {debugInfo.width}

            {' · '}

            H {debugInfo.height}

            {' · '}

            X {debugInfo.centerX}

            {' · '}

            Y {debugInfo.centerY}

            {' · '}

            YAW {debugInfo.yaw}

            {' · '}

            DIST {debugInfo.distance}
          </div>
        )}


        {/* ESTABILIDAD */}

        {stableFrames > 0 && (
          <div className="
            flex items-center
            justify-center
            gap-2 mt-3
          ">
            {[1, 2].map((number) => (
              <div
                key={number}
                className={`
                  w-2.5 h-2.5
                  rounded-full

                  ${
                    stableFrames >= number
                      ? `
                        bg-[#00ff88]
                        shadow-[0_0_10px_rgba(0,255,136,.7)]
                      `
                      : `
                        bg-[#333]
                      `
                  }
                `}
              />
            ))}

            <span className="
              text-gray-500
              text-xs ml-1
            ">
              Mantente quieto
            </span>
          </div>
        )}


        {/* PASOS */}

        <div className="
          grid grid-cols-3
          gap-3 mt-5
        ">
          {steps.map(
            (
              name,
              index
            ) => {
              const done =
                index <
                samples.length;

              const active =
                index === step &&
                !done;


              return (
                <div
                  key={name}
                  className={`
                    rounded-xl
                    border
                    p-4
                    text-center

                    transition-all

                    ${
                      done
                        ? `
                          border-[#00ff88]/50
                          bg-[#00ff88]/10
                        `
                        : active
                        ? `
                          border-[#00ff88]/60
                          bg-[#181818]
                        `
                        : `
                          border-[#2a2a2a]
                          bg-[#171717]
                        `
                    }
                  `}
                >
                  <div className="
                    flex justify-center mb-2
                  ">
                    {done ? (
                      <CheckCircle2
                        size={20}
                        className="
                          text-[#00ff88]
                        "
                      />
                    ) : (
                      <div
                        className={`
                          w-7 h-7
                          rounded-full
                          border

                          flex items-center
                          justify-center

                          text-xs

                          ${
                            active
                              ? `
                                border-[#00ff88]
                                text-[#00ff88]
                              `
                              : `
                                border-gray-600
                                text-gray-600
                              `
                          }
                        `}
                      >
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <p
                    className={
                      done
                        ? 'text-[#00ff88] text-sm'
                        : active
                        ? 'text-white text-sm'
                        : 'text-gray-600 text-sm'
                    }
                  >
                    {name}
                  </p>
                </div>
              );
            }
          )}
        </div>


        {/* PROGRESO */}

        <div className="
          h-2
          bg-[#222]
          rounded-full
          overflow-hidden
          mt-5
        ">
          <div
            className="
              h-full
              bg-[#00ff88]
              transition-all
              duration-500
            "
            style={{
              width:
                `${
                  (
                    samples.length /
                    3
                  ) *
                  100
                }%`
            }}
          />
        </div>


        {/* ERROR */}

        {error && (
          <div className="
            mt-5

            bg-red-500/10
            border border-red-500/20

            rounded-xl

            p-3

            flex items-start
            gap-2
          ">
            <AlertTriangle
              size={18}
              className="
                text-red-400
                shrink-0
              "
            />

            <p className="
              text-red-300
              text-sm
            ">
              {error}
            </p>
          </div>
        )}


        {/* CONSENTIMIENTO */}

        {!consent && (
          <label className="
            mt-5

            flex items-start
            gap-3

            bg-[#171717]

            border
            border-[#2a2a2a]

            rounded-xl

            p-4

            cursor-pointer

            hover:border-[#00ff88]/40
          ">
            <input
              type="checkbox"
              checked={consent}
              onChange={handleConsent}
              className="
                mt-1
                accent-[#00ff88]
              "
            />

            <div>
              <p className="
                text-white
                font-medium
                text-sm
              ">
                Consentimiento biométrico
              </p>

              <p className="
                text-gray-500
                text-xs
                mt-1
              ">
                El miembro acepta utilizar su plantilla facial para validar su acceso.
              </p>
            </div>
          </label>
        )}


        {/* ACTIVO */}

        {consent && (
          <div className="
            mt-5

            bg-[#00ff88]/5

            border
            border-[#00ff88]/20

            rounded-xl

            p-4

            flex items-start
            gap-3
          ">
            <ShieldCheck
              size={21}
              className="
                text-[#00ff88]
                shrink-0
              "
            />

            <div>
              <p className="
                text-white
                font-semibold
                text-sm
              ">
                Escaneo automático activo
              </p>

              <p className="
                text-gray-500
                text-xs
                mt-1
              ">
                No presiones nada. Sigue las indicaciones de distancia, posición y giro.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


export default FaceEnrollment;