import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X
} from 'lucide-react';


const GymAlertContext =
  createContext(
    null
  );


// ======================================================
// INFERIR TIPO
// ======================================================

const inferType = (
  message = ''
) => {

  const text =
    String(
      message
    ).toLowerCase();


  if (
    text.includes('correctamente') ||
    text.includes('guardado') ||
    text.includes('guardada') ||
    text.includes('completado') ||
    text.includes('completada') ||
    text.includes('registrado') ||
    text.includes('registrada') ||
    text.includes('activado') ||
    text.includes('activada') ||
    text.includes('desbloqueado') ||
    text.includes('desbloqueada') ||
    text.includes('éxito') ||
    text.includes('exito')
  ) {

    return 'success';

  }


  if (
    text.includes('error') ||
    text.includes('no se pudo') ||
    text.includes('falló') ||
    text.includes('fallo') ||
    text.includes('denegado') ||
    text.includes('denegada')
  ) {

    return 'error';

  }


  if (
    text.includes('debes') ||
    text.includes('advertencia') ||
    text.includes('atención') ||
    text.includes('atencion') ||
    text.includes('requiere') ||
    text.includes('obligatorio') ||
    text.includes('obligatoria')
  ) {

    return 'warning';

  }


  return 'info';

};


// ======================================================
// CONFIGURACIÓN
// ======================================================

const typeConfig = {

  success: {

    title:
      'Operación completada',

    icon:
      CheckCircle2,

    iconClass:
      'text-[#00ff88]',

    iconBg:
      'bg-[#00ff88]/10',

    border:
      'border-[#00ff88]/30',

    button:
      'bg-[#00ff88] hover:bg-[#00d977] text-black'

  },


  error: {

    title:
      'Ocurrió un problema',

    icon:
      AlertCircle,

    iconClass:
      'text-red-400',

    iconBg:
      'bg-red-500/10',

    border:
      'border-red-500/25',

    button:
      'bg-red-500 hover:bg-red-400 text-white'

  },


  warning: {

    title:
      'Atención',

    icon:
      TriangleAlert,

    iconClass:
      'text-yellow-400',

    iconBg:
      'bg-yellow-500/10',

    border:
      'border-yellow-500/25',

    button:
      'bg-yellow-400 hover:bg-yellow-300 text-black'

  },


  info: {

    title:
      'Información',

    icon:
      Info,

    iconClass:
      'text-blue-400',

    iconBg:
      'bg-blue-500/10',

    border:
      'border-blue-500/25',

    button:
      'bg-[#00ff88] hover:bg-[#00d977] text-black'

  }

};


// ======================================================
// PROVIDER
// ======================================================

export const GymAlertProvider = ({
  children
}) => {

  const [
    alertData,
    setAlertData
  ] = useState(
    null
  );


  const resolveRef =
    useRef(
      null
    );


  // ====================================================
  // FINALIZAR PROMESA
  // ====================================================

  const resolveAlert =
    useCallback(
      (
        value
      ) => {

        if (
          resolveRef.current
        ) {

          resolveRef.current(
            value
          );

          resolveRef.current =
            null;

        }


        setAlertData(
          null
        );

      },
      []
    );


  // ====================================================
  // CERRAR / CANCELAR
  // ====================================================

  const closeAlert =
    useCallback(
      () => {

        resolveAlert(
          false
        );

      },
      [
        resolveAlert
      ]
    );


  // ====================================================
  // ACEPTAR
  // ====================================================

  const acceptAlert =
    useCallback(
      () => {

        resolveAlert(
          true
        );

      },
      [
        resolveAlert
      ]
    );


  // ====================================================
  // ALERTA NORMAL
  // ====================================================

  const showAlert =
    useCallback(
      (
        options
      ) => {

        const normalized =
          typeof options ===
          'string'
            ? {

                message:
                  options,

                type:
                  inferType(
                    options
                  )

              }
            : {

                ...options,

                type:
                  options?.type ||
                  inferType(
                    options?.message
                  )

              };


        const config =
          typeConfig[
            normalized.type
          ] ||
          typeConfig.info;


        setAlertData({

          mode:
            'alert',

          type:
            normalized.type ||
            'info',

          title:
            normalized.title ||
            config.title,

          message:
            normalized.message ||
            '',

          buttonText:
            normalized.buttonText ||
            'Aceptar'

        });


        return new Promise(
          resolve => {

            resolveRef.current =
              resolve;

          }
        );

      },
      []
    );


  // ====================================================
  // CONFIRMACIÓN PERSONALIZADA
  // ====================================================

  const showConfirm =
    useCallback(
      (
        options
      ) => {

        const normalized =
          typeof options ===
          'string'
            ? {

                message:
                  options

              }
            : (
                options ||
                {}
              );


        const type =
          normalized.type ||
          'warning';


        const config =
          typeConfig[
            type
          ] ||
          typeConfig.warning;


        setAlertData({

          mode:
            'confirm',

          type,

          title:
            normalized.title ||
            'Confirmar operación',

          message:
            normalized.message ||
            '',

          confirmText:
            normalized.confirmText ||
            'Aceptar',

          cancelText:
            normalized.cancelText ||
            'Cancelar'

        });


        return new Promise(
          resolve => {

            resolveRef.current =
              resolve;

          }
        );

      },
      []
    );


  // ====================================================
  // REEMPLAZAR window.alert
  // ====================================================

  useEffect(
    () => {

      const nativeAlert =
        window.alert;


      window.alert =
        message => {

          showAlert({

            message:
              String(
                message ??
                ''
              ),

            type:
              inferType(
                message
              )

          });

        };


      return () => {

        window.alert =
          nativeAlert;

      };

    },
    [
      showAlert
    ]
  );


  // ====================================================
  // ESC
  // ====================================================

  useEffect(
    () => {

      const handleEscape =
        event => {

          if (
            event.key ===
              'Escape' &&
            alertData
          ) {

            closeAlert();

          }

        };


      window.addEventListener(
        'keydown',
        handleEscape
      );


      return () => {

        window.removeEventListener(
          'keydown',
          handleEscape
        );

      };

    },
    [
      alertData,
      closeAlert
    ]
  );


  // ====================================================
  // CONTEXTO
  // ====================================================

  const value =
    useMemo(
      () => ({

        showAlert,

        showConfirm

      }),
      [
        showAlert,
        showConfirm
      ]
    );


  const config =
    alertData
      ? (
          typeConfig[
            alertData.type
          ] ||
          typeConfig.info
        )
      : typeConfig.info;


  const Icon =
    config.icon;


  return (

    <GymAlertContext.Provider
      value={
        value
      }
    >

      {children}


      {
        alertData &&
        (

          <div
            className="
              fixed
              inset-0
              z-[9999]
              flex
              items-center
              justify-center
              p-4
            "
          >

            {/* OVERLAY */}

            <button
              type="button"
              aria-label="Cerrar alerta"
              onClick={
                closeAlert
              }
              className="
                absolute
                inset-0
                bg-black/80
                backdrop-blur-[4px]
              "
            />


            {/* MODAL */}

            <div
              className={`
                relative
                w-full
                max-w-[460px]
                overflow-hidden
                rounded-[26px]
                border
                ${config.border}
                bg-[#101010]
                shadow-[0_35px_120px_rgba(0,0,0,0.75)]
                animate-[gymAlertIn_.18s_ease-out]
              `}
            >

              {/* GLOW SUPERIOR */}

              <div
                className="
                  absolute
                  -top-24
                  left-1/2
                  -translate-x-1/2
                  w-[300px]
                  h-[160px]
                  rounded-full
                  bg-[#00ff88]/5
                  blur-[70px]
                  pointer-events-none
                "
              />


              <div
                className="
                  absolute
                  inset-x-0
                  top-0
                  h-px
                  bg-gradient-to-r
                  from-transparent
                  via-[#00ff88]/50
                  to-transparent
                "
              />


              {/* CERRAR */}

              <button
                type="button"
                onClick={
                  closeAlert
                }
                className="
                  absolute
                  right-4
                  top-4
                  z-10
                  w-9
                  h-9
                  rounded-xl
                  bg-[#1a1a1a]
                  border
                  border-[#2a2a2a]
                  flex
                  items-center
                  justify-center
                  text-gray-500
                  hover:text-white
                  hover:border-[#3a3a3a]
                  transition-colors
                "
              >

                <X
                  size={17}
                />

              </button>


              {/* CONTENIDO */}

              <div
                className="
                  relative
                  p-7
                  pt-8
                "
              >

                <div
                  className={`
                    w-14
                    h-14
                    rounded-2xl
                    ${config.iconBg}
                    border
                    ${config.border}
                    flex
                    items-center
                    justify-center
                    mb-5
                  `}
                >

                  <Icon
                    size={28}
                    className={
                      config.iconClass
                    }
                  />

                </div>


                <h3
                  className="
                    text-white
                    text-xl
                    font-bold
                    pr-10
                  "
                >

                  {
                    alertData.title
                  }

                </h3>


                <p
                  className="
                    text-gray-400
                    text-sm
                    leading-6
                    mt-2
                    whitespace-pre-line
                  "
                >

                  {
                    alertData.message
                  }

                </p>


                {/* ALERTA SIMPLE */}

                {
                  alertData.mode ===
                    'alert' &&
                  (

                    <button
                      type="button"
                      onClick={
                        acceptAlert
                      }
                      className={`
                        mt-7
                        w-full
                        rounded-xl
                        px-5
                        py-3
                        font-bold
                        transition-all
                        ${config.button}
                      `}
                    >

                      {
                        alertData.buttonText
                      }

                    </button>

                  )
                }


                {/* CONFIRMACIÓN */}

                {
                  alertData.mode ===
                    'confirm' &&
                  (

                    <div
                      className="
                        mt-7
                        grid
                        grid-cols-2
                        gap-3
                      "
                    >

                      <button
                        type="button"
                        onClick={
                          closeAlert
                        }
                        className="
                          rounded-xl
                          px-5
                          py-3
                          bg-[#1a1a1a]
                          border
                          border-[#2a2a2a]
                          text-gray-300
                          font-semibold
                          hover:text-white
                          hover:border-[#3a3a3a]
                          transition-all
                        "
                      >

                        {
                          alertData.cancelText
                        }

                      </button>


                      <button
                        type="button"
                        onClick={
                          acceptAlert
                        }
                        className={`
                          rounded-xl
                          px-5
                          py-3
                          font-bold
                          transition-all
                          ${config.button}
                        `}
                      >

                        {
                          alertData.confirmText
                        }

                      </button>

                    </div>

                  )
                }

              </div>

            </div>


            <style>

              {`

                @keyframes gymAlertIn {

                  from {
                    opacity: 0;
                    transform:
                      translateY(12px)
                      scale(.975);
                  }

                  to {
                    opacity: 1;
                    transform:
                      translateY(0)
                      scale(1);
                  }

                }

              `}

            </style>

          </div>

        )
      }

    </GymAlertContext.Provider>

  );

};


// ======================================================
// HOOK
// ======================================================

export const useGymAlert =
  () => {

    const context =
      useContext(
        GymAlertContext
      );


    if (!context) {

      throw new Error(
        'useGymAlert debe utilizarse dentro de GymAlertProvider.'
      );

    }


    return context;

  };


export default GymAlertProvider;