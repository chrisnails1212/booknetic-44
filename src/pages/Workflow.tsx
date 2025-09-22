import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Search, Edit, Trash2, Copy, Download } from 'lucide-react';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { useAppData } from '@/contexts/AppDataContext';
import { useToast } from '@/hooks/use-toast';

const Workflow = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  const { workflows, deleteWorkflow, updateWorkflow } = useAppData();
  const { toast } = useToast();

  // Filter workflows based on search term, event filter, and status filter
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = eventFilter === 'all' || workflow.event === eventFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && workflow.enabled) ||
      (statusFilter === 'disabled' && !workflow.enabled);
    
    return matchesSearch && matchesEvent && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkflows = filteredWorkflows.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteWorkflow = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the workflow "${name}"?`)) {
      deleteWorkflow(id);
      setSelectedWorkflows(prev => prev.filter(selectedId => selectedId !== id));
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

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWorkflows(paginatedWorkflows.map(workflow => workflow.id));
    } else {
      setSelectedWorkflows([]);
    }
  };

  const handleSelectWorkflow = (workflowId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkflows(prev => [...prev, workflowId]);
    } else {
      setSelectedWorkflows(prev => prev.filter(id => id !== workflowId));
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedWorkflows.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedWorkflows.length} workflow(s)?`)) {
      selectedWorkflows.forEach(workflowId => {
        deleteWorkflow(workflowId);
      });
      setSelectedWorkflows([]);
      toast({
        title: "Success",
        description: `${selectedWorkflows.length} workflow(s) deleted successfully`,
      });
    }
  };

  const handleBulkToggle = (enable: boolean) => {
    selectedWorkflows.forEach(workflowId => {
      updateWorkflow(workflowId, { enabled: enable });
    });
    setSelectedWorkflows([]);
    toast({
      title: "Success",
      description: `${selectedWorkflows.length} workflow(s) ${enable ? 'enabled' : 'disabled'} successfully`,
    });
  };

  const handleExportToCSV = () => {
    const headers = ['ID', 'Name', 'Event', 'Action', 'Status'];
    const csvData = [
      headers.join(','),
      ...filteredWorkflows.map((workflow) => [
        `"${workflow.id.slice(-6)}"`,
        `"${workflow.name}"`,
        `"${formatEventName(workflow.event)}"`,
        `"${formatActionName(workflow.action)}"`,
        `"${workflow.enabled ? 'Enabled' : 'Disabled'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `workflows-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "Workflows exported to CSV successfully",
    });
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
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              CREATE NEW WORKFLOW
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search workflows..."
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedWorkflows.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedWorkflows.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggle(true)}
              >
                Enable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggle(false)}
              >
                Disable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      paginatedWorkflows.length > 0 &&
                      paginatedWorkflows.every(workflow => selectedWorkflows.includes(workflow.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>NAME</TableHead>
                <TableHead>EVENT</TableHead>
                <TableHead>ACTION(S)</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="w-[100px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    {workflows.length === 0 ? "No entries!" : "No workflows match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedWorkflows.includes(workflow.id)}
                        onCheckedChange={(checked) => 
                          handleSelectWorkflow(workflow.id, checked as boolean)
                        }
                      />
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
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditWorkflow(workflow.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredWorkflows.length)} of {filteredWorkflows.length} workflows
            </span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">per page</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
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