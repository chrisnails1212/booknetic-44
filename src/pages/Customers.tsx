
import React, { useState, useRef, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Plus, Download, Upload, Eye, Filter, Trash2, CalendarIcon, X } from 'lucide-react';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { cn } from '@/lib/utils';

import { useAppData } from '@/contexts/AppDataContext';
import { format } from 'date-fns';

export default function Customers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    customerSince: null as Date | null,
    lastAppointmentFrom: null as Date | null,
    lastAppointmentTo: null as Date | null,
    gender: 'all',
    appointmentCountMin: '',
    appointmentCountMax: ''
  });
  
  const { customers, getCustomerAppointments, addCustomer, getCustomerById, deleteCustomer } = useAppData();

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
        customer.dateOfBirth ? format(new Date(customer.dateOfBirth), 'yyyy-MM-dd') : '',
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
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
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

  // Filter customers based on search term and advanced filters
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Basic search filter
      const matchesSearch = customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm);
      
      if (!matchesSearch) return false;
      
      // Advanced filters
      const customerAppointments = getCustomerAppointments(customer.id);
      
      // Customer since filter
      if (advancedFilters.customerSince) {
        if (customerAppointments.length === 0) return false;
        const firstAppointment = customerAppointments
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        const firstAppointmentDate = new Date(firstAppointment.date);
        if (firstAppointmentDate < advancedFilters.customerSince) return false;
      }
      
      // Last appointment date range filter
      if (advancedFilters.lastAppointmentFrom || advancedFilters.lastAppointmentTo) {
        if (customerAppointments.length === 0) return false;
        const lastAppointment = customerAppointments
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const lastAppointmentDate = new Date(lastAppointment.date);
        
        if (advancedFilters.lastAppointmentFrom && lastAppointmentDate < advancedFilters.lastAppointmentFrom) return false;
        if (advancedFilters.lastAppointmentTo && lastAppointmentDate > advancedFilters.lastAppointmentTo) return false;
      }
      
      // Gender filter
      if (advancedFilters.gender !== 'all' && customer.gender !== advancedFilters.gender) return false;
      
      // Appointment count range filter
      const appointmentCount = customerAppointments.length;
      if (advancedFilters.appointmentCountMin && appointmentCount < parseInt(advancedFilters.appointmentCountMin)) return false;
      if (advancedFilters.appointmentCountMax && appointmentCount > parseInt(advancedFilters.appointmentCountMax)) return false;
      
      return true;
    });
  }, [customers, searchTerm, advancedFilters, getCustomerAppointments]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, advancedFilters]);

  const getLastAppointmentDate = (customerId: string) => {
    const appointments = getCustomerAppointments(customerId);
    if (appointments.length === 0) return 'Never';
    
    const lastAppointment = appointments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return format(new Date(lastAppointment.date), 'MMM dd, yyyy');
  };

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedCustomers.size === paginatedCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(paginatedCustomers.map(c => c.id)));
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedCustomers.size === 0) {
      alert('Please select customers to delete');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedCustomers.size} customer(s)? This action cannot be undone.`)) {
      selectedCustomers.forEach(customerId => {
        deleteCustomer(customerId);
      });
      setSelectedCustomers(new Set());
      alert(`${selectedCustomers.size} customer(s) deleted successfully`);
    }
  };

  const handleBulkExport = () => {
    if (selectedCustomers.size === 0) {
      alert('Please select customers to export');
      return;
    }

    const selectedCustomerData = customers.filter(c => selectedCustomers.has(c.id));
    
    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Date of Birth',
      'Allow Login', 'Note', 'Total Appointments', 'Last Appointment'
    ];

    const csvData = selectedCustomerData.map(customer => {
      const appointmentCount = getCustomerAppointments(customer.id).length;
      const lastAppointmentDate = getLastAppointmentDate(customer.id);
      
      return [
        customer.firstName, customer.lastName, customer.email, customer.phone,
        customer.gender, customer.dateOfBirth ? format(new Date(customer.dateOfBirth), 'yyyy-MM-dd') : '',
        customer.allowLogin ? 'Yes' : 'No', customer.note,
        appointmentCount.toString(), lastAppointmentDate
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `selected_customers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter helpers
  const clearAdvancedFilter = (filterKey: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterKey]: filterKey.includes('Date') || filterKey.includes('Since') ? null : 
                  filterKey.includes('Count') ? '' : 'all'
    }));
  };

  const resetAllAdvancedFilters = () => {
    setAdvancedFilters({
      customerSince: null,
      lastAppointmentFrom: null,
      lastAppointmentTo: null,
      gender: 'all',
      appointmentCountMin: '',
      appointmentCountMax: ''
    });
  };

  const hasActiveAdvancedFilters = () => {
    return advancedFilters.customerSince || advancedFilters.lastAppointmentFrom || 
           advancedFilters.lastAppointmentTo || advancedFilters.gender !== 'all' ||
           advancedFilters.appointmentCountMin || advancedFilters.appointmentCountMax;
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
            {selectedCustomers.size > 0 && (
              <>
                <Button variant="outline" className="text-red-600 border-red-200" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  DELETE ({selectedCustomers.size})
                </Button>
                <Button variant="outline" className="text-blue-600 border-blue-200" onClick={handleBulkExport}>
                  <Download className="h-4 w-4 mr-2" />
                  EXPORT SELECTED ({selectedCustomers.size})
                </Button>
              </>
            )}
            <Button variant="outline" className="text-gray-600" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              EXPORT ALL
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

        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className={`text-slate-600 ${hasActiveAdvancedFilters() ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filter {hasActiveAdvancedFilters() && '(Active)'}
            </Button>
            
            {showAdvancedFilter && (
              <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">Advanced Filters</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAdvancedFilter(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Customer Since */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Customer Since</label>
                      {advancedFilters.customerSince && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 h-auto p-0 text-xs"
                          onClick={() => clearAdvancedFilter('customerSince')}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-sm h-8"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {advancedFilters.customerSince ? format(advancedFilters.customerSince, "dd-MM-yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={advancedFilters.customerSince}
                          onSelect={(date) => setAdvancedFilters(prev => ({ ...prev, customerSince: date }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Last Appointment Range */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Last Appointment</label>
                      {(advancedFilters.lastAppointmentFrom || advancedFilters.lastAppointmentTo) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 h-auto p-0 text-xs"
                          onClick={() => {
                            clearAdvancedFilter('lastAppointmentFrom');
                            clearAdvancedFilter('lastAppointmentTo');
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">From:</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal text-xs h-8"
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {advancedFilters.lastAppointmentFrom ? format(advancedFilters.lastAppointmentFrom, "dd-MM-yyyy") : "Select"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={advancedFilters.lastAppointmentFrom}
                              onSelect={(date) => setAdvancedFilters(prev => ({ ...prev, lastAppointmentFrom: date }))}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">To:</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal text-xs h-8"
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {advancedFilters.lastAppointmentTo ? format(advancedFilters.lastAppointmentTo, "dd-MM-yyyy") : "Select"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={advancedFilters.lastAppointmentTo}
                              onSelect={(date) => setAdvancedFilters(prev => ({ ...prev, lastAppointmentTo: date }))}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Gender</label>
                      {advancedFilters.gender !== 'all' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 h-auto p-0 text-xs"
                          onClick={() => clearAdvancedFilter('gender')}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <Select 
                      value={advancedFilters.gender} 
                      onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Appointment Count Range */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Appointment Count</label>
                      {(advancedFilters.appointmentCountMin || advancedFilters.appointmentCountMax) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 h-auto p-0 text-xs"
                          onClick={() => {
                            clearAdvancedFilter('appointmentCountMin');
                            clearAdvancedFilter('appointmentCountMax');
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Min:</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={advancedFilters.appointmentCountMin}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, appointmentCountMin: e.target.value }))}
                          className="h-8 text-xs"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Max:</label>
                        <Input
                          type="number"
                          placeholder="999"
                          value={advancedFilters.appointmentCountMax}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, appointmentCountMax: e.target.value }))}
                          className="h-8 text-xs"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetAllAdvancedFilters}
                      className="text-xs"
                    >
                      Reset All
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setShowAdvancedFilter(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-xs"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={selectedCustomers.size === paginatedCustomers.length && paginatedCustomers.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>CUSTOMER NAME</TableHead>
                <TableHead>EMAIL</TableHead>
                <TableHead>PHONE</TableHead>
                <TableHead>LAST APPOINTMENT</TableHead>
                <TableHead>TOTAL APPOINTMENTS</TableHead>
                <TableHead>GENDER</TableHead>
                <TableHead>DATE OF BIRTH</TableHead>
                <TableHead className="w-20">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    {customers.length === 0 
                      ? "No customers yet! Add your first customer." 
                      : "No customers match your search criteria."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => {
                  const appointmentCount = getCustomerAppointments(customer.id).length;
                  
                  return (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded" 
                          checked={selectedCustomers.has(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium" onClick={() => handleEditCustomer(customer)}>
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell onClick={() => handleEditCustomer(customer)}>{customer.email}</TableCell>
                      <TableCell onClick={() => handleEditCustomer(customer)}>{customer.phone}</TableCell>
                      <TableCell onClick={() => handleEditCustomer(customer)}>{getLastAppointmentDate(customer.id)}</TableCell>
                      <TableCell onClick={() => handleEditCustomer(customer)}>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {appointmentCount}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize" onClick={() => handleEditCustomer(customer)}>{customer.gender}</TableCell>
                      <TableCell onClick={() => handleEditCustomer(customer)}>
                        {customer.dateOfBirth 
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

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
                {selectedCustomers.size > 0 && ` (${selectedCustomers.size} selected)`}
              </span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
