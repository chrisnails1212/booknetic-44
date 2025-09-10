
export interface ConditionalRule {
  targetFieldId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
  action: 'show' | 'hide' | 'require' | 'unrequire' | 'show_message' | 'show_field' | 'disable_form';
  message?: string;
  messageType?: 'info' | 'warning' | 'error' | 'success';
  dynamicField?: {
    id: string;
    type: 'text-input' | 'textarea' | 'number-input' | 'select' | 'checkbox' | 'date-input' | 'email' | 'phone';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  };
}

export interface FormElement {
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
