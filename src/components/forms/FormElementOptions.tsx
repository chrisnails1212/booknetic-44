
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Settings } from 'lucide-react';
import { ConditionalRule, FormElement } from '@/types/formTypes';

interface FormElementOptionsProps {
  element: FormElement;
  onUpdate: (updates: Partial<FormElement>) => void;
  allElements: FormElement[];
}

export const FormElementOptions = ({ element, onUpdate, allElements }: FormElementOptionsProps) => {
  const handleLabelChange = (label: string) => {
    onUpdate({ label });
  };

  const handlePlaceholderChange = (placeholder: string) => {
    onUpdate({ placeholder });
  };

  const handleRequiredChange = (required: boolean) => {
    onUpdate({ required });
  };

  const handleValidationChange = (field: keyof NonNullable<FormElement['validation']>, value: string | number) => {
    const currentValidation = element.validation || {};
    onUpdate({
      validation: {
        ...currentValidation,
        [field]: value,
      },
    });
  };

  const handleOptionsChange = (options: string[]) => {
    onUpdate({ options });
  };

  const addOption = () => {
    const currentOptions = element.options || [];
    const newOptions = [...currentOptions, `Option ${currentOptions.length + 1}`];
    handleOptionsChange(newOptions);
  };

  const removeOption = (index: number) => {
    const currentOptions = element.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    handleOptionsChange(newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const currentOptions = element.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    handleOptionsChange(newOptions);
  };

  const handleConditionalRulesChange = (rules: ConditionalRule[]) => {
    onUpdate({ conditionalRules: rules });
  };

  const addConditionalRule = () => {
    const currentRules = element.conditionalRules || [];
    const newRule: ConditionalRule = {
      targetFieldId: element.id, // Default to current field
      condition: 'equals',
      value: '',
      action: 'show_message'
    };
    handleConditionalRulesChange([...currentRules, newRule]);
  };

  const removeConditionalRule = (index: number) => {
    const currentRules = element.conditionalRules || [];
    const newRules = currentRules.filter((_, i) => i !== index);
    handleConditionalRulesChange(newRules);
  };

  const updateConditionalRule = (index: number, updates: Partial<ConditionalRule>) => {
    const currentRules = element.conditionalRules || [];
    const newRules = [...currentRules];
    newRules[index] = { ...newRules[index], ...updates };
    handleConditionalRulesChange(newRules);
  };

  // Get available fields for conditional logic (include current element and exclude labels)
  const availableFields = [
    element, // Include current field
    ...allElements.filter(el => el.id !== element.id && el.type !== 'label')
  ];

  // Get the target field for a rule to show its options
  const getTargetField = (targetFieldId: string) => {
    return availableFields.find(field => field.id === targetFieldId);
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600 uppercase">Label</Label>
        <Input
          value={element.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Field label"
          className="text-sm"
        />
      </div>

      {/* Placeholder (for input fields) */}
      {(['text-input', 'textarea', 'number-input', 'email', 'link', 'phone'].includes(element.type)) && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600 uppercase">Placeholder</Label>
          <Input
            value={element.placeholder || ''}
            onChange={(e) => handlePlaceholderChange(e.target.value)}
            placeholder="Enter placeholder text"
            className="text-sm"
          />
        </div>
      )}

      {/* Required toggle */}
      {element.type !== 'label' && (
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-slate-600 uppercase">Required</Label>
          <Switch
            checked={element.required || false}
            onCheckedChange={handleRequiredChange}
          />
        </div>
      )}

      {/* Number validation */}
      {element.type === 'number-input' && (
        <div className="space-y-3">
          <Label className="text-xs font-medium text-slate-600 uppercase">Validation</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Min</Label>
              <Input
                type="number"
                value={element.validation?.min || ''}
                onChange={(e) => handleValidationChange('min', parseInt(e.target.value) || 0)}
                placeholder="Min"
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Max</Label>
              <Input
                type="number"
                value={element.validation?.max || ''}
                onChange={(e) => handleValidationChange('max', parseInt(e.target.value) || 0)}
                placeholder="Max"
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Text pattern validation */}
      {element.type === 'text-input' && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600 uppercase">Pattern (RegEx)</Label>
          <Input
            value={element.validation?.pattern || ''}
            onChange={(e) => handleValidationChange('pattern', e.target.value)}
            placeholder="^[a-zA-Z0-9]+$"
            className="text-sm font-mono"
          />
          <p className="text-xs text-slate-500">
            Use regular expressions to validate input format
          </p>
        </div>
      )}

{/* Select/Radio/Checkbox options */}
      {(element.type === 'select' || element.type === 'radio-buttons' || element.type === 'checkbox') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-600 uppercase">Options</Label>
            <Button
              onClick={addOption}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {element.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="text-sm flex-1"
                />
                <Button
                  onClick={() => removeOption(index)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          
          {(!element.options || element.options.length === 0) && (
            <p className="text-xs text-slate-500 text-center py-4">
              No options added yet. Click "Add" to create options.
            </p>
          )}
        </div>
      )}

      {/* Conditional Logic */}
      {element.type !== 'label' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-600 uppercase">
              <Settings className="w-3 h-3 inline-block mr-1" />
              Conditional Logic
            </Label>
            <Button
              onClick={addConditionalRule}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Rule
            </Button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {element.conditionalRules?.map((rule, index) => {
              const targetField = getTargetField(rule.targetFieldId);
              const isCurrentField = rule.targetFieldId === element.id;
              
              return (
                <div key={index} className="p-3 bg-slate-50 rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Rule {index + 1}</span>
                    <Button
                      onClick={() => removeConditionalRule(index)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {/* Target Field */}
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">When field</Label>
                    <Select 
                      value={rule.targetFieldId} 
                      onValueChange={(value) => updateConditionalRule(index, { targetFieldId: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.id === element.id ? `This Field (${field.label})` : field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Condition */}
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Condition</Label>
                    <Select 
                      value={rule.condition} 
                      onValueChange={(value: ConditionalRule['condition']) => updateConditionalRule(index, { condition: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="not_equals">does not equal</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        {targetField?.type === 'number-input' && (
                          <>
                            <SelectItem value="greater_than">greater than</SelectItem>
                            <SelectItem value="less_than">less than</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Value */}
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Value</Label>
                    {targetField && (targetField.type === 'select' || targetField.type === 'radio-buttons') && targetField.options ? (
                      <Select 
                        value={rule.value} 
                        onValueChange={(value) => updateConditionalRule(index, { value })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetField.options.map((option, optIndex) => (
                            <SelectItem key={optIndex} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={rule.value}
                        onChange={(e) => updateConditionalRule(index, { value: e.target.value })}
                        placeholder="Enter value"
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                  
                  {/* Action */}
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Then</Label>
                    <Select 
                      value={rule.action} 
                      onValueChange={(value: ConditionalRule['action']) => updateConditionalRule(index, { action: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {!isCurrentField && (
                          <>
                            <SelectItem value="show">show this field</SelectItem>
                            <SelectItem value="hide">hide this field</SelectItem>
                            <SelectItem value="require">make this field required</SelectItem>
                            <SelectItem value="unrequire">make this field optional</SelectItem>
                          </>
                        )}
                        <SelectItem value="show_message">show message</SelectItem>
                        <SelectItem value="show_field">show dynamic field</SelectItem>
                        <SelectItem value="disable_form">disable form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message Configuration */}
                  {rule.action === 'show_message' && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Message</Label>
                        <Textarea
                          value={rule.message || ''}
                          onChange={(e) => updateConditionalRule(index, { message: e.target.value })}
                          placeholder="Enter message to display..."
                          className="h-16 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Message Type</Label>
                        <Select 
                          value={rule.messageType || 'info'} 
                          onValueChange={(value: ConditionalRule['messageType']) => updateConditionalRule(index, { messageType: value })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Dynamic Field Configuration */}
                  {rule.action === 'show_field' && (
                    <div className="space-y-2 p-2 bg-slate-100 rounded">
                      <Label className="text-xs font-medium text-slate-600">Dynamic Field Configuration</Label>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Field Type</Label>
                        <Select 
                          value={rule.dynamicField?.type || 'text-input'} 
                          onValueChange={(value: 'text-input' | 'textarea' | 'number-input' | 'select' | 'checkbox' | 'date-input') => {
                            const newDynamicField = { 
                              ...rule.dynamicField, 
                              id: rule.dynamicField?.id || `dynamic_${Date.now()}`,
                              type: value,
                              label: rule.dynamicField?.label || 'New Field'
                            };
                            
                            // Initialize options for select and checkbox fields
                            if ((value === 'select' || value === 'checkbox') && !newDynamicField.options) {
                              newDynamicField.options = ['Option 1'];
                            }
                            
                            updateConditionalRule(index, { dynamicField: newDynamicField });
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-input">Text Input</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="number-input">Number Input</SelectItem>
                            <SelectItem value="date-input">Date Input</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Field Label</Label>
                        <Input
                          value={rule.dynamicField?.label || ''}
                          onChange={(e) => updateConditionalRule(index, { 
                            dynamicField: { 
                              ...rule.dynamicField, 
                              id: rule.dynamicField?.id || `dynamic_${Date.now()}`,
                              type: rule.dynamicField?.type || 'text-input',
                              label: e.target.value
                            } 
                          })}
                          placeholder="Enter field label"
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Placeholder</Label>
                        <Input
                          value={rule.dynamicField?.placeholder || ''}
                          onChange={(e) => updateConditionalRule(index, { 
                            dynamicField: { 
                              ...rule.dynamicField, 
                              id: rule.dynamicField?.id || `dynamic_${Date.now()}`,
                              type: rule.dynamicField?.type || 'text-input',
                              label: rule.dynamicField?.label || 'New Field',
                              placeholder: e.target.value
                            } 
                          })}
                          placeholder="Enter placeholder text"
                          className="h-8 text-sm"
                        />
                      </div>

{/* Options for select and checkbox fields */}
                      {(rule.dynamicField?.type === 'select' || rule.dynamicField?.type === 'checkbox') && (
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Options</Label>
                          <div className="space-y-1">
                            {(rule.dynamicField.options || []).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-1">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(rule.dynamicField!.options || [])];
                                    newOptions[optionIndex] = e.target.value;
                                    updateConditionalRule(index, {
                                      dynamicField: {
                                        ...rule.dynamicField!,
                                        options: newOptions
                                      }
                                    });
                                  }}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="h-7 text-xs flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newOptions = (rule.dynamicField!.options || []).filter((_, i) => i !== optionIndex);
                                    updateConditionalRule(index, {
                                      dynamicField: {
                                        ...rule.dynamicField!,
                                        options: newOptions
                                      }
                                    });
                                  }}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = [...(rule.dynamicField!.options || []), `Option ${(rule.dynamicField!.options?.length || 0) + 1}`];
                                updateConditionalRule(index, {
                                  dynamicField: {
                                    ...rule.dynamicField!,
                                    options: newOptions
                                  }
                                });
                              }}
                              className="h-7 w-full text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {(!element.conditionalRules || element.conditionalRules.length === 0) && (
            <p className="text-xs text-slate-500 text-center py-4">
              No conditional rules added yet. Click "Add Rule" to create logic.
            </p>
          )}
        </div>
      )}

      {/* Element type info */}
      <div className="pt-4 border-t border-slate-100">
        <Label className="text-xs font-medium text-slate-600 uppercase">Element Type</Label>
        <p className="text-sm text-slate-500 mt-1 capitalize">
          {element.type.replace('-', ' ')}
        </p>
      </div>
    </div>
  );
};
