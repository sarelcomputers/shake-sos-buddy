import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, ArrowLeft, Map, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapView } from '@/components/MapView';
import { ClusterMapView } from '@/components/ClusterMapView';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type SOSHistoryRow = Tables<'sos_history'>;

interface SOSHistoryEntry extends Omit<SOSHistoryRow, 'contacted_recipients'> {
  contacted_recipients: Array<{ name: string; phone: string }>;
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<SOSHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<SOSHistoryEntry | null>(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('sos_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('triggered_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map(entry => ({
        ...entry,
        contacted_recipients: Array.isArray(entry.contacted_recipients) 
          ? entry.contacted_recipients as Array<{ name: string; phone: string }>
          : []
      }));

      setHistory(typedData);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: 'Failed to load history',
        description: 'Could not fetch SOS history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-emergency bg-clip-text text-transparent">
                SOS History
              </h1>
              <p className="text-muted-foreground mt-1">
                View past emergency alerts and their locations
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {history.length} {history.length === 1 ? 'Alert' : 'Alerts'}
          </Badge>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No emergency alerts in history</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="cluster" className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                Cluster Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* History List */}
                <div className="space-y-4">
                  {history.map((entry) => (
                    <Card
                      key={entry.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedEntry?.id === entry.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          {formatDate(entry.triggered_at)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {entry.message}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{entry.contacts_count} contacts</span>
                          </div>
                        </div>
                        {entry.contacted_recipients && entry.contacted_recipients.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {entry.contacted_recipients.map((recipient, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {recipient.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Individual Map */}
                <div className="sticky top-4 h-[600px]">
                  <Card className="h-full overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg">Alert Location</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 h-[calc(100%-4rem)]">
                      {selectedEntry ? (
                        <MapView
                          key={selectedEntry.id}
                          latitude={selectedEntry.latitude}
                          longitude={selectedEntry.longitude}
                          message={selectedEntry.message}
                          timestamp={formatDate(selectedEntry.triggered_at)}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Select an alert to view its location
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cluster" className="mt-6">
              <Card className="h-[700px] overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>All Alert Locations</span>
                    <Badge variant="secondary">
                      {history.length} location{history.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Markers are clustered for better visualization. Click clusters to zoom in.
                  </p>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-8rem)]">
                  <ClusterMapView
                    locations={history.map(entry => ({
                      id: entry.id,
                      latitude: entry.latitude,
                      longitude: entry.longitude,
                      message: entry.message,
                      timestamp: formatDate(entry.triggered_at),
                      contacts_count: entry.contacts_count,
                    }))}
                    onMarkerClick={(id) => {
                      const entry = history.find(e => e.id === id);
                      if (entry) {
                        setSelectedEntry(entry);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default History;
