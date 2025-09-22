import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Copy, Download } from 'lucide-react';
import { CouponForm } from '@/components/coupons/CouponForm';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

const Coupons = () => {
  const { coupons, deleteCoupon, appointments, getCustomerById } = useAppData();
  const { formatPrice, currency } = useCurrency();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setIsFormOpen(true);
  };

  const handleEditCoupon = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleDeleteCoupon = (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      deleteCoupon(id);
      setSelectedCoupons(prev => prev.filter(selectedId => selectedId !== id));
      toast.success('Coupon deleted successfully');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedCoupon(null);
  };

  // Calculate coupon usage from appointments
  const getCouponUsageData = (couponId: string) => {
    const couponAppointments = appointments.filter(apt => 
      apt.appliedCoupons?.includes(couponId)
    );
    
    const usageHistory = couponAppointments.map(apt => {
      const customer = getCustomerById(apt.customerId);
      return {
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer',
        date: new Date(apt.date).toLocaleDateString(),
        appointmentId: apt.id
      };
    });

    return {
      timesUsed: couponAppointments.length,
      usageHistory
    };
  };

  // Format discount to use current currency
  const formatCouponDiscount = (discount: string) => {
    const match = discount.match(/^(\d+(?:\.\d+)?)(.*?)$/);
    if (!match) return discount;
    
    const value = match[1];
    const type = match[2];
    
    if (type === '%') {
      return `${value}%`;
    } else {
      return formatPrice(parseFloat(value));
    }
  };

  // Filter coupons
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.discount.toLowerCase().includes(searchTerm.toLowerCase());
    
    const usageData = getCouponUsageData(coupon.id);
    let matchesStatus = true;
    
    if (statusFilter === 'active') {
      matchesStatus = coupon.status === 'Active' && 
        (coupon.usageLimit === 'No limit' || usageData.timesUsed < parseInt(coupon.usageLimit));
    } else if (statusFilter === 'inactive') {
      matchesStatus = coupon.status === 'Inactive';
    } else if (statusFilter === 'limit-reached') {
      matchesStatus = coupon.status === 'Active' && 
        coupon.usageLimit !== 'No limit' && 
        usageData.timesUsed >= parseInt(coupon.usageLimit);
    }
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCoupons = filteredCoupons.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCoupons(paginatedCoupons.map(coupon => coupon.id));
    } else {
      setSelectedCoupons([]);
    }
  };

  const handleSelectCoupon = (couponId: string, checked: boolean) => {
    if (checked) {
      setSelectedCoupons(prev => [...prev, couponId]);
    } else {
      setSelectedCoupons(prev => prev.filter(id => id !== couponId));
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedCoupons.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedCoupons.length} coupon(s)?`)) {
      selectedCoupons.forEach(couponId => {
        deleteCoupon(couponId);
      });
      setSelectedCoupons([]);
      toast.success(`${selectedCoupons.length} coupon(s) deleted successfully`);
    }
  };

  const handleBulkDuplicate = () => {
    toast.success(`${selectedCoupons.length} coupon(s) duplicated successfully`);
  };

  const handleExportToCSV = () => {
    const headers = ['No.', 'Code', 'Discount', 'Usage Limit', 'Times Used', 'Status', 'Usage History'];
    const csvData = [
      headers.join(','),
      ...filteredCoupons.map((coupon, index) => {
        const usageData = getCouponUsageData(coupon.id);
        return [
          index + 1,
          `"${coupon.code}"`,
          `"${formatCouponDiscount(coupon.discount)}"`,
          coupon.usageLimit,
          usageData.timesUsed,
          `"${coupon.status}"`,
          `"${usageData.usageHistory.length} uses"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `coupons-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Coupons exported to CSV successfully');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
              {coupons.length}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleAddCoupon} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              ADD COUPON
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search coupons..."
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
                <SelectItem value="limit-reached">Limit Reached</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedCoupons.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedCoupons.length} selected
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
                      paginatedCoupons.length > 0 &&
                      paginatedCoupons.every(coupon => selectedCoupons.includes(coupon.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>№</TableHead>
                <TableHead>CODE</TableHead>
                <TableHead>DISCOUNT</TableHead>
                <TableHead>USAGE LIMIT</TableHead>
                <TableHead>USAGE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>USAGE HISTORY</TableHead>
                <TableHead className="w-[100px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCoupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No coupons found matching your search.' : 'No entries!'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCoupons.map((coupon, index) => {
                  const usageData = getCouponUsageData(coupon.id);
                  return (
                    <TableRow 
                      key={coupon.id} 
                      className="hover:bg-gray-50"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedCoupons.includes(coupon.id)}
                          onCheckedChange={(checked) => 
                            handleSelectCoupon(coupon.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>{startIndex + index + 1}</TableCell>
                       <TableCell className="font-medium">{coupon.code}</TableCell>
                       <TableCell>{formatCouponDiscount(coupon.discount)}</TableCell>
                      <TableCell>{coupon.usageLimit}</TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-600">
                          {coupon.usageLimit === 'No limit' 
                            ? `${usageData.timesUsed}/∞`
                            : `${usageData.timesUsed}/${coupon.usageLimit}`
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          coupon.status === 'Active' && 
                          (coupon.usageLimit === 'No limit' || usageData.timesUsed < parseInt(coupon.usageLimit))
                            ? 'bg-green-100 text-green-800' 
                            : coupon.status === 'Active' && usageData.timesUsed >= parseInt(coupon.usageLimit)
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coupon.status === 'Active' && 
                           coupon.usageLimit !== 'No limit' && 
                           usageData.timesUsed >= parseInt(coupon.usageLimit) 
                            ? 'Limit Reached' 
                            : coupon.status
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        {usageData.usageHistory.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {usageData.usageHistory.length} uses
                            </div>
                            {usageData.usageHistory.slice(0, 2).map((usage, idx) => (
                              <div key={idx} className="text-xs text-gray-500">
                                {usage.customerName} - {usage.date}
                              </div>
                            ))}
                            {usageData.usageHistory.length > 2 && (
                              <div className="text-xs text-blue-600">
                                +{usageData.usageHistory.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No usage yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-blue-600 h-8 w-8 p-0"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-red-600 h-8 w-8 p-0"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCoupons.length)} of {filteredCoupons.length} coupons
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

      {/* Coupon Form */}
      <CouponForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        coupon={selectedCoupon}
      />
    </Layout>
  );
};

export default Coupons;