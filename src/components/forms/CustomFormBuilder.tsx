
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Zap, Trash2, MoreVertical, Copy, Edit, Eye } from 'lucide-react';
import { FormElementRenderer } from './FormElementRenderer';
import { FormElementOptions } from './FormElementOptions';
import { InteractiveFormRenderer } from './InteractiveFormRenderer';

interface SavedForm {
  id: string;
  name: string;
  elements: number;
  conditions: number;
  services: string;
  createdAt: Date;
}

interface FormElement {
  id: string;
  type: 'label' | 'text-input' | 'textarea' | 'number-input' | 'date-input' | 'time-input' | 'checkbox' | 'select' | 'radio-buttons' | 'file' | 'link' | 'email' | 'phone';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface CustomFormBuilderProps {
  onBack: () => void;
  editingForm?: SavedForm | null;
  viewingForm?: SavedForm | null;
}

const formElementTemplates = [
  { id: 'label', name: 'Label', icon: '🏷️', color: 'bg-green-500' },
  { id: 'text-input', name: 'Text input', icon: 'I', color: 'bg-pink-500' },
  { id: 'textarea', name: 'Textarea', icon: '💬', color: 'bg-orange-500' },
  { id: 'number-input', name: 'Number input', icon: '#', color: 'bg-cyan-500' },
  { id: 'date-input', name: 'Date input', icon: '📅', color: 'bg-blue-500' },
  { id: 'time-input', name: 'Time input', icon: '⏰', color: 'bg-orange-400' },
  { id: 'checkbox', name: 'Checkbox', icon: '✓', color: 'bg-purple-500' },
  { id: 'select', name: 'Select', icon: '▼', color: 'bg-indigo-500' },
  { id: 'radio-buttons', name: 'Radio buttons', icon: '◯', color: 'bg-orange-500' },
  { id: 'file', name: 'File', icon: '📁', color: 'bg-red-500' },
  { id: 'link', name: 'Link', icon: '🔗', color: 'bg-slate-500' },
  { id: 'email', name: 'Email', icon: '@', color: 'bg-green-500' },
  { id: 'phone', name: 'Phone', icon: '📞', color: 'bg-orange-500' },
];

export const CustomFormBuilder = ({ onBack, editingForm, viewingForm }: CustomFormBuilderProps) => {
  const [formName, setFormName] = useState('');
  const [selectedServices, setSelectedServices] = useState('');
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, any>>({});

  // Determine if we're in view-only mode
  const isViewOnly = Boolean(viewingForm);
  const formToLoad = editingForm || viewingForm;

  // No required fields by default
  const getRequiredFields = (): FormElement[] => [];

  // Load form data when component mounts
  React.useEffect(() => {
    if (formToLoad) {
      setFormName(formToLoad.name);
      setSelectedServices(formToLoad.services);
      
      // Load the actual form elements from localStorage using the correct key
      const savedFormElements = localStorage.getItem(`customForm_${formToLoad.id}`);
      
      if (savedFormElements) {
        try {
          const parsedElements = JSON.parse(savedFormElements);
          setFormElements(parsedElements);
        } catch (error) {
          console.error('Error parsing form elements:', error);
          setFormElements(getRequiredFields());
        }
      } else {
        setFormElements(getRequiredFields());
      }
      
      // Auto-enable preview mode if viewing only
      if (isViewOnly) {
        setPreviewMode(true);
      }
    } else {
      setFormName('');
      setSelectedServices('');
      setFormElements(getRequiredFields());
    }
    setSelectedElement(null);
  }, [formToLoad, isViewOnly]);

  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addElement = (type: FormElement['type']) => {
    const newElement: FormElement = {
      id: generateId(),
      type,
      label: `${formElementTemplates.find(t => t.id === type)?.name} Field`,
      placeholder: type.includes('input') ? 'Enter value...' : undefined,
      required: false,
      options: (type === 'select' || type === 'radio-buttons' || type === 'checkbox') ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };
    
    setFormElements([...formElements, newElement]);
    setSelectedElement(newElement);
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setFormElements(elements => 
      elements.map(el => el.id === id ? { ...el, ...updates } : el)
    );
    
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  const deleteElement = (id: string) => {
    // Prevent deletion of required fields
    if (id.startsWith('required_')) {
      return;
    }
    
    setFormElements(elements => elements.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (element: FormElement) => {
    const newElement = {
      ...element,
      id: generateId(),
      label: `${element.label} (Copy)`,
    };
    const index = formElements.findIndex(el => el.id === element.id);
    const newElements = [...formElements];
    newElements.splice(index + 1, 0, newElement);
    setFormElements(newElements);
  };

  const moveElement = (fromIndex: number, toIndex: number) => {
    const newElements = [...formElements];
    const [movedElement] = newElements.splice(fromIndex, 1);
    newElements.splice(toIndex, 0, movedElement);
    setFormElements(newElements);
  };

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedElement) {
      const draggedIndex = formElements.findIndex(el => el.id === draggedElement);
      if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
        moveElement(draggedIndex, targetIndex);
      }
    }
    
    setDraggedElement(null);
  };

  const handleElementClick = (template: any) => {
    addElement(template.id as FormElement['type']);
  };

  const handleFormValueChange = (elementId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const handleDynamicFieldChange = (fieldId: string, value: any) => {
    setDynamicFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSave = () => {
    const formId = editingForm?.id || generateId();
    const formData = {
      id: formId,
      name: formName,
      elements: formElements.length,
      conditions: 0,
      services: selectedServices || 'All Services',
      createdAt: editingForm?.createdAt || new Date(),
    };
    
    console.log('Saving form:', formData);
    
    // Save form elements separately with the same key pattern used in CustomForms.tsx
    localStorage.setItem(`customForm_${formId}`, JSON.stringify(formElements));
    
    // Save to localStorage
    const existingForms = JSON.parse(localStorage.getItem('customForms') || '[]');
    
    if (editingForm) {
      // Update existing form
      const updatedForms = existingForms.map((form: any) => 
        form.id === editingForm.id ? formData : form
      );
      localStorage.setItem('customForms', JSON.stringify(updatedForms));
    } else {
      // Create new form
      const updatedForms = [...existingForms, formData];
      localStorage.setItem('customForms', JSON.stringify(updatedForms));
    }
    
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">
            {isViewOnly ? 'View Form' : 'Customize Form'}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {!isViewOnly && (
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant="outline"
              className="text-sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'EDIT MODE' : 'PREVIEW'}
            </Button>
          )}
          {!isViewOnly && (
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white text-sm"
              disabled={!formName.trim() || formElements.length === 0}
            >
              SAVE FORM
            </Button>
          )}
        </div>
      </div>

      {/* Form Header */}
      {!isViewOnly && (
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Form name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="text-base"
            />
          </div>
          <div className="flex-1">
            <Select value={selectedServices} onValueChange={setSelectedServices}>
              <SelectTrigger>
                <SelectValue placeholder="Select service category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Services">All Services</SelectItem>
                <SelectItem value="Haircut">Haircut</SelectItem>
                <SelectItem value="Styling">Styling</SelectItem>
                <SelectItem value="Coloring">Coloring</SelectItem>
                <SelectItem value="Treatment">Treatment</SelectItem>
                <SelectItem value="Massage">Massage</SelectItem>
                <SelectItem value="Facial">Facial</SelectItem>
                <SelectItem value="Nails">Nails</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Form Builder Content */}
      {previewMode ? (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-6">Form Preview - Interactive Mode</h3>
          {formElements.length === 0 ? (
            <div className="text-center text-slate-400 py-20">
              <p>No form elements to preview</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formElements.map((element) => (
                <InteractiveFormRenderer
                  key={element.id}
                  element={element}
                  value={formValues[element.id]}
                  onChange={(value) => handleFormValueChange(element.id, value)}
                  formValues={formValues}
                  allElements={formElements}
                  onDynamicFieldChange={handleDynamicFieldChange}
                  dynamicFieldValues={dynamicFieldValues}
                />
              ))}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Submit Form
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6 min-h-[600px]">
          {/* Elements Panel */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-600 mb-4 uppercase">Elements</h3>
            <div className="grid grid-cols-2 gap-3">
              {formElementTemplates.map((element) => (
                <div
                  key={element.id}
                  onClick={() => handleElementClick(element)}
                  className="flex flex-col items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className={`w-12 h-12 ${element.color} rounded-xl flex items-center justify-center text-white text-lg mb-2`}>
                    {element.icon}
                  </div>
                  <span className="text-xs text-slate-600 text-center">{element.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Preview Panel */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-600 mb-4 uppercase">Form Preview</h3>
            <div className="min-h-[400px] border-2 border-dashed border-slate-200 rounded-lg p-4">
              {formElements.length === 0 ? (
                <div className="text-center text-slate-400 py-20">
                  <p className="text-sm">Drag elements here to build your form</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formElements.map((element, index) => (
                    <div
                      key={element.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, element.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => setSelectedElement(element)}
                      className={`group relative p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedElement?.id === element.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <FormElementRenderer element={element} />
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedElement(element)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateElement(element)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {!element.id.startsWith('required_') && (
                              <DropdownMenuItem 
                                onClick={() => deleteElement(element.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Options Panel */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-600 mb-4 uppercase">Options</h3>
            {selectedElement ? (
              <FormElementOptions
                element={selectedElement}
                allElements={formElements}
                onUpdate={(updates) => updateElement(selectedElement.id, updates)}
              />
            ) : (
              <div className="text-sm text-slate-500">
                Select an element to configure its options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
