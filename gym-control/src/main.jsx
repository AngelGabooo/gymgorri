// src/main.jsx

import {
  StrictMode
} from 'react';

import {
  createRoot
} from 'react-dom/client';


import './index.css';


import App
  from './App.jsx';


import {
  initializeLocalDatabase
} from './services/localDatabase.js';


import {
  GymSettingsProvider
} from './context/GymSettingsContext.jsx';


import {
  GymAlertProvider
} from './components/UI/GymAlertProvider.jsx';


import {
  openNexgymDatabase
} from './offline/db/nexgymDatabase.js';


import {
  initializeNetworkService
} from './offline/network/networkService.js';


import {
  recoverProcessingSyncItems,
  getSyncQueueCounts
} from './offline/sync/syncQueue.js';


import {
  initializeSyncManager
} from './offline/sync/syncManager.js';


// ======================================================
// INICIALIZAR BASE LOCAL EXISTENTE
// ======================================================
//
// Este sistema todavía conserva localStorage para
// compatibilidad con las pantallas existentes.
//
// ======================================================

initializeLocalDatabase();


// ======================================================
// INICIALIZAR SISTEMA OFFLINE
// ======================================================

const initializeOfflineSystem =
  async () => {

    try {

      // ==================================================
      // 1. INDEXEDDB
      // ==================================================

      const databaseResult =
        await openNexgymDatabase();


      if (
        !databaseResult.success
      ) {

        console.error(
          '❌ No se pudo inicializar IndexedDB:',
          databaseResult.message
        );


        return;

      }


      console.log(
        '✅ IndexedDB preparada para modo offline.'
      );


      // ==================================================
      // 2. RECUPERAR OPERACIONES INTERRUMPIDAS
      // ==================================================
      //
      // Por ejemplo:
      //
      // pending
      //    ↓
      // processing
      //    ↓
      // navegador cerrado
      //
      // Al volver a abrir debe regresar a pending.
      //
      // ==================================================

      const recovered =
        await recoverProcessingSyncItems();


      if (
        recovered >
        0
      ) {

        console.log(
          `🔄 ${recovered} operación(es) pendiente(s) recuperada(s).`
        );

      }


      // ==================================================
      // 3. DETECTOR DE INTERNET
      // ==================================================

      const networkStatus =
        initializeNetworkService();


      console.log(
        '🌐 Estado inicial de conexión:',
        networkStatus
      );


      // ==================================================
      // 4. ESTADO ACTUAL DE LA COLA
      // ==================================================

      const queueCounts =
        await getSyncQueueCounts();


      console.log(
        '📊 Estado actual de syncQueue:',
        queueCounts
      );


      // ==================================================
      // 5. SYNC MANAGER
      // ==================================================
      //
      // Todavía NO existen handlers de Supabase.
      //
      // Por eso cualquier operación seguirá pending.
      //
      // Esto es intencional.
      //
      // ==================================================

      const syncManagerState =
        await initializeSyncManager();


      console.log(
        '🔄 Estado inicial de syncManager:',
        syncManagerState
      );


      console.log(
        '✅ Sistema offline NEXGYM inicializado correctamente.'
      );

    } catch (error) {

      console.error(
        '❌ Error inicializando sistema offline:',
        error
      );

    }

  };


// ======================================================
// EJECUTAR SISTEMA OFFLINE
// ======================================================

initializeOfflineSystem();


// ======================================================
// RENDER
// ======================================================

createRoot(
  document.getElementById(
    'root'
  )
).render(

  <StrictMode>

    <GymSettingsProvider>

      <GymAlertProvider>

        <App />

      </GymAlertProvider>

    </GymSettingsProvider>

  </StrictMode>

);