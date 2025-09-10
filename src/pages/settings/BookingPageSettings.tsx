import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBookingTheme } from '@/contexts/BookingThemeContext';

const BookingPageSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, updateTheme } = useBookingTheme();
  
  const [localSettings, setLocalSettings] = useState({
    businessName: theme.businessName,
    businessSlogan: theme.businessSlogan,
    logo: theme.logo,
    showBookingProcess: theme.showBookingProcess
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        setLocalSettings(prev => ({ ...prev, logo: logoUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLocalSettings(prev => ({ ...prev, logo: '' }));
  };

  const handleSave = () => {
    updateTheme(localSettings);
    toast({
      title: "Settings saved",
      description: "Booking page customizations have been updated successfully.",
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
          <h1 className="text-3xl font-bold text-gray-900">Booking Page Settings</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input 
                  id="businessName"
                  value={localSettings.businessName}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Enter your business name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="businessSlogan">Business Slogan</Label>
                <Input 
                  id="businessSlogan"
                  value={localSettings.businessSlogan}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, businessSlogan: e.target.value }))}
                  placeholder="Enter your business slogan"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localSettings.logo ? (
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={localSettings.logo} 
                      alt="Business Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Logo uploaded successfully</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemoveLogo}
                      className="mt-2"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-4">Upload your business logo</p>
                  <Button variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                    Choose File
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showBookingProcess">Show Booking Process</Label>
                  <div className="text-sm text-gray-500">
                    Display the step-by-step progress indicator during booking
                  </div>
                </div>
                <Switch
                  id="showBookingProcess"
                  checked={localSettings.showBookingProcess}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, showBookingProcess: checked }))
                  }
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

export default BookingPageSettings;