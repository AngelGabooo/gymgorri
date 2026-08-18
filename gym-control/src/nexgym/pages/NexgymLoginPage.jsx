// src/nexgym/pages/NexgymLoginPage.jsx

import React, {
  useEffect,
  useState
} from 'react';

import {
  useLocation,
  useNavigate
} from 'react-router-dom';

import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Dumbbell,
  ArrowRight,
  Loader2
} from 'lucide-react';

import {
  authenticateNexgymAdmin,
  ensureDefaultNexgymAdmin,
  getCurrentNexgymAdminSession
} from '../services/nexgymAdminAuthService';


const NexgymLoginPage = () => {

  const navigate =
    useNavigate();


  const location =
    useLocation();


  const [
    email,
    setEmail
  ] = useState('');


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


  // ======================================================
  // PREPARAR ADMIN
  // ======================================================

  useEffect(
    () => {

      ensureDefaultNexgymAdmin()
        .then(
          () => {

            const session =
              getCurrentNexgymAdminSession();


            if (session) {

              navigate(
                '/nexgym/dashboard',
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
              'Error preparando NEXGYM Admin:',
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
  // LOGIN
  // ======================================================

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        !email.trim() ||
        !password
      ) {

        setError(
          'Ingresa tu correo y contraseña.'
        );

        return;

      }


      try {

        setLoading(
          true
        );

        setError('');


        const result =
          await authenticateNexgymAdmin(
            email,
            password
          );


        if (
          !result.success
        ) {

          setError(
            result.message
          );

          return;

        }


        const destination =
          location.state?.from &&
          String(
            location.state.from
          ).startsWith(
            '/nexgym'
          ) &&
          location.state.from !==
            '/nexgym/login'
            ? location.state.from
            : '/nexgym/dashboard';


        navigate(
          destination,
          {
            replace:
              true
          }
        );

      } catch (error) {

        console.error(
          error
        );


        setError(
          'No se pudo iniciar sesión.'
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  return (

    <div
      className="
        min-h-screen
        bg-[#070707]
        flex
        items-center
        justify-center
        p-6
        relative
        overflow-hidden
      "
    >

      {/* GLOW */}

      <div
        className="
          absolute
          -top-40
          left-1/2
          -translate-x-1/2
          w-[650px]
          h-[500px]
          bg-[#00ff88]/10
          rounded-full
          blur-[160px]
          pointer-events-none
        "
      />


      <div
        className="
          relative
          z-10
          w-full
          max-w-[470px]
        "
      >

        {/* LOGO */}

        <div className="flex items-center justify-center gap-3 mb-8">

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
            "
          >

            <Dumbbell
              className="w-6 h-6 text-[#00ff88]"
            />

          </div>


          <div>

            <h1 className="text-white text-xl font-bold tracking-wide">
              NEXGYM
            </h1>

            <p className="text-gray-600 text-xs">
              Administración central
            </p>

          </div>

        </div>


        {/* CARD */}

        <div
          className="
            bg-[#0d0d0d]/95
            border
            border-[#242424]
            rounded-[28px]
            p-8
            sm:p-10
            shadow-[0_30px_100px_rgba(0,0,0,0.65)]
            backdrop-blur-xl
          "
        >

          <div
            className="
              w-14
              h-14
              rounded-2xl
              bg-[#00ff88]/10
              border
              border-[#00ff88]/20
              flex
              items-center
              justify-center
              mx-auto
            "
          >

            <ShieldCheck
              className="w-7 h-7 text-[#00ff88]"
            />

          </div>


          <div className="text-center mt-6">

            <h2 className="text-white text-2xl font-bold">
              Super Administrador
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              Acceso exclusivo al panel maestro de NEXGYM.
            </p>

          </div>


          <form
            onSubmit={
              handleSubmit
            }
            className="mt-8"
          >

            {/* EMAIL */}

            <div>

              <label className="text-gray-400 text-xs font-medium">
                Correo electrónico
              </label>


              <div className="relative mt-2">

                <Mail
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
                  type="email"
                  value={
                    email
                  }
                  onChange={
                    event => {

                      setEmail(
                        event.target.value
                      );

                      setError('');

                    }
                  }
                  placeholder="admin@nexgym.com"
                  autoComplete="email"
                  className="
                    w-full
                    h-12
                    bg-[#111111]
                    border
                    border-[#252525]
                    rounded-xl
                    pl-11
                    pr-4
                    text-white
                    text-sm
                    outline-none
                    placeholder:text-gray-700
                    focus:border-[#00ff88]/40
                    transition-all
                  "
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="mt-5">

              <label className="text-gray-400 text-xs font-medium">
                Contraseña
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
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    password
                  }
                  onChange={
                    event => {

                      setPassword(
                        event.target.value
                      );

                      setError('');

                    }
                  }
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="
                    w-full
                    h-12
                    bg-[#111111]
                    border
                    border-[#252525]
                    rounded-xl
                    pl-11
                    pr-12
                    text-white
                    text-sm
                    outline-none
                    placeholder:text-gray-700
                    focus:border-[#00ff88]/40
                    transition-all
                  "
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
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
                    showPassword
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

            </div>


            {/* ERROR */}

            {
              error &&
              (

                <div
                  className="
                    mt-5
                    bg-red-500/10
                    border
                    border-red-500/20
                    rounded-xl
                    px-4
                    py-3
                    text-red-400
                    text-sm
                  "
                >
                  {error}
                </div>

              )
            }


            {/* BOTÓN */}

            <button
              type="submit"
              disabled={
                loading
              }
              className="
                mt-7
                w-full
                h-12
                bg-[#00ff88]
                hover:bg-[#00e67a]
                text-black
                rounded-xl
                font-bold
                text-sm
                flex
                items-center
                justify-center
                gap-2
                transition-all
                disabled:opacity-50
              "
            >

              {
                loading
                  ? (
                    <>
                      <Loader2
                        className="w-4 h-4 animate-spin"
                      />

                      Verificando...
                    </>
                  )
                  : (
                    <>
                      Entrar al panel

                      <ArrowRight
                        className="w-4 h-4"
                      />
                    </>
                  )
              }

            </button>


            <div className="flex items-center justify-center gap-2 mt-6">

              <ShieldCheck
                className="w-4 h-4 text-[#00ff88]"
              />

              <p className="text-gray-600 text-xs">
                Acceso restringido a Super Administradores
              </p>

            </div>

          </form>

        </div>

      </div>

    </div>

  );

};


export default NexgymLoginPage;