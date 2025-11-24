import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, ArrowLeft, Map, List, Download, Smartphone, Share2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleMapView } from '@/components/GoogleMapView';
import { GoogleClusterMapView } from '@/components/GoogleClusterMapView';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import jsPDF from 'jspdf';
import alfa22Logo from '@/assets/alfa22-logo.png';

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

  const generateReportText = () => {
    let report = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    report += '      ALFA22 SOS HISTORY REPORT\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Total Alerts: ${history.length}\n\n`;

    history.forEach((entry, index) => {
      report += `━━ Alert #${index + 1} ━━━━━━━━━━━━━━━━━━━\n`;
      report += `Date: ${formatDate(entry.triggered_at)}\n`;
      report += `Location: ${entry.latitude.toFixed(6)}, ${entry.longitude.toFixed(6)}\n`;
      report += `Message: ${entry.message}\n`;
      report += `Contacts Notified: ${entry.contacts_count}\n`;
      
      if (entry.device_model) {
        report += `Device: ${entry.device_model}\n`;
      }
      
      if (entry.contacted_recipients && entry.contacted_recipients.length > 0) {
        report += '\nRecipients:\n';
        entry.contacted_recipients.forEach((recipient) => {
          report += `  • ${recipient.name} (${recipient.phone})\n`;
        });
      }
      
      report += '\n';
    });

    return report;
  };

  const shareViaWhatsApp = () => {
    const reportText = generateReportText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'Opening WhatsApp',
      description: 'Report ready to share',
    });
  };

  const shareViaEmail = () => {
    const reportText = generateReportText();
    const subject = `Alfa22 SOS History Report - ${new Date().toLocaleDateString()}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportText)}`;
    window.location.href = mailtoUrl;
    
    toast({
      title: 'Opening Email',
      description: 'Report ready to send',
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPosition = 30;

    // Add logo
    const img = new Image();
    img.src = alfa22Logo;
    doc.addImage(img, 'PNG', 20, 10, 30, 15);

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ALFA22 SOS History Report', 55, 20);
    
    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 55, 26);
    doc.text(`Total Alerts: ${history.length}`, 55, 31);
    
    // Line separator
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 35, 190, 35);
    yPosition = 45;

    // History entries
    history.forEach((entry, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Alert #${index + 1}`, 20, yPosition);
      yPosition += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Date & Time
      doc.text(`Date: ${formatDate(entry.triggered_at)}`, 25, yPosition);
      yPosition += 5;

      // Location
      doc.text(`Location: ${entry.latitude.toFixed(6)}, ${entry.longitude.toFixed(6)}`, 25, yPosition);
      yPosition += 5;

      // Message
      doc.text(`Message: ${entry.message.substring(0, 80)}`, 25, yPosition);
      yPosition += 5;

      // Contacts
      doc.text(`Contacts Notified: ${entry.contacts_count}`, 25, yPosition);
      yPosition += 5;

      // Device Information
      if (entry.device_model) {
        doc.text(`Device: ${entry.device_model}`, 25, yPosition);
        yPosition += 5;
      }

      if (entry.device_serial) {
        doc.text(`Serial: ${entry.device_serial}`, 25, yPosition);
        yPosition += 5;
      }

      if (entry.network_isp) {
        doc.text(`Network: ${entry.network_isp}`, 25, yPosition);
        yPosition += 5;
      }

      if (entry.wifi_info) {
        const wifiData = entry.wifi_info as { ssid?: string };
        doc.text(`WiFi: ${wifiData.ssid || 'Unknown'}`, 25, yPosition);
        yPosition += 5;
      }

      // Recipients
      if (entry.contacted_recipients && entry.contacted_recipients.length > 0) {
        doc.text('Recipients:', 25, yPosition);
        yPosition += 5;
        entry.contacted_recipients.forEach((recipient) => {
          doc.text(`  - ${recipient.name} (${recipient.phone})`, 30, yPosition);
          yPosition += 5;
        });
      }

      yPosition += 5; // Space between entries
    });

    // Save the PDF
    doc.save(`alfa22-sos-history-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: 'PDF Exported',
      description: 'SOS history has been exported successfully',
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
          <div className="flex items-center gap-3">
            <Button
              onClick={shareViaWhatsApp}
              variant="outline"
              className="flex items-center gap-2"
              disabled={history.length === 0}
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="outline"
              className="flex items-center gap-2"
              disabled={history.length === 0}
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button
              onClick={exportToPDF}
              variant="outline"
              className="flex items-center gap-2"
              disabled={history.length === 0}
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {history.length} {history.length === 1 ? 'Alert' : 'Alerts'}
            </Badge>
          </div>
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
                        {(entry.device_model || entry.network_isp) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
                            <Smartphone className="w-3 h-3" />
                            <span>
                              {entry.device_model && `${entry.device_model}`}
                              {entry.device_model && entry.network_isp && ' • '}
                              {entry.network_isp && `${entry.network_isp}`}
                            </span>
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
                        <GoogleMapView
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
                  <GoogleClusterMapView
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
