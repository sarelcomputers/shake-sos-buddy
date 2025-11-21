import { useState, useEffect } from 'react';

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

export interface SOSSettings {
  enabled: boolean;
  message: string;
  sensitivity: number;
  shakeCount: number;
  contacts: Contact[];
}

const DEFAULT_SETTINGS: SOSSettings = {
  enabled: false,
  message: 'EMERGENCY! I need help at this location:',
  sensitivity: 15,
  shakeCount: 3,
  contacts: [],
};

export const useSOSSettings = () => {
  const [settings, setSettings] = useState<SOSSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem('alfa22_sos_settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  const saveSettings = (newSettings: Partial<SOSSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('alfa22_sos_settings', JSON.stringify(updated));
  };

  const toggleEnabled = () => {
    saveSettings({ enabled: !settings.enabled });
  };

  const updateMessage = (message: string) => {
    saveSettings({ message });
  };

  const updateSensitivity = (sensitivity: number) => {
    saveSettings({ sensitivity });
  };

  const updateShakeCount = (shakeCount: number) => {
    saveSettings({ shakeCount });
  };

  const addContact = (contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contact,
      id: crypto.randomUUID(),
    };
    saveSettings({ contacts: [...settings.contacts, newContact] });
  };

  const removeContact = (id: string) => {
    saveSettings({ contacts: settings.contacts.filter(c => c.id !== id) });
  };

  return {
    settings,
    toggleEnabled,
    updateMessage,
    updateSensitivity,
    updateShakeCount,
    addContact,
    removeContact,
  };
};
