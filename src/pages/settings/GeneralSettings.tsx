
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const GeneralSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load settings from localStorage on initialization
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('businessSettings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          timezone: parsed.timezone || 'UTC',
          dateFormat: parsed.dateFormat || 'MM/DD/YYYY',
          allowCancellation: parsed.allowCancellation ?? true,
          requireConfirmation: parsed.requireConfirmation ?? false,
          emailNotifications: parsed.emailNotifications ?? true,
          smsNotifications: parsed.smsNotifications ?? false,
          cancellationCutoff: parsed.cancellationCutoff || '24h',
          rescheduleCutoff: parsed.rescheduleCutoff || '24h',
          autoApproveBookings: parsed.autoApproveBookings ?? false,
          autoCompleteBookings: parsed.autoCompleteBookings ?? true,
          autoNoShowDetection: parsed.autoNoShowDetection ?? false,
          noShowHours: parsed.noShowHours || 2
        };
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    }
    
    // Default settings if none found
    return {
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      allowCancellation: true,
      requireConfirmation: false,
      emailNotifications: true,
      smsNotifications: false,
      cancellationCutoff: '24h',
      rescheduleCutoff: '24h',
      autoApproveBookings: false,
      autoCompleteBookings: true,
      autoNoShowDetection: false,
      noShowHours: 2
    };
  });

  const handleSave = () => {
    // Save settings to localStorage for global access
    localStorage.setItem('businessSettings', JSON.stringify(settings));
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cancellation & Reschedule Rules
              </CardTitle>
              <CardDescription>
                Define how far in advance customers must cancel or reschedule appointments. Admins can always override these rules manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cancellationCutoff">Cancellation Cut-off Time</Label>
                  <Select value={settings.cancellationCutoff} onValueChange={(value) => setSettings({...settings, cancellationCutoff: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cut-off time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-limit">No limit</SelectItem>
                      <SelectItem value="6h">6 hours before</SelectItem>
                      <SelectItem value="12h">12 hours before</SelectItem>
                      <SelectItem value="24h">24 hours before</SelectItem>
                      <SelectItem value="48h">48 hours before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rescheduleCutoff">Reschedule Cut-off Time</Label>
                  <Select value={settings.rescheduleCutoff} onValueChange={(value) => setSettings({...settings, rescheduleCutoff: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cut-off time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-limit">No limit</SelectItem>
                      <SelectItem value="6h">6 hours before</SelectItem>
                      <SelectItem value="12h">12 hours before</SelectItem>
                      <SelectItem value="24h">24 hours before</SelectItem>
                      <SelectItem value="48h">48 hours before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These rules will be automatically enforced in the customer portal and booking confirmations. 
                  Admins can always override these policies manually from their dashboard when needed.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Booking Rules</CardTitle>
              <CardDescription>
                Configure automatic booking status changes to streamline your appointment management.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="autoApproveBookings">Auto-Approve Bookings</Label>
                    <p className="text-sm text-muted-foreground">
                      New bookings instantly go from Pending → Approved
                    </p>
                  </div>
                  <Switch 
                    id="autoApproveBookings" 
                    checked={settings.autoApproveBookings}
                    onCheckedChange={(checked) => setSettings({...settings, autoApproveBookings: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="autoCompleteBookings">Auto-Complete Bookings</Label>
                    <p className="text-sm text-muted-foreground">
                      Mark approved bookings as Completed after end time passes
                    </p>
                  </div>
                  <Switch 
                    id="autoCompleteBookings" 
                    checked={settings.autoCompleteBookings}
                    onCheckedChange={(checked) => setSettings({...settings, autoCompleteBookings: checked})}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="autoNoShowDetection">Auto-No-Show Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Mark as No-show if not completed/checked-in within specified hours
                      </p>
                    </div>
                    <Switch 
                      id="autoNoShowDetection" 
                      checked={settings.autoNoShowDetection}
                      onCheckedChange={(checked) => setSettings({...settings, autoNoShowDetection: checked})}
                    />
                  </div>
                  
                  {settings.autoNoShowDetection && (
                    <div className="grid gap-2 ml-4">
                      <Label htmlFor="noShowHours">Mark as no-show after</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="noShowHours" 
                          type="number"
                          min="1"
                          max="72"
                          value={settings.noShowHours}
                          onChange={(e) => setSettings({...settings, noShowHours: parseInt(e.target.value) || 2})}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">hours after appointment time</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Auto-booking rules help reduce manual administrative work. 
                  Admins can always override these automated status changes manually when needed.
                </p>
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
