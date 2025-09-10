
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Holidays = () => {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState([
    { id: 1, name: 'New Year\'s Day', date: '2024-01-01' },
    { id: 2, name: 'Christmas Day', date: '2024-12-25' }
  ]);

  const addHoliday = () => {
    const newHoliday = {
      id: Date.now(),
      name: '',
      date: ''
    };
    setHolidays([...holidays, newHoliday]);
  };

  const removeHoliday = (id: number) => {
    setHolidays(holidays.filter(holiday => holiday.id !== id));
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
          <h1 className="text-3xl font-bold text-gray-900">Holidays</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Holiday Schedule</CardTitle>
              <Button onClick={addHoliday} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Holiday
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {holidays.map((holiday) => (
                <div key={holiday.id} className="grid grid-cols-3 gap-4 items-center">
                  <div className="grid gap-2">
                    <Label>Holiday Name</Label>
                    <Input 
                      value={holiday.name}
                      placeholder="Holiday name"
                      onChange={(e) => {
                        setHolidays(holidays.map(h => 
                          h.id === holiday.id ? { ...h, name: e.target.value } : h
                        ));
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      value={holiday.date}
                      onChange={(e) => {
                        setHolidays(holidays.map(h => 
                          h.id === holiday.id ? { ...h, date: e.target.value } : h
                        ));
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeHoliday(holiday.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Cancel
            </Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Holidays;
