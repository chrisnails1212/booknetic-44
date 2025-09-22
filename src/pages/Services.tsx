
import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, Plus, List, Grid, Edit, Trash2, ChevronUp, ChevronDown, 
  Filter, Copy, MoreHorizontal, ArrowUpDown 
} from 'lucide-react';
import { ServiceForm } from '@/components/services/ServiceForm';
import { useAppData, Service } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function Services() {
  const { services, deleteService, getStaffById, staff, addService } = useAppData();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);
  
  // View and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'graphic' | 'list'>('list');
  
  // Selection and bulk operations
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Sorting
  const [sortField, setSortField] = useState<'name' | 'category' | 'price' | 'duration'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: { min: '', max: '' },
    durationRange: { min: '', max: '' },
    staffId: 'all',
  });

  // Enhanced filtering with advanced search
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Basic search
      const searchMatch = 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        service.staffIds.some(staffId => {
          const staffMember = getStaffById(staffId);
          return staffMember?.name.toLowerCase().includes(searchTerm.toLowerCase());
        });
      
      if (!searchMatch) return false;
      
      // Category filter
      if (filters.category !== 'all' && service.category !== filters.category) {
        return false;
      }
      
      // Price range filter
      if (filters.priceRange.min && service.price < parseFloat(filters.priceRange.min)) {
        return false;
      }
      if (filters.priceRange.max && service.price > parseFloat(filters.priceRange.max)) {
        return false;
      }
      
      // Duration range filter
      if (filters.durationRange.min && service.duration < parseInt(filters.durationRange.min)) {
        return false;
      }
      if (filters.durationRange.max && service.duration > parseInt(filters.durationRange.max)) {
        return false;
      }
      
      // Staff filter
      if (filters.staffId !== 'all' && !service.staffIds.includes(filters.staffId)) {
        return false;
      }
      
      return true;
    });
  }, [services, searchTerm, filters, getStaffById]);

  // Sorted and paginated services
  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'name' || sortField === 'category') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sorted;
  }, [filteredServices, sortField, sortDirection]);

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedServices.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedServices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedServices.length / itemsPerPage);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map(s => s.category)));
    return cats;
  }, [services]);

  const handleAddService = () => {
    setEditingService(undefined);
    setIsFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteService(service.id);
      setSelectedServices(prev => prev.filter(id => id !== service.id));
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingService(undefined);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedServices(paginatedServices.map(service => service.id));
    } else {
      setSelectedServices([]);
    }
  };

  const handleSelectService = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, serviceId]);
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedServices.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedServices.length} service(s)?`)) {
      selectedServices.forEach(serviceId => {
        deleteService(serviceId);
      });
      setSelectedServices([]);
      toast({
        title: "Success",
        description: `${selectedServices.length} service(s) deleted successfully`,
      });
    }
  };

  const handleBulkDuplicate = () => {
    if (selectedServices.length === 0) return;
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const duplicatedService = {
          ...service,
          name: `${service.name} (Copy)`,
        };
        delete (duplicatedService as any).id; // Remove ID so a new one is generated
        addService(duplicatedService);
      }
    });
    
    setSelectedServices([]);
    toast({
      title: "Success",
      description: `${selectedServices.length} service(s) duplicated successfully`,
    });
  };

  // Sorting handler
  const handleSort = (field: 'name' | 'category' | 'price' | 'duration') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter handlers
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePriceFilterChange = (type: 'min' | 'max', value: string) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: value
      }
    }));
    setCurrentPage(1);
  };

  const handleDurationFilterChange = (type: 'min' | 'max', value: string) => {
    setFilters(prev => ({
      ...prev,
      durationRange: {
        ...prev.durationRange,
        [type]: value
      }
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      priceRange: { min: '', max: '' },
      durationRange: { min: '', max: '' },
      staffId: 'all',
    });
    setCurrentPage(1);
  };

  const getServicesByCategory = (category: string) => {
    return filteredServices.filter(s => s.category === category);
  };

  const renderStaffProfiles = (staffIds: string[], maxVisible: number = 3) => {
    const visibleStaff = staffIds.slice(0, maxVisible);
    const remainingCount = staffIds.length - maxVisible;

    return (
      <div className="flex -space-x-1">
        {visibleStaff.map(staffId => {
          const staffMember = getStaffById(staffId);
          if (!staffMember) return null;
          
          return (
            <Avatar key={staffId} className="w-6 h-6 border-2 border-white">
              <AvatarImage src={staffMember.avatar} alt={staffMember.name} />
              <AvatarFallback className="text-xs">
                {staffMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          );
        })}
        {remainingCount > 0 && (
          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
            <span className="text-xs text-gray-600">+{remainingCount}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {services.length}
            </Badge>
            {selectedServices.length > 0 && (
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                {selectedServices.length} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {selectedServices.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleBulkDuplicate}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button 
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
            <Button 
              onClick={handleAddService} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              ADD SERVICE
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search services, staff, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {(filters.category !== 'all' || filters.priceRange.min || filters.priceRange.max || 
              filters.durationRange.min || filters.durationRange.max || filters.staffId !== 'all') && (
              <Button variant="ghost" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>

          <Collapsible open={showFilters}>
            <CollapsibleContent>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category} className="capitalize">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Staff Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Staff</label>
                    <Select value={filters.staffId} onValueChange={(value) => handleFilterChange('staffId', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        {staff.map(staffMember => (
                          <SelectItem key={staffMember.id} value={staffMember.id}>
                            {staffMember.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.priceRange.min}
                        onChange={(e) => handlePriceFilterChange('min', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.priceRange.max}
                        onChange={(e) => handlePriceFilterChange('max', e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>

                  {/* Duration Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (min)</label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.durationRange.min}
                        onChange={(e) => handleDurationFilterChange('min', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.durationRange.max}
                        onChange={(e) => handleDurationFilterChange('max', e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'graphic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('graphic')}
            className="text-xs"
          >
            <Grid className="h-3 w-3 mr-1" />
            GRAPHIC VIEW
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="text-xs"
          >
            <List className="h-3 w-3 mr-1" />
            LIST VIEW
          </Button>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'graphic' ? (
          <div className="space-y-6">
            {categories.length === 0 || filteredServices.length === 0 ? (
              <div className="bg-white rounded-lg border min-h-96 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl text-gray-400">📋</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Services</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first service</p>
                  <Button onClick={handleAddService} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </div>
            ) : (
              categories.map(category => {
                const categoryServices = getServicesByCategory(category);
                if (categoryServices.length === 0) return null;
                
                return (
                <div key={category} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold capitalize">{category}</h3>
                    <Badge variant="secondary">
                      {categoryServices.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {categoryServices.map(service => (
                       <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                         {service.image && (
                           <div className="mb-3">
                             <img
                               src={service.image}
                               alt={service.name}
                               className="w-full h-32 object-cover rounded-md"
                             />
                           </div>
                         )}
                         <div className="flex justify-between items-start mb-2">
                           <h4 className="font-medium">{service.name}</h4>
                           <div className="flex space-x-1">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleEditService(service)}
                             >
                               <Edit className="h-3 w-3" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleDeleteService(service)}
                               className="text-red-500 hover:text-red-700"
                             >
                               <Trash2 className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>
                         {service.description && (
                           <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                         )}
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-green-600">{formatPrice(service.price)}</span>
                            <span className="text-gray-500">{service.duration} min</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {renderStaffProfiles(service.staffIds, 3)}
                              <span className="text-xs text-gray-500">
                                {service.staffIds.length} staff
                              </span>
                            </div>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
                );
              }).filter(Boolean)
            )}
          </div>
        ) : (
          /* List View - Table */
          <div className="space-y-4">
            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          paginatedServices.length > 0 &&
                          paginatedServices.every(service => selectedServices.includes(service.id))
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>NAME</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>CATEGORY</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>PRICE</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('duration')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>DURATION</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>STAFF</TableHead>
                    <TableHead>EXTRAS</TableHead>
                    <TableHead className="w-[100px]">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        {searchTerm ? 'No services match your search.' : 'No services found. Create your first service to get started.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedServices.map((service) => (
                      <TableRow key={service.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={(checked) => 
                              handleSelectService(service.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {service.image ? (
                            <img
                              src={service.image}
                              alt={service.name}
                              className="w-10 h-10 object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-400 text-xs">📋</span>
                            </div>
                          )}
                          <span>{service.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {service.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatPrice(service.price)}
                      </TableCell>
                      <TableCell>{service.duration} min</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {renderStaffProfiles(service.staffIds, 2)}
                            <div className="flex flex-col">
                              <div className="flex flex-wrap gap-1">
                                {service.staffIds.slice(0, 2).map(staffId => {
                                  const staffMember = getStaffById(staffId);
                                  return staffMember ? (
                                    <span key={staffId} className="text-xs text-gray-600">
                                      {staffMember.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                              {service.staffIds.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{service.staffIds.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      <TableCell>
                        {service.extras.length > 0 ? (
                          <Badge variant="outline">{service.extras.length} extras</Badge>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditService(service)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const duplicatedService = {
                                  ...service,
                                  name: `${service.name} (Copy)`,
                                };
                                delete (duplicatedService as any).id;
                                addService(duplicatedService);
                                toast({
                                  title: "Success",
                                  description: "Service duplicated successfully",
                                });
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteService(service)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedServices.length)} of {sortedServices.length} services
                </span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {totalPages > 1 && (
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
              )}
            </div>
          </div>
        )}

      </div>

      {/* Service Form */}
      <ServiceForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        service={editingService}
      />
    </Layout>
  );
}
