// src/nexgym/pages/NexgymNewGymPage.jsx

import React, {
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  ArrowLeft,
  Building2,
  UserRound,
  KeyRound,
  CreditCard,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  ArrowRight,
  ArrowLeft as BackIcon
} from 'lucide-react';

import {
  createNexgymGym
} from '../services/nexgymCloudGymService.js';

// ======================================================
// ESTADO INICIAL
// ======================================================

const initialForm = {

  name:
    '',

  phone:
    '',

  address:
    '',

  city:
    '',

  state:
    'Chiapas',


  ownerName:
    '',

  ownerEmail:
    '',

  ownerPhone:
    '',


  accessEmail:
    '',

  accessPassword:
    '',

  confirmPassword:
    '',


  price:
    '799',

  discount:
    '0',

  trialDays:
    '0'

};


// ======================================================
// PAGE
// ======================================================

const NexgymNewGymPage = () => {

  const navigate =
    useNavigate();


  const [
    step,
    setStep
  ] = useState(1);


  const [
    form,
    setForm
  ] = useState(
    initialForm
  );


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    error,
    setError
  ] = useState('');


  const [
    showPassword,
    setShowPassword
  ] = useState(false);


  const [
    created,
    setCreated
  ] = useState(null);


  const [
    copied,
    setCopied
  ] = useState(false);


  // ======================================================
  // CHANGE
  // ======================================================

  const updateField =
    (
      field,
      value
    ) => {

      setForm(
        current => ({
          ...current,
          [field]:
            value
        })
      );


      setError('');

    };


  // ======================================================
  // VALIDAR PASO
  // ======================================================

  const validateStep =
    () => {

      if (
        step ===
        1
      ) {

        if (
          !form.name.trim()
        ) {

          setError(
            'Ingresa el nombre del gimnasio.'
          );

          return false;

        }

      }


      if (
        step ===
        2
      ) {

        if (
          !form.ownerName.trim()
        ) {

          setError(
            'Ingresa el nombre del propietario.'
          );

          return false;

        }

      }


      if (
        step ===
        3
      ) {

        if (
          !form.accessEmail.trim()
        ) {

          setError(
            'Ingresa el correo de acceso.'
          );

          return false;

        }


        if (
          form.accessPassword.length <
          8
        ) {

          setError(
            'La contraseña debe tener al menos 8 caracteres.'
          );

          return false;

        }


        if (
          form.accessPassword !==
          form.confirmPassword
        ) {

          setError(
            'Las contraseñas no coinciden.'
          );

          return false;

        }

      }


      return true;

    };


  // ======================================================
  // CONTINUAR
  // ======================================================

  const nextStep =
    () => {

      if (
        !validateStep()
      ) {

        return;

      }


      setStep(
        current =>
          Math.min(
            current + 1,
            4
          )
      );

    };


  // ======================================================
  // ATRÁS
  // ======================================================

  const previousStep =
    () => {

      setError('');


      setStep(
        current =>
          Math.max(
            current - 1,
            1
          )
      );

    };


  // ======================================================
  // CREAR
  // ======================================================

  const handleCreate =
    async () => {

      try {

        setError('');

        setLoading(true);


        const result =
          await createNexgymGym({

            name:
              form.name,

            phone:
              form.phone,

            address:
              form.address,

            city:
              form.city,

            state:
              form.state,


            owner: {

              name:
                form.ownerName,

              email:
                form.ownerEmail,

              phone:
                form.ownerPhone

            },


            access: {

              email:
                form.accessEmail,

              password:
                form.accessPassword

            },


            subscription: {

              price:
                Number(
                  form.price ||
                  0
                ),

              discount:
                Number(
                  form.discount ||
                  0
                )

            },


            trialDays:
              Number(
                form.trialDays ||
                0
              )

          });


        if (
          !result.success
        ) {

          setError(
            result.message
          );

          return;

        }


        setCreated({

          gym:
            result.gym,

          email:
            form.accessEmail
              .trim()
              .toLowerCase(),

          password:
            form.accessPassword

        });

      } catch (error) {

        console.error(
          'Error registrando gimnasio:',
          error
        );


        setError(
          'No se pudo registrar el gimnasio.'
        );

      } finally {

        setLoading(false);

      }

    };


  // ======================================================
  // COPIAR
  // ======================================================

  const copyCredentials =
    async () => {

      if (
        !created
      ) {

        return;

      }


      const text =
        `NEXGYM\n` +
        `Gimnasio: ${created.gym.name}\n` +
        `Código: ${created.gym.gymCode}\n` +
        `Correo: ${created.email}\n` +
        `Contraseña temporal: ${created.password}`;


      try {

        await navigator.clipboard.writeText(
          text
        );


        setCopied(true);


        setTimeout(
          () =>
            setCopied(false),
          2000
        );

      } catch (error) {

        console.error(
          'No se pudieron copiar las credenciales:',
          error
        );

      }

    };


  // ======================================================
  // ÉXITO
  // ======================================================

  if (
    created
  ) {

    return (

      <div className="p-8">

        <div className="max-w-3xl mx-auto">

          <div className="bg-[#111111] border border-[#202020] rounded-3xl p-8">

            <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">

              <CheckCircle2
                className="w-8 h-8 text-[#00ff88]"
              />

            </div>


            <h1 className="text-white text-3xl font-semibold mt-6">
              Gimnasio creado
            </h1>


            <p className="text-gray-500 mt-2">
              La cuenta ya puede iniciar sesión en GYM CONTROL.
            </p>


            <div className="mt-8 bg-[#0b0b0b] border border-[#242424] rounded-2xl p-6">

              <Credential
                label="Gimnasio"
                value={
                  created.gym.name
                }
              />

              <Credential
                label="Código"
                value={
                  created.gym.gymCode
                }
              />

              <Credential
                label="Correo de acceso"
                value={
                  created.email
                }
              />

              <Credential
                label="Contraseña temporal"
                value={
                  created.password
                }
              />

            </div>


            <div className="flex flex-wrap gap-3 mt-6">

              <button
                type="button"
                onClick={
                  copyCredentials
                }
                className="h-11 px-5 rounded-xl bg-[#171717] border border-[#292929] text-gray-300 flex items-center gap-2 text-sm"
              >

                <Copy
                  className="w-4 h-4"
                />

                {
                  copied
                    ? 'Copiado'
                    : 'Copiar credenciales'
                }

              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/nexgym/gyms/${created.gym.id}`
                  )
                }
                className="h-11 px-5 rounded-xl bg-[#00ff88] text-black font-semibold text-sm"
              >
                Ver gimnasio
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/nexgym/gyms'
                  )
                }
                className="h-11 px-5 rounded-xl bg-[#171717] border border-[#292929] text-gray-300 text-sm"
              >
                Ver todos
              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="p-8">

      <button
        type="button"
        onClick={() =>
          navigate(
            '/nexgym/gyms'
          )
        }
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6"
      >

        <ArrowLeft
          className="w-4 h-4"
        />

        Volver a gimnasios

      </button>


      <div className="max-w-4xl mx-auto">

        <div className="mb-7">

          <h1 className="text-white text-3xl font-semibold">
            Nuevo gimnasio
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            Registra un cliente y crea sus credenciales de acceso.
          </p>

        </div>


        <StepIndicator
          current={
            step
          }
        />


        <div className="mt-6 bg-[#111111] border border-[#202020] rounded-3xl p-7">


          {/* PASO 1 */}

          {
            step ===
            1 && (

              <>

                <SectionTitle
                  icon={
                    Building2
                  }
                  title="Datos del gimnasio"
                  subtitle="Información principal del negocio."
                />


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

                  <Field
                    label="Nombre del gimnasio *"
                    value={
                      form.name
                    }
                    onChange={
                      value =>
                        updateField(
                          'name',
                          value
                        )
                    }
                    placeholder="Ej. Power Gym"
                  />


                  <Field
                    label="Teléfono"
                    value={
                      form.phone
                    }
                    onChange={
                      value =>
                        updateField(
                          'phone',
                          value
                        )
                    }
                    placeholder="961..."
                  />


                  <Field
                    label="Dirección"
                    value={
                      form.address
                    }
                    onChange={
                      value =>
                        updateField(
                          'address',
                          value
                        )
                    }
                    placeholder="Av. Central..."
                  />


                  <Field
                    label="Ciudad"
                    value={
                      form.city
                    }
                    onChange={
                      value =>
                        updateField(
                          'city',
                          value
                        )
                    }
                    placeholder="Tuxtla Gutiérrez"
                  />


                  <Field
                    label="Estado"
                    value={
                      form.state
                    }
                    onChange={
                      value =>
                        updateField(
                          'state',
                          value
                        )
                    }
                    placeholder="Chiapas"
                  />

                </div>

              </>

            )
          }


          {/* PASO 2 */}

          {
            step ===
            2 && (

              <>

                <SectionTitle
                  icon={
                    UserRound
                  }
                  title="Propietario"
                  subtitle="Persona responsable del gimnasio."
                />


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

                  <Field
                    label="Nombre completo *"
                    value={
                      form.ownerName
                    }
                    onChange={
                      value =>
                        updateField(
                          'ownerName',
                          value
                        )
                    }
                    placeholder="Nombre del propietario"
                  />


                  <Field
                    label="Correo de contacto"
                    value={
                      form.ownerEmail
                    }
                    onChange={
                      value =>
                        updateField(
                          'ownerEmail',
                          value
                        )
                    }
                    placeholder="correo@ejemplo.com"
                    type="email"
                  />


                  <Field
                    label="Teléfono"
                    value={
                      form.ownerPhone
                    }
                    onChange={
                      value =>
                        updateField(
                          'ownerPhone',
                          value
                        )
                    }
                    placeholder="961..."
                  />

                </div>

              </>

            )
          }


          {/* PASO 3 */}

          {
            step ===
            3 && (

              <>

                <SectionTitle
                  icon={
                    KeyRound
                  }
                  title="Acceso al sistema"
                  subtitle="Estas credenciales serán entregadas al propietario."
                />


                <div className="grid grid-cols-1 gap-4 mt-6">

                  <Field
                    label="Correo de acceso *"
                    value={
                      form.accessEmail
                    }
                    onChange={
                      value =>
                        updateField(
                          'accessEmail',
                          value
                        )
                    }
                    placeholder="powergym@nexgym.mx"
                    type="email"
                  />


                  <PasswordField
                    label="Contraseña temporal *"
                    value={
                      form.accessPassword
                    }
                    onChange={
                      value =>
                        updateField(
                          'accessPassword',
                          value
                        )
                    }
                    show={
                      showPassword
                    }
                    setShow={
                      setShowPassword
                    }
                  />


                  <PasswordField
                    label="Confirmar contraseña *"
                    value={
                      form.confirmPassword
                    }
                    onChange={
                      value =>
                        updateField(
                          'confirmPassword',
                          value
                        )
                    }
                    show={
                      showPassword
                    }
                    setShow={
                      setShowPassword
                    }
                  />

                </div>

              </>

            )
          }


          {/* PASO 4 */}

          {
            step ===
            4 && (

              <>

                <SectionTitle
                  icon={
                    CreditCard
                  }
                  title="Suscripción NEXGYM"
                  subtitle="Configura el cobro del servicio."
                />


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

                  <Field
                    label="Precio mensual"
                    value={
                      form.price
                    }
                    onChange={
                      value =>
                        updateField(
                          'price',
                          value
                        )
                    }
                    type="number"
                  />


                  <Field
                    label="Descuento"
                    value={
                      form.discount
                    }
                    onChange={
                      value =>
                        updateField(
                          'discount',
                          value
                        )
                    }
                    type="number"
                  />


                  <div>

                    <label className="text-gray-400 text-xs block mb-2">
                      Periodo de prueba
                    </label>

                    <select
                      value={
                        form.trialDays
                      }
                      onChange={
                        event =>
                          updateField(
                            'trialDays',
                            event.target.value
                          )
                      }
                      className="w-full h-11 rounded-xl bg-[#0c0c0c] border border-[#262626] text-white px-4 text-sm outline-none"
                    >

                      <option value="0">
                        Sin prueba
                      </option>

                      <option value="7">
                        7 días
                      </option>

                      <option value="15">
                        15 días
                      </option>

                      <option value="30">
                        30 días
                      </option>

                    </select>

                  </div>

                </div>


                <div className="mt-6 bg-[#0c0c0c] border border-[#242424] rounded-2xl p-5">

                  <p className="text-gray-500 text-xs">
                    Precio final mensual
                  </p>

                  <p className="text-[#00ff88] text-3xl font-semibold mt-1">
                    $
                    {
                      Math.max(
                        0,
                        Number(
                          form.price ||
                          0
                        ) -
                        Number(
                          form.discount ||
                          0
                        )
                      )
                    }
                    {' '}
                    MXN
                  </p>

                </div>

              </>

            )
          }


          {
            error && (

              <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>

            )
          }


          <div className="flex justify-between mt-8 pt-6 border-t border-[#202020]">

            <button
              type="button"
              onClick={
                previousStep
              }
              disabled={
                step === 1
              }
              className="h-11 px-5 rounded-xl bg-[#171717] border border-[#292929] text-gray-300 flex items-center gap-2 text-sm disabled:opacity-30"
            >

              <BackIcon
                className="w-4 h-4"
              />

              Anterior

            </button>


            {
              step <
              4
                ? (

                  <button
                    type="button"
                    onClick={
                      nextStep
                    }
                    className="h-11 px-5 rounded-xl bg-[#00ff88] text-black font-semibold flex items-center gap-2 text-sm"
                  >

                    Continuar

                    <ArrowRight
                      className="w-4 h-4"
                    />

                  </button>

                )
                : (

                  <button
                    type="button"
                    onClick={
                      handleCreate
                    }
                    disabled={
                      loading
                    }
                    className="h-11 px-6 rounded-xl bg-[#00ff88] text-black font-semibold text-sm disabled:opacity-50"
                  >

                    {
                      loading
                        ? 'Creando...'
                        : 'Crear gimnasio'
                    }

                  </button>

                )
            }

          </div>

        </div>

      </div>

    </div>

  );

};


// ======================================================
// STEP INDICATOR
// ======================================================

const StepIndicator = ({
  current
}) => {

  const steps = [
    'Gimnasio',
    'Propietario',
    'Acceso',
    'Suscripción'
  ];


  return (

    <div className="grid grid-cols-4 gap-2">

      {steps.map(
        (
          label,
          index
        ) => {

          const number =
            index + 1;

          const active =
            number <=
            current;


          return (

            <div
              key={
                label
              }
            >

              <div
                className={`
                  h-1
                  rounded-full
                  ${
                    active
                      ? 'bg-[#00ff88]'
                      : 'bg-[#202020]'
                  }
                `}
              />


              <p
                className={`
                  text-xs
                  mt-2
                  ${
                    active
                      ? 'text-gray-300'
                      : 'text-gray-600'
                  }
                `}
              >
                {number}. {label}
              </p>

            </div>

          );

        }
      )}

    </div>

  );

};


// ======================================================
// SECTION
// ======================================================

const SectionTitle = ({
  icon: Icon,
  title,
  subtitle
}) => {

  return (

    <div className="flex items-start gap-3">

      <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

        <Icon
          className="w-5 h-5 text-[#00ff88]"
        />

      </div>


      <div>

        <h2 className="text-white font-semibold text-lg">
          {title}
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          {subtitle}
        </p>

      </div>

    </div>

  );

};


// ======================================================
// FIELD
// ======================================================

const Field = ({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text'
}) => {

  return (

    <div>

      <label className="text-gray-400 text-xs block mb-2">
        {label}
      </label>


      <input
        type={
          type
        }
        value={
          value
        }
        onChange={
          event =>
            onChange(
              event.target.value
            )
        }
        placeholder={
          placeholder
        }
        className="w-full h-11 rounded-xl bg-[#0c0c0c] border border-[#262626] text-white px-4 text-sm outline-none placeholder:text-gray-700 focus:border-[#00ff88]/40"
      />

    </div>

  );

};


// ======================================================
// PASSWORD
// ======================================================

const PasswordField = ({
  label,
  value,
  onChange,
  show,
  setShow
}) => {

  return (

    <div>

      <label className="text-gray-400 text-xs block mb-2">
        {label}
      </label>


      <div className="relative">

        <input
          type={
            show
              ? 'text'
              : 'password'
          }
          value={
            value
          }
          onChange={
            event =>
              onChange(
                event.target.value
              )
          }
          className="w-full h-11 rounded-xl bg-[#0c0c0c] border border-[#262626] text-white px-4 pr-12 text-sm outline-none focus:border-[#00ff88]/40"
        />


        <button
          type="button"
          onClick={() =>
            setShow(
              !show
            )
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
        >

          {
            show
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

  );

};


// ======================================================
// CREDENTIAL
// ======================================================

const Credential = ({
  label,
  value
}) => {

  return (

    <div className="py-3 border-b border-[#202020] last:border-b-0">

      <p className="text-gray-600 text-xs">
        {label}
      </p>

      <p className="text-white text-sm font-medium mt-1 font-mono">
        {value}
      </p>

    </div>

  );

};


export default NexgymNewGymPage;