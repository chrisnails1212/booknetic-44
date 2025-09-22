import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Copy, Download } from 'lucide-react';
import { GiftcardForm } from '@/components/giftcards/GiftcardForm';
import { useAppData, Giftcard } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

const Giftcards = () => {
  const { giftcards, deleteGiftcard, appointments, getCustomerById } = useAppData();
  const { formatPrice } = useCurrency();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGiftcard, setSelectedGiftcard] = useState<Giftcard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGiftcards, setSelectedGiftcards] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const handleAddGiftcard = () => {
    setSelectedGiftcard(null);
    setIsFormOpen(true);
  };

  const handleEditGiftcard = (giftcard: Giftcard) => {
    setSelectedGiftcard(giftcard);
    setIsFormOpen(true);
  };

  const handleDeleteGiftcard = (giftcard: Giftcard) => {
    if (window.confirm(`Are you sure you want to delete gift card "${giftcard.code}"?`)) {
      deleteGiftcard(giftcard.id);
      setSelectedGiftcards(prev => prev.filter(selectedId => selectedId !== giftcard.id));
      toast.success('Gift card deleted successfully');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedGiftcard(null);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'No expiration';
    return new Date(date).toLocaleDateString();
  };

  const isExpired = (expiresAt: Date | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Get usage count for display
  const getUsageCount = (giftcard: Giftcard) => {
    return giftcard.usageHistory?.length || 0;
  };

  // Check if usage limit is reached
  const isUsageLimitReached = (giftcard: Giftcard) => {
    if (giftcard.usageLimit === 'no-limit') return false;
    const usageLimit = parseInt(giftcard.usageLimit);
    const timesUsed = getUsageCount(giftcard);
    return timesUsed >= usageLimit;
  };

  // Get status for filtering
  const getGiftcardStatus = (giftcard: Giftcard) => {
    if (!giftcard.isActive) return 'inactive';
    if (isExpired(giftcard.expiresAt)) return 'expired';
    if (isUsageLimitReached(giftcard)) return 'limit-reached';
    if ((giftcard.leftover || giftcard.balance) <= 0) return 'used';
    return 'active';
  };

  // Filter giftcards
  const filteredGiftcards = giftcards.filter(giftcard => {
    const matchesSearch = giftcard.code.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getGiftcardStatus(giftcard);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredGiftcards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGiftcards = filteredGiftcards.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGiftcards(paginatedGiftcards.map(giftcard => giftcard.id));
    } else {
      setSelectedGiftcards([]);
    }
  };

  const handleSelectGiftcard = (giftcardId: string, checked: boolean) => {
    if (checked) {
      setSelectedGiftcards(prev => [...prev, giftcardId]);
    } else {
      setSelectedGiftcards(prev => prev.filter(id => id !== giftcardId));
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedGiftcards.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedGiftcards.length} gift card(s)?`)) {
      selectedGiftcards.forEach(giftcardId => {
        const giftcard = giftcards.find(gc => gc.id === giftcardId);
        if (giftcard) deleteGiftcard(giftcard.id);
      });
      setSelectedGiftcards([]);
      toast.success(`${selectedGiftcards.length} gift card(s) deleted successfully`);
    }
  };

  const handleBulkDuplicate = () => {
    toast.success(`${selectedGiftcards.length} gift card(s) duplicated successfully`);
  };

  const handleExportToCSV = () => {
    const headers = ['Code', 'Balance', 'Spent', 'Leftover', 'Usage', 'Status', 'Expires'];
    const csvData = [
      headers.join(','),
      ...filteredGiftcards.map((giftcard) => [
        `"${giftcard.code}"`,
        formatPrice(giftcard.originalAmount || giftcard.balance),
        formatPrice(giftcard.spent || 0),
        formatPrice(giftcard.leftover || giftcard.balance),
        `${getUsageCount(giftcard)}/${giftcard.usageLimit === 'no-limit' ? '∞' : giftcard.usageLimit}`,
        `"${getGiftcardStatus(giftcard)}"`,
        `"${formatDate(giftcard.expiresAt)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `giftcards-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Gift cards exported to CSV successfully');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-gray-900">Gift Cards</h1>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
              {giftcards.length}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleAddGiftcard} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              ADD GIFT CARD
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="limit-reached">Limit Reached</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedGiftcards.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedGiftcards.length} selected
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
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedGiftcards.length > 0 &&
                      paginatedGiftcards.every(giftcard => selectedGiftcards.includes(giftcard.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>№</TableHead>
                <TableHead>CODE</TableHead>
                <TableHead>BALANCE</TableHead>
                <TableHead>SPENT</TableHead>
                <TableHead>LEFTOVER</TableHead>
                <TableHead>USAGE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>EXPIRES</TableHead>
                <TableHead className="w-[100px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGiftcards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No gift cards found matching your search.' : 'No gift cards found!'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGiftcards.map((giftcard, index) => (
                  <TableRow 
                    key={giftcard.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEditGiftcard(giftcard)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedGiftcards.includes(giftcard.id)}
                        onCheckedChange={(checked) => 
                          handleSelectGiftcard(giftcard.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{giftcard.code}</TableCell>
                    <TableCell>{formatPrice(giftcard.originalAmount || giftcard.balance)}</TableCell>
                    <TableCell>{formatPrice(giftcard.spent || 0)}</TableCell>
                    <TableCell>{formatPrice(giftcard.leftover || giftcard.balance)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getUsageCount(giftcard)}/{giftcard.usageLimit === 'no-limit' ? '∞' : giftcard.usageLimit}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        !giftcard.isActive ? "destructive" :
                        isExpired(giftcard.expiresAt) ? "secondary" :
                        isUsageLimitReached(giftcard) ? "outline" :
                        (giftcard.leftover || giftcard.balance) <= 0 ? "outline" : "default"
                      }>
                        {!giftcard.isActive ? "Inactive" :
                        isExpired(giftcard.expiresAt) ? "Expired" :
                        isUsageLimitReached(giftcard) ? "Limit Reached" :
                        (giftcard.leftover || giftcard.balance) <= 0 ? "Used" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(giftcard.expiresAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditGiftcard(giftcard)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteGiftcard(giftcard)}
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredGiftcards.length)} of {filteredGiftcards.length} gift cards
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

      {/* Giftcard Form */}
      <GiftcardForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        giftcard={selectedGiftcard}
      />
    </Layout>
  );
};

export default Giftcards;