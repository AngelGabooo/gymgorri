// src/components/WhatsApp/WhatsAppModal.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Cake,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Gift,
  HeartHandshake,
  MessageCircle,
  PenLine,
  Phone,
  RefreshCcw,
  Send,
  Sparkles,
  UserRoundX,
  X
} from 'lucide-react';

import {
  WHATSAPP_TEMPLATE_TYPES,
  buildWhatsAppMessage,
  openMemberWhatsApp
} from '../../services/whatsappService';

import {
  useGymSettings
} from '../../context/GymSettingsContext';


// ======================================================
// CONFIGURACIÓN VISUAL DE LAS PLANTILLAS
// ======================================================

const TEMPLATE_META = {

  renewal: {
    title:
      'Renovación',

    description:
      'Invitar al miembro a renovar su suscripción.',

    icon:
      RefreshCcw,

    accent:
      'green'
  },


  expiring: {
    title:
      'Por vencer',

    description:
      'Recordatorio antes de que termine su membresía.',

    icon:
      CalendarClock,

    accent:
      'yellow'
  },


  expired: {
    title:
      'Suscripción vencida',

    description:
      'Invitar al cliente a regresar y renovar.',

    icon:
      Clock3,

    accent:
      'red'
  },


  inactive: {
    title:
      'Cliente inactivo',

    description:
      'Seguimiento para clientes que llevan días sin asistir.',

    icon:
      UserRoundX,

    accent:
      'orange'
  },


  birthday: {
    title:
      'Cumpleaños',

    description:
      'Enviar una felicitación personalizada.',

    icon:
      Cake,

    accent:
      'purple'
  },


  pendingPayment: {
    title:
      'Pago pendiente',

    description:
      'Recordatorio de saldo o pago pendiente.',

    icon:
      BadgeDollarSign,

    accent:
      'blue'
  },


  promotion: {
    title:
      'Promoción',

    description:
      'Compartir una promoción disponible.',

    icon:
      Gift,

    accent:
      'pink'
  },


  couple: {
    title:
      'Promoción de pareja',

    description:
      'Información o seguimiento para membresía de pareja.',

    icon:
      HeartHandshake,

    accent:
      'cyan'
  },


  custom: {
    title:
      'Mensaje personalizado',

    description:
      'Escribe un mensaje completamente personalizado.',

    icon:
      PenLine,

    accent:
      'gray'
  }

};


// ======================================================
// ESTILOS POR TIPO
// ======================================================

const ACCENT_CLASSES = {

  green: {
    icon:
      'text-[#00ff88]',

    iconBg:
      'bg-[#00ff88]/10',

    iconBorder:
      'border-[#00ff88]/20',

    selected:
      'border-[#00ff88] bg-[#00ff88]/[0.07] shadow-[0_0_30px_rgba(0,255,136,0.08)]'
  },


  yellow: {
    icon:
      'text-yellow-400',

    iconBg:
      'bg-yellow-500/10',

    iconBorder:
      'border-yellow-500/20',

    selected:
      'border-yellow-500/60 bg-yellow-500/[0.06]'
  },


  red: {
    icon:
      'text-red-400',

    iconBg:
      'bg-red-500/10',

    iconBorder:
      'border-red-500/20',

    selected:
      'border-red-500/60 bg-red-500/[0.06]'
  },


  orange: {
    icon:
      'text-orange-400',

    iconBg:
      'bg-orange-500/10',

    iconBorder:
      'border-orange-500/20',

    selected:
      'border-orange-500/60 bg-orange-500/[0.06]'
  },


  purple: {
    icon:
      'text-purple-400',

    iconBg:
      'bg-purple-500/10',

    iconBorder:
      'border-purple-500/20',

    selected:
      'border-purple-500/60 bg-purple-500/[0.06]'
  },


  blue: {
    icon:
      'text-blue-400',

    iconBg:
      'bg-blue-500/10',

    iconBorder:
      'border-blue-500/20',

    selected:
      'border-blue-500/60 bg-blue-500/[0.06]'
  },


  pink: {
    icon:
      'text-pink-400',

    iconBg:
      'bg-pink-500/10',

    iconBorder:
      'border-pink-500/20',

    selected:
      'border-pink-500/60 bg-pink-500/[0.06]'
  },


  cyan: {
    icon:
      'text-cyan-400',

    iconBg:
      'bg-cyan-500/10',

    iconBorder:
      'border-cyan-500/20',

    selected:
      'border-cyan-500/60 bg-cyan-500/[0.06]'
  },


  gray: {
    icon:
      'text-gray-300',

    iconBg:
      'bg-white/[0.05]',

    iconBorder:
      'border-white/[0.08]',

    selected:
      'border-white/20 bg-white/[0.05]'
  }

};


// ======================================================
// COMPONENTE DE PASOS
// ======================================================

const StepIndicator = ({
  step
}) => {

  return (

    <div className="flex items-center gap-3">

      {/* PASO 1 */}

      <div className="flex items-center gap-2">

        <div
          className={`
            w-7
            h-7
            rounded-full
            flex
            items-center
            justify-center
            text-xs
            font-black
            border

            ${
              step >= 1
                ? 'bg-[#00ff88] border-[#00ff88] text-black'
                : 'bg-[#181818] border-[#2a2a2a] text-gray-500'
            }
          `}
        >

          {
            step > 1
              ? (
                <Check
                  size={14}
                  strokeWidth={3}
                />
              )
              : '1'
          }

        </div>


        <span
          className={`
            text-xs
            font-semibold
            hidden
            sm:block

            ${
              step >= 1
                ? 'text-white'
                : 'text-gray-600'
            }
          `}
        >
          Seleccionar
        </span>

      </div>


      {/* LÍNEA */}

      <div className="w-10 sm:w-16 h-px bg-[#2a2a2a] relative">

        <div
          className={`
            absolute
            inset-y-0
            left-0
            transition-all
            duration-500

            ${
              step >= 2
                ? 'w-full bg-[#00ff88]'
                : 'w-0'
            }
          `}
        />

      </div>


      {/* PASO 2 */}

      <div className="flex items-center gap-2">

        <div
          className={`
            w-7
            h-7
            rounded-full
            flex
            items-center
            justify-center
            text-xs
            font-black
            border

            ${
              step >= 2
                ? 'bg-[#00ff88] border-[#00ff88] text-black'
                : 'bg-[#181818] border-[#2a2a2a] text-gray-500'
            }
          `}
        >
          2
        </div>


        <span
          className={`
            text-xs
            font-semibold
            hidden
            sm:block

            ${
              step >= 2
                ? 'text-white'
                : 'text-gray-600'
            }
          `}
        >
          Revisar mensaje
        </span>

      </div>

    </div>

  );

};


// ======================================================
// TARJETA DE PLANTILLA
// ======================================================

const TemplateCard = ({
  type,
  selected,
  onClick
}) => {

  const meta =
    TEMPLATE_META[type] ||
    TEMPLATE_META.custom;


  const Icon =
    meta.icon;


  const accent =
    ACCENT_CLASSES[
      meta.accent
    ] ||
    ACCENT_CLASSES.gray;


  return (

    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        relative
        text-left
        rounded-2xl
        border
        p-4
        min-h-[130px]
        transition-all
        duration-300
        group
        overflow-hidden

        ${
          selected
            ? accent.selected
            : `
              bg-[#161616]
              border-[#252525]
              hover:border-[#3a3a3a]
              hover:bg-[#191919]
              hover:-translate-y-[1px]
            `
        }
      `}
    >

      {/* DECORACIÓN */}

      {
        selected &&
        (

          <div
            className="
              absolute
              -top-12
              -right-12
              w-28
              h-28
              rounded-full
              bg-[#00ff88]/5
              blur-2xl
              pointer-events-none
            "
          />

        )
      }


      <div className="relative flex items-start justify-between gap-3">

        <div
          className={`
            w-10
            h-10
            rounded-xl
            border
            flex
            items-center
            justify-center
            shrink-0

            ${accent.iconBg}
            ${accent.iconBorder}
          `}
        >

          <Icon
            size={19}
            strokeWidth={1.8}
            className={
              accent.icon
            }
          />

        </div>


        <div
          className={`
            w-6
            h-6
            rounded-full
            border
            flex
            items-center
            justify-center
            transition-all

            ${
              selected
                ? 'bg-[#00ff88] border-[#00ff88] text-black'
                : 'bg-transparent border-[#343434] text-transparent group-hover:border-[#555]'
            }
          `}
        >

          <Check
            size={13}
            strokeWidth={3}
          />

        </div>

      </div>


      <div className="relative mt-4">

        <p className="text-white font-bold text-sm">
          {meta.title}
        </p>


        <p className="text-gray-500 text-xs mt-1.5 leading-5">
          {meta.description}
        </p>

      </div>

    </button>

  );

};


// ======================================================
// MODAL
// ======================================================

const WhatsAppModal = ({
  open,
  onClose,
  member,
  defaultType = 'renewal',
  extras = {}
}) => {

  const {
    settings
  } = useGymSettings();


  // ====================================================
  // ESTADOS
  // ====================================================

  const [
    step,
    setStep
  ] = useState(1);


  const [
    selectedType,
    setSelectedType
  ] = useState(
    defaultType
  );


  const [
    message,
    setMessage
  ] = useState('');


  const [
    error,
    setError
  ] = useState('');


  // ====================================================
  // TIPOS DISPONIBLES
  // ====================================================

  const availableTypes =
    useMemo(
      () => {

        return WHATSAPP_TEMPLATE_TYPES.filter(
          item => {

            if (
              item.id ===
              'custom'
            ) {

              return true;

            }


            return (
              settings
                ?.whatsappSettings
                ?.templates
                ?.[item.id]
                ?.enabled !==
              false
            );

          }
        );

      },
      [
        settings
      ]
    );


  // ====================================================
  // ABRIR / REINICIAR
  // ====================================================

  useEffect(
    () => {

      if (!open) {
        return;
      }


      setStep(
        1
      );


      setSelectedType(
        defaultType ||
        'renewal'
      );


      setError(
        ''
      );

    },
    [
      open,
      defaultType
    ]
  );


  // ====================================================
  // GENERAR MENSAJE
  // ====================================================

  useEffect(
    () => {

      if (
        !open ||
        !member
      ) {

        return;

      }


      if (
        selectedType ===
        'custom'
      ) {

        setMessage(
          ''
        );

        return;

      }


      setMessage(
        buildWhatsAppMessage({
          member,
          settings,
          type:
            selectedType,
          extras
        })
      );

    },
    [
      open,
      member,
      settings,
      selectedType,
      extras
    ]
  );


  // ====================================================
  // NO MOSTRAR
  // ====================================================

  if (
    !open ||
    !member
  ) {

    return null;

  }


  // ====================================================
  // DATOS
  // ====================================================

  const fullName =
    `${member.firstName || ''} ${member.lastName || ''}`
      .trim() ||
    'Miembro';


  const selectedMeta =
    TEMPLATE_META[
      selectedType
    ] ||
    TEMPLATE_META.custom;


  const SelectedIcon =
    selectedMeta.icon;


  // ====================================================
  // CONTINUAR
  // ====================================================

  const handleContinue =
    () => {

      if (
        !selectedType
      ) {

        setError(
          'Selecciona un tipo de mensaje.'
        );

        return;

      }


      setError(
        ''
      );


      setStep(
        2
      );

    };


  // ====================================================
  // ABRIR WHATSAPP
  // ====================================================

  const handleSend =
    () => {

      setError(
        ''
      );


      const result =
        openMemberWhatsApp({
          member,
          settings,
          type:
            selectedType,
          message,
          extras
        });


      if (
        !result.success
      ) {

        setError(
          result.message ||
          'No se pudo abrir WhatsApp.'
        );

        return;

      }


      onClose?.();

    };


  // ====================================================
  // RENDER
  // ====================================================

  return (

    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        p-4
      "
    >

      {/* OVERLAY */}

      <button
        type="button"
        aria-label="Cerrar"
        onClick={
          onClose
        }
        className="
          absolute
          inset-0
          bg-black/80
          backdrop-blur-md
        "
      />


      {/* MODAL */}

      <div
        className="
          relative
          w-full
          max-w-[820px]
          max-h-[92vh]
          bg-[#101010]
          border
          border-white/[0.08]
          rounded-[26px]
          shadow-[0_30px_120px_rgba(0,0,0,0.75)]
          overflow-hidden
          flex
          flex-col
        "
      >

        {/* GLOW SUPERIOR */}

        <div
          className="
            absolute
            -top-32
            left-1/2
            -translate-x-1/2
            w-[400px]
            h-[250px]
            bg-[#00ff88]/5
            blur-[100px]
            pointer-events-none
          "
        />


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
          className="
            relative
            px-6
            sm:px-7
            py-5
            border-b
            border-white/[0.06]
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              gap-4
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
                  w-12
                  h-12
                  rounded-2xl
                  bg-[#00ff88]/10
                  border
                  border-[#00ff88]/20
                  flex
                  items-center
                  justify-center
                  shadow-[0_0_30px_rgba(0,255,136,0.06)]
                "
              >

                <MessageCircle
                  size={22}
                  strokeWidth={1.8}
                  className="text-[#00ff88]"
                />

              </div>


              <div>

                <h2
                  className="
                    text-white
                    text-xl
                    sm:text-2xl
                    font-black
                    tracking-[-0.025em]
                  "
                >
                  Enviar por WhatsApp
                </h2>


                <div
                  className="
                    flex
                    items-center
                    flex-wrap
                    gap-2
                    mt-1
                  "
                >

                  <span className="text-gray-400 text-sm">
                    {fullName}
                  </span>


                  <span className="w-1 h-1 bg-gray-600 rounded-full" />


                  <span className="text-[#00ff88] text-xs font-mono">
                    {member.id || 'Sin ID'}
                  </span>

                </div>

              </div>

            </div>


            <button
              type="button"
              onClick={
                onClose
              }
              className="
                w-10
                h-10
                rounded-xl
                bg-[#181818]
                border
                border-[#282828]
                text-gray-500
                hover:text-white
                hover:border-[#3a3a3a]
                transition-all
                flex
                items-center
                justify-center
              "
            >

              <X
                size={18}
              />

            </button>

          </div>


          {/* PASOS */}

          <div className="mt-5">

            <StepIndicator
              step={
                step
              }
            />

          </div>

        </div>


        {/* ================================================= */}
        {/* CONTENIDO */}
        {/* ================================================= */}

        <div
          className="
            relative
            flex-1
            overflow-y-auto
            px-6
            sm:px-7
            py-6
          "
        >

          {/* ================================================= */}
          {/* PASO 1 */}
          {/* ================================================= */}

          {
            step ===
              1 &&
            (

              <div>

                <div className="mb-6">

                  <div className="flex items-center gap-2">

                    <Sparkles
                      size={17}
                      className="text-[#00ff88]"
                    />

                    <p className="text-white font-black text-lg">
                      ¿Qué mensaje quieres enviar?
                    </p>

                  </div>


                  <p className="text-gray-500 text-sm mt-1.5">
                    Selecciona una plantilla. Después podrás revisar y modificar el mensaje.
                  </p>

                </div>


                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    gap-3
                  "
                >

                  {
                    availableTypes.map(
                      item => (

                        <TemplateCard
                          key={
                            item.id
                          }
                          type={
                            item.id
                          }
                          selected={
                            selectedType ===
                            item.id
                          }
                          onClick={() => {

                            setSelectedType(
                              item.id
                            );


                            setError(
                              ''
                            );

                          }}
                        />

                      )
                    )
                  }

                </div>


                {/* RECOMENDADA */}

                {
                  defaultType &&
                  selectedType ===
                    defaultType &&
                  defaultType !==
                    'custom' &&
                  (

                    <div
                      className="
                        mt-5
                        flex
                        items-start
                        gap-3
                        rounded-xl
                        border
                        border-[#00ff88]/15
                        bg-[#00ff88]/[0.04]
                        px-4
                        py-3
                      "
                    >

                      <div
                        className="
                          w-7
                          h-7
                          rounded-lg
                          bg-[#00ff88]/10
                          flex
                          items-center
                          justify-center
                          shrink-0
                        "
                      >

                        <Sparkles
                          size={14}
                          className="text-[#00ff88]"
                        />

                      </div>


                      <div>

                        <p className="text-[#00ff88] text-xs font-bold">
                          Opción recomendada
                        </p>


                        <p className="text-gray-500 text-xs mt-0.5 leading-5">
                          El sistema seleccionó esta plantilla de acuerdo con el estado actual del miembro.
                        </p>

                      </div>

                    </div>

                  )
                }

              </div>

            )
          }


          {/* ================================================= */}
          {/* PASO 2 */}
          {/* ================================================= */}

          {
            step ===
              2 &&
            (

              <div>

                {/* RESUMEN DE PLANTILLA */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    p-4
                    rounded-2xl
                    bg-[#161616]
                    border
                    border-[#252525]
                    mb-5
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <div
                      className="
                        w-10
                        h-10
                        rounded-xl
                        bg-[#00ff88]/10
                        border
                        border-[#00ff88]/20
                        flex
                        items-center
                        justify-center
                      "
                    >

                      <SelectedIcon
                        size={18}
                        className="text-[#00ff88]"
                      />

                    </div>


                    <div>

                      <p className="text-gray-500 text-[10px] uppercase tracking-[0.16em] font-bold">
                        Plantilla seleccionada
                      </p>


                      <p className="text-white font-bold text-sm mt-0.5">
                        {selectedMeta.title}
                      </p>

                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setStep(
                        1
                      )
                    }
                    className="
                      text-[#00ff88]
                      text-xs
                      font-bold
                      hover:underline
                    "
                  >
                    Cambiar
                  </button>

                </div>


                {/* MENSAJE */}

                <div>

                  <div
                    className="
                      flex
                      flex-col
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                      gap-2
                      mb-2
                    "
                  >

                    <div>

                      <p className="text-white font-bold text-sm">
                        Mensaje preparado
                      </p>


                      <p className="text-gray-600 text-xs mt-0.5">
                        Puedes editarlo antes de abrir WhatsApp.
                      </p>

                    </div>


                    <span
                      className="
                        text-gray-600
                        text-[11px]
                        font-mono
                      "
                    >
                      {message.length} caracteres
                    </span>

                  </div>


                  <div
                    className="
                      relative
                      rounded-2xl
                      bg-[#171717]
                      border
                      border-[#292929]
                      overflow-hidden
                      focus-within:border-[#00ff88]/50
                      focus-within:shadow-[0_0_0_3px_rgba(0,255,136,0.04)]
                      transition-all
                    "
                  >

                    {/* BARRA SIMULADA WHATSAPP */}

                    <div
                      className="
                        px-4
                        py-3
                        border-b
                        border-[#262626]
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <div
                        className="
                          w-7
                          h-7
                          rounded-full
                          bg-[#00ff88]/10
                          flex
                          items-center
                          justify-center
                        "
                      >

                        <MessageCircle
                          size={14}
                          className="text-[#00ff88]"
                        />

                      </div>


                      <div>

                        <p className="text-white text-xs font-semibold">
                          {fullName}
                        </p>

                        <p className="text-gray-600 text-[10px]">
                          Vista previa del mensaje
                        </p>

                      </div>

                    </div>


                    <textarea
                      rows="11"
                      value={
                        message
                      }
                      onChange={
                        event =>
                          setMessage(
                            event.target.value
                          )
                      }
                      placeholder={
                        selectedType ===
                          'custom'
                          ? 'Escribe aquí tu mensaje personalizado...'
                          : 'Escribe el mensaje...'
                      }
                      className="
                        w-full
                        bg-transparent
                        px-5
                        py-4
                        text-gray-200
                        placeholder-gray-700
                        resize-none
                        focus:outline-none
                        leading-6
                        text-sm
                      "
                    />

                  </div>

                </div>


                {/* TELÉFONO */}

                <div
                  className="
                    mt-4
                    flex
                    items-center
                    gap-3
                    bg-[#151515]
                    border
                    border-[#232323]
                    rounded-xl
                    px-4
                    py-3
                  "
                >

                  <div
                    className="
                      w-8
                      h-8
                      rounded-lg
                      bg-[#1d1d1d]
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <Phone
                      size={15}
                      className="text-gray-500"
                    />

                  </div>


                  <div>

                    <p className="text-gray-600 text-[10px] uppercase tracking-wider font-bold">
                      WhatsApp del miembro
                    </p>


                    <p className="text-gray-300 text-sm mt-0.5">
                      {
                        member.phone ||
                        'Sin teléfono registrado'
                      }
                    </p>

                  </div>

                </div>

              </div>

            )
          }


          {/* ERROR */}

          {
            error &&
            (

              <div
                className="
                  mt-5
                  p-3.5
                  rounded-xl
                  bg-red-500/[0.08]
                  border
                  border-red-500/20
                  text-red-400
                  text-sm
                  flex
                  items-start
                  gap-2.5
                "
              >

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />


                <span>
                  {error}
                </span>

              </div>

            )
          }

        </div>


        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div
          className="
            relative
            px-6
            sm:px-7
            py-4
            border-t
            border-white/[0.06]
            bg-[#0d0d0d]/90
            backdrop-blur-xl
          "
        >

          {
            step ===
              1
              ? (

                <div
                  className="
                    flex
                    flex-col-reverse
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    gap-3
                  "
                >

                  <button
                    type="button"
                    onClick={
                      onClose
                    }
                    className="
                      px-5
                      py-2.5
                      rounded-xl
                      bg-[#181818]
                      border
                      border-[#292929]
                      text-gray-400
                      hover:text-white
                      hover:border-[#3a3a3a]
                      transition-all
                    "
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleContinue
                    }
                    disabled={
                      !selectedType
                    }
                    className="
                      px-6
                      py-2.5
                      rounded-xl
                      bg-[#00ff88]
                      text-black
                      font-black
                      hover:bg-[#00e67a]
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition-all
                      shadow-[0_0_30px_rgba(0,255,136,0.08)]
                    "
                  >

                    Continuar

                    <ChevronRight
                      size={18}
                    />

                  </button>

                </div>

              )
              : (

                <div
                  className="
                    flex
                    flex-col-reverse
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    gap-3
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      setStep(
                        1
                      )
                    }
                    className="
                      px-5
                      py-2.5
                      rounded-xl
                      bg-[#181818]
                      border
                      border-[#292929]
                      text-gray-400
                      hover:text-white
                      hover:border-[#3a3a3a]
                      transition-all
                      flex
                      items-center
                      justify-center
                      gap-2
                    "
                  >

                    <ArrowLeft
                      size={16}
                    />

                    Volver

                  </button>


                  <button
                    type="button"
                    onClick={
                      handleSend
                    }
                    disabled={
                      !message.trim()
                    }
                    className="
                      px-6
                      py-2.5
                      rounded-xl
                      bg-[#00ff88]
                      text-black
                      font-black
                      hover:bg-[#00e67a]
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition-all
                      shadow-[0_0_30px_rgba(0,255,136,0.1)]
                    "
                  >

                    <Send
                      size={17}
                    />

                    Abrir WhatsApp

                    <ArrowRight
                      size={16}
                    />

                  </button>

                </div>

              )
          }

        </div>

      </div>

    </div>

  );

};


export default WhatsAppModal;