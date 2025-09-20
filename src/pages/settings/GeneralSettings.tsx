
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

const GeneralSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    allowCancellation: true,
    requireConfirmation: false,
    enableGroupBooking: false,
    emailNotifications: true,
    smsNotifications: false
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "General settings have been updated successfully.",
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
          <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="timezone">Default Timezone</Label>
                <Input 
                  id="timezone" 
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  placeholder="UTC" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Input 
                  id="dateFormat" 
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                  placeholder="MM/DD/YYYY" 
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowCancellation">Allow Cancellation</Label>
                <Switch 
                  id="allowCancellation" 
                  checked={settings.allowCancellation}
                  onCheckedChange={(checked) => setSettings({...settings, allowCancellation: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireConfirmation">Require Confirmation</Label>
                <Switch 
                  id="requireConfirmation" 
                  checked={settings.requireConfirmation}
                  onCheckedChange={(checked) => setSettings({...settings, requireConfirmation: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enableGroupBooking">Enable Group Booking</Label>
                  <p className="text-sm text-gray-500">Allow customers to book appointments for multiple people</p>
                </div>
                <Switch 
                  id="enableGroupBooking" 
                  checked={settings.enableGroupBooking}
                  onCheckedChange={(checked) => setSettings({...settings, enableGroupBooking: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <Switch 
                  id="emailNotifications" 
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <Switch 
                  id="smsNotifications" 
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
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

export default GeneralSettings;
