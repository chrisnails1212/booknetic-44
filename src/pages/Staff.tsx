
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StaffForm } from '@/components/staff/StaffForm';
import { Search, Plus, Edit, Trash2, User } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

const Staff = () => {
  const { staff, deleteStaff } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStaff(null);
  };

  const filteredStaff = staff.filter(staffMember =>
    staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.phone.includes(searchTerm)
  );

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
              {staff.length}
            </span>
          </div>
          <Button 
            onClick={handleAddStaff}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            ADD STAFF
          </Button>
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
                  STAFF MEMBER
                  <span className="ml-1 text-gray-400">↕</span>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  EMAIL
                  <span className="ml-1 text-gray-400">↕</span>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  PHONE
                  <span className="ml-1 text-gray-400">↕</span>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  ROLE
                  <span className="ml-1 text-gray-400">↕</span>
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    {searchTerm ? 'No staff members found matching your search.' : 'No entries!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staffMember) => (
                  <TableRow key={staffMember.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
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

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredStaff.length} of {staff.length} total</span>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
              1
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

      <StaffForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        staff={editingStaff}
      />
    </Layout>
  );
};

export default Staff;
