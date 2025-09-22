import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Calendar, DollarSign, Edit, Trash2, Copy, Download } from 'lucide-react';
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
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    // Load drafts from localStorage
    const savedDrafts = JSON.parse(localStorage.getItem('invoiceDrafts') || '[]');
    setDrafts(savedDrafts);
  }, [showForm]); // Reload when form is closed

  const filteredInvoices = drafts.filter((draft: any) => {
    const matchesSearch = 
      draft.billedTo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draft.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For now, all invoices are drafts, but we can extend this logic
    const matchesStatus = statusFilter === 'all' || statusFilter === 'draft';
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

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
    setSelectedInvoices(prev => prev.filter(selectedId => selectedId !== draftId));
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(paginatedInvoices.map((invoice: any) => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedInvoices.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoice(s)?`)) {
      selectedInvoices.forEach(invoiceId => {
        handleDeleteDraft(invoiceId);
      });
      setSelectedInvoices([]);
    }
  };

  const handleBulkDuplicate = () => {
    // Implement bulk duplicate logic here
    console.log('Duplicating invoices:', selectedInvoices);
  };

  const handleExportToCSV = () => {
    const headers = ['Invoice #', 'Name', 'Date', 'Amount', 'Status'];
    const csvData = [
      headers.join(','),
      ...filteredInvoices.map((draft: any) => [
        `"${draft.invoiceNumber}"`,
        `"${draft.billedTo.name}"`,
        `"${format(new Date(draft.createdAt), 'MMM dd, yyyy')}"`,
        formatPrice(draft.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)),
        `"Draft"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={handleNewInvoice}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE INVOICE</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between space-x-4">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedInvoices.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedInvoices.length} selected
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
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedInvoices.length > 0 &&
                      paginatedInvoices.every((invoice: any) => selectedInvoices.includes(invoice.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold">Invoice #</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[100px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
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
                paginatedInvoices.map((draft: any) => (
                  <TableRow key={draft.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.includes(draft.id)}
                        onCheckedChange={(checked) => 
                          handleSelectInvoice(draft.id, checked as boolean)
                        }
                      />
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

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
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

export default Invoices;