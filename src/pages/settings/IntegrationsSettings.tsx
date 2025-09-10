
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

const IntegrationsSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    enableGoogleCal: false,
    googleApiKey: '',
    enableZoom: false,
    zoomApiKey: '',
    zoomApiSecret: '',
    enableZapier: false,
    zapierWebhook: ''
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Integration settings have been updated successfully.",
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
          <h1 className="text-3xl font-bold text-gray-900">Integrations Settings</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Google Calendar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableGoogleCal">Enable Google Calendar Sync</Label>
                <Switch 
                  id="enableGoogleCal" 
                  checked={settings.enableGoogleCal}
                  onCheckedChange={(checked) => setSettings({...settings, enableGoogleCal: checked})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="googleApiKey">Google API Key</Label>
                <Input 
                  id="googleApiKey" 
                  type="password" 
                  value={settings.googleApiKey}
                  onChange={(e) => setSettings({...settings, googleApiKey: e.target.value})}
                  placeholder="••••••••" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zoom Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableZoom">Enable Zoom Meetings</Label>
                <Switch 
                  id="enableZoom" 
                  checked={settings.enableZoom}
                  onCheckedChange={(checked) => setSettings({...settings, enableZoom: checked})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zoomApiKey">Zoom API Key</Label>
                <Input 
                  id="zoomApiKey" 
                  type="password" 
                  value={settings.zoomApiKey}
                  onChange={(e) => setSettings({...settings, zoomApiKey: e.target.value})}
                  placeholder="••••••••" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zoomApiSecret">Zoom API Secret</Label>
                <Input 
                  id="zoomApiSecret" 
                  type="password" 
                  value={settings.zoomApiSecret}
                  onChange={(e) => setSettings({...settings, zoomApiSecret: e.target.value})}
                  placeholder="••••••••" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zapier Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableZapier">Enable Zapier Integration</Label>
                <Switch 
                  id="enableZapier" 
                  checked={settings.enableZapier}
                  onCheckedChange={(checked) => setSettings({...settings, enableZapier: checked})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zapierWebhook">Webhook URL</Label>
                <Input 
                  id="zapierWebhook" 
                  value={settings.zapierWebhook}
                  onChange={(e) => setSettings({...settings, zapierWebhook: e.target.value})}
                  placeholder="https://hooks.zapier.com/..." 
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

export default IntegrationsSettings;
