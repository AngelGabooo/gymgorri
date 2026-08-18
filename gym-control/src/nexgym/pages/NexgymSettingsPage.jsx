// src/nexgym/pages/NexgymSettingsPage.jsx

import React, {
  useEffect,
  useState
} from 'react';

import {
  Save,
  Settings,
  ShieldCheck,
  DollarSign,
  Headphones,
  Bell,
  CreditCard,
  RotateCcw,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

import {
  getNexgymSettings,
  resetNexgymSettings,
  saveNexgymSettings
} from '../services/nexgymSettingsService';

import {
  changeNexgymAdminPassword,
  getCurrentNexgymAdminSession
} from '../services/nexgymAdminAuthService';


const NexgymSettingsPage = () => {

  const [
    settings,
    setSettings
  ] = useState(
    getNexgymSettings()
  );


  const [
    saved,
    setSaved
  ] = useState(false);


  const [
    currentPassword,
    setCurrentPassword
  ] = useState('');


  const [
    newPassword,
    setNewPassword
  ] = useState('');


  const [
    confirmPassword,
    setConfirmPassword
  ] = useState('');


  const [
    passwordError,
    setPasswordError
  ] = useState('');


  const [
    passwordSuccess,
    setPasswordSuccess
  ] = useState('');


  const admin =
    getCurrentNexgymAdminSession();


  useEffect(
    () => {

      const reload =
        () =>
          setSettings(
            getNexgymSettings()
          );


      window.addEventListener(
        'nexgym-settings-update',
        reload
      );


      return () =>
        window.removeEventListener(
          'nexgym-settings-update',
          reload
        );

    },
    []
  );


  const update =
    (
      key,
      value
    ) => {

      setSettings(
        previous => ({

          ...previous,

          [key]:
            value

        })
      );

  };


  const updateNested =
    (
      group,
      key,
      value
    ) => {

      setSettings(
        previous => ({

          ...previous,

          [group]: {

            ...(previous[
              group
            ] || {}),

            [key]:
              value

          }

        })
      );

  };


  const handleSave =
    () => {

      const normalized = {

        ...settings,

        defaultMonthlyPrice:
          Math.max(
            0,
            Number(
              settings.defaultMonthlyPrice ||
              0
            )
          ),

        graceDays:
          Math.max(
            0,
            Number(
              settings.graceDays ||
              0
            )
          ),

        defaultTrialDays:
          Math.max(
            0,
            Number(
              settings.defaultTrialDays ||
              0
            )
          )

      };


      saveNexgymSettings(
        normalized
      );


      setSettings(
        normalized
      );


      setSaved(
        true
      );


      setTimeout(
        () =>
          setSaved(
            false
          ),
        2500
      );

  };


  const handleReset =
    () => {

      if (
        !window.confirm(
          '¿Restaurar la configuración predeterminada de NEXGYM?'
        )
      ) {

        return;

      }


      setSettings(
        resetNexgymSettings()
      );

  };


  const handlePassword =
    async () => {

      setPasswordError('');

      setPasswordSuccess('');


      if (
        newPassword !==
        confirmPassword
      ) {

        setPasswordError(
          'Las nuevas contraseñas no coinciden.'
        );

        return;

      }


      const result =
        await changeNexgymAdminPassword(
          currentPassword,
          newPassword
        );


      if (
        !result.success
      ) {

        setPasswordError(
          result.message
        );

        return;

      }


      setCurrentPassword('');

      setNewPassword('');

      setConfirmPassword('');


      setPasswordSuccess(
        result.message
      );

  };


  return (

    <div className="p-8">

      {
        saved &&
        (

          <div className="fixed top-6 right-6 z-[100] bg-[#111111] border border-[#00ff88]/30 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">

            <CheckCircle2
              className="w-5 h-5 text-[#00ff88]"
            />

            <p className="text-white text-sm">
              Configuración guardada
            </p>

          </div>

        )
      }


      <div className="space-y-5">


        {/* PLATAFORMA */}

        <Section
          icon={
            Settings
          }
          title="Plataforma"
          subtitle="Información general de NEXGYM"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Input
              label="Nombre de la plataforma"
              value={
                settings.platformName
              }
              onChange={
                value =>
                  update(
                    'platformName',
                    value
                  )
              }
            />

            <Input
              label="Empresa"
              value={
                settings.companyName
              }
              onChange={
                value =>
                  update(
                    'companyName',
                    value
                  )
              }
            />

          </div>

        </Section>


        {/* NEGOCIO */}

        <Section
          icon={
            DollarSign
          }
          title="Servicio y renta"
          subtitle="Valores predeterminados para nuevos clientes"
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Input
              label="Precio mensual predeterminado"
              type="number"
              value={
                settings.defaultMonthlyPrice
              }
              onChange={
                value =>
                  update(
                    'defaultMonthlyPrice',
                    value
                  )
              }
            />

            <Input
              label="Días de gracia"
              type="number"
              value={
                settings.graceDays
              }
              onChange={
                value =>
                  update(
                    'graceDays',
                    value
                  )
              }
            />

            <Input
              label="Días de prueba predeterminados"
              type="number"
              value={
                settings.defaultTrialDays
              }
              onChange={
                value =>
                  update(
                    'defaultTrialDays',
                    value
                  )
              }
            />

          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">

            <Toggle
              label="Marcar pago vencido automáticamente"
              description="Cuando pase la fecha de próximo pago, cambiar a Pago pendiente."
              checked={
                settings.autoPastDue
              }
              onChange={
                value =>
                  update(
                    'autoPastDue',
                    value
                  )
              }
            />

            <Toggle
              label="Suspensión automática"
              description="Por ahora recomendamos mantenerla apagada y suspender manualmente."
              checked={
                settings.autoSuspend
              }
              onChange={
                value =>
                  update(
                    'autoSuspend',
                    value
                  )
              }
            />

          </div>

        </Section>


        {/* SOPORTE */}

        <Section
          icon={
            Headphones
          }
          title="Contacto y soporte"
          subtitle="Datos para atender a tus clientes"
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Input
              label="Correo de soporte"
              value={
                settings.supportEmail
              }
              onChange={
                value =>
                  update(
                    'supportEmail',
                    value
                  )
              }
            />

            <Input
              label="Teléfono"
              value={
                settings.supportPhone
              }
              onChange={
                value =>
                  update(
                    'supportPhone',
                    value
                  )
              }
            />

            <Input
              label="WhatsApp"
              value={
                settings.whatsapp
              }
              onChange={
                value =>
                  update(
                    'whatsapp',
                    value
                  )
              }
            />

          </div>

        </Section>


        {/* MÉTODOS */}

        <Section
          icon={
            CreditCard
          }
          title="Métodos de pago"
          subtitle="Métodos aceptados para cobrar la renta de NEXGYM"
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <Toggle
              label="Efectivo"
              checked={
                settings.paymentMethods
                  ?.cash
              }
              onChange={
                value =>
                  updateNested(
                    'paymentMethods',
                    'cash',
                    value
                  )
              }
            />

            <Toggle
              label="Transferencia"
              checked={
                settings.paymentMethods
                  ?.transfer
              }
              onChange={
                value =>
                  updateNested(
                    'paymentMethods',
                    'transfer',
                    value
                  )
              }
            />

            <Toggle
              label="Tarjeta"
              checked={
                settings.paymentMethods
                  ?.card
              }
              onChange={
                value =>
                  updateNested(
                    'paymentMethods',
                    'card',
                    value
                  )
              }
            />

          </div>

        </Section>


        {/* NOTIFICACIONES */}

        <Section
          icon={
            Bell
          }
          title="Notificaciones"
          subtitle="Eventos importantes que quieres vigilar"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <Toggle
              label="Pagos por vencer"
              checked={
                settings.notifications
                  ?.paymentDue
              }
              onChange={
                value =>
                  updateNested(
                    'notifications',
                    'paymentDue',
                    value
                  )
              }
            />

            <Toggle
              label="Pruebas por terminar"
              checked={
                settings.notifications
                  ?.trialEnding
              }
              onChange={
                value =>
                  updateNested(
                    'notifications',
                    'trialEnding',
                    value
                  )
              }
            />

            <Toggle
              label="Nuevos tickets"
              checked={
                settings.notifications
                  ?.newTicket
              }
              onChange={
                value =>
                  updateNested(
                    'notifications',
                    'newTicket',
                    value
                  )
              }
            />

            <Toggle
              label="Clientes suspendidos"
              checked={
                settings.notifications
                  ?.suspendedClient
              }
              onChange={
                value =>
                  updateNested(
                    'notifications',
                    'suspendedClient',
                    value
                  )
              }
            />

          </div>

        </Section>


        {/* SEGURIDAD */}

        <Section
          icon={
            ShieldCheck
          }
          title="Super Administrador"
          subtitle={`Cuenta actual: ${admin?.email || '-'}`}
        >

          <div className="max-w-xl space-y-4">

            <Input
              label="Contraseña actual"
              type="password"
              value={
                currentPassword
              }
              onChange={
                setCurrentPassword
              }
            />

            <Input
              label="Nueva contraseña"
              type="password"
              value={
                newPassword
              }
              onChange={
                setNewPassword
              }
            />

            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={
                confirmPassword
              }
              onChange={
                setConfirmPassword
              }
            />


            {
              passwordError &&
              (

                <p className="text-red-400 text-xs">
                  {passwordError}
                </p>

              )
            }


            {
              passwordSuccess &&
              (

                <p className="text-[#00ff88] text-xs">
                  {passwordSuccess}
                </p>

              )
            }


            <button
              type="button"
              onClick={
                handlePassword
              }
              className="h-10 px-4 rounded-xl bg-[#171717] border border-[#282828] text-white text-sm flex items-center gap-2"
            >

              <KeyRound
                className="w-4 h-4"
              />

              Cambiar contraseña

            </button>

          </div>

        </Section>


        {/* BOTONES */}

        <div className="flex flex-col sm:flex-row justify-between gap-3 pb-8">

          <button
            type="button"
            onClick={
              handleReset
            }
            className="h-11 px-5 rounded-xl border border-[#282828] text-gray-400 text-sm flex items-center justify-center gap-2"
          >

            <RotateCcw
              className="w-4 h-4"
            />

            Restaurar valores

          </button>


          <button
            type="button"
            onClick={
              handleSave
            }
            className="h-11 px-6 rounded-xl bg-[#00ff88] text-black font-semibold text-sm flex items-center justify-center gap-2"
          >

            <Save
              className="w-4 h-4"
            />

            Guardar configuración

          </button>

        </div>

      </div>

    </div>

  );

};


// ======================================================
// COMPONENTES
// ======================================================

const Section = ({
  icon: Icon,
  title,
  subtitle,
  children
}) => (

  <div className="bg-[#111111] border border-[#202020] rounded-2xl p-6">

    <div className="flex items-start gap-3 mb-5">

      <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

        <Icon
          className="w-5 h-5 text-[#00ff88]"
        />

      </div>

      <div>

        <h3 className="text-white font-semibold">
          {title}
        </h3>

        <p className="text-gray-500 text-sm mt-1">
          {subtitle}
        </p>

      </div>

    </div>

    {children}

  </div>

);


const Input = ({
  label,
  value,
  onChange,
  type = 'text'
}) => (

  <div>

    <label className="text-gray-500 text-xs">
      {label}
    </label>

    <input
      type={
        type
      }
      value={
        value ?? ''
      }
      onChange={
        event =>
          onChange(
            event.target.value
          )
      }
      className="mt-2 w-full h-11 bg-[#0c0c0c] border border-[#282828] rounded-xl px-4 text-white text-sm outline-none focus:border-[#00ff88]/40"
    />

  </div>

);


const Toggle = ({
  label,
  description = '',
  checked,
  onChange
}) => (

  <button
    type="button"
    onClick={() =>
      onChange(
        !checked
      )
    }
    className="w-full text-left bg-[#0c0c0c] border border-[#222222] rounded-xl p-4 flex items-center justify-between gap-4"
  >

    <div>

      <p className="text-white text-sm">
        {label}
      </p>

      {
        description &&
        (

          <p className="text-gray-600 text-xs mt-1">
            {description}
          </p>

        )
      }

    </div>


    <span
      className={`
        relative
        w-11
        h-6
        rounded-full
        transition-all

        ${
          checked
            ? 'bg-[#00ff88]'
            : 'bg-[#292929]'
        }
      `}
    >

      <span
        className={`
          absolute
          top-1
          w-4
          h-4
          bg-white
          rounded-full
          transition-all

          ${
            checked
              ? 'left-6'
              : 'left-1'
          }
        `}
      />

    </span>

  </button>

);


export default NexgymSettingsPage;