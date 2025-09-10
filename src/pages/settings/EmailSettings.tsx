
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

const EmailSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    useWpMail: false,
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    useSSL: true,
    fromName: '',
    fromEmail: '',
    emailSubject: 'Appointment Confirmation'
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Email settings have been updated successfully.",
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
          <h1 className="text-3xl font-bold text-gray-900">Email Settings</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="useWpMail">Use WordPress Mail</Label>
                <Switch 
                  id="useWpMail" 
                  checked={settings.useWpMail}
                  onCheckedChange={(checked) => setSettings({...settings, useWpMail: checked})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input 
                  id="smtpHost" 
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                  placeholder="smtp.gmail.com" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input 
                  id="smtpPort" 
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
                  placeholder="587" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input 
                  id="smtpUsername" 
                  value={settings.smtpUsername}
                  onChange={(e) => setSettings({...settings, smtpUsername: e.target.value})}
                  placeholder="your-email@gmail.com" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input 
                  id="smtpPassword" 
                  type="password" 
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
                  placeholder="••••••••" 
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="useSSL">Use SSL/TLS</Label>
                <Switch 
                  id="useSSL" 
                  checked={settings.useSSL}
                  onCheckedChange={(checked) => setSettings({...settings, useSSL: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input 
                  id="fromName" 
                  value={settings.fromName}
                  onChange={(e) => setSettings({...settings, fromName: e.target.value})}
                  placeholder="Your Company Name" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input 
                  id="fromEmail" 
                  value={settings.fromEmail}
                  onChange={(e) => setSettings({...settings, fromEmail: e.target.value})}
                  placeholder="noreply@yourcompany.com" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emailSubject">Default Subject</Label>
                <Input 
                  id="emailSubject" 
                  value={settings.emailSubject}
                  onChange={(e) => setSettings({...settings, emailSubject: e.target.value})}
                  placeholder="Appointment Confirmation" 
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

export default EmailSettings;
