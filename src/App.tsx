
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BookingThemeProvider } from "@/contexts/BookingThemeContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { PaymentSettingsProvider } from "@/contexts/PaymentSettingsContext";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Appointments from "./pages/Appointments";
import Calendar from "./pages/Calendar";
import Customers from "./pages/Customers";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import Locations from "./pages/Locations";
import Coupons from "./pages/Coupons";
import NotFound from "./pages/NotFound";
import Giftcards from "./pages/Giftcards";
import Taxes from "./pages/Taxes";
import Workflow from "./pages/Workflow";
import Invoices from "./pages/Invoices";
import CustomForms from "./pages/CustomForms";
import Appearance from "./pages/Appearance";
import Settings from "./pages/Settings";
import GeneralSettings from "./pages/settings/GeneralSettings";
import FrontendPanels from "./pages/settings/FrontendPanels";
import PaymentSettings from "./pages/settings/PaymentSettings";
import BusinessDetails from "./pages/settings/BusinessDetails";
import BookingPageSettings from "./pages/settings/BookingPageSettings";
import BusinessHours from "./pages/settings/BusinessHours";
import Holidays from "./pages/settings/Holidays";
import EmailSettings from "./pages/settings/EmailSettings";
import IntegrationsSettings from "./pages/settings/IntegrationsSettings";
import BookingLinkManager from "./pages/BookingLinkManager";
import BookingPage from "./pages/BookingPage";
import CustomerPortal from "./pages/CustomerPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <PaymentSettingsProvider>
          <AppDataProvider>
            <BookingThemeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/services" element={<Services />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/giftcards" element={<Giftcards />} />
              <Route path="/taxes" element={<Taxes />} />
              <Route path="/workflow" element={<Workflow />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/custom-forms" element={<CustomForms />} />
              <Route path="/appearance" element={<Appearance />} />
              <Route path="/booking-link" element={<BookingLinkManager />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/general" element={<GeneralSettings />} />
              <Route path="/settings/frontend-panels" element={<FrontendPanels />} />
              <Route path="/settings/payment" element={<PaymentSettings />} />
              <Route path="/settings/business" element={<BusinessDetails />} />
              <Route path="/settings/booking-page" element={<BookingPageSettings />} />
              <Route path="/settings/business-hours" element={<BusinessHours />} />
              <Route path="/settings/holidays" element={<Holidays />} />
              <Route path="/settings/email" element={<EmailSettings />} />
              <Route path="/settings/integrations" element={<IntegrationsSettings />} />
              <Route path="/customer-portal" element={<CustomerPortal />} />
              <Route path="/book/:businessSlug" element={<BookingPage />} />
              <Route path="/b/:businessSlug" element={<BookingPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
            </BookingThemeProvider>
          </AppDataProvider>
        </PaymentSettingsProvider>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
