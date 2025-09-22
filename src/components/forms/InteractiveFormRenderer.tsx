
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { Link, Download, Eye, X } from 'lucide-react';
import { createBlobFromBase64, SerializableFile } from '@/utils/fileHelper';
import { useToast } from '@/hooks/use-toast';
import { ConditionalMessage } from './ConditionalMessage';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { ConditionalRule, FormElement } from '@/types/formTypes';

interface InteractiveFormRendererProps {
  element: FormElement;
  value?: any;
  onChange: (value: any) => void;
  formValues?: Record<string, any>;
  allElements?: FormElement[];
  onDynamicFieldChange?: (fieldId: string, value: any) => void;
  dynamicFieldValues?: Record<string, any>;
}

export const InteractiveFormRenderer = ({ 
  element, 
  value, 
  onChange, 
  formValues = {}, 
  allElements = [],
  onDynamicFieldChange,
  dynamicFieldValues = {}
}: InteractiveFormRendererProps) => {
  const { toast } = useToast();
  const [conditionalMessages, setConditionalMessages] = useState<Array<{rule: ConditionalRule, id: string}>>([]);
  const [dynamicFields, setDynamicFields] = useState<Array<{rule: ConditionalRule, id: string}>>([]);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [required, setRequired] = useState(element.required || false);
  
  // Check conditional logic
  const evaluateConditions = () => {
    if (!element.conditionalRules || element.conditionalRules.length === 0) {
      setVisible(true);
      setRequired(element.required || false);
      setConditionalMessages([]);
      setDynamicFields([]);
      setIsFormDisabled(false);
      return;
    }

    let newVisible = true;
    let newRequired = element.required || false;
    const newMessages: Array<{rule: ConditionalRule, id: string}> = [];
    const newDynamicFields: Array<{rule: ConditionalRule, id: string}> = [];
    let formDisabled = false;

    element.conditionalRules.forEach((rule, index) => {
      // Get the target value - could be from current field or another field
      const targetValue = rule.targetFieldId === element.id ? value : formValues[rule.targetFieldId];
      const ruleValue = rule.value;
      let conditionMet = false;

      // Ensure we have a value to compare
      if (targetValue === undefined || targetValue === null || targetValue === '') {
        return; // Skip evaluation if no value
      }

      switch (rule.condition) {
        case 'equals':
          conditionMet = String(targetValue).toLowerCase() === ruleValue.toLowerCase();
          break;
        case 'not_equals':
          conditionMet = String(targetValue).toLowerCase() !== ruleValue.toLowerCase();
          break;
        case 'contains':
          conditionMet = String(targetValue).toLowerCase().includes(ruleValue.toLowerCase());
          break;
        case 'greater_than':
          conditionMet = Number(targetValue) > Number(ruleValue);
          break;
        case 'less_than':
          conditionMet = Number(targetValue) < Number(ruleValue);
          break;
      }

      if (conditionMet) {
        switch (rule.action) {
          case 'show':
            // Only apply if rule is not self-referencing for show/hide actions
            if (rule.targetFieldId !== element.id) {
              newVisible = true;
            }
            break;
          case 'hide':
            // Only apply if rule is not self-referencing for show/hide actions
            if (rule.targetFieldId !== element.id) {
              newVisible = false;
            }
            break;
          case 'require':
            // Only apply if rule is not self-referencing for require actions
            if (rule.targetFieldId !== element.id) {
              newRequired = true;
            }
            break;
          case 'unrequire':
            // Only apply if rule is not self-referencing for require actions
            if (rule.targetFieldId !== element.id) {
              newRequired = false;
            }
            break;
          case 'show_message':
            if (rule.message) {
              newMessages.push({ rule, id: `${element.id}_${index}` });
            }
            break;
          case 'show_field':
            if (rule.dynamicField) {
              newDynamicFields.push({ rule, id: `${element.id}_${index}` });
            }
            break;
          case 'disable_form':
            formDisabled = true;
            break;
        }
      }
    });

    setVisible(newVisible);
    setRequired(newRequired);
    setConditionalMessages(newMessages);
    setDynamicFields(newDynamicFields);
    setIsFormDisabled(formDisabled);
  };
  
  // Re-evaluate conditions when form values change or current value changes
  useEffect(() => {
    evaluateConditions();
  }, [formValues, element.conditionalRules, value]);
  
  if (!visible) {
    return null;
  }
  
  const renderElement = () => {
    switch (element.type) {
      case 'label':
        return (
          <Label className="text-sm font-medium text-slate-700">
            {element.label}
          </Label>
        );

      case 'text-input':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={element.placeholder || 'Enter text...'}
              className="w-full"
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={element.placeholder || 'Enter text...'}
              className="w-full min-h-[80px]"
            />
          </div>
        );

      case 'number-input':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={element.placeholder || 'Enter number...'}
              min={element.validation?.min}
              max={element.validation?.max}
              className="w-full"
            />
          </div>
        );

      case 'date-input':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full"
            />
          </div>
        );

      case 'time-input':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="time"
              value={value && typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full"
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={element.id}
              checked={value === 'true' || value === true}
              onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
            />
            <Label htmlFor={element.id} className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={element.placeholder || 'Select an option...'} />
              </SelectTrigger>
              <SelectContent>
                {element.options?.filter(option => option && option.trim() !== '').map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio-buttons':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-2">
              {element.options?.filter(option => option && option.trim() !== '').map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option} 
                    id={`${element.id}-${index}`}
                  />
                  <Label htmlFor={`${element.id}-${index}`} className="text-sm text-slate-600">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'file':
        const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            // Store file with metadata
            const fileData = {
              file: file,
              name: file.name,
              size: file.size,
              type: file.type,
              uploadDate: new Date().toISOString()
            };
            onChange(fileData);
          }
        };

        const handleFileView = () => {
          try {
            // Handle fresh File objects
            if (value?.file && value.file instanceof File) {
              const url = URL.createObjectURL(value.file);
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              return;
            }
            
            // Handle direct File objects
            if (value instanceof File) {
              const url = URL.createObjectURL(value);
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              return;
            }
            
            // Handle serialized file data (base64)
            if (value?.data && typeof value.data === 'string' && value.type) {
              const blob = createBlobFromBase64(value.data, value.type);
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              return;
            }
            
            // Handle saved files with URL
            if (value?.url || value?.fileUrl) {
              const fileUrl = value.url || value.fileUrl;
              window.open(fileUrl, '_blank');
              return;
            }
            
            throw new Error('No valid file data found');
          } catch (error) {
            console.error('Error viewing file:', error);
            toast({
              title: "Error",
              description: "Unable to view file. File data may be corrupted.",
              variant: "destructive"
            });
          }
        };

        const handleFileDownload = () => {
          try {
            // Handle fresh File objects
            if (value?.file && value.file instanceof File) {
              const url = URL.createObjectURL(value.file);
              const link = document.createElement('a');
              link.href = url;
              link.download = value.file.name || 'download';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              return;
            }
            
            // Handle direct File objects
            if (value instanceof File) {
              const url = URL.createObjectURL(value);
              const link = document.createElement('a');
              link.href = url;
              link.download = value.name || 'download';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              return;
            }
            
            // Handle serialized file data (base64)
            if (value?.data && typeof value.data === 'string' && value.type) {
              const blob = createBlobFromBase64(value.data, value.type);
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = value.name || 'download';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              return;
            }
            
            // Handle saved files with URL
            if (value?.url || value?.fileUrl) {
              const fileUrl = value.url || value.fileUrl;
              const link = document.createElement('a');
              link.href = fileUrl;
              link.download = value.name || value.filename || 'download';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              return;
            }
            
            throw new Error('No valid file data found');
          } catch (error) {
            console.error('Error downloading file:', error);
            toast({
              title: "Error",
              description: "Unable to download file. File data may be corrupted.",
              variant: "destructive"
            });
          }
        };

        const handleFileRemove = () => {
          onChange(null);
        };

        const formatFileSize = (bytes: number) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {value?.name ? (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {value.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(value.size)} • {value.type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileView}
                      className="h-8 w-8 p-0"
                      title="View file"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileDownload}
                      className="h-8 w-8 p-0"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileRemove}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Input
                type="file"
                onChange={handleFileUpload}
                className="w-full"
              />
            )}
          </div>
        );

      case 'link':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={element.placeholder || 'https://example.com'}
              className="w-full"
            />
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <PhoneInput
              value={value || ''}
              onChange={(val) => onChange(val)}
              className="w-full"
            />
          </div>
        );

      case 'email':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="email"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={element.placeholder || 'example@email.com'}
              className="w-full"
            />
          </div>
        );

      default:
        return (
          <div className="text-sm text-slate-500">
            Unknown element type: {element.type}
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderElement()}
      
      {/* Conditional Messages */}
      {conditionalMessages.map(({ rule, id }) => (
        <ConditionalMessage
          key={id}
          message={rule.message!}
          type={rule.messageType || 'info'}
        />
      ))}
      
      {/* Dynamic Fields */}
      {dynamicFields.map(({ rule, id }) => (
        <div key={id} className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <DynamicFieldRenderer
            dynamicField={rule.dynamicField!}
            value={dynamicFieldValues[rule.dynamicField!.id]}
            onChange={(value) => onDynamicFieldChange?.(rule.dynamicField!.id, value)}
          />
        </div>
      ))}
      
      {/* Form Disabled Overlay */}
      {isFormDisabled && (
        <div className="absolute inset-0 bg-slate-200 bg-opacity-50 rounded-md flex items-center justify-center">
          <span className="text-sm text-slate-600 font-medium">Form disabled by conditional logic</span>
        </div>
      )}
    </div>
  );
};
