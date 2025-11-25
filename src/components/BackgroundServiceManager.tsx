import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, MapPin, Mic, Battery, Bell, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  requestAllBackgroundPermissions,
  type PermissionStatus,
} from '@/utils/androidPermissions';
import {
  startForegroundService,
  stopForegroundService,
} from '@/utils/androidForegroundService';

interface BackgroundServiceManagerProps {
  isEnabled: boolean;
  onPermissionsComplete?: () => void;
}

export const BackgroundServiceManager = ({
  isEnabled,
  onPermissionsComplete,
}: BackgroundServiceManagerProps) => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    location: false,
    microphone: false,
    batteryOptimization: false,
    notification: false,
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [serviceRunning, setServiceRunning] = useState(false);

  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  useEffect(() => {
    if (isNativeAndroid && isEnabled && !serviceRunning) {
      handleStartService();
    } else if ((!isEnabled || !isNativeAndroid) && serviceRunning) {
      handleStopService();
    }
  }, [isEnabled, isNativeAndroid]);

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    try {
      const status = await requestAllBackgroundPermissions();
      setPermissionStatus(status);
      
      const allGranted = Object.values(status).every((granted) => granted);
      if (allGranted && onPermissionsComplete) {
        onPermissionsComplete();
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleStartService = async () => {
    const started = await startForegroundService();
    setServiceRunning(started);
  };

  const handleStopService = async () => {
    await stopForegroundService();
    setServiceRunning(false);
  };

  if (!isNativeAndroid) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Background Services
          </CardTitle>
          <CardDescription>
            Background services are only available on Android devices
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const allPermissionsGranted = Object.values(permissionStatus).every((granted) => granted);

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Background Services
        </CardTitle>
        <CardDescription>
          Enable all necessary permissions for the app to work in the background and on locked screens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Permission Status</h4>
          <div className="grid gap-2">
            <PermissionItem
              icon={<MapPin className="w-4 h-4" />}
              label="Location (Always)"
              granted={permissionStatus.location}
            />
            <PermissionItem
              icon={<Mic className="w-4 h-4" />}
              label="Microphone"
              granted={permissionStatus.microphone}
            />
            <PermissionItem
              icon={<Battery className="w-4 h-4" />}
              label="Battery Optimization"
              granted={permissionStatus.batteryOptimization}
            />
            <PermissionItem
              icon={<Bell className="w-4 h-4" />}
              label="Notifications"
              granted={permissionStatus.notification}
            />
          </div>
        </div>

        {/* Foreground Service Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Foreground Service</h4>
          <div className="flex items-center gap-2">
            {serviceRunning ? (
              <>
                <Badge variant="default" className="bg-primary">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Running
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Service is active and monitoring
                </span>
              </>
            ) : (
              <>
                <Badge variant="secondary">
                  <XCircle className="w-3 h-3 mr-1" />
                  Stopped
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Service is not running
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!allPermissionsGranted && (
          <Button
            onClick={handleRequestPermissions}
            disabled={isRequesting}
            className="w-full"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Requesting Permissions...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Enable Background Services
              </>
            )}
          </Button>
        )}

        {allPermissionsGranted && (
          <div className="text-center text-sm text-muted-foreground">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-primary" />
            All permissions granted. Background services will start when SOS is enabled.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PermissionItem = ({
  icon,
  label,
  granted,
}: {
  icon: React.ReactNode;
  label: string;
  granted: boolean;
}) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    {granted ? (
      <CheckCircle2 className="w-4 h-4 text-primary" />
    ) : (
      <XCircle className="w-4 h-4 text-muted-foreground" />
    )}
  </div>
);
