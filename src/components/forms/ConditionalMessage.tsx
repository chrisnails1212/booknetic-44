
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface ConditionalMessageProps {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  onDismiss?: () => void;
}

export const ConditionalMessage = ({ message, type, onDismiss }: ConditionalMessageProps) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getVariant()} className="my-2">
      {getIcon()}
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
};
