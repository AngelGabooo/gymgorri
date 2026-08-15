// src/components/Members/Register/RegisterSubscriptionPage.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  useNavigate,
  useLocation
} from 'react-router-dom';

import {
  ArrowLeft,
  Check,
  Calendar,
  CreditCard,
  Upload,
  QrCode,
  User,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';

import {
  useGymSettings
} from '../../../context/GymSettingsContext';

import {
  buildPromotionSnapshot,
  calculatePromotionPrice,
  getAvailablePromotions
} from '../../../services/promotionService';


// ======================================================
// MESES
// ======================================================

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic'
];


// ======================================================
// FORMATEAR FECHA
// ======================================================

const formatDate = (
  date
) => {

  if (!(date instanceof Date)) {
    return '';
  }

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  const month =
    MONTHS[
      date.getMonth()
    ];

  const year =
    date.getFullYear();

  return `${day} ${month} ${year}`;
};


// ======================================================
// COMPONENTE
// ======================================================

const RegisterSubscriptionPage = () => {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const topRef =
    useRef(null);


  // ======================================================
  // CONFIGURACIÓN GLOBAL
  // ======================================================

  const {
    settings
  } = useGymSettings();


  // ======================================================
  // MIEMBRO
  // ======================================================

  const memberData =
    location.state?.memberData || {

      firstName:
        '',

      lastName:
        '',

      phone:
        '',

      email:
        '',

      id:
        'GYM-00000',

      registrationDate:
        new Date()
          .toISOString(),

      profilePhoto:
        null

    };


  const promotionContext =
    location.state?.promotionContext ||
    memberData?.promotionProfile ||
    null;


  // ======================================================
  // CONFIGURACIÓN DE SUSCRIPCIONES DESDE SETTINGS
  // ======================================================

  const currency =
    settings.currency ||
    'MXN';


  const plans =
    useMemo(
      () => [

        {
          ...settings.subscriptionPlans.sevenDays,
          configured: true
        },

        {
          ...settings.subscriptionPlans.fifteenDays,
          configured: true
        },

        {
          ...settings.subscriptionPlans.monthly,
          configured: true
        },

        {
          ...settings.subscriptionPlans.annual,
          configured: true
        }

      ],
      [
        settings.subscriptionPlans
      ]
    );


  // ======================================================
  // MÉTODOS DE PAGO SEGÚN SETTINGS
  // ======================================================

  const paymentMethods =
    useMemo(
      () => {

        const available = [];

        if (
          settings
            ?.paymentMethods
            ?.efectivo
        ) {

          available.push({
            id:
              'efectivo',

            label:
              'Efectivo'
          });

        }


        if (
          settings
            ?.paymentMethods
            ?.tarjeta
        ) {

          available.push({
            id:
              'tarjeta',

            label:
              'Tarjeta'
          });

        }


        if (
          settings
            ?.paymentMethods
            ?.transferencia
        ) {

          available.push({
            id:
              'transferencia',

            label:
              'Transferencia'
          });

        }


        if (
          settings
            ?.paymentMethods
            ?.otro
        ) {

          available.push({
            id:
              'otro',

            label:
              'Otro'
          });

        }


        return available;

      },
      [
        settings.paymentMethods
      ]
    );


  // ======================================================
  // ESTADO DEL FORMULARIO
  // ======================================================

  const [
    formData,
    setFormData
  ] = useState({

    selectedPlan:
      'mensual',

    promotionId:
      promotionContext?.id ||
      '',

    promotionReference:
      promotionContext?.reference ||
      '',

    startDate:
      formatDate(
        new Date()
      ),

    endDate:
      '',

    paymentMethod:
      '',

    receivedAmount:
      Number(
        settings.subscriptionPlans.monthly.price ||
        0
      ).toFixed(
        2
      ),

    change:
      '0.00',

    reference:
      '',

    notes:
      '',

    receipt:
      null

  });


  const [
    showConfirmModal,
    setShowConfirmModal
  ] = useState(
    false
  );


  const [
    showSaveWithoutSubscriptionModal,
    setShowSaveWithoutSubscriptionModal
  ] = useState(
    false
  );


  const [
    isProcessing,
    setIsProcessing
  ] = useState(
    false
  );


  const [
    isActivated,
    setIsActivated
  ] = useState(
    false
  );


  const [
    errors,
    setErrors
  ] = useState({});


  // ======================================================
  // DATOS DERIVADOS
  // ======================================================

  const fullName =
    `${memberData.firstName || ''} ${memberData.lastName || ''}`
      .trim() ||
    'Nuevo miembro';


  const memberId =
    memberData.id ||
    'GYM-00000';


  const selectedPlanData =
    useMemo(
      () => {

        return plans.find(
          plan =>
            plan.id ===
            formData.selectedPlan
        ) || plans[0];

      },
      [
        plans,
        formData.selectedPlan
      ]
    );


  const subscriptionPrice =
    Number(
      selectedPlanData?.price ||
      0
    );


  const availablePromotions =
    useMemo(
      () =>
        getAvailablePromotions(
          settings,
          selectedPlanData?.id
        ),
      [
        settings,
        selectedPlanData?.id
      ]
    );


  const promotionPricing =
    useMemo(
      () =>
        calculatePromotionPrice({
          settings,
          plan:
            selectedPlanData,
          promotionId:
            formData.promotionId
        }),
      [
        settings,
        selectedPlanData,
        formData.promotionId
      ]
    );


  const finalPrice =
    Number(
      promotionPricing.finalPrice ||
      0
    );


  const discountAmount =
    Number(
      promotionPricing.discountAmount ||
      0
    );


  const selectedPromotion =
    promotionPricing.promotion;


  const promotionLocked =
    promotionContext?.locked === true &&
    Boolean(
      promotionContext?.id
    );


  // ======================================================
  // CALCULAR VENCIMIENTO
  // ======================================================

  const calculateEndDate = (
    plan
  ) => {

    const start =
      new Date();

    start.setHours(
      12,
      0,
      0,
      0
    );


    const end =
      new Date(
        start
      );


    const planId =
      String(
        plan?.id ||
        ''
      ).toLowerCase();


    // Mensual = misma fecha del mes siguiente.
    // Ejemplo: 14 ago 2026 -> 14 sep 2026.
    if (
      planId ===
      'mensual'
    ) {

      const originalDay =
        end.getDate();

      end.setDate(1);
      end.setMonth(
        end.getMonth() +
        1
      );

      const lastDayOfTargetMonth =
        new Date(
          end.getFullYear(),
          end.getMonth() + 1,
          0
        ).getDate();

      end.setDate(
        Math.min(
          originalDay,
          lastDayOfTargetMonth
        )
      );

      return formatDate(
        end
      );
    }


    // Anual = misma fecha del año siguiente.
    // Ejemplo: 14 ago 2026 -> 14 ago 2027.
    if (
      planId ===
      'anual'
    ) {

      end.setFullYear(
        end.getFullYear() +
        1
      );

      return formatDate(
        end
      );
    }


    // Planes por días: se suman exactamente los días configurados.
    // 7 días: 14 ago -> 21 ago.
    // 15 días: 14 ago -> 29 ago.
    end.setDate(
      end.getDate() +
      Number(
        plan?.days ||
        0
      )
    );


    return formatDate(
      end
    );

  };


  // ======================================================
  // INICIALIZAR MÉTODO
  // ======================================================

  useEffect(
    () => {

      if (
        !promotionPricing.isCourtesy &&
        paymentMethods.length ===
        0
      ) {

        setFormData(
          previous => ({

            ...previous,

            paymentMethod:
              ''

          })
        );

        return;

      }


      const stillAvailable =
        paymentMethods.some(
          method =>
            method.id ===
            formData.paymentMethod
        );


      if (
        !stillAvailable
      ) {

        setFormData(
          previous => ({

            ...previous,

            paymentMethod:
              paymentMethods[0].id

          })
        );

      }

    },
    [
      paymentMethods,
      formData.paymentMethod
    ]
  );


  // ======================================================
  // ACTUALIZAR PRECIO Y FECHAS
  // ======================================================

  useEffect(
    () => {

      if (
        !selectedPlanData
      ) {
        return;
      }


      setFormData(
        previous => ({

          ...previous,

          startDate:
            formatDate(
              new Date()
            ),

          endDate:
            calculateEndDate(
              selectedPlanData
            ),

          receivedAmount:
            Number(
              promotionPricing.finalPrice
            ).toFixed(
              2
            ),

          change:
            '0.00'

        })
      );

    },
    [
      selectedPlanData,
      promotionPricing.finalPrice
    ]
  );


  // ======================================================
  // NORMALIZAR PROMOCIÓN / CORTESÍA
  // ======================================================

  useEffect(
    () => {

      if (
        formData.promotionId &&
        !availablePromotions.some(
          promotion =>
            promotion.id ===
            formData.promotionId
        )
      ) {

        setFormData(
          previous => ({
            ...previous,
            promotionId:
              '',
            promotionReference:
              ''
          })
        );

        return;

      }


      if (
        promotionPricing.isCourtesy
      ) {

        setFormData(
          previous => ({
            ...previous,
            paymentMethod:
              'cortesia',
            receivedAmount:
              '0.00',
            change:
              '0.00',
            reference:
              ''
          })
        );

        return;

      }


      if (
        formData.paymentMethod ===
        'cortesia'
      ) {

        setFormData(
          previous => ({
            ...previous,
            paymentMethod:
              paymentMethods[0]?.id ||
              '',
            receivedAmount:
              finalPrice.toFixed(
                2
              ),
            change:
              '0.00'
          })
        );

      }

    },
    [
      availablePromotions,
      formData.promotionId,
      formData.paymentMethod,
      promotionPricing.isCourtesy,
      paymentMethods,
      finalPrice
    ]
  );


  // ======================================================
  // PROMOCIÓN DEFINIDA DESDE EL PASO 1
  // ======================================================

  useEffect(
    () => {

      if (!promotionLocked) {
        return;
      }


      setFormData(
        previous => ({
          ...previous,
          promotionId:
            promotionContext.id,
          promotionReference:
            promotionContext.reference ||
            previous.promotionReference ||
            ''
        })
      );

    },
    [
      promotionLocked,
      promotionContext?.id,
      promotionContext?.reference
    ]
  );


  // ======================================================
  // SCROLL
  // ======================================================

  useEffect(
    () => {

      if (
        topRef.current
      ) {

        topRef.current.scrollIntoView({
          behavior:
            'smooth'
        });

      }

    },
    []
  );


  // ======================================================
  // CAMBIO EFECTIVO
  // ======================================================

  useEffect(
    () => {

      if (
        formData.paymentMethod !==
        'efectivo'
      ) {

        setFormData(
          previous => ({

            ...previous,

            change:
              '0.00'

          })
        );

        return;

      }


      const received =
        Number(
          formData.receivedAmount ||
          0
        );


      const change =
        Math.max(
          0,
          received -
          finalPrice
        );


      setFormData(
        previous => {

          const next =
            change.toFixed(
              2
            );


          if (
            previous.change ===
            next
          ) {

            return previous;

          }


          return {

            ...previous,

            change:
              next

          };

        }
      );

    },
    [
      formData.receivedAmount,
      formData.paymentMethod,
      finalPrice
    ]
  );


  // ======================================================
  // SELECCIONAR PLAN
  // ======================================================

  const handlePlanSelect = (
    planId
  ) => {

    setFormData(
      previous => ({

        ...previous,

        selectedPlan:
          planId,

        promotionId:
          '',

        promotionReference:
          '',

        reference:
          ''

      })
    );


    setErrors({});

  };


  // ======================================================
  // MÉTODO DE PAGO
  // ======================================================

  const handlePaymentMethodSelect = (
    method
  ) => {

    setFormData(
      previous => ({

        ...previous,

        paymentMethod:
          method,

        reference:
          '',

        receivedAmount:
          method ===
            'efectivo'
            ? previous.receivedAmount
            : finalPrice.toFixed(
                2
              ),

        change:
          '0.00'

      })
    );


    setErrors(
      previous => ({

        ...previous,

        paymentMethod:
          '',

        reference:
          ''

      })
    );

  };


  // ======================================================
  // INPUT
  // ======================================================

  const handleInputChange = (
    event
  ) => {

    const {
      name,
      value
    } =
      event.target;


    setFormData(
      previous => ({

        ...previous,

        [name]:
          value

      })
    );


    if (
      errors[name]
    ) {

      setErrors(
        previous => ({

          ...previous,

          [name]:
            ''

        })
      );

    }

  };


  // ======================================================
  // MONTO RECIBIDO
  // ======================================================

  const handleAmountChange = (
    event
  ) => {

    const value =
      event.target.value;


    setFormData(
      previous => ({

        ...previous,

        receivedAmount:
          value

      })
    );


    setErrors(
      previous => ({

        ...previous,

        amount:
          ''

      })
    );

  };


  // ======================================================
  // VALIDAR ACTIVACIÓN
  // ======================================================

  const handleActivate =
    () => {

      const newErrors = {};


      if (
        paymentMethods.length ===
        0
      ) {

        newErrors.paymentMethod =
          'No hay métodos de pago habilitados. Activa uno desde Configuración.';

      } else if (
        !promotionPricing.isCourtesy &&
        !formData.paymentMethod
      ) {

        newErrors.paymentMethod =
          'Selecciona un método de pago.';

      }


      if (
        !promotionPricing.isCourtesy &&
        formData.paymentMethod ===
        'efectivo'
      ) {

        const received =
          Number(
            formData.receivedAmount ||
            0
          );


        if (
          Number.isNaN(
            received
          ) ||
          received <
          finalPrice
        ) {

          newErrors.amount =
            `Debes recibir al menos $${finalPrice.toFixed(
              2
            )} ${currency}.`;

        }

      }


      if (
        (
          formData.paymentMethod ===
            'transferencia' ||
          formData.paymentMethod ===
            'tarjeta'
        ) &&
        !formData.reference.trim()
      ) {

        newErrors.reference =
          'Ingresa la referencia de la operación.';

      }


      if (
        selectedPromotion?.referenceRequired &&
        !formData.promotionReference.trim()
      ) {

        newErrors.promotionReference =
          selectedPromotion.id ===
            'courtesy'
            ? 'Escribe el motivo o autorización de la cortesía.'
            : 'Escribe la referencia del convenio o promoción.';

      }


      if (
        Object.keys(
          newErrors
        ).length >
        0
      ) {

        setErrors(
          newErrors
        );

        return;

      }


      setErrors({});


      setShowConfirmModal(
        true
      );

  };


  // ======================================================
  // CONFIRMAR
  // ======================================================

  const handleConfirmActivation =
    () => {

      setShowConfirmModal(
        false
      );


      setIsProcessing(
        true
      );


      setTimeout(
        () => {

          setIsProcessing(
            false
          );


          setIsActivated(
            true
          );


          const subscriptionData = {

            plan:
              formData.selectedPlan,

            planLabel:
              selectedPlanData.label,

            days:
              selectedPlanData.days,

            price:
              finalPrice.toFixed(
                2
              ),

            originalAmount:
              subscriptionPrice.toFixed(
                2
              ),

            discountAmount:
              discountAmount.toFixed(
                2
              ),

            promotion:
              buildPromotionSnapshot(
                promotionPricing,
                formData.promotionReference
              ),

            startDate:
              formData.startDate,

            endDate:
              formData.endDate,

            paymentMethod:
              promotionPricing.isCourtesy
                ? 'cortesia'
                : formData.paymentMethod,

            amount:
              finalPrice.toFixed(
                2
              ),

            receivedAmount:
              formData.paymentMethod ===
                'efectivo'
                ? Number(
                    formData.receivedAmount ||
                    0
                  ).toFixed(
                    2
                  )
                : finalPrice.toFixed(
                    2
                  ),

            change:
              formData.paymentMethod ===
                'efectivo'
                ? formData.change
                : '0.00',

            reference:
              formData.reference,

            notes:
              formData.notes,

            currency,

            status:
              'active',

            createdAt:
              new Date()
                .toISOString(),

            source:
              'initial_registration'

          };


          setTimeout(
            () => {

              navigate(
                '/members/register/qr',
                {

                  state: {

                    memberData: {

                      ...memberData,

                      profilePhoto:
                        memberData.profilePhoto

                    },

                    subscriptionData

                  }

                }
              );

            },
            1200
          );

        },
        1200
      );

  };


  // ======================================================
  // SIN SUSCRIPCIÓN
  // ======================================================

  const handleSaveWithoutSubscription =
    () => {

      setShowSaveWithoutSubscriptionModal(
        false
      );


      navigate(
        '/members'
      );

  };


  // ======================================================
  // VOLVER
  // ======================================================

  const handleBack =
    () => {

      navigate(
        '/members/register',
        {

          state: {
            memberData
          }

        }
      );

  };


  // ======================================================
  // STEPS
  // ======================================================

  const steps = [

    {
      number:
        1,

      label:
        'Datos personales',

      icon:
        User,

      completed:
        true
    },

    {
      number:
        2,

      label:
        'Suscripción',

      icon:
        CreditCard,

      completed:
        false,

      current:
        true
    },

    {
      number:
        3,

      label:
        'Código QR',

      icon:
        QrCode,

      completed:
        false
    }

  ];


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div
      className="min-h-screen bg-[#0a0a0a] flex"
      ref={
        topRef
      }
    >

      <Sidebar
        activePage="Miembros"
      />


      <div className="flex-1 lg:ml-0">

        <Header />


        <main className="p-6">


          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="mb-6">

            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/members'
                  )
                }
                className="hover:text-white"
              >
                Miembros
              </button>

              <span>
                /
              </span>

              <button
                type="button"
                onClick={
                  handleBack
                }
                className="hover:text-white"
              >
                Registrar miembro
              </button>

              <span>
                /
              </span>

              <span className="text-white">
                Suscripción
              </span>

            </div>


            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <h1 className="text-2xl font-bold text-white">
                  Registrar nuevo miembro
                </h1>

                <p className="text-gray-400">
                  Configura la suscripción inicial del nuevo miembro.
                </p>

              </div>


              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={
                    handleBack
                  }
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white flex items-center gap-2"
                >

                  <ArrowLeft
                    size={18}
                  />

                  Volver

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setShowSaveWithoutSubscriptionModal(
                      true
                    )
                  }
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-red-500 hover:text-red-400"
                >
                  Guardar sin suscripción
                </button>


                <button
                  type="button"
                  onClick={
                    handleActivate
                  }
                  className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2"
                >

                  <Check
                    size={18}
                  />

                  Activar y continuar

                </button>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* STEPPER */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mb-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                {steps.map(
                  (
                    step,
                    index
                  ) => {

                    const Icon =
                      step.icon;


                    return (

                      <React.Fragment
                        key={
                          step.number
                        }
                      >

                        <div className="flex items-center gap-2">

                          <div
                            className={`
                              w-8
                              h-8
                              rounded-full
                              flex
                              items-center
                              justify-center
                              text-xs
                              font-bold

                              ${
                                step.completed
                                  ? 'bg-[#00ff88] text-black'
                                  : step.current
                                    ? 'bg-[#00ff88] text-black ring-2 ring-[#00ff88] ring-offset-2 ring-offset-[#111111]'
                                    : 'bg-[#1a1a1a] text-gray-500'
                              }
                            `}
                          >

                            {
                              step.completed
                                ? (
                                    <Check
                                      size={16}
                                    />
                                  )
                                : step.number
                            }

                          </div>


                          <span
                            className={`
                              text-sm
                              font-medium

                              ${
                                step.completed
                                  ? 'text-[#00ff88]'
                                  : step.current
                                    ? 'text-white'
                                    : 'text-gray-500'
                              }
                            `}
                          >

                            {step.label}

                          </span>

                        </div>


                        {
                          index <
                            steps.length -
                            1 &&
                          (

                            <div className="hidden sm:block w-12 h-px bg-[#2a2a2a]" />

                          )
                        }

                      </React.Fragment>

                    );

                  }
                )}

              </div>


              <p className="text-gray-500 text-xs">
                Paso 2 de 3 · Configurando suscripción
              </p>

            </div>

          </div>


          {/* ================================================= */}
          {/* MIEMBRO */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 mb-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">

                  {
                    memberData.profilePhoto
                      ? (

                        <img
                          src={
                            memberData.profilePhoto
                          }
                          alt={
                            fullName
                          }
                          className="w-full h-full object-cover"
                        />

                      )
                      : (

                        <User
                          size={24}
                          className="text-gray-500"
                        />

                      )
                  }

                </div>


                <div>

                  <div className="flex items-center gap-2">

                    <h3 className="text-white font-semibold">
                      {fullName}
                    </h3>

                    <span className="text-gray-500 text-sm font-mono">
                      {memberId}
                    </span>

                  </div>


                  <div className="flex flex-wrap items-center gap-4 text-sm">

                    <span className="text-gray-400">
                      {
                        memberData.phone ||
                        'Sin teléfono'
                      }
                    </span>

                    {
                      memberData.email &&
                      (

                        <span className="text-gray-400">
                          {memberData.email}
                        </span>

                      )
                    }

                  </div>

                </div>

              </div>


              <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                Sin suscripción
              </span>

            </div>

          </div>


          {/* ================================================= */}
          {/* GRID */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            <div className="xl:col-span-2 space-y-6">


              {/* ================================================= */}
              {/* SUSCRIPCIÓN */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-1">
                  Configurar suscripción
                </h3>

                <p className="text-gray-400 text-sm mb-6">
                  Define el periodo inicial de acceso al gimnasio.
                </p>


                {/* PLANES */}

                <div className="mb-6">

                  <label className="text-white text-sm font-medium mb-2 block">
                    Selecciona un plan
                  </label>


                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                    {plans.map(
                      plan => (

                        <button
                          type="button"
                          key={
                            plan.id
                          }
                          onClick={() =>
                            handlePlanSelect(
                              plan.id
                            )
                          }
                          className={`
                            relative
                            p-3
                            rounded-xl
                            border-2
                            text-center
                            transition-all

                            ${
                              formData.selectedPlan ===
                              plan.id
                                ? 'border-[#00ff88] bg-[#00ff88]/10'
                                : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/50'
                            }
                          `}
                        >

                          {
                            plan.configured &&
                            (

                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#00ff88] text-black rounded-full text-[9px] font-bold whitespace-nowrap">
                                CONFIGURACIÓN
                              </span>

                            )
                          }


                          <div className="flex flex-col items-center">

                            {
                              formData.selectedPlan ===
                                plan.id &&
                              (

                                <Check
                                  size={14}
                                  className="text-[#00ff88] mb-1"
                                />

                              )
                            }

                            <span className="text-white font-bold text-lg">
                              {plan.label}
                            </span>

                            <span className="text-[#00ff88] text-sm font-medium">
                              {plan.days} días
                            </span>

                            <span className="text-gray-400 text-xs mt-1">
                              ${Number(
                                plan.price
                              ).toFixed(
                                2
                              )} {currency}
                            </span>

                          </div>

                        </button>

                      )
                    )}

                  </div>


                  <p className="text-gray-500 text-xs mt-3">
                    Todos los planes utilizan automáticamente el precio y duración definidos en Configuración.
                  </p>

                </div>


                {/* FECHAS */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">
                      Fecha de inicio
                    </label>


                    <div className="relative">

                      <Calendar
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />

                      <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white">
                        {formData.startDate}
                      </div>

                    </div>


                    <p className="text-gray-500 text-xs mt-1">
                      La suscripción inicial comienza hoy.
                    </p>

                  </div>


                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">
                      Fecha de vencimiento
                    </label>


                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 flex items-center justify-between">

                      <span className="text-white font-medium">
                        {
                          formData.endDate ||
                          'Calculando...'
                        }
                      </span>

                      <span className="px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full">
                        {selectedPlanData.days} días
                      </span>

                    </div>

                  </div>

                </div>


                {/* PERIODO */}

                <div className="mt-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">

                  <h4 className="text-white text-sm font-medium mb-3">
                    Periodo de acceso
                  </h4>


                  <div className="flex flex-col items-center">

                    <div className="flex items-center gap-3 text-sm">

                      <span className="text-gray-400">
                        INICIO
                      </span>

                      <span className="text-[#00ff88] font-bold">
                        {formData.startDate.toUpperCase()}
                      </span>

                    </div>


                    <div className="flex items-center gap-4 my-2">

                      <div className="w-20 h-px bg-[#2a2a2a]" />

                      <div className="flex items-center gap-2">

                        <Clock
                          size={16}
                          className="text-[#00ff88]"
                        />

                        <span className="text-[#00ff88] font-medium">
                          {selectedPlanData.days} DÍAS
                        </span>

                      </div>

                      <div className="w-20 h-px bg-[#2a2a2a]" />

                    </div>


                    <div className="flex items-center gap-3 text-sm">

                      <span className="text-gray-400">
                        VENCIMIENTO
                      </span>

                      <span className="text-yellow-500 font-bold">
                        {formData.endDate.toUpperCase()}
                      </span>

                    </div>

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* PAGO */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-1">
                  Información del pago
                </h3>

                <p className="text-gray-400 text-sm mb-6">
                  Registra el pago correspondiente a la activación inicial.
                </p>


                {/* PRECIO + PROMOCIÓN */}

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-gray-400 text-sm">
                        Precio normal
                      </p>

                      <p className={`text-lg font-bold ${promotionPricing.applied ? 'text-gray-500 line-through' : 'text-white'}`}>
                        ${finalPrice.toFixed(
                          2
                        )} {currency}
                      </p>

                      <p className="text-gray-500 text-xs">
                        {selectedPlanData.label} · {selectedPlanData.days} días
                      </p>

                    </div>


                    <div className="text-right">

                      <p className="text-gray-400 text-xs uppercase tracking-wider">
                        Total a pagar
                      </p>

                      <p className="text-3xl font-black text-[#00ff88]">
                        ${finalPrice.toFixed(
                          2
                        )} {currency}
                      </p>

                      {
                        promotionPricing.applied &&
                        (

                          <p className="text-[#00ff88] text-xs mt-1">
                            Ahorras ${discountAmount.toFixed(2)} {currency}
                          </p>

                        )
                      }

                    </div>

                  </div>


                  <div className="border-t border-[#2a2a2a] mt-4 pt-4">

                    <label className="text-white text-sm font-medium mb-2 block">
                      Promoción o descuento
                    </label>


                    <select
                      name="promotionId"
                      value={formData.promotionId}
                      onChange={handleInputChange}
                      disabled={promotionLocked}
                      className="w-full bg-[#111111] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                    >

                      <option value="">
                        Sin promoción
                      </option>

                      {availablePromotions.map(
                        promotion => (

                          <option
                            key={promotion.id}
                            value={promotion.id}
                          >
                            {promotion.label}
                          </option>

                        )
                      )}

                    </select>


                    {promotionLocked && (
                      <p className="text-[#00ff88] text-xs mt-2">
                        Esta promoción fue seleccionada al registrar al miembro. Para cambiarla, vuelve al Paso 1.
                      </p>
                    )}


                    {
                      selectedPromotion &&
                      (

                        <div className="mt-3 p-3 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20">

                          <div className="flex justify-between gap-3 text-sm">

                            <span className="text-gray-400">
                              Promoción
                            </span>

                            <span className="text-white font-semibold">
                              {selectedPromotion.label}
                            </span>

                          </div>

                          <div className="flex justify-between gap-3 text-sm mt-1">

                            <span className="text-gray-400">
                              Descuento
                            </span>

                            <span className="text-[#00ff88] font-semibold">
                              -${discountAmount.toFixed(2)} {currency}
                            </span>

                          </div>

                        </div>

                      )
                    }


                    {
                      selectedPromotion?.referenceRequired &&
                      (

                        <div className="mt-3">

                          <label className="text-white text-sm font-medium mb-1 block">
                            {selectedPromotion.id === 'courtesy'
                              ? 'Motivo / autorización de cortesía'
                              : 'Referencia del convenio'}
                          </label>

                          <input
                            type="text"
                            name="promotionReference"
                            value={formData.promotionReference}
                            onChange={handleInputChange}
                            placeholder={
                              selectedPromotion.id === 'courtesy'
                                ? 'Ej. Autorizada por administración'
                                : 'Ej. UPChiapas / Empresa ABC'
                            }
                            className={`w-full bg-[#111111] border ${
                              errors.promotionReference
                                ? 'border-red-500'
                                : 'border-[#2a2a2a]'
                            } rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none`}
                          />

                          {
                            errors.promotionReference &&
                            (
                              <p className="text-red-400 text-xs mt-1">
                                {errors.promotionReference}
                              </p>
                            )
                          }

                        </div>

                      )
                    }

                  </div>

                </div>


                {/* MÉTODOS */}

                <div className="mb-4">

                  <label className="text-white text-sm font-medium mb-2 block">
                    Método de pago
                  </label>


                  {
                    promotionPricing.isCourtesy
                      ? (

                        <div className="p-4 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl">

                          <p className="text-[#00ff88] font-bold">
                            Cortesía
                          </p>

                          <p className="text-gray-400 text-xs mt-1">
                            No se cobrará esta suscripción. La operación quedará registrada con total $0.00.
                          </p>

                        </div>

                      )
                      : paymentMethods.length >
                        0
                      ? (

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

                          {paymentMethods.map(
                            method => (

                              <button
                                type="button"
                                key={
                                  method.id
                                }
                                onClick={() =>
                                  handlePaymentMethodSelect(
                                    method.id
                                  )
                                }
                                className={`
                                  p-3
                                  rounded-xl
                                  border-2
                                  text-center
                                  transition-all

                                  ${
                                    formData.paymentMethod ===
                                    method.id
                                      ? 'border-[#00ff88] bg-[#00ff88]/10'
                                      : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/50'
                                  }
                                `}
                              >

                                {
                                  formData.paymentMethod ===
                                    method.id &&
                                  (

                                    <Check
                                      size={14}
                                      className="text-[#00ff88] mx-auto mb-1"
                                    />

                                  )
                                }

                                <span className="text-white text-sm font-medium">
                                  {method.label}
                                </span>

                              </button>

                            )
                          )}

                        </div>

                      )
                      : (

                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">

                          <p className="text-red-400 text-sm font-medium">
                            No hay métodos de pago habilitados
                          </p>

                          <p className="text-gray-400 text-xs mt-1">
                            Ve a Configuración → Recibos y pagos y habilita al menos uno.
                          </p>

                        </div>

                      )
                  }


                  {
                    errors.paymentMethod &&
                    (

                      <p className="text-red-400 text-xs mt-2">
                        {errors.paymentMethod}
                      </p>

                    )
                  }

                </div>


                {/* EFECTIVO */}

                {
                  formData.paymentMethod ===
                    'efectivo' &&
                  (

                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">
                        Monto recibido
                      </label>


                      <div className="relative">

                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          $
                        </span>

                        <input
                          type="number"
                          value={
                            formData.receivedAmount
                          }
                          onChange={
                            handleAmountChange
                          }
                          className={`w-full bg-[#1a1a1a] border ${
                            errors.amount
                              ? 'border-red-500'
                              : 'border-[#2a2a2a]'
                          } rounded-xl pl-8 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
                          step="0.01"
                          min="0"
                        />

                      </div>


                      {
                        errors.amount &&
                        (

                          <p className="text-red-400 text-xs mt-1">
                            {errors.amount}
                          </p>

                        )
                      }


                      <div className="mt-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">

                        <div className="flex justify-between text-sm">

                          <span className="text-gray-400">
                            Total
                          </span>

                          <span className="text-white">
                            ${finalPrice.toFixed(
                              2
                            )} {currency}
                          </span>

                        </div>


                        <div className="flex justify-between text-sm mt-1">

                          <span className="text-gray-400">
                            Recibido
                          </span>

                          <span className="text-white">
                            ${Number(
                              formData.receivedAmount ||
                              0
                            ).toFixed(
                              2
                            )} {currency}
                          </span>

                        </div>


                        <div className="flex justify-between pt-2 mt-2 border-t border-[#2a2a2a]">

                          <span className="text-gray-400">
                            Cambio
                          </span>

                          <span className="text-[#00ff88] font-bold">
                            ${formData.change} {currency}
                          </span>

                        </div>

                      </div>

                    </div>

                  )
                }


                {/* TARJETA / TRANSFERENCIA */}

                {
                  (
                    formData.paymentMethod ===
                      'transferencia' ||
                    formData.paymentMethod ===
                      'tarjeta'
                  ) &&
                  (

                    <div className="space-y-4">

                      <div>

                        <label className="text-white text-sm font-medium mb-1 block">

                          {
                            formData.paymentMethod ===
                              'transferencia'
                              ? 'Referencia de transferencia'
                              : 'Referencia de operación'
                          }

                        </label>

                        <input
                          type="text"
                          name="reference"
                          value={
                            formData.reference
                          }
                          onChange={
                            handleInputChange
                          }
                          placeholder="Ej. 839201"
                          className={`w-full bg-[#1a1a1a] border ${
                            errors.reference
                              ? 'border-red-500'
                              : 'border-[#2a2a2a]'
                          } rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none`}
                        />

                        {
                          errors.reference &&
                          (

                            <p className="text-red-400 text-xs mt-1">
                              {errors.reference}
                            </p>

                          )
                        }

                      </div>


                      <div className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 text-center">

                        <Upload
                          size={24}
                          className="text-gray-500 mx-auto mb-2"
                        />

                        <p className="text-gray-400 text-sm">
                          Comprobante opcional
                        </p>

                        <p className="text-gray-500 text-xs">
                          JPG, PNG o PDF
                        </p>

                      </div>

                    </div>

                  )
                }


                {/* OTRO */}

                {
                  formData.paymentMethod ===
                    'otro' &&
                  (

                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">
                        Referencia o descripción
                      </label>

                      <input
                        type="text"
                        name="reference"
                        value={
                          formData.reference
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="Describe el método utilizado"
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none"
                      />

                    </div>

                  )
                }


                {/* FECHA */}

                <div className="mt-4">

                  <label className="text-white text-sm font-medium mb-1 block">
                    Fecha del pago
                  </label>

                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 flex items-center justify-between">

                    <span className="text-white">
                      {formData.startDate}
                    </span>

                    <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                      Automática
                    </span>

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* NOTAS */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <div className="flex items-center justify-between mb-2">

                  <h3 className="text-white font-bold">
                    Notas
                  </h3>

                  <span className="text-gray-500 text-xs">
                    Opcional
                  </span>

                </div>


                <textarea
                  name="notes"
                  placeholder="Agrega información adicional sobre esta suscripción..."
                  value={
                    formData.notes
                  }
                  onChange={
                    handleInputChange
                  }
                  rows="3"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none resize-none"
                />

              </div>

            </div>


            {/* ================================================= */}
            {/* RESUMEN */}
            {/* ================================================= */}

            <div className="xl:col-span-1">

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">

                <h3 className="text-white font-bold mb-4">
                  Resumen del registro
                </h3>


                <div className="flex items-center gap-3 mb-4">

                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">

                    {
                      memberData.profilePhoto
                        ? (

                          <img
                            src={
                              memberData.profilePhoto
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />

                        )
                        : (

                          <User
                            size={24}
                            className="text-gray-500"
                          />

                        )
                    }

                  </div>


                  <div>

                    <p className="text-white font-medium">
                      {fullName}
                    </p>

                    <p className="text-gray-500 text-sm font-mono">
                      {memberId}
                    </p>

                  </div>

                </div>


                <div className="space-y-4 border-t border-[#1a1a1a] pt-4">

                  <div>

                    <p className="text-gray-400 text-xs font-medium mb-1">
                      Suscripción
                    </p>


                    <div className="space-y-1 text-sm">

                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Plan
                        </span>

                        <span className="text-white">
                          {selectedPlanData.label}
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Duración
                        </span>

                        <span className="text-white">
                          {selectedPlanData.days} días
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Inicio
                        </span>

                        <span className="text-white">
                          {formData.startDate}
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Vencimiento
                        </span>

                        <span className="text-yellow-500">
                          {formData.endDate}
                        </span>

                      </div>

                    </div>

                  </div>


                  <div>

                    <p className="text-gray-400 text-xs font-medium mb-1">
                      Pago
                    </p>


                    <div className="space-y-1 text-sm">

                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Total
                        </span>

                        <span className="text-[#00ff88] font-medium">
                          ${finalPrice.toFixed(
                            2
                          )} {currency}
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Método
                        </span>

                        <span className="text-white capitalize">
                          {
                            formData.paymentMethod ||
                            '—'
                          }
                        </span>

                      </div>

                    </div>

                  </div>


                  {
                    selectedPlanData.configured &&
                    (

                      <div className="p-3 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl">

                        <p className="text-[#00ff88] text-xs font-medium">
                          Datos sincronizados
                        </p>

                        <p className="text-gray-400 text-xs mt-1">
                          El precio y duración de este plan provienen de Configuración.
                        </p>

                      </div>

                    )
                  }


                  <div className="border-t border-[#1a1a1a] pt-3">

                    <p className="text-gray-400 text-xs font-medium mb-1">
                      Acceso
                    </p>

                    <div className="flex items-center gap-2">

                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />

                      <span className="text-yellow-500 text-sm">
                        Pendiente de activación
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* BOTONES INFERIORES */}
          {/* ================================================= */}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#1a1a1a]">

            <button
              type="button"
              onClick={
                handleBack
              }
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >

              <ArrowLeft
                size={18}
              />

              Volver a datos personales

            </button>


            <div className="flex gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowSaveWithoutSubscriptionModal(
                    true
                  )
                }
                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-red-500 hover:text-red-400"
              >
                Guardar sin suscripción
              </button>


              <button
                type="button"
                onClick={
                  handleActivate
                }
                className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2"
              >

                Activar y continuar

                <ChevronRight
                  size={18}
                />

              </button>

            </div>

          </div>

        </main>

      </div>


      {/* ================================================= */}
      {/* CONFIRMACIÓN */}
      {/* ================================================= */}

      {
        showConfirmModal &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">

                  <AlertCircle
                    size={32}
                    className="text-yellow-500"
                  />

                </div>


                <h2 className="text-white text-xl font-bold mb-2">
                  Confirmar suscripción
                </h2>


                <div className="text-left space-y-2 mb-4 text-sm">

                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Miembro
                    </span>

                    <span className="text-white">
                      {fullName}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      ID
                    </span>

                    <span className="text-white font-mono">
                      {memberId}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Plan
                    </span>

                    <span className="text-white">
                      {selectedPlanData.label} · {selectedPlanData.days} días
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Periodo
                    </span>

                    <span className="text-white text-right">
                      {formData.startDate}
                      <br />
                      {formData.endDate}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Total
                    </span>

                    <span className="text-[#00ff88] font-bold">
                      ${finalPrice.toFixed(
                        2
                      )} {currency}
                    </span>

                  </div>


                  {
                    formData.paymentMethod ===
                      'efectivo' &&
                    (

                      <>

                        <div className="flex justify-between">

                          <span className="text-gray-400">
                            Recibido
                          </span>

                          <span className="text-white">
                            ${Number(
                              formData.receivedAmount ||
                              0
                            ).toFixed(
                              2
                            )} {currency}
                          </span>

                        </div>


                        <div className="flex justify-between">

                          <span className="text-gray-400">
                            Cambio
                          </span>

                          <span className="text-white">
                            ${formData.change} {currency}
                          </span>

                        </div>

                      </>

                    )
                  }


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Método
                    </span>

                    <span className="text-white capitalize">
                      {formData.paymentMethod}
                    </span>

                  </div>

                </div>


                <p className="text-gray-400 text-sm mb-6">
                  Al confirmar continuaremos con la generación de los métodos de acceso.
                </p>


                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmModal(
                        false
                      )
                    }
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white"
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleConfirmActivation
                    }
                    className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold"
                  >
                    Confirmar
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* SIN SUSCRIPCIÓN */}
      {/* ================================================= */}

      {
        showSaveWithoutSubscriptionModal &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">

                  <AlertCircle
                    size={32}
                    className="text-red-400"
                  />

                </div>


                <h2 className="text-white text-xl font-bold mb-2">
                  Guardar miembro sin suscripción
                </h2>


                <p className="text-gray-400 text-sm mb-4">
                  {fullName} permanecerá registrado, pero no podrá acceder hasta activar una suscripción.
                </p>


                <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-400">
                      Perfil
                    </span>

                    <span className="text-[#00ff88]">
                      Registrado
                    </span>

                  </div>


                  <div className="flex justify-between text-sm mt-1">

                    <span className="text-gray-400">
                      Suscripción
                    </span>

                    <span className="text-gray-400">
                      Sin suscripción
                    </span>

                  </div>


                  <div className="flex justify-between text-sm mt-1">

                    <span className="text-gray-400">
                      Acceso
                    </span>

                    <span className="text-red-400">
                      Bloqueado
                    </span>

                  </div>

                </div>


                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowSaveWithoutSubscriptionModal(
                        false
                      )
                    }
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white"
                  >
                    Seguir configurando
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleSaveWithoutSubscription
                    }
                    className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl"
                  >
                    Guardar sin suscripción
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* PROCESANDO */}
      {/* ================================================= */}

      {
        isProcessing &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-sm w-full mx-4">

              <div className="text-center">

                <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">

                  <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />

                </div>


                <h2 className="text-white text-xl font-bold mb-4">
                  Activando suscripción...
                </h2>


                <div className="space-y-2 text-left">

                  <div className="flex items-center gap-2">

                    <Check
                      size={16}
                      className="text-[#00ff88]"
                    />

                    <span className="text-gray-300 text-sm">
                      Miembro registrado
                    </span>

                  </div>


                  <div className="flex items-center gap-2">

                    <div className="w-4 h-4 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />

                    <span className="text-gray-300 text-sm">
                      Preparando suscripción
                    </span>

                  </div>


                  <div className="flex items-center gap-2">

                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />

                    <span className="text-gray-500 text-sm">
                      Preparando código QR
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* ACTIVADO */}
      {/* ================================================= */}

      {
        isActivated &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-[#111111] border border-[#00ff88]/30 rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4">

                  <Check
                    size={32}
                    className="text-[#00ff88]"
                  />

                </div>


                <h2 className="text-white text-xl font-bold mb-2">
                  Suscripción activada
                </h2>


                <p className="text-gray-400 text-sm mb-4">
                  La suscripción inicial de {fullName} está lista.
                </p>


                <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-400">
                      Plan
                    </span>

                    <span className="text-white">
                      {selectedPlanData.label}
                    </span>

                  </div>


                  <div className="flex justify-between text-sm mt-1">

                    <span className="text-gray-400">
                      Periodo
                    </span>

                    <span className="text-white text-right">
                      {formData.startDate}
                      <br />
                      {formData.endDate}
                    </span>

                  </div>


                  <div className="flex justify-between text-sm mt-1">

                    <span className="text-gray-400">
                      Total
                    </span>

                    <span className="text-[#00ff88] font-medium">
                      ${finalPrice.toFixed(
                        2
                      )} {currency}
                    </span>

                  </div>


                  <div className="flex justify-between text-sm mt-1">

                    <span className="text-gray-400">
                      Estado
                    </span>

                    <span className="text-[#00ff88] font-medium">
                      ACTIVA
                    </span>

                  </div>

                </div>


                <div className="flex items-center justify-center gap-2 text-sm">

                  <span className="text-gray-400">
                    Continuando al código QR...
                  </span>

                  <div className="w-4 h-4 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />

                </div>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

};


export default RegisterSubscriptionPage;