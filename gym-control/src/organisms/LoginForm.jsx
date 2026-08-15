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
  UserCog
} from 'lucide-react';

import Input from '../atoms/Input';
import Button from '../atoms/Button';

import {
  authenticateGymUser,
  ensureDefaultOwnerUser,
  getCurrentSession,
  getFirstAllowedRoute
} from '../services/authService';


const LoginForm = () => {

  const navigate =
    useNavigate();


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
    loading,
    setLoading
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
  // LOGIN
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

        setError(
          'Ingresa tu correo y contraseña.'
        );

        return;

      }


      try {

        setError('');

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


        navigate(
          getFirstAllowedRoute(
            result.user
          ),
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


        setError(
          'No se pudo iniciar sesión.'
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


  return (

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


        <div className="text-center mb-9">

          <h1 className="text-white text-3xl font-black tracking-[-0.03em]">
            Bienvenido de nuevo
          </h1>


          <p className="mt-2 text-gray-400 text-sm">
            Ingresa con un correo previamente autorizado.
          </p>

        </div>


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

                setError(
                  ''
                );

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

                setError(
                  ''
                );

              }
            }
            type="password"
            error={
              error
            }
            icon="password"
          />


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


          <div className="border-t border-white/[0.07] my-7" />


          <p className="text-gray-500 text-center text-xs mb-4">
            Perfiles disponibles
          </p>


          <div className="flex justify-center flex-wrap gap-3">

            <div className="flex items-center gap-2 bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] font-semibold text-sm px-5 py-2 rounded-full">

              <UserCog size={16} />

              Administrador

            </div>


            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] text-gray-300 font-semibold text-sm px-5 py-2 rounded-full">

              <UserRound size={16} />

              Encargado

            </div>

          </div>

        </form>

      </div>

    </div>

  );

};


export default LoginForm;
