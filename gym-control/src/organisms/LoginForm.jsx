import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ShieldCheck,
  UserRound,
  UserCog
} from 'lucide-react';

import Input from '../atoms/Input';
import Button from '../atoms/Button';

const LoginForm = () => {

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleLogin = (e) => {

    e.preventDefault();

    if (!email || !password) {
      setError('Correo o contraseña incorrectos');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {

      setLoading(false);

      localStorage.setItem(
        'isAuthenticated',
        'true'
      );

      navigate('/dashboard');

    }, 2000);

  };


  return (

    <div
      className="
        relative
        z-10
        w-full
        max-w-[560px]
      "
    >

      {/* CARD */}

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

        {/* GLOW SUPERIOR */}

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


        {/* ICONO */}

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


        {/* TITULO */}

        <div className="text-center mb-9">

          <h1
            className="
              text-white
              text-3xl
              font-black
              tracking-[-0.03em]
            "
          >
            Bienvenido de nuevo
          </h1>

          <p
            className="
              mt-2
              text-gray-400
              text-sm
            "
          >
            Inicia sesión para administrar tu gimnasio.
          </p>

        </div>


        {/* FORMULARIO */}

        <form onSubmit={handleLogin}>

          <Input
            label="Correo electrónico"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            type="email"
            error={error}
            icon="email"
          />


          <Input
            label="Contraseña"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            type="password"
            error={error}
            icon="password"
          />


          {/* OPCIONES */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              mt-1
              mb-8
            "
          >

            <label
              className="
                flex
                items-center
                gap-2.5
                cursor-pointer
                group
              "
            >

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() =>
                  setRememberMe(!rememberMe)
                }
                className="
                  accent-[#00ff88]
                  w-4
                  h-4
                  cursor-pointer
                "
              />

              <span
                className="
                  text-gray-400
                  text-sm
                  group-hover:text-gray-300
                  transition
                "
              >
                Recordarme
              </span>

            </label>


            <button
              type="button"
              className="
                text-[#00ff88]
                text-sm
                font-medium
                hover:text-[#69ffb9]
                transition
              "
            >
              ¿Olvidaste tu contraseña?
            </button>

          </div>


          {/* BOTÓN */}

          <Button
            type="submit"
            loading={loading}
          >
            Iniciar sesión
          </Button>


          {/* SEGURIDAD */}

          <div
            className="
              flex
              items-center
              justify-center
              gap-2
              mt-5
            "
          >

            <ShieldCheck
              size={15}
              className="text-[#00ff88]"
            />

            <span
              className="
                text-gray-500
                text-xs
              "
            >
              Acceso seguro para personal autorizado
            </span>

          </div>


          {/* DIVISOR */}

          <div
            className="
              border-t
              border-white/[0.07]
              my-7
            "
          />


          {/* ROLES */}

          <p
            className="
              text-gray-500
              text-center
              text-xs
              mb-4
            "
          >
            Acceso disponible para
          </p>


          <div
            className="
              flex
              justify-center
              gap-3
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                bg-[#00ff88]/10
                border
                border-[#00ff88]/20
                text-[#00ff88]
                font-semibold
                text-sm
                px-5
                py-2
                rounded-full
                shadow-[0_0_20px_rgba(0,255,136,0.08)]
              "
            >
              <UserCog size={16} />

              Administrador
            </div>


            <div
              className="
                flex
                items-center
                gap-2
                bg-white/[0.04]
                border
                border-white/[0.06]
                text-gray-300
                font-semibold
                text-sm
                px-5
                py-2
                rounded-full
              "
            >
              <UserRound size={16} />

              Recepción
            </div>

          </div>

        </form>

      </div>

    </div>

  );
};

export default LoginForm;