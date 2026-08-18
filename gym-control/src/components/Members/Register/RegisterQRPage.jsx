// src/components/Members/Register/RegisterQRPage.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Image,
  KeyRound,
  Loader2,
  Printer,
  QrCode,
  Scan,
  ScanFace,
  Shield,
  User,
  X,
} from 'lucide-react';

import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';
import FaceEnrollment from '../../Access/FaceEnrollment';
import PaymentReceipt from '../../Payments/PaymentReceipt';

import {
  useGymSettings
} from '../../../context/GymSettingsContext';
  
import {
  generateFaceId,
  generateUniquePin,
  generateUniqueQRToken,
  getNextMemberId,
  getStoredMembers,
  saveMember,
} from '../../../utils/memberId';

import {
  findDuplicateFace,
} from '../../../services/faceService';

import {
  getCurrentSession
} from '../../../services/authService';

import {
  addCredentialHistoryEvent
} from '../../../services/credentialHistory';

import {
  mirrorBillingOperationOffline
} from '../../../offline/services/offlineBillingService.js';


import {
  readGymScopedArray,
  saveGymScopedArray
} from '../../../utils/gymScopedStorage.js';

const PAYMENTS_KEY = 'gym_control_payments';
const SUBSCRIPTION_HISTORY_KEY = 'gym_control_subscription_history';

const readLocalArray = (
  key
) => {

  return readGymScopedArray(
    key
  );

};

const saveLocalArray = (
  key,
  data
) => {

  return saveGymScopedArray(
    key,
    data
  );

};

const createLocalId = (prefix) => {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
};


const RegisterQRPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const credentialRef = useRef(null);
  const receiptRef = useRef(null);

  const { settings } = useGymSettings();

  const currentSession =
    getCurrentSession();

  // ======================================================
  // DATOS PASO 1 Y 2
  // ======================================================

  const memberData = location.state?.memberData || {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    id: null,
    registrationDate: null,
    profilePhoto: null,
  };

  const subscriptionData = location.state?.subscriptionData || {
    plan: 'Mensual',
    days: 30,
    startDate: 'Fecha no disponible',
    endDate: 'Fecha no disponible',
    paymentMethod: 'No registrado',
    amount: '0.00',
    status: 'active',
  };

  const [memberId] = useState(() => {
    if (memberData?.id && /^GYM-\d{5}$/.test(memberData.id)) {
      return memberData.id;
    }

    return getNextMemberId();
  });

  const [qrToken] = useState(() => generateUniqueQRToken());
  const [faceId] = useState(() => generateFaceId());

  const [memberPin, setMemberPin] = useState('');
  const [pinHash, setPinHash] = useState('');
  const [pinReady, setPinReady] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [qrGenerated, setQrGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);

  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
  const [faceData, setFaceData] = useState(null);
  const [faceError, setFaceError] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fullName =
    `${memberData.firstName || ''} ${memberData.lastName || ''}`.trim() ||
    'Nuevo miembro';

  const qrData = useMemo(
    () =>
      JSON.stringify({
        type: 'GYM_CONTROL_ACCESS',
        version: 1,
        memberId,
        token: qrToken,
      }),
    [memberId, qrToken]
  );

  // ======================================================
  // PIN AUTOMÁTICO
  // ======================================================

  useEffect(() => {
    let mounted = true;

    const createPin = async () => {
      try {
        setPinError('');
        setPinReady(false);

        const result = await generateUniquePin();

        if (!mounted) return;

        setMemberPin(result.pin);
        setPinHash(result.pinHash);
        setPinReady(true);
      } catch (error) {
        console.error('Error generando PIN:', error);

        if (!mounted) return;

        setPinError(error?.message || 'No se pudo generar el PIN.');
      }
    };

    createPin();

    return () => {
      mounted = false;
    };
  }, []);

  // ======================================================
  // QR
  // ======================================================

  const handleGenerateQR = () => {
    if (!pinReady) {
      setSaveError('Espera a que el sistema termine de generar el PIN.');
      return;
    }

    setSaveError('');
    setIsGenerating(true);

    setTimeout(() => {
      setIsGenerating(false);
      setQrGenerated(true);

      addCredentialHistoryEvent({
        memberId,
        memberName: fullName,
        action: 'generated',
        source: 'registration',
        actor: currentSession,
        metadata: {
          qrGenerated: true
        }
      });
    }, 900);
  };

  // ======================================================
  // BIOMETRÍA
  // ======================================================

  const handleFaceComplete = (data) => {
    const members = getStoredMembers();
    const duplicate = findDuplicateFace(data.embeddings, members, 0.75);

    if (duplicate.duplicate) {
      setFaceError(
        `Este rostro parece estar registrado con ${duplicate.member?.firstName || ''} ${
          duplicate.member?.lastName || ''
        } (${duplicate.member?.id || 'otro miembro'}). Similitud: ${Math.round(
          duplicate.similarity * 100
        )}%.`
      );

      setShowFaceEnrollment(false);
      return;
    }

    setFaceError('');
    setFaceData(data);
    setShowFaceEnrollment(false);
  };

  // ======================================================
  // DESCARGA QR / CREDENCIAL
  // ======================================================

  const downloadSvgAsPng = () => {
    const svg = document.querySelector('#qr-code-container svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], {
      type: 'image/svg+xml;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const image = new window.Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;

      const context = canvas.getContext('2d');
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.download = `QR-${memberId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      addCredentialHistoryEvent({
        memberId,
        memberName: fullName,
        action: 'qr_downloaded',
        source: 'registration',
        actor: currentSession
      });

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const handleDownload = async (type) => {
    if (type === 'QR - PNG') {
      downloadSvgAsPng();
      return;
    }

    if (type === 'Credencial - PNG') {
      if (!credentialRef.current) return;

      try {
        const html2canvasModule = await import('html2canvas');
        const html2canvas = html2canvasModule.default;

        const canvas = await html2canvas(credentialRef.current, {
          scale: 2,
          backgroundColor: null,
          useCORS: true,
          allowTaint: true,
        });

        const link = document.createElement('a');
        link.download = `Credencial-${memberId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        addCredentialHistoryEvent({
          memberId,
          memberName: fullName,
          action: 'credential_downloaded',
          source: 'registration',
          actor: currentSession
        });
      } catch (error) {
        console.error('Error descargando credencial:', error);
      }
    }
  };

  // ======================================================
  // IMPRESIÓN
  // ======================================================

  const printCredential = () => {
    const printContent = document.getElementById('credential-print');
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Credencial ${memberId}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = function () {
              window.print();
              window.close();
            };
          <\/script>
        </body>
      </html>
    `);

    win.document.close();

    addCredentialHistoryEvent({
      memberId,
      memberName: fullName,
      action: 'credential_printed',
      source: 'registration',
      actor: currentSession
    });
  };

  // ======================================================
  // FINALIZAR REGISTRO
  // ======================================================

  const handleFinalize = () => {
    if (!qrGenerated) {
      setSaveError('Debes generar el QR antes de finalizar.');
      return;
    }

    if (!pinReady || !memberPin || !pinHash) {
      setSaveError('El PIN todavía no está listo.');
      return;
    }

    if (!faceData?.enrolled || !Array.isArray(faceData.embeddings)) {
      setSaveError(
        'Debes registrar el rostro del miembro antes de finalizar.'
      );
      return;
    }

    setSaveError('');
    setIsSaving(true);

    try {
      const now = new Date().toISOString();

      const finalMember = {
        ...memberData,

        id: memberId,
        firstName: memberData.firstName || '',
        lastName: memberData.lastName || '',
        status: 'active',
        accessBlocked: false,

        subscription: {
          ...subscriptionData,
          status: 'active',
        },

        access: {
          qr: {
            enabled: true,
            configured: true,
            token: qrToken,
          },

          pin: {
            enabled: true,
            configured: true,
            pinHash,
          },

          face: {
            enabled: true,
            enrolled: true,
            faceId: faceData.faceId,
            embeddings: faceData.embeddings,
            samples: faceData.samples,
            enrolledAt: faceData.enrolledAt,
          },
        },

        registrationDate:
          memberData.registrationDate || now,

        createdAt:
          memberData.createdAt || now,

        updatedAt:
          now,
      };

      // ====================================================
      // GUARDAR MIEMBRO
      // ====================================================

      saveMember(finalMember);

      // ====================================================
      // REGISTRAR AUTOMÁTICAMENTE EL PAGO INICIAL
      // ====================================================
      //
      // El pago viene desde el Paso 2.
      // No se vuelve a capturar manualmente en Pagos.
      //
      // EFECTIVO:
      //   amount = costo del plan
      //   receivedAmount = efectivo recibido
      //   change = cambio calculado
      //
      // TARJETA / TRANSFERENCIA / OTRO:
      //   amount = costo del plan
      //   receivedAmount = costo del plan
      //   change = 0
      //
      // ====================================================

      const payments =
        readLocalArray(
          PAYMENTS_KEY
        );

      // Evitar duplicar el pago si por alguna razón
      // el usuario presiona Finalizar más de una vez.
      const existingInitialPayment =
        payments.find(
          payment =>
            payment.memberId ===
              memberId &&
            payment.type ===
              'subscription_initial'
        );

      let paymentId =
        existingInitialPayment?.id ||
        null;

      let paymentRecordForOffline =
        existingInitialPayment ||
        null;


      if (
        existingInitialPayment
      ) {

        setLastPayment(
          existingInitialPayment
        );

      }


      if (
        !existingInitialPayment
      ) {

        const memberName =
          `${finalMember.firstName || ''} ${finalMember.lastName || ''}`
            .trim() ||
          'Miembro';


        const paymentMethod =
          subscriptionData.paymentMethod ||
          'no_registrado';


        const planAmount =
          Number(
            subscriptionData.amount ??
            subscriptionData.price ??
            0
          );


        const receivedAmount =
          paymentMethod ===
            'efectivo'
            ? Number(
                subscriptionData.receivedAmount ??
                planAmount
              )
            : planAmount;


        const change =
          paymentMethod ===
            'efectivo'
            ? Number(
                subscriptionData.change ||
                0
              )
            : 0;


        const paymentRecord = {

          id:
            createLocalId(
              settings?.receiptPrefix ||
              'PAY'
            ),

          gymId:
            currentSession?.gymId ||
            finalMember?.gymId ||
            null,

          gymCode:
            currentSession?.gymCode ||
            finalMember?.gymCode ||
            null,

          memberId,

          memberName,

          concept:
            'Inscripción / suscripción inicial',

          type:
            'subscription_initial',

          source:
            'member_registration',

          plan:
            subscriptionData.plan ||
            '',

          planLabel:
            subscriptionData.planLabel ||
            subscriptionData.plan ||
            'Suscripción',

          days:
            Number(
              subscriptionData.days ||
              0
            ),

          period:
            `${subscriptionData.startDate || '—'} - ${subscriptionData.endDate || '—'}`,

          method:
            paymentMethod,

          paymentMethod,

          amount:
            planAmount.toFixed(
              2
            ),

          originalAmount:
            Number(
              subscriptionData.originalAmount ??
              subscriptionData.price ??
              planAmount
            ).toFixed(
              2
            ),

          discountAmount:
            Number(
              subscriptionData.discountAmount ||
              0
            ).toFixed(
              2
            ),

          promotion:
            subscriptionData.promotion ||
            null,

          receivedAmount:
            receivedAmount.toFixed(
              2
            ),

          change:
            change.toFixed(
              2
            ),

          reference:
            subscriptionData.reference ||
            '',

          notes:
            subscriptionData.notes ||
            '',

          currency:
            subscriptionData.currency ||
            'MXN',

          status:
            'completed',

          createdAt:
            now,

          updatedAt:
            now,

          date:
            now

        };


        payments.unshift(
          paymentRecord
        );


        saveLocalArray(
          PAYMENTS_KEY,
          payments
        );


        paymentId =
          paymentRecord.id;


        paymentRecordForOffline =
          paymentRecord;


        setLastPayment(
          paymentRecord
        );

      }


      // ====================================================
      // HISTORIAL DE SUSCRIPCIÓN INICIAL
      // ====================================================

      const history =
        readLocalArray(
          SUBSCRIPTION_HISTORY_KEY
        );


      const existingInitialHistory =
        history.find(
          record =>
            record.memberId ===
              memberId &&
            record.type ===
              'initial'
        );


      let subscriptionHistoryForOffline =
        existingInitialHistory ||
        null;


      if (
        !existingInitialHistory
      ) {

        const subscriptionHistoryRecord = {

          id:
            createLocalId(
              'SUBH'
            ),

          gymId:
            currentSession?.gymId ||
            finalMember?.gymId ||
            null,

          gymCode:
            currentSession?.gymCode ||
            finalMember?.gymCode ||
            null,

          memberId,

          memberName:
            `${finalMember.firstName || ''} ${finalMember.lastName || ''}`
              .trim() ||
            'Miembro',

          type:
            'initial',

          source:
            'member_registration',

          previousSubscription:
            null,

          subscription: {
            ...finalMember.subscription
          },

          paymentId,

          notes:
            subscriptionData.notes ||
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


        subscriptionHistoryForOffline =
          subscriptionHistoryRecord;

      }


      // ====================================================
      // RESPALDAR PAGO + SUSCRIPCIÓN EN INDEXEDDB
      // ====================================================

      void mirrorBillingOperationOffline({

        payment:
          paymentRecordForOffline,

        subscription:
          subscriptionHistoryForOffline,

        gymId:
          currentSession?.gymId ||
          finalMember?.gymId ||
          null,

        session:
          currentSession,

        member:
          finalMember

      })
        .then(
          result => {

            console.log(
              '✅ Operación inicial respaldada offline:',
              result
            );

          }
        )
        .catch(
          error => {

            console.error(
              '❌ Error respaldando pago/suscripción offline:',
              error
            );

          }
        );


      console.log(
        '✅ Miembro registrado:',
        finalMember
      );

      console.log(
        '💰 Pago inicial registrado automáticamente:',
        paymentId
      );

      setShowFinalModal(true);
    } catch (error) {
      console.error(
        'Error guardando miembro y pago:',
        error
      );

      setSaveError(
        error?.message ||
        'No se pudo guardar el miembro y registrar su pago.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ======================================================
  // TICKET DE PAGO
  // ======================================================

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) {
      return;
    }

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        backgroundColor: '#f8f8f6',
        useCORS: true,
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `Ticket-${lastPayment?.id || memberId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error descargando ticket:', error);
      setSaveError('No se pudo descargar el ticket.');
    }
  };

  const handlePrintReceipt = async () => {
    if (!receiptRef.current) {
      return;
    }

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        backgroundColor: '#f8f8f6',
        useCORS: true,
        allowTaint: true
      });

      const image = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank', 'width=700,height=900');

      if (!printWindow) {
        setSaveError('El navegador bloqueó la ventana de impresión.');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket ${lastPayment?.id || memberId}</title>
            <style>
              * { box-sizing: border-box; }
              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding: 18px;
                background: #fff;
              }
              img {
                width: 100%;
                max-width: 430px;
                height: auto;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <img src="${image}" />
            <script>
              window.onload = function () {
                window.print();
                window.close();
              };
            <\/script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error('Error imprimiendo ticket:', error);
      setSaveError('No se pudo imprimir el ticket.');
    }
  };

  // ======================================================
  // NAVEGACIÓN
  // ======================================================

  const handleViewProfile = () => {
    setShowFinalModal(false);

    const saved = getStoredMembers().find((item) => item.id === memberId);

    navigate(`/members/${memberId}`, {
      state: {
        memberData: saved || {
          ...memberData,
          id: memberId,
        },

        subscriptionData: {
          ...subscriptionData,
          status: 'active',
        },
      },
    });
  };

  const handleBack = () => {
    navigate('/members/register/subscription', {
      state: {
        memberData,
        subscriptionData,
      },
    });
  };

  const handleTestScan = () => {
    navigate('/access');
  };

  const steps = [
    {
      number: 1,
      label: 'Datos personales',
      icon: User,
      completed: true,
    },
    {
      number: 2,
      label: 'Suscripción',
      icon: CreditCard,
      completed: true,
    },
    {
      number: 3,
      label: 'Accesos',
      icon: Shield,
      completed: false,
      current: true,
    },
  ];

  const allAccessReady = qrGenerated && pinReady && Boolean(faceData?.enrolled);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Miembros" />

      <div className="flex-1 lg:ml-0">
        <Header />

        <main className="p-6">
          {/* ================================================= */}
          {/* BREADCRUMB / HEADER */}
          {/* ================================================= */}

          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <button
                onClick={() => navigate('/members')}
                className="hover:text-white transition-colors"
              >
                Miembros
              </button>

              <span>/</span>

              <button
                onClick={() => navigate('/members/register')}
                className="hover:text-white transition-colors"
              >
                Registrar miembro
              </button>

              <span>/</span>

              <span className="text-white">Accesos</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Registrar nuevo miembro
                </h1>

                <p className="text-gray-400">
                  Genera QR, PIN y biometría facial exclusivos para el miembro.
                </p>
              </div>

              <button
                onClick={handleBack}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-[#00ff88] hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Volver
              </button>
            </div>
          </div>

          {/* ================================================= */}
          {/* STEPPER */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <React.Fragment key={step.number}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                            ${
                              step.completed
                                ? 'bg-[#00ff88] text-black'
                                : step.current
                                ? 'bg-[#00ff88] text-black ring-2 ring-[#00ff88] ring-offset-2 ring-offset-[#111111]'
                                : 'bg-[#1a1a1a] text-gray-500'
                            }
                          `}
                        >
                          {step.completed ? <Check size={16} /> : step.number}
                        </div>

                        <span
                          className={`
                            text-sm font-medium
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

                        {step.completed && (
                          <span className="text-[#00ff88] text-xs ml-1">✓</span>
                        )}
                      </div>

                      {index < steps.length - 1 && (
                        <div className="hidden sm:block w-12 h-px bg-[#2a2a2a]" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <p className="text-gray-500 text-xs">
                Paso 3 de 3 · Métodos de acceso
              </p>
            </div>

            <p className="text-gray-500 text-sm mt-3">
              Los tres métodos quedarán vinculados al mismo miembro.
            </p>
          </div>

          {/* ================================================= */}
          {/* ESTADO SUPERIOR */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 flex items-center justify-center">
                  <Check size={20} className="text-[#00ff88]" />
                </div>

                <div>
                  <h3 className="text-white font-bold">Datos y suscripción listos</h3>
                  <p className="text-gray-400 text-sm">
                    Ahora termina de configurar los accesos de {fullName}.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs ml-auto">
                <StatusMini label="Perfil creado" ready />
                <StatusMini label="Pago registrado" ready />
                <StatusMini label="Suscripción activa" ready />
                <StatusMini label="QR" ready={qrGenerated} />
                <StatusMini label="PIN" ready={pinReady} />
                <StatusMini label="Rostro" ready={Boolean(faceData?.enrolled)} />
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* INFO MIEMBRO */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden">
                  {memberData.profilePhoto ? (
                    <img
                      src={memberData.profilePhoto}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-gray-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{fullName}</h3>
                    <span className="text-gray-500 text-sm font-mono">
                      {memberId}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      {memberData.phone || 'Sin teléfono'}
                    </span>

                    {memberData.email && (
                      <span className="text-gray-400">{memberData.email}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full font-medium">
                  Nuevo miembro
                </span>

                <span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] text-xs rounded-full font-medium">
                  Suscripción activa
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-[#1a1a1a] text-sm">
              <div>
                <span className="text-gray-400">Plan:</span>
                <span className="text-white ml-1">
                  {subscriptionData.plan || 'Mensual'} — {subscriptionData.days || 30}{' '}
                  días
                </span>
              </div>

              <div>
                <span className="text-gray-400">Periodo:</span>
                <span className="text-white ml-1">
                  {subscriptionData.startDate} → {subscriptionData.endDate}
                </span>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* GRID PRINCIPAL */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {/* ============================================= */}
              {/* QR */}
              {/* ============================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold mb-1">Código de acceso QR</h3>

                <p className="text-gray-400 text-sm mb-6">
                  El QR utiliza un token único y no expone teléfono, correo ni datos
                  de la suscripción.
                </p>

                {!qrGenerated && !isGenerating && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-48 h-48 bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-xl flex flex-col items-center justify-center mb-6">
                      <QrCode size={64} className="text-gray-600" />
                    </div>

                    <h4 className="text-white font-bold text-lg mb-2">
                      Código QR pendiente
                    </h4>

                    <p className="text-gray-400 text-sm mb-6 text-center">
                      Genera el código permanente del miembro.
                    </p>

                    <button
                      onClick={handleGenerateQR}
                      disabled={!pinReady}
                      className="px-6 py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <QrCode size={20} />
                      Generar código QR
                    </button>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-48 h-48 bg-[#1a1a1a] border-2 border-[#00ff88] rounded-xl flex flex-col items-center justify-center mb-6">
                      <Loader2 size={48} className="text-[#00ff88] animate-spin" />
                    </div>

                    <h4 className="text-white font-bold text-lg mb-2">
                      Generando código de acceso...
                    </h4>
                  </div>
                )}

                {qrGenerated && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Check size={20} className="text-[#00ff88]" />
                      <span className="text-[#00ff88] font-medium">
                        Código QR generado correctamente
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                      {fullName} ya tiene un QR único vinculado a {memberId}.
                    </p>

                    <div className="flex flex-col items-center">
                      <div
                        id="qr-code-container"
                        className="bg-white rounded-xl p-4 shadow-lg mb-4 inline-block"
                      >
                        <QRCodeSVG
                          value={qrData}
                          size={256}
                          level="H"
                          includeMargin={false}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                        />
                      </div>

                      <div className="text-center">
                        <p className="text-white font-mono font-bold">{memberId}</p>
                        <p className="text-gray-400 text-xs">
                          Código permanente del miembro
                        </p>

                        <div className="mt-2 flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
                          <span className="text-[#00ff88] text-sm font-medium">
                            HABILITADO
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-[#1a1a1a]">
                      <button
                        onClick={() => handleDownload('QR - PNG')}
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-300 hover:border-[#00ff88] transition-colors flex items-center gap-2"
                      >
                        <Download size={18} />
                        Descargar QR
                      </button>

                      <button
                        onClick={() => handleDownload('Credencial - PNG')}
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-300 hover:border-[#00ff88] transition-colors flex items-center gap-2"
                      >
                        <Image size={18} />
                        Descargar credencial
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(memberId);
                        }}
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-300 hover:border-[#00ff88] transition-colors flex items-center gap-2"
                      >
                        <Copy size={18} />
                        Copiar ID
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================= */}
              {/* MÉTODOS DE ACCESO */}
              {/* ============================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-white font-bold text-lg">
                  Métodos de acceso del miembro
                </h3>

                <p className="text-gray-400 text-sm mt-1 mb-6">
                  QR, PIN y rostro quedan ligados exclusivamente a {fullName}.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* QR */}
                  <AccessMethodCard
                    icon={QrCode}
                    title="Código QR"
                    status={qrGenerated ? 'GENERADO' : 'PENDIENTE'}
                    ready={qrGenerated}
                    description="Token de acceso único y permanente."
                  />

                  {/* PIN */}
                  <div
                    className={`bg-[#1a1a1a] border rounded-xl p-5 ${
                      pinReady ? 'border-[#00ff88]/30' : 'border-[#2a2a2a]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
                        <KeyRound size={22} className="text-[#00ff88]" />
                      </div>

                      {pinReady ? (
                        <CheckCircle size={20} className="text-[#00ff88]" />
                      ) : (
                        <Loader2 size={20} className="text-gray-500 animate-spin" />
                      )}
                    </div>

                    <h4 className="text-white font-semibold mt-4">PIN personal</h4>

                    <p
                      className={`text-xs font-bold mt-1 ${
                        pinReady ? 'text-[#00ff88]' : 'text-gray-500'
                      }`}
                    >
                      {pinReady ? 'GENERADO AUTOMÁTICAMENTE' : 'GENERANDO...'}
                    </p>

                    {pinReady && (
                      <>
                        <div className="bg-black/30 border border-[#2a2a2a] rounded-xl px-4 py-3 mt-4 flex items-center justify-between gap-3">
                          <span className="text-white text-xl tracking-[0.3em] font-mono font-bold">
                            {showPin ? memberPin : '••••••'}
                          </span>

                          <button
                            type="button"
                            onClick={() => setShowPin((value) => !value)}
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(memberPin)}
                          className="text-[#00ff88] text-xs mt-3 hover:underline"
                        >
                          Copiar PIN
                        </button>
                      </>
                    )}

                    {pinError && (
                      <p className="text-red-400 text-xs mt-3">{pinError}</p>
                    )}
                  </div>

                  {/* ROSTRO */}
                  <div
                    className={`bg-[#1a1a1a] border rounded-xl p-5 ${
                      faceData?.enrolled
                        ? 'border-[#00ff88]/30'
                        : 'border-[#2a2a2a]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
                        <ScanFace size={23} className="text-[#00ff88]" />
                      </div>

                      {faceData?.enrolled ? (
                        <CheckCircle size={20} className="text-[#00ff88]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                      )}
                    </div>

                    <h4 className="text-white font-semibold mt-4">
                      Reconocimiento facial
                    </h4>

                    <p
                      className={`text-xs font-bold mt-1 ${
                        faceData?.enrolled ? 'text-[#00ff88]' : 'text-gray-500'
                      }`}
                    >
                      {faceData?.enrolled ? 'REGISTRADO' : 'SIN REGISTRAR'}
                    </p>

                    <p className="text-gray-500 text-xs mt-3">
                      Se guardan tres plantillas faciales asociadas al miembro.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setFaceError('');
                        setShowFaceEnrollment(true);
                      }}
                      className={`w-full mt-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                        faceData?.enrolled
                          ? 'border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5'
                          : 'border-[#00ff88]/50 bg-[#00ff88] text-black hover:bg-[#00cc6a]'
                      }`}
                    >
                      {faceData?.enrolled ? 'Actualizar rostro' : 'Registrar rostro'}
                    </button>
                  </div>
                </div>

                {faceError && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle
                      size={18}
                      className="text-red-400 shrink-0 mt-0.5"
                    />
                    <span className="text-red-300 text-sm">{faceError}</span>
                  </div>
                )}
              </div>

              {/* ============================================= */}
              {/* CREDENCIAL */}
              {/* ============================================= */}

              {qrGenerated && (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-white font-bold mb-4">Credencial digital</h3>

                  <div
                    ref={credentialRef}
                    id="credential-print"
                    className="max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl relative"
                    style={{
                      backgroundImage: "url('/img/crede.png')",
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40" />

                    <div className="relative z-10 p-6 flex flex-col items-center min-h-[380px] justify-center">
                      <div className="mb-4 text-center">
                        <p className="text-white font-bold text-xl tracking-wide drop-shadow-lg">
                          GYM CONTROL
                        </p>

                        <p className="text-gray-300 text-[10px] tracking-wider drop-shadow-lg">
                          MEMBER ACCESS
                        </p>
                      </div>

                      <div className="w-20 h-20 rounded-full border-2 border-[#00ff88] mx-auto mb-3 flex items-center justify-center overflow-hidden bg-[#1a1a1a]/80 backdrop-blur-sm">
                        {memberData.profilePhoto ? (
                          <img
                            src={memberData.profilePhoto}
                            alt={fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {fullName
                              .split(' ')
                              .map((name) => name[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <p className="text-white font-bold text-lg drop-shadow-lg text-center">
                        {fullName}
                      </p>

                      <p className="text-[#00ff88] text-sm font-mono drop-shadow-lg">
                        {memberId}
                      </p>

                      <div className="flex justify-center my-3">
                        <div className="bg-white rounded-lg p-2 inline-block shadow-lg">
                          <QRCodeSVG
                            value={qrData}
                            size={80}
                            level="H"
                            includeMargin={false}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
                        <span className="text-[#00ff88] text-sm font-bold drop-shadow-lg">
                          ACCESO HABILITADO
                        </span>
                      </div>

                      <p className="text-gray-300 text-xs mt-1 drop-shadow-lg">
                        Suscripción válida hasta:{' '}
                        <span className="text-white">{subscriptionData.endDate}</span>
                      </p>

                      <p className="text-gray-400 text-[10px] mt-2 drop-shadow-lg">
                        Código personal e intransferible
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center gap-2 mt-5">
                    <button
                      onClick={() => handleDownload('Credencial - PNG')}
                      className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white flex items-center gap-2 hover:border-[#00ff88]"
                    >
                      <Image size={18} />
                      Descargar
                    </button>

                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white flex items-center gap-2 hover:border-[#00ff88]"
                    >
                      <Printer size={18} />
                      Imprimir
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================= */}
              {/* CÓDIGO PERMANENTE */}
              {/* ============================================= */}

              {qrGenerated && (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0">
                      <Shield size={20} className="text-[#00ff88]" />
                    </div>

                    <div>
                      <h4 className="text-white font-medium">Accesos permanentes</h4>

                      <p className="text-gray-400 text-sm">
                        El QR, PIN y rostro quedan vinculados al miembro y continúan
                        siendo los mismos mientras el administrador no los regenere.
                      </p>

                      <p className="text-[#00ff88] text-sm mt-1">
                        Renovar la suscripción no cambia los métodos de acceso.
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>Identificación</span>
                        <ChevronRight size={14} />
                        <span>Validación de miembro</span>
                        <ChevronRight size={14} />
                        <span>Validación de suscripción</span>
                        <ChevronRight size={14} />
                        <span className="text-[#00ff88]">Acceso permitido</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================= */}
              {/* VERIFICACIÓN */}
              {/* ============================================= */}

              {allAccessReady && (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                  <h4 className="text-white font-medium mb-3">
                    Verificación de accesos
                  </h4>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
                    <span className="text-[#00ff88] font-medium">
                      Los tres métodos están listos
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm">
                    QR, PIN y rostro están asociados con {fullName}.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                    <VerifyRow label="Miembro" value={memberId} />
                    <VerifyRow label="Suscripción" value="Activa" green />
                    <VerifyRow label="QR" value="Habilitado" green />
                    <VerifyRow label="PIN" value="Habilitado" green />
                    <VerifyRow label="Rostro" value="Registrado" green />
                    <VerifyRow label="Acceso" value="Permitido" green />
                  </div>

                  <button
                    onClick={handleTestScan}
                    className="mt-4 text-[#00ff88] text-sm hover:underline flex items-center gap-1"
                  >
                    <Scan size={14} />
                    Probar control de acceso
                  </button>
                </div>
              )}

              {/* ============================================= */}
              {/* SEGURIDAD */}
              {/* ============================================= */}

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield size={20} className="text-blue-400" />
                  </div>

                  <div>
                    <h4 className="text-white font-medium">Acceso seguro</h4>

                    <p className="text-gray-400 text-sm">
                      Cada intento de acceso deberá identificar al miembro y después
                      validar que su suscripción esté vigente y que no tenga un bloqueo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* RESUMEN LATERAL */}
            {/* ================================================= */}

            <div className="xl:col-span-1">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">
                <h3 className="text-white font-bold mb-4">Resumen del registro</h3>

                <div className="space-y-4">
                  <SummaryBlock
                    title="Datos personales"
                    ready
                    status="Completados"
                  >
                    <p className="text-white text-sm mt-1">{fullName}</p>
                    <p className="text-gray-500 text-xs font-mono">{memberId}</p>
                  </SummaryBlock>

                  <SummaryBlock title="Suscripción" ready status="Activa">
                    <div className="text-sm mt-1">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-400">Plan</span>
                        <span className="text-white">
                          {subscriptionData.plan || 'Mensual'}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-gray-400">Duración</span>
                        <span className="text-white">
                          {subscriptionData.days || 30} días
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-gray-400">Periodo</span>
                        <span className="text-white text-xs text-right">
                          {subscriptionData.startDate} — {subscriptionData.endDate}
                        </span>
                      </div>
                    </div>
                  </SummaryBlock>

                  <SummaryBlock title="Pago" ready status="Registrado">
                    <div className="text-sm mt-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monto</span>
                        <span className="text-white">
                          ${subscriptionData.amount} MXN
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Método</span>
                        <span className="text-white capitalize">
                          {subscriptionData.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </SummaryBlock>

                  <SummaryBlock
                    title="Código QR"
                    ready={qrGenerated}
                    status={qrGenerated ? 'Generado' : 'Pendiente'}
                  >
                    {qrGenerated && (
                      <div className="text-sm mt-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">ID</span>
                          <span className="text-white font-mono">{memberId}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Estado</span>
                          <span className="text-[#00ff88]">Habilitado</span>
                        </div>
                      </div>
                    )}
                  </SummaryBlock>

                  <SummaryBlock
                    title="PIN"
                    ready={pinReady}
                    status={pinReady ? 'Generado' : 'Generando'}
                  >
                    {pinReady && (
                      <p className="text-white font-mono tracking-[0.22em] mt-2">
                        {showPin ? memberPin : '••••••'}
                      </p>
                    )}
                  </SummaryBlock>

                  <SummaryBlock
                    title="Biometría facial"
                    ready={Boolean(faceData?.enrolled)}
                    status={faceData?.enrolled ? 'Registrada' : 'Pendiente'}
                  >
                    {faceData?.enrolled && (
                      <>
                        <p className="text-gray-500 text-xs mt-1">
                          3 muestras biométricas guardadas
                        </p>

                        <p className="text-gray-600 font-mono text-[10px] break-all mt-1">
                          {faceData.faceId}
                        </p>
                      </>
                    )}
                  </SummaryBlock>

                  <div className="border-t border-[#1a1a1a] pt-3">
                    <p className="text-gray-400 text-xs font-medium mb-1">Acceso</p>

                    {allAccessReady ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
                        <span className="text-[#00ff88] font-bold">
                          LISTO PARA INGRESAR
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span className="text-yellow-500 font-bold">
                          CONFIGURACIÓN PENDIENTE
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {saveError && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle
                      size={18}
                      className="text-red-400 shrink-0 mt-0.5"
                    />

                    <span className="text-red-300 text-xs">{saveError}</span>
                  </div>
                )}

                <div className="border-t border-[#1a1a1a] pt-4 mt-4">
                  {allAccessReady ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <Check size={18} className="text-[#00ff88]" />
                        <span className="text-white font-bold">Miembro listo</span>
                      </div>

                      <p className="text-gray-400 text-xs mb-4">
                        {fullName} tiene QR, PIN y biometría facial configurados.
                      </p>

                      <button
                        onClick={handleFinalize}
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Check size={20} />
                            Finalizar registro
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">
                        Completa QR, PIN y reconocimiento facial para finalizar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================================================= */}
      {/* ENROLAMIENTO FACIAL */}
      {/* ================================================= */}

      {showFaceEnrollment && (
        <FaceEnrollment
          memberId={memberId}
          memberName={fullName}
          faceId={faceId}
          onCancel={() => setShowFaceEnrollment(false)}
          onComplete={handleFaceComplete}
        />
      )}

      {/* ================================================= */}
      {/* MODAL IMPRESIÓN */}
      {/* ================================================= */}

      {showPrintModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">
                Imprimir credencial
              </h2>

              <button
                onClick={() => setShowPrintModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
              <div className="flex justify-center">
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG
                    value={qrData}
                    size={128}
                    level="H"
                    includeMargin={false}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>
              </div>

              <p className="text-white font-mono text-sm mt-2">{memberId}</p>
              <p className="text-gray-400 text-xs">{fullName}</p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88]"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  printCredential();
                  setShowPrintModal(false);
                }}
                className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a]"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL FINAL + TICKET */}
      {/* ================================================= */}

      {showFinalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-[0.78fr_1.22fr] gap-5">

            <div className="bg-[#111111] border border-[#00ff88]/20 rounded-2xl p-6 h-fit lg:sticky lg:top-4">
              <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-[#00ff88]" />
              </div>

              <h2 className="text-white text-2xl font-bold">
                Registro completado
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                {fullName} fue registrado correctamente y la suscripción quedó marcada como pagada.
              </p>

              <div className="bg-[#1a1a1a] rounded-xl p-4 mt-5 text-left space-y-2">
                <FinalRow label="ID" value={memberId} />
                <FinalRow
                  label="Plan"
                  value={subscriptionData.planLabel || subscriptionData.plan || 'Suscripción'}
                />
                <FinalRow
                  label="Pago"
                  value={`$${Number(lastPayment?.amount || subscriptionData.amount || 0).toFixed(2)} ${lastPayment?.currency || subscriptionData.currency || settings?.currency || 'MXN'}`}
                />
                <FinalRow label="Estado" value="PAGADO" />
                <FinalRow label="QR" value="Habilitado" />
                <FinalRow label="PIN" value={memberPin} />
                <FinalRow label="Rostro" value="Registrado" />
              </div>

              <div className="mt-5 p-4 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/15">
                <p className="text-[#00ff88] text-sm font-semibold">
                  Ticket generado automáticamente
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  El comprobante utiliza el nombre, logo, dirección, teléfono, moneda y mensaje configurados en Configuración → Recibos y pagos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 mt-5">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full px-4 py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Imprimir ticket
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Descargar ticket PNG
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88]"
                >
                  Ver perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFinalModal(false);
                    navigate('/members/register');
                  }}
                  className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88]"
                >
                  Registrar otro miembro
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFinalModal(false);
                    navigate('/members');
                  }}
                  className="text-gray-500 text-sm hover:text-white transition-colors py-2"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <div>
                  <p className="text-white font-bold">Vista previa del ticket</p>
                  <p className="text-gray-500 text-xs">Sin código QR · comprobante de pago</p>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#00ff88]/10 text-[#00ff88] text-xs font-semibold">
                  PAGADO
                </span>
              </div>

              <PaymentReceipt
                ref={receiptRef}
                settings={settings}
                payment={lastPayment || {
                  id: `${settings?.receiptPrefix || 'PAY'}-${memberId}`,
                  memberId,
                  memberName: fullName,
                  plan: subscriptionData.plan,
                  planLabel: subscriptionData.planLabel,
                  amount: subscriptionData.amount || subscriptionData.price || 0,
                  paymentMethod: subscriptionData.paymentMethod,
                  currency: subscriptionData.currency || settings?.currency || 'MXN',
                  createdAt: new Date().toISOString()
                }}
                member={{
                  ...memberData,
                  id: memberId
                }}
                subscription={subscriptionData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusMini = ({ label, ready }) => (
  <div className="flex items-center gap-1">
    {ready ? (
      <Check size={14} className="text-[#00ff88]" />
    ) : (
      <div className="w-3 h-3 rounded-full border-2 border-gray-600" />
    )}

    <span className={ready ? 'text-[#00ff88]' : 'text-gray-500'}>{label}</span>
  </div>
);

const AccessMethodCard = ({
  icon: Icon,
  title,
  status,
  ready,
  description,
}) => (
  <div
    className={`bg-[#1a1a1a] border rounded-xl p-5 ${
      ready ? 'border-[#00ff88]/30' : 'border-[#2a2a2a]'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
        <Icon size={22} className="text-[#00ff88]" />
      </div>

      {ready ? (
        <CheckCircle size={20} className="text-[#00ff88]" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
      )}
    </div>

    <h4 className="text-white font-semibold mt-4">{title}</h4>

    <p
      className={`text-xs font-bold mt-1 ${
        ready ? 'text-[#00ff88]' : 'text-gray-500'
      }`}
    >
      {status}
    </p>

    <p className="text-gray-500 text-xs mt-3">{description}</p>
  </div>
);

const SummaryBlock = ({ title, ready, status, children }) => (
  <div className="border-t first:border-t-0 border-[#1a1a1a] pt-3 first:pt-0">
    <p className="text-gray-400 text-xs font-medium mb-1">{title}</p>

    <div className="flex items-center gap-2">
      {ready ? (
        <Check size={14} className="text-[#00ff88]" />
      ) : (
        <div className="w-3 h-3 border-2 border-gray-500 rounded-full" />
      )}

      <span className={ready ? 'text-[#00ff88] text-sm' : 'text-gray-500 text-sm'}>
        {status}
      </span>
    </div>

    {children}
  </div>
);

const VerifyRow = ({ label, value, green = false }) => (
  <div className="flex justify-between border-b border-[#1a1a1a] py-1 gap-3">
    <span className="text-gray-400">{label}</span>
    <span className={green ? 'text-[#00ff88]' : 'text-white font-mono'}>
      {value}
    </span>
  </div>
);

const FinalRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm gap-4">
    <span className="text-gray-400">{label}</span>
    <span className="text-[#00ff88] font-medium text-right">{value}</span>
  </div>
);

export default RegisterQRPage;