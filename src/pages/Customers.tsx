
import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Download, Upload, Eye } from 'lucide-react';
import { CustomerForm } from '@/components/customers/CustomerForm';

import { useAppData } from '@/contexts/AppDataContext';
import { format } from 'date-fns';

export default function Customers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { customers, getCustomerAppointments, addCustomer, getCustomerById } = useAppData();

  // Check for customerId query parameter to open customer form
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customerId');
    
    if (customerId) {
      const customer = getCustomerById(customerId);
      if (customer) {
        setEditingCustomer(customer);
        setIsFormOpen(true);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [getCustomerById]);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleExportCSV = () => {
    if (customers.length === 0) {
      alert('No customers to export');
      return;
    }

    const headers = [
      'First Name',
      'Last Name', 
      'Email',
      'Phone',
      'Gender',
      'Date of Birth',
      'Allow Login',
      'Note',
      'Total Appointments',
      'Last Appointment'
    ];

    const csvData = customers.map(customer => {
      const appointmentCount = getCustomerAppointments(customer.id).length;
      const lastAppointmentDate = getLastAppointmentDate(customer.id);
      
      return [
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.gender,
        customer.dateOfBirth && !isNaN(new Date(customer.dateOfBirth).getTime()) ? format(new Date(customer.dateOfBirth), 'yyyy-MM-dd') : '',
        customer.allowLogin ? 'Yes' : 'No',
        customer.note,
        appointmentCount.toString(),
        lastAppointmentDate
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      
      if (lines.length < 2) {
        alert('CSV file appears to be empty or invalid');
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1).filter(line => line.trim());
      let importedCount = 0;
      let errorCount = 0;

      dataLines.forEach((line, index) => {
        try {
          const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());
          
          if (fields.length < 3) return; // Skip incomplete rows
          
          const [firstName, lastName, email, phone = '', gender = '', dateOfBirth = '', allowLogin = 'No', note = ''] = fields;
          
          if (!firstName || !lastName || !email) {
            errorCount++;
            return;
          }

          // Check if customer already exists
          const existingCustomer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
          if (existingCustomer) {
            errorCount++;
            return;
          }

          const customerData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            gender: gender.toLowerCase(),
            dateOfBirth: dateOfBirth && dateOfBirth.trim() ? new Date(dateOfBirth) : undefined,
            allowLogin: allowLogin.toLowerCase() === 'yes' || allowLogin.toLowerCase() === 'true',
            note: note
          };

          addCustomer(customerData);
          importedCount++;
        } catch (error) {
          console.error(`Error processing row ${index + 2}:`, error);
          errorCount++;
        }
      });

      alert(`Import completed: ${importedCount} customers imported successfully${errorCount > 0 ? `, ${errorCount} errors encountered` : ''}`);
    };

    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const getLastAppointmentDate = (customerId: string) => {
    const appointments = getCustomerAppointments(customerId);
    if (appointments.length === 0) return 'Never';
    
    const lastAppointment = appointments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return format(new Date(lastAppointment.date), 'MMM dd, yyyy');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {customers.length}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="text-gray-600" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              EXPORT TO CSV
            </Button>
            <Button variant="outline" className="text-gray-600" onClick={triggerFileInput}>
              <Upload className="h-4 w-4 mr-2" />
              IMPORT
            </Button>
            <input
              ref={fileInputRef}
              type="file" 
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
            <Button onClick={handleAddCustomer} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              ADD CUSTOMER
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead>CUSTOMER NAME ↕</TableHead>
                <TableHead>EMAIL ↕</TableHead>
                <TableHead>PHONE ↕</TableHead>
                <TableHead>LAST APPOINTMENT ↕</TableHead>
                <TableHead>TOTAL APPOINTMENTS</TableHead>
                <TableHead>GENDER ↕</TableHead>
                <TableHead>DATE OF BIRTH ↕</TableHead>
                <TableHead className="w-20">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    {customers.length === 0 
                      ? "No customers yet! Add your first customer." 
                      : "No customers match your search criteria."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const appointmentCount = getCustomerAppointments(customer.id).length;
                  
                  return (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleEditCustomer(customer)}>
                      <TableCell>
                        <input type="checkbox" className="rounded" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{getLastAppointmentDate(customer.id)}</TableCell>
                      <TableCell>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {appointmentCount}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">{customer.gender}</TableCell>
                      <TableCell>
                        {customer.dateOfBirth && !isNaN(new Date(customer.dateOfBirth).getTime())
                          ? format(new Date(customer.dateOfBirth), 'MMM dd, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustomer(customer);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredCustomers.length} of {customers.length} total customers</span>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
              i
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span>Need Help?</span>
            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-xs">
              ?
            </div>
          </div>
        </div>
      </div>

      {/* Sliding Form */}
      <CustomerForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        customer={editingCustomer}
      />
    </Layout>
  );
}
