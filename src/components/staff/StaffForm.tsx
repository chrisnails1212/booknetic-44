import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Upload, Calendar as CalendarIcon, Plus, Trash2, Camera, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: any;
}

interface WorkingHours {
  start: string;
  end: string;
  isWorking: boolean;
}

interface SpecialDay {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

interface Holiday {
  id: string;
  date: Date;
  name: string;
}

interface BreakTime {
  id: string;
  startTime: string;
  endTime: string;
  name: string;
}

export const StaffForm = ({
  isOpen,
  onClose,
  staff
}: StaffFormProps) => {
  const {
    addStaff,
    updateStaff,
    locations,
    services
  } = useAppData();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    selectedServices: [] as string[],
    selectedLocations: [] as string[],
    avatar: '' as string
  });

  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, WorkingHours>>({
    monday: {
      start: '09:00',
      end: '17:00',
      isWorking: true
    },
    tuesday: {
      start: '09:00',
      end: '17:00',
      isWorking: true
    },
    wednesday: {
      start: '09:00',
      end: '17:00',
      isWorking: true
    },
    thursday: {
      start: '09:00',
      end: '17:00',
      isWorking: true
    },
    friday: {
      start: '09:00',
      end: '17:00',
      isWorking: true
    },
    saturday: {
      start: '09:00',
      end: '13:00',
      isWorking: false
    },
    sunday: {
      start: '09:00',
      end: '13:00',
      isWorking: false
    }
  });

  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        role: staff.role || '',
        department: staff.department || '',
        selectedServices: staff.services || [],
        selectedLocations: staff.locations || [],
        avatar: staff.avatar || ''
      });
      setAvatarPreview(staff.avatar || '');
      if (staff.schedule) {
        setWeeklySchedule(staff.schedule.weekly || weeklySchedule);
        setSpecialDays(staff.schedule.specialDays || []);
        setHolidays(staff.schedule.holidays || []);
        setBreakTimes(staff.schedule.breakTimes || []);
      }
    } else {
      // Reset form for new staff
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        selectedServices: [],
        selectedLocations: [],
        avatar: ''
      });
      setAvatarPreview('');
      setAvatarFile(null);
      setWeeklySchedule({
        monday: {
          start: '09:00',
          end: '17:00',
          isWorking: true
        },
        tuesday: {
          start: '09:00',
          end: '17:00',
          isWorking: true
        },
        wednesday: {
          start: '09:00',
          end: '17:00',
          isWorking: true
        },
        thursday: {
          start: '09:00',
          end: '17:00',
          isWorking: true
        },
        friday: {
          start: '09:00',
          end: '17:00',
          isWorking: true
        },
        saturday: {
          start: '09:00',
          end: '13:00',
          isWorking: false
        },
        sunday: {
          start: '09:00',
          end: '13:00',
          isWorking: false
        }
      });
      setSpecialDays([]);
      setHolidays([]);
      setBreakTimes([]);
    }
  }, [staff]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 200x200 for avatars)
        const maxSize = 200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with high compression (0.7 quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      try {
        // Compress image before storing
        const compressedImage = await compressImage(file);
        setAvatarPreview(compressedImage);
        setFormData(prev => ({ ...prev, avatar: compressedImage }));
        
        toast.success('Profile picture uploaded and optimized');
      } catch (error) {
        toast.error('Failed to process image');
        console.error('Image compression error:', error);
      }
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const staffData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      department: formData.department,
      services: formData.selectedServices,
      locations: formData.selectedLocations,
      avatar: formData.avatar,
      schedule: {
        weekly: weeklySchedule,
        specialDays,
        holidays,
        breakTimes
      }
    };

    try {
      if (staff) {
        updateStaff(staff.id, staffData);
        toast.success('Staff member updated successfully');
      } else {
        addStaff(staffData);
        toast.success('Staff member added successfully');
      }
      
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        selectedServices: [],
        selectedLocations: [],
        avatar: ''
      });
      setAvatarPreview('');
      setAvatarFile(null);
      setWeeklySchedule({
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '09:00', end: '13:00', isWorking: false },
        sunday: { start: '09:00', end: '13:00', isWorking: false }
      });
      setSpecialDays([]);
      setHolidays([]);
      setBreakTimes([]);
      
      onClose();
    } catch (error) {
      toast.error('Failed to save staff member');
      console.error('Error saving staff:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId) ? prev.selectedServices.filter(id => id !== serviceId) : [...prev.selectedServices, serviceId]
    }));
  };

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLocations: prev.selectedLocations.includes(locationId) ? prev.selectedLocations.filter(id => id !== locationId) : [...prev.selectedLocations, locationId]
    }));
  };

  const handleScheduleChange = (day: string, field: keyof WorkingHours, value: any) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const addSpecialDay = () => {
    if (selectedDate) {
      const newSpecialDay: SpecialDay = {
        id: Date.now().toString(),
        date: selectedDate,
        startTime: '09:00',
        endTime: '17:00',
        isOff: false
      };
      setSpecialDays(prev => [...prev, newSpecialDay]);
      setSelectedDate(undefined);
    }
  };

  const updateSpecialDay = (id: string, field: keyof SpecialDay, value: any) => {
    setSpecialDays(prev => prev.map(day => day.id === id ? {
      ...day,
      [field]: value
    } : day));
  };

  const removeSpecialDay = (id: string) => {
    setSpecialDays(prev => prev.filter(day => day.id !== id));
  };

  const addHoliday = () => {
    if (selectedDate) {
      const newHoliday: Holiday = {
        id: Date.now().toString(),
        date: selectedDate,
        name: ''
      };
      setHolidays(prev => [...prev, newHoliday]);
      setSelectedDate(undefined);
    }
  };

  const updateHoliday = (id: string, field: keyof Holiday, value: any) => {
    setHolidays(prev => prev.map(holiday => holiday.id === id ? {
      ...holiday,
      [field]: value
    } : holiday));
  };

  const removeHoliday = (id: string) => {
    setHolidays(prev => prev.filter(holiday => holiday.id !== id));
  };

  const addBreakTime = () => {
    const newBreakTime: BreakTime = {
      id: Date.now().toString(),
      startTime: '12:00',
      endTime: '13:00',
      name: 'Lunch Break'
    };
    setBreakTimes(prev => [...prev, newBreakTime]);
  };

  const updateBreakTime = (id: string, field: keyof BreakTime, value: any) => {
    setBreakTimes(prev => prev.map(breakTime => breakTime.id === id ? {
      ...breakTime,
      [field]: value
    } : breakTime));
  };

  const removeBreakTime = (id: string) => {
    setBreakTimes(prev => prev.filter(breakTime => breakTime.id !== id));
  };

  const daysOfWeek = [{
    key: 'monday',
    label: 'Monday'
  }, {
    key: 'tuesday',
    label: 'Tuesday'
  }, {
    key: 'wednesday',
    label: 'Wednesday'
  }, {
    key: 'thursday',
    label: 'Thursday'
  }, {
    key: 'friday',
    label: 'Friday'
  }, {
    key: 'saturday',
    label: 'Saturday'
  }, {
    key: 'sunday',
    label: 'Sunday'
  }];

  return <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[700px] max-w-[95vw] lg:max-w-[1000px] overflow-y-auto p-0">
        <div className="h-full flex flex-col w-full">
          <SheetHeader className="px-8 py-6 border-b bg-white w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{staff ? 'E' : '+'}</span>
                </div>
                <SheetTitle className="text-xl font-semibold text-gray-900">
                  {staff ? 'Edit Staff' : 'Add Staff'}
                </SheetTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 px-8 py-6 w-full">
            <form onSubmit={handleSubmit} className="space-y-6 h-full w-full">
              <Tabs defaultValue="staff-details" className="w-full h-full">
                <TabsList className="grid w-full grid-cols-4 mb-8 h-12 bg-gray-100">
                  <TabsTrigger value="staff-details" className="text-sm font-medium whitespace-nowrap">
                    DETAILS
                  </TabsTrigger>
                  <TabsTrigger value="services-locations" className="text-sm font-medium whitespace-nowrap">
                    SERVICES
                  </TabsTrigger>
                  <TabsTrigger value="weekly-schedule" className="text-sm font-medium whitespace-nowrap">
                    SCHEDULE
                  </TabsTrigger>
                  <TabsTrigger value="special-days" className="text-sm font-medium whitespace-nowrap">
                    SPECIAL DAYS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="staff-details" className="space-y-6 w-full">
                  {/* Avatar Upload Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="w-20 h-20">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt="Staff avatar" className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gray-200">
                            <User className="w-8 h-8 text-gray-400" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {avatarPreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={removeAvatar}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Profile Picture</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          className="text-sm"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Upload a profile picture (max 5MB, JPG/PNG)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={e => handleInputChange('name', e.target.value)} 
                        className="w-full" 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.role} onValueChange={value => handleInputChange('role', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stylist">Stylist</SelectItem>
                          <SelectItem value="colorist">Colorist</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          <SelectItem value="therapist">Therapist</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={e => handleInputChange('email', e.target.value)} 
                        placeholder="example@gmail.com" 
                        className="w-full" 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone
                      </Label>
                      <Input 
                        id="phone" 
                        value={formData.phone} 
                        onChange={e => handleInputChange('phone', e.target.value)} 
                        className="w-full" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                      Department
                    </Label>
                    <Select value={formData.department} onValueChange={value => handleInputChange('department', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hair">Hair Services</SelectItem>
                        <SelectItem value="nails">Nail Services</SelectItem>
                        <SelectItem value="skincare">Skincare</SelectItem>
                        <SelectItem value="massage">Massage Therapy</SelectItem>
                        <SelectItem value="reception">Reception</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="services-locations" className="space-y-6 w-full">
                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-medium text-gray-900">Services</h3>
                    <div className="grid grid-cols-3 gap-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 w-full">
                      {services.map(service => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`service-${service.id}`}
                            checked={formData.selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`service-${service.id}`} className="text-sm text-gray-700">
                            {service.name}
                          </label>
                        </div>
                      ))}
                      {services.length === 0 && (
                        <div className="col-span-3 text-center text-gray-500 py-4">
                          No services available. Please add services first.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-medium text-gray-900">Locations</h3>
                    <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 w-full">
                      {locations.map(location => (
                        <div key={location.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`location-${location.id}`}
                            checked={formData.selectedLocations.includes(location.id)}
                            onChange={() => handleLocationToggle(location.id)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`location-${location.id}`} className="text-sm text-gray-700">
                            {location.name} - {location.address}
                          </label>
                        </div>
                      ))}
                      {locations.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 py-4">
                          No locations available. Please add locations first.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="weekly-schedule" className="space-y-6 w-full">
                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-medium text-gray-900">Weekly Working Schedule</h3>
                    {daysOfWeek.map(day => (
                        <div key={day.key} className="flex items-center space-x-6 p-4 border border-gray-200 rounded-lg w-full">
                            <div className="w-28">
                              <Label className="text-sm font-medium text-gray-700">
                                {day.label}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 min-w-[100px]">
                              <Switch checked={weeklySchedule[day.key].isWorking} onCheckedChange={checked => handleScheduleChange(day.key, 'isWorking', checked)} />
                              <span className="text-sm text-gray-600">Working</span>
                            </div>
                            {weeklySchedule[day.key].isWorking && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Label className="text-sm text-gray-600 min-w-[40px]">From:</Label>
                                  <Input type="time" value={weeklySchedule[day.key].start} onChange={e => handleScheduleChange(day.key, 'start', e.target.value)} className="w-28" />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Label className="text-sm text-gray-600 min-w-[25px]">To:</Label>
                                  <Input type="time" value={weeklySchedule[day.key].end} onChange={e => handleScheduleChange(day.key, 'end', e.target.value)} className="w-28" />
                                </div>
                              </>
                            )}
                        </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="special-days" className="space-y-6 w-full">
                  <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-lg font-medium text-gray-900">Special Working Days</h3>
                      <div className="flex items-center space-x-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                          </PopoverContent>
                        </Popover>
                        <Button onClick={addSpecialDay} disabled={!selectedDate}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Special Day
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 w-full">
                      {specialDays.map(specialDay => (
                        <div key={specialDay.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg w-full">
                            <div className="flex-1 min-w-[150px]">
                              <span className="text-sm font-medium text-gray-900">
                                {format(specialDay.date, "PPP")}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 min-w-[100px]">
                              <Switch checked={!specialDay.isOff} onCheckedChange={checked => updateSpecialDay(specialDay.id, 'isOff', !checked)} />
                              <span className="text-sm text-gray-600">Working</span>
                            </div>
                            {!specialDay.isOff && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Label className="text-sm text-gray-600 min-w-[40px]">From:</Label>
                                  <Input type="time" value={specialDay.startTime} onChange={e => updateSpecialDay(specialDay.id, 'startTime', e.target.value)} className="w-28" />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Label className="text-sm text-gray-600 min-w-[25px]">To:</Label>
                                  <Input type="time" value={specialDay.endTime} onChange={e => updateSpecialDay(specialDay.id, 'endTime', e.target.value)} className="w-28" />
                                </div>
                              </>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => removeSpecialDay(specialDay.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                      ))}
                      {specialDays.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No special days configured
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 border-t pt-6 w-full">
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-medium text-gray-900">Holidays</h3>
                        <Button onClick={addHoliday} disabled={!selectedDate}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Holiday
                        </Button>
                      </div>

                      <div className="space-y-3 w-full">
                        {holidays.map(holiday => (
                          <div key={holiday.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg w-full">
                            <div className="flex-1 min-w-[150px]">
                              <span className="text-sm font-medium text-gray-900">
                                {format(holiday.date, "PPP")}
                              </span>
                            </div>
                            <div className="flex-1">
                              <Input placeholder="Holiday name" value={holiday.name} onChange={e => updateHoliday(holiday.id, 'name', e.target.value)} className="w-full" />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeHoliday(holiday.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {holidays.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No holidays configured
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-6 w-full">
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-medium text-gray-900">Break Times</h3>
                        <Button type="button" onClick={addBreakTime}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Break Time
                        </Button>
                      </div>

                      <div className="space-y-3 w-full">
                        {breakTimes.map(breakTime => (
                          <div key={breakTime.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg w-full">
                            <div className="flex-1">
                              <Input 
                                placeholder="Break name" 
                                value={breakTime.name} 
                                onChange={e => updateBreakTime(breakTime.id, 'name', e.target.value)} 
                                className="w-full" 
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm text-gray-600 min-w-[40px]">From:</Label>
                              <Input 
                                type="time" 
                                value={breakTime.startTime} 
                                onChange={e => updateBreakTime(breakTime.id, 'startTime', e.target.value)} 
                                className="w-28" 
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm text-gray-600 min-w-[25px]">To:</Label>
                              <Input 
                                type="time" 
                                value={breakTime.endTime} 
                                onChange={e => updateBreakTime(breakTime.id, 'endTime', e.target.value)} 
                                className="w-28" 
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeBreakTime(breakTime.id)} 
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {breakTimes.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No break times configured
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </div>

          <div className="px-8 py-6 border-t bg-gray-50 flex justify-end w-full">
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {staff ? 'UPDATE STAFF' : 'ADD STAFF'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>;
};
