
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus } from 'lucide-react';
import { useBookingTheme } from '@/contexts/BookingThemeContext';
import { useToast } from '@/hooks/use-toast';

const defaultStyles = [
  {
    id: 'default',
    name: 'Default style',
    color: 'bg-blue-500',
    theme: {
      styleName: 'Default style',
      panelBackground: '#2563eb',
      primaryColor: '#2563eb',
      completedColor: '#10b981',
      activeColor: '#3b82f6'
    },
    selected: true,
    isCustom: false
  },
  {
    id: 'brown',
    name: 'Brown style', 
    color: 'bg-amber-700',
    theme: {
      styleName: 'Brown',
      panelBackground: '#92400e',
      primaryColor: '#92400e',
      completedColor: '#10b981',
      activeColor: '#f59e0b'
    },
    selected: false,
    isCustom: false
  },
  {
    id: 'red',
    name: 'Red style',
    color: 'bg-red-500',
    theme: {
      styleName: 'Red',
      panelBackground: '#dc2626',
      primaryColor: '#dc2626',
      completedColor: '#10b981',
      activeColor: '#ef4444'
    },
    selected: false,
    isCustom: false
  },
  {
    id: 'green',
    name: 'Green style',
    color: 'bg-green-500',
    theme: {
      styleName: 'Green',
      panelBackground: '#16a34a',
      primaryColor: '#16a34a',
      completedColor: '#10b981',
      activeColor: '#22c55e'
    },
    selected: false,
    isCustom: false
  },
  {
    id: 'pink',
    name: 'Pink style',
    color: 'bg-pink-500',
    theme: {
      styleName: 'Pink',
      panelBackground: '#ec4899',
      primaryColor: '#ec4899',
      completedColor: '#10b981',
      activeColor: '#f472b6'
    },
    selected: false,
    isCustom: false
  }
];

const blankStyleTemplate = {
  styleName: '',
  panelBackground: '#ffffff',
  primaryColor: '#000000',
  completedColor: '#10b981',
  activeColor: '#3b82f6',
  businessName: 'Elite Hair Salon',
  businessSlogan: 'Book your appointment online',
  logo: '',
  showBookingProcess: false,
  website: '',
  phone: '',
  email: '',
  address: ''
};

const Appearance = () => {
  const { theme, updateTheme } = useBookingTheme();
  const { toast } = useToast();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Initialize styles from localStorage or use defaults
  const [styles, setStyles] = useState(() => {
    try {
      const savedStyles = localStorage.getItem('customStyles');
      const customStyles = savedStyles ? JSON.parse(savedStyles) : [];
      return [...defaultStyles, ...customStyles];
    } catch {
      return defaultStyles;
    }
  });
  
  // Initialize selectedStyle based on current theme
  const [selectedStyle, setSelectedStyle] = useState(() => {
    const currentStyle = styles.find(s => 
      s.theme.panelBackground === theme.panelBackground &&
      s.theme.primaryColor === theme.primaryColor
    );
    return currentStyle?.id || 'default';
  });
  const [localTheme, setLocalTheme] = useState(theme);

  const handleSelectStyle = (styleId: string) => {
    const style = styles.find(s => s.id === styleId);
    if (style) {
      updateTheme(style.theme);
      setLocalTheme(style.theme); // Update localTheme to reflect the selected style
      setSelectedStyle(styleId);
      toast({
        title: "Style Applied",
        description: `${style.name} has been applied to your booking page.`,
      });
    }
  };

  const handleSaveTheme = () => {
    if (isCreatingNew) {
      // Validate that style has a name
      if (!localTheme.styleName.trim()) {
        toast({
          title: "Style name required",
          description: "Please enter a name for your custom style.",
          variant: "destructive"
        });
        return;
      }
      
      // Create new custom style
      const newStyleId = `custom-${Date.now()}`;
      const newStyle = {
        id: newStyleId,
        name: localTheme.styleName,
        color: 'bg-slate-500', // Default color for custom styles
        theme: { ...localTheme },
        selected: false,
        isCustom: true
      };
      
      // Add to styles list
      const updatedStyles = [...styles, newStyle];
      setStyles(updatedStyles);
      
      // Save custom styles to localStorage
      const customStyles = updatedStyles.filter(s => s.isCustom);
      localStorage.setItem('customStyles', JSON.stringify(customStyles));
      
      // Apply the new style
      updateTheme(localTheme);
      setSelectedStyle(newStyleId);
      setIsCreatingNew(false);
      
      toast({
        title: "Style Created",
        description: `"${localTheme.styleName}" has been created and applied.`,
      });
    } else {
      // Update existing style
      updateTheme(localTheme);
      toast({
        title: "Theme Saved",
        description: `"${localTheme.styleName}" has been saved successfully.`,
      });
    }
    
    setShowCustomizer(false);
  };

  const handleCreateNewStyle = () => {
    setLocalTheme(blankStyleTemplate);
    setIsCreatingNew(true);
    setShowCustomizer(true);
  };

  const handleThemeChange = (key: string, value: string) => {
    setLocalTheme(prev => ({ ...prev, [key]: value }));
  };

  if (showCustomizer) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowCustomizer(false)}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isCreatingNew ? 'Create New Style' : 'Customize Booking Page'}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  {isCreatingNew ? 'Design your custom style' : `Editing: ${localTheme.styleName}`}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => {
                setShowCustomizer(false);
                setIsCreatingNew(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveTheme}>
                {isCreatingNew ? 'Create Style' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Customizer Content */}
          <div className="grid grid-cols-2 gap-6">
            {/* Options Panel */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-600 mb-6 uppercase">Options</h3>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="styleName" className="text-sm font-medium text-slate-700">
                    Style name {isCreatingNew && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="styleName"
                    placeholder={isCreatingNew ? "Enter style name..." : "Type name..."}
                    value={localTheme.styleName}
                    onChange={(e) => handleThemeChange('styleName', e.target.value)}
                    className="mt-2"
                    required={isCreatingNew}
                  />
                </div>


                <div>
                  <Label htmlFor="panelBackground" className="text-sm font-medium text-slate-700">Panel background</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="color"
                      value={localTheme.panelBackground}
                      onChange={(e) => handleThemeChange('panelBackground', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300"
                    />
                    <Input value={localTheme.panelBackground} readOnly className="flex-1" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="primaryColor" className="text-sm font-medium text-slate-700">Primary BG / text color</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="color"
                      value={localTheme.primaryColor}
                      onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300"
                    />
                    <Input value={localTheme.primaryColor} readOnly className="flex-1" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="completedColor" className="text-sm font-medium text-slate-700">Completed steps BG / label color</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="color"
                      value={localTheme.completedColor}
                      onChange={(e) => handleThemeChange('completedColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300"
                    />
                    <Input value={localTheme.completedColor} readOnly className="flex-1" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="activeColor" className="text-sm font-medium text-slate-700">Active steps BG / label color</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="color"
                      value={localTheme.activeColor}
                      onChange={(e) => handleThemeChange('activeColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300"
                    />
                    <Input value={localTheme.activeColor} readOnly className="flex-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Design Preview Panel */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-600 mb-6 uppercase">Live Preview</h3>
              
              <div className="bg-slate-50 rounded-lg overflow-hidden min-h-[400px]">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 text-center text-white" style={{ backgroundColor: localTheme.panelBackground }}>
                    <div className="w-8 h-8 bg-white rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-800">E</span>
                    </div>
                    <div className="text-sm font-bold mb-1">Elite Hair Salon</div>
                    <div className="text-xs opacity-90">Book your appointment online</div>
                  </div>
                  
                  {/* Step Indicators */}
                  <div className="bg-white px-4 py-3 border-b">
                    <div className="flex justify-center space-x-2">
                      <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: localTheme.activeColor }}>1</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">2</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">3</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">4</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">5</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">6</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">7</div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Select Location</h3>
                    <div className="space-y-4">
                      <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 text-slate-400 mt-0.5">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-900 mb-1">Location 1</div>
                            <div className="text-xs text-slate-600">123 Main Street</div>
                            <div className="text-xs text-slate-600">8765432456</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 text-slate-400 mt-0.5">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-900 mb-1">Location 2</div>
                            <div className="text-xs text-slate-600">1423 Street Name</div>
                            <div className="text-xs text-slate-600">73890876789</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button 
                        className="px-4 py-2 text-white text-sm font-medium rounded"
                        style={{ backgroundColor: localTheme.primaryColor }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Appearance</h1>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
              7
            </span>
          </div>
        </div>

        {/* Style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {styles.map((style) => (
            <div key={style.id} className="bg-white rounded-lg border border-slate-200 p-4">
              {/* Style Preview */}
              <div className="bg-slate-50 rounded-lg overflow-hidden mb-4 min-h-[300px]">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 text-center text-white" style={{ backgroundColor: selectedStyle === style.id ? theme.panelBackground : style.theme.panelBackground }}>
                    <div className="w-8 h-8 bg-white rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-800">E</span>
                    </div>
                    <div className="text-sm font-bold mb-1">Elite Hair Salon</div>
                    <div className="text-xs opacity-90">Book your appointment online</div>
                  </div>
                  
                  {/* Step Indicators */}
                  <div className="bg-white px-4 py-3 border-b">
                    <div className="flex justify-center space-x-2">
                      <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: selectedStyle === style.id ? theme.activeColor : style.theme.activeColor }}>1</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">2</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">3</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">4</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">5</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">6</div>
                      <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">7</div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Select Location</h3>
                    <div className="space-y-4">
                      <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 text-slate-400 mt-0.5">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-900 mb-1">Location 1</div>
                            <div className="text-xs text-slate-600">123 Main Street</div>
                            <div className="text-xs text-slate-600">8765432456</div>
                          </div>
                        </div>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 text-slate-400 mt-0.5">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-900 mb-1">Location 2</div>
                            <div className="text-xs text-slate-600">1423 Street Name</div>
                            <div className="text-xs text-slate-600">73890876789</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Button */}
                  <div className="bg-white p-4 border-t">
                    <div className="flex justify-end">
                      <button 
                        className="text-white text-xs px-4 py-2 rounded font-medium"
                        style={{ backgroundColor: selectedStyle === style.id ? theme.primaryColor : style.theme.primaryColor }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Style Info */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="font-medium text-slate-900">
                    {selectedStyle === style.id ? theme.styleName : style.name}
                  </h3>
                  {selectedStyle === style.id && theme.styleName !== style.name && (
                    <span className="text-xs text-slate-500">Custom style</span>
                  )}
                </div>
                {selectedStyle === style.id ? (
                  <Button 
                    size="sm" 
                    onClick={() => {
                    // Use current theme instead of original style theme to preserve customizations
                    setLocalTheme(theme);
                    setIsCreatingNew(false);
                    setShowCustomizer(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    CUSTOMIZE
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSelectStyle(style.id)}
                  >
                    SELECT
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Create New Style */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center min-h-[400px] border-dashed">
            <Button
              variant="outline"
              className="flex flex-col items-center space-y-2 h-auto p-6"
              onClick={handleCreateNewStyle}
            >
              <Plus className="w-8 h-8 text-slate-400" />
              <span className="text-slate-600">Create new style</span>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Appearance;
