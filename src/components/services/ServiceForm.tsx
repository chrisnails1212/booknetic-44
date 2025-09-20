import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Trash2, Globe, Edit2, Upload, Camera } from 'lucide-react';
import { useAppData, Service, Staff, ServiceExtra } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

interface EditExtraFormProps {
  extra: ServiceExtra;
  onSave: (extra: ServiceExtra) => void;
  onCancel: () => void;
}

const EditExtraForm: React.FC<EditExtraFormProps> = ({ extra, onSave, onCancel }) => {
  const { currency } = useCurrency();
  const [editFormData, setEditFormData] = useState({
    name: extra.name,
    price: extra.price,
    description: extra.description || '',
    duration: extra.duration || 30,
  });

  const handleSave = () => {
    if (!editFormData.name.trim()) return;
    
    onSave({
      ...extra,
      ...editFormData,
    });
  };

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-extra-name">Extra Name</Label>
        <Input
          id="edit-extra-name"
          value={editFormData.name}
          onChange={(e) => handleEditInputChange('name', e.target.value)}
          placeholder="Enter extra name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-extra-price">Price ({currency.symbol})</Label>
          <Input
            id="edit-extra-price"
            type="number"
            step="0.01"
            min="0"
            value={editFormData.price}
            onChange={(e) => handleEditInputChange('price', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-extra-duration">Duration (min)</Label>
          <Select 
            value={editFormData.duration.toString()} 
            onValueChange={(value) => handleEditInputChange('duration', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-extra-description">Description</Label>
        <Input
          id="edit-extra-description"
          value={editFormData.description}
          onChange={(e) => handleEditInputChange('description', e.target.value)}
          placeholder="Enter extra description"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
          Save
        </Button>
      </div>
    </div>
  );
};

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ isOpen, onClose, service }) => {
  const { staff, addService, updateService, locations } = useAppData();
  const { currency, formatPrice } = useCurrency();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: 0,
    duration: 60,
    staffIds: [] as string[],
    extras: [] as ServiceExtra[],
    image: '',
    groupBooking: {
      enabled: false,
      maxAdditionalGuests: 5,
    },
  });

  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>('');

  const [newExtra, setNewExtra] = useState({
    name: '',
    price: 0,
    description: '',
    duration: 30,
  });

  const [editingExtra, setEditingExtra] = useState<ServiceExtra | null>(null);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        category: service.category,
        description: service.description || '',
        price: service.price,
        duration: service.duration,
        staffIds: service.staffIds,
        extras: service.extras,
        image: service.image || '',
        groupBooking: service.groupBooking || {
          enabled: false,
          maxAdditionalGuests: 5,
        },
      });
      setPicturePreview(service.image || '');
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        price: 0,
        duration: 60,
        staffIds: [],
        extras: [],
        image: '',
        groupBooking: {
          enabled: false,
          maxAdditionalGuests: 5,
        },
      });
      setPicturePreview('');
      setPictureFile(null);
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Service name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category.trim()) {
      toast({
        title: "Error", 
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.staffIds.length === 0) {
      toast({
        title: "Error",
        description: "At least one staff member must be assigned",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageData = service?.image; // Keep existing image if editing
      
      // If a new picture was selected, convert it to base64
      if (pictureFile) {
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(pictureFile);
        });
      } else if (picturePreview && !service?.image) {
        // If we have a preview but no existing image, keep the preview
        imageData = picturePreview;
      }

      const serviceData = {
        ...formData,
        image: imageData,
      };

      if (service) {
        updateService(service.id, serviceData);
        toast({
          title: "Success",
          description: "Service updated successfully",
        });
      } else {
        addService(serviceData);
        toast({
          title: "Success", 
          description: "Service created successfully",
        });
      }
      onClose();
      // Reset form for next use
      setFormData({
        name: '',
        category: '',
        description: '',
        price: 0,
        duration: 60,
        staffIds: [],
        extras: [],
        image: '',
        groupBooking: {
          enabled: false,
          maxAdditionalGuests: 5,
        },
      });
      setPicturePreview('');
      setPictureFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setPictureFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setPictureFile(null);
    setPicturePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleStaffToggle = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      staffIds: prev.staffIds.includes(staffId)
        ? prev.staffIds.filter(id => id !== staffId)
        : [...prev.staffIds, staffId]
    }));
  };

  const addExtra = () => {
    if (!newExtra.name.trim()) return;
    
    const extra: ServiceExtra = {
      id: Date.now().toString(),
      ...newExtra,
    };
    
    setFormData(prev => ({
      ...prev,
      extras: [...prev.extras, extra]
    }));
    
    setNewExtra({ name: '', price: 0, description: '', duration: 30 });
  };

  const removeExtra = (extraId: string) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.filter(e => e.id !== extraId)
    }));
    // Clear editing state if deleting the currently editing extra
    if (editingExtra?.id === extraId) {
      setEditingExtra(null);
    }
  };

  const startEditExtra = (extra: ServiceExtra) => {
    setEditingExtra(extra);
  };

  const cancelEditExtra = () => {
    setEditingExtra(null);
  };

  const saveEditExtra = (updatedExtra: ServiceExtra) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.map(e => e.id === updatedExtra.id ? updatedExtra : e)
    }));
    setEditingExtra(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[800px] max-w-[90vw] overflow-y-auto p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="px-8 py-6 border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <SheetTitle className="text-xl">
                  {service ? 'Edit Service' : 'Add Service'}
                </SheetTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-6 h-full">
              <Tabs defaultValue="service-details" className="w-full h-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-gray-100">
                  <TabsTrigger value="service-details" className="text-xs font-medium px-4 py-2">
                    SERVICE DETAILS
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="text-xs font-medium px-4 py-2">
                    STAFF
                  </TabsTrigger>
                  <TabsTrigger value="extras" className="text-xs font-medium px-4 py-2">
                    EXTRAS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="service-details" className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="service-name">Service name *</Label>
                      <div className="relative">
                        <Input
                          id="service-name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                          className="h-12"
                          placeholder="Enter service name"
                        />
                        <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="haircut">Haircut</SelectItem>
                          <SelectItem value="styling">Styling</SelectItem>
                          <SelectItem value="coloring">Coloring</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="massage">Massage</SelectItem>
                          <SelectItem value="facial">Facial</SelectItem>
                          <SelectItem value="nails">Nails</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter service description..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Service Picture Upload */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Service Picture</Label>
                    <div className="flex items-center space-x-4">
                      {picturePreview ? (
                        <div className="relative">
                          <img
                            src={picturePreview}
                            alt="Service preview"
                            className="w-24 h-24 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removePicture}
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handlePictureChange}
                          className="hidden"
                          id="service-picture"
                        />
                        <Label
                          htmlFor="service-picture"
                          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Picture
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG or GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ({currency.symbol}) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        required
                        className="h-12"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes) *</Label>
                      <Select 
                        value={formData.duration.toString()} 
                        onValueChange={(value) => handleInputChange('duration', parseInt(value))}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select duration..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="150">2.5 hours</SelectItem>
                          <SelectItem value="180">3 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Group Booking Settings */}
                  <div className="space-y-4">
                    <Label className="text-lg font-medium">Group Booking Settings</Label>
                    <p className="text-sm text-gray-600">Allow customers to bring additional guests to this service</p>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="group-booking-enabled" className="font-medium">Enable Group Booking</Label>
                          <p className="text-sm text-gray-500">Allow customers to add additional guests to this service</p>
                        </div>
                        <Switch
                          id="group-booking-enabled"
                          checked={formData.groupBooking.enabled}
                          onCheckedChange={(checked) => 
                            handleInputChange('groupBooking', { ...formData.groupBooking, enabled: checked })
                          }
                        />
                      </div>

                      {formData.groupBooking.enabled && (
                        <>
                          <div className="space-y-3">
                            <Label htmlFor="max-guests">Maximum Additional Guests</Label>
                            <Select 
                              value={formData.groupBooking.maxAdditionalGuests.toString()} 
                              onValueChange={(value) => 
                                handleInputChange('groupBooking', { 
                                  ...formData.groupBooking, 
                                  maxAdditionalGuests: parseInt(value) 
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select maximum guests..." />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} additional guest{num > 1 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                            <h4 className="font-medium text-blue-900">Group Booking Impact</h4>
                            <div className="text-sm text-blue-800 space-y-1">
                              <p>• Price: Multiplied by (1 + additional guests)</p>
                              <p>• Duration: Multiplied by (1 + additional guests)</p>
                              <p>• Example: With 1 guest, price becomes {formatPrice(formData.price * 2)} and duration becomes {formData.duration * 2} minutes</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="staff" className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-lg font-medium">Assign Staff Members *</Label>
                    <p className="text-sm text-gray-600">Select which staff members can provide this service</p>
                    
                    {staff.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No staff members available. Add staff members first.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                        {staff.map((staffMember) => (
                          <div key={staffMember.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={`staff-${staffMember.id}`}
                              checked={formData.staffIds.includes(staffMember.id)}
                              onCheckedChange={() => handleStaffToggle(staffMember.id)}
                            />
                            <Label htmlFor={`staff-${staffMember.id}`} className="flex-1 cursor-pointer">
                              <div>
                                <div className="font-medium">{staffMember.name}</div>
                                <div className="text-sm text-gray-500">{staffMember.role} • {staffMember.department}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {formData.staffIds.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700">
                          {formData.staffIds.length} staff member(s) assigned
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="extras" className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-lg font-medium">Service Extras</Label>
                    <p className="text-sm text-gray-600">Add optional extras that customers can purchase with this service</p>
                    
                    {/* Add New Extra */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium">Add New Extra</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="extra-name">Extra Name</Label>
                          <Input
                            id="extra-name"
                            value={newExtra.name}
                            onChange={(e) => setNewExtra(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter extra name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="extra-price">Price ({currency.symbol})</Label>
                            <Input
                              id="extra-price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={newExtra.price}
                              onChange={(e) => setNewExtra(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="extra-duration">Duration (min)</Label>
                            <Select 
                              value={newExtra.duration.toString()} 
                              onValueChange={(value) => setNewExtra(prev => ({ ...prev, duration: parseInt(value) }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="90">1.5 hours</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="extra-description">Description</Label>
                          <Input
                            id="extra-description"
                            value={newExtra.description}
                            onChange={(e) => setNewExtra(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter extra description"
                          />
                        </div>
                      </div>
                      <Button type="button" onClick={addExtra} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Extra
                      </Button>
                    </div>

                    {/* Existing Extras */}
                    {formData.extras.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Current Extras</h4>
                        {formData.extras.map((extra) => (
                          <div key={extra.id} className="border rounded-lg p-3">
                            {editingExtra?.id === extra.id ? (
                              <EditExtraForm
                                extra={editingExtra}
                                onSave={saveEditExtra}
                                onCancel={cancelEditExtra}
                              />
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{extra.name}</div>
                                  <div className="text-sm text-gray-600">{extra.description}</div>
                                  <div className="flex items-center gap-4 mt-1">
                                    <div className="text-sm font-medium text-green-600">{formatPrice(extra.price)}</div>
                                    <div className="text-sm text-gray-500">{extra.duration || 30} min</div>
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditExtra(extra)}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExtra(extra.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

              </Tabs>
            </form>
          </div>

          <div className="px-8 py-6 border-t bg-gray-50">
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose} className="px-8">
                CANCEL
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8" onClick={handleSubmit}>
                {service ? 'SAVE CHANGES' : 'CREATE SERVICE'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
