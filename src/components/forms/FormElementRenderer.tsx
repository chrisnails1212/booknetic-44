
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';

interface ConditionalRule {
  targetFieldId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
  action: 'show' | 'hide' | 'require' | 'unrequire';
}

interface FormElement {
  id: string;
  type: 'label' | 'text-input' | 'textarea' | 'number-input' | 'date-input' | 'time-input' | 'checkbox' | 'select' | 'radio-buttons' | 'file' | 'link' | 'email' | 'phone';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  conditionalRules?: ConditionalRule[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface FormElementRendererProps {
  element: FormElement;
  preview?: boolean;
  formValues?: Record<string, any>;
  allElements?: FormElement[];
}

export const FormElementRenderer = ({ element, preview = true, formValues = {}, allElements = [] }: FormElementRendererProps) => {
  // Check conditional logic
  const evaluateConditions = () => {
    if (!element.conditionalRules || element.conditionalRules.length === 0) {
      return { visible: true, required: element.required || false };
    }

    let visible = true;
    let required = element.required || false;

    element.conditionalRules.forEach(rule => {
      const targetValue = formValues[rule.targetFieldId];
      const ruleValue = rule.value;
      let conditionMet = false;

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
            visible = true;
            break;
          case 'hide':
            visible = false;
            break;
          case 'require':
            required = true;
            break;
          case 'unrequire':
            required = false;
            break;
        }
      }
    });

    return { visible, required };
  };

  const { visible, required } = evaluateConditions();
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
              placeholder={element.placeholder || 'Enter text...'}
              disabled={preview}
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
              placeholder={element.placeholder || 'Enter text...'}
              disabled={preview}
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
              placeholder={element.placeholder || 'Enter number...'}
              disabled={preview}
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
              disabled={preview}
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
              disabled={preview}
              className="w-full"
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={element.id}
              disabled={preview}
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
            <Select disabled={preview}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {element.options?.filter(option => option.trim()).map((option, index) => {
                  const value = option.toLowerCase().replace(/\s+/g, '-') || `option-${index}`;
                  return (
                    <SelectItem key={index} value={value}>
                      {option}
                    </SelectItem>
                  );
                })}
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
            <RadioGroup disabled={preview} className="space-y-2">
              {element.options?.filter(option => option.trim()).map((option, index) => {
                const value = option.toLowerCase().replace(/\s+/g, '-') || `option-${index}`;
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={value} 
                      id={`${element.id}-${index}`}
                    />
                    <Label htmlFor={`${element.id}-${index}`} className="text-sm text-slate-600">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="file"
              disabled={preview}
              className="w-full"
            />
          </div>
        );

      case 'link':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="url"
                placeholder={element.placeholder || 'https://example.com'}
                disabled={preview}
                className="w-full"
              />
              <Button variant="outline" size="sm" disabled={preview}>
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {element.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="tel"
              placeholder={element.placeholder || '+1 (555) 123-4567'}
              disabled={preview}
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
              placeholder={element.placeholder || 'example@email.com'}
              disabled={preview}
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

  if (!visible) {
    return null;
  }

  return (
    <div className="w-full">
      {renderElement()}
    </div>
  );
};
