import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Copy, Download } from 'lucide-react';
import { TaxForm } from '@/components/taxes/TaxForm';
import { useAppData, Tax } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

const Taxes = () => {
  const { taxes, deleteTax, getLocationById, getServiceById, duplicateTax } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaxes, setSelectedTaxes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const handleAddTax = () => {
    setSelectedTax(null);
    setIsFormOpen(true);
  };

  const handleEditTax = (tax: Tax) => {
    setSelectedTax(tax);
    setIsFormOpen(true);
  };

  const handleDeleteTax = (tax: Tax) => {
    if (window.confirm(`Are you sure you want to delete tax "${tax.name}"?`)) {
      deleteTax(tax.id);
      setSelectedTaxes(prev => prev.filter(selectedId => selectedId !== tax.id));
      toast.success('Tax deleted successfully');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTax(null);
  };

  const getLocationNames = (tax: Tax) => {
    if (tax.locationsFilter === 'all-locations') {
      return 'All Locations';
    }
    const location = getLocationById(tax.locationsFilter);
    return location ? location.name : 'Unknown Location';
  };

  const getTaxTypeDisplay = (taxType: string) => {
    switch (taxType) {
      case 'vat': return 'VAT';
      case 'sales-tax': return 'Sales Tax';
      case 'service-tax': return 'Service Tax';  
      case 'other': return 'Other';
      default: return 'Sales Tax';
    }
  };

  // Filter taxes
  const filteredTaxes = taxes.filter(tax => {
    const matchesSearch = tax.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && tax.enabled) ||
      (statusFilter === 'disabled' && !tax.enabled);
    const matchesLocation = locationFilter === 'all' || tax.locationsFilter === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTaxes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTaxes = filteredTaxes.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaxes(paginatedTaxes.map(tax => tax.id));
    } else {
      setSelectedTaxes([]);
    }
  };

  const handleSelectTax = (taxId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaxes(prev => [...prev, taxId]);
    } else {
      setSelectedTaxes(prev => prev.filter(id => id !== taxId));
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedTaxes.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedTaxes.length} tax(es)?`)) {
      selectedTaxes.forEach(taxId => {
        const tax = taxes.find(t => t.id === taxId);
        if (tax) deleteTax(tax.id);
      });
      setSelectedTaxes([]);
      toast.success(`${selectedTaxes.length} tax(es) deleted successfully`);
    }
  };

  const handleBulkDuplicate = () => {
    if (selectedTaxes.length === 0) return;
    
    let successCount = 0;
    selectedTaxes.forEach(taxId => {
      try {
        duplicateTax(taxId);
        successCount++;
      } catch (error) {
        console.error('Failed to duplicate tax:', error);
      }
    });
    
    setSelectedTaxes([]);
    
    if (successCount > 0) {
      toast.success(`${successCount} tax(es) duplicated successfully`);
    } else {
      toast.error('Failed to duplicate taxes');
    }
  };

  const handleExportToCSV = () => {
    const headers = ['ID', 'Name', 'Amount', 'Locations', 'Status'];
    const csvData = [
      headers.join(','),
      ...filteredTaxes.map((tax, index) => [
        index + 1,
        `"${tax.name}"`,
        `${tax.amount}%`,
        `"${getLocationNames(tax)}"`,
        `"${tax.enabled ? 'Enabled' : 'Disabled'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `taxes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Taxes exported to CSV successfully');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Taxes</h1>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
              {taxes.length}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={handleAddTax}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW TAX
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search taxes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="all-locations">All Locations</SelectItem>
                {/* Add specific locations here if needed */}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedTaxes.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedTaxes.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDuplicate}
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedTaxes.length > 0 &&
                      paginatedTaxes.every(tax => selectedTaxes.includes(tax.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>NAME</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead>AMOUNT</TableHead>
                <TableHead>LOCATIONS</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="w-[100px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTaxes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    {searchTerm ? 'No taxes found matching your search.' : 'No entries!'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTaxes.map((tax, index) => (
                  <TableRow 
                    key={tax.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEditTax(tax)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedTaxes.includes(tax.id)}
                        onCheckedChange={(checked) => 
                          handleSelectTax(tax.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{tax.name}</div>
                        {tax.description && (
                          <div className="text-sm text-slate-500">{tax.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getTaxTypeDisplay(tax.taxType || 'sales-tax')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span>{tax.amount}%</span>
                        {(tax.minimumAmount || tax.maximumAmount) && (
                          <div className="text-xs text-slate-500">
                            {tax.minimumAmount && `Min: $${tax.minimumAmount}`}
                            {tax.minimumAmount && tax.maximumAmount && ' | '}
                            {tax.maximumAmount && `Max: $${tax.maximumAmount}`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getLocationNames(tax)}</TableCell>
                    <TableCell>
                      <Badge variant={tax.enabled ? "default" : "secondary"}>
                        {tax.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditTax(tax)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTax(tax)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTaxes.length)} of {filteredTaxes.length} taxes
            </span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">per page</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Sliding Form */}
      <TaxForm 
        isOpen={isFormOpen} 
        onClose={handleFormClose} 
        tax={selectedTax}
      />
    </Layout>
  );
};

export default Taxes;