import { scanWifiNetworks, NetworkInfo } from './wifiScanner';

export interface SimplifiedSOSData {
  wifiInfo: NetworkInfo;
  wifiNames: string;
}

export async function captureSimplifiedSOSData(): Promise<SimplifiedSOSData> {
  console.log('⚡ Capturing WiFi network information...');
  
  // Scan WiFi networks
  const wifiInfo = await scanWifiNetworks();
  
  // Extract just the WiFi router names
  const wifiNames = wifiInfo.nearbyNetworks.length > 0
    ? wifiInfo.nearbyNetworks.map(n => n.ssid).join(', ')
    : wifiInfo.currentNetwork.connectionType === 'wifi'
    ? 'Connected to WiFi network'
    : 'No WiFi networks detected';
  
  console.log('✅ WiFi scan complete:', wifiNames);
  
  return {
    wifiInfo,
    wifiNames,
  };
}

// No file uploads needed for simplified SOS
