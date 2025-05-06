
import React from 'react';
import { Lead, Note as NoteType, LeadStatus } from '../types';
import Note from './Note';
import AddNoteForm from './AddNoteForm';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { format } from 'date-fns';

interface NoteSectionProps {
  lead: Lead | null;
  notes: NoteType[];
  onAddNote: (leadId: string, content: string) => void;
  onStatusChange: (leadId: string, status: string) => void;
  onEditLead: (leadId: string) => void;
}

const NoteSection: React.FC<NoteSectionProps> = ({ lead, notes, onAddNote, onStatusChange, onEditLead }) => {
  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a lead to view notes
      </div>
    );
  }

  // Sort notes by created date (newest first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleStatusChange = (value: string) => {
    onStatusChange(lead.id, value);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto pl-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{lead.contactName}</h2>
          <Button variant="ghost" size="sm" onClick={() => onEditLead(lead.id)}>
            <Edit size={16} className="mr-1" />
            <span>Edit</span>
          </Button>
        </div>
        <Select value={lead.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Set Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
              <SelectItem value="Warm Lead">Warm Lead</SelectItem>
              <SelectItem value="Hot Lead">Hot Lead</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Lead details section with all captured fields */}
      <div className="mb-4 space-y-2 text-sm border-b pb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Business:</span> {lead.businessName || 'Not specified'}
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span> {lead.email || 'Not specified'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Status:</span> {lead.status}
          </div>
          <div>
            <span className="text-muted-foreground">Closing Date:</span> {formatDate(lead.signupDate)}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-medium mb-3">Notes ({sortedNotes.length})</h3>
        {sortedNotes.length > 0 ? (
          <div>
            {sortedNotes.map(note => (
              <Note key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">No notes yet</div>
        )}
      </div>

      <AddNoteForm leadId={lead.id} onAddNote={onAddNote} />
    </div>
  );
};

export default NoteSection;
