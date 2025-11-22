import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [settings, setSettings] = useState<SOSSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchContacts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sos_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings(prev => ({
          ...prev,
          message: data.message,
          sensitivity: parseInt(data.shake_sensitivity) || 15,
          shakeCount: 3,
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        contacts: data || [],
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<SOSSettings>) => {
    if (!user) return;

    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      const { error } = await supabase
        .from('sos_settings')
        .update({
          message: updated.message,
          shake_sensitivity: updated.sensitivity.toString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
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

  const addContact = async (contact: Omit<Contact, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert([{
          user_id: user.id,
          name: contact.name,
          phone: contact.phone,
        }])
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        contacts: [...prev.contacts, data],
      }));

      toast.success('Contact added successfully');
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast.error(error.message || 'Failed to add contact');
    }
  };

  const removeContact = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        contacts: prev.contacts.filter(c => c.id !== id),
      }));

      toast.success('Contact deleted');
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  return {
    settings,
    loading,
    toggleEnabled,
    updateMessage,
    updateSensitivity,
    updateShakeCount,
    addContact,
    removeContact,
  };
};
