// src/main.jsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';

import App from './App.jsx';

import {
  initializeLocalDatabase
} from './services/localDatabase.js';

import {
  GymSettingsProvider
} from './context/GymSettingsContext.jsx';

import {
  GymAlertProvider
} from './components/UI/GymAlertProvider.jsx';


// ======================================================
// INICIALIZAR BASE DE DATOS LOCAL
// ======================================================

initializeLocalDatabase();


// ======================================================
// RENDER
// ======================================================

createRoot(
  document.getElementById('root')
).render(

  <StrictMode>

    <GymSettingsProvider>

      <GymAlertProvider>

        <App />

      </GymAlertProvider>

    </GymSettingsProvider>

  </StrictMode>

);