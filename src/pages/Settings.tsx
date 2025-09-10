
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Settings as SettingsIcon, Calendar, CreditCard, Building, Clock, Users, Mail, Puzzle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const settingsOptions = [
  {
    icon: SettingsIcon,
    title: 'General settings',
    description: 'You can customize general settings about booking from here',
    color: 'bg-green-500',
    path: '/settings/general'
  },
  {
    icon: Calendar,
    title: 'Booking Page',
    description: 'Customize your booking page logo, business name and slogan',
    color: 'bg-blue-600',
    path: '/settings/booking-page'
  },
  {
    icon: Calendar,
    title: 'Front-end panels',
    description: 'You can customize booking and customer panel and change labels from here',
    color: 'bg-pink-500',
    path: '/settings/frontend-panels'
  },
  {
    icon: CreditCard,
    title: 'Payment settings',
    description: 'Currency, price format, general settings about payment, payment',
    color: 'bg-cyan-500',
    path: '/settings/payment'
  },
  {
    icon: Building,
    title: 'Business details',
    description: 'Enter your business name, logo, address, phone number, website from here',
    color: 'bg-purple-500',
    path: '/settings/business'
  },
  {
    icon: Mail,
    title: 'Email settings',
    description: 'You must set this settings for email workflow action ( wp_mail or SMTP settings )',
    color: 'bg-blue-500',
    path: '/settings/email'
  },
  {
    icon: Puzzle,
    title: 'Integrations settings',
    description: 'You can change settings for integrated services from here.',
    color: 'bg-gray-600',
    path: '/settings/integrations'
  }
];

const Settings = () => {
  const navigate = useNavigate();

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {settingsOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleCardClick(option.path)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{option.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{option.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
