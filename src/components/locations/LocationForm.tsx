
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, X, Camera, Upload } from 'lucide-react';
import { useAppData, Location } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  location?: Location | null;
}

export const LocationForm = ({ isOpen, onClose, location }: LocationFormProps) => {
  const { addLocation, updateLocation } = useAppData();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    picture: null as File | null,
  });

  const [picturePreview, setPicturePreview] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        phone: location.phone,
        address: location.address,
        picture: null,
      });
      // Set preview if location has an image
      if (location.image) {
        setPicturePreview(location.image);
      }
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        picture: null,
      });
    }
    setErrors({});
    if (!location) {
      setPicturePreview(null);
    }
  }, [location, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let imageData = location?.image; // Keep existing image if editing
      
      // If a new picture was selected, convert it to base64
      if (formData.picture) {
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(formData.picture as File);
        });
      } else if (picturePreview && !location?.image) {
        // If we have a preview but no existing image, keep the preview
        imageData = picturePreview;
      }

      const locationData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        staffIds: location?.staffIds || [],
        serviceIds: location?.serviceIds || [],
        image: imageData,
      };

      if (location) {
        updateLocation(location.id, locationData);
        toast.success('Location updated successfully');
      } else {
        addLocation(locationData);
        toast.success('Location added successfully');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to save location');
      console.error('Error saving location:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        picture: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setFormData(prev => ({
      ...prev,
      picture: null
    }));
    setPicturePreview(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">
              {location ? 'Edit Location' : 'Add Location'}
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Location Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter location name"
                className={errors.name ? 'border-red-500' : ''}
              />
              <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                className={`min-h-[100px] ${errors.address ? 'border-red-500' : ''}`}
              />
              <Globe className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
            </div>
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Location Picture */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Location Picture</Label>
            {picturePreview ? (
              <div className="relative">
                <img
                  src={picturePreview}
                  alt="Location preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removePicture}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-2 hover:border-gray-400 transition-colors">
                <Camera className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-500">Upload location picture</p>
                <label htmlFor="picture-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>
                </label>
                <input
                  id="picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              type="tel"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-6">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {location ? 'Update Location' : 'Add Location'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
