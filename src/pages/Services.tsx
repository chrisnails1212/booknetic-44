
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, List, Grid, Edit, Trash2 } from 'lucide-react';
import { ServiceForm } from '@/components/services/ServiceForm';
import { useAppData, Service } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

export default function Services() {
  const { services, deleteService, getStaffById } = useAppData();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'graphic' | 'list'>('list');

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getServiceCategories = () => {
    const categories = Array.from(new Set(services.map(s => s.category)));
    return categories;
  };

  const getServicesByCategory = (category: string) => {
    return filteredServices.filter(s => s.category === category);
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
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleAddService} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              ADD SERVICE
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
            {getServiceCategories().length === 0 ? (
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
              getServiceCategories().map(category => (
                <div key={category} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold capitalize">{category}</h3>
                    <Badge variant="secondary">
                      {getServicesByCategory(category).length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {getServicesByCategory(category).map(service => (
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
                         <div className="mt-2 text-xs text-gray-500">
                           {service.staffIds.length} staff assigned
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* List View - Table */
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME</TableHead>
                  <TableHead>CATEGORY</TableHead>
                  <TableHead>PRICE</TableHead>
                  <TableHead>DURATION</TableHead>
                  <TableHead>STAFF</TableHead>
                  <TableHead>EXTRAS</TableHead>
                  <TableHead className="w-[100px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      {searchTerm ? 'No services match your search.' : 'No services found. Create your first service to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.id} className="hover:bg-gray-50">
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
                        <div className="flex flex-wrap gap-1">
                          {service.staffIds.slice(0, 2).map(staffId => {
                            const staff = getStaffById(staffId);
                            return staff ? (
                              <Badge key={staffId} variant="secondary" className="text-xs">
                                {staff.name}
                              </Badge>
                            ) : null;
                          })}
                          {service.staffIds.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{service.staffIds.length - 2}
                            </Badge>
                          )}
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredServices.length} of {services.length} services</span>
          </div>
        </div>
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
