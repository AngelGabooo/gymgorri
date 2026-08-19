// src/pages/LoginPage.jsx

import React from 'react';

import {
  QrCode,
  Users,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

import LoginForm from '../organisms/LoginForm';


// ======================================================
// TARJETA DE CARACTERÍSTICAS
// ======================================================

const FeatureCard = ({
  icon: Icon,
  title
}) => {

  return (

    <div className="group flex flex-col items-center text-center gap-3">

      {/* CONTENEDOR DEL ICONO */}

      <div
        className="
          w-[72px]
          h-[72px]
          rounded-2xl

          border
          border-[#00ff88]/30

          bg-black/40
          backdrop-blur-xl

          flex
          items-center
          justify-center

          transition-all
          duration-300

          group-hover:border-[#00ff88]/70
          group-hover:bg-[#00ff88]/10
          group-hover:-translate-y-1

          group-hover:shadow-[0_0_30px_rgba(0,255,136,0.15)]
        "
      >

        <Icon
          size={30}
          strokeWidth={1.7}
          className="
            text-[#00ff88]

            transition-transform
            duration-300

            group-hover:scale-110
          "
        />

      </div>


      {/* TEXTO */}

      <p
        className="
          text-gray-300
          text-sm
          leading-5
          max-w-[135px]
        "
      >
        {title}
      </p>

    </div>

  );

};


// ======================================================
// LOGIN PAGE
// ======================================================

const LoginPage = () => {

  return (

    <main
      className="
        min-h-screen
        w-full

        bg-[#050706]

        flex

        overflow-hidden
      "
    >

      {/* ================================================= */}
      {/* LADO IZQUIERDO */}
      {/* ================================================= */}

      <section
        className="
          hidden
          lg:flex

          lg:w-[52%]

          min-h-screen

          relative
          overflow-hidden

          bg-cover
          bg-center
          bg-no-repeat
        "
        style={{
          backgroundImage:
            "url('/img/fondope.png')"
        }}
      >

        {/* ================================================= */}
        {/* OVERLAY PRINCIPAL */}
        {/* ================================================= */}

        <div
          className="
            absolute
            inset-0

            bg-gradient-to-r

            from-black/95
            via-black/75
            to-black/25

            pointer-events-none
          "
        />


        {/* ================================================= */}
        {/* OVERLAY VERTICAL */}
        {/* ================================================= */}

        <div
          className="
            absolute
            inset-0

            bg-gradient-to-b

            from-black/55
            via-black/20
            to-black/90

            pointer-events-none
          "
        />


        {/* ================================================= */}
        {/* GLOW VERDE */}
        {/* ================================================= */}

        <div
          className="
            absolute

            left-[15%]
            top-[32%]

            w-[550px]
            h-[550px]

            bg-[#00ff88]/10

            rounded-full

            blur-[170px]

            pointer-events-none
          "
        />


        {/* ================================================= */}
        {/* GRID TECNOLÓGICO */}
        {/* ================================================= */}

        <div
          className="
            absolute
            inset-0

            opacity-[0.05]

            pointer-events-none
          "
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(0,255,136,0.15) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(0,255,136,0.15) 1px,
                transparent 1px
              )
            `,
            backgroundSize:
              '45px 45px'
          }}
        />


        {/* ================================================= */}
        {/* LÍNEA DECORATIVA */}
        {/* ================================================= */}

        <div
          className="
            absolute

            left-0
            top-[22%]

            w-[2px]
            h-[260px]

            bg-gradient-to-b

            from-transparent
            via-[#00ff88]
            to-transparent

            opacity-80

            shadow-[0_0_20px_rgba(0,255,136,0.5)]

            pointer-events-none
          "
        />


        {/* ================================================= */}
        {/* PUNTOS TECNOLÓGICOS */}
        {/* ================================================= */}

        <div
          className="
            absolute

            right-10
            bottom-10

            grid
            grid-cols-6
            gap-2

            opacity-20

            pointer-events-none
          "
        >

          {
            Array.from({
              length: 36
            }).map(
              (_, index) => (

                <span
                  key={index}
                  className="
                    w-1
                    h-1

                    bg-[#00ff88]

                    rounded-full
                  "
                />

              )
            )
          }

        </div>


        {/* ================================================= */}
        {/* CONTENIDO PRINCIPAL */}
        {/* ================================================= */}

        <div
          className="
            relative
            z-10

            flex
            flex-col

            min-h-screen
            w-full

            px-10
            xl:px-16

            py-10
          "
        >


          {/* ================================================= */}
          {/* LOGO NEXGYM */}
          {/* ================================================= */}

          <div
            className="
              flex
              items-center
              gap-4
            "
          >

            {/* LOGO DEL LOBO */}

            <div
              className="
                w-[76px]
                h-[76px]

                flex
                items-center
                justify-center

                flex-shrink-0

                rounded-2xl
                overflow-hidden

                bg-black/50

                border
                border-[#00ff88]/25

                shadow-[0_0_30px_rgba(0,255,136,0.15)]

                transition-all
                duration-300

                hover:border-[#00ff88]/60
                hover:shadow-[0_0_35px_rgba(0,255,136,0.25)]
              "
            >

              <img
                src="/img/lobo.png"
                alt="Logo NEXGYM"
                className="
                  w-full
                  h-full

                  object-cover

                  transition-transform
                  duration-300

                  hover:scale-110

                  drop-shadow-[0_0_18px_rgba(0,255,136,0.45)]
                "
              />

            </div>


            {/* NOMBRE DEL SISTEMA */}

            <div>

              <h1
                className="
                  text-white

                  font-black

                  tracking-[0.06em]

                  text-2xl
                  xl:text-[28px]

                  leading-none
                "
              >

                NEX

                <span
                  className="
                    text-[#00ff88]

                    drop-shadow-[0_0_12px_rgba(0,255,136,0.25)]
                  "
                >
                  GYM
                </span>

              </h1>


              <p
                className="
                  text-gray-400

                  text-[10px]
                  xl:text-[11px]

                  uppercase

                  tracking-[0.20em]

                  mt-2
                "
              >
                Smart Gym Management
              </p>

            </div>

          </div>


          {/* ================================================= */}
          {/* CONTENIDO CENTRAL */}
          {/* ================================================= */}

          <div
            className="
              flex-1

              flex
              flex-col

              justify-center

              max-w-[650px]
            "
          >


            {/* TÍTULO PRINCIPAL */}

            <h2
              className="
                text-white

                font-black

                text-[42px]
                xl:text-[55px]

                leading-[1.08]

                tracking-[-0.035em]

                drop-shadow-2xl
              "
            >

              Controla tu gimnasio

              <br />

              de forma{' '}

              <span
                className="
                  text-[#00ff88]

                  drop-shadow-[0_0_20px_rgba(0,255,136,0.2)]
                "
              >
                inteligente
              </span>

            </h2>


            {/* DESCRIPCIÓN */}

            <p
              className="
                mt-7

                text-gray-300

                text-lg
                xl:text-xl

                leading-8

                max-w-[580px]

                drop-shadow-lg
              "
            >
              Gestiona miembros, suscripciones, accesos y
              asistencias desde un solo lugar.
            </p>


            {/* ================================================= */}
            {/* CARACTERÍSTICAS */}
            {/* ================================================= */}

            <div
              className="
                grid
                grid-cols-3

                gap-7

                mt-12

                max-w-[540px]
              "
            >

              <FeatureCard
                icon={QrCode}
                title="Control de acceso por QR"
              />


              <FeatureCard
                icon={Users}
                title="Suscripciones inteligentes"
              />


              <FeatureCard
                icon={BarChart3}
                title="Estadísticas en tiempo real"
              />

            </div>

          </div>


          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div
            className="
              flex
              items-center
              gap-3

              text-gray-400

              text-sm
            "
          >

            <div
              className="
                w-9
                h-9

                border
                border-[#00ff88]/30

                rounded-xl

                bg-[#00ff88]/5

                flex
                items-center
                justify-center

                shadow-[0_0_20px_rgba(0,255,136,0.08)]
              "
            >

              <ShieldCheck
                size={18}
                className="text-[#00ff88]"
              />

            </div>


            <span>
              Gestión segura y eficiente para tu gimnasio.
            </span>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* LADO DERECHO */}
      {/* ================================================= */}

      <section
        className="
          relative

          w-full
          lg:w-[48%]

          min-h-screen

          flex
          items-center
          justify-center

          bg-[#090b0a]

          px-5
          sm:px-8
          xl:px-12

          py-10

          overflow-hidden
        "
      >


        {/* ================================================= */}
        {/* GLOW SUPERIOR */}
        {/* ================================================= */}

        <div
          className="
            absolute

            right-[-250px]
            top-[5%]

            w-[600px]
            h-[600px]

            rounded-full

            bg-[#00ff88]/5

            blur-[180px]

            pointer-events-none
          "
        />


        {/* ================================================= */}
        {/* GLOW INFERIOR */}
        {/* ================================================= */}

        <div
          className="
            absolute

            left-[-250px]
            bottom-[-150px]

            w-[550px]
            h-[550px]

            rounded-full

            bg-[#00ff88]/5

            blur-[170px]

            pointer-events-none
          "
        />


        {/* ================================================= */}
        {/* LÍNEA DIVISORIA */}
        {/* ================================================= */}

        <div
          className="
            hidden
            lg:block

            absolute
            left-0
            top-[10%]

            w-px
            h-[80%]

            bg-gradient-to-b

            from-transparent
            via-[#00ff88]/15
            to-transparent
          "
        />


        {/* ================================================= */}
        {/* FORMULARIO */}
        {/* ================================================= */}

        <LoginForm />

      </section>

    </main>

  );

};


export default LoginPage;