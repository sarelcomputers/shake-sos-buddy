import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.5cb83c0c55a84b36a981495f8680a735',
  appName: 'Alfa22 SOS',
  webDir: 'dist',
  server: {
    url: 'https://5cb83c0c-55a8-4b36-a981-495f8680a735.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    KeepAwake: {
      enabled: true
    }
  }
};

export default config;
