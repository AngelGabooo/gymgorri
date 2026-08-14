// src/components/Access/QRScanner.jsx

import React, { useRef, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

const QRScanner = ({
  onScan,
  onError,
  onReady,
  facingMode = 'environment'
}) => {
  const [cameraError, setCameraError] = useState(null);

  const lastScanRef = useRef({
    value: null,
    time: 0
  });

  const readySentRef = useRef(false);

  const handleScan = (detectedCodes) => {
    // Si llegamos aquí, significa que el scanner
    // ya está funcionando.
    if (!readySentRef.current) {
      readySentRef.current = true;

      if (onReady) {
        onReady();
      }
    }

    if (!detectedCodes || detectedCodes.length === 0) {
      return;
    }

    const result = detectedCodes[0];

    const text = result?.rawValue;

    if (!text) {
      return;
    }

    const now = Date.now();

    // Evitar procesar varias veces el mismo QR
    if (
      lastScanRef.current.value === text &&
      now - lastScanRef.current.time < 3000
    ) {
      return;
    }

    lastScanRef.current = {
      value: text,
      time: now
    };

    console.log('✅ QR ESCANEADO:', text);

    if (onScan) {
      onScan(text);
    }
  };

  const handleError = (error) => {
    console.error('❌ Error del scanner:', error);

    setCameraError(error);

    if (onError) {
      onError(error);
    }
  };

  const getErrorMessage = () => {
    if (!cameraError) return '';

    switch (cameraError?.name) {
      case 'NotAllowedError':
        return 'No se permitió el acceso a la cámara. Revisa los permisos del navegador.';

      case 'NotFoundError':
        return 'No se encontró ninguna cámara en este dispositivo.';

      case 'NotReadableError':
        return 'La cámara está siendo utilizada por otra aplicación.';

      case 'OverconstrainedError':
        return 'La cámara seleccionada no está disponible.';

      case 'SecurityError':
        return 'El navegador bloqueó el acceso a la cámara.';

      default:
        return (
          cameraError?.message ||
          'No se pudo iniciar la cámara.'
        );
    }
  };

  if (cameraError) {
    return (
      <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center p-5">
        <div className="text-center max-w-xs">

          <div className="text-4xl mb-3">
            📷
          </div>

          <p className="text-red-400 font-semibold mb-2">
            Error de cámara
          </p>

          <p className="text-gray-400 text-xs">
            {getErrorMessage()}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="
              mt-5
              px-5
              py-2
              bg-[#00ff88]
              text-black
              rounded-lg
              text-sm
              font-semibold
              hover:bg-[#00cc6a]
              transition-colors
            "
          >
            Reintentar
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">

      <Scanner
        onScan={handleScan}
        onError={handleError}

        formats={[
          'qr_code'
        ]}

        constraints={{
          facingMode:
            facingMode === 'user'
              ? 'user'
              : 'environment',

          width: {
            ideal: 1280
          },

          height: {
            ideal: 720
          }
        }}

        scanDelay={300}

        allowMultiple={false}

        components={{
          audio: false,
          finder: false,
          torch: false,
          zoom: false
        }}

        styles={{
          container: {
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0
          },

          video: {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }
        }}
      />

    </div>
  );
};

export default QRScanner;