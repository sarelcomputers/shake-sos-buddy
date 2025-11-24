import { Network } from '@capacitor/network';

export interface WifiNetwork {
  ssid: string;
  signalStrength: string;
  connected: boolean;
}

export interface NetworkInfo {
  currentNetwork: {
    ssid: string;
    connectionType: string;
    connected: boolean;
  };
  nearbyNetworks: WifiNetwork[];
  timestamp: number;
}

export async function scanWifiNetworks(): Promise<NetworkInfo> {
  try {
    const status = await Network.getStatus();
    
    console.log('Network status:', status);

    // Note: Full WiFi scanning with SSID and signal strength of nearby networks
    // requires native plugins and special permissions on both iOS and Android.
    // This provides basic network info that's available through Capacitor.
    
    const networkInfo: NetworkInfo = {
      currentNetwork: {
        ssid: 'N/A', // Not available in web/basic Capacitor API
        connectionType: status.connectionType,
        connected: status.connected,
      },
      nearbyNetworks: [],
      timestamp: Date.now(),
    };

    // If on WiFi, we know at least one network
    if (status.connectionType === 'wifi' && status.connected) {
      networkInfo.nearbyNetworks.push({
        ssid: 'Connected Network',
        signalStrength: 'Unknown (Connected)',
        connected: true,
      });
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
    };
  }
}

export function formatWifiInfo(networkInfo: NetworkInfo): string {
  let formatted = `Network Scan (${new Date(networkInfo.timestamp).toLocaleString()})\n\n`;
  
  formatted += `Current Connection:\n`;
  formatted += `- Type: ${networkInfo.currentNetwork.connectionType}\n`;
  formatted += `- Connected: ${networkInfo.currentNetwork.connected ? 'Yes' : 'No'}\n`;
  formatted += `- SSID: ${networkInfo.currentNetwork.ssid}\n\n`;
  
  if (networkInfo.nearbyNetworks.length > 0) {
    formatted += `Nearby Networks:\n`;
    networkInfo.nearbyNetworks.forEach((network, index) => {
      formatted += `${index + 1}. ${network.ssid}\n`;
      formatted += `   Signal: ${network.signalStrength}\n`;
      formatted += `   Status: ${network.connected ? 'Connected' : 'Available'}\n`;
    });
  } else {
    formatted += `No nearby networks detected\n`;
    formatted += `(Note: Full WiFi scanning requires additional permissions)\n`;
  }
  
  return formatted;
}
