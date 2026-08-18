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
// SUPABASE
// ======================================================

import {
  testSupabaseConfiguration
} from './services/supabaseConnectionService.js';


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

    } catch (error) {

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
      // Ejemplo:
      //
      // pending
      //    ↓
      // processing
      //    ↓
      // navegador cerrado
      //
      // Cuando NEXGYM vuelve a iniciar,
      // esas operaciones regresan a pending.
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
      // 4. PROBAR SUPABASE
      // ==================================================
      //
      // Por ahora esta prueba solamente confirma que:
      //
      // - .env.local funciona
      // - supabaseClient está configurado
      // - Supabase Auth responde
      //
      // Todavía NO sincronizamos entidades.
      //
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
      // 5. ESTADO ACTUAL DE LA COLA
      // ==================================================

      const queueCounts =
        await getSyncQueueCounts();


      console.log(
        '📊 Estado actual de syncQueue:',
        queueCounts
      );


      // ==================================================
      // 6. SYNC MANAGER
      // ==================================================
      //
      // IMPORTANTE:
      //
      // Aún no registramos los handlers remotos
      // de Supabase para:
      //
      // member
      // payment
      // subscription_history
      // attendance
      // access_log
      // product
      // inventory_movement
      // sale
      // cash_shift
      // cash_movement
      //
      // Por lo tanto las operaciones permanecen
      // en estado pending.
      //
      // Esto es correcto en esta etapa.
      //
      // ==================================================

      const syncManagerState =
        await initializeSyncManager();


      console.log(
        '🔄 Estado inicial de syncManager:',
        syncManagerState
      );


      // ==================================================
      // 7. FINAL
      // ==================================================

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