
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.phone.includes(searchTerm) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      toast.success('Location deleted successfully');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
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
              Export to CSV
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

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Quick search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-gray-300" />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  ID
                  <span className="ml-1 text-gray-400">↕</span>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  NAME
                  <span className="ml-1 text-gray-400">↕</span>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  PHONE
                  <span className="ml-1 text-gray-400">↕</span>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  ADDRESS
                  <span className="ml-1 text-gray-400">↕</span>
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    {searchTerm ? 'No locations found matching your search.' : 'No entries!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLocations.map((location) => (
                  <TableRow key={location.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-blue-600"
                        onClick={() => handleEditLocation(location)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => handleDeleteLocation(location.id)}
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

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredLocations.length} of {locations.length} total</span>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
              i
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span>Need Help?</span>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              ?
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
