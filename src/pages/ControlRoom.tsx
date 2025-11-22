import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapView } from '@/components/MapView';
import { ClusterMapView } from '@/components/ClusterMapView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, Filter, MapPin, Phone, Clock, Smartphone, Wifi, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SOSAlert {
  id: string;
  user_id: string;
  message: string;
  latitude: number;
  longitude: number;
  triggered_at: string;
  contacts_count: number;
  contacted_recipients: Array<{ name: string; phone: string }>;
  device_model: string | null;
  device_serial: string | null;
  network_isp: string | null;
  wifi_info: { ssid: string; connected: boolean } | null;
  profiles?: {
    email: string;
  };
}

export default function ControlRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);

  // Check admin access
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  // Fetch all alerts
  useEffect(() => {
    if (!user || !isAdmin) return;

    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('sos_history')
          .select(`
            *,
            profiles (
              email
            )
          `)
          .order('triggered_at', { ascending: false });

        if (error) throw error;

        const typedData = (data || []).map(item => ({
          ...item,
          contacted_recipients: item.contacted_recipients as Array<{ name: string; phone: string }>,
          wifi_info: item.wifi_info as { ssid: string; connected: boolean } | null,
        }));

        setAlerts(typedData);
        setFilteredAlerts(typedData);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        toast.error('Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user, isAdmin]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('sos-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_history',
        },
        async (payload) => {
          console.log('New SOS alert received:', payload);
          
          // Fetch the full record with profile
          const { data } = await supabase
            .from('sos_history')
            .select(`
              *,
              profiles (
                email
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const typedData = {
              ...data,
              contacted_recipients: data.contacted_recipients as Array<{ name: string; phone: string }>,
              wifi_info: data.wifi_info as { ssid: string; connected: boolean } | null,
            };
            
            setAlerts((prev) => [typedData, ...prev]);
            setFilteredAlerts((prev) => [typedData, ...prev]);
            toast.error('🚨 New SOS Alert Received!', {
              description: `From ${typedData.profiles?.email || 'Unknown user'}`,
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  // Filter alerts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAlerts(alerts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = alerts.filter((alert) => {
      return (
        alert.profiles?.email?.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.device_model?.toLowerCase().includes(query) ||
        alert.device_serial?.toLowerCase().includes(query) ||
        alert.network_isp?.toLowerCase().includes(query) ||
        alert.wifi_info?.ssid?.toLowerCase().includes(query)
      );
    });

    setFilteredAlerts(filtered);
  }, [searchQuery, alerts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Control Room Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time SOS alert monitoring
              </p>
            </div>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            {filteredAlerts.length} Alerts
          </Badge>
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by email, message, device, network, WiFi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Alerts View */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No alerts found</p>
              </Card>
            ) : (
              <>
                {filteredAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className="p-6 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {alert.profiles?.email || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(alert.triggered_at)}
                              <span className="text-xs">
                                ({formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })})
                              </span>
                            </p>
                          </div>
                          <Badge variant="destructive">EMERGENCY</Badge>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong>Message:</strong> {alert.message}
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <strong>{alert.contacts_count} contacts notified</strong>
                          </p>
                          {alert.contacted_recipients.length > 0 && (
                            <div className="text-xs text-muted-foreground pl-6">
                              {alert.contacted_recipients.map((contact, idx) => (
                                <div key={idx}>
                                  {contact.name}: {contact.phone}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Lat: {alert.latitude.toFixed(6)}, Lng: {alert.longitude.toFixed(6)}
                          </p>
                          <a
                            href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open in Google Maps
                          </a>
                        </div>

                        {alert.device_model && (
                          <div>
                            <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              Device Info
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Model: {alert.device_model}
                            </p>
                            {alert.device_serial && (
                              <p className="text-xs text-muted-foreground">
                                Serial: {alert.device_serial}
                              </p>
                            )}
                          </div>
                        )}

                        {(alert.network_isp || alert.wifi_info) && (
                          <div>
                            <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                              <Wifi className="h-4 w-4" />
                              Network Info
                            </p>
                            {alert.network_isp && (
                              <p className="text-xs text-muted-foreground">
                                Network: {alert.network_isp}
                              </p>
                            )}
                            {alert.wifi_info && (
                              <p className="text-xs text-muted-foreground">
                                WiFi: {alert.wifi_info.ssid} ({alert.wifi_info.connected ? 'Connected' : 'Disconnected'})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="map">
            {filteredAlerts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No alerts to display on map</p>
              </Card>
            ) : (
              <div className="h-[600px]">
                <ClusterMapView
                  locations={filteredAlerts.map((alert) => ({
                    id: alert.id,
                    latitude: alert.latitude,
                    longitude: alert.longitude,
                    timestamp: formatDate(alert.triggered_at),
                    message: alert.message,
                    contacts_count: alert.contacts_count,
                  }))}
                  onMarkerClick={(id) => {
                    const fullAlert = filteredAlerts.find((a) => a.id === id);
                    if (fullAlert) setSelectedAlert(fullAlert);
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Selected Alert Details Modal */}
        {selectedAlert && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <Card
              className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-2xl font-bold">Alert Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAlert(null)}
                  >
                    Close
                  </Button>
                </div>

                <div className="h-[300px] rounded-lg overflow-hidden">
                  <MapView
                    latitude={selectedAlert.latitude}
                    longitude={selectedAlert.longitude}
                    message={selectedAlert.message}
                    timestamp={formatDate(selectedAlert.triggered_at)}
                  />
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <strong>User:</strong> {selectedAlert.profiles?.email || 'Unknown'}
                  </div>
                  <div>
                    <strong>Time:</strong> {formatDate(selectedAlert.triggered_at)}
                  </div>
                  <div>
                    <strong>Message:</strong> {selectedAlert.message}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}
                  </div>
                  {selectedAlert.device_model && (
                    <div>
                      <strong>Device:</strong> {selectedAlert.device_model}
                      {selectedAlert.device_serial && ` (${selectedAlert.device_serial})`}
                    </div>
                  )}
                  {selectedAlert.network_isp && (
                    <div>
                      <strong>Network:</strong> {selectedAlert.network_isp}
                    </div>
                  )}
                  {selectedAlert.wifi_info && (
                    <div>
                      <strong>WiFi:</strong> {selectedAlert.wifi_info.ssid}
                    </div>
                  )}
                  <div>
                    <strong>Contacts Notified ({selectedAlert.contacts_count}):</strong>
                    <ul className="list-disc list-inside pl-4 mt-1">
                      {selectedAlert.contacted_recipients.map((contact, idx) => (
                        <li key={idx}>
                          {contact.name}: {contact.phone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
