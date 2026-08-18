// src/components/Payments/PaymentsPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  CircleDot,
  Plus,
  X,
  Check,
  AlertCircle,
  Wallet,
  Upload,
  Printer,
  CheckCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

import PaymentStatCard from './Cards/PaymentStatCard';

import {
  useGymSettings
} from '../../context/GymSettingsContext';

import {
  buildPromotionSnapshot,
  calculatePromotionPrice,
  getAvailablePromotions
} from '../../services/promotionService';

import {
  getStoredMembers,
  saveMember
} from '../../utils/memberId';

import {
  getSales,
  getSalesSummary
} from '../../services/salesService';

import AdminAuthorizationModal
  from '../common/AdminAuthorizationModal';

import {
  getCurrentSession
} from '../../services/authService';

import {
  getOpenCashShiftForCurrentUser
} from '../../services/cashService';

import {
  mirrorBillingOperationOffline,
  mirrorPaymentDeletionOffline,
  mirrorSubscriptionDeletionOffline
} from '../../offline/services/offlineBillingService.js';


import {
  readGymScopedArray,
  saveGymScopedArray
} from '../../utils/gymScopedStorage.js';

// ======================================================
// STORAGE
// ======================================================

const PAYMENTS_KEY =
  'gym_control_payments';

const SUBSCRIPTION_HISTORY_KEY =
  'gym_control_subscription_history';


// ======================================================
// PLAN
// ======================================================

const RENEWAL_PLAN = {
  id: 'mensual',
  label: 'Mensual',
  days: 30,
  price: 500
};


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
// LEER ARRAY
// ======================================================

const readLocalArray = (
  key
) => {

  return readGymScopedArray(
    key
  );

};


// ======================================================
// GUARDAR ARRAY
// ======================================================

const saveLocalArray = (
  key,
  data
) => {

  return saveGymScopedArray(
    key,
    data
  );

};


// ======================================================
// ID
// ======================================================

const createId = (
  prefix
) => {

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
// PARSEAR FECHA
// ======================================================

const parseGymDate = (
  value
) => {

  if (!value) {
    return null;
  }


  const direct =
    new Date(
      value
    );


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
    parts.length !==
    3
  ) {

    return null;

  }


  const day =
    Number(
      parts[0]
    );


  const month =
    MONTHS[
      parts[1]
    ];


  const year =
    Number(
      parts[2]
    );


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

const formatGymDate = (
  date
) => {

  if (!date) {
    return '—';
  }


  const parsed =
    date instanceof Date
      ? date
      : parseGymDate(
          date
        );


  if (!parsed) {
    return '—';
  }


  return parsed
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
// FECHA + HORA
// ======================================================

const formatDateTime = (
  value
) => {

  const date =
    parseGymDate(
      value
    );


  if (!date) {
    return '—';
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(
    date
  );

};


// ======================================================
// ES HOY
// ======================================================

const isToday = (
  value
) => {

  const date =
    parseGymDate(
      value
    );


  if (!date) {
    return false;
  }


  const today =
    new Date();


  return (
    date.getDate() ===
      today.getDate() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getFullYear() ===
      today.getFullYear()
  );

};


// ======================================================
// ESTE MES
// ======================================================

const isThisMonth = (
  value
) => {

  const date =
    parseGymDate(
      value
    );


  if (!date) {
    return false;
  }


  const today =
    new Date();


  return (
    date.getMonth() ===
      today.getMonth() &&
    date.getFullYear() ===
      today.getFullYear()
  );

};


// ======================================================
// ESTA SEMANA
// ======================================================

const isThisWeek = (
  value
) => {

  const date =
    parseGymDate(
      value
    );


  if (!date) {
    return false;
  }


  const today =
    new Date();


  today.setHours(
    23,
    59,
    59,
    999
  );


  const start =
    new Date(
      today
    );


  const day =
    today.getDay();


  const difference =
    day === 0
      ? 6
      : day - 1;


  start.setDate(
    today.getDate() -
    difference
  );


  start.setHours(
    0,
    0,
    0,
    0
  );


  return (
    date >= start &&
    date <= today
  );

};


// ======================================================
// DÍAS RESTANTES
// ======================================================

const getDaysRemaining = (
  endDate
) => {

  const expiration =
    parseGymDate(
      endDate
    );


  if (!expiration) {
    return 0;
  }


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  expiration.setHours(
    23,
    59,
    59,
    999
  );


  return Math.max(
    0,
    Math.ceil(
      (
        expiration.getTime() -
        today.getTime()
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    )
  );

};


// ======================================================
// INICIO RENOVACIÓN
// ======================================================

const getRenewalStart = (
  member
) => {

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
      member?.subscription?.endDate
    );


  if (
    member?.subscription?.status ===
      'active' &&
    currentEnd &&
    currentEnd >= today
  ) {

    const next =
      new Date(
        currentEnd
      );


    next.setDate(
      next.getDate() +
      1
    );


    return next;

  }


  return today;

};


// ======================================================
// MÉTODO
// ======================================================

const getMethodLabel = (
  method
) => {

  switch (
    String(
      method ||
      ''
    ).toLowerCase()
  ) {

    case 'efectivo':
      return 'Efectivo';

    case 'transferencia':
      return 'Transferencia';

    case 'tarjeta':
      return 'Tarjeta';

    case 'regalias':
      return 'Regalías';

    case 'otro':
      return 'Otro';

    default:
      return method || '—';

  }

};


// ======================================================
// COMPONENTE
// ======================================================

const PaymentsPage = () => {

  const navigate =
    useNavigate();

  const currentSession =
    getCurrentSession();


  const {
    settings
  } = useGymSettings();


  const currency =
    settings?.currency ===
      'USD'
      ? 'USD'
      : 'MXN';


  const RENEWAL_PLAN =
    settings?.subscriptionPlans?.monthly ||
    {
      id: 'mensual',
      label: 'Mensual',
      days: 30,
      price: 500
    };


  // ======================================================
  // DATOS
  // ======================================================

  const [
    payments,
    setPayments
  ] = useState([]);


  const [
    members,
    setMembers
  ] = useState([]);


  // ======================================================
  // FILTROS
  // ======================================================

  const [
    activeFilter,
    setActiveFilter
  ] = useState(
    'Todos'
  );


  const [
    searchTerm,
    setSearchTerm
  ] = useState('');


  // ======================================================
  // DRAWER
  // ======================================================

  const [
    showPaymentDrawer,
    setShowPaymentDrawer
  ] = useState(false);


  const [
    showConfirmModal,
    setShowConfirmModal
  ] = useState(false);


  const [
    showSuccessModal,
    setShowSuccessModal
  ] = useState(false);


  const [
    selectedMember,
    setSelectedMember
  ] = useState(null);


  const [
    memberSearch,
    setMemberSearch
  ] = useState('');


  const [
    lastPayment,
    setLastPayment
  ] = useState(null);


  const [
    adminAction,
    setAdminAction
  ] = useState(null);


  const [
    errors,
    setErrors
  ] = useState({});


  const [
    paymentForm,
    setPaymentForm
  ] = useState({

    concept:
      'renovacion',

    amount:
      Number(
        RENEWAL_PLAN.price ||
        0
      ).toFixed(2),

    originalAmount:
      Number(
        RENEWAL_PLAN.price ||
        0
      ).toFixed(2),

    promotionId:
      '',

    promotionReference:
      '',

    received:
      Number(
        RENEWAL_PLAN.price ||
        0
      ).toFixed(2),

    change:
      '0.00',

    method:
      'efectivo',

    reference:
      '',

    notes:
      '',

    receipt:
      null

  });


  // ======================================================
  // CARGAR DATOS
  // ======================================================

  const loadData =
    () => {

      setMembers(
        getStoredMembers()
      );


      setPayments(
        readLocalArray(
          PAYMENTS_KEY
        )
      );

  };


  useEffect(
    () => {

      loadData();


      const handleUpdate =
        () => {

          loadData();

        };


      window.addEventListener(
        'storage',
        handleUpdate
      );


      window.addEventListener(
        'gym-storage-update',
        handleUpdate
      );


      return () => {

        window.removeEventListener(
          'storage',
          handleUpdate
        );


        window.removeEventListener(
          'gym-storage-update',
          handleUpdate
        );

      };

    },
    []
  );


  // ======================================================
  // MIEMBROS EN BUSCADOR
  // ======================================================

  const memberResults =
    useMemo(
      () => {

        const term =
          memberSearch
            .trim()
            .toLowerCase();


        if (
          !term
        ) {

          return [];

        }


        return members
          .filter(
            member => {

              const name =
                `${member.firstName || ''} ${member.lastName || ''}`
                  .trim()
                  .toLowerCase();


              return (

                name.includes(
                  term
                ) ||

                String(
                  member.id ||
                  ''
                )
                  .toLowerCase()
                  .includes(
                    term
                  ) ||

                String(
                  member.phone ||
                  ''
                )
                  .toLowerCase()
                  .includes(
                    term
                  )

              );

            }
          )
          .slice(
            0,
            6
          );

      },
      [
        memberSearch,
        members
      ]
    );


  // ======================================================
  // SELECCIONAR MIEMBRO
  // ======================================================

  const handleSelectMember = (
    member
  ) => {

    setSelectedMember(
      member
    );


    setMemberSearch(
      `${member.firstName || ''} ${member.lastName || ''}`.trim()
    );


    setErrors(
      previous => ({
        ...previous,
        member:
          ''
      })
    );

  };


  const availablePromotions =
    useMemo(
      () =>
        getAvailablePromotions(
          settings,
          RENEWAL_PLAN.id
        ),
      [
        settings,
        RENEWAL_PLAN.id
      ]
    );


  const promotionPricing =
    useMemo(
      () =>
        calculatePromotionPrice({
          settings,
          plan:
            RENEWAL_PLAN,
          promotionId:
            paymentForm.promotionId
        }),
      [
        settings,
        RENEWAL_PLAN,
        paymentForm.promotionId
      ]
    );


  const selectedPromotion =
    promotionPricing.promotion;


  useEffect(
    () => {

      const total =
        Number(
          promotionPricing.finalPrice ||
          0
        ).toFixed(2);


      const original =
        Number(
          promotionPricing.originalPrice ||
          0
        ).toFixed(2);


      setPaymentForm(
        previous => ({

          ...previous,

          amount:
            total,

          originalAmount:
            original,

          method:
            promotionPricing.isCourtesy
              ? 'cortesia'
              : (
                  previous.method ===
                    'cortesia'
                    ? 'efectivo'
                    : previous.method
                ),

          received:
            promotionPricing.isCourtesy
              ? '0.00'
              : (
                  previous.method ===
                    'efectivo' ||
                  previous.method ===
                    'cortesia'
                    ? total
                    : total
                ),

          change:
            '0.00',

          reference:
            promotionPricing.isCourtesy
              ? ''
              : previous.reference

        })
      );

    },
    [
      promotionPricing.finalPrice,
      promotionPricing.originalPrice,
      promotionPricing.isCourtesy
    ]
  );


  // ======================================================
  // DATOS RENOVACIÓN
  // ======================================================

  const renewalPreview =
    useMemo(
      () => {

        if (
          !selectedMember
        ) {

          return null;

        }


        const start =
          getRenewalStart(
            selectedMember
          );


        const end =
          new Date(
            start
          );


        end.setDate(
          end.getDate() +
          RENEWAL_PLAN.days -
          1
        );


        return {

          start,

          end,

          startDate:
            formatGymDate(
              start
            ),

          endDate:
            formatGymDate(
              end
            ),

          currentEnd:
            selectedMember
              ?.subscription
              ?.endDate ||
            'Sin suscripción',

          remaining:
            getDaysRemaining(
              selectedMember
                ?.subscription
                ?.endDate
            )

        };

      },
      [selectedMember]
    );


  // ======================================================
  // CAMBIO
  // ======================================================

  const handleAmountChange = (
    e
  ) => {

    const value =
      e.target.value;


    const received =
      Number(
        value ||
        0
      );


    const price =
      Number(
        paymentForm.amount ||
        0
      );


    const change =
      Math.max(
        0,
        received -
        price
      );


    setPaymentForm(
      previous => ({
        ...previous,

        received:
          value,

        change:
          change.toFixed(
            2
          )

      })
    );


    setErrors(
      previous => ({
        ...previous,
        received:
          ''
      })
    );

  };


  // ======================================================
  // MÉTODO
  // ======================================================

  const handlePaymentMethodSelect = (
    method
  ) => {

    setPaymentForm(
      previous => ({
        ...previous,

        method,

        reference:
          '',

        received:
          method ===
            'efectivo'
            ? previous.received
            : previous.amount,

        change:
          '0.00'

      })
    );


    setErrors(
      previous => ({
        ...previous,

        method:
          '',

        reference:
          ''

      })
    );

  };


  // ======================================================
  // VALIDAR
  // ======================================================

  const handleRegisterPayment =
    () => {

      const newErrors = {};


      if (
        !selectedMember
      ) {

        newErrors.member =
          'Selecciona un miembro.';

      }


      if (
        !promotionPricing.isCourtesy &&
        paymentForm.method ===
        'efectivo'
      ) {

        const received =
          Number(
            paymentForm.received
          );


        const amount =
          Number(
            paymentForm.amount
          );


        if (
          Number.isNaN(
            received
          ) ||
          received <
          amount
        ) {

          newErrors.received =
            'El monto recibido es menor al total.';

        }

      }


      if (
        (
          paymentForm.method ===
            'transferencia' ||
          paymentForm.method ===
            'tarjeta'
        ) &&
        !paymentForm.reference.trim()
      ) {

        newErrors.reference =
          'Ingresa la referencia de la operación.';

      }


      if (
        selectedPromotion?.referenceRequired &&
        !paymentForm.promotionReference.trim()
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
  // CONFIRMAR PAGO
  // ======================================================

  const handleConfirmPayment =
    () => {

      if (
        !selectedMember ||
        !renewalPreview
      ) {

        return;

      }


      try {

        const numericPaymentAmount =
          Number(
            paymentForm.amount ||
            0
          );


        const openCashShift =
          numericPaymentAmount >
            0
            ? getOpenCashShiftForCurrentUser()
            : null;


        if (
          numericPaymentAmount >
            0 &&
          !openCashShift
        ) {

          setShowConfirmModal(
            false
          );

          setErrors({});

          window.alert(
            'Debes abrir tu turno de caja antes de registrar un cobro.'
          );

          return;

        }


        const now =
          new Date()
            .toISOString();


        // ==================================================
        // NUEVA SUSCRIPCIÓN
        // ==================================================

        const newSubscription = {

          plan:
            RENEWAL_PLAN.id,

          planLabel:
            RENEWAL_PLAN.label,

          days:
            RENEWAL_PLAN.days,

          startDate:
            renewalPreview.startDate,

          endDate:
            renewalPreview.endDate,

          paymentMethod:
            promotionPricing.isCourtesy
              ? 'cortesia'
              : paymentForm.method,

          amount:
            Number(
              paymentForm.amount
            ).toFixed(
              2
            ),

          originalAmount:
            Number(
              promotionPricing.originalPrice ||
              0
            ).toFixed(
              2
            ),

          discountAmount:
            Number(
              promotionPricing.discountAmount ||
              0
            ).toFixed(
              2
            ),

          promotion:
            buildPromotionSnapshot(
              promotionPricing,
              paymentForm.promotionReference
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
        // ACTUALIZAR MIEMBRO
        // ==================================================

        const updatedMember = {

          ...selectedMember,

          subscription:
            newSubscription,

          status:
            'active',

          accessBlocked:
            false,

          updatedAt:
            now

        };


        // Reactivar métodos ya configurados.
        if (
          updatedMember.access
        ) {

          updatedMember.access = {

            ...updatedMember.access,

            qr: {
              ...updatedMember.access.qr,

              enabled:
                updatedMember.access.qr
                  ?.configured === true
            },

            pin: {
              ...updatedMember.access.pin,

              enabled:
                updatedMember.access.pin
                  ?.configured === true
            },

            face: {
              ...updatedMember.access.face,

              enabled:
                updatedMember.access.face
                  ?.enrolled === true
            }

          };

        }


        saveMember(
          updatedMember
        );


        // ==================================================
        // PAGO
        // ==================================================

        const paymentRecord = {

          id:
            createId(
              'PAY'
            ),

          gymId:
            currentSession?.gymId ||
            selectedMember?.gymId ||
            null,

          gymCode:
            currentSession?.gymCode ||
            selectedMember?.gymCode ||
            null,

          cashShiftId:
            openCashShift?.id ||
            null,

          cashEmployeeId:
            openCashShift?.employee?.id ||
            currentSession?.id ||
            null,

          createdBy:
            currentSession
              ? {
                  id:
                    currentSession.id ||
                    null,

                  name:
                    currentSession.name ||
                    currentSession.email ||
                    'Usuario',

                  email:
                    currentSession.email ||
                    '',

                  role:
                    currentSession.role ||
                    ''
                }
              : null,

          memberId:
            selectedMember.id,

          memberName:
            `${selectedMember.firstName || ''} ${selectedMember.lastName || ''}`
              .trim(),

          concept:
            'Renovación de suscripción',

          type:
            'subscription_renewal',

          plan:
            RENEWAL_PLAN.id,

          planLabel:
            RENEWAL_PLAN.label,

          period:
            `${renewalPreview.startDate} - ${renewalPreview.endDate}`,

          method:
            promotionPricing.isCourtesy
              ? 'cortesia'
              : paymentForm.method,

          paymentMethod:
            promotionPricing.isCourtesy
              ? 'cortesia'
              : paymentForm.method,

          amount:
            Number(
              paymentForm.amount
            ).toFixed(
              2
            ),

          originalAmount:
            Number(
              promotionPricing.originalPrice ||
              0
            ).toFixed(
              2
            ),

          discountAmount:
            Number(
              promotionPricing.discountAmount ||
              0
            ).toFixed(
              2
            ),

          promotion:
            buildPromotionSnapshot(
              promotionPricing,
              paymentForm.promotionReference
            ),

          currency,

          receivedAmount:
            paymentForm.method ===
              'efectivo'
              ? Number(
                  paymentForm.received
                ).toFixed(2)
              : Number(
                  paymentForm.amount
                ).toFixed(2),

          change:
            paymentForm.method ===
              'efectivo'
              ? paymentForm.change
              : '0.00',

          reference:
            paymentForm.reference ||
            '',

          notes:
            paymentForm.notes ||
            '',

          status:
            'completed',

          createdAt:
            now,

          date:
            now

        };


        const storedPayments =
          readLocalArray(
            PAYMENTS_KEY
          );


        storedPayments.unshift(
          paymentRecord
        );


        saveLocalArray(
          PAYMENTS_KEY,
          storedPayments
        );


        // ==================================================
        // HISTORIAL DE SUSCRIPCIÓN
        // ==================================================

        const history =
          readLocalArray(
            SUBSCRIPTION_HISTORY_KEY
          );


        const subscriptionHistoryRecord = {

          id:
            createId(
              'SUBH'
            ),

          gymId:
            currentSession?.gymId ||
            selectedMember?.gymId ||
            null,

          gymCode:
            currentSession?.gymCode ||
            selectedMember?.gymCode ||
            null,

          memberId:
            selectedMember.id,

          memberName:
            paymentRecord.memberName,

          type:
            'renewal',

          source:
            'payments',

          previousSubscription:
            selectedMember.subscription ||
            null,

          subscription:
            newSubscription,

          paymentId:
            paymentRecord.id,

          notes:
            paymentForm.notes ||
            '',

          createdAt:
            now,

          updatedAt:
            now

        };


        history.unshift(
          subscriptionHistoryRecord
        );


        saveLocalArray(
          SUBSCRIPTION_HISTORY_KEY,
          history
        );


        // ==================================================
        // RESPALDAR PAGO + RENOVACIÓN EN INDEXEDDB
        // ==================================================

        void mirrorBillingOperationOffline({

          payment:
            paymentRecord,

          subscription:
            subscriptionHistoryRecord,

          gymId:
            currentSession?.gymId ||
            selectedMember?.gymId ||
            null,

          session:
            currentSession,

          member:
            updatedMember

        })
          .then(
            result => {

              console.log(
                '✅ Pago y renovación respaldados offline:',
                result
              );

            }
          )
          .catch(
            error => {

              console.error(
                '❌ Error respaldando renovación offline:',
                error
              );

            }
          );


        console.log(
          '💰 PAGO REGISTRADO:',
          paymentRecord
        );


        console.log(
          '🔄 SUSCRIPCIÓN ACTUALIZADA:',
          updatedMember
        );


        setLastPayment(
          paymentRecord
        );


        setPayments(
          storedPayments
        );


        setMembers(
          getStoredMembers()
        );


        setShowConfirmModal(
          false
        );


        setShowSuccessModal(
          true
        );

      } catch (
        error
      ) {

        console.error(
          '❌ Error registrando pago:',
          error
        );


        alert(
          'No se pudo registrar el pago.'
        );

      }

  };


  // ======================================================
  // ELIMINAR REGISTRO DE PAGO
  // ======================================================

  const executeDeletePayment =
    payment => {

      if (
        !payment?.id
      ) {
        return;
      }


      const storedPayments =
        readLocalArray(
          PAYMENTS_KEY
        );


      const nextPayments =
        storedPayments.filter(
          item =>
            item.id !==
            payment.id
        );


      saveLocalArray(
        PAYMENTS_KEY,
        nextPayments
      );


      // ==================================================
      // RESPALDAR ELIMINACIÓN DEL PAGO EN INDEXEDDB
      // ==================================================

      void mirrorPaymentDeletionOffline({

        payment,

        gymId:
          currentSession?.gymId ||
          payment?.gymId ||
          null,

        session:
          currentSession

      });


      // También quitamos el movimiento del historial
      // de suscripción que fue creado por ese pago.
      // La suscripción ACTUAL del miembro no se revierte
      // automáticamente para evitar modificar vigencias
      // sin una operación administrativa específica.
      const history =
        readLocalArray(
          SUBSCRIPTION_HISTORY_KEY
        );


      const relatedSubscriptionHistory =
        history.find(
          item =>
            item.paymentId ===
            payment.id
        ) ||
        null;


      const nextHistory =
        history.filter(
          item =>
            item.paymentId !==
            payment.id
        );


      saveLocalArray(
        SUBSCRIPTION_HISTORY_KEY,
        nextHistory
      );


      // ==================================================
      // RESPALDAR ELIMINACIÓN DEL HISTORIAL EN INDEXEDDB
      // ==================================================

      if (
        relatedSubscriptionHistory
      ) {

        void mirrorSubscriptionDeletionOffline({

          subscription:
            relatedSubscriptionHistory,

          gymId:
            currentSession?.gymId ||
            relatedSubscriptionHistory?.gymId ||
            null,

          session:
            currentSession

        });

      }


      setPayments(
        nextPayments
      );


      setAdminAction(
        null
      );


      window.alert(
        'El registro de pago fue eliminado correctamente. La vigencia actual del miembro no fue modificada.'
      );

    };

  const requestDeletePayment =
    payment => {

      if (
        !payment?.id
      ) {
        return;
      }


      setAdminAction({
        action:
          'payment_delete',

        title:
          'Eliminar registro de pago',

        description:
          'El pago se eliminará del historial y también se retirará su movimiento asociado del historial de suscripción. La vigencia actual del miembro no cambiará automáticamente.',

        confirmLabel:
          'Eliminar pago',

        target: {
          id:
            payment.id,

          label:
            `${payment.memberName || 'Miembro'} · $${Number(payment.amount || 0).toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
        },

        onAuthorized:
          () =>
            executeDeletePayment(
              payment
            )
      });

    };


  // ======================================================
  // RESETEAR FORMULARIO
  // ======================================================

  const resetPaymentForm =
    () => {

      setSelectedMember(
        null
      );


      setMemberSearch(
        ''
      );


      setErrors({});


      setPaymentForm({

        concept:
          'renovacion',

        amount:
          '500.00',

        received:
          '500.00',

        change:
          '0.00',

        method:
          'efectivo',

        reference:
          '',

        notes:
          '',

        receipt:
          null

      });

  };


  const handleCloseDrawer =
    () => {

      setShowPaymentDrawer(
        false
      );


      resetPaymentForm();

  };


  const handleFinish =
    () => {

      setShowSuccessModal(
        false
      );


      setShowPaymentDrawer(
        false
      );


      setLastPayment(
        null
      );


      resetPaymentForm();

  };



  // ======================================================
  // VENTAS DE PRODUCTOS
  // ======================================================

  const productSalesSummary =
    useMemo(
      () =>
        getSalesSummary(
          getSales()
        ),
      [
        payments
      ]
    );


  // ======================================================
  // ESTADÍSTICAS
  // ======================================================

  const stats =
    useMemo(
      () => {

        const completed =
          payments.filter(
            payment =>
              payment.status !==
              'cancelled'
          );


        const todayPayments =
          completed.filter(
            payment =>
              isToday(
                payment.createdAt ||
                payment.date
              )
          );


        const monthPayments =
          completed.filter(
            payment =>
              isThisMonth(
                payment.createdAt ||
                payment.date
              )
          );


        const todayIncome =
          todayPayments.reduce(
            (
              total,
              payment
            ) =>
              total +
              Number(
                payment.amount ||
                0
              ),
            0
          );


        const monthIncome =
          monthPayments.reduce(
            (
              total,
              payment
            ) =>
              total +
              Number(
                payment.amount ||
                0
              ),
            0
          );


        const renewals =
          monthPayments.filter(
            payment =>
              payment.type ===
                'subscription_renewal' ||
              String(
                payment.concept ||
                ''
              )
                .toLowerCase()
                .includes(
                  'renov'
                )
          ).length;


        const averageTicket =
          monthPayments.length >
          0
            ? monthIncome /
              monthPayments.length
            : 0;


        return {

          todayIncome,

          monthIncome,

          renewals,

          averageTicket,

          todayCount:
            todayPayments.length,

          monthCount:
            monthPayments.length

        };

      },
      [payments]
    );


  // ======================================================
  // MÉTODOS ESTE MES
  // ======================================================

  const paymentMethodStats =
    useMemo(
      () => {

        const methods = [
          {
            id:
              'efectivo',

            label:
              'Efectivo',

            color:
              'bg-[#00ff88]'
          },

          {
            id:
              'transferencia',

            label:
              'Transferencia',

            color:
              'bg-blue-500'
          },

          {
            id:
              'tarjeta',

            label:
              'Tarjeta',

            color:
              'bg-purple-500'
          },

          {
            id:
              'otro',

            label:
              'Otro',

            color:
              'bg-gray-500'
          }
        ];


        const monthPayments =
          payments.filter(
            payment =>
              payment.status !==
                'cancelled' &&
              isThisMonth(
                payment.createdAt ||
                payment.date
              )
          );


        return methods.map(
          method => {

            const matching =
              monthPayments.filter(
                payment => {

                  const paymentMethod =
                    payment.paymentMethod ||
                    payment.method;


                  if (
                    method.id ===
                    'otro'
                  ) {

                    return ![
                      'efectivo',
                      'transferencia',
                      'tarjeta'
                    ].includes(
                      paymentMethod
                    );

                  }


                  return (
                    paymentMethod ===
                    method.id
                  );

                }
              );


            const total =
              matching.reduce(
                (
                  sum,
                  payment
                ) =>
                  sum +
                  Number(
                    payment.amount ||
                    0
                  ),
                0
              );


            return {

              ...method,

              amount:
                total,

              count:
                matching.length

            };

          }
        );

      },
      [payments]
    );


  // ======================================================
  // FILTROS
  // ======================================================

  const filters =
    useMemo(
      () => {

        return [

          {
            name:
              'Todos',

            count:
              payments.length
          },

          {
            name:
              'Hoy',

            count:
              payments.filter(
                payment =>
                  isToday(
                    payment.createdAt ||
                    payment.date
                  )
              ).length
          },

          {
            name:
              'Esta semana',

            count:
              payments.filter(
                payment =>
                  isThisWeek(
                    payment.createdAt ||
                    payment.date
                  )
              ).length
          },

          {
            name:
              'Este mes',

            count:
              payments.filter(
                payment =>
                  isThisMonth(
                    payment.createdAt ||
                    payment.date
                  )
              ).length
          },

          {
            name:
              'Renovaciones',

            count:
              payments.filter(
                payment =>
                  payment.type ===
                    'subscription_renewal' ||
                  String(
                    payment.concept ||
                    ''
                  )
                    .toLowerCase()
                    .includes(
                      'renov'
                    )
              ).length
          }

        ];

      },
      [payments]
    );


  // ======================================================
  // PAGOS FILTRADOS
  // ======================================================

  const filteredPayments =
    useMemo(
      () => {

        let result =
          [...payments];


        if (
          activeFilter ===
          'Hoy'
        ) {

          result =
            result.filter(
              payment =>
                isToday(
                  payment.createdAt ||
                  payment.date
                )
            );

        }


        if (
          activeFilter ===
          'Esta semana'
        ) {

          result =
            result.filter(
              payment =>
                isThisWeek(
                  payment.createdAt ||
                  payment.date
                )
            );

        }


        if (
          activeFilter ===
          'Este mes'
        ) {

          result =
            result.filter(
              payment =>
                isThisMonth(
                  payment.createdAt ||
                  payment.date
                )
            );

        }


        if (
          activeFilter ===
          'Renovaciones'
        ) {

          result =
            result.filter(
              payment =>
                payment.type ===
                  'subscription_renewal' ||
                String(
                  payment.concept ||
                  ''
                )
                  .toLowerCase()
                  .includes(
                    'renov'
                  )
            );

        }


        const term =
          searchTerm
            .trim()
            .toLowerCase();


        if (
          term
        ) {

          result =
            result.filter(
              payment => {

                return (

                  String(
                    payment.memberName ||
                    ''
                  )
                    .toLowerCase()
                    .includes(
                      term
                    ) ||

                  String(
                    payment.memberId ||
                    ''
                  )
                    .toLowerCase()
                    .includes(
                      term
                    ) ||

                  String(
                    payment.reference ||
                    ''
                  )
                    .toLowerCase()
                    .includes(
                      term
                    ) ||

                  String(
                    payment.id ||
                    ''
                  )
                    .toLowerCase()
                    .includes(
                      term
                    )

                );

              }
            );

        }


        return result.sort(
          (
            a,
            b
          ) =>
            new Date(
              b.createdAt ||
              b.date ||
              0
            ) -
            new Date(
              a.createdAt ||
              a.date ||
              0
            )
        );

      },
      [
        payments,
        activeFilter,
        searchTerm
      ]
    );


  // ======================================================
  // GRÁFICA DEL MES
  // ======================================================

  const incomeChart =
    useMemo(
      () => {

        const today =
          new Date();


        const year =
          today.getFullYear();


        const month =
          today.getMonth();


        const lastDay =
          new Date(
            year,
            month + 1,
            0
          ).getDate();


        const groups = [
          {
            label:
              '1',

            start:
              1,

            end:
              4
          },
          {
            label:
              '5',

            start:
              5,

            end:
              9
          },
          {
            label:
              '10',

            start:
              10,

            end:
              14
          },
          {
            label:
              '15',

            start:
              15,

            end:
              19
          },
          {
            label:
              '20',

            start:
              20,

            end:
              24
          },
          {
            label:
              '25',

            start:
              25,

            end:
              29
          },
          {
            label:
              '30',

            start:
              30,

            end:
              lastDay
          }
        ];


        return groups.map(
          group => {

            const total =
              payments.reduce(
                (
                  sum,
                  payment
                ) => {

                  if (
                    payment.status ===
                    'cancelled'
                  ) {

                    return sum;

                  }


                  const date =
                    parseGymDate(
                      payment.createdAt ||
                      payment.date
                    );


                  if (
                    !date ||
                    date.getFullYear() !==
                      year ||
                    date.getMonth() !==
                      month
                  ) {

                    return sum;

                  }


                  const day =
                    date.getDate();


                  if (
                    day >=
                      group.start &&
                    day <=
                      group.end
                  ) {

                    return (
                      sum +
                      Number(
                        payment.amount ||
                        0
                      )
                    );

                  }


                  return sum;

                },
                0
              );


            return {

              ...group,

              total

            };

          }
        );

      },
      [payments]
    );


  const maxChartIncome =
    Math.max(
      1,
      ...incomeChart.map(
        item =>
          item.total
      )
    );


  // ======================================================
  // EXPORTAR
  // ======================================================

  const handleExport =
    () => {

      if (
        filteredPayments.length ===
        0
      ) {

        return;

      }


      const rows = [

        [
          'Folio',
          'Miembro',
          'ID',
          'Fecha',
          'Concepto',
          'Periodo',
          'Método',
          'Monto',
          'Referencia',
          'Estado'
        ],

        ...filteredPayments.map(
          payment => [

            payment.id,

            payment.memberName,

            payment.memberId,

            formatDateTime(
              payment.createdAt ||
              payment.date
            ),

            payment.concept,

            payment.period,

            getMethodLabel(
              payment.paymentMethod ||
              payment.method
            ),

            payment.amount,

            payment.reference,

            payment.status

          ]
        )

      ];


      const csv =
        rows
          .map(
            row =>
              row
                .map(
                  value =>
                    `"${String(
                      value ??
                      ''
                    ).replace(
                      /"/g,
                      '""'
                    )}"`
                )
                .join(',')
          )
          .join('\n');


      const blob =
        new Blob(
          [
            '\uFEFF',
            csv
          ],
          {
            type:
              'text/csv;charset=utf-8;'
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          'a'
        );


      link.href =
        url;


      link.download =
        `pagos-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.csv`;


      link.click();


      URL.revokeObjectURL(
        url
      );

  };


  // ======================================================
  // MÉTODOS FORMULARIO
  // ======================================================

  const paymentMethods =
    useMemo(
      () => {

        const available = [];

        if (settings?.paymentMethods?.efectivo) {
          available.push({
            id: 'efectivo',
            label: 'Efectivo',
            icon: Banknote
          });
        }

        if (settings?.paymentMethods?.transferencia) {
          available.push({
            id: 'transferencia',
            label: 'Transferencia',
            icon: CreditCard
          });
        }

        if (settings?.paymentMethods?.tarjeta) {
          available.push({
            id: 'tarjeta',
            label: 'Tarjeta',
            icon: CreditCard
          });
        }

        if (settings?.paymentMethods?.otro) {
          available.push({
            id: 'otro',
            label: 'Otro',
            icon: Wallet
          });
        }

        return available;

      },
      [
        settings.paymentMethods
      ]
    );


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Pagos"
      />


      <div className="flex-1 lg:ml-0 min-w-0">

        <Header />


        <main className="p-6 space-y-6">


          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <h1 className="text-2xl font-bold text-white">
                Pagos
              </h1>


              <p className="text-gray-400">
                Administra los cobros, renovaciones y movimientos registrados.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                setShowPaymentDrawer(
                  true
                )
              }
              className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
            >

              <Plus
                size={18}
              />

              Registrar pago

            </button>

          </div>


          {/* ================================================= */}
          {/* ESTADÍSTICAS */}
          {/* ================================================= */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            <PaymentStatCard
              title="Ingresos de hoy"
              value={`$${stats.todayIncome.toLocaleString(
                'es-MX',
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2
                }
              )} MXN`}
              subtitle={`${stats.todayCount} pago${stats.todayCount === 1 ? '' : 's'} registrado${stats.todayCount === 1 ? '' : 's'}`}
              icon={
                DollarSign
              }
              color="green"
              trend={
                stats.todayCount >
                0
                  ? `+${stats.todayCount} hoy`
                  : 'Sin datos'
              }
            />


            <PaymentStatCard
              title="Ingresos del mes"
              value={`$${stats.monthIncome.toLocaleString(
                'es-MX',
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2
                }
              )} MXN`}
              subtitle={`${stats.monthCount} pagos`}
              icon={
                TrendingUp
              }
              color="green"
              trend={
                new Intl.DateTimeFormat(
                  'es-MX',
                  {
                    month:
                      'long',
                    year:
                      'numeric'
                  }
                ).format(
                  new Date()
                )
              }
            />


            <PaymentStatCard
              title="Renovaciones del mes"
              value={
                stats.renewals
              }
              subtitle="Suscripciones renovadas"
              icon={
                Receipt
              }
              color="green"
            />


            <PaymentStatCard
              title="Ticket promedio"
              value={`$${stats.averageTicket.toLocaleString(
                'es-MX',
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2
                }
              )} MXN`}
              subtitle="Promedio por pago"
              icon={
                Wallet
              }
              color="gray"
            />

          </div>


          {/* ================================================= */}
          {/* MÉTODOS */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Métodos de pago — Este mes
            </h3>


            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {
                paymentMethodStats.map(
                  method => (

                    <div
                      key={
                        method.id
                      }
                      className="bg-[#1a1a1a] rounded-xl p-4"
                    >

                      <div className="flex items-center gap-2 mb-2">

                        <div
                          className={`w-2 h-2 rounded-full ${method.color}`}
                        />


                        <span className="text-gray-400 text-sm">
                          {
                            method.label
                          }
                        </span>

                      </div>


                      <p className="text-white font-bold">
                        ${method.amount.toLocaleString(
                          'es-MX',
                          {
                            minimumFractionDigits:
                              2,
                            maximumFractionDigits:
                              2
                          }
                        )}
                      </p>


                      <p className="text-gray-500 text-xs">
                        {method.count} pago{method.count === 1 ? '' : 's'}
                      </p>

                    </div>

                  )
                )
              }

            </div>

          </div>


          {/* ================================================= */}
          {/* GRÁFICA */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <div className="flex items-center justify-between mb-4">

              <div>

                <h3 className="text-white font-bold">
                  Ingresos
                </h3>


                <p className="text-gray-500 text-sm">
                  Movimiento de ingresos durante el mes
                </p>

              </div>


              <span className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm">
                Este mes
              </span>

            </div>


            <div className="h-48 flex items-end gap-3">

              {
                incomeChart.map(
                  item => {

                    const height =
                      item.total >
                      0
                        ? Math.max(
                            10,
                            Math.round(
                              (
                                item.total /
                                maxChartIncome
                              ) *
                              150
                            )
                          )
                        : 2;


                    return (

                      <div
                        key={
                          item.label
                        }
                        className="flex-1 flex flex-col items-center justify-end gap-1 h-full"
                      >

                        {
                          item.total >
                            0 &&
                          (

                            <span className="text-[#00ff88] text-[10px] whitespace-nowrap">
                              ${item.total.toLocaleString(
                                'es-MX'
                              )}
                            </span>

                          )
                        }


                        <div
                          className={
                            item.total >
                            0
                              ? 'w-full bg-[#00ff88]/40 rounded-t-lg'
                              : 'w-full bg-[#1a1a1a] rounded-t-lg'
                          }
                          style={{
                            height:
                              `${height}px`
                          }}
                        />


                        <span className="text-gray-500 text-xs">
                          {
                            item.label
                          }
                        </span>

                      </div>

                    );

                  }
                )
              }

            </div>


            <p className="text-gray-400 text-sm text-center mt-3">

              {
                stats.monthIncome >
                0
                  ? `$${stats.monthIncome.toLocaleString(
                      'es-MX',
                      {
                        minimumFractionDigits:
                          2
                      }
                    )} MXN generados este mes`
                  : 'Sin datos de ingresos'
              }

            </p>

          </div>


          {/* ================================================= */}
          {/* HISTORIAL */}
          {/* ================================================= */}

          <div>

            <div className="flex items-center justify-between mb-4">

              <div>

                <h2 className="text-white font-bold text-xl">
                  Historial de pagos
                </h2>


                <p className="text-gray-400 text-sm">
                  Consulta todos los cobros registrados en el sistema.
                </p>

              </div>

            </div>


            {/* BUSCADOR */}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">

              <div className="flex-1 relative">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />


                <input
                  type="text"
                  placeholder="Buscar por miembro, ID, referencia o folio..."
                  value={
                    searchTerm
                  }
                  onChange={
                    e =>
                      setSearchTerm(
                        e.target.value
                      )
                  }
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-10 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none"
                />

              </div>


              <div className="flex gap-2">

                <button
                  type="button"
                  className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] flex items-center gap-2"
                >

                  <Filter
                    size={18}
                  />

                  Filtros

                </button>


                <button
                  type="button"
                  onClick={
                    handleExport
                  }
                  disabled={
                    filteredPayments.length ===
                    0
                  }
                  className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] flex items-center gap-2 disabled:opacity-40"
                >

                  <Download
                    size={18}
                  />

                  Exportar

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setShowPaymentDrawer(
                      true
                    )
                  }
                  className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2"
                >

                  <Plus
                    size={18}
                  />

                  Registrar pago

                </button>

              </div>

            </div>


            {/* FILTROS */}

            <div className="flex flex-wrap gap-2 mb-4">

              {
                filters.map(
                  filter => (

                    <button
                      type="button"
                      key={
                        filter.name
                      }
                      onClick={() =>
                        setActiveFilter(
                          filter.name
                        )
                      }
                      className={`
                        px-4 py-1.5 rounded-full text-sm transition-all

                        ${
                          activeFilter ===
                          filter.name
                            ? 'bg-[#00ff88] text-black font-bold'
                            : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                        }
                      `}
                    >

                      {
                        filter.name
                      }

                      {' '}

                      <span className="text-xs opacity-70">
                        ({filter.count})
                      </span>

                    </button>

                  )
                )
              }

            </div>


            {/* TABLA */}

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

              {
                filteredPayments.length ===
                0
                  ? (

                    <div className="text-center py-16">

                      <div className="flex justify-center mb-4">

                        <div className="p-4 bg-[#1a1a1a] rounded-full">

                          <Receipt
                            size={48}
                            className="text-gray-600"
                          />

                        </div>

                      </div>


                      <h3 className="text-white text-xl font-bold mb-2">
                        No hay pagos registrados
                      </h3>


                      <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                        Los pagos y renovaciones aparecerán aquí.
                      </p>


                      <button
                        type="button"
                        onClick={() =>
                          setShowPaymentDrawer(
                            true
                          )
                        }
                        className="px-6 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold flex items-center gap-2 mx-auto"
                      >

                        <Plus
                          size={18}
                        />

                        Registrar primer pago

                      </button>

                    </div>

                  )
                  : (

                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">

                          <tr>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Folio
                            </th>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Miembro
                            </th>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Fecha
                            </th>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Concepto
                            </th>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Periodo
                            </th>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Método
                            </th>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Monto
                            </th>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Estado
                            </th>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                              Acciones
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {
                            filteredPayments.map(
                              payment => (

                                <tr
                                  key={
                                    payment.id
                                  }
                                  className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#151515]"
                                >

                                  <td className="py-4 px-4">

                                    <span className="text-[#00ff88] font-mono text-xs">
                                      {
                                        payment.id
                                      }
                                    </span>

                                  </td>


                                  <td className="py-4 px-4">

                                    <div>

                                      <p className="text-white text-sm font-medium">
                                        {
                                          payment.memberName ||
                                          'Miembro'
                                        }
                                      </p>


                                      <p className="text-gray-500 text-xs font-mono">
                                        {
                                          payment.memberId
                                        }
                                      </p>

                                    </div>

                                  </td>


                                  <td className="py-4 px-4 text-gray-300 text-sm">
                                    {
                                      formatDateTime(
                                        payment.createdAt ||
                                        payment.date
                                      )
                                    }
                                  </td>


                                  <td className="py-4 px-4 text-gray-300 text-sm">
                                    {
                                      payment.concept ||
                                      'Pago'
                                    }
                                  </td>


                                  <td className="py-4 px-4 text-gray-400 text-xs whitespace-nowrap">
                                    {
                                      payment.period ||
                                      '—'
                                    }
                                  </td>


                                  <td className="py-4 px-4">

                                    <span className="px-2 py-1 rounded-full bg-[#1a1a1a] text-gray-300 text-xs">

                                      {
                                        getMethodLabel(
                                          payment.paymentMethod ||
                                          payment.method
                                        )
                                      }

                                    </span>

                                  </td>


                                  <td className="py-4 px-4">

                                    <span className="text-[#00ff88] font-semibold">
                                      ${Number(
                                        payment.amount ||
                                        0
                                      ).toLocaleString(
                                        'es-MX',
                                        {
                                          minimumFractionDigits:
                                            2
                                        }
                                      )}
                                    </span>

                                  </td>


                                  <td className="py-4 px-4">

                                    <span className="px-2 py-1 rounded-full bg-[#00ff88]/10 text-[#00ff88] text-xs">
                                      PAGADO
                                    </span>

                                  </td>


                                  <td className="py-4 px-4">

                                    <div className="flex items-center gap-2">

                                      <button
                                        type="button"
                                        title="Ver miembro"
                                        onClick={() =>
                                          navigate(
                                            `/members/${payment.memberId}`
                                          )
                                        }
                                        className="w-9 h-9 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]"
                                      >

                                        <Eye
                                          size={16}
                                        />

                                      </button>


                                      <button
                                        type="button"
                                        title="Eliminar pago"
                                        onClick={() =>
                                          requestDeletePayment(
                                            payment
                                          )
                                        }
                                        className="w-9 h-9 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
                                      >

                                        <Trash2
                                          size={16}
                                        />

                                      </button>

                                    </div>

                                  </td>

                                </tr>

                              )
                            )
                          }

                        </tbody>

                      </table>

                    </div>

                  )
              }

            </div>


            {
              filteredPayments.length >
                0 &&
              (

                <p className="text-gray-400 text-sm mt-4">
                  Mostrando {filteredPayments.length} de {payments.length} pagos
                </p>

              )
            }

          </div>

        </main>

      </div>


      {/* ================================================= */}
      {/* DRAWER */}
      {/* ================================================= */}

      {
        showPaymentDrawer &&
        (

          <div className="fixed inset-0 z-50 flex justify-end">

            <div
              className="absolute inset-0 bg-black/70"
              onClick={
                handleCloseDrawer
              }
            />


            <div className="relative w-full max-w-lg h-full bg-[#111111] border-l border-[#1a1a1a] shadow-2xl overflow-y-auto animate-slide-in-right">

              <div className="p-6">


                {/* HEADER */}

                <div className="flex items-center justify-between mb-6">

                  <div>

                    <h2 className="text-xl font-bold text-white">
                      Registrar pago
                    </h2>


                    <p className="text-gray-400 text-sm">
                      Registra el pago y renueva la suscripción del miembro.
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={
                      handleCloseDrawer
                    }
                    className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white"
                  >

                    <X
                      size={20}
                    />

                  </button>

                </div>


                {/* ================================================= */}
                {/* MIEMBRO */}
                {/* ================================================= */}

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">

                  <p className="text-gray-400 text-sm font-medium mb-2">
                    Paso 1 — Seleccionar miembro
                  </p>


                  <div className="relative">

                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />


                    <input
                      type="text"
                      placeholder="Buscar por nombre, teléfono o ID..."
                      value={
                        memberSearch
                      }
                      onChange={
                        e => {

                          setMemberSearch(
                            e.target.value
                          );


                          if (
                            selectedMember
                          ) {

                            setSelectedMember(
                              null
                            );

                          }

                        }
                      }
                      className={`w-full bg-[#0d0d0d] border ${
                        errors.member
                          ? 'border-red-500'
                          : 'border-[#2a2a2a]'
                      } rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none`}
                    />

                  </div>


                  {
                    errors.member &&
                    (

                      <p className="text-red-400 text-xs mt-1">
                        {
                          errors.member
                        }
                      </p>

                    )
                  }


                  {/* RESULTADOS */}

                  {
                    memberSearch &&
                    !selectedMember &&
                    (

                      <div className="mt-3 space-y-2">

                        {
                          memberResults.length >
                            0
                            ? (

                              memberResults.map(
                                member => (

                                  <button
                                    type="button"
                                    key={
                                      member.id
                                    }
                                    onClick={() =>
                                      handleSelectMember(
                                        member
                                      )
                                    }
                                    className="w-full p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl hover:border-[#00ff88] text-left"
                                  >

                                    <div className="flex items-center gap-3">

                                      <div className="w-10 h-10 rounded-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center">

                                        {
                                          member.profilePhoto
                                            ? (

                                              <img
                                                src={
                                                  member.profilePhoto
                                                }
                                                alt=""
                                                className="w-full h-full object-cover"
                                              />

                                            )
                                            : (

                                              <User
                                                size={18}
                                                className="text-gray-500"
                                              />

                                            )
                                        }

                                      </div>


                                      <div>

                                        <p className="text-white text-sm font-medium">
                                          {member.firstName} {member.lastName}
                                        </p>


                                        <p className="text-gray-500 text-xs">
                                          {member.id} · {member.phone || 'Sin teléfono'}
                                        </p>

                                      </div>

                                    </div>

                                  </button>

                                )
                              )

                            )
                            : (

                              <p className="text-gray-500 text-sm text-center py-4">
                                No encontramos miembros.
                              </p>

                            )
                        }

                      </div>

                    )
                  }


                  {/* SELECCIONADO */}

                  {
                    selectedMember &&
                    (

                      <div className="mt-4 p-3 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl">

                        <div className="flex items-center gap-3">

                          <CheckCircle
                            size={20}
                            className="text-[#00ff88]"
                          />


                          <div>

                            <p className="text-white font-medium">
                              {selectedMember.firstName} {selectedMember.lastName}
                            </p>


                            <p className="text-gray-500 text-xs font-mono">
                              {
                                selectedMember.id
                              }
                            </p>

                          </div>

                        </div>

                      </div>

                    )
                  }

                </div>


                {/* ================================================= */}
                {/* CONCEPTO */}
                {/* ================================================= */}

                <div className="mb-6">

                  <label className="text-white text-sm font-medium mb-2 block">
                    Concepto
                  </label>


                  <div className="p-3 bg-[#1a1a1a] border border-[#00ff88] rounded-xl">

                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">

                        <RefreshCw
                          size={16}
                          className="text-[#00ff88]"
                        />

                      </div>


                      <div>

                        <p className="text-white font-medium">
                          Renovación de suscripción
                        </p>


                        <p className="text-gray-400 text-xs">
                          {RENEWAL_PLAN.days} días · ${Number(RENEWAL_PLAN.price || 0).toFixed(2)} {currency}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>


                {/* ================================================= */}
                {/* RENOVACIÓN */}
                {/* ================================================= */}

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">

                  <h4 className="text-white font-medium mb-3">
                    Renovación
                  </h4>


                  {
                    selectedMember &&
                    renewalPreview
                      ? (

                        <div className="space-y-2">

                          <div className="flex justify-between text-sm">

                            <span className="text-gray-400">
                              Periodo
                            </span>


                            <span className="text-white">
                              {RENEWAL_PLAN.days} días
                            </span>

                          </div>


                          <div className="flex justify-between text-sm">

                            <span className="text-gray-400">
                              Vencimiento actual
                            </span>


                            <span className="text-yellow-500">
                              {
                                renewalPreview.currentEnd
                              }
                            </span>

                          </div>


                          <div className="flex justify-between text-sm">

                            <span className="text-gray-400">
                              Días restantes
                            </span>


                            <span className="text-white">
                              {
                                renewalPreview.remaining
                              } días
                            </span>

                          </div>


                          <div className="border-t border-[#2a2a2a] pt-3 mt-3">

                            <div className="flex justify-between text-sm">

                              <span className="text-gray-400">
                                Nueva vigencia
                              </span>


                              <span className="text-[#00ff88] text-right">
                                {renewalPreview.startDate}
                                <br />
                                hasta
                                <br />
                                {renewalPreview.endDate}
                              </span>

                            </div>

                          </div>

                        </div>

                      )
                      : (

                        <p className="text-gray-500 text-xs text-center py-3">
                          Selecciona un miembro para calcular la renovación.
                        </p>

                      )
                  }

                </div>


                {/* ================================================= */}
                {/* PROMOCIÓN */}
                {/* ================================================= */}

                <div className="mb-6">

                  <label className="text-white text-sm font-medium mb-2 block">
                    Promoción o descuento
                  </label>

                  <select
                    value={paymentForm.promotionId}
                    onChange={
                      event => {

                        setPaymentForm(
                          previous => ({
                            ...previous,
                            promotionId:
                              event.target.value,
                            promotionReference:
                              ''
                          })
                        );

                        setErrors(
                          previous => ({
                            ...previous,
                            promotionReference:
                              ''
                          })
                        );

                      }
                    }
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                  >

                    <option value="">
                      Sin promoción
                    </option>

                    {
                      availablePromotions.map(
                        promotion => (

                          <option
                            key={promotion.id}
                            value={promotion.id}
                          >
                            {promotion.label}
                          </option>

                        )
                      )
                    }

                  </select>


                  {
                    selectedPromotion &&
                    (

                      <div className="mt-3 p-3 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20">

                        <div className="flex justify-between text-sm">

                          <span className="text-gray-400">
                            Precio normal
                          </span>

                          <span className="text-gray-300 line-through">
                            ${Number(promotionPricing.originalPrice || 0).toFixed(2)} {currency}
                          </span>

                        </div>


                        <div className="flex justify-between text-sm mt-1">

                          <span className="text-gray-400">
                            Descuento
                          </span>

                          <span className="text-[#00ff88]">
                            -${Number(promotionPricing.discountAmount || 0).toFixed(2)} {currency}
                          </span>

                        </div>


                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-[#00ff88]/10">

                          <span className="text-white font-semibold">
                            Total
                          </span>

                          <span className="text-[#00ff88] font-black">
                            ${Number(promotionPricing.finalPrice || 0).toFixed(2)} {currency}
                          </span>

                        </div>

                      </div>

                    )
                  }


                  {
                    selectedPromotion?.referenceRequired &&
                    (

                      <div className="mt-3">

                        <input
                          type="text"
                          value={paymentForm.promotionReference}
                          onChange={
                            event =>
                              setPaymentForm(
                                previous => ({
                                  ...previous,
                                  promotionReference:
                                    event.target.value
                                })
                              )
                          }
                          placeholder={
                            selectedPromotion.id === 'courtesy'
                              ? 'Motivo / autorización de cortesía'
                              : 'Referencia del convenio'
                          }
                          className={`w-full bg-[#1a1a1a] border ${
                            errors.promotionReference
                              ? 'border-red-500'
                              : 'border-[#2a2a2a]'
                          } rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
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


                {/* ================================================= */}
                {/* MONTO */}
                {/* ================================================= */}

                <div className="mb-6">

                  <label className="text-white text-sm font-medium mb-2 block">
                    Monto
                  </label>


                  <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>


                    <input
                      type="text"
                      value={
                        paymentForm.amount
                      }
                      readOnly
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-8 pr-4 py-2.5 text-white"
                    />

                  </div>


                  <p className="text-gray-500 text-xs mt-1">
                    Precio configurado para la suscripción mensual.
                  </p>

                </div>


                {/* ================================================= */}
                {/* MÉTODO */}
                {/* ================================================= */}

                <div className="mb-6">

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
                            No se realizará cobro. La renovación quedará registrada con total $0.00.
                          </p>

                        </div>

                      )
                      : (

                  <div className="grid grid-cols-2 gap-2">

                    {
                      paymentMethods.map(
                        method => {

                          const Icon =
                            method.icon;


                          return (

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
                                p-3 rounded-xl border-2 transition-all

                                ${
                                  paymentForm.method ===
                                  method.id
                                    ? 'border-[#00ff88] bg-[#00ff88]/10'
                                    : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00ff88]/50'
                                }
                              `}
                            >

                              <div className="flex items-center justify-center gap-2">

                                <Icon
                                  size={17}
                                  className={
                                    paymentForm.method ===
                                    method.id
                                      ? 'text-[#00ff88]'
                                      : 'text-gray-500'
                                  }
                                />


                                <span className="text-white text-sm">
                                  {
                                    method.label
                                  }
                                </span>

                              </div>

                            </button>

                          );

                        }
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
                  !promotionPricing.isCourtesy &&
                  paymentForm.method ===
                    'efectivo' &&
                  (

                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">

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
                              paymentForm.received
                            }
                            onChange={
                              handleAmountChange
                            }
                            className={`w-full bg-[#0d0d0d] border ${
                              errors.received
                                ? 'border-red-500'
                                : 'border-[#2a2a2a]'
                            } rounded-xl pl-8 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none`}
                            step="0.01"
                            min="0"
                          />

                        </div>


                        {
                          errors.received &&
                          (

                            <p className="text-red-400 text-xs mt-1">
                              {
                                errors.received
                              }
                            </p>

                          )
                        }

                      </div>


                      <div className="mt-4 space-y-2">

                        <div className="flex justify-between text-sm">

                          <span className="text-gray-400">
                            Total
                          </span>


                          <span className="text-white">
                            ${paymentForm.amount}
                          </span>

                        </div>


                        <div className="flex justify-between text-sm">

                          <span className="text-gray-400">
                            Recibido
                          </span>


                          <span className="text-white">
                            ${paymentForm.received || '0.00'}
                          </span>

                        </div>


                        <div className="flex justify-between text-lg pt-2 border-t border-[#2a2a2a]">

                          <span className="text-gray-400 font-medium">
                            Cambio
                          </span>


                          <span className="text-[#00ff88] font-bold">
                            ${paymentForm.change}
                          </span>

                        </div>

                      </div>

                    </div>

                  )
                }


                {/* ================================================= */}
                {/* REFERENCIA */}
                {/* ================================================= */}

                {
                  (
                    paymentForm.method ===
                      'transferencia' ||
                    paymentForm.method ===
                      'tarjeta'
                  ) &&
                  (

                    <div className="mb-6">

                      <label className="text-white text-sm font-medium mb-1 block">

                        {
                          paymentForm.method ===
                            'transferencia'
                            ? 'Referencia de transferencia'
                            : 'Referencia de operación'
                        }

                      </label>


                      <input
                        type="text"
                        value={
                          paymentForm.reference
                        }
                        onChange={
                          e =>
                            setPaymentForm(
                              previous => ({
                                ...previous,
                                reference:
                                  e.target.value
                              })
                            )
                        }
                        placeholder="Ej. 829104"
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
                            {
                              errors.reference
                            }
                          </p>

                        )
                      }


                      <div className="mt-3 border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 text-center">

                        <Upload
                          size={24}
                          className="text-gray-500 mx-auto mb-2"
                        />


                        <p className="text-gray-400 text-sm">
                          Comprobante opcional
                        </p>


                        <p className="text-gray-500 text-xs">
                          Para pruebas locales no guardaremos archivos aquí.
                        </p>

                      </div>

                    </div>

                  )
                }


                {/* ================================================= */}
                {/* NOTAS */}
                {/* ================================================= */}

                <div className="mb-6">

                  <label className="text-white text-sm font-medium mb-2 block">
                    Notas
                  </label>


                  <textarea
                    value={
                      paymentForm.notes
                    }
                    onChange={
                      e =>
                        setPaymentForm(
                          previous => ({
                            ...previous,
                            notes:
                              e.target.value
                          })
                        )
                    }
                    placeholder="Agrega información adicional sobre este pago..."
                    rows="3"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none resize-none"
                  />

                </div>


                {/* ================================================= */}
                {/* RESUMEN */}
                {/* ================================================= */}

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">

                  <h4 className="text-white font-medium mb-3">
                    Resumen
                  </h4>


                  <div className="space-y-2 text-sm">

                    <div className="flex justify-between">

                      <span className="text-gray-400">
                        Miembro
                      </span>


                      <span className="text-white text-right">

                        {
                          selectedMember
                            ? `${selectedMember.firstName} ${selectedMember.lastName}`
                            : '—'
                        }

                      </span>

                    </div>


                    <div className="flex justify-between">

                      <span className="text-gray-400">
                        Concepto
                      </span>


                      <span className="text-white">
                        Renovación
                      </span>

                    </div>


                    <div className="flex justify-between">

                      <span className="text-gray-400">
                        Método
                      </span>


                      <span className="text-white">
                        {
                          getMethodLabel(
                            paymentForm.method
                          )
                        }
                      </span>

                    </div>


                    {
                      renewalPreview &&
                      (

                        <div className="flex justify-between">

                          <span className="text-gray-400">
                            Nueva vigencia
                          </span>


                          <span className="text-white text-right">
                            {renewalPreview.startDate}
                            <br />
                            {renewalPreview.endDate}
                          </span>

                        </div>

                      )
                    }


                    <div className="flex justify-between pt-2 border-t border-[#2a2a2a]">

                      <span className="text-gray-400 font-medium">
                        Total
                      </span>


                      <span className="text-[#00ff88] font-bold">
                        ${paymentForm.amount} MXN
                      </span>

                    </div>

                  </div>

                </div>


                {/* BOTÓN */}

                <button
                  type="button"
                  onClick={
                    handleRegisterPayment
                  }
                  className="w-full py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all flex items-center justify-center gap-2"
                >

                  <Check
                    size={20}
                  />

                  Registrar pago

                </button>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* CONFIRMAR */}
      {/* ================================================= */}

      {
        showConfirmModal &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">

                  <AlertCircle
                    size={32}
                    className="text-yellow-500"
                  />

                </div>


                <h2 className="text-white text-xl font-bold mb-2">
                  Confirmar pago
                </h2>


                <div className="text-left space-y-2 mb-4 text-sm">

                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Miembro
                    </span>


                    <span className="text-white text-right">
                      {selectedMember?.firstName} {selectedMember?.lastName}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Concepto
                    </span>


                    <span className="text-white">
                      Renovación · 30 días
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Monto
                    </span>


                    <span className="text-[#00ff88] font-bold">
                      ${paymentForm.amount} MXN
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Método
                    </span>


                    <span className="text-white">
                      {
                        getMethodLabel(
                          paymentForm.method
                        )
                      }
                    </span>

                  </div>


                  {
                    renewalPreview &&
                    (

                      <div className="flex justify-between gap-4">

                        <span className="text-gray-400">
                          Nueva vigencia
                        </span>


                        <span className="text-white text-right">
                          {renewalPreview.startDate}
                          <br />
                          hasta {renewalPreview.endDate}
                        </span>

                      </div>

                    )
                  }

                </div>


                <p className="text-gray-400 text-sm mb-6">
                  Al confirmar se registrará el pago y se renovará la suscripción del miembro.
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
                      handleConfirmPayment
                    }
                    className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold"
                  >
                    Confirmar pago
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* ÉXITO */}
      {/* ================================================= */}

      {
        showSuccessModal &&
        lastPayment &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70]">

            <div className="bg-[#111111] border border-[#00ff88]/30 rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <div className="w-20 h-20 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4 animate-bounce-in">

                  <CheckCircle
                    size={40}
                    className="text-[#00ff88]"
                  />

                </div>


                <h2 className="text-white text-2xl font-bold mb-2">
                  ¡Pago registrado!
                </h2>


                <p className="text-gray-400 mb-4">
                  El pago y la renovación fueron guardados correctamente.
                </p>


                <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">

                  <p className="text-[#00ff88] font-mono text-xs break-all">
                    {
                      lastPayment.id
                    }
                  </p>


                  <div className="flex justify-between text-sm mt-3">

                    <span className="text-gray-400">
                      Monto
                    </span>


                    <span className="text-[#00ff88] font-medium">
                      ${lastPayment.amount} MXN
                    </span>

                  </div>


                  <div className="flex justify-between text-sm mt-1">

                    <span className="text-gray-400">
                      Estado
                    </span>


                    <span className="text-[#00ff88]">
                      PAGADO
                    </span>

                  </div>


                  <div className="flex justify-between text-sm mt-1">

                    <span className="text-gray-400">
                      Vigencia
                    </span>


                    <span className="text-white text-right">
                      {
                        lastPayment.period
                      }
                    </span>

                  </div>

                </div>


                <div className="flex flex-col gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      window.print()
                    }
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] flex items-center justify-center gap-2"
                  >

                    <Printer
                      size={18}
                    />

                    Imprimir

                  </button>


                  <button
                    type="button"
                    onClick={
                      handleFinish
                    }
                    className="w-full px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a]"
                  >
                    Finalizar
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      <style>{`

        @keyframes bounce-in {

          0% {
            transform: scale(0.5);
            opacity: 0;
          }

          60% {
            transform: scale(1.1);
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }

        }

        @keyframes slide-in-right {

          0% {
            transform: translateX(100%);
          }

          100% {
            transform: translateX(0);
          }

        }

        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }

      `}</style>

      <AdminAuthorizationModal
        open={
          Boolean(
            adminAction
          )
        }
        action={
          adminAction?.action
        }
        title={
          adminAction?.title
        }
        description={
          adminAction?.description
        }
        confirmLabel={
          adminAction?.confirmLabel
        }
        target={
          adminAction?.target
        }
        onAuthorized={
          adminAction?.onAuthorized
        }
        onClose={() =>
          setAdminAction(
            null
          )
        }
      />


    </div>

  );

};


export default PaymentsPage;