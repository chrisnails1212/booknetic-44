import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Copy, Download } from 'lucide-react';
import { CustomFormBuilder } from '@/components/forms/CustomFormBuilder';

interface SavedForm {
  id: string;
  name: string;
  elements: number;
  conditions: number;
  services: string;
  createdAt: Date;
}

const CustomForms = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [editingForm, setEditingForm] = useState<SavedForm | null>(null);
  const [viewingForm, setViewingForm] = useState<SavedForm | null>(null);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Load saved forms from localStorage on component mount and when returning from builder
  React.useEffect(() => {
    const loadSavedForms = () => {
      const existingForms = JSON.parse(localStorage.getItem('customForms') || '[]');
      
      // Always create/update the first visit form with the new structure
      const firstVisitForm: SavedForm = {
        id: 'first-visit-form',
        name: 'First Visit Customer Form',
        elements: 4, // Updated count
        conditions: 0, // No conditions anymore
        services: 'All Services',
        createdAt: new Date(),
      };
      
      // Create the detailed form structure (without conditional logic)
      const formElements = [
        {
          id: 'first-name',
          type: 'text-input',
          label: 'First Name',
          required: true,
          placeholder: 'First name'
        },
        {
          id: 'last-name',
          type: 'text-input',
          label: 'Last Name',
          required: true,
          placeholder: 'Last name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
          placeholder: 'example@email.com'
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'Phone',
          required: true,
          placeholder: 'Phone number'
        }
      ];
      
      // Always save/update the form structure
      localStorage.setItem(`customForm_${firstVisitForm.id}`, JSON.stringify(formElements));
      
      // Update the forms list
      const otherForms = existingForms.filter((form: SavedForm) => form.id !== 'first-visit-form');
      const updatedForms = [firstVisitForm, ...otherForms];
      localStorage.setItem('customForms', JSON.stringify(updatedForms));
      setSavedForms(updatedForms);
    };
    
    loadSavedForms();
  }, [showBuilder]); // Reload when showBuilder changes (when returning from form builder)

  const formsToDisplay = savedForms;
  
  const filteredForms = formsToDisplay.filter(form => {
    const matchesSearch = 
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.services.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = serviceFilter === 'all' || 
      form.services.toLowerCase().includes(serviceFilter.toLowerCase());
    
    return matchesSearch && matchesService;
  });

  // Pagination
  const totalPages = Math.ceil(filteredForms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedForms = filteredForms.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteForm = (id: string) => {
    const updatedForms = savedForms.filter(form => form.id !== id);
    setSavedForms(updatedForms);
    localStorage.setItem('customForms', JSON.stringify(updatedForms));
    setSelectedForms(prev => prev.filter(selectedId => selectedId !== id));
  };

  const handleDuplicateForm = (form: SavedForm) => {
    const newForm: SavedForm = {
      ...form,
      id: `${form.id}_copy_${Date.now()}`,
      name: `${form.name} (Copy)`,
      createdAt: new Date(),
    };
    const updatedForms = [...savedForms, newForm];
    setSavedForms(updatedForms);
    localStorage.setItem('customForms', JSON.stringify(updatedForms));
  };

  const handleEditForm = (form: SavedForm) => {
    setEditingForm(form);
    setViewingForm(null);
    setShowBuilder(true);
  };

  const handleViewForm = (form: SavedForm) => {
    setViewingForm(form);
    setEditingForm(null);
    setShowBuilder(true);
  };

  const handleNewForm = () => {
    setEditingForm(null);
    setViewingForm(null);
    setShowBuilder(true);
  };

  const handleCloseBuilder = () => {
    setEditingForm(null);
    setViewingForm(null);
    setShowBuilder(false);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedForms(paginatedForms.map(form => form.id));
    } else {
      setSelectedForms([]);
    }
  };

  const handleSelectForm = (formId: string, checked: boolean) => {
    if (checked) {
      setSelectedForms(prev => [...prev, formId]);
    } else {
      setSelectedForms(prev => prev.filter(id => id !== formId));
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedForms.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedForms.length} form(s)?`)) {
      selectedForms.forEach(formId => {
        handleDeleteForm(formId);
      });
      setSelectedForms([]);
    }
  };

  const handleBulkDuplicate = () => {
    selectedForms.forEach(formId => {
      const form = savedForms.find(f => f.id === formId);
      if (form) handleDuplicateForm(form);
    });
    setSelectedForms([]);
  };

  const handleExportToCSV = () => {
    const headers = ['Name', 'Elements', 'Services', 'Created'];
    const csvData = [
      headers.join(','),
      ...filteredForms.map((form) => [
        `"${form.name}"`,
        form.elements,
        `"${form.services}"`,
        `"${form.createdAt}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `custom-forms-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showBuilder) {
    return (
      <Layout>
        <CustomFormBuilder 
          onBack={handleCloseBuilder} 
          editingForm={editingForm} 
          viewingForm={viewingForm}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Custom forms</h1>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
              {filteredForms.length}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={handleNewForm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              CREATE NEW FORM
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="specific">Specific Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedForms.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedForms.length} selected
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
                      paginatedForms.length > 0 &&
                      paginatedForms.every(form => selectedForms.includes(form.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>NAME</TableHead>
                <TableHead>ELEMENTS</TableHead>
                <TableHead>SERVICES</TableHead>
                <TableHead className="w-[100px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    {searchTerm ? 'No forms match your search criteria' : 'No forms created yet!'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedForms.map((form) => (
                  <TableRow 
                    key={form.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleViewForm(form)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedForms.includes(form.id)}
                        onCheckedChange={(checked) => 
                          handleSelectForm(form.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {form.name}
                    </TableCell>
                    <TableCell>
                      {form.elements}
                    </TableCell>
                    <TableCell>
                      {form.services}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDuplicateForm(form)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {form.id !== 'first-visit-form' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditForm(form)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteForm(form.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredForms.length)} of {filteredForms.length} forms
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
    </Layout>
  );
};

export default CustomForms;