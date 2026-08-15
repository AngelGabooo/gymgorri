// src/components/Members/Register/RegisterCoupleQRPage.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  useLocation,
  useNavigate
} from 'react-router-dom';

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  HeartHandshake,
  KeyRound,
  Loader2,
  QrCode,
  ScanFace,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';

import {
  QRCodeSVG
} from 'qrcode.react';

import Sidebar from '../../Layout/Sidebar';
import Header from '../../Layout/Header';
import FaceEnrollment from '../../Access/FaceEnrollment';

import {
  useGymSettings
} from '../../../context/GymSettingsContext';

import {
  generateFaceId,
  generateUniquePin,
  generateUniqueQRToken,
  getStoredMembers,
  saveMember
} from '../../../utils/memberId';

import {
  findDuplicateFace
} from '../../../services/faceService';


const PAYMENTS_KEY =
  'gym_control_payments';

const SUBSCRIPTION_HISTORY_KEY =
  'gym_control_subscription_history';


const readLocalArray = (
  key
) => {

  try {

    const raw =
      localStorage.getItem(
        key
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      );

    return Array.isArray(
      parsed
    )
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


const saveLocalArray = (
  key,
  data
) => {

  localStorage.setItem(
    key,
    JSON.stringify(
      data
    )
  );

  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );

};


const createLocalId = (
  prefix
) => {

  if (
    window.crypto?.randomUUID
  ) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

};


const createEmptyAccess = () => ({
  qrToken: '',
  qrGenerated: false,
  faceId: '',
  pin: '',
  pinHash: '',
  pinReady: false,
  faceData: null,
  complete: false
});


const RegisterCoupleQRPage = () => {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    settings
  } = useGymSettings();


  const credentialRef =
    useRef(null);


  const coupleData =
    location.state?.coupleData ||
    null;

  const subscriptions =
    location.state?.subscriptions ||
    [];

  const paymentData =
    location.state?.paymentData ||
    null;


  const members =
    coupleData?.members ||
    [];


  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [accessRecords, setAccessRecords] =
    useState([
      createEmptyAccess(),
      createEmptyAccess()
    ]);

  const [isGeneratingPin, setIsGeneratingPin] =
    useState(false);

  const [showFaceEnrollment, setShowFaceEnrollment] =
    useState(false);

  const [error, setError] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const [finished, setFinished] =
    useState(false);


  const currentMember =
    members[
      currentIndex
    ];

  const currentAccess =
    accessRecords[
      currentIndex
    ];


  const currentSubscription =
    subscriptions.find(
      item =>
        item.memberId ===
        currentMember?.id
    ) ||
    null;


  const fullName =
    useMemo(
      () =>
        `${currentMember?.firstName || ''} ${currentMember?.lastName || ''}`.trim() ||
        `Persona ${currentIndex + 1}`,
      [
        currentMember,
        currentIndex
      ]
    );


  const qrValue =
    useMemo(
      () =>
        currentMember &&
        currentAccess?.qrToken
          ? JSON.stringify({
              type: 'GYM_CONTROL_ACCESS',
              version: 1,
              memberId: currentMember.id,
              token: currentAccess.qrToken
            })
          : '',
      [
        currentMember,
        currentAccess?.qrToken
      ]
    );


  // ======================================================
  // PREPARAR TOKEN Y PIN PARA LA PERSONA ACTUAL
  // ======================================================

  useEffect(
    () => {

      if (
        !currentMember ||
        finished
      ) {
        return;
      }


      let mounted =
        true;


      const prepareAccess =
        async () => {

          const existing =
            accessRecords[
              currentIndex
            ];


          if (
            existing?.qrToken &&
            existing?.pinReady
          ) {
            return;
          }


          try {

            setError('');
            setIsGeneratingPin(true);


            const qrToken =
              existing?.qrToken ||
              generateUniqueQRToken();


            const faceId =
              existing?.faceId ||
              generateFaceId();


            let pinResult =
              null;

            let attempts =
              0;


            while (
              attempts < 20
            ) {

              attempts += 1;

              const candidate =
                await generateUniquePin();

              const duplicatedInPair =
                accessRecords.some(
                  (
                    record,
                    index
                  ) =>
                    index !== currentIndex &&
                    record.pinHash &&
                    record.pinHash ===
                      candidate.pinHash
                );

              if (!duplicatedInPair) {
                pinResult =
                  candidate;
                break;
              }
            }


            if (!pinResult) {
              throw new Error(
                'No se pudo generar un PIN único para la pareja.'
              );
            }


            if (!mounted) {
              return;
            }


            setAccessRecords(
              previous =>
                previous.map(
                  (
                    record,
                    index
                  ) =>
                    index === currentIndex
                      ? {
                          ...record,
                          qrToken,
                          faceId,
                          pin: pinResult.pin,
                          pinHash: pinResult.pinHash,
                          pinReady: true
                        }
                      : record
                )
            );

          } catch (prepareError) {

            console.error(
              'Error preparando accesos de pareja:',
              prepareError
            );

            if (mounted) {
              setError(
                prepareError?.message ||
                'No se pudieron preparar los accesos.'
              );
            }

          } finally {

            if (mounted) {
              setIsGeneratingPin(false);
            }
          }

        };


      prepareAccess();


      return () => {
        mounted = false;
      };

    },
    [
      currentIndex,
      currentMember,
      finished
    ]
  );


  const handleGenerateQR = () => {

    if (
      !currentAccess?.qrToken
    ) {
      setError(
        'El token QR todavía no está listo.'
      );
      return;
    }


    setAccessRecords(
      previous =>
        previous.map(
          (
            record,
            index
          ) =>
            index === currentIndex
              ? {
                  ...record,
                  qrGenerated: true
                }
              : record
        )
    );

    setError('');

  };


  const handleFaceComplete = (
    data
  ) => {

    const existingMembers =
      getStoredMembers();


    const pairEmbeddings =
      accessRecords
        .filter(
          (
            record,
            index
          ) =>
            index !== currentIndex &&
            Array.isArray(
              record?.faceData?.embeddings
            )
        )
        .map(
          record => ({
            id: 'TEMP-PAIR',
            accessBlocked: false,
            access: {
              face: {
                enabled: true,
                embeddings:
                  record.faceData.embeddings
              }
            }
          })
        );


    const duplicate =
      findDuplicateFace(
        data.embeddings,
        [
          ...existingMembers,
          ...pairEmbeddings
        ],
        0.75
      );


    if (
      duplicate.duplicate
    ) {

      setShowFaceEnrollment(false);
      setError(
        'Este rostro ya parece estar registrado con otro miembro. Usa un rostro diferente.'
      );
      return;
    }


    setAccessRecords(
      previous =>
        previous.map(
          (
            record,
            index
          ) =>
            index === currentIndex
              ? {
                  ...record,
                  faceData: {
                    ...data,
                    faceId:
                      data.faceId ||
                      currentAccess?.faceId ||
                      generateFaceId()
                  }
                }
              : record
        )
    );

    setShowFaceEnrollment(false);
    setError('');

  };


  const handleCompleteCurrent = () => {

    if (
      !currentAccess?.pinReady ||
      !currentAccess?.pin ||
      !currentAccess?.pinHash
    ) {
      setError(
        'Espera a que el PIN esté listo.'
      );
      return;
    }


    if (
      !currentAccess?.qrGenerated
    ) {
      setError(
        'Genera el código QR de esta persona.'
      );
      return;
    }


    if (
      !currentAccess?.faceData?.enrolled ||
      !Array.isArray(
        currentAccess.faceData.embeddings
      )
    ) {
      setError(
        'Registra el rostro de esta persona antes de continuar.'
      );
      return;
    }


    setAccessRecords(
      previous =>
        previous.map(
          (
            record,
            index
          ) =>
            index === currentIndex
              ? {
                  ...record,
                  complete: true
                }
              : record
        )
    );


    setError('');


    if (
      currentIndex === 0
    ) {
      setCurrentIndex(1);
      return;
    }


    handleFinalizePair();

  };


  const handleFinalizePair = () => {

    const normalizedRecords =
      accessRecords.map(
        (
          record,
          index
        ) =>
          index === currentIndex
            ? {
                ...record,
                complete: true
              }
            : record
      );


    if (
      normalizedRecords.some(
        record =>
          !record.pinReady ||
          !record.qrGenerated ||
          !record.faceData?.enrolled
      )
    ) {
      setError(
        'Los accesos de las dos personas deben estar completos.'
      );
      return;
    }


    setIsSaving(true);
    setError('');


    try {

      const now =
        new Date()
          .toISOString();


      const finalMembers =
        members.map(
          (
            member,
            index
          ) => {

            const subscription =
              subscriptions.find(
                item =>
                  item.memberId ===
                  member.id
              );

            const access =
              normalizedRecords[
                index
              ];


            return {
              ...member,

              status:
                'active',

              accessBlocked:
                false,

              subscription: {
                ...subscription,
                status:
                  'active'
              },

              access: {
                qr: {
                  enabled: true,
                  configured: true,
                  token:
                    access.qrToken
                },

                pin: {
                  enabled: true,
                  configured: true,
                  pinHash:
                    access.pinHash
                },

                face: {
                  enabled: true,
                  enrolled: true,
                  faceId:
                    access.faceData.faceId,
                  embeddings:
                    access.faceData.embeddings,
                  samples:
                    access.faceData.samples,
                  enrolledAt:
                    access.faceData.enrolledAt ||
                    now
                }
              },

              registrationDate:
                member.registrationDate ||
                now,

              createdAt:
                member.createdAt ||
                now,

              updatedAt:
                now
            };

          }
        );


      finalMembers.forEach(
        saveMember
      );


      // ====================================================
      // PAGOS: UNO POR PERSONA
      // ====================================================
      //
      // Así Dashboard y Reportes suman correctamente:
      // $450 + $450 = $900.
      // Cada miembro conserva su propio pago.
      //
      // ====================================================

      const payments =
        readLocalArray(
          PAYMENTS_KEY
        );


      finalMembers.forEach(
        (
          member,
          index
        ) => {

          const subscription =
            member.subscription;


          const alreadyExists =
            payments.some(
              payment =>
                payment.memberId ===
                  member.id &&
                payment.type ===
                  'subscription_initial_couple' &&
                payment?.promotion?.groupId ===
                  coupleData.groupId
            );


          if (alreadyExists) {
            return;
          }


          const partner =
            finalMembers.find(
              item =>
                item.id !==
                member.id
            );


          payments.unshift({
            id:
              createLocalId(
                settings?.receiptPrefix ||
                'PAY'
              ),

            memberId:
              member.id,

            memberName:
              `${member.firstName || ''} ${member.lastName || ''}`.trim(),

            concept:
              'Suscripción inicial · Promoción de pareja',

            type:
              'subscription_initial_couple',

            source:
              'couple_registration',

            plan:
              subscription.plan,

            planLabel:
              subscription.planLabel,

            days:
              Number(
                subscription.days ||
                0
              ),

            period:
              `${subscription.startDate || '—'} - ${subscription.endDate || '—'}`,

            method:
              subscription.paymentMethod,

            paymentMethod:
              subscription.paymentMethod,

            amount:
              Number(
                subscription.amount ||
                0
              ).toFixed(2),

            originalAmount:
              Number(
                subscription.originalAmount ||
                subscription.amount ||
                0
              ).toFixed(2),

            discountAmount:
              Number(
                subscription.discountAmount ||
                0
              ).toFixed(2),

            promotion: {
              ...(subscription.promotion || {}),
              id: 'couple',
              label: 'Pareja',
              groupId:
                coupleData.groupId,
              partnerMemberId:
                partner?.id ||
                null,
              partnerName:
                partner
                  ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim()
                  : ''
            },

            receivedAmount:
              Number(
                subscription.amount ||
                0
              ).toFixed(2),

            change:
              '0.00',

            reference:
              paymentData?.reference ||
              '',

            notes:
              paymentData?.notes ||
              '',

            currency:
              paymentData?.currency ||
              settings?.currency ||
              'MXN',

            status:
              'completed',

            couplePayment: {
              groupId:
                coupleData.groupId,
              pairTotal:
                paymentData?.total ||
                '0.00',
              pairOriginalTotal:
                paymentData?.originalTotal ||
                '0.00',
              pairDiscountTotal:
                paymentData?.discountTotal ||
                '0.00',
              pairReceivedAmount:
                paymentData?.receivedAmount ||
                '0.00',
              pairChange:
                paymentData?.change ||
                '0.00',
              allocationIndex:
                index + 1,
              allocationCount:
                2
            },

            createdAt:
              now,

            date:
              now
          });

        }
      );


      saveLocalArray(
        PAYMENTS_KEY,
        payments
      );


      // ====================================================
      // HISTORIAL DE SUSCRIPCIÓN
      // ====================================================

      const history =
        readLocalArray(
          SUBSCRIPTION_HISTORY_KEY
        );


      finalMembers.forEach(
        member => {

          const alreadyExists =
            history.some(
              item =>
                item.memberId ===
                  member.id &&
                item.type ===
                  'initial_couple' &&
                item?.promotion?.groupId ===
                  coupleData.groupId
            );


          if (alreadyExists) {
            return;
          }


          history.unshift({
            id:
              createLocalId(
                'SUB'
              ),

            memberId:
              member.id,

            type:
              'initial_couple',

            action:
              'subscription_created',

            plan:
              member.subscription.plan,

            planLabel:
              member.subscription.planLabel,

            startDate:
              member.subscription.startDate,

            endDate:
              member.subscription.endDate,

            amount:
              member.subscription.amount,

            originalAmount:
              member.subscription.originalAmount,

            discountAmount:
              member.subscription.discountAmount,

            paymentMethod:
              member.subscription.paymentMethod,

            promotion:
              member.subscription.promotion,

            createdAt:
              now
          });

        }
      );


      saveLocalArray(
        SUBSCRIPTION_HISTORY_KEY,
        history
      );


      setAccessRecords(
        normalizedRecords
      );

      setFinished(true);

    } catch (saveError) {

      console.error(
        'Error finalizando promoción de pareja:',
        saveError
      );

      setError(
        saveError?.message ||
        'No se pudo finalizar el registro de la pareja.'
      );

    } finally {
      setIsSaving(false);
    }

  };


  // ======================================================
  // DESCARGAR CREDENCIAL DIGITAL DE LA PERSONA ACTUAL
  // ======================================================

  const handleDownloadCredential =
    async () => {

      if (
        !credentialRef.current ||
        !currentMember ||
        !currentAccess?.qrGenerated
      ) {
        setError(
          'Genera primero el QR para crear la credencial digital.'
        );
        return;
      }


      try {

        const html2canvasModule =
          await import(
            'html2canvas'
          );

        const html2canvas =
          html2canvasModule.default;


        const canvas =
          await html2canvas(
            credentialRef.current,
            {
              scale: 3,
              backgroundColor:
                null,
              useCORS:
                true,
              allowTaint:
                true
            }
          );


        const link =
          document.createElement(
            'a'
          );

        link.download =
          `Credencial-${currentMember.id}.png`;

        link.href =
          canvas.toDataURL(
            'image/png'
          );

        link.click();

        setError('');

      } catch (
        downloadError
      ) {

        console.error(
          'Error descargando credencial:',
          downloadError
        );

        setError(
          'No se pudo descargar la credencial digital.'
        );

      }

    };


  const copyPin = async () => {

    try {
      await navigator.clipboard.writeText(
        currentAccess?.pin ||
        ''
      );
    } catch (copyError) {
      console.error(
        'No se pudo copiar el PIN:',
        copyError
      );
    }

  };


  if (
    !coupleData ||
    members.length !== 2 ||
    subscriptions.length !== 2
  ) {

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111111] border border-red-500/20 rounded-2xl p-7 text-center">
          <AlertCircle
            size={36}
            className="text-red-400 mx-auto mb-3"
          />
          <h2 className="text-xl font-bold">
            Faltan datos de la pareja
          </h2>
          <p className="text-gray-400 text-sm mt-2 mb-5">
            Vuelve al registro y completa a las dos personas y su suscripción.
          </p>
          <button
            type="button"
            onClick={() => navigate('/members/register/couple')}
            className="px-5 py-2 rounded-xl bg-[#00ff88] text-black font-bold"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }


  if (finished) {

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <Sidebar activePage="Miembros" />
        <div className="flex-1 lg:ml-0">
          <Header />
          <main className="p-6 flex items-center justify-center min-h-[75vh]">
            <div className="max-w-2xl w-full bg-[#111111] border border-[#00ff88]/30 rounded-3xl p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2
                  size={42}
                  className="text-[#00ff88]"
                />
              </div>

              <h1 className="text-white text-2xl font-black">
                Pareja registrada correctamente
              </h1>

              <p className="text-gray-400 mt-2">
                Las dos personas quedaron activas, vinculadas a la misma promoción y cada una conserva su propia credencial digital.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4"
                  >
                    <p className="text-white font-semibold">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-[#00ff88] text-sm font-mono mt-1">
                      {member.id}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20">
                <p className="text-gray-500 text-xs uppercase tracking-wider">
                  Total cobrado por la pareja
                </p>
                <p className="text-[#00ff88] text-3xl font-black mt-1">
                  ${Number(paymentData?.total || 0).toFixed(2)} {paymentData?.currency || 'MXN'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
                <button
                  type="button"
                  onClick={() => navigate(`/members/${members[0].id}`)}
                  className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white"
                >
                  Ver persona 1
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/members')}
                  className="px-5 py-2.5 rounded-xl bg-[#00ff88] text-black font-black"
                >
                  Ir a miembros
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }


  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar activePage="Miembros" />

      <div className="flex-1 lg:ml-0">

        <Header />

        <main className="p-6 space-y-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
                  <HeartHandshake
                    size={25}
                    className="text-[#00ff88]"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">
                    Accesos de la pareja
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Configura QR, PIN, biometría y credencial digital de cada persona por separado.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Progreso
              </p>
              <p className="text-white font-bold">
                Persona {currentIndex + 1} de 2
              </p>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map((member, index) => {
              const record = accessRecords[index];
              const active = index === currentIndex;

              return (
                <div
                  key={member.id}
                  className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${active ? 'bg-[#00ff88]/5 border-[#00ff88]/30' : 'bg-[#111111] border-[#1a1a1a]'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                      {member.profilePhoto ? (
                        <img
                          src={member.profilePhoto}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={18} className="text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-gray-500 text-xs font-mono">
                        {member.id}
                      </p>
                    </div>
                  </div>

                  {record.complete ? (
                    <span className="flex items-center gap-1 text-[#00ff88] text-xs font-semibold">
                      <Check size={14} />
                      Listo
                    </span>
                  ) : active ? (
                    <span className="text-yellow-400 text-xs font-semibold">
                      Configurando
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">
                      Pendiente
                    </span>
                  )}
                </div>
              );
            })}
          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6">

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex items-center justify-center">
                {currentMember?.profilePhoto ? (
                  <img
                    src={currentMember.profilePhoto}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={28} className="text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">
                  Configurando accesos para
                </p>
                <h2 className="text-white text-xl font-black">
                  {fullName}
                </h2>
                <p className="text-[#00ff88] font-mono text-sm">
                  {currentMember?.id}
                </p>
              </div>
            </div>


            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
                <AlertCircle
                  size={18}
                  className="text-red-400 shrink-0 mt-0.5"
                />
                <p className="text-red-300 text-sm">
                  {error}
                </p>
              </div>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode size={19} className="text-[#00ff88]" />
                  <h3 className="text-white font-bold">Código QR</h3>
                </div>

                <div className="h-48 bg-white rounded-xl flex items-center justify-center p-3">
                  {currentAccess?.qrGenerated && qrValue ? (
                    <QRCodeSVG
                      value={qrValue}
                      size={170}
                      level="H"
                    />
                  ) : (
                    <div className="text-center text-black/50">
                      <QrCode size={44} className="mx-auto mb-2" />
                      <p className="text-xs">QR pendiente</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQR}
                  disabled={!currentAccess?.qrToken}
                  className="w-full mt-4 px-4 py-2 rounded-xl bg-[#00ff88] text-black font-bold disabled:opacity-50"
                >
                  {currentAccess?.qrGenerated ? 'QR generado' : 'Generar QR'}
                </button>
              </div>


              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound size={19} className="text-[#00ff88]" />
                  <h3 className="text-white font-bold">PIN</h3>
                </div>

                <div className="h-48 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] flex flex-col items-center justify-center">
                  {isGeneratingPin ? (
                    <>
                      <Loader2 size={30} className="text-[#00ff88] animate-spin mb-3" />
                      <p className="text-gray-400 text-sm">Generando PIN...</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
                        PIN personal
                      </p>
                      <p className="text-[#00ff88] text-4xl font-black tracking-[0.25em] mt-3 ml-[0.25em]">
                        {currentAccess?.pin || '------'}
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={copyPin}
                  disabled={!currentAccess?.pin}
                  className="w-full mt-4 px-4 py-2 rounded-xl bg-[#111111] border border-[#2a2a2a] text-white disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Copy size={15} />
                  Copiar PIN
                </button>
              </div>


              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ScanFace size={19} className="text-[#00ff88]" />
                  <h3 className="text-white font-bold">Biometría</h3>
                </div>

                <div className="h-48 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] flex flex-col items-center justify-center text-center p-4">
                  {currentAccess?.faceData?.enrolled ? (
                    <>
                      <CheckCircle2 size={42} className="text-[#00ff88] mb-3" />
                      <p className="text-white font-bold">Rostro registrado</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Identidad biométrica lista
                      </p>
                    </>
                  ) : (
                    <>
                      <ScanFace size={42} className="text-gray-600 mb-3" />
                      <p className="text-white font-bold">Rostro pendiente</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Se requiere para finalizar
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFaceEnrollment(true)}
                  className="w-full mt-4 px-4 py-2 rounded-xl bg-[#111111] border border-[#2a2a2a] text-white hover:border-[#00ff88] transition-colors"
                >
                  {currentAccess?.faceData?.enrolled ? 'Volver a registrar' : 'Registrar rostro'}
                </button>
              </div>

            </div>


            {/* ================================================= */}
            {/* CREDENCIAL DIGITAL INDIVIDUAL */}
            {/* ================================================= */}

            {currentAccess?.qrGenerated && qrValue && (

              <div className="mt-6 bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5">

                <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                  <div className="flex-1">

                    <div className="flex items-center justify-between gap-3 mb-4">

                      <div>
                        <p className="text-white font-bold">
                          Credencial digital de {fullName}
                        </p>

                        <p className="text-gray-500 text-xs mt-1">
                          Esta credencial pertenece únicamente a {currentMember?.id}.
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-[#00ff88]/10 text-[#00ff88] text-xs font-bold">
                        Lista
                      </span>

                    </div>


                    <div
                      ref={credentialRef}
                      className="max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl relative"
                      style={{
                        backgroundImage:
                          "url('/img/crede.png')",
                        backgroundSize:
                          'cover',
                        backgroundPosition:
                          'center',
                        backgroundRepeat:
                          'no-repeat'
                      }}
                    >

                      <div className="absolute inset-0 bg-black/40" />

                      <div className="relative z-10 p-6 flex flex-col items-center min-h-[380px] justify-center">

                        <div className="mb-4 text-center">

                          <p className="text-white font-bold text-xl tracking-wide drop-shadow-lg">
                            {settings?.shortName || 'GYM CONTROL'}
                          </p>

                          <p className="text-gray-300 text-[10px] tracking-wider drop-shadow-lg">
                            MEMBER ACCESS · PROMOCIÓN PAREJA
                          </p>

                        </div>


                        <div className="w-20 h-20 rounded-full border-2 border-[#00ff88] mx-auto mb-3 flex items-center justify-center overflow-hidden bg-[#1a1a1a]/80 backdrop-blur-sm">

                          {currentMember?.profilePhoto ? (

                            <img
                              src={currentMember.profilePhoto}
                              alt={fullName}
                              className="w-full h-full object-cover"
                            />

                          ) : (

                            <span className="text-white font-bold text-xl">
                              {fullName
                                .split(' ')
                                .filter(Boolean)
                                .map(name => name[0])
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
                          {currentMember?.id}
                        </p>


                        <div className="flex justify-center my-3">

                          <div className="bg-white rounded-lg p-2 inline-block shadow-lg">

                            <QRCodeSVG
                              value={qrValue}
                              size={80}
                              level="H"
                              includeMargin={false}
                              bgColor="#FFFFFF"
                              fgColor="#000000"
                            />

                          </div>

                        </div>


                        <div className="flex items-center justify-center gap-2 mt-1">

                          <span className="w-2 h-2 bg-[#00ff88] rounded-full" />

                          <span className="text-[#00ff88] text-sm font-bold drop-shadow-lg">
                            ACCESO HABILITADO
                          </span>

                        </div>


                        <p className="text-gray-300 text-xs mt-1 drop-shadow-lg text-center">
                          Suscripción válida hasta:{' '}
                          <span className="text-white">
                            {currentSubscription?.endDate || '—'}
                          </span>
                        </p>

                        <p className="text-gray-400 text-[10px] mt-2 drop-shadow-lg">
                          Código personal e intransferible
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={handleDownloadCredential}
                      className="w-full max-w-sm mx-auto mt-4 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:border-[#00ff88] transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={17} />
                      Descargar credencial de {currentIndex === 0 ? 'persona 1' : 'persona 2'}
                    </button>

                  </div>


                  <div className="lg:w-72 p-4 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20">

                    <p className="text-[#00ff88] text-xs font-bold uppercase tracking-wider">
                      Credencial independiente
                    </p>

                    <p className="text-gray-400 text-xs mt-2 leading-5">
                      Aunque ambos pertenecen a la misma promoción, cada persona conserva su propio ID, QR, PIN, rostro y credencial digital.
                    </p>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Miembro</span>
                        <span className="text-white font-mono">{currentMember?.id}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Pareja</span>
                        <span className="text-white">Vinculada</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">QR</span>
                        <span className="text-[#00ff88]">Único</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            )}


            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={22}
                  className="text-[#00ff88]"
                />
                <div>
                  <p className="text-white font-semibold">
                    {currentIndex === 0 ? 'Termina la persona 1' : 'Termina la persona 2'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    QR + PIN + rostro deben estar listos. La credencial se genera automáticamente con el QR.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteCurrent}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#00ff88] text-black font-black disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : currentIndex === 0 ? (
                  <ChevronRight size={18} />
                ) : (
                  <Check size={18} />
                )}

                {currentIndex === 0 ? 'Siguiente persona' : 'Finalizar pareja'}
              </button>
            </div>

          </div>

        </main>

      </div>


      {showFaceEnrollment && currentMember && (
        <FaceEnrollment
          memberId={currentMember.id}
          memberName={fullName}
          faceId={currentAccess?.faceId}
          onComplete={handleFaceComplete}
          onCancel={() => setShowFaceEnrollment(false)}
        />
      )}

    </div>

  );

};


export default RegisterCoupleQRPage;
