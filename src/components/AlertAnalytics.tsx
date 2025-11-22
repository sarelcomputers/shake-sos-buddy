import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, startOfDay, startOfHour, differenceInDays, parseISO } from 'date-fns';
import { MapPin, Clock, TrendingUp, Users, AlertTriangle } from 'lucide-react';

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
  profiles?: {
    email: string;
  };
}

interface AlertAnalyticsProps {
  alerts: SOSAlert[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AlertAnalytics({ alerts }: AlertAnalyticsProps) {
  // Calculate trends over time (daily aggregation)
  const timelineTrends = useMemo(() => {
    if (alerts.length === 0) return [];

    const grouped = alerts.reduce((acc, alert) => {
      const date = format(startOfDay(parseISO(alert.triggered_at)), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, count: 0, users: new Set() };
      }
      acc[date].count++;
      acc[date].users.add(alert.user_id);
      return acc;
    }, {} as Record<string, { date: string; count: number; users: Set<string> }>);

    return Object.values(grouped)
      .map(({ date, count, users }) => ({
        date,
        alerts: count,
        users: users.size,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-30); // Last 30 days
  }, [alerts]);

  // Calculate peak hours
  const peakHours = useMemo(() => {
    if (alerts.length === 0) return [];

    const grouped = alerts.reduce((acc, alert) => {
      const hour = new Date(alert.triggered_at).getHours();
      if (!acc[hour]) {
        acc[hour] = 0;
      }
      acc[hour]++;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      alerts: grouped[i] || 0,
    }));
  }, [alerts]);

  // Calculate geographic distribution (group by approximate regions using lat/lng)
  const geographicDistribution = useMemo(() => {
    if (alerts.length === 0) return [];

    const regionMap: Record<string, { count: number; avgLat: number; avgLng: number; sumLat: number; sumLng: number }> = {};

    alerts.forEach(alert => {
      // Round coordinates to create rough regions (0.1 degree precision ≈ 11km)
      const regionKey = `${Math.round(alert.latitude * 10) / 10},${Math.round(alert.longitude * 10) / 10}`;
      
      if (!regionMap[regionKey]) {
        regionMap[regionKey] = { count: 0, avgLat: 0, avgLng: 0, sumLat: 0, sumLng: 0 };
      }
      
      regionMap[regionKey].count++;
      regionMap[regionKey].sumLat += alert.latitude;
      regionMap[regionKey].sumLng += alert.longitude;
    });

    return Object.entries(regionMap)
      .map(([region, data]) => ({
        region: `${(data.sumLat / data.count).toFixed(2)}, ${(data.sumLng / data.count).toFixed(2)}`,
        alerts: data.count,
        lat: data.sumLat / data.count,
        lng: data.sumLng / data.count,
      }))
      .sort((a, b) => b.alerts - a.alerts)
      .slice(0, 10);
  }, [alerts]);

  // Device distribution
  const deviceDistribution = useMemo(() => {
    if (alerts.length === 0) return [];

    const grouped = alerts.reduce((acc, alert) => {
      const device = alert.device_model || 'Unknown';
      if (!acc[device]) {
        acc[device] = 0;
      }
      acc[device]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [alerts]);

  // Summary statistics
  const stats = useMemo(() => {
    const uniqueUsers = new Set(alerts.map(a => a.user_id)).size;
    const totalContacts = alerts.reduce((sum, a) => sum + a.contacts_count, 0);
    const avgContactsPerAlert = alerts.length > 0 ? (totalContacts / alerts.length).toFixed(1) : '0';
    
    const now = new Date();
    const last24h = alerts.filter(a => {
      const alertDate = new Date(a.triggered_at);
      return differenceInDays(now, alertDate) < 1;
    }).length;

    const last7days = alerts.filter(a => {
      const alertDate = new Date(a.triggered_at);
      return differenceInDays(now, alertDate) < 7;
    }).length;

    return {
      totalAlerts: alerts.length,
      uniqueUsers,
      totalContacts,
      avgContactsPerAlert,
      last24h,
      last7days,
    };
  }, [alerts]);

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Alert Data</h3>
        <p className="text-muted-foreground">
          Analytics will appear here once alerts are recorded
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalAlerts}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.last24h} in last 24h
              </p>
            </div>
            <AlertTriangle className="h-10 w-10 text-destructive opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
              <h3 className="text-3xl font-bold mt-2">{stats.uniqueUsers}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.last7days} alerts this week
              </p>
            </div>
            <Users className="h-10 w-10 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contacts Notified</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalContacts}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {stats.avgContactsPerAlert} per alert
              </p>
            </div>
            <MapPin className="h-10 w-10 text-chart-1 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Response Time</p>
              <h3 className="text-3xl font-bold mt-2">
                {peakHours.reduce((max, h) => h.alerts > max.alerts ? h : max, peakHours[0])?.hour || 'N/A'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Peak alert hour
              </p>
            </div>
            <Clock className="h-10 w-10 text-chart-2 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Alert Trends Over Time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Alert Trends Over Time
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Daily alert volume and unique users (last 30 days)
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineTrends}>
            <defs>
              <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="alerts" 
              stroke="hsl(var(--destructive))" 
              fillOpacity={1}
              fill="url(#colorAlerts)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1}
              fill="url(#colorUsers)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Peak Alert Hours
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Distribution of alerts by hour of day
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval={2}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="alerts" 
                fill="hsl(var(--chart-2))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Device Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Device Distribution</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Most common devices triggering alerts
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ device, percent }) => `${device}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {deviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geographic Hotspots
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Top 10 locations with most alerts (approximate regions)
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={geographicDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="category" 
              dataKey="region" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              width={120}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">Location: {data.region}</p>
                      <p className="text-sm">Alerts: {data.alerts}</p>
                      <a 
                        href={`https://maps.google.com/?q=${data.lat},${data.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="alerts" 
              fill="hsl(var(--chart-3))" 
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
