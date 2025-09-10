
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
      toast.success('Gift card deleted successfully');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedGiftcard(null);
  };

  const filteredGiftcards = giftcards.filter(giftcard =>
    giftcard.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Button onClick={handleAddGiftcard} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            ADD GIFT CARD
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by code..."
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
                <TableHead>№</TableHead>
                <TableHead>CODE</TableHead>
                <TableHead>BALANCE</TableHead>
                <TableHead>SPENT</TableHead>
                <TableHead>LEFTOVER</TableHead>
                <TableHead>USAGE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>EXPIRES</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGiftcards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No gift cards found!
                  </TableCell>
                </TableRow>
              ) : (
                filteredGiftcards.map((giftcard, index) => (
                  <TableRow 
                    key={giftcard.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEditGiftcard(giftcard)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGiftcard(giftcard)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGiftcard(giftcard)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredGiftcards.length} of {giftcards.length} total</span>
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              i
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-700">
            Need Help?
          </button>
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
