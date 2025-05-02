
import React from 'react';
import { Lead, Note as NoteType } from '../types';
import Note from './Note';
import AddNoteForm from './AddNoteForm';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NoteSectionProps {
  lead: Lead | null;
  notes: NoteType[];
  onAddNote: (leadId: string, content: string) => void;
  onStatusChange: (leadId: string, status: string) => void;
}

const NoteSection: React.FC<NoteSectionProps> = ({ lead, notes, onAddNote, onStatusChange }) => {
  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a lead to view notes
      </div>
    );
  }

  const leadNotes = notes.filter(note => note.leadId === lead.id);

  const handleStatusChange = (value: string) => {
    onStatusChange(lead.id, value);
  };

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto pl-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{lead.contactName}</h2>
        <Select value={lead.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Set Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
              <SelectItem value="Warm">Warm</SelectItem>
              <SelectItem value="Hot">Hot</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-8">
        <h3 className="font-medium mb-3">Notes ({leadNotes.length})</h3>
        {leadNotes.length > 0 ? (
          <div>
            {leadNotes.map(note => (
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
