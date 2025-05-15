
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Lead, LeadStatus, Note } from '../types';
import NoteCard from './Note';
import AddNoteForm from './AddNoteForm';
import { Button } from './ui/button';
import { Edit, PenSquare } from 'lucide-react';
import { Badge } from './ui/badge';

interface NoteSectionProps {
  lead: Lead | null;
  notes: Note[];
  onAddNote: (leadId: string, content: string) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onEditLead: (leadId: string) => void;
}

const NoteSection: React.FC<NoteSectionProps> = ({
  lead,
  notes,
  onAddNote,
  onStatusChange,
  onEditLead,
}) => {
  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
        <PenSquare size={48} strokeWidth={1} />
        <p className="mt-4 text-lg font-medium">Select a lead to view and add notes</p>
      </div>
    );
  }

  // Format dates for display, ensuring they're strings before parsing
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not scheduled';
    
    try {
      // Ensure we have a string before parsing
      const date = parseISO(String(dateString));
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Get status badge color based on lead status
  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'Demo Scheduled':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Hot Lead':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Warm Lead':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'Closed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Lost':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Handler for status badge click
  const handleStatusClick = (status: LeadStatus) => {
    const nextStatus = getNextStatus(status);
    onStatusChange(lead.id, nextStatus);
  };

  // Get next status in the flow
  const getNextStatus = (currentStatus: LeadStatus): LeadStatus => {
    const statusFlow: LeadStatus[] = [
      'Demo Scheduled',
      'Warm Lead',
      'Hot Lead',
      'Closed',
      'Lost',
    ];

    const currentIndex = statusFlow.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusFlow.length;
    return statusFlow[nextIndex];
  };

  // Sort notes by creation date (newest first)
  const sortedNotes = [...notes].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{lead.contactName}</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEditLead(lead.id)}
          className="flex items-center gap-1"
        >
          <Edit size={14} /> Edit
        </Button>
      </div>

      {/* Lead details */}
      <div className="space-y-4 pb-4 border-b">
        <div className="flex flex-wrap gap-2">
          <Badge
            className={`cursor-pointer ${getStatusColor(lead.status)}`}
            variant="outline"
            onClick={() => handleStatusClick(lead.status)}
          >
            {lead.status}
          </Badge>
          <Badge variant="outline" className="bg-gray-50">
            {lead.businessName}
          </Badge>
          {lead.location && (
            <Badge variant="outline" className="bg-gray-50">
              {lead.location}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Demo Date</p>
            <p className="font-medium">{formatDate(lead.demoDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Follow-up</p>
            <p className="font-medium">{formatDate(lead.nextFollowUp)}</p>
          </div>
          <div>
            <p className="text-gray-500">Setup Fee</p>
            <p className="font-medium">${lead.setupFee || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">MRR</p>
            <p className="font-medium">${lead.mrr || 0}/mo</p>
          </div>
        </div>
      </div>

      {/* Note form */}
      <div>
        <AddNoteForm leadId={lead.id} onAddNote={onAddNote} />
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Notes ({sortedNotes.length})</h3>
        {sortedNotes.length > 0 ? (
          <div className="space-y-4">
            {sortedNotes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No notes yet. Add one above.</p>
        )}
      </div>
    </div>
  );
};

export default NoteSection;
