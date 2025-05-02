
import React from 'react';
import { format } from 'date-fns';
import { Note as NoteType } from '../types';

interface NoteProps {
  note: NoteType;
}

const Note: React.FC<NoteProps> = ({ note }) => {
  const formattedDate = format(new Date(note.createdAt), 'MMM d, yyyy h:mm a');

  return (
    <div className="border-b pb-4 mb-4 last:border-b-0">
      <div className="text-sm text-muted-foreground mb-1">
        {formattedDate}
      </div>
      <div className="whitespace-pre-wrap">
        {note.content}
      </div>
    </div>
  );
};

export default Note;
