// src/offline/network/networkService.js


// ======================================================
// EVENTOS PERSONALIZADOS
// ======================================================

export const NETWORK_STATUS_EVENT =
  'nexgym-network-status-change';


// ======================================================
// ESTADO INTERNO
// ======================================================

let initialized =
  false;


let currentStatus = {

  online:
    typeof navigator !== 'undefined'
      ? navigator.onLine
      : true,

  status:
    typeof navigator !== 'undefined' &&
    navigator.onLine
      ? 'online'
      : 'offline',

  changedAt:
    new Date()
      .toISOString()

};


// ======================================================
// OBTENER ESTADO ACTUAL
// ======================================================

export const getNetworkStatus =
  () => {

    return {
      ...currentStatus
    };

  };


// ======================================================
// SABER SI ESTÁ ONLINE
// ======================================================

export const isOnline =
  () => {

    return currentStatus.online === true;

  };


// ======================================================
// SABER SI ESTÁ OFFLINE
// ======================================================

export const isOffline =
  () => {

    return !isOnline();

  };


// ======================================================
// ACTUALIZAR ESTADO
// ======================================================

const updateNetworkStatus =
  (
    online
  ) => {

    const nextOnline =
      Boolean(
        online
      );


    const previousOnline =
      currentStatus.online;


    currentStatus = {

      online:
        nextOnline,

      status:
        nextOnline
          ? 'online'
          : 'offline',

      changedAt:
        new Date()
          .toISOString()

    };


    // ==================================================
    // LOG
    // ==================================================

    if (
      nextOnline
    ) {

      console.log(
        '🌐 NEXGYM: conexión recuperada.'
      );

    } else {

      console.warn(
        '📴 NEXGYM: sin conexión a internet.'
      );

    }


    // ==================================================
    // NOTIFICAR A TODA LA APLICACIÓN
    // ==================================================

    window.dispatchEvent(
      new CustomEvent(
        NETWORK_STATUS_EVENT,
        {
          detail: {
            ...currentStatus,

            previousOnline
          }
        }
      )
    );


    return {
      ...currentStatus
    };

  };


// ======================================================
// EVENTO ONLINE
// ======================================================

const handleOnline =
  () => {

    updateNetworkStatus(
      true
    );

  };


// ======================================================
// EVENTO OFFLINE
// ======================================================

const handleOffline =
  () => {

    updateNetworkStatus(
      false
    );

  };


// ======================================================
// INICIALIZAR DETECTOR
// ======================================================

export const initializeNetworkService =
  () => {

    if (
      initialized
    ) {

      return getNetworkStatus();

    }


    initialized =
      true;


    currentStatus = {

      online:
        navigator.onLine,

      status:
        navigator.onLine
          ? 'online'
          : 'offline',

      changedAt:
        new Date()
          .toISOString()

    };


    window.addEventListener(
      'online',
      handleOnline
    );


    window.addEventListener(
      'offline',
      handleOffline
    );


    console.log(
      navigator.onLine
        ? '🌐 NEXGYM iniciado con conexión.'
        : '📴 NEXGYM iniciado sin conexión.'
    );


    return getNetworkStatus();

  };


// ======================================================
// DETENER SERVICIO
// ======================================================

export const destroyNetworkService =
  () => {

    if (
      !initialized
    ) {

      return;

    }


    window.removeEventListener(
      'online',
      handleOnline
    );


    window.removeEventListener(
      'offline',
      handleOffline
    );


    initialized =
      false;

  };


// ======================================================
// SUSCRIBIRSE A CAMBIOS
// ======================================================
//
// Permite hacer:
//
// const unsubscribe = subscribeToNetworkStatus(
//   status => console.log(status)
// );
//
// unsubscribe();
//
// ======================================================

export const subscribeToNetworkStatus =
  (
    callback
  ) => {

    if (
      typeof callback !==
      'function'
    ) {

      throw new Error(
        'subscribeToNetworkStatus necesita una función.'
      );

    }


    const listener =
      event => {

        callback(
          event.detail
        );

      };


    window.addEventListener(
      NETWORK_STATUS_EVENT,
      listener
    );


    return () => {

      window.removeEventListener(
        NETWORK_STATUS_EVENT,
        listener
      );

    };

  };


// ======================================================
// FORZAR ACTUALIZACIÓN
// ======================================================
//
// Útil para pruebas.
//
// ======================================================

export const refreshNetworkStatus =
  () => {

    return updateNetworkStatus(
      navigator.onLine
    );

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

const networkService = {

  initialize:
    initializeNetworkService,

  destroy:
    destroyNetworkService,

  getStatus:
    getNetworkStatus,

  isOnline,

  isOffline,

  subscribe:
    subscribeToNetworkStatus,

  refresh:
    refreshNetworkStatus

};


export default networkService;