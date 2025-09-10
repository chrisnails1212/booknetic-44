
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Copy } from 'lucide-react';
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

  // Load saved forms from localStorage on component mount and when returning from builder
  React.useEffect(() => {
    const loadSavedForms = () => {
      const existingForms = JSON.parse(localStorage.getItem('customForms') || '[]');
      
      // Always create/update the first visit form with the new structure
      const firstVisitForm: SavedForm = {
        id: 'first-visit-form',
        name: 'First Visit Customer Form',
        elements: 6, // Updated count
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
        },
        {
          id: 'gender',
          type: 'select',
          label: 'Gender',
          required: false,
          options: ['Male', 'Female', 'Other', 'Prefer not to say']
        },
        {
          id: 'date-of-birth',
          type: 'date-input',
          label: 'Date of Birth',
          required: false
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
  
  const filteredForms = formsToDisplay.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.services.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteForm = (id: string) => {
    const updatedForms = savedForms.filter(form => form.id !== id);
    setSavedForms(updatedForms);
    localStorage.setItem('customForms', JSON.stringify(updatedForms));
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
          <Button 
            onClick={handleNewForm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            CREATE NEW FORM
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Quick search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-slate-300" />
                </TableHead>
                <TableHead>NAME</TableHead>
                <TableHead>ELEMENTS</TableHead>
                <TableHead>SERVICES</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    {searchTerm ? 'No forms match your search criteria' : 'No forms created yet!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredForms.map((form) => (
                  <TableRow 
                    key={form.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleViewForm(form)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300" />
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

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredForms.length} of {formsToDisplay.length} total</span>
            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-xs">i</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span>Need Help?</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomForms;
