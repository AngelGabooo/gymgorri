// src/components/Members/Profile/RenewSubscriptionPage.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  ArrowLeft,
  Check,
  Calendar,
  Upload,
  User,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  XCircle
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

import {
  getMemberById,
  saveMember
} from '../../../utils/memberId';


// ======================================================
// CONSTANTES
// ======================================================

const PAYMENTS_KEY =
  'gym_control_payments';

const SUBSCRIPTION_HISTORY_KEY =
  'gym_control_subscription_history';


// ======================================================
// PLANES
// ======================================================

const plans = [
  {
    id: '7dias',
    label: '7 días',
    days: 7,
    price: 150
  },
  {
    id: '15dias',
    label: '15 días',
    days: 15,
    price: 300
  },
  {
    id: 'mensual',
    label: 'Mensual',
    days: 30,
    price: 500
  },
  {
    id: 'anual',
    label: 'Anual',
    days: 365,
    price: 5000
  },
];


// ======================================================
// MÉTODOS DE PAGO
// ======================================================

const paymentMethods = [
  {
    id: 'efectivo',
    label: 'Efectivo'
  },
  {
    id: 'tarjeta',
    label: 'Tarjeta'
  },
  {
    id: 'transferencia',
    label: 'Transferencia'
  },
  {
    id: 'regalias',
    label: 'Regalías'
  },
];


// ======================================================
// MESES
// ======================================================

const MONTHS = {
  ene: 0,
  enero: 0,
  feb: 1,
  febrero: 1,
  mar: 2,
  marzo: 2,
  abr: 3,
  abril: 3,
  may: 4,
  mayo: 4,
  jun: 5,
  junio: 5,
  jul: 6,
  julio: 6,
  ago: 7,
  agosto: 7,
  sep: 8,
  sept: 8,
  septiembre: 8,
  oct: 9,
  octubre: 9,
  nov: 10,
  noviembre: 10,
  dic: 11,
  diciembre: 11
};


// ======================================================
// PARSEAR FECHA
// ======================================================

const parseGymDate = (value) => {

  if (!value) {
    return null;
  }

  const direct =
    new Date(value);

  if (
    !Number.isNaN(
      direct.getTime()
    )
  ) {
    return direct;
  }

  const parts =
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\./g, '')
      .split(/\s+/);

  if (
    parts.length !== 3
  ) {
    return null;
  }

  const day =
    Number(parts[0]);

  const month =
    MONTHS[parts[1]];

  const year =
    Number(parts[2]);

  if (
    Number.isNaN(day) ||
    month === undefined ||
    Number.isNaN(year)
  ) {
    return null;
  }

  return new Date(
    year,
    month,
    day
  );

};


// ======================================================
// FORMATEAR FECHA
// ======================================================

const formatGymDate = (date) => {

  if (!date) {
    return 'Fecha no disponible';
  }

  return date
    .toLocaleDateString(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )
    .replace(/\./g, '');

};


// ======================================================
// GENERAR ID
// ======================================================

const generateId = (prefix) => {

  if (
    window.crypto?.randomUUID
  ) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;

};


// ======================================================
// LEER ARRAY LOCAL
// ======================================================

const readLocalArray = (key) => {

  try {

    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      `Error leyendo ${key}:`,
      error
    );

    return [];

  }

};


// ======================================================
// GUARDAR ARRAY LOCAL
// ======================================================

const saveLocalArray = (
  key,
  data
) => {

  localStorage.setItem(
    key,
    JSON.stringify(data)
  );

  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );

};


// ======================================================
// COMPONENTE
// ======================================================

const RenewSubscriptionPage = () => {

  const navigate =
    useNavigate();

  const {
    id
  } = useParams();

  const topRef =
    useRef(null);


  const {
    settings
  } = useGymSettings();


  const currency =
    settings?.currency ===
      'USD'
      ? 'USD'
      : 'MXN';


  const plans =
    useMemo(
      () => [
        settings.subscriptionPlans.sevenDays,
        settings.subscriptionPlans.fifteenDays,
        settings.subscriptionPlans.monthly,
        settings.subscriptionPlans.annual
      ],
      [
        settings.subscriptionPlans
      ]
    );


  const paymentMethods =
    useMemo(
      () => {

        const available = [];

        if (settings?.paymentMethods?.efectivo) {
          available.push({
            id: 'efectivo',
            label: 'Efectivo'
          });
        }

        if (settings?.paymentMethods?.tarjeta) {
          available.push({
            id: 'tarjeta',
            label: 'Tarjeta'
          });
        }

        if (settings?.paymentMethods?.transferencia) {
          available.push({
            id: 'transferencia',
            label: 'Transferencia'
          });
        }

        if (settings?.paymentMethods?.otro) {
          available.push({
            id: 'otro',
            label: 'Otro'
          });
        }

        return available;

      },
      [
        settings.paymentMethods
      ]
    );


  // ======================================================
  // ESTADOS PRINCIPALES
  // ======================================================

  const [
    memberData,
    setMemberData
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    showConfirmModal,
    setShowConfirmModal
  ] = useState(false);

  const [
    isProcessing,
    setIsProcessing
  ] = useState(false);

  const [
    isActivated,
    setIsActivated
  ] = useState(false);

  const [
    errors,
    setErrors
  ] = useState({});


  // ======================================================
  // CARGAR MIEMBRO DESDE LOCALSTORAGE
  // ======================================================

  useEffect(
    () => {

      const member =
        getMemberById(id);

      if (!member) {

        console.error(
          '❌ Miembro no encontrado:',
          id
        );

        setLoading(false);

        return;

      }

      console.log(
        '🔄 Miembro cargado para renovación:',
        member
      );

      setMemberData(
        member
      );

      setLoading(false);

    },
    [id]
  );


  // ======================================================
  // SCROLL ARRIBA
  // ======================================================

  useEffect(
    () => {

      topRef.current?.scrollIntoView({
        behavior:
          'smooth'
      });

    },
    []
  );


  // ======================================================
  // SUSCRIPCIÓN ACTUAL
  // ======================================================

  const currentSubscription =
    memberData?.subscription ||
    {
      plan: '',
      days: 0,
      startDate: '',
      endDate: '',
      paymentMethod: '',
      amount: '0.00',
      status: 'inactive'
    };


  // ======================================================
  // PLAN ACTUAL
  // ======================================================

  const initialPlanId =
    useMemo(
      () => {

        if (
          currentSubscription.days
        ) {

          const found =
            plans.find(
              plan =>
                plan.days ===
                Number(
                  currentSubscription.days
                )
            );

          if (
            found
          ) {

            return found.id;

          }

        }

        return 'mensual';

      },
      [currentSubscription.days]
    );


  // ======================================================
  // CALCULAR INICIO DE RENOVACIÓN
  // ======================================================

  const getRenewalStartDate =
    () => {

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const currentEnd =
        parseGymDate(
          currentSubscription.endDate
        );


      // Si la suscripción sigue vigente,
      // renovamos a partir del día siguiente.
      if (
        currentEnd &&
        currentEnd >= today &&
        currentSubscription.status ===
          'active'
      ) {

        const nextDay =
          new Date(
            currentEnd
          );

        nextDay.setDate(
          nextDay.getDate() +
          1
        );

        return nextDay;

      }


      // Si ya venció, empieza hoy.
      return today;

    };


  // ======================================================
  // FORMULARIO
  // ======================================================

  const [
    formData,
    setFormData
  ] = useState({
    selectedPlan:
      'mensual',

    promotionId:
      '',

    promotionReference:
      '',

    startDate:
      '',

    endDate:
      '',

    paymentMethod:
      'efectivo',

    amount:
      '500.00',

    receivedAmount:
      '500.00',

    change:
      '0.00',

    reference:
      '',

    notes:
      '',

    receipt:
      null
  });


  // ======================================================
  // INICIALIZAR FORMULARIO CUANDO CARGA EL MIEMBRO
  // ======================================================

  useEffect(
    () => {

      if (
        !memberData
      ) {
        return;
      }

      const startDate =
        getRenewalStartDate();

      const selectedPlan =
        plans.find(
          plan =>
            plan.id ===
            initialPlanId
        ) ||
        plans[2];

      const endDate =
        new Date(
          startDate
        );

      // Ejemplo:
      // inicio 14 ago + 30 días => 13 sept
      endDate.setDate(
        endDate.getDate() +
        selectedPlan.days -
        1
      );

      setFormData(
        previous => ({
          ...previous,

          selectedPlan:
            selectedPlan.id,

          startDate:
            formatGymDate(
              startDate
            ),

          endDate:
            formatGymDate(
              endDate
            ),

          amount:
            selectedPlan.price.toFixed(
              2
            ),

          receivedAmount:
            selectedPlan.price.toFixed(
              2
            ),

          change:
            '0.00'
        })
      );

    },
    [
      memberData,
      initialPlanId
    ]
  );


  // ======================================================
  // PLAN SELECCIONADO
  // ======================================================

  const selectedPlanData =
    useMemo(
      () => {

        return plans.find(
          plan =>
            plan.id ===
            formData.selectedPlan
        ) ||
        plans[2];

      },
      [
        formData.selectedPlan,
        plans
      ]
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


  const originalPrice =
    Number(
      promotionPricing.originalPrice ||
      0
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


  // ======================================================
  // RECALCULAR FECHAS Y PRECIO
  // ======================================================

  useEffect(
    () => {

      if (
        !memberData ||
        !selectedPlanData
      ) {

        return;

      }

      const startDate =
        getRenewalStartDate();

      const endDate =
        new Date(
          startDate
        );


      const planId =
        String(
          selectedPlanData.id ||
          ''
        ).toLowerCase();


      if (
        planId ===
        'mensual'
      ) {

        const originalDay =
          endDate.getDate();

        endDate.setDate(1);

        endDate.setMonth(
          endDate.getMonth() +
          1
        );

        const lastDay =
          new Date(
            endDate.getFullYear(),
            endDate.getMonth() +
              1,
            0
          ).getDate();

        endDate.setDate(
          Math.min(
            originalDay,
            lastDay
          )
        );

      } else if (
        planId ===
        'anual'
      ) {

        endDate.setFullYear(
          endDate.getFullYear() +
          1
        );

      } else {

        endDate.setDate(
          endDate.getDate() +
          Number(
            selectedPlanData.days ||
            0
          )
        );

      }

      setFormData(
        previous => ({
          ...previous,

          startDate:
            formatGymDate(
              startDate
            ),

          endDate:
            formatGymDate(
              endDate
            ),

          amount:
            finalPrice.toFixed(
              2
            ),

          receivedAmount:
            finalPrice.toFixed(
              2
            ),

          change:
            '0.00'
        })
      );

    },
    [
      formData.selectedPlan,
      formData.promotionId,
      memberData,
      selectedPlanData,
      finalPrice
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
            promotionId: '',
            promotionReference: ''
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
            amount:
              '0.00',
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
        'cortesia' ||
        (
          formData.paymentMethod &&
          !paymentMethods.some(
            method =>
              method.id ===
              formData.paymentMethod
          )
        )
      ) {

        setFormData(
          previous => ({
            ...previous,
            paymentMethod:
              paymentMethods[0]?.id ||
              '',
            amount:
              finalPrice.toFixed(2),
            receivedAmount:
              finalPrice.toFixed(2),
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
  // CAMBIO
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

      const price =
        Number(
          formData.amount ||
          0
        );

      const change =
        Math.max(
          0,
          received -
          price
        );

      setFormData(
        previous => ({
          ...previous,

          change:
            change.toFixed(
              2
            )
        })
      );

    },
    [
      formData.receivedAmount,
      formData.amount,
      formData.paymentMethod
    ]
  );


  // ======================================================
  // DATOS DEL MIEMBRO
  // ======================================================

  const fullName =
    memberData
      ? `${memberData.firstName || ''} ${memberData.lastName || ''}`.trim()
      : '';

  const memberId =
    memberData?.id ||
    id ||
    '';


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
          ''
      })
    );

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
          ''
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
  // INPUTS
  // ======================================================

  const handleInputChange = (
    e
  ) => {

    const {
      name,
      value
    } = e.target;

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
  // VALIDAR
  // ======================================================

  const handleActivate =
    () => {

      const newErrors = {};


      if (
        !promotionPricing.isCourtesy &&
        !formData.paymentMethod
      ) {

        newErrors.paymentMethod =
          'Selecciona un método de pago';

      }


      if (
        !promotionPricing.isCourtesy &&
        formData.paymentMethod ===
        'efectivo'
      ) {

        const received =
          Number(
            formData.receivedAmount
          );

        const price =
          Number(
            formData.amount
          );

        if (
          Number.isNaN(
            received
          ) ||
          received <
          price
        ) {

          newErrors.receivedAmount =
            'El monto recibido no puede ser menor al costo del plan.';

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
          'Ingresa la referencia de la operación';

      }


      if (
        formData.paymentMethod ===
          'regalias' &&
        !formData.reference.trim()
      ) {

        newErrors.reference =
          'Ingresa el código de regalía';

      }


      if (
        selectedPromotion?.referenceRequired &&
        !formData.promotionReference.trim()
      ) {

        newErrors.promotionReference =
          selectedPromotion.id ===
            'courtesy'
            ? 'Escribe el motivo o autorización de la cortesía.'
            : 'Escribe la referencia del convenio.';

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
  // GUARDAR RENOVACIÓN
  // ======================================================

  const handleConfirmRenewal =
    () => {

      if (
        !memberData
      ) {
        return;
      }


      setShowConfirmModal(
        false
      );

      setIsProcessing(
        true
      );


      setTimeout(
        () => {

          try {

            const now =
              new Date()
                .toISOString();


            // ==================================================
            // NUEVA SUSCRIPCIÓN
            // ==================================================

            const newSubscription = {

              plan:
                selectedPlanData.id,

              planLabel:
                selectedPlanData.label,

              days:
                selectedPlanData.days,

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

              originalAmount:
                originalPrice.toFixed(
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

              currency,

              status:
                'active',

              renewedAt:
                now,

              updatedAt:
                now

            };


            // ==================================================
            // HISTORIAL DE SUSCRIPCIONES
            // ==================================================

            const history =
              readLocalArray(
                SUBSCRIPTION_HISTORY_KEY
              );


            const historyRecord = {

              id:
                generateId(
                  'SUBH'
                ),

              memberId:
                memberId,

              memberName:
                fullName,

              type:
                'renewal',

              previousSubscription:
                currentSubscription,

              subscription:
                newSubscription,

              notes:
                formData.notes ||
                '',

              createdAt:
                now

            };


            history.unshift(
              historyRecord
            );


            saveLocalArray(
              SUBSCRIPTION_HISTORY_KEY,
              history
            );


            // ==================================================
            // REGISTRAR PAGO
            // ==================================================

            const payments =
              readLocalArray(
                PAYMENTS_KEY
              );


            const paymentRecord = {

              id:
                generateId(
                  'PAY'
                ),

              memberId:
                memberId,

              memberName:
                fullName,

              concept:
                'Renovación de suscripción',

              plan:
                selectedPlanData.id,

              planLabel:
                selectedPlanData.label,

              period:
                `${formData.startDate} - ${formData.endDate}`,

              method:
                promotionPricing.isCourtesy
                  ? 'cortesia'
                  : formData.paymentMethod,

              paymentMethod:
                promotionPricing.isCourtesy
                  ? 'cortesia'
                  : formData.paymentMethod,

              amount:
                finalPrice.toFixed(
                  2
                ),

              originalAmount:
                originalPrice.toFixed(
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

              currency,

              receivedAmount:
                formData.paymentMethod ===
                'efectivo'
                  ? Number(
                      formData.receivedAmount
                    ).toFixed(2)
                  : finalPrice.toFixed(
                      2
                    ),

              change:
                formData.paymentMethod ===
                'efectivo'
                  ? formData.change
                  : '0.00',

              reference:
                formData.reference ||
                '',

              notes:
                formData.notes ||
                '',

              status:
                'completed',

              type:
                'subscription_renewal',

              createdAt:
                now,

              date:
                formData.startDate

            };


            payments.unshift(
              paymentRecord
            );


            saveLocalArray(
              PAYMENTS_KEY,
              payments
            );


            // ==================================================
            // ACTUALIZAR MIEMBRO
            // ==================================================

            const updatedMember = {

              ...memberData,

              subscription:
                newSubscription,

              status:
                'active',

              accessBlocked:
                false,

              updatedAt:
                now

            };


            // ==================================================
            // MANTENER QR / PIN / ROSTRO
            // ==================================================

            if (
              updatedMember.access
            ) {

              updatedMember.access = {

                ...updatedMember.access,

                qr: {
                  ...updatedMember.access.qr,

                  enabled:
                    true
                },

                pin: {
                  ...updatedMember.access.pin,

                  enabled:
                    true
                },

                face: {
                  ...updatedMember.access.face,

                  enabled:
                    true
                }

              };

            }


            saveMember(
              updatedMember
            );


            setMemberData(
              updatedMember
            );


            console.log(
              '✅ Renovación guardada:',
              {
                member:
                  updatedMember,
                payment:
                  paymentRecord,
                history:
                  historyRecord
              }
            );


            setIsProcessing(
              false
            );


            setIsActivated(
              true
            );


            setTimeout(
              () => {

                navigate(
                  `/members/${memberId}`
                );

              },
              1600
            );

          } catch (
            error
          ) {

            console.error(
              '❌ Error renovando suscripción:',
              error
            );


            setIsProcessing(
              false
            );


            alert(
              'No se pudo renovar la suscripción.'
            );

          }

        },
        1200
      );

    };


  // ======================================================
  // VOLVER
  // ======================================================

  const handleBack =
    () => {

      navigate(
        `/members/${memberId}`
      );

    };


  // ======================================================
  // LOADING
  // ======================================================

  if (
    loading
  ) {

    return (

      <div className="min-h-screen bg-[#0a0a0a] flex">

        <Sidebar
          activePage="Miembros"
        />


        <div className="flex-1">

          <Header />


          <div className="p-10 text-center">

            <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-3" />


            <p className="text-gray-400">
              Cargando miembro...
            </p>

          </div>

        </div>

      </div>

    );

  }


  // ======================================================
  // NO ENCONTRADO
  // ======================================================

  if (
    !memberData
  ) {

    return (

      <div className="min-h-screen bg-[#0a0a0a] flex">

        <Sidebar
          activePage="Miembros"
        />


        <div className="flex-1">

          <Header />


          <main className="p-6">

            <div className="bg-[#111111] border border-red-500/20 rounded-xl p-10 text-center">

              <XCircle
                size={48}
                className="text-red-400 mx-auto mb-4"
              />


              <h2 className="text-white text-xl font-bold">
                Miembro no encontrado
              </h2>


              <p className="text-gray-400 mt-2">
                No encontramos el miembro con ID {id}.
              </p>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/members'
                  )
                }
                className="mt-6 px-5 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold"
              >
                Volver
              </button>

            </div>

          </main>

        </div>

      </div>

    );

  }


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
                {
                  fullName
                }
              </button>


              <span>
                /
              </span>


              <span className="text-white">
                Renovar suscripción
              </span>

            </div>


            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <h1 className="text-2xl font-bold text-white">
                  Renovar suscripción
                </h1>


                <p className="text-gray-400">
                  Renueva la suscripción de {fullName} para continuar con el acceso al gimnasio.
                </p>

              </div>


              <div className="flex gap-2">

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
                  onClick={
                    handleActivate
                  }
                  className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2"
                >

                  <RefreshCw
                    size={18}
                  />

                  Renovar suscripción

                </button>

              </div>

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
                      {
                        fullName
                      }
                    </h3>


                    <span className="text-gray-500 text-sm font-mono">
                      {
                        memberId
                      }
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
                          {
                            memberData.email
                          }
                        </span>

                      )
                    }

                  </div>

                </div>

              </div>


              {
                currentSubscription.status ===
                'active'
                  ? (

                    <div className="px-3 py-1 bg-[#00ff88]/10 rounded-full">

                      <span className="text-[#00ff88] text-xs">
                        Vence: {currentSubscription.endDate}
                      </span>

                    </div>

                  )
                  : (

                    <span className="text-gray-500 text-sm">
                      Sin suscripción activa
                    </span>

                  )
              }

            </div>

          </div>


          {/* ================================================= */}
          {/* GRID */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            <div className="xl:col-span-2 space-y-6">


              {/* ================================================= */}
              {/* PLAN */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-1">
                  Configurar renovación
                </h3>


                <p className="text-gray-400 text-sm mb-6">
                  Define el nuevo periodo de acceso al gimnasio.
                </p>


                <div className="mb-6">

                  <label className="text-white text-sm font-medium mb-2 block">
                    Selecciona un plan
                  </label>


                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                    {
                      plans.map(
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
                              p-3 rounded-xl border-2 text-center transition-all

                              ${
                                formData.selectedPlan ===
                                plan.id

                                  ? 'border-[#00ff88] bg-[#00ff88]/10'

                                  : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/50'
                              }
                            `}
                          >

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
                                {
                                  plan.label
                                }
                              </span>


                              <span className="text-[#00ff88] text-sm">
                                {
                                  plan.days
                                } días
                              </span>


                              <span className="text-gray-400 text-xs mt-1">
                                ${plan.price} {currency}
                              </span>

                            </div>

                          </button>

                        )
                      )
                    }

                  </div>

                </div>


                {/* ================================================= */}
                {/* FECHAS */}
                {/* ================================================= */}

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
                        {
                          formData.startDate
                        }
                      </div>

                    </div>


                    <p className="text-gray-500 text-xs mt-1">

                      {
                        currentSubscription.status ===
                          'active'

                          ? 'La renovación comienza después de la suscripción actual.'

                          : 'La renovación comienza hoy.'
                      }

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


                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">

                        {
                          selectedPlanData.days
                        } días

                      </span>

                    </div>

                  </div>

                </div>


                <div className="mt-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">

                  <h4 className="text-white text-sm font-medium mb-3">
                    Nuevo periodo de acceso
                  </h4>


                  <div className="flex flex-col items-center">

                    <div className="flex items-center gap-3 text-sm">

                      <span className="text-gray-400">
                        INICIO
                      </span>


                      <span className="text-[#00ff88] font-bold uppercase">
                        {
                          formData.startDate
                        }
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
                          {
                            selectedPlanData.days
                          } DÍAS
                        </span>

                      </div>


                      <div className="w-20 h-px bg-[#2a2a2a]" />

                    </div>


                    <div className="flex items-center gap-3 text-sm">

                      <span className="text-gray-400">
                        VENCIMIENTO
                      </span>


                      <span className="text-yellow-500 font-bold uppercase">
                        {
                          formData.endDate
                        }
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
                  Registra el pago correspondiente a la renovación.
                </p>


                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-gray-400 text-sm">
                        Precio normal
                      </p>

                      <p className={`text-lg font-bold ${promotionPricing.applied ? 'text-gray-500 line-through' : 'text-white'}`}>
                        ${originalPrice.toFixed(2)} {currency}
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
                        ${finalPrice.toFixed(2)} {currency}
                      </p>

                      {promotionPricing.applied && (
                        <p className="text-[#00ff88] text-xs mt-1">
                          Ahorras ${discountAmount.toFixed(2)} {currency}
                        </p>
                      )}

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
                      className="w-full bg-[#111111] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
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


                    {selectedPromotion && (
                      <div className="mt-3 p-3 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20">

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            Promoción
                          </span>

                          <span className="text-white font-semibold">
                            {selectedPromotion.label}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-400">
                            Descuento
                          </span>

                          <span className="text-[#00ff88] font-semibold">
                            -${discountAmount.toFixed(2)} {currency}
                          </span>
                        </div>

                      </div>
                    )}


                    {selectedPromotion?.referenceRequired && (
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
                          } rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
                        />

                        {errors.promotionReference && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.promotionReference}
                          </p>
                        )}

                      </div>
                    )}

                  </div>

                </div>


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
                            No se cobrará esta renovación. La operación quedará registrada con total $0.00.
                          </p>
                        </div>
                      )
                      : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

                          {
                            paymentMethods.map(
                              method => (

                                <button
                                  type="button"
                                  key={method.id}
                                  onClick={() =>
                                    handlePaymentMethodSelect(
                                      method.id
                                    )
                                  }
                                  className={`
                                    p-3 rounded-xl border-2 text-center transition-all
                                    ${
                                      formData.paymentMethod === method.id
                                        ? 'border-[#00ff88] bg-[#00ff88]/10'
                                        : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/50'
                                    }
                                  `}
                                >
                                  <div className="flex flex-col items-center">

                                    {formData.paymentMethod === method.id && (
                                      <Check
                                        size={14}
                                        className="text-[#00ff88] mb-1"
                                      />
                                    )}

                                    <span className="text-white text-sm">
                                      {method.label}
                                    </span>

                                  </div>
                                </button>

                              )
                            )
                          }

                        </div>
                      )
                  }

                </div>


                {/* ================================================= */}
                {/* EFECTIVO */}
                {/* ================================================= */}

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
                          name="receivedAmount"
                          value={
                            formData.receivedAmount
                          }
                          onChange={
                            handleInputChange
                          }
                          className={`w-full bg-[#1a1a1a] border ${
                            errors.receivedAmount
                              ? 'border-red-500'
                              : 'border-[#2a2a2a]'
                          } rounded-xl pl-8 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
                          step="0.01"
                          min="0"
                        />

                      </div>


                      {
                        errors.receivedAmount &&
                        (

                          <p className="text-red-400 text-xs mt-1">
                            {
                              errors.receivedAmount
                            }
                          </p>

                        )
                      }


                      <div className="mt-2 flex items-center gap-2 text-sm">

                        <span className="text-gray-400">
                          Cambio:
                        </span>


                        <span className="text-white font-medium">
                          ${formData.change}
                        </span>

                      </div>

                    </div>

                  )
                }


                {/* ================================================= */}
                {/* TARJETA / TRANSFERENCIA */}
                {/* ================================================= */}

                {
                  (
                    formData.paymentMethod ===
                      'transferencia' ||
                    formData.paymentMethod ===
                      'tarjeta'
                  ) &&
                  (

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
                        } rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
                      />


                      {
                        errors.reference &&
                        (

                          <p className="text-red-400 text-xs mt-1">
                            {
                              errors.reference
                            }
                          </p>

                        )
                      }

                    </div>

                  )
                }


                {/* ================================================= */}
                {/* REGALÍAS */}
                {/* ================================================= */}

                {
                  formData.paymentMethod ===
                    'regalias' &&
                  (

                    <div>

                      <label className="text-white text-sm font-medium mb-1 block">
                        Código de regalía
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
                        placeholder="Ingresa el código de regalía"
                        className={`w-full bg-[#1a1a1a] border ${
                          errors.reference
                            ? 'border-red-500'
                            : 'border-[#2a2a2a]'
                        } rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
                      />


                      {
                        errors.reference &&
                        (

                          <p className="text-red-400 text-xs mt-1">
                            {
                              errors.reference
                            }
                          </p>

                        )
                      }

                    </div>

                  )
                }


                <div className="mt-4">

                  <label className="text-white text-sm font-medium mb-1 block">
                    Fecha del pago
                  </label>


                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white">
                    {
                      formatGymDate(
                        new Date()
                      )
                    }
                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* NOTAS */}
              {/* ================================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

                <h3 className="text-white font-bold mb-2">
                  Notas
                </h3>


                <textarea
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleInputChange
                  }
                  rows={3}
                  placeholder="Agrega información adicional sobre esta renovación..."
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
                  Resumen de renovación
                </h3>


                <div className="flex items-center gap-3 mb-4">

                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] overflow-hidden flex items-center justify-center">

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

                    <p className="text-white font-medium">
                      {
                        fullName
                      }
                    </p>


                    <p className="text-gray-500 text-sm font-mono">
                      {
                        memberId
                      }
                    </p>

                  </div>

                </div>


                <div className="space-y-3 border-t border-[#1a1a1a] pt-4">


                  <div>

                    <p className="text-gray-400 text-xs font-medium mb-1">
                      Suscripción actual
                    </p>


                    <div className="text-sm">

                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Plan
                        </span>


                        <span className="text-white capitalize">
                          {
                            currentSubscription.planLabel ||
                            currentSubscription.plan ||
                            'Sin plan'
                          }
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Vence
                        </span>


                        <span className="text-yellow-500">
                          {
                            currentSubscription.endDate ||
                            'No disponible'
                          }
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="border-t border-[#1a1a1a] pt-3">

                    <p className="text-gray-400 text-xs font-medium mb-1">
                      Nueva suscripción
                    </p>


                    <div className="space-y-1 text-sm">

                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Plan
                        </span>


                        <span className="text-[#00ff88]">
                          {
                            selectedPlanData.label
                          }
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Duración
                        </span>


                        <span className="text-white">
                          {
                            selectedPlanData.days
                          } días
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Inicio
                        </span>


                        <span className="text-white">
                          {
                            formData.startDate
                          }
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Vencimiento
                        </span>


                        <span className="text-yellow-500">
                          {
                            formData.endDate
                          }
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="border-t border-[#1a1a1a] pt-3">

                    <p className="text-gray-400 text-xs font-medium mb-1">
                      Pago
                    </p>


                    <div className="space-y-1 text-sm">

                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Monto
                        </span>


                        <span className="text-white">
                          ${formData.amount} {currency}
                        </span>

                      </div>


                      <div className="flex justify-between">

                        <span className="text-gray-400">
                          Método
                        </span>


                        <span className="text-white capitalize">
                          {
                            formData.paymentMethod
                          }
                        </span>

                      </div>

                    </div>

                  </div>

                </div>


                <div className="border-t border-[#1a1a1a] pt-4 mt-4">

                  <h4 className="text-white text-sm font-medium mb-2">
                    Después de renovar
                  </h4>


                  <div className="space-y-2 text-sm">

                    <p className="text-gray-400">
                      ✓ Suscripción:{' '}
                      <span className="text-[#00ff88]">
                        RENOVADA
                      </span>
                    </p>


                    <p className="text-gray-400">
                      ✓ Acceso:{' '}
                      <span className="text-[#00ff88]">
                        HABILITADO
                      </span>
                    </p>


                    <p className="text-gray-400">
                      ✓ QR:{' '}
                      <span className="text-[#00ff88]">
                        PERMANECE IGUAL
                      </span>
                    </p>


                    <p className="text-gray-400">
                      ✓ Rostro:{' '}
                      <span className="text-[#00ff88]">
                        PERMANECE IGUAL
                      </span>
                    </p>

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

              Volver al perfil

            </button>


            <button
              type="button"
              onClick={
                handleActivate
              }
              className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2"
            >

              <RefreshCw
                size={18}
              />

              Renovar suscripción

              <ChevronRight
                size={18}
              />

            </button>

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
                  Confirmar renovación
                </h2>


                <div className="text-left space-y-2 mb-5 text-sm">

                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Miembro
                    </span>


                    <span className="text-white">
                      {
                        fullName
                      }
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Plan
                    </span>


                    <span className="text-white">
                      {
                        selectedPlanData.label
                      }
                    </span>

                  </div>


                  <div className="flex justify-between gap-4">

                    <span className="text-gray-400">
                      Periodo
                    </span>


                    <span className="text-white text-right">
                      {formData.startDate} → {formData.endDate}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Monto
                    </span>


                    <span className="text-white">
                      ${formData.amount} {currency}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Método
                    </span>


                    <span className="text-white capitalize">
                      {
                        formData.paymentMethod
                      }
                    </span>

                  </div>

                </div>


                <p className="text-gray-400 text-sm mb-6">
                  Se actualizará la suscripción del miembro y se registrará el pago.
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
                      handleConfirmRenewal
                    }
                    className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold"
                  >
                    Confirmar renovación
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

                <div className="w-10 h-10 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />


                <h2 className="text-white text-xl font-bold">
                  Renovando suscripción...
                </h2>


                <p className="text-gray-400 text-sm mt-2">
                  Guardando suscripción y registrando pago.
                </p>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* ÉXITO */}
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


                <h2 className="text-white text-xl font-bold">
                  ¡Suscripción renovada!
                </h2>


                <p className="text-gray-400 text-sm mt-2">
                  La suscripción de {fullName} fue actualizada correctamente.
                </p>


                <div className="bg-[#1a1a1a] rounded-xl p-4 mt-5 text-sm">

                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Nuevo periodo
                    </span>


                    <span className="text-white">
                      {formData.startDate} — {formData.endDate}
                    </span>

                  </div>


                  <div className="flex justify-between mt-2">

                    <span className="text-gray-400">
                      Estado
                    </span>


                    <span className="text-[#00ff88]">
                      ACTIVA
                    </span>

                  </div>


                  <div className="flex justify-between mt-2">

                    <span className="text-gray-400">
                      Pago
                    </span>


                    <span className="text-[#00ff88]">
                      REGISTRADO
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

};


export default RenewSubscriptionPage;