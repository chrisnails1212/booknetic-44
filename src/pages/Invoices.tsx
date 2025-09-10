
import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';

const Invoices = () => {
  const { formatPrice } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDraft, setEditingDraft] = useState(null);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    // Load drafts from localStorage
    const savedDrafts = JSON.parse(localStorage.getItem('invoiceDrafts') || '[]');
    setDrafts(savedDrafts);
  }, [showForm]); // Reload when form is closed

  const filteredInvoices = drafts.filter((draft: any) =>
    draft.billedTo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditDraft = (draft: any) => {
    setEditingDraft(draft);
    setShowForm(true);
  };

  const handleNewInvoice = () => {
    setEditingDraft(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setEditingDraft(null);
    setShowForm(false);
  };

  const handleDeleteDraft = (draftId: string) => {
    const savedDrafts = JSON.parse(localStorage.getItem('invoiceDrafts') || '[]');
    const updatedDrafts = savedDrafts.filter((draft: any) => draft.id !== draftId);
    localStorage.setItem('invoiceDrafts', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
  };

  if (showForm) {
    return (
      <Layout>
        <InvoiceForm onBack={handleCloseForm} editingDraft={editingDraft} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredInvoices.length}
            </span>
          </div>
          <Button 
            onClick={handleNewInvoice}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE INVOICE</span>
          </Button>
        </div>


        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-slate-300" />
                </TableHead>
                <TableHead className="font-semibold">Invoice #</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-3">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <div>
                        <p className="text-slate-500 font-medium">No invoices found</p>
                        <p className="text-slate-400 text-sm">
                          {searchTerm ? 'Try adjusting your search terms' : 'Create your first invoice to get started'}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button 
                          onClick={handleNewInvoice}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Invoice
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((draft: any) => (
                  <TableRow key={draft.id} className="hover:bg-slate-50">
                    <TableCell>
                      <input type="checkbox" className="rounded border-slate-300" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {draft.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {draft.billedTo.name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(draft.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {formatPrice(draft.items.reduce((sum: number, item: any) => 
                        sum + (item.quantity * item.unitPrice), 0))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Draft
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDraft(draft)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete invoice {draft.invoiceNumber}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteDraft(draft.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
            <span>Showing {filteredInvoices.length} of {drafts.length} invoices</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Need Help?</span>
            <Button variant="link" className="text-indigo-600 p-0 h-auto">
              Documentation
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Invoices;
