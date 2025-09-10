import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Trash2, FileText, Download, Mail, Save, DollarSign, Percent, Upload, ChevronDown, Users, User, Building2, CreditCard, Package, Palette } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBookingTheme } from '@/contexts/BookingThemeContext';
import { usePaymentSettings } from '@/contexts/PaymentSettingsContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const invoiceItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100')
});

const invoiceSchema = z.object({
  billedTo: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.string().optional()
  }),
  billedFrom: z.object({
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional()
  }),
  paymentInfo: z.object({
    bankName: z.string().optional(),
    accountName: z.string().optional(),
    accountNumber: z.string().optional()
  }),
  branding: z.object({
    companyDisplayName: z.string().min(1, 'Display name is required'),
    logoUrl: z.string().optional(),
    headerBackgroundColor: z.string().min(1, 'Background color is required'),
    headerTextColor: z.string().min(1, 'Text color is required'),
    showCompanyDisplayName: z.boolean().optional()
  }),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  companyName: z.string().min(1, 'Company name is required'),
  dueDate: z.date({
    required_error: 'Due date is required'
  }),
  currency: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  notes: z.string().optional()
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onBack: () => void;
  editingDraft?: any;
}

export const InvoiceForm = ({
  onBack,
  editingDraft
}: InvoiceFormProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [formTab, setFormTab] = useState<'basic' | 'items' | 'branding' | 'payment'>('basic');
  const { customers, coupons, services, taxes } = useAppData();
  const { currency, formatPrice } = useCurrency();
  const { theme } = useBookingTheme();
  const { paymentSettings } = usePaymentSettings();

  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers.find(customer => customer.id === customerId);
    if (selectedCustomer) {
      form.setValue('billedTo.name', `${selectedCustomer.firstName} ${selectedCustomer.lastName}`);
      form.setValue('billedTo.email', selectedCustomer.email);
      form.setValue('billedTo.phone', selectedCustomer.phone || '');
    }
  };

  const handleCouponSelect = (couponId: string) => {
    const selectedCoupon = coupons.find(coupon => coupon.id === couponId);
    if (selectedCoupon) {
      const discountValue = parseFloat(selectedCoupon.discount.replace('%', ''));
      const discountType = selectedCoupon.discount.includes('%') ? 'percentage' : 'fixed';
      
      form.setValue('discountType', discountType);
      form.setValue('discountValue', discountValue);
    }
  };

  const handleServiceSelect = (serviceId: string, itemIndex: number) => {
    const selectedService = services.find(service => service.id === serviceId);
    if (selectedService) {
      const applicableTax = taxes.find(tax => 
        tax.enabled && 
        (tax.servicesFilter === 'All' || tax.servicesFilter.includes(selectedService.id))
      );
      
      form.setValue(`items.${itemIndex}.name`, selectedService.name);
      form.setValue(`items.${itemIndex}.quantity`, 1);
      form.setValue(`items.${itemIndex}.unitPrice`, selectedService.price);
      form.setValue(`items.${itemIndex}.taxRate`, applicableTax?.amount || 10);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        form.setValue('branding.logoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: editingDraft || {
      billedTo: {
        name: '',
        email: '',
        phone: '',
        address: ''
      },
      billedFrom: {
        address: theme.address,
        phone: theme.phone,
        email: theme.email
      },
      paymentInfo: {
        bankName: paymentSettings.bankName,
        accountName: paymentSettings.accountName,
        accountNumber: paymentSettings.accountNumber
      },
      branding: {
        companyDisplayName: theme.businessName,
        logoUrl: theme.logo,
        headerBackgroundColor: '#3b82f6',
        headerTextColor: '#ffffff',
        showCompanyDisplayName: true
      },
      invoiceNumber: `INV-${String(Date.now()).slice(-6)}`,
      companyName: theme.businessName,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: currency.code,
      items: [{
        name: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 10
      }],
      discountType: 'percentage',
      discountValue: 0,
      notes: ''
    }
  });

  useEffect(() => {
    if (editingDraft) {
      if (editingDraft.dueDate && typeof editingDraft.dueDate === 'string') {
        editingDraft.dueDate = new Date(editingDraft.dueDate);
      }
      form.reset(editingDraft);
    }
  }, [editingDraft, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  const watchedItems = form.watch('items');
  const watchedDiscountType = form.watch('discountType');
  const watchedDiscountValue = form.watch('discountValue') || 0;

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);
  };

  const calculateTax = () => {
    return watchedItems.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      return sum + itemTotal * (item.taxRate || 0) / 100;
    }, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (watchedDiscountType === 'percentage') {
      return subtotal * watchedDiscountValue / 100;
    }
    return watchedDiscountValue;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount();
  };

  const onSubmit = (data: InvoiceFormData) => {
    console.log('Creating invoice:', data);
    toast({
      title: "Invoice created",
      description: "Your invoice has been created successfully."
    });
    onBack();
  };

  const handleSaveAsDraft = () => {
    const data = form.getValues();
    const draftId = editingDraft?.id || `draft-${Date.now()}`;
    
    const draft = {
      ...data,
      id: draftId,
      status: 'draft',
      createdAt: editingDraft?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingDrafts = JSON.parse(localStorage.getItem('invoiceDrafts') || '[]');
    
    const draftIndex = existingDrafts.findIndex((d: any) => d.id === draftId);
    if (draftIndex >= 0) {
      existingDrafts[draftIndex] = draft;
    } else {
      existingDrafts.push(draft);
    }
    
    localStorage.setItem('invoiceDrafts', JSON.stringify(existingDrafts));
    
    toast({
      title: "Draft saved",
      description: "Your invoice has been saved as a draft."
    });
    
    onBack();
  };

  const handleDownloadPDF = async () => {
    const data = form.getValues() as InvoiceFormData;
    
    try {
      const loadImage = (src: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = src;
        });
      };

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      const fontFamily = 'helvetica';
      
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 59, g: 130, b: 246 };
      };
      
      const headerColor = hexToRgb(data.branding.headerBackgroundColor || '#4285f4');
      
      pdf.setFillColor(headerColor.r, headerColor.g, headerColor.b);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      let logoXOffset = 20;
      
      if (data.branding.logoUrl) {
        try {
          const logoBase64 = await loadImage(data.branding.logoUrl);
          pdf.addImage(logoBase64, 'PNG', logoXOffset, 16, 8, 8);
          logoXOffset += 12;
        } catch (error) {
          console.error('Error loading logo:', error);
        }
      }
      
      const headerTextColor = hexToRgb(data.branding.headerTextColor || '#ffffff');
      
      if (data.branding.showCompanyDisplayName) {
        pdf.setTextColor(headerTextColor.r, headerTextColor.g, headerTextColor.b);
        pdf.setFontSize(18);
        pdf.setFont(fontFamily, 'bold');
        pdf.text(data.branding.companyDisplayName || 'Monny', logoXOffset, 22);
      }
      
      pdf.setFontSize(12);
      pdf.setFont(fontFamily, 'normal');
      const invoiceText = data.invoiceNumber;
      const invoiceTextWidth = pdf.getTextWidth(invoiceText);
      
      pdf.setTextColor(headerTextColor.r, headerTextColor.g, headerTextColor.b);
      pdf.setFont(fontFamily, 'bold');
      pdf.text(invoiceText, pageWidth - invoiceTextWidth - 20, 21);
      
      pdf.setTextColor(0, 0, 0);
      
      let yPos = 50;
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(fontFamily, 'bold');
      pdf.setFontSize(12);
      pdf.text(data.companyName || 'No company name', 20, yPos);
      
      yPos += 20;
      pdf.setFontSize(10);
      pdf.setFont(fontFamily, 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('BILLED FROM', 20, yPos);
      
      yPos += 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(fontFamily, 'normal');
      pdf.setFontSize(11);
      
      if (data.billedFrom.address) {
        pdf.setTextColor(100, 100, 100);
        pdf.text(data.billedFrom.address, 20, yPos);
        yPos += 6;
      }
      
      if (data.billedFrom.phone) {
        pdf.setFont(fontFamily, 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(data.billedFrom.phone, 20, yPos);
        yPos += 6;
      }
      
      if (data.billedFrom.email) {
        pdf.setTextColor(100, 100, 100);
        pdf.text(data.billedFrom.email, 20, yPos);
      }
      
      let rightYPos = 50;
      pdf.setFontSize(10);
      pdf.setFont(fontFamily, 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('DUE DATE', 110, rightYPos);
      
      rightYPos += 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(fontFamily, 'normal');
      pdf.setFontSize(11);
      pdf.text(format(data.dueDate, 'dd MMMM yyyy'), 110, rightYPos);
      
      rightYPos += 20;
      pdf.setFontSize(10);
      pdf.setFont(fontFamily, 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('BILLED TO', 110, rightYPos);
      
      rightYPos += 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(fontFamily, 'normal');
      pdf.setFontSize(11);
      pdf.setFont(fontFamily, 'bold');
      pdf.text(data.billedTo.name || 'Customer Name', 110, rightYPos);
      
      rightYPos += 6;
      pdf.setFont(fontFamily, 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(data.billedTo.email || 'customer@email.com', 110, rightYPos);
      
      if (data.billedTo.phone) {
        rightYPos += 6;
        pdf.text(data.billedTo.phone, 110, rightYPos);
      }
      
      if (data.billedTo.address) {
        rightYPos += 6;
        pdf.text(data.billedTo.address, 110, rightYPos);
      }
      
      yPos = Math.max(yPos, rightYPos) + 10;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 8;
      
      pdf.setFontSize(9);
      pdf.setFont(fontFamily, 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('ITEM', 20, yPos);
      pdf.text('QTY', 120, yPos);
      pdf.text('UNIT PRICE', 140, yPos);
      pdf.text('AMOUNT', 175, yPos);
      
      yPos += 10;
      
      pdf.setFont(fontFamily, 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      
      data.items.forEach((item, index) => {
        pdf.setFont(fontFamily, 'bold');
        pdf.text(item.name || `Item ${index + 1}`, 20, yPos);
        
        pdf.setFont(fontFamily, 'normal');
        pdf.text((item.quantity || 1).toString(), 125, yPos);
        
        const unitPriceFormatted = formatPrice(item.unitPrice || 0);
        pdf.text(unitPriceFormatted, 145, yPos);
        
        const amountFormatted = formatPrice((item.quantity || 0) * (item.unitPrice || 0));
        const amountWidth = pdf.getTextWidth(amountFormatted);
        pdf.text(amountFormatted, pageWidth - 20 - amountWidth, yPos);
        
        yPos += 12;
        
        if (index < data.items.length - 1) {
          pdf.setDrawColor(230, 230, 230);
          pdf.line(20, yPos, pageWidth - 20, yPos);
          yPos += 8;
        }
      });
      
      yPos += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 8;
      const totalsLeftX = 140;
      
      const subtotal = calculateSubtotal();
      const discount = calculateDiscount();
      const taxAmount = calculateTax();
      const total = calculateTotal();
      
      pdf.setFontSize(10);
      pdf.setFont(fontFamily, 'normal');
      pdf.setTextColor(100, 100, 100);
      
      pdf.text('Sub total', totalsLeftX, yPos);
      const subtotalFormatted = formatPrice(subtotal);
      const subtotalWidth = pdf.getTextWidth(subtotalFormatted);
      pdf.setTextColor(0, 0, 0);
      pdf.text(subtotalFormatted, pageWidth - 20 - subtotalWidth, yPos);
      
      if (discount > 0) {
        yPos += 8;
        pdf.setTextColor(100, 100, 100);
        const discountLabel = `Discount ${watchedDiscountType === 'percentage' ? `${watchedDiscountValue}%` : ''}`;
        pdf.text(discountLabel, totalsLeftX, yPos);
        const discountFormatted = `-${formatPrice(discount)}`;
        const discountWidth = pdf.getTextWidth(discountFormatted);
        pdf.setTextColor(0, 0, 0);
        pdf.text(discountFormatted, pageWidth - 20 - discountWidth, yPos);
      }
      
      yPos += 8;
      pdf.setTextColor(100, 100, 100);
      pdf.text('Tax 10%', totalsLeftX, yPos);
      const taxFormatted = formatPrice(taxAmount);
      const taxWidth = pdf.getTextWidth(taxFormatted);
      pdf.setTextColor(0, 0, 0);
      pdf.text(taxFormatted, pageWidth - 20 - taxWidth, yPos);
      
      yPos += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(totalsLeftX, yPos, pageWidth - 20, yPos);
      
      yPos += 12;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Total', totalsLeftX, yPos);
      const totalFormatted = formatPrice(total);
      const totalWidth = pdf.getTextWidth(totalFormatted);
      pdf.text(totalFormatted, pageWidth - 20 - totalWidth, yPos);
      
      yPos += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Amount due', totalsLeftX, yPos);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const dueWidth = pdf.getTextWidth(totalFormatted);
      pdf.text(totalFormatted, pageWidth - 20 - dueWidth, yPos);
      
      if (data.paymentInfo && (data.paymentInfo.bankName || data.paymentInfo.accountName || data.paymentInfo.accountNumber)) {
        yPos += 15;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPos, pageWidth - 20, yPos);
        
        yPos += 8;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('PAYMENT INFORMATION', 20, yPos);
        
        yPos += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        
        if (data.paymentInfo.bankName) {
          pdf.text(`Bank Name: ${data.paymentInfo.bankName}`, 20, yPos);
          yPos += 5;
        }
        
        if (data.paymentInfo.accountName) {
          pdf.text(`Account Name: ${data.paymentInfo.accountName}`, 20, yPos);
          yPos += 5;
        }
        
        if (data.paymentInfo.accountNumber) {
          pdf.text(`Account Number: ${data.paymentInfo.accountNumber}`, 20, yPos);
          yPos += 5;
        }
      }
      
      if (data.notes) {
        yPos += 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPos, pageWidth - 20, yPos);
        
        yPos += 5;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('NOTES', 20, yPos);
        
        yPos += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        
        const pageHeight = pdf.internal.pageSize.getHeight();
        const availableSpace = pageHeight - yPos - 20;
        const lineHeight = 4;
        const maxLines = Math.floor(availableSpace / lineHeight);
        
        let splitNotes = pdf.splitTextToSize(data.notes, pageWidth - 40);
        
        if (splitNotes.length > maxLines && maxLines > 0) {
          splitNotes = splitNotes.slice(0, Math.max(1, maxLines - 1));
          splitNotes.push('...');
        }
        
        pdf.text(splitNotes, 20, yPos);
      }
      
      pdf.save(`invoice-${data.invoiceNumber}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Invoice PDF has been generated successfully."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendEmail = () => {
    toast({
      title: "Email Sent",
      description: "Invoice has been sent via email successfully."
    });
  };

  const formatCurrency = (amount: number) => {
    return formatPrice(amount);
  };

  const InvoicePreview = () => {
    const formData = form.watch();

    return <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between p-6" style={{ backgroundColor: formData.branding.headerBackgroundColor || '#4285f4' }}>
            <div className="flex items-center space-x-3">
              {formData.branding.logoUrl ? <img src={formData.branding.logoUrl} alt="Company Logo" className="w-8 h-8 rounded-full object-cover" /> : (formData.branding.showCompanyDisplayName && <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span style={{ color: formData.branding.headerTextColor }} className="text-sm font-bold">{formData.branding.companyDisplayName.charAt(0)}</span>
                </div>)}
              {formData.branding.showCompanyDisplayName && <span style={{ color: formData.branding.headerTextColor }} className="font-semibold">{formData.branding.companyDisplayName}</span>}
            </div>
            <Badge variant="outline" style={{ 
              color: formData.branding.headerTextColor, 
              borderColor: `${formData.branding.headerTextColor}30` 
            }} className="text-xs bg-white/10">
              {formData.invoiceNumber}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold">{formData.companyName || 'No company name'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Billed From</h4>
                <div className="text-sm">
                  {formData.billedFrom.address && <p className="text-muted-foreground">{formData.billedFrom.address}</p>}
                  {formData.billedFrom.phone && <p className="text-muted-foreground">{formData.billedFrom.phone}</p>}
                  {formData.billedFrom.email && <p className="text-muted-foreground">{formData.billedFrom.email}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h4>
                <p className="text-sm">{format(formData.dueDate, 'dd MMMM yyyy')}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Billed To</h4>
                <div className="text-sm">
                  <p className="font-medium">{formData.billedTo.name || 'Customer Name'}</p>
                  <p className="text-muted-foreground">{formData.billedTo.email || 'customer@email.com'}</p>
                  {formData.billedTo.phone && <p className="text-muted-foreground">{formData.billedTo.phone}</p>}
                  {formData.billedTo.address && <p className="text-muted-foreground">{formData.billedTo.address}</p>}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground mb-3">
              <span>ITEM</span>
              <span className="text-center">QTY</span>
              <span className="text-center">UNIT PRICE</span>
              <span className="text-right">AMOUNT</span>
            </div>
            
            {formData.items.map((item, index) => <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{item.name || `Item ${index + 1}`}</span>
                </div>
                <span className="text-center">{item.quantity}</span>
                <span className="text-center">{formatCurrency(item.unitPrice)}</span>
                <span className="text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>)}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sub total</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
            {calculateDiscount() > 0 && <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Discount {watchedDiscountType === 'percentage' ? `${watchedDiscountValue}%` : ''}
                </span>
                <span>-{formatCurrency(calculateDiscount())}</span>
              </div>}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax 10%</span>
              <span>{formatCurrency(calculateTax())}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount due</span>
              <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {(formData.paymentInfo?.bankName || formData.paymentInfo?.accountName || formData.paymentInfo?.accountNumber) && <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Payment Information</h4>
                <div className="text-sm space-y-1">
                  {formData.paymentInfo.bankName && <p className="text-muted-foreground">Bank Name: {formData.paymentInfo.bankName}</p>}
                  {formData.paymentInfo.accountName && <p className="text-muted-foreground">Account Name: {formData.paymentInfo.accountName}</p>}
                  {formData.paymentInfo.accountNumber && <p className="text-muted-foreground">Account Number: {formData.paymentInfo.accountNumber}</p>}
                </div>
              </div>
            </>}

          {formData.notes && <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{formData.notes}</p>
              </div>
            </>}

        </CardContent>
      </Card>;
  };

  return <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Invoices</span>
            <span>|</span>
            <span>Create Invoice</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSaveAsDraft}>
            Save as Draft
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                Send Invoice
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-auto p-6 border-r">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Invoice Detail</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={formTab} onValueChange={(value) => setFormTab(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="items" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Items
                  </TabsTrigger>
                  <TabsTrigger value="branding" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Branding
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Select Customer</Label>
                    <Select onValueChange={handleCustomerSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose from existing customers or enter manually" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {customers.length > 0 ? (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {customer.firstName} {customer.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {customer.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-customers" disabled>
                            No customers found. Add customers in the Customers section.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Billed to</Label>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {form.watch('billedTo.name')?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <FormField control={form.control} name="billedTo.name" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} placeholder="Customer Name" className="border-0 p-0 text-sm font-medium" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="billedTo.email" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} placeholder="customer@email.com" className="border-0 p-0 text-sm text-muted-foreground" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="billedTo.phone" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} placeholder="Customer phone number" className="border-0 p-0 text-sm text-muted-foreground" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="companyName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your Company Name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="dueDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "dd MMMM yyyy") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date < new Date()} initialFocus className="my-0 py-[8px]" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Billed from</Label>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField control={form.control} name="billedFrom.address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Company address" className="min-h-[60px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="billedFrom.phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Company phone number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="billedFrom.email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="company@email.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="items" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Products</Label>
                    </div>

                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Select Service (Optional)</Label>
                            <Select onValueChange={(serviceId) => handleServiceSelect(serviceId, index)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose from services or enter manually" />
                              </SelectTrigger>
                              <SelectContent className="bg-background z-50">
                                {services.length > 0 ? (
                                  services.map((service) => (
                                    <SelectItem key={service.id} value={service.id}>
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex flex-col">
                                          <span className="font-medium">{service.name}</span>
                                          <span className="text-xs text-muted-foreground">{service.category}</span>
                                        </div>
                                        <span className="text-sm font-medium ml-4">{formatCurrency(service.price)}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-services" disabled>
                                    No services found. Add services in the Services section.
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-5">
                              <FormField control={form.control} name={`items.${index}.name`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Item name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                            <div className="col-span-2">
                              <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Qty</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                            <div className="col-span-2">
                              <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit Price</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="0" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                            <div className="col-span-2">
                              <FormField control={form.control} name={`items.${index}.taxRate`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tax %</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="0" max="100" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                            <div className="col-span-1 flex items-end">
                              {fields.length > 1 && (
                                <Button type="button" variant="outline" size="sm" className="h-10 w-10 p-0" onClick={() => remove(index)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    <Button type="button" variant="outline" onClick={() => append({
                      name: '',
                      quantity: 1,
                      unitPrice: 0,
                      taxRate: 10
                    })} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Coupon</Label>
                      </div>
                      <Select onValueChange={handleCouponSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose from existing coupons or set manually" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {coupons.length > 0 ? (
                            coupons.map((coupon) => (
                              <SelectItem key={coupon.id} value={coupon.id}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{coupon.code}</span>
                                  </div>
                                  <span className="text-sm font-medium ml-4">{coupon.discount}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-coupons" disabled>
                              No coupons found. Add coupons in the Coupons section.
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="discountType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select discount type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">
                                  <div className="flex items-center">
                                    <Percent className="w-4 h-4 mr-2" />
                                    Percentage
                                  </div>
                                </SelectItem>
                                <SelectItem value="fixed">
                                  <div className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Fixed Amount
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="discountValue" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Value</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Branding</Label>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField control={form.control} name="branding.companyDisplayName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Display Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your Company Display Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div>
                        <FormLabel>Company Logo</FormLabel>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            {form.watch('branding.logoUrl') ? (
                              <img src={form.watch('branding.logoUrl')} alt="Logo preview" className="w-12 h-12 rounded object-cover border" />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center border border-dashed">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <Input type="file" accept="image/*" onChange={handleLogoUpload} className="file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80 py-[5px]" />
                              <p className="text-xs text-muted-foreground mt-1">
                                Upload PNG, JPG or SVG. Max 2MB.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <FormField control={form.control} name="branding.headerBackgroundColor" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Background Color</FormLabel>
                          <FormControl>
                            <div className="flex space-x-2">
                              <Input {...field} type="color" className="w-16 h-10 p-1" />
                              <Input {...field} placeholder="#3b82f6" className="flex-1" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="branding.headerTextColor" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Text Color</FormLabel>
                          <FormControl>
                            <div className="flex space-x-2">
                              <Input {...field} type="color" className="w-16 h-10 p-1" />
                              <Input {...field} placeholder="#ffffff" className="flex-1" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="branding.showCompanyDisplayName" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Company Display Name</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Toggle to show or hide company display name in header
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Payment Information</Label>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField control={form.control} name="paymentInfo.bankName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter bank name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="paymentInfo.accountName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter account holder name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="paymentInfo.accountNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter account number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Add Notes" className="min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>

        <div className="w-1/2 overflow-auto bg-muted/20">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Preview</h3>
            </div>
            
            <InvoicePreview />
          </div>
        </div>
      </div>
    </div>;
};

export default InvoiceForm;
