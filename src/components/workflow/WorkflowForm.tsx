
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
import { Switch } from '@/components/ui/switch';
import { X, Plus, Edit } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { useToast } from '@/hooks/use-toast';

interface WorkflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingWorkflowId?: string | null;
}

export const WorkflowForm = ({ isOpen, onClose, editingWorkflowId }: WorkflowFormProps) => {
  const [workflowName, setWorkflowName] = useState('');
  const [whenThisHappens, setWhenThisHappens] = useState('');
  const [doThis, setDoThis] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  
  const { addWorkflow, updateWorkflow, getWorkflowById } = useAppData();
  const { toast } = useToast();

  const isEditing = !!editingWorkflowId;
  const editingWorkflow = editingWorkflowId ? getWorkflowById(editingWorkflowId) : null;

  // Load workflow data when editing
  useEffect(() => {
    if (isEditing && editingWorkflow) {
      setWorkflowName(editingWorkflow.name);
      setWhenThisHappens(editingWorkflow.event);
      setDoThis(editingWorkflow.action);
      setIsEnabled(editingWorkflow.enabled);
    } else {
      // Reset form for new workflow
      setWorkflowName('');
      setWhenThisHappens('');
      setDoThis('');
      setIsEnabled(true);
    }
  }, [isEditing, editingWorkflow, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workflowName.trim() || !whenThisHappens || !doThis) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && editingWorkflowId) {
        updateWorkflow(editingWorkflowId, {
          name: workflowName.trim(),
          event: whenThisHappens,
          action: doThis,
          enabled: isEnabled
        });
        toast({
          title: "Success",
          description: "Workflow updated successfully!",
        });
      } else {
        addWorkflow({
          name: workflowName.trim(),
          event: whenThisHappens,
          action: doThis,
          enabled: isEnabled
        });
        toast({
          title: "Success",
          description: "Workflow created successfully!",
        });
      }

      // Reset form
      setWorkflowName('');
      setWhenThisHappens('');
      setDoThis('');
      setIsEnabled(true);
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} workflow. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                {isEditing ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
              </div>
              <SheetTitle className="text-lg font-semibold">
                {isEditing ? 'Edit Workflow' : 'New Workflow'}
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Workflow Name */}
          <div className="space-y-2">
            <Label htmlFor="workflow-name" className="text-sm font-medium text-slate-700">
              Workflow Name
            </Label>
            <Input
              id="workflow-name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full"
              required
            />
          </div>

          {/* When This Happens */}
          <div className="space-y-2">
            <Label htmlFor="when-this-happens" className="text-sm font-medium text-slate-700">
              When This Happens <span className="text-red-500">*</span>
            </Label>
            <Select value={whenThisHappens} onValueChange={setWhenThisHappens}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment-booked">Appointment Booked</SelectItem>
                <SelectItem value="appointment-cancelled">Appointment Cancelled</SelectItem>
                <SelectItem value="appointment-completed">Appointment Completed</SelectItem>
                <SelectItem value="payment-received">Payment Received</SelectItem>
                <SelectItem value="customer-registered">Customer Registered</SelectItem>
                <SelectItem value="reminder-due">Reminder Due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Do This */}
          <div className="space-y-2">
            <Label htmlFor="do-this" className="text-sm font-medium text-slate-700">
              Do This <span className="text-red-500">*</span>
            </Label>
            <Select value={doThis} onValueChange={setDoThis}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send-email">Send Email</SelectItem>
                <SelectItem value="send-sms">Send SMS</SelectItem>
                <SelectItem value="create-task">Create Task</SelectItem>
                <SelectItem value="update-customer">Update Customer</SelectItem>
                <SelectItem value="send-notification">Send Notification</SelectItem>
                <SelectItem value="generate-invoice">Generate Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <Label className="text-sm font-medium text-slate-700">Enabled</Label>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
            >
              {isEditing ? 'UPDATE' : 'CREATE'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
