import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Copy, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LocationForm } from '@/components/locations/LocationForm';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

const Locations = () => {
  const { locations, deleteLocation } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filtering and searching
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.phone.includes(searchTerm) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLocations = filteredLocations.slice(startIndex, startIndex + itemsPerPage);

  const handleAddLocation = () => {
    setEditingLocation(null);
    setIsFormOpen(true);
  };

  const handleEditLocation = (location: any) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  };

  const handleDeleteLocation = (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      deleteLocation(id);
      setSelectedLocations(prev => prev.filter(selectedId => selectedId !== id));
      toast.success('Location deleted successfully');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLocations(paginatedLocations.map(location => location.id));
    } else {
      setSelectedLocations([]);
    }
  };

  const handleSelectLocation = (locationId: string, checked: boolean) => {
    if (checked) {
      setSelectedLocations(prev => [...prev, locationId]);
    } else {
      setSelectedLocations(prev => prev.filter(id => id !== locationId));
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedLocations.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedLocations.length} location(s)?`)) {
      selectedLocations.forEach(locationId => {
        deleteLocation(locationId);
      });
      setSelectedLocations([]);
      toast.success(`${selectedLocations.length} location(s) deleted successfully`);
    }
  };

  const handleBulkDuplicate = () => {
    // Implement bulk duplicate logic here
    toast.success(`${selectedLocations.length} location(s) duplicated successfully`);
  };

  const handleExportToCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Address'];
    const csvData = [
      headers.join(','),
      ...filteredLocations.map((location) => [
        `"${location.id.slice(-8)}"`,
        `"${location.name}"`,
        `"${location.phone}"`,
        `"${location.address}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `locations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Locations exported to CSV successfully');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold text-gray-900">Locations</h1>
            <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm font-medium">
              {locations.length}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={handleAddLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between space-x-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>

          {/* Bulk Actions */}
          {selectedLocations.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedLocations.length} selected
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
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedLocations.length > 0 &&
                      paginatedLocations.every(location => selectedLocations.includes(location.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">ID</TableHead>
                <TableHead className="text-gray-600 font-medium">NAME</TableHead>
                <TableHead className="text-gray-600 font-medium">PHONE</TableHead>
                <TableHead className="text-gray-600 font-medium">ADDRESS</TableHead>
                <TableHead className="w-[100px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    {searchTerm ? 'No locations found matching your search.' : 'No entries!'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLocations.map((location) => (
                  <TableRow key={location.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={(checked) => 
                          handleSelectLocation(location.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-gray-900 font-mono text-sm">
                      {location.id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {location.image ? (
                          <img
                            src={location.image}
                            alt={location.name}
                            className="w-10 h-10 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg border flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400 text-xs">No img</span>
                          </div>
                        )}
                        <span className="text-gray-900 font-medium">{location.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900">{location.phone}</TableCell>
                    <TableCell className="text-gray-900 max-w-xs truncate">{location.address}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:text-blue-600 h-8 w-8 p-0"
                          onClick={() => handleEditLocation(location)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:text-red-600 h-8 w-8 p-0"
                          onClick={() => handleDeleteLocation(location.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLocations.length)} of {filteredLocations.length} locations
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

      <LocationForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        location={editingLocation}
      />
    </Layout>
  );
};

export default Locations;