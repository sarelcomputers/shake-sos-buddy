import { Network } from '@capacitor/network';

export interface WifiNetwork {
  ssid: string;
  signalStrength: string;
  connected: boolean;
  bssid?: string;
  frequency?: number;
  level?: number;
}

export interface NetworkInfo {
  currentNetwork: {
    ssid: string;
    connectionType: string;
    connected: boolean;
  };
  nearbyNetworks: WifiNetwork[];
  timestamp: number;
  limitedScan: boolean;
}

export async function scanWifiNetworks(): Promise<NetworkInfo> {
  try {
    const status = await Network.getStatus();
    
    console.log('Network status:', status);

    const networkInfo: NetworkInfo = {
      currentNetwork: {
        ssid: 'N/A',
        connectionType: status.connectionType,
        connected: status.connected,
      },
      nearbyNetworks: [],
      timestamp: Date.now(),
      limitedScan: true, // Indicates this is a limited scan
    };

    // Basic network info - Capacitor's Network API has limited capabilities
    // Full WiFi scanning requires native plugins with location permissions
    if (status.connectionType === 'wifi' && status.connected) {
      // We can at least detect that we're on WiFi
      networkInfo.nearbyNetworks.push({
        ssid: 'Connected WiFi Network',
        signalStrength: 'Active Connection',
        connected: true,
      });
      networkInfo.currentNetwork.ssid = 'Connected WiFi Network';
    } else if (status.connectionType === 'cellular') {
      networkInfo.currentNetwork.ssid = 'Cellular Network';
    } else if (status.connectionType === 'none') {
      networkInfo.currentNetwork.ssid = 'No Connection';
    }

    return networkInfo;
  } catch (error) {
    console.error('Error scanning WiFi networks:', error);
    return {
      currentNetwork: {
        ssid: 'Error',
        connectionType: 'unknown',
        connected: false,
      },
      nearbyNetworks: [],
      timestamp: Date.now(),
      limitedScan: true,
    };
  }
}

export function formatWifiInfo(networkInfo: NetworkInfo): string {
  let formatted = `Network Information (${new Date(networkInfo.timestamp).toLocaleString()})\n\n`;
  
  formatted += `Connection Status:\n`;
  formatted += `- Type: ${networkInfo.currentNetwork.connectionType.toUpperCase()}\n`;
  formatted += `- Connected: ${networkInfo.currentNetwork.connected ? 'Yes' : 'No'}\n`;
  formatted += `- Network: ${networkInfo.currentNetwork.ssid}\n\n`;
  
  if (networkInfo.nearbyNetworks.length > 0) {
    formatted += `Detected Networks (${networkInfo.nearbyNetworks.length}):\n`;
    networkInfo.nearbyNetworks.forEach((network, index) => {
      formatted += `${index + 1}. ${network.ssid}\n`;
      formatted += `   Signal: ${network.signalStrength}\n`;
      if (network.bssid) formatted += `   BSSID: ${network.bssid}\n`;
      if (network.frequency) formatted += `   Frequency: ${network.frequency} MHz\n`;
      formatted += `   Status: ${network.connected ? '✓ Connected' : 'Available'}\n`;
    });
  } else {
    formatted += `Note: Detailed WiFi scanning is limited in web/mobile environments\n`;
    formatted += `Only basic connection information is available\n`;
  }
  
  return formatted;
}
