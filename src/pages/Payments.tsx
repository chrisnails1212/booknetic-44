
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Payment {
  id: number;
  appointmentDate: string;
  customer: string;
  staff: string;
  service: string;
  method: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
}

const Payments = () => {
  const [payments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleExportCSV = () => {
    console.log('Exporting to CSV...');
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              0
            </span>
          </div>
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT TO CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Quick search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="haircut">Haircut</SelectItem>
              <SelectItem value="massage">Massage</SelectItem>
              <SelectItem value="facial">Facial</SelectItem>
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john">John Doe</SelectItem>
              <SelectItem value="jane">Jane Smith</SelectItem>
            </SelectContent>
          </Select>

          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="staff1">Staff Member 1</SelectItem>
              <SelectItem value="staff2">Staff Member 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead>ID ↓</TableHead>
                <TableHead>APPOINTMENT DATE ↑</TableHead>
                <TableHead>CUSTOMER ↓</TableHead>
                <TableHead>STAFF ↓</TableHead>
                <TableHead>SERVICE ↓</TableHead>
                <TableHead>METHOD ↓</TableHead>
                <TableHead>TOTAL AMOUNT</TableHead>
                <TableHead>PAID AMOUNT</TableHead>
                <TableHead>DUE AMOUNT</TableHead>
                <TableHead>STATUS ↓</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                    No entries!
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.appointmentDate}</TableCell>
                    <TableCell>{payment.customer}</TableCell>
                    <TableCell>{payment.staff}</TableCell>
                    <TableCell>{payment.service}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>${payment.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>${payment.paidAmount.toFixed(2)}</TableCell>
                    <TableCell>${payment.dueAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing 0 of 0 total
            <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
              i
            </span>
          </span>
          <span className="text-blue-600 cursor-pointer hover:underline">
            ⓘ Need Help?
          </span>
        </div>
      </div>
    </Layout>
  );
};

export default Payments;
