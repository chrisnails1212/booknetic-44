
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

const BusinessHours = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const [settings, setSettings] = useState({
    workingDays: {
      Monday: { enabled: true, start: '09:00', end: '17:00' },
      Tuesday: { enabled: true, start: '09:00', end: '17:00' },
      Wednesday: { enabled: true, start: '09:00', end: '17:00' },
      Thursday: { enabled: true, start: '09:00', end: '17:00' },
      Friday: { enabled: true, start: '09:00', end: '17:00' },
      Saturday: { enabled: false, start: '09:00', end: '17:00' },
      Sunday: { enabled: false, start: '09:00', end: '17:00' }
    },
    lunchStart: '12:00',
    lunchEnd: '13:00'
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Business hours have been updated successfully.",
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
          <h1 className="text-3xl font-bold text-gray-900">Business Hours</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="grid grid-cols-4 gap-4 items-center">
                  <Label className="font-medium">{day}</Label>
                  <Switch 
                    checked={settings.workingDays[day as keyof typeof settings.workingDays].enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      workingDays: {
                        ...settings.workingDays,
                        [day]: { ...settings.workingDays[day as keyof typeof settings.workingDays], enabled: checked }
                      }
                    })}
                  />
                  <Input 
                    type="time" 
                    value={settings.workingDays[day as keyof typeof settings.workingDays].start}
                    onChange={(e) => setSettings({
                      ...settings,
                      workingDays: {
                        ...settings.workingDays,
                        [day]: { ...settings.workingDays[day as keyof typeof settings.workingDays], start: e.target.value }
                      }
                    })}
                    placeholder="09:00" 
                  />
                  <Input 
                    type="time" 
                    value={settings.workingDays[day as keyof typeof settings.workingDays].end}
                    onChange={(e) => setSettings({
                      ...settings,
                      workingDays: {
                        ...settings.workingDays,
                        [day]: { ...settings.workingDays[day as keyof typeof settings.workingDays], end: e.target.value }
                      }
                    })}
                    placeholder="17:00" 
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Break Times</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="lunchStart">Lunch Break Start</Label>
                <Input 
                  id="lunchStart" 
                  type="time" 
                  value={settings.lunchStart}
                  onChange={(e) => setSettings({...settings, lunchStart: e.target.value})}
                  placeholder="12:00" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lunchEnd">Lunch Break End</Label>
                <Input 
                  id="lunchEnd" 
                  type="time" 
                  value={settings.lunchEnd}
                  onChange={(e) => setSettings({...settings, lunchEnd: e.target.value})}
                  placeholder="13:00" 
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

export default BusinessHours;
