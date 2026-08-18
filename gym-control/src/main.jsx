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
// HANDLERS REMOTOS SUPABASE
// ======================================================

import {
  registerSupabaseRemoteHandlers
} from './offline/sync/supabaseRemoteHandlers.js';


// ======================================================
// SUPABASE
// ======================================================

import {
  testSupabaseConfiguration
} from './services/supabaseConnectionService.js';

import './utils/resetLocalOperationalData.js';


// ======================================================
// INICIALIZAR BASE LOCAL EXISTENTE
// ======================================================

initializeLocalDatabase();


// ======================================================
// PROBAR CONEXIÓN CON SUPABASE
// ======================================================

const testSupabaseConnection =
  async () => {

    try {

      const result =
        await testSupabaseConfiguration();


      if (
        result.success
      ) {

        console.log(
          '☁️ Supabase conectado correctamente:',
          {
            success:
              result.success,

            configured:
              result.configured,

            hasSession:
              result.hasSession
          }
        );


        return result;

      }


      console.error(
        '❌ Falló conexión con Supabase:',
        result
      );


      return result;

    } catch (
      error
    ) {

      console.error(
        '❌ Error probando conexión con Supabase:',
        error
      );


      return {

        success:
          false,

        error

      };

    }

  };


// ======================================================
// INICIALIZAR SISTEMA OFFLINE + SUPABASE
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
      // 4. PROBAR SUPABASE
      // ==================================================

      if (
        networkStatus?.online
      ) {

        await testSupabaseConnection();

      } else {

        console.log(
          '📴 Supabase no se prueba porque NEXGYM inició sin conexión.'
        );

      }


      // ==================================================
      // 5. REGISTRAR HANDLERS REMOTOS
      // ==================================================
      //
      // IMPORTANTE:
      //
      // Los handlers deben existir ANTES de iniciar
      // syncManager. De lo contrario la cola volvería a
      // mostrar "Sin handler remoto".
      //
      // ==================================================

      const handlersResult =
        registerSupabaseRemoteHandlers();


      console.log(
        '☁️ Handlers remotos preparados:',
        handlersResult
      );


      // ==================================================
      // 6. ESTADO ACTUAL DE LA COLA
      // ==================================================

      const queueCounts =
        await getSyncQueueCounts();


      console.log(
        '📊 Estado actual de syncQueue:',
        queueCounts
      );


      // ==================================================
      // 7. SYNC MANAGER
      // ==================================================
      //
      // El manager:
      //
      // - solo procesa el gymId autenticado
      // - espera si estamos en /login
      // - escucha nuevas operaciones de syncQueue
      // - intenta sincronizar al volver internet
      //
      // ==================================================

      const syncManagerState =
        await initializeSyncManager();


      console.log(
        '🔄 Estado inicial de syncManager:',
        syncManagerState
      );


      // ==================================================
      // 8. FINAL
      // ==================================================

      console.log(
        '✅ Sistema NEXGYM local + Supabase inicializado correctamente.'
      );

    } catch (
      error
    ) {

      console.error(
        '❌ Error inicializando sistema NEXGYM:',
        error
      );

    }

  };


// ======================================================
// EJECUTAR SISTEMA
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
