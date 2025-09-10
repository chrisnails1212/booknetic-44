
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { TaxForm } from '@/components/taxes/TaxForm';
import { useAppData, Tax } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

const Taxes = () => {
  const { taxes, deleteTax, getLocationById, getServiceById } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      toast.success('Tax deleted successfully');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTax(null);
  };

  const filteredTaxes = taxes.filter(tax =>
    tax.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocationNames = (tax: Tax) => {
    if (tax.locationsFilter === 'all-locations') {
      return 'All Locations';
    }
    const location = getLocationById(tax.locationsFilter);
    return location ? location.name : 'Unknown Location';
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
          <Button 
            onClick={handleAddTax}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            NEW TAX
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Quick search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-slate-300" />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>NAME</TableHead>
                <TableHead>AMOUNT</TableHead>
                <TableHead>LOCATIONS</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTaxes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No entries!
                  </TableCell>
                </TableRow>
              ) : (
                filteredTaxes.map((tax, index) => (
                  <TableRow 
                    key={tax.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEditTax(tax)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300" />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{tax.name}</TableCell>
                    <TableCell>{tax.amount}%</TableCell>
                    <TableCell>{getLocationNames(tax)}</TableCell>
                    <TableCell>
                      <Badge variant={tax.enabled ? "default" : "secondary"}>
                        {tax.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTax(tax)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTax(tax)}
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
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredTaxes.length} of {taxes.length} total</span>
            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-xs">i</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span>Need Help?</span>
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
