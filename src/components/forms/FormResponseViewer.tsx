import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Calendar, User, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface FormResponseViewerProps {
  formId: string;
  formName: string;
  onBack: () => void;
}

interface FormResponse {
  id: string;
  formId: string;
  customerEmail: string;
  customerName: string;
  submittedAt: string;
  responses: Record<string, any>;
  appointmentId?: string;
}

export const FormResponseViewer = ({ formId, formName, onBack }: FormResponseViewerProps) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadResponses = () => {
      const savedResponses = JSON.parse(localStorage.getItem('formResponses') || '[]');
      const formResponses = savedResponses.filter((response: FormResponse) => response.formId === formId);
      setResponses(formResponses);
    };

    loadResponses();
  }, [formId]);

  const filteredResponses = responses.filter(response => 
    response.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Define compulsory field keys
  const compulsoryFields = ['customerName', 'customerEmail', 'phone', 'appointmentDate', 'appointmentTime', 'service'];

  const separateResponses = (responses: Record<string, any>) => {
    const compulsory: Record<string, any> = {};
    const custom: Record<string, any> = {};

    Object.entries(responses).forEach(([key, value]) => {
      if (compulsoryFields.includes(key)) {
        compulsory[key] = value;
      } else {
        custom[key] = value;
      }
    });

    return { compulsory, custom };
  };

  const renderResponseValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-400">No response</span>;
    }

    if (typeof value === 'boolean') {
      return <Badge variant={value ? "default" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>;
    }

    if (typeof value === 'object' && value.name) {
      // File upload
      return (
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <span className="text-sm">{value.name}</span>
        </div>
      );
    }

    return <span className="text-sm">{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{formName} Responses</h1>
            <span className="text-sm text-slate-500">{filteredResponses.length} responses</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Responses */}
      <div className="space-y-4">
        {filteredResponses.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No responses yet</h3>
                <p className="text-slate-500">
                  {searchTerm ? 'No responses match your search criteria' : 'This form hasn\'t received any responses yet.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredResponses.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>{response.customerName}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(response.submittedAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{response.customerEmail}</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-6">
                    {(() => {
                      const { compulsory, custom } = separateResponses(response.responses);
                      
                      return (
                        <>
                          {/* Compulsory Responses */}
                          {Object.keys(compulsory).length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-600 mb-3">
                                Basic Information
                              </h4>
                              <div className="space-y-3">
                                {Object.entries(compulsory).map(([key, value]) => (
                                  <div key={key} className="border-b border-slate-100 pb-3 last:border-b-0">
                                    <div className="font-medium text-slate-700 mb-1">
                                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                    </div>
                                    <div>{renderResponseValue(key, value)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Custom Responses */}
                          {Object.keys(custom).length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-600 mb-3">
                                Custom Form Responses
                              </h4>
                              <div className="space-y-3">
                                {Object.entries(custom).map(([key, value]) => (
                                  <div key={key} className="border-b border-slate-100 pb-3 last:border-b-0">
                                    <div className="font-medium text-slate-700 mb-1">
                                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                    </div>
                                    <div>{renderResponseValue(key, value)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};