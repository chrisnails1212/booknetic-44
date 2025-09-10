
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { useAppData } from '@/contexts/AppDataContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const Workflow = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  
  const { workflows, deleteWorkflow, updateWorkflow } = useAppData();
  const { toast } = useToast();

  // Filter workflows based on search term and event filter
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = eventFilter === 'all' || workflow.event === eventFilter;
    
    return matchesSearch && matchesEvent;
  });

  const handleDeleteWorkflow = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the workflow "${name}"?`)) {
      deleteWorkflow(id);
      toast({
        title: "Success",
        description: "Workflow deleted successfully!",
      });
    }
  };

  const handleEditWorkflow = (id: string) => {
    setEditingWorkflow(id);
    setIsFormOpen(true);
  };

  const handleToggleWorkflow = (id: string, currentStatus: boolean) => {
    updateWorkflow(id, { enabled: !currentStatus });
    toast({
      title: "Success",
      description: `Workflow ${!currentStatus ? 'enabled' : 'disabled'} successfully!`,
    });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWorkflow(null);
  };

  const formatEventName = (event: string) => {
    return event.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatActionName = (action: string) => {
    return action.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
              {workflows.length}
            </span>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            CREATE NEW WORKFLOW
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Quick search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="appointment-booked">Appointment Booked</SelectItem>
              <SelectItem value="appointment-cancelled">Appointment Cancelled</SelectItem>
              <SelectItem value="appointment-completed">Appointment Completed</SelectItem>
              <SelectItem value="payment-received">Payment Received</SelectItem>
              <SelectItem value="customer-registered">Customer Registered</SelectItem>
              <SelectItem value="reminder-due">Reminder Due</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-slate-300" />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>NAME</TableHead>
                <TableHead>EVENT</TableHead>
                <TableHead>ACTION(S)</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    {workflows.length === 0 ? "No entries!" : "No workflows match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-slate-300" />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">
                      {workflow.id.slice(-6)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {workflow.name}
                    </TableCell>
                    <TableCell>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {formatEventName(workflow.event)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {formatActionName(workflow.action)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditWorkflow(workflow.id)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleWorkflow(workflow.id, workflow.enabled)}>
                            {workflow.enabled ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Showing {filteredWorkflows.length} of {workflows.length} total</span>
            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-xs">i</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span>Need Help?</span>
          </div>
        </div>
      </div>

      {/* Sliding Form */}
      <WorkflowForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        editingWorkflowId={editingWorkflow}
      />
    </Layout>
  );
};

export default Workflow;
