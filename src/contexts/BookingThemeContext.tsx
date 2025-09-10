
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BookingTheme {
  styleName: string;
  panelBackground: string;
  primaryColor: string;
  completedColor: string;
  activeColor: string;
  businessName: string;
  businessSlogan: string;
  logo: string;
  showBookingProcess: boolean;
  website: string;
  phone: string;
  email: string;
  address: string;
}

interface BookingThemeContextType {
  theme: BookingTheme;
  updateTheme: (updates: Partial<BookingTheme>) => void;
}

const defaultTheme: BookingTheme = {
  styleName: 'Default style',
  panelBackground: '#2563eb',
  primaryColor: '#2563eb',
  completedColor: '#10b981',
  activeColor: '#3b82f6',
  businessName: 'Elite Hair Salon',
  businessSlogan: 'Book your appointment online',
  logo: '',
  showBookingProcess: false,
  website: '',
  phone: '',
  email: '',
  address: ''
};

const BookingThemeContext = createContext<BookingThemeContextType | undefined>(undefined);

export const BookingThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme from localStorage or use default
  const [theme, setTheme] = useState<BookingTheme>(() => {
    try {
      const savedTheme = localStorage.getItem('bookingTheme');
      return savedTheme ? JSON.parse(savedTheme) : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const updateTheme = (updates: Partial<BookingTheme>) => {
    const newTheme = { ...theme, ...updates };
    console.log('BookingTheme: Updating theme from', theme, 'to', newTheme);
    setTheme(newTheme);
    // Persist to localStorage
    localStorage.setItem('bookingTheme', JSON.stringify(newTheme));
    console.log('BookingTheme: Theme saved to localStorage');
  };

  return (
    <BookingThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </BookingThemeContext.Provider>
  );
};

export const useBookingTheme = () => {
  const context = useContext(BookingThemeContext);
  if (context === undefined) {
    throw new Error('useBookingTheme must be used within a BookingThemeProvider');
  }
  return context;
};
