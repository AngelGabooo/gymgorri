// src/utils/accessEvidence.js

export const ACCESS_LOG_KEY =
  'gym_control_access_logs';


// ======================================================
// LEER LOGS DE ACCESO
// ======================================================

export const getAccessLogs = () => {

  try {

    const raw =
      localStorage.getItem(
        ACCESS_LOG_KEY
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
      'Error leyendo logs de acceso:',
      error
    );

    return [];

  }

};


// ======================================================
// GUARDAR LOG
// ======================================================

export const addAccessLog = (
  record
) => {

  if (!record) {
    return null;
  }

  const records =
    getAccessLogs();

  const now =
    new Date()
      .toISOString();

  const id =
    window.crypto?.randomUUID
      ? `ACL-${window.crypto.randomUUID()}`
      : `ACL-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`;

  const entry = {
    id,

    ...record,

    createdAt:
      record.createdAt ||
      now
  };

  records.unshift(
    entry
  );

  // Conservamos una cantidad razonable mientras
  // el sistema siga trabajando con localStorage.
  const trimmed =
    records.slice(
      0,
      800
    );

  localStorage.setItem(
    ACCESS_LOG_KEY,
    JSON.stringify(
      trimmed
    )
  );

  window.dispatchEvent(
    new Event(
      'gym-storage-update'
    )
  );

  return entry;

};


// ======================================================
// FOTO COMPRIMIDA DESDE VIDEO
// ======================================================

export const captureVideoEvidence = (
  video,
  options = {}
) => {

  const {
    width = 320,
    height = 240,
    quality = 0.62
  } = options;

  if (
    !video ||
    video.readyState <
      2 ||
    !video.videoWidth ||
    !video.videoHeight
  ) {

    return null;

  }

  try {

    const canvas =
      document.createElement(
        'canvas'
      );

    canvas.width =
      width;

    canvas.height =
      height;

    const context =
      canvas.getContext(
        '2d'
      );

    if (!context) {
      return null;
    }

    const sourceRatio =
      video.videoWidth /
      video.videoHeight;

    const targetRatio =
      width /
      height;

    let sourceWidth =
      video.videoWidth;

    let sourceHeight =
      video.videoHeight;

    let sourceX =
      0;

    let sourceY =
      0;

    if (
      sourceRatio >
      targetRatio
    ) {

      sourceWidth =
        video.videoHeight *
        targetRatio;

      sourceX =
        (
          video.videoWidth -
          sourceWidth
        ) /
        2;

    } else {

      sourceHeight =
        video.videoWidth /
        targetRatio;

      sourceY =
        (
          video.videoHeight -
          sourceHeight
        ) /
        2;

    }

    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height
    );

    return canvas.toDataURL(
      'image/jpeg',
      quality
    );

  } catch (error) {

    console.error(
      'Error capturando evidencia:',
      error
    );

    return null;

  }

};


// ======================================================
// CÁMARA TEMPORAL
// ======================================================

export const openTemporaryCamera = async (
  options = {}
) => {

  const {
    facingMode = 'user',
    idealWidth = 640,
    idealHeight = 480
  } = options;

  const stream =
    await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: {
          ideal:
            idealWidth
        },
        height: {
          ideal:
            idealHeight
        }
      },
      audio:
        false
    });

  const video =
    document.createElement(
      'video'
    );

  video.autoplay =
    true;

  video.muted =
    true;

  video.playsInline =
    true;

  video.srcObject =
    stream;

  await new Promise(
    (
      resolve,
      reject
    ) => {

      const timeout =
        setTimeout(
          () =>
            reject(
              new Error(
                'La cámara tardó demasiado en iniciar.'
              )
            ),
          7000
        );

      const ready =
        async () => {

          try {

            await video.play();

            clearTimeout(
              timeout
            );

            // Permitimos que lleguen algunos cuadros reales.
            setTimeout(
              resolve,
              350
            );

          } catch (error) {

            clearTimeout(
              timeout
            );

            reject(
              error
            );

          }

        };

      if (
        video.readyState >=
        2
      ) {

        ready();

      } else {

        video.onloadeddata =
          ready;

      }

    }
  );

  const stop =
    () => {

      stream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );

      video.srcObject =
        null;

    };

  return {
    stream,
    video,
    stop
  };

};


export default {
  ACCESS_LOG_KEY,
  getAccessLogs,
  addAccessLog,
  captureVideoEvidence,
  openTemporaryCamera
};
