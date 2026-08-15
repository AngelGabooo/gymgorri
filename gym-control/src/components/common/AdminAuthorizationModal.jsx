// src/components/common/AdminAuthorizationModal.jsx

import React, {
  useEffect,
  useState
} from 'react';

import {
  AlertTriangle,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  X
} from 'lucide-react';

import {
  addAdminSecurityAudit,
  getAdminSecurityConfig,
  isAdminProtectionEnabled,
  verifyAdminAuthorizationPassword
} from '../../services/adminSecurityService';

import {
  getCurrentSession
} from '../../services/authService';


const AdminAuthorizationModal = ({
  open,
  action,
  title = 'Autorización administrativa',
  description = '',
  target = null,
  confirmLabel = 'Autorizar',
  danger = true,
  onAuthorized,
  onClose
}) => {

  const session =
    getCurrentSession();

  const [
    password,
    setPassword
  ] = useState('');

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const [
    error,
    setError
  ] = useState('');

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    attempts,
    setAttempts
  ] = useState(0);


  useEffect(
    () => {

      if (
        open
      ) {

        setPassword(
          ''
        );

        setError(
          ''
        );

        setLoading(
          false
        );

        setAttempts(
          0
        );

      }

    },
    [
      open,
      action
    ]
  );


  if (!open) {
    return null;
  }


  const config =
    getAdminSecurityConfig();


  const executeAuthorized =
    async () => {

      if (
        typeof onAuthorized ===
        'function'
      ) {

        await onAuthorized();

      }

    };


  const handleAuthorize =
    async () => {

      if (
        !isAdminProtectionEnabled(
          action
        )
      ) {

        await executeAuthorized();

        return;

      }


      if (
        !config.configured
      ) {

        setError(
          'Primero configura la contraseña administrativa en Configuración → Seguridad.'
        );

        return;

      }


      if (
        !password
      ) {

        setError(
          'Ingresa la contraseña administrativa.'
        );

        return;

      }


      setLoading(
        true
      );

      setError(
        ''
      );


      try {

        const result =
          await verifyAdminAuthorizationPassword(
            password
          );


        if (
          !result.success
        ) {

          const nextAttempts =
            attempts +
            1;

          setAttempts(
            nextAttempts
          );

          setError(
            `${result.message} Intento ${nextAttempts}.`
          );


          addAdminSecurityAudit({
            action,
            result:
              'denied',

            actor:
              session,

            target,

            details: {
              reason:
                result.code,

              attempts:
                nextAttempts
            }
          });

          return;

        }


        addAdminSecurityAudit({
          action,
          result:
            'authorized',

          actor:
            session,

          target
        });


        await executeAuthorized();


      } catch (
        err
      ) {

        console.error(
          'Error autorizando acción:',
          err
        );

        setError(
          err?.message ||
          'No fue posible validar la autorización.'
        );

      } finally {

        setLoading(
          false
        );

      }

  };


  return (

    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

      <button
        type="button"
        aria-label="Cerrar"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />


      <div className="relative w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">

        <div className="p-6 border-b border-[#1a1a1a] flex items-start justify-between gap-4">

          <div className="flex items-start gap-3">

            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              danger
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-[#00ff88]/10 border border-[#00ff88]/20'
            }`}>

              {
                danger
                  ? (
                    <AlertTriangle
                      size={22}
                      className="text-red-400"
                    />
                  )
                  : (
                    <ShieldCheck
                      size={22}
                      className="text-[#00ff88]"
                    />
                  )
              }

            </div>


            <div>

              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.16em]">
                Acción protegida
              </p>

              <h2 className="text-white text-xl font-black mt-1">
                {title}
              </h2>

            </div>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white flex items-center justify-center"
          >
            <X
              size={18}
            />
          </button>

        </div>


        <div className="p-6">

          {
            description &&
            (

              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                {description}
              </p>

            )
          }


          {
            target?.label &&
            (

              <div className="mb-5 rounded-xl bg-[#0d0d0d] border border-[#202020] p-4">

                <p className="text-gray-500 text-[11px] uppercase tracking-wider">
                  Acción sobre
                </p>

                <p className="text-white font-bold mt-1">
                  {target.label}
                </p>

                {
                  target.id &&
                  (

                    <p className="text-[#00ff88] text-xs font-mono mt-1">
                      {target.id}
                    </p>

                  )
                }

              </div>

            )
          }


          {
            !config.configured &&
            (

              <div className="mb-5 rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4">

                <p className="text-yellow-500 text-sm font-bold">
                  Contraseña no configurada
                </p>

                <p className="text-gray-400 text-xs mt-1">
                  Un administrador debe crearla en Configuración → Seguridad antes de ejecutar esta acción.
                </p>

              </div>

            )
          }


          <label className="text-white text-sm font-medium block mb-2">
            Contraseña administrativa
          </label>


          <div className="relative">

            <LockKeyhole
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              autoFocus
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              value={
                password
              }
              disabled={
                loading ||
                !config.configured
              }
              onChange={
                event => {

                  setPassword(
                    event.target.value
                  );

                  setError(
                    ''
                  );

                }
              }
              onKeyDown={
                event => {

                  if (
                    event.key ===
                    'Enter'
                  ) {

                    handleAuthorize();

                  }

                }
              }
              placeholder="Ingresa la contraseña..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-11 py-3 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none disabled:opacity-50"
            />


            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  previous =>
                    !previous
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              {
                showPassword
                  ? <EyeOff size={18} />
                  : <Eye size={18} />
              }
            </button>

          </div>


          {
            error &&
            (

              <p className="text-red-400 text-xs mt-2">
                {error}
              </p>

            )
          }


          <div className="flex gap-3 mt-6">

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#3a3a3a]"
            >
              Cancelar
            </button>


            <button
              type="button"
              disabled={
                loading ||
                !config.configured
              }
              onClick={
                handleAuthorize
              }
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold disabled:opacity-50 ${
                danger
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-[#00ff88] text-black hover:bg-[#00cc6a]'
              }`}
            >
              {
                loading
                  ? 'Validando...'
                  : confirmLabel
              }
            </button>

          </div>

        </div>

      </div>

    </div>

  );

};


export default AdminAuthorizationModal;
