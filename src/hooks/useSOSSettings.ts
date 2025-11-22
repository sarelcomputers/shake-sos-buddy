import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

export interface EmailContact {
  id: string;
  name: string;
  email: string;
}

export interface SOSSettings {
  enabled: boolean;
  message: string;
  testMessage: string;
  emailMessage: string;
  testEmailMessage: string;
  sensitivity: number;
  shakeCount: number;
  contacts: Contact[];
  emailContacts: EmailContact[];
}

const DEFAULT_SETTINGS: SOSSettings = {
  enabled: false,
  message: 'EMERGENCY! I need help at this location:',
  testMessage: '[TEST] This is a test of your emergency alert system. No action needed.',
  emailMessage: 'EMERGENCY ALERT! I need immediate help at this location.',
  testEmailMessage: '[TEST] This is a test of your emergency email alert system. No action needed.',
  sensitivity: 15,
  shakeCount: 3,
  contacts: [],
  emailContacts: [],
};

export const useSOSSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SOSSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchContacts();
      fetchEmailContacts();
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
          testMessage: data.test_message || DEFAULT_SETTINGS.testMessage,
          emailMessage: data.email_message || DEFAULT_SETTINGS.emailMessage,
          testEmailMessage: data.test_email_message || DEFAULT_SETTINGS.testEmailMessage,
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

  const fetchEmailContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_emails')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        emailContacts: data || [],
      }));
    } catch (error) {
      console.error('Error fetching email contacts:', error);
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
          test_message: updated.testMessage,
          email_message: updated.emailMessage,
          test_email_message: updated.testEmailMessage,
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

  const updateTestMessage = (testMessage: string) => {
    saveSettings({ testMessage });
  };

  const updateEmailMessage = (emailMessage: string) => {
    saveSettings({ emailMessage });
  };

  const updateTestEmailMessage = (testEmailMessage: string) => {
    saveSettings({ testEmailMessage });
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

  const addEmailContact = async (contact: Omit<EmailContact, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_emails')
        .insert([{
          user_id: user.id,
          name: contact.name,
          email: contact.email,
        }])
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        emailContacts: [...prev.emailContacts, data],
      }));

      toast.success('Email contact added successfully');
    } catch (error: any) {
      console.error('Error adding email contact:', error);
      toast.error(error.message || 'Failed to add email contact');
    }
  };

  const removeEmailContact = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('emergency_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        emailContacts: prev.emailContacts.filter(c => c.id !== id),
      }));

      toast.success('Email contact deleted');
    } catch (error: any) {
      console.error('Error deleting email contact:', error);
      toast.error('Failed to delete email contact');
    }
  };

  return {
    settings,
    loading,
    toggleEnabled,
    updateMessage,
    updateTestMessage,
    updateEmailMessage,
    updateTestEmailMessage,
    updateSensitivity,
    updateShakeCount,
    addContact,
    removeContact,
    addEmailContact,
    removeEmailContact,
  };
};
