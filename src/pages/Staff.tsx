
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { StaffForm } from '@/components/staff/StaffForm';
import { Search, Plus, Edit, Trash2, Filter, X, CalendarIcon, Download, UserCheck, Users } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Staff = () => {
  const { staff, deleteStaff, services, locations } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    role: '',
    department: '',
    services: [] as string[],
    locations: [] as string[],
    workingDays: '',
    availabilityStatus: ''
  });

  const handleAddStaff = () => {
    setEditingStaff(null);
    setIsFormOpen(true);
  };

  const handleEditStaff = (staffMember: any) => {
    setEditingStaff(staffMember);
    setIsFormOpen(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteStaff(id);
      toast.success('Staff member deleted successfully');
      setSelectedStaff(prev => prev.filter(staffId => staffId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedStaff.length === 0) {
      toast.error('Please select staff members to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedStaff.length} staff member(s)?`)) {
      selectedStaff.forEach(id => deleteStaff(id));
      toast.success(`${selectedStaff.length} staff member(s) deleted successfully`);
      setSelectedStaff([]);
    }
  };

  const handleSelectStaff = (staffId: string, checked: boolean) => {
    if (checked) {
      setSelectedStaff(prev => [...prev, staffId]);
    } else {
      setSelectedStaff(prev => prev.filter(id => id !== staffId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStaff(filteredStaff.map(s => s.id));
    } else {
      setSelectedStaff([]);
    }
  };

  const clearAdvancedFilter = (filterType: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'services' || filterType === 'locations' ? [] : ''
    }));
  };

  const resetAllAdvancedFilters = () => {
    setAdvancedFilters({
      role: '',
      department: '',
      services: [],
      locations: [],
      workingDays: '',
      availabilityStatus: ''
    });
  };

  const hasActiveAdvancedFilters = () => {
    return advancedFilters.role || 
           advancedFilters.department || 
           advancedFilters.services.length > 0 || 
           advancedFilters.locations.length > 0 || 
           advancedFilters.workingDays || 
           advancedFilters.availabilityStatus;
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStaff(null);
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(staffMember => {
      // Basic search
      const matchesSearch = staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           staffMember.phone.includes(searchTerm);
      
      if (!matchesSearch) return false;
      
      // Advanced filters
      if (advancedFilters.role && staffMember.role !== advancedFilters.role) {
        return false;
      }
      
      if (advancedFilters.department && staffMember.department !== advancedFilters.department) {
        return false;
      }
      
      if (advancedFilters.services.length > 0) {
        const hasMatchingService = advancedFilters.services.some(serviceId => 
          staffMember.services?.includes(serviceId)
        );
        if (!hasMatchingService) return false;
      }
      
      if (advancedFilters.locations.length > 0) {
        const hasMatchingLocation = advancedFilters.locations.some(locationId => 
          staffMember.locations?.includes(locationId)
        );
        if (!hasMatchingLocation) return false;
      }
      
      if (advancedFilters.workingDays) {
        const schedule = staffMember.schedule?.weekly;
        if (schedule) {
          const workingDays = Object.entries(schedule).filter(([_, hours]: [string, any]) => hours?.isWorking);
          const workingDayCount = workingDays.length;
          
          if (advancedFilters.workingDays === 'weekdays' && workingDayCount < 5) return false;
          if (advancedFilters.workingDays === 'weekends' && !schedule.saturday?.isWorking && !schedule.sunday?.isWorking) return false;
        }
      }
      
      // Note: Availability status would require real-time data, skipping for now
      
      return true;
    });
  }, [staff, searchTerm, advancedFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, advancedFilters, itemsPerPage]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold text-gray-900">Staff</h1>
            <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm font-medium">
              {filteredStaff.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {selectedStaff.length > 0 && (
              <>
                <Button 
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="px-4 py-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedStaff.length})
                </Button>
              </>
            )}
            <Button 
              onClick={handleAddStaff}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              ADD STAFF
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Quick search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                "flex items-center gap-2",
                hasActiveAdvancedFilters() && "bg-blue-50 border-blue-200 text-blue-700"
              )}
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              {hasActiveAdvancedFilters() && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {[
                    advancedFilters.role && 'Role',
                    advancedFilters.department && 'Department', 
                    advancedFilters.services.length && 'Services',
                    advancedFilters.locations.length && 'Locations',
                    advancedFilters.workingDays && 'Working Days',
                    advancedFilters.availabilityStatus && 'Availability'
                  ].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <Select value={advancedFilters.role || 'all'} onValueChange={(value) => 
                  setAdvancedFilters(prev => ({ ...prev, role: value === 'all' ? '' : value }))
                }>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="stylist">Stylist</SelectItem>
                    <SelectItem value="colorist">Colorist</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <Select value={advancedFilters.department || 'all'} onValueChange={(value) => 
                  setAdvancedFilters(prev => ({ ...prev, department: value === 'all' ? '' : value }))
                }>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    <SelectItem value="hair">Hair</SelectItem>
                    <SelectItem value="nails">Nails</SelectItem>
                    <SelectItem value="skincare">Skincare</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="reception">Reception</SelectItem>
                  </SelectContent>
                </Select>
                </div>

                {/* Working Days Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                <Select value={advancedFilters.workingDays || 'all'} onValueChange={(value) => 
                  setAdvancedFilters(prev => ({ ...prev, workingDays: value === 'all' ? '' : value }))
                }>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All schedules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All schedules</SelectItem>
                    <SelectItem value="weekdays">Weekdays only</SelectItem>
                    <SelectItem value="weekends">Works weekends</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveAdvancedFilters() && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {advancedFilters.role && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      Role: {advancedFilters.role}
                      <button onClick={() => clearAdvancedFilter('role')} className="hover:bg-blue-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {advancedFilters.department && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      Department: {advancedFilters.department}
                      <button onClick={() => clearAdvancedFilter('department')} className="hover:bg-blue-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {advancedFilters.workingDays && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      Working Days: {advancedFilters.workingDays}
                      <button onClick={() => clearAdvancedFilter('workingDays')} className="hover:bg-blue-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button 
                    onClick={resetAllAdvancedFilters}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStaff.length === paginatedStaff.length && paginatedStaff.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all staff"
                  />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">ID</TableHead>
                <TableHead className="text-gray-600 font-medium">STAFF MEMBER</TableHead>
                <TableHead className="text-gray-600 font-medium">EMAIL</TableHead>
                <TableHead className="text-gray-600 font-medium">PHONE</TableHead>
                <TableHead className="text-gray-600 font-medium">ROLE</TableHead>
                <TableHead className="text-gray-600 font-medium">DEPARTMENT</TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    {searchTerm || hasActiveAdvancedFilters() ? 'No staff members found matching your criteria.' : 'No entries!'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStaff.map((staffMember) => (
                  <TableRow key={staffMember.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedStaff.includes(staffMember.id)}
                        onCheckedChange={(checked) => handleSelectStaff(staffMember.id, checked as boolean)}
                        aria-label={`Select ${staffMember.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-gray-900 font-mono text-sm">
                      {staffMember.id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          {staffMember.avatar ? (
                            <AvatarImage src={staffMember.avatar} alt={staffMember.name} className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                              {getInitials(staffMember.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-gray-900 font-medium">{staffMember.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900">{staffMember.email}</TableCell>
                    <TableCell className="text-gray-900">{staffMember.phone}</TableCell>
                    <TableCell className="text-gray-900 capitalize">{staffMember.role}</TableCell>
                    <TableCell className="text-gray-900 capitalize">{staffMember.department}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-blue-600"
                        onClick={() => handleEditStaff(staffMember)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => handleDeleteStaff(staffMember.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination and Footer */}
        <div className="flex flex-col gap-4">
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
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
                <span className="text-sm text-gray-600">entries</span>
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
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
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} staff members
                {filteredStaff.length !== staff.length && ` (filtered from ${staff.length} total)`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Need Help?</span>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                ?
              </Button>
            </div>
          </div>
        </div>
      </div>

      <StaffForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        staff={editingStaff}
      />
    </Layout>
  );
};

export default Staff;
