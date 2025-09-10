import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePaymentSettings } from '@/contexts/PaymentSettingsContext';

const PaymentSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency, currencies, setCurrency, formatPrice } = useCurrency();
  const { paymentSettings, updatePaymentSettings } = usePaymentSettings();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Payment settings have been updated successfully.",
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
          <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Currency & Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select 
                  value={currency.code} 
                  onValueChange={(code) => {
                    const selectedCurrency = currencies.find(c => c.code === code);
                    if (selectedCurrency) {
                      setCurrency(selectedCurrency);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.code} - {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input 
                  id="currencySymbol" 
                  value={currency.symbol}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceFormat">Price Format Preview</Label>
                <Input 
                  id="priceFormat" 
                  value={formatPrice(99.99)}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input 
                  id="bankName" 
                  placeholder="Enter bank name"
                  value={paymentSettings.bankName}
                  onChange={(e) => updatePaymentSettings({ bankName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input 
                  id="accountName" 
                  placeholder="Enter account holder name"
                  value={paymentSettings.accountName}
                  onChange={(e) => updatePaymentSettings({ accountName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input 
                  id="accountNumber" 
                  placeholder="Enter account number"
                  value={paymentSettings.accountNumber}
                  onChange={(e) => updatePaymentSettings({ accountNumber: e.target.value })}
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

export default PaymentSettings;