
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const FrontendPanels = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    panelTitle: 'Book an Appointment',
    welcomeMessage: 'Welcome! Please select your service.',
    showPrice: true,
    showDuration: true,
    dashboardTitle: 'My Appointments',
    allowRescheduling: true,
    showHistory: true
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Frontend panel settings have been updated successfully.",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/settings')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Front-end Panels</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Booking Panel Customization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="panelTitle">Panel Title</Label>
                <Input 
                  id="panelTitle" 
                  value={settings.panelTitle}
                  onChange={(e) => setSettings({...settings, panelTitle: e.target.value})}
                  placeholder="Book an Appointment" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Input 
                  id="welcomeMessage" 
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings({...settings, welcomeMessage: e.target.value})}
                  placeholder="Welcome! Please select your service." 
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showPrice">Show Prices</Label>
                <Switch 
                  id="showPrice" 
                  checked={settings.showPrice}
                  onCheckedChange={(checked) => setSettings({...settings, showPrice: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showDuration">Show Duration</Label>
                <Switch 
                  id="showDuration" 
                  checked={settings.showDuration}
                  onCheckedChange={(checked) => setSettings({...settings, showDuration: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Panel Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="dashboardTitle">Dashboard Title</Label>
                <Input 
                  id="dashboardTitle" 
                  value={settings.dashboardTitle}
                  onChange={(e) => setSettings({...settings, dashboardTitle: e.target.value})}
                  placeholder="My Appointments" 
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowRescheduling">Allow Rescheduling</Label>
                <Switch 
                  id="allowRescheduling" 
                  checked={settings.allowRescheduling}
                  onCheckedChange={(checked) => setSettings({...settings, allowRescheduling: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showHistory">Show Appointment History</Label>
                <Switch 
                  id="showHistory" 
                  checked={settings.showHistory}
                  onCheckedChange={(checked) => setSettings({...settings, showHistory: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FrontendPanels;
