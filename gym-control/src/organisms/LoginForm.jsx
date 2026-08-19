// src/organisms/LoginForm.jsx

import React, {
  useEffect,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  ShieldCheck,
  UserRound,
  UserCog,
  LockKeyhole,
  X,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CalendarClock
} from 'lucide-react';

import Input from '../atoms/Input';
import Button from '../atoms/Button';

import {
  authenticateGymUser,
  ensureDefaultOwnerUser,
  getCurrentSession,
  getFirstAllowedRoute
} from '../services/authService';


// ======================================================
// HASH SHA-256 DE LA CLAVE ADMINISTRATIVA
// ======================================================
//
// Clave original:
// 0708
//
// NO guardamos "0708" directamente.
//
// IMPORTANTE:
// Esto evita que aparezca como texto plano en el código,
// pero NO sustituye una validación de backend.
//
// ======================================================

const ADMIN_ACCESS_HASH =
  'b56e59e3e3ea61711b844fd3410e00ee164ed39b78807a2ec6fc6ac136240940';


// ======================================================
// GENERAR SHA-256
// ======================================================

const hashAdminAccessValue =
  async (
    value
  ) => {

    if (
      !window.crypto?.subtle
    ) {

      throw new Error(
        'El navegador no permite validación segura.'
      );

    }


    const encoder =
      new TextEncoder();


    const data =
      encoder.encode(
        String(
          value || ''
        )
      );


    const buffer =
      await window.crypto.subtle.digest(
        'SHA-256',
        data
      );


    return Array.from(
      new Uint8Array(
        buffer
      )
    )
      .map(
        byte =>
          byte
            .toString(16)
            .padStart(
              2,
              '0'
            )
      )
      .join('');

  };


// ======================================================
// MENSAJES DE ALERTA DEL LOGIN
// ======================================================

const getLoginAlertTitle = (
  code
) => {

  const titles = {

    USER_SUSPENDED:
      'Cuenta suspendida',

    USER_INACTIVE:
      'Cuenta desactivada',

    GYM_SUSPENDED:
      'Servicio suspendido',

    GYM_INACTIVE:
      'Servicio desactivado',

    GYM_USER_NOT_LINKED:
      'Cuenta no registrada',

    USER_NOT_FOUND:
      'Cuenta no registrada',

    INVALID_CREDENTIALS:
      'No se pudo iniciar sesión',

    INVALID_PASSWORD:
      'Contraseña incorrecta',

    EMPTY_FIELDS:
      'Datos incompletos'

  };


  return (
    titles[code] ||
    'No se pudo iniciar sesión'
  );

};


// ======================================================
// LOGIN FORM
// ======================================================

const LoginForm = () => {

  const navigate =
    useNavigate();


  // ======================================================
  // LOGIN GIMNASIO
  // ======================================================

  const [
    email,
    setEmail
  ] = useState('');


  const [
    password,
    setPassword
  ] = useState('');


  const [
    rememberMe,
    setRememberMe
  ] = useState(false);


  const [
    error,
    setError
  ] = useState('');


  const [
    errorCode,
    setErrorCode
  ] = useState('');


  const [
    renewalNotice,
    setRenewalNotice
  ] = useState(null);


  const [
    pendingDestination,
    setPendingDestination
  ] = useState('');


  const [
    loading,
    setLoading
  ] = useState(false);


  // ======================================================
  // ACCESO ADMINISTRATIVO
  // ======================================================

  const [
    adminModalOpen,
    setAdminModalOpen
  ] = useState(false);


  const [
    adminAccessCode,
    setAdminAccessCode
  ] = useState('');


  const [
    adminAccessError,
    setAdminAccessError
  ] = useState('');


  const [
    adminAccessLoading,
    setAdminAccessLoading
  ] = useState(false);


  const [
    showAdminCode,
    setShowAdminCode
  ] = useState(false);


  // ======================================================
  // PREPARAR USUARIO PRINCIPAL
  // ======================================================

  useEffect(
    () => {

      ensureDefaultOwnerUser()
        .then(
          () => {

            const session =
              getCurrentSession();


            if (session) {

              navigate(
                getFirstAllowedRoute(
                  session
                ),
                {
                  replace:
                    true
                }
              );

            }

          }
        )
        .catch(
          error => {

            console.error(
              'No se pudo inicializar el usuario principal:',
              error
            );

          }
        );

    },
    [
      navigate
    ]
  );


  // ======================================================
  // LOGIN NORMAL
  // ======================================================

  const handleLogin =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        !email.trim() ||
        !password
      ) {

        setErrorCode(
          'EMPTY_FIELDS'
        );

        setError(
          'Ingresa tu correo y contraseña.'
        );

        return;

      }


      try {

        setError('');

        setErrorCode('');

        setLoading(
          true
        );


        const result =
          await authenticateGymUser(
            email,
            password
          );


        if (
          !result.success
        ) {

          setErrorCode(
            result.code ||
            'LOGIN_ERROR'
          );

          setError(
            result.message
          );

          return;

        }


        if (
          rememberMe
        ) {

          localStorage.setItem(
            'gym_control_remember_email',
            email
              .trim()
              .toLowerCase()
          );

        } else {

          localStorage.removeItem(
            'gym_control_remember_email'
          );

        }


        const destination =
          getFirstAllowedRoute(
            result.user
          );


        if (
          result.renewalNotice
            ?.active
        ) {

          setPendingDestination(
            destination
          );

          setRenewalNotice(
            result.renewalNotice
          );

          return;

        }


        navigate(
          destination,
          {
            replace:
              true
          }
        );

      } catch (error) {

        console.error(
          'Error iniciando sesión:',
          error
        );


        setErrorCode(
          'LOGIN_ERROR'
        );

        setError(
          'No se pudo iniciar sesión. Intenta nuevamente o contacta a soporte.'
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  // ======================================================
  // RECORDAR CORREO
  // ======================================================

  useEffect(
    () => {

      const remembered =
        localStorage.getItem(
          'gym_control_remember_email'
        );


      if (
        remembered
      ) {

        setEmail(
          remembered
        );


        setRememberMe(
          true
        );

      }

    },
    []
  );


  // ======================================================
  // ABRIR ACCESO ADMIN
  // ======================================================

  const openAdminAccess =
    () => {

      setAdminAccessCode('');

      setAdminAccessError('');

      setShowAdminCode(
        false
      );

      setAdminModalOpen(
        true
      );

  };


  // ======================================================
  // CERRAR ACCESO ADMIN
  // ======================================================

  const closeAdminAccess =
    () => {

      if (
        adminAccessLoading
      ) {

        return;

      }


      setAdminModalOpen(
        false
      );

      setAdminAccessCode('');

      setAdminAccessError('');

      setShowAdminCode(
        false
      );

  };


  // ======================================================
  // VALIDAR CLAVE ADMINISTRATIVA
  // ======================================================

  const handleAdminAccess =
    async (
      event
    ) => {

      event.preventDefault();


      const cleanCode =
        String(
          adminAccessCode || ''
        ).trim();


      if (!cleanCode) {

        setAdminAccessError(
          'Ingresa la clave de acceso.'
        );

        return;

      }


      try {

        setAdminAccessLoading(
          true
        );

        setAdminAccessError('');


        const enteredHash =
          await hashAdminAccessValue(
            cleanCode
          );


        if (
          enteredHash !==
          ADMIN_ACCESS_HASH
        ) {

          setAdminAccessError(
            'Clave de acceso incorrecta.'
          );

          return;

        }


        // ==================================================
        // ACCESO CORRECTO
        // ==================================================
        //
        // Esta clave únicamente permite llegar al login
        // NEXGYM.
        //
        // Todavía será necesario iniciar sesión con la
        // cuenta de Super Administrador.
        //
        // ==================================================

        setAdminModalOpen(
          false
        );

        setAdminAccessCode('');

        setAdminAccessError('');


        navigate(
          '/nexgym/login'
        );

      } catch (error) {

        console.error(
          'Error validando acceso administrativo:',
          error
        );


        setAdminAccessError(
          'No se pudo validar la clave de acceso.'
        );

      } finally {

        setAdminAccessLoading(
          false
        );

      }

    };


  // ======================================================
  // CERRAR MODAL CON ESC
  // ======================================================

  useEffect(
    () => {

      const handleKeyDown =
        event => {

          if (
            event.key ===
              'Escape' &&
            adminModalOpen
          ) {

            closeAdminAccess();

          }

        };


      document.addEventListener(
        'keydown',
        handleKeyDown
      );


      return () => {

        document.removeEventListener(
          'keydown',
          handleKeyDown
        );

      };

    },
    [
      adminModalOpen,
      adminAccessLoading
    ]
  );


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <>

      <div
        className="
          relative
          z-10
          w-full
          max-w-[560px]
        "
      >

        <div
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-[#00ff88]/25
            bg-[#0c0f0e]/90
            backdrop-blur-2xl
            px-7
            sm:px-10
            py-10
            shadow-[0_30px_100px_rgba(0,0,0,0.65)]
          "
        >

          {/* ================================================== */}
          {/* GLOW */}
          {/* ================================================== */}

          <div
            className="
              absolute
              -top-40
              left-1/2
              -translate-x-1/2
              w-[400px]
              h-[300px]
              rounded-full
              bg-[#00ff88]/10
              blur-[120px]
              pointer-events-none
            "
          />


          {/* ================================================== */}
          {/* ICONO */}
          {/* ================================================== */}

          <div
            className="
              relative
              mx-auto
              mb-7
              w-16
              h-16
              rounded-2xl
              border
              border-[#00ff88]/25
              bg-[#00ff88]/5
              flex
              items-center
              justify-center
              shadow-[0_0_40px_rgba(0,255,136,0.08)]
            "
          >

            <UserRound
              size={27}
              strokeWidth={1.6}
              className="text-[#00ff88]"
            />

          </div>


          {/* ================================================== */}
          {/* TÍTULO */}
          {/* ================================================== */}

          <div className="text-center mb-9">

            <h1 className="text-white text-3xl font-black tracking-[-0.03em]">
              Bienvenido de nuevo
            </h1>


            <p className="mt-2 text-gray-400 text-sm">
              Ingresa con un correo previamente autorizado.
            </p>

          </div>


          {/* ================================================== */}
          {/* LOGIN NORMAL */}
          {/* ================================================== */}

          <form
            onSubmit={
              handleLogin
            }
          >

            <Input
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              value={
                email
              }
              onChange={
                event => {

                  setEmail(
                    event.target.value
                  );

                  setError('');

                  setErrorCode('');

                }
              }
              type="email"
              error={
                error
              }
              icon="email"
            />


            <Input
              label="Contraseña"
              placeholder="••••••••••••"
              value={
                password
              }
              onChange={
                event => {

                  setPassword(
                    event.target.value
                  );

                  setError('');

                  setErrorCode('');

                }
              }
              type="password"
              error={
                error
              }
              icon="password"
            />


            {
              error &&
              (

                <div
                  className="
                    mb-5
                    rounded-2xl
                    border
                    border-red-500/20
                    bg-red-500/[0.07]
                    px-4
                    py-4
                  "
                >

                  <div className="flex items-start gap-3">

                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">

                      <AlertTriangle
                        className="w-4.5 h-4.5 text-red-400"
                      />

                    </div>


                    <div className="min-w-0">

                      <p className="text-red-300 text-sm font-semibold">
                        {
                          getLoginAlertTitle(
                            errorCode
                          )
                        }
                      </p>

                      <p className="text-red-200/60 text-xs leading-5 mt-1">
                        {error}
                      </p>

                      {
                        [
                          'USER_SUSPENDED',
                          'USER_INACTIVE',
                          'GYM_SUSPENDED',
                          'GYM_INACTIVE',
                          'GYM_USER_NOT_LINKED'
                        ].includes(
                          errorCode
                        ) &&
                        (

                          <p className="text-gray-500 text-[11px] mt-2">
                            Si consideras que esto es un error, comunícate con soporte NEXGYM.
                          </p>

                        )
                      }

                    </div>

                  </div>

                </div>

              )
            }


            <div className="flex items-center justify-between gap-4 mt-1 mb-8">

              <label className="flex items-center gap-2.5 cursor-pointer group">

                <input
                  type="checkbox"
                  checked={
                    rememberMe
                  }
                  onChange={() =>
                    setRememberMe(
                      previous =>
                        !previous
                    )
                  }
                  className="accent-[#00ff88] w-4 h-4 cursor-pointer"
                />

                <span className="text-gray-400 text-sm group-hover:text-gray-300 transition">
                  Recordarme
                </span>

              </label>


              <span className="text-gray-600 text-xs">
                Solo personal autorizado
              </span>

            </div>


            <Button
              type="submit"
              loading={
                loading
              }
            >
              Iniciar sesión
            </Button>


            <div className="flex items-center justify-center gap-2 mt-5">

              <ShieldCheck
                size={15}
                className="text-[#00ff88]"
              />

              <span className="text-gray-500 text-xs">
                Los permisos se aplican según el usuario
              </span>

            </div>


            {/* ================================================== */}
            {/* PERFILES */}
            {/* ================================================== */}

            <div className="border-t border-white/[0.07] my-7" />


            <p className="text-gray-500 text-center text-xs mb-4">
              Perfiles disponibles
            </p>


            <div className="flex justify-center flex-wrap gap-3">

              <div className="flex items-center gap-2 bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] font-semibold text-sm px-5 py-2 rounded-full">

                <UserCog
                  size={16}
                />

                Administrador

              </div>


              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] text-gray-300 font-semibold text-sm px-5 py-2 rounded-full">

                <UserRound
                  size={16}
                />

                Encargado

              </div>

            </div>

          </form>


          {/* ================================================== */}
          {/* ACCESO NEXGYM */}
          {/* ================================================== */}

          <div className="relative border-t border-white/[0.07] mt-8 pt-6">

            <div
              className="
                bg-white/[0.025]
                border
                border-white/[0.06]
                rounded-2xl
                p-4
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-[#00ff88]/10
                    border
                    border-[#00ff88]/15
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                  "
                >

                  <Shield
                    className="w-5 h-5 text-[#00ff88]"
                  />

                </div>


                <div className="flex-1 min-w-0">

                  <p className="text-white text-sm font-semibold">
                    Administración NEXGYM
                  </p>

                  <p className="text-gray-600 text-xs mt-1">
                    Acceso exclusivo para administración central.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={
                  openAdminAccess
                }
                className="
                  mt-4
                  w-full
                  h-10
                  rounded-xl
                  border
                  border-[#00ff88]/15
                  bg-[#00ff88]/5
                  text-[#00ff88]
                  text-sm
                  font-semibold
                  flex
                  items-center
                  justify-center
                  gap-2
                  hover:bg-[#00ff88]/10
                  hover:border-[#00ff88]/25
                  transition-all
                "
              >

                <LockKeyhole
                  className="w-4 h-4"
                />

                Acceder como Super Admin

                <ArrowRight
                  className="w-4 h-4"
                />

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* ==================================================== */}
      {/* MODAL CLAVE ADMIN */}
      {/* ==================================================== */}

      {
        adminModalOpen &&
        (

          <div
            className="
              fixed
              inset-0
              z-[999]
              bg-black/80
              backdrop-blur-md
              flex
              items-center
              justify-center
              p-5
            "
            onMouseDown={
              event => {

                if (
                  event.target ===
                  event.currentTarget
                ) {

                  closeAdminAccess();

                }

              }
            }
          >

            <div
              className="
                relative
                w-full
                max-w-[430px]
                bg-[#0d100f]
                border
                border-[#00ff88]/20
                rounded-[24px]
                p-7
                shadow-[0_30px_100px_rgba(0,0,0,0.75)]
              "
            >

              {/* CERRAR */}

              <button
                type="button"
                onClick={
                  closeAdminAccess
                }
                className="
                  absolute
                  right-4
                  top-4
                  w-9
                  h-9
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  text-gray-600
                  hover:text-white
                  hover:bg-white/[0.05]
                  transition-all
                "
              >

                <X
                  className="w-4 h-4"
                />

              </button>


              {/* ICONO */}

              <div
                className="
                  w-14
                  h-14
                  mx-auto
                  rounded-2xl
                  bg-[#00ff88]/10
                  border
                  border-[#00ff88]/20
                  flex
                  items-center
                  justify-center
                "
              >

                <LockKeyhole
                  className="w-6 h-6 text-[#00ff88]"
                />

              </div>


              {/* TEXTO */}

              <div className="text-center mt-5">

                <h3 className="text-white text-xl font-bold">
                  Acceso administrativo
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  Ingresa la clave de seguridad para continuar al panel NEXGYM.
                </p>

              </div>


              {/* FORM */}

              <form
                onSubmit={
                  handleAdminAccess
                }
                className="mt-6"
              >

                <label className="text-gray-400 text-xs font-medium">
                  Clave de acceso
                </label>


                <div className="relative mt-2">

                  <LockKeyhole
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      w-4
                      h-4
                      text-gray-600
                    "
                  />


                  <input
                    type={
                      showAdminCode
                        ? 'text'
                        : 'password'
                    }
                    inputMode="numeric"
                    value={
                      adminAccessCode
                    }
                    onChange={
                      event => {

                        /*
                         * Solo números.
                         */

                        const clean =
                          event.target.value
                            .replace(
                              /\D/g,
                              ''
                            )
                            .slice(
                              0,
                              12
                            );


                        setAdminAccessCode(
                          clean
                        );

                        setAdminAccessError('');

                      }
                    }
                    autoFocus
                    autoComplete="off"
                    placeholder="••••"
                    className="
                      w-full
                      h-12
                      bg-[#090b0a]
                      border
                      border-[#292929]
                      rounded-xl
                      pl-11
                      pr-12
                      text-white
                      text-center
                      tracking-[0.35em]
                      font-semibold
                      outline-none
                      focus:border-[#00ff88]/40
                      transition-all
                    "
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowAdminCode(
                        previous =>
                          !previous
                      )
                    }
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-gray-600
                      hover:text-white
                    "
                  >

                    {
                      showAdminCode
                        ? (
                          <EyeOff
                            className="w-4 h-4"
                          />
                        )
                        : (
                          <Eye
                            className="w-4 h-4"
                          />
                        )
                    }

                  </button>

                </div>


                {/* ERROR */}

                {
                  adminAccessError &&
                  (

                    <div
                      className="
                        mt-3
                        bg-red-500/10
                        border
                        border-red-500/20
                        rounded-xl
                        px-4
                        py-3
                      "
                    >

                      <p className="text-red-400 text-xs text-center">
                        {adminAccessError}
                      </p>

                    </div>

                  )
                }


                {/* INFO */}

                <div
                  className="
                    mt-4
                    flex
                    items-start
                    gap-2.5
                    bg-[#00ff88]/5
                    border
                    border-[#00ff88]/10
                    rounded-xl
                    p-3
                  "
                >

                  <ShieldCheck
                    className="w-4 h-4 text-[#00ff88] mt-0.5 flex-shrink-0"
                  />

                  <p className="text-gray-500 text-xs leading-5">
                    Esta clave solo desbloquea el acceso al login administrativo. Después deberás autenticarte con tu cuenta de Super Admin.
                  </p>

                </div>


                {/* BOTONES */}

                <div className="grid grid-cols-2 gap-3 mt-6">

                  <button
                    type="button"
                    onClick={
                      closeAdminAccess
                    }
                    disabled={
                      adminAccessLoading
                    }
                    className="
                      h-11
                      rounded-xl
                      bg-[#151515]
                      border
                      border-[#252525]
                      text-gray-400
                      text-sm
                      font-medium
                      hover:text-white
                      transition-all
                    "
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    disabled={
                      adminAccessLoading
                    }
                    className="
                      h-11
                      rounded-xl
                      bg-[#00ff88]
                      text-black
                      text-sm
                      font-bold
                      flex
                      items-center
                      justify-center
                      gap-2
                      hover:bg-[#00e67a]
                      transition-all
                      disabled:opacity-50
                    "
                  >

                    {
                      adminAccessLoading
                        ? (
                          <>
                            <span
                              className="
                                w-4
                                h-4
                                border-2
                                border-black/30
                                border-t-black
                                rounded-full
                                animate-spin
                              "
                            />

                            Validando
                          </>
                        )
                        : (
                          <>
                            Desbloquear

                            <ArrowRight
                              className="w-4 h-4"
                            />
                          </>
                        )
                    }

                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }


      {
        renewalNotice &&
        (

          <div
            className="fixed inset-0 z-[180] flex items-center justify-center p-4"
          >

            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />


            <div
              className="
                relative
                w-full
                max-w-[470px]
                overflow-hidden
                rounded-[26px]
                border
                border-yellow-500/20
                bg-[#0d0f0e]
                p-6
                shadow-[0_30px_100px_rgba(0,0,0,0.75)]
              "
            >

              <div className="flex items-start gap-4">

                <div
                  className={`
                    w-12
                    h-12
                    rounded-2xl
                    border
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                    ${
                      renewalNotice.severity === 'danger'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-yellow-500/10 border-yellow-500/20'
                    }
                  `}
                >

                  <CalendarClock
                    className={`w-6 h-6 ${
                      renewalNotice.severity === 'danger'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}
                  />

                </div>


                <div>

                  <p className="text-gray-500 text-[11px] uppercase tracking-[0.18em] font-semibold">
                    Aviso de servicio
                  </p>

                  <h2 className="text-white text-xl font-bold mt-1">
                    {renewalNotice.title}
                  </h2>

                </div>

              </div>


              <p className="text-gray-400 text-sm leading-6 mt-5">
                {renewalNotice.message}
              </p>


              <div className="mt-5 bg-white/[0.025] border border-white/[0.06] rounded-xl p-4">

                <p className="text-gray-500 text-xs">
                  Este aviso no impide tu acceso mientras la cuenta continúe activa. Puedes seguir utilizando el sistema y realizar la renovación con soporte.
                </p>

              </div>


              <button
                type="button"
                onClick={() => {

                  const destination =
                    pendingDestination ||
                    '/dashboard';


                  setRenewalNotice(
                    null
                  );

                  setPendingDestination(
                    ''
                  );


                  navigate(
                    destination,
                    {
                      replace:
                        true
                    }
                  );

                }}
                className="mt-6 w-full h-11 rounded-xl bg-[#00ff88] text-black text-sm font-bold hover:bg-[#00e67a] transition"
              >
                Entendido, continuar
              </button>

            </div>

          </div>

        )
      }

    </>

  );

};


export default LoginForm;