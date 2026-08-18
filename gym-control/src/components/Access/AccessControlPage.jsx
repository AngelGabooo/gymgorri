// src/components/Access/AccessControlPage.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  QrCode,
  ScanFace,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Shield,
  Camera,
  ArrowLeft,
  RefreshCw,
  Delete,
  LogIn,
  LogOut,
  Loader2,
  Scan,
  Users
} from 'lucide-react';

import QRScanner from './QRScanner';
import ErrorBoundary from './ErrorBoundary';

import {
  getMemberByQRToken,
  getStoredMembers,
  saveMember,
  hashValue,
  getCurrentGymContext
} from '../../utils/memberId';

import {
  getVisitByQRToken,
  getVisitByPinHash,
  getVisitsWithFace,
  getOpenVisitAttendance,
  registerVisitMovement
} from '../../utils/visitsStorage';

import {
  detectFace,
  initializeFaceEngine,
  bestSimilarityBetweenSets
} from '../../services/faceService';

import {
  addAccessLog,
  captureVideoEvidence,
  openTemporaryCamera
} from '../../utils/accessEvidence';

import {
  saveOfflineAttendance
} from '../../offline/repositories/attendanceRepository.js';


// ======================================================
// STORAGE
// ======================================================

const ATTENDANCE_KEY =
  'gym_control_attendance';


// ======================================================
// CONFIGURACIÓN FACIAL
// ======================================================

const FACE_SCAN_DELAY =
  650;

const FACE_THRESHOLD =
  0.60;

const FACE_CONFIRMATIONS_REQUIRED =
  2;


// ======================================================
// MESES EN ESPAÑOL
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
    parts.length !== 3
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
    day,
    23,
    59,
    59,
    999
  );

};


// ======================================================
// LEER ARRAY LOCAL
// ======================================================

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


// ======================================================
// GUARDAR ARRAY LOCAL
// ======================================================

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


  // Las demás pantallas pueden escuchar
  // este evento para actualizarse.
  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );

};


// ======================================================
// ID ÚNICO
// ======================================================

const createAccessId =
  () => {

    if (
      window.crypto?.randomUUID
    ) {

      return `ATT-${window.crypto.randomUUID()}`;

    }


    return (
      `ATT-${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(2)
    );

  };


// ======================================================
// NOMBRE COMPLETO
// ======================================================

const getFullName = (
  member
) => {

  return (
    `${member?.firstName || ''} ${member?.lastName || ''}`
      .trim() ||
    'Miembro'
  );

};


// ======================================================
// ESTADO DE SUSCRIPCIÓN
// ======================================================

const getSubscriptionState = (
  member
) => {

  // ====================================================
  // BAJA
  // ====================================================

  if (
    member?.status ===
    'inactive'
  ) {

    return {

      allowed:
        false,

      status:
        'inactive',

      message:
        'El miembro se encuentra dado de baja.',

      daysRemaining:
        0

    };

  }


  // ====================================================
  // BLOQUEADO
  // ====================================================

  if (
    member?.accessBlocked ===
    true
  ) {

    return {

      allowed:
        false,

      status:
        'blocked',

      message:
        member?.blockReason
          ? `Acceso bloqueado: ${member.blockReason}`
          : 'El acceso del miembro está bloqueado.',

      daysRemaining:
        0

    };

  }


  // ====================================================
  // SIN SUSCRIPCIÓN
  // ====================================================

  const subscription =
    member?.subscription;


  if (
    !subscription
  ) {

    return {

      allowed:
        false,

      status:
        'expired',

      message:
        'El miembro no tiene una suscripción activa.',

      daysRemaining:
        0

    };

  }


  if (
    subscription.status !==
    'active'
  ) {

    return {

      allowed:
        false,

      status:
        'expired',

      message:
        'La suscripción no se encuentra activa.',

      daysRemaining:
        0

    };

  }


  // ====================================================
  // FECHA
  // ====================================================

  const endDate =
    parseGymDate(
      subscription.endDate
    );


  if (!endDate) {

    // Si existe status active pero por alguna razón
    // no podemos leer la fecha, mantenemos acceso.
    return {

      allowed:
        true,

      status:
        'active',

      message:
        'Suscripción activa.',

      daysRemaining:
        null

    };

  }


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  endDate.setHours(
    23,
    59,
    59,
    999
  );


  const daysRemaining =
    Math.ceil(
      (
        endDate.getTime() -
        today.getTime()
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    );


  if (
    daysRemaining < 0
  ) {

    return {

      allowed:
        false,

      status:
        'expired',

      message:
        'La suscripción está vencida.',

      daysRemaining:
        0

    };

  }


  if (
    daysRemaining <= 5
  ) {

    return {

      allowed:
        true,

      status:
        'warning',

      message:
        `La suscripción vence en ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}.`,

      daysRemaining

    };

  }


  return {

    allowed:
      true,

    status:
      'active',

    message:
      'Suscripción activa.',

    daysRemaining

  };

};


// ======================================================
// ESTADO DE VISITA TEMPORAL
// ======================================================

const getVisitAccessState = (visit) => {
  if (!visit) {
    return { allowed: false, status: 'invalid', message: 'La visita no existe.' };
  }

  if (visit.accessBlocked === true || visit.blocked === true || visit.status === 'blocked') {
    return {
      allowed: false,
      status: 'blocked',
      message: visit.blockReason || 'La visita se encuentra bloqueada.'
    };
  }

  const endValue =
    visit.endDate ||
    visit.validUntil ||
    visit.expiryDate ||
    visit.expiresAt ||
    visit.visitEndDate;

  if (endValue) {
    const expiration = parseGymDate(endValue);

    if (expiration) {
      expiration.setHours(23, 59, 59, 999);

      if (expiration.getTime() < Date.now()) {
        return {
          allowed: false,
          status: 'expired',
          message: 'La vigencia de esta visita ha finalizado.'
        };
      }
    }
  }

  return { allowed: true, status: 'active', message: 'Visita vigente.' };
};


// ======================================================
// COMPONENTE
// ======================================================

const AccessControlPage = () => {

  const navigate =
    useNavigate();


  // ======================================================
  // GENERAL
  // ======================================================

  const [
    currentTime,
    setCurrentTime
  ] = useState(
    new Date()
  );


  const [
    accessMode,
    setAccessMode
  ] = useState(
    'qr'
  );


  const [
    scanStatus,
    setScanStatus
  ] = useState(
    'waiting'
  );


  const [
    memberData,
    setMemberData
  ] = useState(
    null
  );


  const [
    accessMessage,
    setAccessMessage
  ] = useState('');


  const [
    isEntry,
    setIsEntry
  ] = useState(
    true
  );


  const [
    countdown,
    setCountdown
  ] = useState(
    0
  );


  const [
    isProcessing,
    setIsProcessing
  ] = useState(
    false
  );


  const [
    lastMethod,
    setLastMethod
  ] = useState(
    null
  );


  // ======================================================
  // QR
  // ======================================================

  const [
    facingMode,
    setFacingMode
  ] = useState(
    'environment'
  );


  const [
    cameraError,
    setCameraError
  ] = useState(
    false
  );


  const [
    isCameraReady,
    setIsCameraReady
  ] = useState(
    false
  );


  const [
    scannerLine,
    setScannerLine
  ] = useState(
    0
  );


  const scannerKeyRef =
    useRef(0);


  const lastQRRef =
    useRef({
      value:
        null,

      time:
        0
    });


  // ======================================================
  // PIN
  // ======================================================

  const [
    pin,
    setPin
  ] = useState('');


  const [
    pinError,
    setPinError
  ] = useState('');


  // ======================================================
  // BIOMETRÍA
  // ======================================================

  const faceVideoRef =
    useRef(null);


  const faceStreamRef =
    useRef(null);


  const faceTimerRef =
    useRef(null);


  const faceProcessingRef =
    useRef(false);


  const faceActiveRef =
    useRef(false);


  const faceLastMatchRef =
    useRef({
      memberId:
        null,

      confirmations:
        0
    });


  const [
    faceLoading,
    setFaceLoading
  ] = useState(false);


  const [
    faceReady,
    setFaceReady
  ] = useState(false);


  const [
    faceInstruction,
    setFaceInstruction
  ] = useState(
    'Preparando reconocimiento facial...'
  );


  const [
    faceDetected,
    setFaceDetected
  ] = useState(false);


  const [
    faceSimilarity,
    setFaceSimilarity
  ] = useState(
    null
  );


  // ======================================================
  // HORA
  // ======================================================

  useEffect(
    () => {

      const timer =
        setInterval(
          () => {

            setCurrentTime(
              new Date()
            );

          },
          1000
        );


      return () =>
        clearInterval(
          timer
        );

    },
    []
  );


  // ======================================================
  // ANIMACIÓN QR
  // ======================================================

  useEffect(
    () => {

      if (
        accessMode !==
        'qr'
      ) {

        return;

      }


      if (
        scanStatus !==
          'waiting' &&
        scanStatus !==
          'scanning'
      ) {

        return;

      }


      const timer =
        setInterval(
          () => {

            setScannerLine(
              previous =>
                (
                  previous +
                  2
                ) %
                100
            );

          },
          50
        );


      return () =>
        clearInterval(
          timer
        );

    },
    [
      accessMode,
      scanStatus
    ]
  );


  // ======================================================
  // BUSCAR ASISTENCIA ABIERTA
  // ======================================================

  const getOpenAttendance = (
    memberId
  ) => {

    const attendance =
      readLocalArray(
        ATTENDANCE_KEY
      );


    return (
      attendance.find(
        record =>
          record.memberId ===
            memberId &&
          record.status ===
            'inside' &&
          !record.exitAt
      ) ||
      null
    );

  };


  // ======================================================
  // REGISTRAR ENTRADA / SALIDA
  // ======================================================

  const registerMovement = (
    member,
    method,
    evidence = null
  ) => {

    const attendance =
      readLocalArray(
        ATTENDANCE_KEY
      );


    const now =
      new Date()
        .toISOString();


    const {
      gymId,
      gymCode,
      gymName
    } =
      getCurrentGymContext();


    // ====================================================
    // BUSCAR ASISTENCIA ABIERTA DEL GIMNASIO ACTUAL
    // ====================================================
    //
    // Los IDs de miembro pueden repetirse entre gimnasios.
    // Por eso, si el registro ya contiene gymId, exigimos
    // que coincida con la sesión actual.
    //
    // Los registros legacy sin gymId se aceptan únicamente
    // como compatibilidad durante esta migración.
    //
    // ====================================================

    const openRecord =
      attendance.find(
        record =>
          record.memberId ===
            member.id &&
          (
            !gymId ||
            !record.gymId ||
            record.gymId ===
              gymId
          ) &&
          record.status ===
            'inside' &&
          !record.exitAt
      );


    // ====================================================
    // SALIDA
    // ====================================================

    if (
      openRecord
    ) {

      const entryDate =
        new Date(
          openRecord.entryAt
        );


      const durationMinutes =
        Number.isNaN(
          entryDate.getTime()
        )
          ? 0
          : Math.max(
              0,
              Math.round(
                (
                  new Date(
                    now
                  ).getTime() -
                  entryDate.getTime()
                ) /
                60000
              )
            );


      let completedRecord =
        null;


      const updatedAttendance =
        attendance.map(
          record => {

            if (
              record.id !==
              openRecord.id
            ) {

              return record;

            }


            completedRecord = {

              ...record,

              gymId:
                gymId ||
                record.gymId ||
                member.gymId ||
                null,

              gymCode:
                gymCode ||
                record.gymCode ||
                member.gymCode ||
                null,

              gymName:
                gymName ||
                record.gymName ||
                member.gymName ||
                null,

              personType:
                'member',

              exitAt:
                now,

              exitMethod:
                method,

              exitEvidence:
                evidence ||
                record.exitEvidence ||
                null,

              status:
                'completed',

              durationMinutes,

              updatedAt:
                now

            };


            return completedRecord;

          }
        );


      saveLocalArray(
        ATTENDANCE_KEY,
        updatedAttendance
      );


      // ==================================================
      // INDEXEDDB + SYNCQUEUE
      // ==================================================
      //
      // No bloqueamos la interfaz esperando IndexedDB.
      //
      // ==================================================

      if (
        completedRecord?.gymId
      ) {

        void saveOfflineAttendance(
          completedRecord
        )
          .then(
            offlineRecord => {

              console.log(
                '✅ Salida respaldada offline:',
                {
                  gymId:
                    offlineRecord.gymId,

                  attendanceId:
                    offlineRecord.id,

                  syncStatus:
                    offlineRecord.syncStatus
                }
              );

            }
          )
          .catch(
            error => {

              console.error(
                '❌ No se pudo respaldar la salida en IndexedDB:',
                error
              );

            }
          );

      }


      saveMember({

        ...member,

        isInside:
          false,

        lastAccessAt:
          now,

        lastVisit:
          now,

        updatedAt:
          now

      });


      window.dispatchEvent(
        new Event(
          'gym-storage-update'
        )
      );


      return {

        type:
          'exit',

        attendanceId:
          openRecord.id,

        time:
          now,

        durationMinutes

      };

    }


    // ====================================================
    // ENTRADA
    // ====================================================

    const attendanceRecord = {

      id:
        createAccessId(),

      gymId:
        gymId ||
        member.gymId ||
        null,

      gymCode:
        gymCode ||
        member.gymCode ||
        null,

      gymName:
        gymName ||
        member.gymName ||
        null,

      personType:
        'member',

      memberId:
        member.id,

      memberName:
        getFullName(
          member
        ),

      profilePhoto:
        member.profilePhoto ||
        null,

      method,

      entryMethod:
        method,

      entryEvidence:
        evidence ||
        null,

      entryAt:
        now,

      exitAt:
        null,

      exitMethod:
        null,

      status:
        'inside',

      durationMinutes:
        0,

      createdAt:
        now,

      updatedAt:
        now

    };


    attendance.unshift(
      attendanceRecord
    );


    saveLocalArray(
      ATTENDANCE_KEY,
      attendance
    );


    // ====================================================
    // INDEXEDDB + SYNCQUEUE
    // ====================================================

    if (
      attendanceRecord.gymId
    ) {

      void saveOfflineAttendance(
        attendanceRecord
      )
        .then(
          offlineRecord => {

            console.log(
              '✅ Entrada respaldada offline:',
              {
                gymId:
                  offlineRecord.gymId,

                attendanceId:
                  offlineRecord.id,

                syncStatus:
                  offlineRecord.syncStatus
              }
            );

          }
        )
        .catch(
          error => {

            console.error(
              '❌ No se pudo respaldar la entrada en IndexedDB:',
              error
            );

          }
        );

    }


    saveMember({

      ...member,

      isInside:
        true,

      lastAccessAt:
        now,

      lastVisit:
        now,

      updatedAt:
        now

    });


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    return {

      type:
        'entry',

      attendanceId:
        attendanceRecord.id,

      time:
        now,

      durationMinutes:
        0

    };

  };

  // ======================================================
  // PROCESAR VISITA AUTENTICADA
  // ======================================================

  const processAuthenticatedVisit =
    useCallback(
      (visit, method) => {
        if (!visit) {
          setMemberData(null);
          setScanStatus('unrecognized');
          setAccessMessage('No se encontró ninguna visita asociada.');
          setCountdown(4);
          return;
        }

        const fullName =
          `${visit?.firstName || ''} ${visit?.lastName || ''}`.trim() ||
          visit?.name ||
          'Visita';

        const visitState = getVisitAccessState(visit);
        const currentlyInside = Boolean(getOpenVisitAttendance(visit.id));
        const entering = !currentlyInside;
        const now = new Date();

        setMemberData({
          ...visit,
          name: fullName,
          recordType: 'visit',
          isVisit: true,
          accessState: visitState.status,
          daysRemaining: null,
          expiryDate:
            visit.endDate ||
            visit.validUntil ||
            visit.expiryDate ||
            visit.expiresAt ||
            'Visita temporal',
          accessTime: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        });

        setLastMethod(method);
        setIsEntry(entering);

        const movementAllowed = !entering || visitState.allowed;

        if (!movementAllowed) {
          setScanStatus('error');
          setAccessMessage(visitState.message);
          setCountdown(5);
          return;
        }

        try {
          const movement = registerVisitMovement({ visit, method });
          const actualIsEntry = movement.type === 'entry';

          setIsEntry(actualIsEntry);
          setScanStatus('success');
          setAccessMessage(
            actualIsEntry
              ? 'Entrada de visita registrada correctamente.'
              : 'Salida de visita registrada correctamente.'
          );
          setCountdown(5);
        } catch (error) {
          console.error('❌ Error registrando visita:', error);
          setScanStatus('error');
          setAccessMessage('No fue posible registrar el movimiento de la visita.');
          setCountdown(5);
        }
      },
      []
    );


  // ======================================================
  // EVIDENCIA TEMPORAL / ANTI-PRÉSTAMO
  // ======================================================

  const captureTemporaryMemberEvidence =
    useCallback(
      async (
        member,
        verifyIdentity = false
      ) => {

        let camera =
          null;


        try {

          camera =
            await openTemporaryCamera({
              facingMode:
                'user',

              idealWidth:
                640,

              idealHeight:
                480
            });


          const photo =
            captureVideoEvidence(
              camera.video
            );


          if (
            !verifyIdentity
          ) {

            return {
              capturedAt:
                new Date()
                  .toISOString(),

              photo,

              faceVerified:
                null,

              similarity:
                null
            };

          }


          const storedEmbeddings =
            member
              ?.access
              ?.face
              ?.embeddings;


          if (
            member?.access?.face?.enabled !==
              true ||
            member?.access?.face?.enrolled !==
              true ||
            !Array.isArray(
              storedEmbeddings
            ) ||
            storedEmbeddings.length ===
              0
          ) {

            return {
              capturedAt:
                new Date()
                  .toISOString(),

              photo,

              faceVerified:
                false,

              similarity:
                0,

              reason:
                'FACE_NOT_CONFIGURED'
            };

          }


          await initializeFaceEngine();


          let bestSimilarity =
            0;

          let successfulDetection =
            null;


          // Hacemos hasta 2 lecturas para evitar rechazos
          // por un cuadro borroso.
          for (
            let attempt = 0;
            attempt < 2;
            attempt += 1
          ) {

            const detection =
              await detectFace(
                camera.video
              );


            if (
              detection.success &&
              Array.isArray(
                detection.embedding
              )
            ) {

              successfulDetection =
                detection;


              const similarity =
                bestSimilarityBetweenSets(
                  [
                    Array.from(
                      detection.embedding
                    )
                  ],
                  storedEmbeddings
                );


              bestSimilarity =
                Math.max(
                  bestSimilarity,
                  similarity
                );

            }


            if (
              bestSimilarity >=
              FACE_THRESHOLD
            ) {

              break;

            }


            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  300
                )
            );

          }


          return {
            capturedAt:
              new Date()
                .toISOString(),

            photo:
              captureVideoEvidence(
                camera.video
              ) ||
              photo,

            faceVerified:
              Boolean(
                successfulDetection &&
                bestSimilarity >=
                  FACE_THRESHOLD
              ),

            similarity:
              bestSimilarity,

            reason:
              successfulDetection
                ? (
                    bestSimilarity >=
                      FACE_THRESHOLD
                      ? null
                      : 'FACE_MISMATCH'
                  )
                : 'NO_FACE'
          };

        } catch (
          error
        ) {

          console.error(
            'Error capturando evidencia temporal:',
            error
          );


          return {
            capturedAt:
              new Date()
                .toISOString(),

            photo:
              null,

            faceVerified:
              verifyIdentity
                ? false
                : null,

            similarity:
              0,

            reason:
              'CAMERA_ERROR',

            errorMessage:
              error?.message ||
              'No se pudo iniciar la cámara.'
          };

        } finally {

          camera?.stop?.();

        }

      },
      []
    );


  // ======================================================
  // PROCESAR MIEMBRO AUTENTICADO
  // ======================================================

  const processAuthenticatedMember =
    useCallback(
      async (
        member,
        method,
        evidence = null
      ) => {

        if (
          !member
        ) {

          setMemberData(
            null
          );


          setScanStatus(
            'unrecognized'
          );


          setAccessMessage(
            'No se encontró ningún miembro asociado.'
          );


          setCountdown(
            4
          );


          return;

        }


        const fullName =
          getFullName(
            member
          );


        const subscriptionState =
          getSubscriptionState(
            member
          );


        const currentlyInside =
          Boolean(
            getOpenAttendance(
              member.id
            )
          );


        // Una persona dentro va a realizar
        // SALIDA, no una nueva entrada.
        const entering =
          !currentlyInside;


        const now =
          new Date();


        setMemberData({

          ...member,

          name:
            fullName,

          accessState:
            subscriptionState.status,

          daysRemaining:
            subscriptionState.daysRemaining,

          expiryDate:
            member?.subscription?.endDate ||
            'No disponible',

          accessTime:
            now.toLocaleTimeString(
              'es-MX',
              {
                hour:
                  '2-digit',

                minute:
                  '2-digit'
              }
            )

        });


        setLastMethod(
          method
        );


        setIsEntry(
          entering
        );


        // ==================================================
        // PARA SALIR NO BLOQUEAMOS POR SUSCRIPCIÓN VENCIDA
        // ==================================================
        //
        // Si una persona ya estaba dentro y por alguna
        // razón su suscripción cambió, debemos permitir
        // registrar su salida.
        //
        // ==================================================

        const movementAllowed =
          !entering ||
          subscriptionState.allowed;


        if (
          !movementAllowed
        ) {

          setScanStatus(
            'error'
          );


          setAccessMessage(
            subscriptionState.message
          );


          setCountdown(
            5
          );


          return;

        }


        try {

          const movement =
            registerMovement(
              member,
              method,
              evidence
            );


          const actualIsEntry =
            movement.type ===
            'entry';


          setIsEntry(
            actualIsEntry
          );


          if (
            actualIsEntry &&
            subscriptionState.status ===
              'warning'
          ) {

            setScanStatus(
              'warning'
            );


            setAccessMessage(
              subscriptionState.message
            );

          } else {

            setScanStatus(
              'success'
            );


            setAccessMessage(
              actualIsEntry
                ? 'Entrada registrada correctamente.'
                : 'Salida registrada correctamente.'
            );

          }


          console.log(
            '✅ ACCESO REGISTRADO:',
            {
              member:
                member.id,

              method,

              movement:
                movement.type
            }
          );


          addAccessLog({
            memberId:
              member.id,

            memberName:
              fullName,

            method,

            movement:
              movement.type,

            result:
              'allowed',

            evidence:
              evidence ||
              null,

            attendanceId:
              movement.attendanceId
          });


          setCountdown(
            5
          );

        } catch (
          error
        ) {

          console.error(
            '❌ Error registrando movimiento:',
            error
          );


          setScanStatus(
            'error'
          );


          setAccessMessage(
            'No fue posible registrar el movimiento.'
          );


          setCountdown(
            5
          );

        }

      },
      []
    );


  // ======================================================
  // QR
  // ======================================================

  const processQRData =
    useCallback(
      async (rawData) => {
        try {
          let decoded;

          try {
            decoded = JSON.parse(rawData);
          } catch {
            setMemberData(null);
            setScanStatus('unrecognized');
            setAccessMessage('El código QR no tiene un formato válido.');
            setCountdown(4);
            return;
          }

          const token = decoded?.token;
          const personId = decoded?.memberId || decoded?.visitId || decoded?.id;

          if (!personId || !token) {
            setMemberData(null);
            setScanStatus('unrecognized');
            setAccessMessage('Este código QR no pertenece a GYM CONTROL.');
            setCountdown(4);
            return;
          }

          const member = getMemberByQRToken(personId, token);

          if (member) {

            setMemberData({
              ...member,
              name:
                getFullName(
                  member
                )
            });

            setScanStatus(
              'scanning'
            );

            setAccessMessage(
              'QR válido. Verificando que el rostro coincida con el titular...'
            );


            const evidence =
              await captureTemporaryMemberEvidence(
                member,
                true
              );


            if (
              evidence.faceVerified !==
              true
            ) {

              const similarity =
                Number(
                  evidence.similarity ||
                  0
                );


              setScanStatus(
                'error'
              );

              setAccessMessage(
                evidence.reason ===
                  'FACE_NOT_CONFIGURED'
                  ? 'El QR es válido, pero este miembro no tiene reconocimiento facial habilitado.'
                  : evidence.reason ===
                      'CAMERA_ERROR'
                    ? 'No fue posible verificar el rostro. El acceso por QR fue bloqueado por seguridad.'
                    : `Identidad no coincide con el titular del QR${similarity > 0 ? ` · ${Math.round(similarity * 100)}%` : ''}.`
              );


              addAccessLog({
                memberId:
                  member.id,

                memberName:
                  getFullName(
                    member
                  ),

                method:
                  'qr',

                movement:
                  'attempt',

                result:
                  'denied',

                reason:
                  evidence.reason ||
                  'FACE_MISMATCH',

                evidence
              });


              setCountdown(
                6
              );

              return;

            }


            await processAuthenticatedMember(
              member,
              'qr',
              evidence
            );

            return;
          }

          const visit = getVisitByQRToken(personId, token);

          if (visit) {
            processAuthenticatedVisit(visit, 'qr');
            return;
          }

          setMemberData(null);
          setScanStatus('unrecognized');
          setAccessMessage('El código QR no pertenece a ningún miembro o visita registrada.');
          setCountdown(4);
        } catch (error) {
          console.error('Error procesando QR:', error);
          setScanStatus('unrecognized');
          setAccessMessage('No se pudo validar el código.');
          setCountdown(4);
        }
      },
      [
        captureTemporaryMemberEvidence,
        processAuthenticatedMember,
        processAuthenticatedVisit
      ]
    );

  const handleQRScan =
    useCallback(
      (
        data
      ) => {

        if (
          !data ||
          isProcessing ||
          scanStatus !==
            'waiting'
        ) {

          return;

        }


        const now =
          Date.now();


        if (
          lastQRRef.current.value ===
            data &&
          now -
            lastQRRef.current.time <
            3000
        ) {

          return;

        }


        lastQRRef.current = {

          value:
            data,

          time:
            now

        };


        setIsProcessing(
          true
        );


        setScanStatus(
          'scanning'
        );


        setTimeout(
          () => {

            processQRData(
              data
            );


            setIsProcessing(
              false
            );

          },
          350
        );

      },
      [
        isProcessing,
        processQRData,
        scanStatus
      ]
    );


  // ======================================================
  // PIN
  // ======================================================

  const handlePinNumber = (
    number
  ) => {

    if (
      scanStatus !==
      'waiting'
    ) {

      return;

    }


    setPinError('');


    setPin(
      previous => {

        if (
          previous.length >=
          6
        ) {

          return previous;

        }


        return (
          previous +
          number
        );

      }
    );

  };


  const handlePinDelete =
    () => {

      setPin(
        previous =>
          previous.slice(
            0,
            -1
          )
      );


      setPinError('');

    };


  const handlePinClear =
    () => {

      setPin('');

      setPinError('');

    };


  const handlePinSubmit = async () => {
    if (isProcessing) return;

    if (pin.length !== 6) {
      setPinError('El PIN debe contener 6 dígitos.');
      return;
    }

    setIsProcessing(true);
    setScanStatus('scanning');

    try {
      const enteredHash = await hashValue(pin);
      const members = getStoredMembers();

      const member = members.find(
        item =>
          item?.access?.pin?.enabled === true &&
          item?.access?.pin?.configured === true &&
          item?.access?.pin?.pinHash === enteredHash
      );

      if (member) {
        setPin('');

        setAccessMessage(
          'PIN válido. Capturando evidencia de acceso...'
        );

        const evidence =
          await captureTemporaryMemberEvidence(
            member,
            false
          );

        await processAuthenticatedMember(
          member,
          'pin',
          evidence
        );

        return;
      }

      const visit = getVisitByPinHash(enteredHash);

      if (visit) {
        setPin('');
        processAuthenticatedVisit(visit, 'pin');
        return;
      }

      setPinError('PIN no reconocido.');
      setMemberData(null);
      setScanStatus('unrecognized');
      setAccessMessage('El PIN no pertenece a ningún miembro o visita registrada.');
      setPin('');
      setCountdown(4);
    } catch (error) {
      console.error('Error validando PIN:', error);
      setScanStatus('error');
      setAccessMessage('No fue posible validar el PIN.');
      setCountdown(4);
    } finally {
      setIsProcessing(false);
    }
  };

  // ======================================================
  // DETENER CÁMARA FACIAL
  // ======================================================

  const stopFaceCamera =
    useCallback(
      () => {

        faceActiveRef.current =
          false;


        if (
          faceTimerRef.current
        ) {

          clearTimeout(
            faceTimerRef.current
          );


          faceTimerRef.current =
            null;

        }


        if (
          faceStreamRef.current
        ) {

          faceStreamRef.current
            .getTracks()
            .forEach(
              track =>
                track.stop()
            );


          faceStreamRef.current =
            null;

        }


        if (
          faceVideoRef.current
        ) {

          faceVideoRef.current.srcObject =
            null;

        }


        faceProcessingRef.current =
          false;


        setFaceReady(
          false
        );

      },
      []
    );


  // ======================================================
  // BUSCAR MEJOR ROSTRO
  // ======================================================

  const findFacePerson = (embedding) => {
    const candidates = [];

    getStoredMembers().forEach(member => {
      const stored = member?.access?.face?.embeddings;
      if (
        member?.access?.face?.enabled === true &&
        member?.access?.face?.enrolled === true &&
        Array.isArray(stored) &&
        stored.length > 0
      ) {
        candidates.push({ type: 'member', person: member, embeddings: stored });
      }
    });

    getVisitsWithFace().forEach(visit => {
      candidates.push({
        type: 'visit',
        person: visit,
        embeddings: visit.access.face.embeddings
      });
    });

    let bestPerson = null;
    let bestType = null;
    let bestSimilarity = 0;

    candidates.forEach(candidate => {
      const similarity = bestSimilarityBetweenSets(
        [Array.from(embedding)],
        candidate.embeddings
      );

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestPerson = candidate.person;
        bestType = candidate.type;
      }
    });

    return {
      person: bestSimilarity >= FACE_THRESHOLD ? bestPerson : null,
      type: bestSimilarity >= FACE_THRESHOLD ? bestType : null,
      bestPerson,
      bestType,
      similarity: bestSimilarity
    };
  };

  // ======================================================
  // LOOP FACIAL
  // ======================================================

  const runFaceLoop =
    useCallback(
      async () => {

        if (
          !faceActiveRef.current ||
          accessMode !==
            'face'
        ) {

          return;

        }


        if (
          scanStatus !==
            'waiting'
        ) {

          faceTimerRef.current =
            setTimeout(
              runFaceLoop,
              FACE_SCAN_DELAY
            );


          return;

        }


        if (
          faceProcessingRef.current
        ) {

          faceTimerRef.current =
            setTimeout(
              runFaceLoop,
              FACE_SCAN_DELAY
            );


          return;

        }


        const video =
          faceVideoRef.current;


        if (
          !video ||
          video.readyState <
            2 ||
          video.videoWidth ===
            0
        ) {

          setFaceInstruction(
            'Esperando imagen de la cámara...'
          );


          faceTimerRef.current =
            setTimeout(
              runFaceLoop,
              FACE_SCAN_DELAY
            );


          return;

        }


        faceProcessingRef.current =
          true;


        try {

          const detection =
            await detectFace(
              video
            );


          if (
            !faceActiveRef.current
          ) {

            return;

          }


          if (
            !detection.success
          ) {

            setFaceDetected(
              false
            );


            setFaceSimilarity(
              null
            );


            faceLastMatchRef.current = {
              memberId:
                null,

              confirmations:
                0
            };


            if (
              detection.reason ===
              'MULTIPLE_FACES'
            ) {

              setFaceInstruction(
                'Solo debe aparecer una persona frente a la cámara.'
              );

            } else {

              setFaceInstruction(
                'Coloca tu rostro frente a la cámara.'
              );

            }


            return;

          }


          const embedding =
            detection.embedding ||
            detection.descriptor;


          if (
            !embedding ||
            embedding.length ===
              0
          ) {

            setFaceInstruction(
              'Mantente frente a la cámara...'
            );


            return;

          }


          setFaceDetected(
            true
          );


          const match =
            findFacePerson(
              Array.from(
                embedding
              )
            );


          setFaceSimilarity(
            match.similarity
          );


          if (
            !match.person
          ) {

            faceLastMatchRef.current = {
              memberId:
                null,

              confirmations:
                0
            };


            if (
              match.similarity >
              0
            ) {

              setFaceInstruction(
                `Rostro no reconocido · ${Math.round(match.similarity * 100)}%`
              );

            } else {

              setFaceInstruction(
                'Rostro no registrado.'
              );

            }


            return;

          }


          const person =
            match.person;

          const personType =
            match.type;


          // ==================================================
          // DOBLE CONFIRMACIÓN
          // ==================================================

          if (
            faceLastMatchRef.current.memberId ===
            person.id
          ) {

            faceLastMatchRef.current.confirmations +=
              1;

          } else {

            faceLastMatchRef.current = {

              memberId:
                person.id,

              confirmations:
                1

            };

          }


          const confirmations =
            faceLastMatchRef.current.confirmations;


          if (
            confirmations <
            FACE_CONFIRMATIONS_REQUIRED
          ) {

            setFaceInstruction(
              `Hola ${person.firstName || ''}, mantente quieto...`
            );


            return;

          }


          // Evitar más lecturas mientras
          // procesamos a la persona.
          faceLastMatchRef.current = {

            memberId:
              null,

            confirmations:
              0

          };


          setFaceInstruction(
            'Identidad confirmada.'
          );


          if (personType === 'visit') {

            processAuthenticatedVisit(
              person,
              'face'
            );

          } else {

            const evidence = {
              capturedAt:
                new Date()
                  .toISOString(),

              photo:
                captureVideoEvidence(
                  video
                ),

              faceVerified:
                true,

              similarity:
                match.similarity,

              reason:
                null
            };


            await processAuthenticatedMember(
              person,
              'face',
              evidence
            );

          }

        } catch (
          error
        ) {

          console.error(
            'Error reconocimiento facial:',
            error
          );


          setFaceInstruction(
            'No se pudo analizar el rostro.'
          );

        } finally {

          faceProcessingRef.current =
            false;


          if (
            faceActiveRef.current
          ) {

            faceTimerRef.current =
              setTimeout(
                runFaceLoop,
                FACE_SCAN_DELAY
              );

          }

        }

      },
      [
        accessMode,
        processAuthenticatedMember,
        processAuthenticatedVisit,
        scanStatus
      ]
    );


  // ======================================================
  // INICIAR BIOMETRÍA
  // ======================================================

  useEffect(
    () => {

      if (
        accessMode !==
        'face'
      ) {

        stopFaceCamera();

        return;

      }


      let cancelled =
        false;


      const start =
        async () => {

          try {

            setFaceLoading(
              true
            );


            setFaceReady(
              false
            );


            setFaceDetected(
              false
            );


            setFaceSimilarity(
              null
            );


            setFaceInstruction(
              'Preparando reconocimiento facial...'
            );


            await initializeFaceEngine();


            if (
              cancelled
            ) {

              return;

            }


            const stream =
              await navigator.mediaDevices.getUserMedia({
                video: {

                  facingMode:
                    'user',

                  width: {
                    ideal:
                      1280
                  },

                  height: {
                    ideal:
                      720
                  }

                },

                audio:
                  false
              });


            if (
              cancelled
            ) {

              stream
                .getTracks()
                .forEach(
                  track =>
                    track.stop()
                );


              return;

            }


            faceStreamRef.current =
              stream;


            const video =
              faceVideoRef.current;


            if (!video) {

              stream
                .getTracks()
                .forEach(
                  track =>
                    track.stop()
                );


              return;

            }


            video.srcObject =
              stream;


            await new Promise(
              resolve => {

                if (
                  video.readyState >=
                  1
                ) {

                  resolve();

                  return;

                }


                video.onloadedmetadata =
                  resolve;

              }
            );


            await video.play();


            if (
              cancelled
            ) {

              return;

            }


            faceActiveRef.current =
              true;


            setFaceReady(
              true
            );


            setFaceLoading(
              false
            );


            setFaceInstruction(
              'Coloca tu rostro frente a la cámara.'
            );


            faceTimerRef.current =
              setTimeout(
                runFaceLoop,
                250
              );

          } catch (
            error
          ) {

            console.error(
              'Error iniciando cámara facial:',
              error
            );


            setFaceLoading(
              false
            );


            setFaceReady(
              false
            );


            if (
              error?.name ===
              'NotAllowedError'
            ) {

              setFaceInstruction(
                'Debes permitir el acceso a la cámara.'
              );

            } else if (
              error?.name ===
              'NotFoundError'
            ) {

              setFaceInstruction(
                'No se encontró ninguna cámara.'
              );

            } else if (
              error?.name ===
              'NotReadableError'
            ) {

              setFaceInstruction(
                'La cámara está siendo utilizada por otra aplicación.'
              );

            } else {

              setFaceInstruction(
                error?.message ||
                'No se pudo iniciar la cámara.'
              );

            }

          }

        };


      start();


      return () => {

        cancelled =
          true;


        stopFaceCamera();

      };

    },
    [
      accessMode,
      runFaceLoop,
      stopFaceCamera
    ]
  );


  // ======================================================
  // CAMBIAR MÉTODO
  // ======================================================

  const changeMode = (
    mode
  ) => {

    if (
      mode ===
      accessMode
    ) {

      return;

    }


    stopFaceCamera();


    setAccessMode(
      mode
    );


    setScanStatus(
      'waiting'
    );


    setMemberData(
      null
    );


    setAccessMessage(
      ''
    );


    setCountdown(
      0
    );


    setPin(
      ''
    );


    setPinError(
      ''
    );


    setIsProcessing(
      false
    );


    setCameraError(
      false
    );


    setIsCameraReady(
      false
    );


    faceLastMatchRef.current = {

      memberId:
        null,

      confirmations:
        0

    };


    if (
      mode ===
      'qr'
    ) {

      scannerKeyRef.current +=
        1;

    }

  };


  // ======================================================
  // RESET AUTOMÁTICO
  // ======================================================

  useEffect(
    () => {

      if (
        countdown >
          0 &&
        scanStatus !==
          'waiting' &&
        scanStatus !==
          'scanning'
      ) {

        const timer =
          setTimeout(
            () => {

              setCountdown(
                previous =>
                  previous -
                  1
              );

            },
            1000
          );


        return () =>
          clearTimeout(
            timer
          );

      }


      if (
        countdown ===
          0 &&
        scanStatus !==
          'waiting' &&
        scanStatus !==
          'scanning'
      ) {

        const timer =
          setTimeout(
            () => {

              setScanStatus(
                'waiting'
              );


              setMemberData(
                null
              );


              setAccessMessage(
                ''
              );


              setLastMethod(
                null
              );


              setIsProcessing(
                false
              );


              setPin(
                ''
              );


              setPinError(
                ''
              );


              faceLastMatchRef.current = {

                memberId:
                  null,

                confirmations:
                  0

              };


              if (
                accessMode ===
                'face'
              ) {

                setFaceInstruction(
                  'Coloca tu rostro frente a la cámara.'
                );

              }

            },
            300
          );


        return () =>
          clearTimeout(
            timer
          );

      }

    },
    [
      countdown,
      scanStatus,
      accessMode
    ]
  );


  // ======================================================
  // CAMBIAR CÁMARA QR
  // ======================================================

  const toggleCamera =
    () => {

      setFacingMode(
        previous =>
          previous ===
          'environment'
            ? 'user'
            : 'environment'
      );


      setIsCameraReady(
        false
      );


      setCameraError(
        false
      );


      scannerKeyRef.current +=
        1;

    };


  // ======================================================
  // ESTADO VISUAL
  // ======================================================

  const statusDisplay =
    useMemo(
      () => {

        switch (
          scanStatus
        ) {

          case 'scanning':

            return {

              icon:
                <Loader2
                  size={58}
                  className="text-[#00ff88] animate-spin"
                />,

              title:
                'VALIDANDO',

              subtitle:
                'Comprobando identidad y acceso...',

              color:
                'text-[#00ff88]'

            };


          case 'success':

            return {

              icon:
                isEntry
                  ? (
                    <LogIn
                      size={60}
                      className="text-[#00ff88]"
                    />
                  )
                  : (
                    <LogOut
                      size={60}
                      className="text-blue-400"
                    />
                  ),

              title:
                isEntry
                  ? 'ACCESO PERMITIDO'
                  : 'SALIDA REGISTRADA',

              subtitle:
                memberData?.name ||
                'Miembro',

              color:
                isEntry
                  ? 'text-[#00ff88]'
                  : 'text-blue-400'

            };


          case 'warning':

            return {

              icon:
                <CheckCircle2
                  size={60}
                  className="text-yellow-500"
                />,

              title:
                'ACCESO PERMITIDO',

              subtitle:
                memberData?.name ||
                'Miembro',

              color:
                'text-yellow-500'

            };


          case 'error':

            return {

              icon:
                <XCircle
                  size={60}
                  className="text-red-500"
                />,

              title:
                'ACCESO DENEGADO',

              subtitle:
                memberData?.name ||
                'Miembro',

              color:
                'text-red-500'

            };


          case 'unrecognized':

            return {

              icon:
                <AlertCircle
                  size={60}
                  className="text-yellow-500"
                />,

              title:
                'NO RECONOCIDO',

              subtitle:
                accessMessage ||
                'No pudimos identificar al miembro.',

              color:
                'text-yellow-500'

            };


          default:

            return null;

        }

      },
      [
        scanStatus,
        isEntry,
        memberData,
        accessMessage
      ]
    );


  // ======================================================
  // QR SCANNER
  // ======================================================

  const renderQR = () => (

    <div className="flex flex-col items-center">

      <div className="
        relative
        w-[330px]
        max-w-[90vw]
        aspect-square
        bg-black
        border-2
        border-[#2a2a2a]
        rounded-3xl
        overflow-hidden
      ">

        <div className="absolute inset-0 z-0">

          <ErrorBoundary>

            <QRScanner
              key={`${scannerKeyRef.current}-${facingMode}`}
              onScan={
                handleQRScan
              }
              onError={() => {

                setCameraError(
                  true
                );

                setIsCameraReady(
                  false
                );

              }}
              onReady={() => {

                setCameraError(
                  false
                );

                setIsCameraReady(
                  true
                );

              }}
              facingMode={
                facingMode
              }
            />

          </ErrorBoundary>

        </div>


        {/* ESQUINAS */}

        <div className="absolute top-5 left-5 w-16 h-16 border-t-4 border-l-4 border-[#00ff88] rounded-tl-xl z-20 pointer-events-none" />

        <div className="absolute top-5 right-5 w-16 h-16 border-t-4 border-r-4 border-[#00ff88] rounded-tr-xl z-20 pointer-events-none" />

        <div className="absolute bottom-5 left-5 w-16 h-16 border-b-4 border-l-4 border-[#00ff88] rounded-bl-xl z-20 pointer-events-none" />

        <div className="absolute bottom-5 right-5 w-16 h-16 border-b-4 border-r-4 border-[#00ff88] rounded-br-xl z-20 pointer-events-none" />


        {
          scanStatus ===
            'waiting' &&
          (

            <div
              className="absolute left-8 right-8 h-[2px] bg-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.8)] z-20 pointer-events-none"
              style={{
                top:
                  `${scannerLine}%`
              }}
            />

          )
        }


        <button
          type="button"
          onClick={
            toggleCamera
          }
          className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm p-2 rounded-lg hover:bg-black z-30"
          title="Cambiar cámara"
        >

          <Camera
            size={18}
            className="text-white"
          />

        </button>

      </div>


      <div className="mt-5 flex items-center gap-2">

        <span
          className={`w-2 h-2 rounded-full ${
            !cameraError &&
            isCameraReady
              ? 'bg-[#00ff88] animate-pulse'
              : 'bg-yellow-500'
          }`}
        />


        <span
          className={
            !cameraError &&
            isCameraReady
              ? 'text-[#00ff88] text-sm'
              : 'text-yellow-500 text-sm'
          }
        >

          {
            !cameraError &&
            isCameraReady
              ? 'Lector QR listo'
              : 'Preparando cámara...'
          }

        </span>

      </div>


      <p className="text-gray-500 text-sm mt-2">
        Coloca el código QR dentro del recuadro
      </p>

    </div>

  );


  // ======================================================
  // RECONOCIMIENTO FACIAL
  // ======================================================

  const renderFace = () => (

    <div className="flex flex-col items-center w-full">

      <div className="
        relative
        w-full
        max-w-[620px]
        aspect-video
        bg-black
        rounded-3xl
        overflow-hidden
        border
        border-[#2a2a2a]
      ">

        <video
          ref={
            faceVideoRef
          }
          autoPlay
          muted
          playsInline
          className="
            absolute
            inset-0
            w-full
            h-full
            object-cover
            scale-x-[-1]
          "
        />


        {/* ÓVALO */}

        <div
          className={`
            absolute
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2

            w-[38%]
            h-[72%]

            rounded-[48%]
            border-2

            transition-all
            duration-300

            pointer-events-none

            ${
              faceDetected
                ? `
                    border-[#00ff88]
                    shadow-[0_0_45px_rgba(0,255,136,.3)]
                  `
                : `
                    border-white/30
                  `
            }
          `}
        />


        {
          faceLoading &&
          (

            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">

              <Loader2
                size={38}
                className="text-[#00ff88] animate-spin"
              />


              <p className="text-gray-400 text-sm mt-3">
                Preparando reconocimiento facial...
              </p>

            </div>

          )
        }


        {
          !faceLoading &&
          (

            <div className="
              absolute
              left-1/2
              bottom-5
              -translate-x-1/2
              bg-black/80
              backdrop-blur-lg
              border
              border-white/10
              rounded-full
              px-5
              py-2.5
              max-w-[90%]
            ">

              <p className="text-white text-sm font-medium text-center">
                {
                  faceInstruction
                }
              </p>

            </div>

          )
        }

      </div>


      <div className="mt-4 flex items-center gap-3">

        <span
          className={`w-2 h-2 rounded-full ${
            faceReady
              ? 'bg-[#00ff88] animate-pulse'
              : 'bg-yellow-500'
          }`}
        />


        <span
          className={
            faceReady
              ? 'text-[#00ff88] text-sm'
              : 'text-yellow-500 text-sm'
          }
        >

          {
            faceReady
              ? 'Reconocimiento facial activo'
              : 'Preparando biometría...'
          }

        </span>

      </div>


      {
        faceSimilarity !==
          null &&
        (

          <p className="text-gray-600 text-xs mt-2">
            Coincidencia detectada:{' '}

            {
              Math.round(
                faceSimilarity *
                100
              )
            }%
          </p>

        )
      }


      <p className="text-gray-500 text-sm text-center mt-3 max-w-md">
        No necesitas presionar ningún botón. Mira hacia la cámara y el sistema validará tu rostro automáticamente.
      </p>

    </div>

  );


  // ======================================================
  // PIN
  // ======================================================

  const renderPin = () => {

    const numbers = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'clear',
      '0',
      'delete'
    ];


    return (

      <div className="w-full max-w-sm mx-auto">

        <div className="text-center mb-6">

          <div className="w-16 h-16 bg-[#00ff88]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">

            <KeyRound
              size={30}
              className="text-[#00ff88]"
            />

          </div>


          <h2 className="text-white text-xl font-bold">
            Ingresa tu PIN
          </h2>


          <p className="text-gray-500 text-sm mt-1">
            Utiliza el PIN de 6 dígitos asignado durante tu registro.
          </p>

        </div>


        {/* PIN VISUAL */}

        <div className="flex items-center justify-center gap-3 mb-6">

          {
            Array.from({
              length:
                6
            }).map(
              (
                _,
                index
              ) => (

                <div
                  key={
                    index
                  }
                  className={`
                    w-11
                    h-12
                    rounded-xl
                    border
                    flex
                    items-center
                    justify-center

                    ${
                      pin.length >
                      index
                        ? 'border-[#00ff88] bg-[#00ff88]/10'
                        : 'border-[#2a2a2a] bg-[#1a1a1a]'
                    }
                  `}
                >

                  {
                    pin.length >
                    index &&
                    (

                      <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88]" />

                    )
                  }

                </div>

              )
            )
          }

        </div>


        {
          pinError &&
          (

            <p className="text-red-400 text-sm text-center mb-4">
              {
                pinError
              }
            </p>

          )
        }


        {/* TECLADO */}

        <div className="grid grid-cols-3 gap-3">

          {
            numbers.map(
              item => {

                if (
                  item ===
                  'clear'
                ) {

                  return (

                    <button
                      key={
                        item
                      }
                      type="button"
                      onClick={
                        handlePinClear
                      }
                      className="h-14 rounded-xl bg-[#151515] border border-[#2a2a2a] text-gray-400 hover:border-red-400 hover:text-red-400 transition-colors text-xs font-medium"
                    >
                      LIMPIAR
                    </button>

                  );

                }


                if (
                  item ===
                  'delete'
                ) {

                  return (

                    <button
                      key={
                        item
                      }
                      type="button"
                      onClick={
                        handlePinDelete
                      }
                      className="h-14 rounded-xl bg-[#151515] border border-[#2a2a2a] text-gray-400 hover:border-[#00ff88] hover:text-white flex items-center justify-center"
                    >

                      <Delete
                        size={21}
                      />

                    </button>

                  );

                }


                return (

                  <button
                    key={
                      item
                    }
                    type="button"
                    onClick={() =>
                      handlePinNumber(
                        item
                      )
                    }
                    className="
                      h-14
                      rounded-xl
                      bg-[#151515]
                      border
                      border-[#2a2a2a]
                      text-white
                      text-xl
                      font-semibold

                      hover:border-[#00ff88]
                      hover:bg-[#00ff88]/5

                      active:scale-95
                      transition-all
                    "
                  >
                    {
                      item
                    }
                  </button>

                );

              }
            )
          }

        </div>


        <button
          type="button"
          onClick={
            handlePinSubmit
          }
          disabled={
            pin.length !==
              6 ||
            isProcessing
          }
          className="
            w-full
            mt-4
            py-3

            bg-[#00ff88]
            text-black

            rounded-xl
            font-bold

            hover:bg-[#00cc6a]

            disabled:opacity-40
            disabled:cursor-not-allowed

            transition-all
          "
        >

          {
            isProcessing
              ? 'Validando...'
              : 'Confirmar PIN'
          }

        </button>

      </div>

    );

  };


  // ======================================================
  // RESULTADO
  // ======================================================

  const renderResult = () => (

    <div className="text-center max-w-lg mx-auto">

      <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-5">

        {
          statusDisplay?.icon
        }

      </div>


      <h1
        className={`text-4xl font-bold mb-2 ${
          statusDisplay?.color ||
          'text-white'
        }`}
      >
        {
          statusDisplay?.title
        }
      </h1>


      <p className="text-white text-xl">
        {
          statusDisplay?.subtitle
        }
      </p>


      {
        memberData &&
        (

          <>

            <div className="flex items-center justify-center gap-4 my-6">

              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] overflow-hidden flex items-center justify-center">

                {
                  memberData.profilePhoto
                    ? (

                      <img
                        src={
                          memberData.profilePhoto
                        }
                        alt={
                          memberData.name
                        }
                        className="w-full h-full object-cover"
                      />

                    )
                    : (

                      <User
                        size={30}
                        className="text-gray-500"
                      />

                    )
                }

              </div>


              <div className="text-left">

                <p className="text-white font-semibold text-lg">
                  {
                    memberData.name
                  }
                </p>


                <p className="text-[#00ff88] text-sm font-mono">
                  {
                    memberData.id
                  }
                </p>


                {
                  lastMethod &&
                  (

                    <p className="text-gray-500 text-xs mt-1 uppercase">
                      Acceso mediante {lastMethod}
                    </p>

                  )
                }

              </div>

            </div>

          </>

        )
      }


      <div className="bg-[#151515] border border-[#222] rounded-2xl p-5 mt-4">

        {
          memberData &&
          (

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Movimiento
                </span>


                <span
                  className={
                    isEntry
                      ? 'text-[#00ff88]'
                      : 'text-blue-400'
                  }
                >

                  {
                    isEntry
                      ? 'ENTRADA'
                      : 'SALIDA'
                  }

                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-gray-400">
                  Hora
                </span>


                <span className="text-white">
                  {
                    memberData.accessTime
                  }
                </span>

              </div>


              {
                memberData?.subscription?.endDate &&
                (

                  <div className="flex justify-between">

                    <span className="text-gray-400">
                      Vencimiento
                    </span>


                    <span className="text-white">
                      {
                        memberData.subscription.endDate
                      }
                    </span>

                  </div>

                )
              }

            </div>

          )
        }


        {
          accessMessage &&
          (

            <p
              className={`text-sm ${
                scanStatus ===
                'error'
                  ? 'text-red-400'
                  : scanStatus ===
                    'warning'
                    ? 'text-yellow-400'
                    : scanStatus ===
                      'unrecognized'
                      ? 'text-yellow-400'
                      : 'text-gray-300'
              } ${
                memberData
                  ? 'mt-4 pt-4 border-t border-[#222]'
                  : ''
              }`}
            >
              {
                accessMessage
              }
            </p>

          )
        }

      </div>


      {
        scanStatus ===
          'warning' &&
        memberData?.daysRemaining !==
          null &&
        (

          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">

            <div className="flex items-center justify-center gap-2">

              <Calendar
                size={17}
                className="text-yellow-500"
              />


              <span className="text-yellow-400 text-sm font-medium">
                Tu suscripción vence pronto
              </span>

            </div>


            <p className="text-gray-400 text-xs mt-2">
              Te quedan{' '}

              <span className="text-yellow-400 font-bold">
                {
                  memberData.daysRemaining
                }
              </span>

              {' '}días.
            </p>

          </div>

        )
      }


      <div className="mt-6">

        <p className="text-gray-500 text-sm">
          Preparando siguiente acceso en{' '}

          <span className="text-white">
            {
              countdown
            }
          </span>

          s
        </p>

      </div>

    </div>

  );


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="
        px-6
        py-4

        border-b
        border-[#1a1a1a]

        flex
        items-center
        justify-between

        flex-wrap
        gap-4
      ">

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                '/dashboard'
              )
            }
            className="
              p-2
              bg-[#1a1a1a]
              border
              border-[#2a2a2a]
              rounded-xl
              text-gray-400

              hover:border-[#00ff88]
              hover:text-white
            "
          >

            <ArrowLeft
              size={20}
            />

          </button>


          <div>

            <h1 className="text-white text-lg font-bold">
              GYM CONTROL
            </h1>


            <p className="text-gray-500 text-xs">
              Control inteligente de acceso
            </p>

          </div>

        </div>


        <div className="flex items-center gap-5">

          <div className="text-right">

            <p className="text-white font-semibold">
              {
                currentTime.toLocaleTimeString(
                  'es-MX',
                  {
                    hour:
                      '2-digit',

                    minute:
                      '2-digit'
                  }
                )
              }
            </p>


            <p className="text-gray-500 text-xs capitalize">
              {
                currentTime.toLocaleDateString(
                  'es-MX',
                  {
                    weekday:
                      'long',

                    day:
                      'numeric',

                    month:
                      'long'
                  }
                )
              }
            </p>

          </div>


          <div className="flex items-center gap-2">

            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />


            <span className="text-[#00ff88] text-xs">
              Sistema disponible
            </span>

          </div>

        </div>

      </header>


      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="
        flex-1
        flex
        flex-col
        items-center

        px-6
        py-8

        bg-gradient-to-b
        from-[#0a0a0a]
        to-[#0d0d0d]
      ">


        {/* ================================================= */}
        {/* MÉTODOS */}
        {/* ================================================= */}

        {
          scanStatus ===
            'waiting' &&
          (

            <div className="w-full max-w-2xl mb-7">

              <p className="text-gray-500 text-xs uppercase tracking-wider text-center mb-3">
                Método de acceso
              </p>


              <div className="grid grid-cols-3 gap-2 bg-[#111111] border border-[#1a1a1a] rounded-2xl p-2">

                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      'qr'
                    )
                  }
                  className={`
                    py-3
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-sm
                    font-medium
                    transition-all

                    ${
                      accessMode ===
                      'qr'
                        ? 'bg-[#00ff88] text-black'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                    }
                  `}
                >

                  <QrCode
                    size={18}
                  />

                  QR

                </button>


                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      'face'
                    )
                  }
                  className={`
                    py-3
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-sm
                    font-medium
                    transition-all

                    ${
                      accessMode ===
                      'face'
                        ? 'bg-[#00ff88] text-black'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                    }
                  `}
                >

                  <ScanFace
                    size={19}
                  />

                  Rostro

                </button>


                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      'pin'
                    )
                  }
                  className={`
                    py-3
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-sm
                    font-medium
                    transition-all

                    ${
                      accessMode ===
                      'pin'
                        ? 'bg-[#00ff88] text-black'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                    }
                  `}
                >

                  <KeyRound
                    size={18}
                  />

                  PIN

                </button>

              </div>

            </div>

          )
        }


        {/* ================================================= */}
        {/* WAITING */}
        {/* ================================================= */}

        {
          scanStatus ===
            'waiting'
          ? (

            <div className="w-full flex-1 flex flex-col items-center justify-center">

              <div className="text-center mb-7">

                <h2 className="text-3xl sm:text-4xl font-bold text-white">

                  {
                    accessMode ===
                      'qr'
                      ? 'Escanea tu código QR'
                      : accessMode ===
                        'face'
                        ? 'Reconocimiento facial'
                        : 'Acceso mediante PIN'
                  }

                </h2>


                <p className="text-gray-400 mt-2">

                  {
                    accessMode ===
                      'qr'
                      ? 'Acerca tu código al lector.'
                      : accessMode ===
                        'face'
                        ? 'Mira hacia la cámara para identificarte.'
                        : 'Ingresa los 6 dígitos de tu PIN.'
                  }

                </p>

              </div>


              {
                accessMode ===
                  'qr'
                  ? renderQR()
                  : accessMode ===
                    'face'
                    ? renderFace()
                    : renderPin()
              }

            </div>

          )
          : scanStatus ===
            'scanning'
            ? (

              <div className="flex-1 flex items-center justify-center">

                {renderResult()}

              </div>

            )
            : (

              <div className="flex-1 flex items-center justify-center">

                {renderResult()}

              </div>

            )
        }

      </main>


      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer className="
        px-6
        py-3

        border-t
        border-[#1a1a1a]

        flex
        items-center
        justify-between

        flex-wrap
        gap-3
      ">

        <div className="flex items-center gap-2">

          <Shield
            size={16}
            className="text-gray-500"
          />


          <span className="text-gray-400 text-xs">
            Acceso seguro
          </span>


          <span className="text-gray-600 text-xs">
            •
          </span>


          <span className="text-gray-500 text-xs">
            QR · Reconocimiento facial · PIN
          </span>

        </div>


        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() =>
              navigate(
                '/attendance'
              )
            }
            className="text-gray-500 hover:text-[#00ff88] text-xs flex items-center gap-1"
          >

            <Users
              size={14}
            />

            Ver asistencias

          </button>


          <span className="text-gray-600 text-xs">
            GYM CONTROL © 2026
          </span>

        </div>

      </footer>

    </div>

  );

};


export default AccessControlPage;