// src/context/GymSettingsContext.jsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import {
  getGymSettings,
  saveGymSettings,
  resetGymSettings
} from '../utils/gymSettings';

const GymSettingsContext = createContext(null);

export const GymSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => getGymSettings());

  const updateSettings = useCallback(newSettings => {
    const saved = saveGymSettings(newSettings);
    setSettings(saved);
    return saved;
  }, []);

  const restoreSettings = useCallback(() => {
    const restored = resetGymSettings();
    setSettings(restored);
    return restored;
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = event => {
      if (event?.detail) {
        setSettings(event.detail);
        return;
      }

      setSettings(getGymSettings());
    };

    const handleStorage = event => {
      if (!event.key || event.key === 'gym_control_settings') {
        setSettings(getGymSettings());
      }
    };

    window.addEventListener('gym-settings-update', handleSettingsUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('gym-settings-update', handleSettingsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <GymSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        restoreSettings
      }}
    >
      {children}
    </GymSettingsContext.Provider>
  );
};

export const useGymSettings = () => {
  const context = useContext(GymSettingsContext);

  if (!context) {
    throw new Error(
      'useGymSettings debe utilizarse dentro de GymSettingsProvider.'
    );
  }

  return context;
};
