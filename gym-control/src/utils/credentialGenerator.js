// src/utils/credentialGenerator.js

// ======================================================
// GENERADOR DE CREDENCIAL DIGITAL (PNG BASE64)
// ======================================================
//
// Usa Canvas puro. NO depende de html2canvas.
// Funciona igual en PC y celular.
//
// ======================================================


// ======================================================
// CARGAR IMAGEN
// ======================================================

const loadImage = (src) => {

  return new Promise((resolve, reject) => {

    if (!src) {
      reject(new Error('No se recibió una imagen.'));
      return;
    }

    const image = new Image();

    image.crossOrigin = 'anonymous';

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo cargar la imagen.'));

    image.src = src;

  });

};


// ======================================================
// RECTÁNGULO REDONDEADO
// ======================================================

const drawRoundedRect = (
  context,
  x,
  y,
  width,
  height,
  radius
) => {

  const r = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();

};


// ======================================================
// TEXTO AJUSTADO
// ======================================================

const drawFittedText = (
  context,
  textValue,
  x,
  y,
  maxWidth,
  initialSize,
  minSize = 20,
  fontWeight = 700
) => {

  let size = initialSize;
  const value = String(textValue || '');

  while (size > minSize) {
    context.font = `${fontWeight} ${size}px Arial, sans-serif`;
    if (context.measureText(value).width <= maxWidth) break;
    size -= 2;
  }

  context.fillText(value, x, y, maxWidth);

};


// ======================================================
// SVG -> IMAGEN (para el QR)
// ======================================================

const svgToImage = (svgElement) => {

  return new Promise((resolve, reject) => {

    if (!svgElement) {
      reject(new Error('No se encontró el SVG del QR.'));
      return;
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    if (!source.includes('xmlns=')) {
      source = source.replace(
        '<svg',
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }

    const blob = new Blob(
      [source],
      { type: 'image/svg+xml;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);

    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo convertir el QR a imagen.'));
    };

    image.src = url;

  });

};


// ======================================================
// GENERAR CREDENCIAL
// ======================================================

export const generateCredentialImage = async ({
  member,
  subscription = {},
  gymSettings = {},
  qrSvgElement = null,
  size = { width: 1012, height: 638 }
}) => {

  if (!member) {
    throw new Error('Se necesita un miembro para generar la credencial.');
  }


  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d');

  const fullName =
    `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
    'Miembro';

  const memberId = member.id || '—';


  // ==================================================
  // FONDO
  // ==================================================

  context.fillStyle = '#090a0a';
  context.fillRect(0, 0, canvas.width, canvas.height);

  let backgroundLoaded = false;

  try {

    const background = await loadImage('/img/crede.png');

    context.drawImage(
      background,
      0,
      0,
      canvas.width,
      canvas.height
    );

    backgroundLoaded = true;

  } catch (error) {

    console.warn(
      'No se pudo cargar /img/crede.png, usando fondo por defecto.',
      error
    );

  }


  if (!backgroundLoaded) {

    const gradient = context.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );

    gradient.addColorStop(0, '#04110a');
    gradient.addColorStop(0.5, '#071a10');
    gradient.addColorStop(1, '#0d2a1c');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

  }


  // ==================================================
  // MARCO
  // ==================================================

  context.strokeStyle = '#00ff88';
  context.lineWidth = 4;

  drawRoundedRect(
    context,
    8,
    8,
    canvas.width - 16,
    canvas.height - 16,
    42
  );

  context.stroke();


  // ==================================================
  // FRANJA SUPERIOR
  // ==================================================

  const headerGradient = context.createLinearGradient(
    0,
    0,
    canvas.width,
    0
  );

  headerGradient.addColorStop(0, '#00ff88');
  headerGradient.addColorStop(1, '#008f55');

  context.fillStyle = headerGradient;

  drawRoundedRect(
    context,
    8,
    8,
    canvas.width - 16,
    92,
    38
  );
  context.fill();

  context.fillRect(8, 55, canvas.width - 16, 45);


  const gymName =
    (gymSettings?.shortName || gymSettings?.name || 'GYM CONTROL')
      .toString()
      .toUpperCase();

  context.fillStyle = '#04110a';
  context.font = '900 35px Arial, sans-serif';
  context.fillText(gymName, 48, 62);

  context.font = '600 17px Arial, sans-serif';
  context.fillText('CREDENCIAL DIGITAL DE ACCESO', 50, 87);


  // ==================================================
  // FOTO DEL MIEMBRO (CÍRCULO)
  // ==================================================

  const photoX = 58;
  const photoY = 148;
  const photoSize = 238;

  context.save();
  context.beginPath();
  context.arc(
    photoX + photoSize / 2,
    photoY + photoSize / 2,
    photoSize / 2,
    0,
    Math.PI * 2
  );
  context.closePath();
  context.clip();


  if (member.profilePhoto) {

    try {

      const profileImage = await loadImage(member.profilePhoto);

      const sourceRatio = profileImage.width / profileImage.height;

      let sourceWidth = profileImage.width;
      let sourceHeight = profileImage.height;
      let sourceX = 0;
      let sourceY = 0;

      if (sourceRatio > 1) {
        sourceWidth = profileImage.height;
        sourceX = (profileImage.width - sourceWidth) / 2;
      } else {
        sourceHeight = profileImage.width;
        sourceY = (profileImage.height - sourceHeight) / 2;
      }

      context.drawImage(
        profileImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        photoX,
        photoY,
        photoSize,
        photoSize
      );

    } catch (error) {

      context.fillStyle = '#1a1a1a';
      context.fillRect(photoX, photoY, photoSize, photoSize);

    }

  } else {

    context.fillStyle = '#1a1a1a';
    context.fillRect(photoX, photoY, photoSize, photoSize);

    context.fillStyle = '#00ff88';
    context.font = '900 80px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    context.fillText(
      initials,
      photoX + photoSize / 2,
      photoY + photoSize / 2
    );

    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';

  }

  context.restore();


  context.strokeStyle = '#00ff88';
  context.lineWidth = 6;
  context.beginPath();
  context.arc(
    photoX + photoSize / 2,
    photoY + photoSize / 2,
    photoSize / 2 + 3,
    0,
    Math.PI * 2
  );
  context.stroke();


  // ==================================================
  // DATOS
  // ==================================================

  const dataX = 342;

  context.fillStyle = '#7c8a83';
  context.font = '600 18px Arial, sans-serif';
  context.fillText('MIEMBRO', dataX, 162);


  context.fillStyle = '#ffffff';
  drawFittedText(
    context,
    fullName,
    dataX,
    213,
    350,
    38,
    24,
    800
  );


  context.fillStyle = '#00ff88';
  context.font = '700 25px monospace';
  context.fillText(memberId, dataX, 252);


  const planLabel =
    subscription.planLabel ||
    subscription.plan ||
    'Sin plan';

  context.fillStyle = '#7c8a83';
  context.font = '600 16px Arial, sans-serif';
  context.fillText('PLAN', dataX, 310);

  context.fillStyle = '#ffffff';
  context.font = '700 24px Arial, sans-serif';
  context.fillText(planLabel, dataX, 340, 340);


  context.fillStyle = '#7c8a83';
  context.font = '600 16px Arial, sans-serif';
  context.fillText('VIGENCIA', dataX, 392);

  context.fillStyle = '#ffffff';
  context.font = '600 21px Arial, sans-serif';

  const vigenciaText =
    subscription.endDate ||
    'Sin vigencia';

  context.fillText(vigenciaText, dataX, 422, 340);


  const isActive =
    subscription.status === 'active' &&
    member.accessBlocked !== true;

  context.fillStyle = isActive ? '#00ff88' : '#ff5d5d';

  drawRoundedRect(context, dataX, 458, 196, 44, 20);
  context.fill();

  context.fillStyle = '#07100b';
  context.font = '800 17px Arial, sans-serif';
  context.fillText(
    isActive ? 'ACCESO ACTIVO' : 'ACCESO BLOQUEADO',
    dataX + 18,
    486
  );


  // ==================================================
  // QR
  // ==================================================

  const qrImage = await svgToImage(qrSvgElement);

  const qrBackgroundX = 726;
  const qrBackgroundY = 150;
  const qrBackgroundSize = 235;

  context.fillStyle = '#ffffff';
  drawRoundedRect(
    context,
    qrBackgroundX,
    qrBackgroundY,
    qrBackgroundSize,
    qrBackgroundSize,
    24
  );
  context.fill();

  context.drawImage(
    qrImage,
    qrBackgroundX + 17,
    qrBackgroundY + 17,
    qrBackgroundSize - 34,
    qrBackgroundSize - 34
  );


  context.fillStyle = '#ffffff';
  context.font = '700 16px Arial, sans-serif';
  context.textAlign = 'center';
  context.fillText(
    'ESCANEA PARA ACCEDER',
    qrBackgroundX + qrBackgroundSize / 2,
    qrBackgroundY + qrBackgroundSize + 32
  );


  // ==================================================
  // PIE
  // ==================================================

  context.textAlign = 'left';
  context.fillStyle = '#6c7772';
  context.font = '500 15px Arial, sans-serif';
  context.fillText('Credencial personal e intransferible', 58, 576);

  context.textAlign = 'right';
  context.fillStyle = '#00ff88';
  context.font = '700 15px Arial, sans-serif';
  context.fillText('QR · ROSTRO · PIN', 952, 576);


  // ==================================================
  // DEVOLVER DATA URL
  // ==================================================

  return canvas.toDataURL('image/png');

};


// ======================================================
// DATA URL -> BLOB
// ======================================================

export const dataUrlToBlob = (
  dataUrl
) => {

  const [header, base64] = String(dataUrl || '').split(',');

  if (!base64) {
    throw new Error('Data URL inválida.');
  }

  const mimeMatch = header.match(/data:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });

};


// ======================================================
// DETECTAR iOS / iPadOS
// ======================================================

const isIOS = () => {

  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';

  // iPhone / iPad / iPod clásico
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }

  // iPad moderno (iPadOS 13+) se reporta como MacIntel con touch
  if (
    navigator.platform === 'MacIntel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }

  return false;

};


// ======================================================
// DETECTAR SAFARI (cualquier plataforma)
// ======================================================

const isSafari = () => {

  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';

  // Safari real: tiene Safari y NO tiene otros motores
  return (
    /Safari/.test(ua) &&
    !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Android/.test(ua)
  );

};


// ======================================================
// COMPARTIR CON WEB SHARE API (iOS nativo)
// ======================================================

const shareDataUrlWithNativeSheet = async (
  dataUrl,
  fileName,
  title = 'Credencial digital'
) => {

  if (
    typeof navigator === 'undefined' ||
    typeof navigator.share !== 'function'
  ) {
    return false;
  }

  try {

    const blob = dataUrlToBlob(dataUrl);

    const file = new File(
      [blob],
      fileName,
      { type: 'image/png' }
    );

    // Si el navegador soporta canShare, validamos primero
    if (
      typeof navigator.canShare === 'function'
    ) {

      const canShareFiles =
        navigator.canShare({
          files: [file]
        });

      if (!canShareFiles) {

        // Intentar compartir solo con la URL
        await navigator.share({
          title,
          text: 'Credencial digital',
          url: dataUrl
        });

        return true;

      }

    }

    await navigator.share({
      title,
      files: [file]
    });

    return true;

  } catch (error) {

    // El usuario canceló o no hay permiso: no es error crítico
    if (
      error?.name === 'AbortError' ||
      error?.name === 'NotAllowedError'
    ) {
      return true;
    }

    console.warn(
      'Web Share API falló, se usará fallback:',
      error
    );

    return false;

  }

};


// ======================================================
// ABRIR IMAGEN EN PESTAÑA NUEVA (fallback iOS/Safari)
// ======================================================

const openDataUrlInNewTab = (
  dataUrl
) => {

  try {

    const win = window.open('', '_blank');

    if (!win) {
      return false;
    }

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Credencial</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #0a0a0a;
              min-height: 100vh;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 16px;
            }
            .wrap {
              display: flex;
              flex-direction: column;
              align-items: center;
              max-width: 100%;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            }
            .hint {
              color: #00ff88;
              font-family: -apple-system, system-ui, sans-serif;
              font-size: 13px;
              text-align: center;
              margin-top: 14px;
              padding: 0 12px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="wrap">
            <img src="${dataUrl}" alt="Credencial" />
            <p class="hint">
              Mantén presionada la imagen para guardarla en Fotos,
              o toca el botón Compartir de Safari.
            </p>
          </div>
        </body>
      </html>
    `);

    win.document.close();

    return true;

  } catch (error) {

    console.error(
      'No se pudo abrir la credencial en pestaña nueva:',
      error
    );

    return false;

  }

};


// ======================================================
// DESCARGAR DATA URL (con soporte iOS/Safari)
// ======================================================

export const downloadDataUrl = async (
  dataUrl,
  fileName,
  options = {}
) => {

  const title =
    options.title ||
    'Credencial digital';

  // ==================================================
  // 1. iOS / iPadOS -> Web Share API primero
  // ==================================================

  if (isIOS()) {

    const shared =
      await shareDataUrlWithNativeSheet(
        dataUrl,
        fileName,
        title
      );

    if (shared) {
      return true;
    }

    // Fallback: pestaña nueva
    const opened =
      openDataUrlInNewTab(dataUrl);

    if (opened) {
      return true;
    }

    // Último recurso: descarga clásica
  }

  // ==================================================
  // 2. Safari macOS -> pestaña nueva
  // ==================================================
  //
  // Safari en Mac muchas veces ignora `download` con
  // data URLs largas. La pestaña nueva siempre funciona.
  //
  // ==================================================

  if (isSafari() && !isIOS()) {

    const opened =
      openDataUrlInNewTab(dataUrl);

    if (opened) {
      return true;
    }

  }

  // ==================================================
  // 3. Otros navegadores -> descarga clásica
  // ==================================================

  try {

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      link.remove();
    }, 100);

    return true;

  } catch (error) {

    console.error(
      'No se pudo descargar el archivo:',
      error
    );

    // Último recurso absoluto
    return openDataUrlInNewTab(dataUrl);

  }

};