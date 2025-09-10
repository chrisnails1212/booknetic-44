import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PaymentSettings {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface PaymentSettingsContextType {
  paymentSettings: PaymentSettings;
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => void;
}

const defaultPaymentSettings: PaymentSettings = {
  bankName: '',
  accountName: '',
  accountNumber: ''
};

const PaymentSettingsContext = createContext<PaymentSettingsContextType | undefined>(undefined);

export const PaymentSettingsProvider = ({ children }: { children: ReactNode }) => {
  // Initialize payment settings from localStorage or use default
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('paymentSettings');
      return savedSettings ? JSON.parse(savedSettings) : defaultPaymentSettings;
    } catch {
      return defaultPaymentSettings;
    }
  });

  const updatePaymentSettings = (updates: Partial<PaymentSettings>) => {
    const newSettings = { ...paymentSettings, ...updates };
    console.log('PaymentSettings: Updating from', paymentSettings, 'to', newSettings);
    setPaymentSettings(newSettings);
    // Persist to localStorage
    localStorage.setItem('paymentSettings', JSON.stringify(newSettings));
    console.log('PaymentSettings: Settings saved to localStorage');
  };

  return (
    <PaymentSettingsContext.Provider value={{ paymentSettings, updatePaymentSettings }}>
      {children}
    </PaymentSettingsContext.Provider>
  );
};

export const usePaymentSettings = () => {
  const context = useContext(PaymentSettingsContext);
  if (context === undefined) {
    throw new Error('usePaymentSettings must be used within a PaymentSettingsProvider');
  }
  return context;
};