
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: any) => void;
  role?: any;
}

export const RoleForm: React.FC<RoleFormProps> = ({
  isOpen,
  onClose,
  onSave,
  role
}) => {
  const [formData, setFormData] = useState({
    name: '',
    staff: '',
    note: '',
    permissions: {
      dashboardModule: false,
      appointmentsModule: 'None',
      addNew: false,
      edit: false,
      delete: false,
      couponsTab: false,
      customFormsTab: false
    }
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        staff: role.staff || '',
        note: role.note || '',
        permissions: role.permissions || {
          dashboardModule: false,
          appointmentsModule: 'None',
          addNew: false,
          edit: false,
          delete: false,
          couponsTab: false,
          customFormsTab: false
        }
      });
    } else {
      setFormData({
        name: '',
        staff: '',
        note: '',
        permissions: {
          dashboardModule: false,
          appointmentsModule: 'None',
          addNew: false,
          edit: false,
          delete: false,
          couponsTab: false,
          customFormsTab: false
        }
      });
    }
  }, [role, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <SheetTitle className="text-lg font-semibold">
              {role ? 'Edit Role' : 'Add Role'}
            </SheetTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="py-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Role Details</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter role name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff">
                    Staff <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="staff"
                    value={formData.staff}
                    onChange={(e) => handleInputChange('staff', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select...</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    placeholder="Add any notes about this role..."
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dashboard-module">Dashboard module</Label>
                  <Switch
                    id="dashboard-module"
                    checked={formData.permissions.dashboardModule}
                    onCheckedChange={(checked) => handlePermissionChange('dashboardModule', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="appointments-module">Appointments module</Label>
                  <select
                    id="appointments-module"
                    value={formData.permissions.appointmentsModule}
                    onChange={(e) => handlePermissionChange('appointmentsModule', e.target.value)}
                    className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="None">None</option>
                    <option value="View">View</option>
                    <option value="Full">Full</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="add-new">Add new</Label>
                  <Switch
                    id="add-new"
                    checked={formData.permissions.addNew}
                    onCheckedChange={(checked) => handlePermissionChange('addNew', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="edit">Edit</Label>
                  <Switch
                    id="edit"
                    checked={formData.permissions.edit}
                    onCheckedChange={(checked) => handlePermissionChange('edit', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="delete">Delete</Label>
                  <Switch
                    id="delete"
                    checked={formData.permissions.delete}
                    onCheckedChange={(checked) => handlePermissionChange('delete', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="coupons-tab">Coupons tab</Label>
                  <Switch
                    id="coupons-tab"
                    checked={formData.permissions.couponsTab}
                    onCheckedChange={(checked) => handlePermissionChange('couponsTab', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-forms-tab">Custom Forms Tab</Label>
                  <Switch
                    id="custom-forms-tab"
                    checked={formData.permissions.customFormsTab}
                    onCheckedChange={(checked) => handlePermissionChange('customFormsTab', checked)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            CANCEL
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {role ? 'UPDATE ROLE' : 'ADD ROLE'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
