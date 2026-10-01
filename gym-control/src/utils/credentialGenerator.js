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
// DESCARGAR DATA URL
// ======================================================

export const downloadDataUrl = (
  dataUrl,
  fileName
) => {

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

};